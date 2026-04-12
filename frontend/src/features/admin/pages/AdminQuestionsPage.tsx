/**
 * AdminQuestionsPage — full CRUD with filters, search, pagination.
 * Handles MCQ (4 options), FIB, and Short Answer types.
 */
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/axios'
import { cn } from '@/lib/cn'
import { Modal, Field, Input, Select, Textarea } from '../components/Modal'

interface Subject  { subject_id: number; subject_name: string }
interface Chapter  { chapter_id: number; chapter_name: string; subject_id: number; subject_name: string; question_count: number }
interface Question {
  question_id: number; subject_id: number; chapter_id: number
  subject_name: string; chapter_name: string
  question_text: string; question_type: number
  options: string[] | null; correct_answer: string | null; difficulty: string
}
interface QuestionsResponse { total: number; page: number; page_size: number; questions: Question[] }

const TYPE_LABELS: Record<number, string> = { 1: 'MCQ', 2: 'Short Answer', 3: 'Fill-in-Blank' }
const DIFF_COLOR: Record<string, string>  = {
  easy:   'bg-success/10 text-success border-success/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  hard:   'bg-danger/10 text-danger border-danger/20',
}

// ── Question Form ──────────────────────────────────────────────
function QuestionForm({ initial, subjects, chapters, onClose, onSave, isSaving, error }: {
  initial?: Question | null
  subjects: Subject[]; chapters: Chapter[]
  onClose: () => void; onSave: (data: object) => void
  isSaving: boolean; error: string
}) {
  const [subjectId,    setSubjectId]    = useState(initial?.subject_id?.toString() ?? '')
  const [chapterId,    setChapterId]    = useState(initial?.chapter_id?.toString() ?? '')
  const [questionText, setQuestionText] = useState(initial?.question_text ?? '')
  const [questionType, setQuestionType] = useState(initial?.question_type?.toString() ?? '1')
  const [options,      setOptions]      = useState<string[]>(initial?.options ?? ['', '', '', ''])
  const [correctAnswer,setCorrectAnswer]= useState(initial?.correct_answer ?? '')
  const [difficulty,   setDifficulty]   = useState(initial?.difficulty ?? 'medium')

  const filteredChapters = chapters.filter(c => c.subject_id === Number(subjectId))
  const isMCQ = questionType === '1'

  function handleOptionChange(i: number, val: string) {
    const next = [...options]; next[i] = val; setOptions(next)
  }

  // When type changes to MCQ, ensure 4 options
  useEffect(() => {
    if (questionType === '1' && options.length < 4) {
      setOptions([...options, ...Array(4 - options.length).fill('')])
    }
  }, [questionType])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data: Record<string, unknown> = {
      subject_id: Number(subjectId), chapter_id: Number(chapterId),
      question_text: questionText, question_type: Number(questionType),
      correct_answer: correctAnswer, difficulty,
      options: isMCQ ? options.filter(o => o.trim()) : null,
    }
    onSave(data)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Subject + Chapter */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Subject" required>
          <Select value={subjectId} onChange={e => { setSubjectId(e.target.value); setChapterId('') }} required>
            <option value="">Select subject</option>
            {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>)}
          </Select>
        </Field>
        <Field label="Chapter" required>
          <Select value={chapterId} onChange={e => setChapterId(e.target.value)} required disabled={!subjectId}>
            <option value="">Select chapter</option>
            {filteredChapters.map(c => <option key={c.chapter_id} value={c.chapter_id}>{c.chapter_name}</option>)}
          </Select>
        </Field>
      </div>

      {/* Type + Difficulty */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Question type" required>
          <Select value={questionType} onChange={e => setQuestionType(e.target.value)}>
            <option value="1">Multiple Choice (MCQ)</option>
            <option value="2">Short Answer</option>
            <option value="3">Fill in the Blank</option>
          </Select>
        </Field>
        <Field label="Difficulty" required>
          <Select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </Select>
        </Field>
      </div>

      {/* Question text */}
      <Field label="Question text" required>
        <Textarea value={questionText} onChange={e => setQuestionText(e.target.value)}
          placeholder="Enter the question..." rows={3} required />
      </Field>

      {/* MCQ options */}
      {isMCQ && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-text-main">Options <span className="text-danger">*</span></label>
          {options.slice(0, 4).map((opt, i) => {
            const key = ['A', 'B', 'C', 'D'][i]
            const isCorrect = opt.trim() === correctAnswer.trim() && opt.trim() !== ''
            return (
              <div key={i} className={cn('flex items-center gap-2 rounded-xl border p-2 transition-all',
                isCorrect ? 'border-success/40 bg-success/5' : 'border-border')}>
                <span className={cn('flex size-7 items-center justify-center rounded-lg text-xs font-black',
                  isCorrect ? 'bg-success text-white' : 'bg-border/50 text-text-muted')}>
                  {key}
                </span>
                <Input value={opt} onChange={e => { handleOptionChange(i, e.target.value); if (correctAnswer === options[i]) setCorrectAnswer(e.target.value) }}
                  placeholder={`Option ${key}`} className="flex-1 border-0 bg-transparent focus:ring-0 px-0" required />
                <button type="button" onClick={() => setCorrectAnswer(opt.trim())} disabled={!opt.trim()}
                  title="Mark as correct answer"
                  className={cn('rounded-lg p-1.5 text-xs transition-colors',
                    isCorrect ? 'bg-success/10 text-success' : 'text-text-muted hover:bg-border/40')}>
                  <span className="material-symbols-outlined text-[16px]">
                    {isCorrect ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                </button>
              </div>
            )
          })}
          {!correctAnswer && <p className="text-xs text-warning">Click the circle to mark which option is correct.</p>}
        </div>
      )}

      {/* Non-MCQ answer */}
      {!isMCQ && (
        <Field label="Correct answer" required>
          <Input value={correctAnswer} onChange={e => setCorrectAnswer(e.target.value)}
            placeholder={questionType === '3' ? 'The exact word/phrase expected' : 'Model answer'} required />
        </Field>
      )}

      {error && (
        <div className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>
      )}

      <div className="flex gap-3 pt-2 border-t border-border">
        <button type="button" onClick={onClose}
          className="flex-1 rounded-xl border border-border py-2.5 text-sm font-bold text-text-muted hover:bg-border/40">
          Cancel
        </button>
        <button type="submit" disabled={isSaving || (isMCQ && !correctAnswer)}
          className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-50">
          {isSaving ? 'Saving...' : initial ? 'Save Changes' : 'Add Question'}
        </button>
      </div>
    </form>
  )
}

