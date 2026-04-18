/**
 * AdminOCRPage — Upload PDF → Review extracted questions → Submit to DB.
 *
 * FIX LOG:
 * 1. NEVER set Content-Type manually for multipart uploads — Axios must set
 *    it so the browser can append the boundary string. Manual override breaks
 *    the boundary and causes a 422 / "Upload failed" on the backend.
 * 2. Removed `auto_chapter` field that backend doesn't accept.
 * 3. subject_id must be a string in FormData (Form() parsing), not a number.
 * 4. Added proper error display showing the backend detail message.
 */
import { useState, useRef } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/axios'
import { cn } from '@/lib/cn'
import { Select } from '../components/Modal'

interface Subject { subject_id: number; subject_name: string }
interface Chapter { chapter_id: number; chapter_name: string; subject_id: number }
interface ExtractedQ {
  temp_id: number
  question_text: string
  options: string[] | null
  correct_answer: string | null
  question_type: number
  difficulty: string
  answer_found: boolean
}
interface UploadResponse {
  total_extracted: number
  answers_missing: number
  format_detected: string
  questions: ExtractedQ[]
}

const TYPE_LABELS: Record<number, string> = { 1: 'MCQ', 2: 'Short Answer', 3: 'Fill-in-Blank' }
const DIFF_OPTIONS = ['easy', 'medium', 'hard']