// ── Main page ──────────────────────────────────────────────────
export default function AdminQuestionsPage() {
  const qc = useQueryClient()

  // Filters
  const [search,    setSearch]    = useState('')
  const [subjFilter,setSubjFilter]= useState('')
  const [chapFilter,setChapFilter]= useState('')
  const [diffFilter,setDiffFilter]= useState('')
  const [typeFilter,setTypeFilter]= useState('')
  const [page,      setPage]      = useState(1)
  const PAGE_SIZE = 20

  // Modal
  const [modal,     setModal]     = useState<'create' | 'edit' | null>(null)
  const [editQ,     setEditQ]     = useState<Question | null>(null)
  const [deleteId,  setDeleteId]  = useState<number | null>(null)
  const [formError, setFormError] = useState('')

  // Data
  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ['admin-subjects'],
    queryFn: () => api.get('/admin/subjects').then(r => r.data),
  })
  const { data: allChapters = [] } = useQuery<Chapter[]>({
    queryKey: ['admin-chapters'],
    queryFn: () => api.get('/admin/chapters').then(r => r.data),
  })
  const chaptersForFilter = allChapters.filter(c => !subjFilter || c.subject_id === Number(subjFilter))

  const { data, isLoading, isFetching } = useQuery<QuestionsResponse>({
    queryKey: ['admin-questions', search, subjFilter, chapFilter, diffFilter, typeFilter, page],
    queryFn: () => api.get('/admin/questions', { params: {
      search: search || undefined, subject_id: subjFilter || undefined,
      chapter_id: chapFilter || undefined, difficulty: diffFilter || undefined,
      question_type: typeFilter || undefined, page, page_size: PAGE_SIZE,
    }}).then(r => r.data),
    placeholderData: prev => prev,
  })

  const questions = data?.questions ?? []
  const total     = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const saveMutation = useMutation({
    mutationFn: (d: { id?: number; body: object }) =>
      d.id ? api.patch(`/admin/questions/${d.id}`, d.body) : api.post('/admin/questions', d.body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-questions'] }); setModal(null); setFormError('') },
    onError: (err: any) => setFormError(err?.response?.data?.detail ?? 'Error saving question.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/questions/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-questions'] }); setDeleteId(null) },
  })

  function clearFilters() { setSearch(''); setSubjFilter(''); setChapFilter(''); setDiffFilter(''); setTypeFilter(''); setPage(1) }

  const hasFilters = search || subjFilter || chapFilter || diffFilter || typeFilter

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-text-main">Questions</h1>
          <p className="text-sm text-text-muted">{total} questions total</p>
        </div>
        <button onClick={() => { setEditQ(null); setFormError(''); setModal('create') }}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-hover transition-colors">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Question
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
        {/* Search bar */}
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-text-muted">
            <span className="material-symbols-outlined text-[18px]">search</span>
          </span>
          <input type="text" placeholder="Search question text..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap gap-2">
          <select value={subjFilter} onChange={e => { setSubjFilter(e.target.value); setChapFilter(''); setPage(1) }}
            className="h-9 rounded-xl border border-border bg-background px-3 text-xs text-text-main focus:border-primary focus:outline-none">
            <option value="">All subjects</option>
            {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>)}
          </select>

          <select value={chapFilter} onChange={e => { setChapFilter(e.target.value); setPage(1) }}
            disabled={!subjFilter} className="h-9 rounded-xl border border-border bg-background px-3 text-xs text-text-main focus:border-primary focus:outline-none disabled:opacity-50">
            <option value="">All chapters</option>
            {chaptersForFilter.map(c => <option key={c.chapter_id} value={c.chapter_id}>{c.chapter_name}</option>)}
          </select>

          <select value={diffFilter} onChange={e => { setDiffFilter(e.target.value); setPage(1) }}
            className="h-9 rounded-xl border border-border bg-background px-3 text-xs text-text-main focus:border-primary focus:outline-none">
            <option value="">All difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
            className="h-9 rounded-xl border border-border bg-background px-3 text-xs text-text-main focus:border-primary focus:outline-none">
            <option value="">All types</option>
            <option value="1">MCQ</option>
            <option value="2">Short Answer</option>
            <option value="3">Fill-in-Blank</option>
          </select>

          {hasFilters && (
            <button onClick={clearFilters}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-danger/30 px-3 text-xs font-semibold text-danger hover:bg-danger/5 transition-colors">
              <span className="material-symbols-outlined text-[14px]">close</span>
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className={cn('rounded-2xl border border-border bg-surface shadow-sm overflow-hidden transition-opacity', isFetching && 'opacity-70')}>
        {isLoading ? (
          <div className="p-8 text-center text-text-muted">Loading...</div>
        ) : questions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-10 text-center">
            <span className="material-symbols-outlined text-4xl text-text-muted">quiz</span>
            <p className="font-semibold text-text-main">No questions found</p>
            <p className="text-sm text-text-muted">
              {hasFilters ? 'Try clearing some filters' : 'Add your first question to get started'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background text-xs uppercase tracking-wider text-text-muted">
                  <th className="px-5 py-3 text-left w-8">#</th>
                  <th className="px-5 py-3 text-left">Question</th>
                  <th className="px-5 py-3 text-left">Subject / Chapter</th>
                  <th className="px-5 py-3 text-left">Type</th>
                  <th className="px-5 py-3 text-left">Difficulty</th>
                  <th className="px-5 py-3 text-left">Answer</th>
                  <th className="px-5 py-3 text-left w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {questions.map(q => (
                  <tr key={q.question_id} className="hover:bg-background transition-colors group">
                    <td className="px-5 py-3 text-xs text-text-muted">{q.question_id}</td>
                    <td className="px-5 py-3 max-w-xs">
                      <p className="line-clamp-2 font-medium text-text-main">{q.question_text}</p>
                      {q.options && (
                        <p className="mt-0.5 text-xs text-text-muted line-clamp-1">
                          {q.options.slice(0,2).join(' · ')}{q.options.length > 2 ? ` +${q.options.length - 2}` : ''}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-xs font-semibold text-text-main">{q.subject_name}</p>
                      <p className="text-xs text-text-muted">{q.chapter_name}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-border/50 px-2 py-0.5 text-xs font-medium text-text-muted">
                        {TYPE_LABELS[q.question_type] ?? 'MCQ'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn('rounded-full border px-2 py-0.5 text-xs font-semibold capitalize', DIFF_COLOR[q.difficulty])}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="px-5 py-3 max-w-[160px]">
                      <p className="truncate text-xs font-semibold text-success">{q.correct_answer ?? '—'}</p>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditQ(q); setFormError(''); setModal('edit') }} title="Edit"
                          className="rounded-lg p-1.5 text-text-muted hover:bg-primary/10 hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onClick={() => setDeleteId(q.question_id)} title="Delete"
                          className="rounded-lg p-1.5 text-text-muted hover:bg-danger/10 hover:text-danger transition-colors">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-5 py-3">
            <p className="text-xs text-text-muted">
              Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="flex size-8 items-center justify-center rounded-lg border border-border text-text-muted hover:bg-border/40 disabled:opacity-40">
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <span className="text-xs font-bold text-text-main">Page {page} of {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                className="flex size-8 items-center justify-center rounded-lg border border-border text-text-muted hover:bg-border/40 disabled:opacity-40">
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit modal */}
      <Modal isOpen={modal !== null} onClose={() => setModal(null)} title={modal === 'edit' ? 'Edit Question' : 'Add New Question'} size="lg">
        <QuestionForm initial={editQ} subjects={subjects} chapters={allChapters}
          onClose={() => setModal(null)}
          onSave={body => saveMutation.mutate({ id: editQ?.question_id, body })}
          isSaving={saveMutation.isPending} error={formError} />
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} title="Delete Question?" size="sm">
        <p className="text-sm text-text-muted mb-5">
          This permanently deletes the question and all associated session responses. Cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)}
            className="flex-1 rounded-xl border border-border py-2.5 text-sm font-bold text-text-muted hover:bg-border/40">Cancel</button>
          <button onClick={() => deleteMutation.mutate(deleteId!)} disabled={deleteMutation.isPending}
            className="flex-1 rounded-xl bg-danger py-2.5 text-sm font-bold text-white hover:bg-danger/90 disabled:opacity-50">
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