// ── Single editable question card ─────────────────────────────
function ReviewCard({ q, index, onChange, onRemove }: {
  q: ExtractedQ; index: number
  onChange: (updated: ExtractedQ) => void
  onRemove: () => void
}) {
  const [expanded, setExpanded] = useState(!q.answer_found)

  function update(key: keyof ExtractedQ, value: unknown) {
    onChange({ ...q, [key]: value })
  }

  function updateOption(i: number, val: string) {
    const opts = [...(q.options ?? ['', '', '', ''])]
    opts[i] = val
    onChange({ ...q, options: opts })
  }

  const isMCQ = q.question_type === 1
  const missingAnswer = !q.correct_answer?.trim()

  return (
    <div className={cn(
      'rounded-2xl border bg-surface shadow-sm overflow-hidden transition-all',
      missingAnswer ? 'border-warning/50' : 'border-border'
    )}>
      {/* Header — click to expand/collapse */}
      <div
        className="flex cursor-pointer items-start gap-3 p-4"
        onClick={() => setExpanded(e => !e)}
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary mt-0.5">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn('text-sm font-medium text-text-main', !expanded && 'line-clamp-2')}>
            {q.question_text}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <span className={cn(
              'rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize',
              q.difficulty === 'easy'   ? 'border-success/30 bg-success/10 text-success'
              : q.difficulty === 'hard' ? 'border-danger/30 bg-danger/10 text-danger'
              : 'border-warning/30 bg-warning/10 text-warning'
            )}>{q.difficulty}</span>
            <span className="rounded-full bg-border/60 px-2 py-0.5 text-[10px] text-text-muted">
              {TYPE_LABELS[q.question_type]}
            </span>
            {missingAnswer
              ? <span className="flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning">
                  <span className="material-symbols-outlined text-[11px]">warning</span>No answer
                </span>
              : <span className="flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
                  <span className="material-symbols-outlined text-[11px]">check_circle</span>
                  {q.correct_answer?.slice(0, 30)}{(q.correct_answer?.length ?? 0) > 30 ? '…' : ''}
                </span>
            }
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 ml-2">
          <button
            onClick={e => { e.stopPropagation(); onRemove() }}
            className="rounded-lg p-1 text-text-muted hover:bg-danger/10 hover:text-danger transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
          </button>
          <span
            className="material-symbols-outlined text-[20px] text-text-muted transition-transform"
            style={{ transform: expanded ? 'rotate(180deg)' : '' }}
          >
            expand_more
          </span>
        </div>
      </div>

      {/* Expanded edit area */}
      {expanded && (
        <div className="border-t border-border p-4 flex flex-col gap-3" onClick={e => e.stopPropagation()}>
          {/* Question text */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-text-muted">Question text</label>
            <textarea
              rows={3}
              value={q.question_text}
              onChange={e => update('question_text', e.target.value)}
              className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Type + Difficulty */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-text-muted">Type</label>
              <Select value={q.question_type} onChange={e => update('question_type', Number(e.target.value))} className="h-9 text-xs">
                <option value={1}>MCQ</option>
                <option value={2}>Short Answer</option>
                <option value={3}>Fill-in-Blank</option>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-text-muted">Difficulty</label>
              <Select value={q.difficulty} onChange={e => update('difficulty', e.target.value)} className="h-9 text-xs">
                {DIFF_OPTIONS.map(d => (
                  <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                ))}
              </Select>
            </div>
          </div>

          {/* MCQ options */}
          {isMCQ && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-text-muted">
                Options — click ○ to mark correct
              </label>
              <div className="flex flex-col gap-1.5">
                {(['A','B','C','D'] as const).map((key, i) => {
                  const opt = q.options?.[i] ?? ''
                  const isCorrect = opt.trim() !== '' && opt.trim() === q.correct_answer?.trim()
                  return (
                    <div key={key} className={cn(
                      'flex items-center gap-2 rounded-xl border px-3 py-1.5 transition-colors',
                      isCorrect ? 'border-success/40 bg-success/5' : 'border-border'
                    )}>
                      <span className={cn('text-xs font-black w-4', isCorrect ? 'text-success' : 'text-text-muted')}>{key}</span>
                      <input
                        value={opt}
                        onChange={e => updateOption(i, e.target.value)}
                        className="flex-1 bg-transparent text-sm text-text-main outline-none placeholder:text-text-muted/50"
                        placeholder={`Option ${key}`}
                      />
                      <button
                        type="button"
                        onClick={() => update('correct_answer', opt.trim())}
                        disabled={!opt.trim()}
                        className={cn('transition-colors', isCorrect ? 'text-success' : 'text-text-muted hover:text-success')}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {isCorrect ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Non-MCQ correct answer */}
          {!isMCQ && (
            <div>
              <label className={cn('mb-1 block text-xs font-semibold', missingAnswer ? 'text-warning' : 'text-text-muted')}>
                Correct answer {missingAnswer && '⚠ Required'}
              </label>
              <input
                value={q.correct_answer ?? ''}
                onChange={e => update('correct_answer', e.target.value)}
                placeholder="Enter the correct answer"
                className={cn(
                  'h-9 w-full rounded-xl border px-3 text-sm focus:outline-none focus:ring-2',
                  missingAnswer
                    ? 'border-warning bg-warning/5 focus:ring-warning/20'
                    : 'border-border bg-background focus:border-primary focus:ring-primary/20'
                )}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function AdminOCRPage() {
  const [phase, setPhase]           = useState<'upload' | 'review' | 'done'>('upload')
  const [subjectId, setSubjectId]   = useState('')
  const [chapterId, setChapterId]   = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [questions, setQuestions]   = useState<ExtractedQ[]>([])
  const [uploadErr, setUploadErr]   = useState('')
  const [submitCount, setSubmitCount] = useState(0)
  const [formatDetected, setFormatDetected] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ['admin-subjects'],
    queryFn: () => api.get('/admin/subjects').then(r => r.data),
  })
  const { data: allChapters = [] } = useQuery<Chapter[]>({
    queryKey: ['admin-chapters'],
    queryFn: () => api.get('/admin/chapters').then(r => r.data),
  })
  const chapters = allChapters.filter(c => !subjectId || c.subject_id === Number(subjectId))

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      form.append('subject_id', subjectId)          // string — Form() expects string
      if (chapterId) form.append('chapter_id', chapterId)
      // ✅ DO NOT set Content-Type header manually — Axios sets it with boundary
      return api.post<UploadResponse>('/ocr/upload', form).then(r => r.data)
    },
    onSuccess: (data) => {
      setQuestions(data.questions)
      setFormatDetected(data.format_detected)
      setPhase('review')
      setUploadErr('')
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail
      setUploadErr(
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
          ? detail.map((d: any) => d.msg).join('; ')   // FastAPI validation errors
          : 'Upload failed. Check that pdfplumber is installed on the server.'
      )
    },
  })

  const submitMutation = useMutation({
    mutationFn: () =>
      api.post('/ocr/submit', {
        subject_id: Number(subjectId),
        chapter_id: chapterId ? Number(chapterId) : null,
        questions:  questions.filter(q => q.question_text.trim()),
      }).then(r => r.data),
    onSuccess: (data) => { setSubmitCount(data.inserted); setPhase('done') },
    onError: (err: any) => setUploadErr(err?.response?.data?.detail ?? 'Submit failed.'),
  })

  function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadErr('Please upload a PDF file (.pdf extension required).')
      return
    }
    if (!subjectId) {
      setUploadErr('Please select a subject before uploading.')
      return
    }
    setUploadErr('')
    uploadMutation.mutate(file)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const missingCount = questions.filter(q => !q.correct_answer?.trim()).length
  const PHASES = ['upload', 'review', 'done'] as const

  return (
    <div className="flex max-w-[900px] flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-text-main">Upload Question Bank (PDF)</h1>
        <p className="text-sm text-text-muted">
          Supports numbered format (1. Question…) and SAT / College Board format (RW question 1 / Math question 1).
        </p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center">
        {PHASES.map((id, i) => (
          <div key={id} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2">
              <div className={cn(
                'flex size-7 items-center justify-center rounded-full text-xs font-black transition-colors',
                phase === id       ? 'bg-primary text-white'
                : i < PHASES.indexOf(phase) ? 'bg-success text-white'
                : 'bg-border text-text-muted'
              )}>
                {i < PHASES.indexOf(phase)
                  ? <span className="material-symbols-outlined text-[14px]">check</span>
                  : i + 1}
              </div>
              <span className={cn('text-xs font-semibold capitalize', phase === id ? 'text-primary' : 'text-text-muted')}>
                {id === 'upload' ? 'Upload PDF' : id === 'review' ? 'Review & Edit' : 'Done'}
              </span>
            </div>
            {i < 2 && <div className="mx-3 h-px flex-1 bg-border" />}
          </div>
        ))}
      </div>

      {/* ── PHASE 1: Upload ─────────────────────────────────── */}
      {phase === 'upload' && (
        <div className="flex flex-col gap-4">
          {/* Subject + Chapter */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-text-main">
                Subject <span className="text-danger">*</span>
              </label>
              <Select value={subjectId} onChange={e => { setSubjectId(e.target.value); setChapterId('') }}>
                <option value="">Select subject…</option>
                {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>)}
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-text-main">Chapter (optional)</label>
              <Select value={chapterId} onChange={e => setChapterId(e.target.value)} disabled={!subjectId}>
                <option value="">Auto / All chapters</option>
                {chapters.map(c => <option key={c.chapter_id} value={c.chapter_id}>{c.chapter_name}</option>)}
              </Select>
            </div>
          </div>

          {/* Drag-drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={cn(
              'flex cursor-pointer flex-col items-center gap-4 rounded-2xl border-2 border-dashed p-12 text-center transition-all',
              isDragging
                ? 'border-primary bg-primary/5 scale-[1.01]'
                : 'border-border hover:border-primary/50 hover:bg-primary/3'
            )}
          >
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
              <span className="material-symbols-outlined text-3xl text-primary">upload_file</span>
            </div>
            <div>
              <p className="font-bold text-text-main">Drop PDF here or click to browse</p>
              <p className="mt-1 text-sm text-text-muted">Max 20 MB. Digital PDFs work best.</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
            />
          </div>

          {/* Error */}
          {uploadErr && (
            <div className="flex items-start gap-2 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
              <span className="material-symbols-outlined mt-0.5 text-[18px] shrink-0">error</span>
              <p>{uploadErr}</p>
            </div>
          )}

          {/* Loading indicator */}
          {uploadMutation.isPending && (
            <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
              <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
              <div>
                <p className="text-sm font-bold text-primary">Processing PDF…</p>
                <p className="text-xs text-text-muted">Extracting text and classifying difficulty with DistilBERT.</p>
              </div>
            </div>
          )}

          {/* Format tips */}
          <div className="rounded-2xl border border-border bg-background p-4 text-xs text-text-muted space-y-1.5">
            <p className="font-bold uppercase tracking-wider text-text-muted mb-2">Supported formats</p>
            <p><span className="font-semibold text-text-main">Format A — Numbered:</span>  1. Question text / A) option / Answer: C</p>
            <p><span className="font-semibold text-text-main">Format B — SAT/College Board:</span>  "RW question 1" or "Math question 1" headers / "Key C" answers</p>
            <p className="text-warning font-medium">⚠ The PDF must be a digital PDF (not scanned) unless Tesseract is installed on the server.</p>
          </div>
        </div>
      )}

      {/* ── PHASE 2: Review ─────────────────────────────────── */}
      {phase === 'review' && (
        <div className="flex flex-col gap-4">
          {/* Stats bar */}
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">quiz</span>
              <span className="font-bold text-text-main">{questions.length} questions extracted</span>
            </div>
            {formatDetected && (
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                {formatDetected === 'sat' ? 'SAT / College Board format' : 'Numbered format'} detected
              </span>
            )}
            {missingCount > 0 && (
              <div className="flex items-center gap-1.5 text-warning">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                <span className="text-sm font-semibold">{missingCount} missing answers — fill them in</span>
              </div>
            )}
            {missingCount === 0 && (
              <div className="flex items-center gap-1.5 text-success">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span className="text-sm font-semibold">All answers found</span>
              </div>
            )}
            <div className="ml-auto flex gap-2">
              <button
                onClick={() => { setPhase('upload'); setQuestions([]); setUploadErr('') }}
                className="rounded-xl border border-border px-3 py-2 text-xs font-bold text-text-muted hover:bg-border/40 transition-colors"
              >
                ← Start over
              </button>
              <button
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending || questions.length === 0}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                {submitMutation.isPending
                  ? <><span className="material-symbols-outlined animate-spin text-[14px]">progress_activity</span>Submitting…</>
                  : <><span className="material-symbols-outlined text-[14px]">cloud_upload</span>Submit {questions.length} questions</>}
              </button>
            </div>
          </div>

          {uploadErr && (
            <div className="flex items-start gap-2 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
              <span className="material-symbols-outlined mt-0.5 text-[18px] shrink-0">error</span>
              <p>{uploadErr}</p>
            </div>
          )}

          {/* Cards */}
          <div className="flex flex-col gap-3">
            {questions.map((q, i) => (
              <ReviewCard
                key={q.temp_id}
                q={q}
                index={i}
                onChange={updated => setQuestions(prev => prev.map(p => p.temp_id === q.temp_id ? updated : p))}
                onRemove={() => setQuestions(prev => prev.filter(p => p.temp_id !== q.temp_id))}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── PHASE 3: Done ───────────────────────────────────── */}
      {phase === 'done' && (
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-surface py-16 text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-success/10">
            <span className="material-symbols-outlined text-5xl text-success icon-fill">check_circle</span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-text-main">{submitCount} questions added!</h2>
            <p className="mt-2 text-text-muted">They are now live in the question bank.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setPhase('upload'); setQuestions([]); setUploadErr('') }}
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-bold text-text-muted hover:bg-border/40 transition-colors"
            >
              Upload another PDF
            </button>
            <button
              onClick={() => window.location.href = '/admin/questions'}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover transition-colors"
            >
              View question bank →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
