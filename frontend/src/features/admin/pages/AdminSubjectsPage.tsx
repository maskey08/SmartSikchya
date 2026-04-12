/**
 * AdminSubjectsPage — manage subjects AND chapters in one page.
 * Two-panel layout: subjects list on left, selected subject's chapters on right.
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/axios'
import { cn } from '@/lib/cn'
import { Modal, Field, Input, Select, Textarea } from '../components/Modal'

interface Subject { subject_id: number; subject_name: string; slug: string; description: string; icon: string; color_class: string }
interface Chapter { chapter_id: number; subject_id: number; chapter_name: string; order_num: number; description: string | null; is_locked: boolean; subject_name: string; question_count: number }

const ICON_OPTIONS = ['menu_book','calculate','science','computer','history','language','psychology','sports_soccer']
const COLOR_OPTIONS = [
  { label:'Teal',   value:'bg-primary/10 text-primary' },
  { label:'Purple', value:'bg-purple-100 text-purple-600' },
  { label:'Blue',   value:'bg-blue-100 text-blue-600' },
  { label:'Green',  value:'bg-success/10 text-success' },
  { label:'Orange', value:'bg-orange-100 text-orange-600' },
  { label:'Red',    value:'bg-danger/10 text-danger' },
]

export default function AdminSubjectsPage() {
  const qc = useQueryClient()
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null)
  const [subjModal, setSubjModal]     = useState<'create' | 'edit' | null>(null)
  const [chapModal, setChapModal]     = useState<'create' | 'edit' | null>(null)
  const [editSubj,  setEditSubj]      = useState<Subject | null>(null)
  const [editChap,  setEditChap]      = useState<Chapter | null>(null)
  const [deleteType, setDeleteType]   = useState<'subject' | 'chapter' | null>(null)
  const [deleteId,  setDeleteId]      = useState<number | null>(null)
  const [formErr,   setFormErr]       = useState('')

  // Subject form state
  const [sName, setSName] = useState(''); const [sSlug, setSSlug] = useState('')
  const [sDesc, setSDesc] = useState(''); const [sIcon, setSIcon] = useState('menu_book')
  const [sColor,setSColor]= useState('bg-primary/10 text-primary')

  // Chapter form state
  const [cName, setCName] = useState(''); const [cOrder, setCOrder] = useState('1')
  const [cDesc, setCDesc] = useState(''); const [cLocked, setCLocked] = useState(false)

  const { data: subjects = [] } = useQuery<Subject[]>({ queryKey: ['admin-subjects'], queryFn: () => api.get('/admin/subjects').then(r => r.data) })
  const { data: chapters = [] } = useQuery<Chapter[]>({
    queryKey: ['admin-chapters', selectedSubject],
    queryFn: () => api.get('/admin/chapters', { params: selectedSubject ? { subject_id: selectedSubject } : {} }).then(r => r.data),
  })

  // Subject mutations
  const saveSubj = useMutation({
    mutationFn: (d: { id?: number; body: object }) =>
      d.id ? api.patch(`/admin/subjects/${d.id}`, d.body) : api.post('/admin/subjects', d.body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-subjects'] }); setSubjModal(null); setFormErr('') },
    onError: (e: any) => setFormErr(e?.response?.data?.detail ?? 'Error'),
  })

  // Chapter mutations
  const saveChap = useMutation({
    mutationFn: (d: { id?: number; body: object }) =>
      d.id ? api.patch(`/admin/chapters/${d.id}`, d.body) : api.post('/admin/chapters', d.body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-chapters', selectedSubject] }); setChapModal(null); setFormErr('') },
    onError: (e: any) => setFormErr(e?.response?.data?.detail ?? 'Error'),
  })

  const deleteMut = useMutation({
    mutationFn: () => deleteType === 'subject' ? api.delete(`/admin/subjects/${deleteId}`) : api.delete(`/admin/chapters/${deleteId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-subjects'] })
      qc.invalidateQueries({ queryKey: ['admin-chapters', selectedSubject] })
      if (deleteType === 'subject') setSelectedSubject(null)
      setDeleteType(null); setDeleteId(null)
    },
  })

  function openSubjCreate() {
    setSName(''); setSSlug(''); setSDesc(''); setSIcon('menu_book'); setSColor('bg-primary/10 text-primary')
    setEditSubj(null); setFormErr(''); setSubjModal('create')
  }
  function openSubjEdit(s: Subject) {
    setSName(s.subject_name); setSSlug(s.slug ?? ''); setSDesc(s.description ?? ''); setSIcon(s.icon ?? 'menu_book'); setSColor(s.color_class ?? 'bg-primary/10 text-primary')
    setEditSubj(s); setFormErr(''); setSubjModal('edit')
  }
  function openChapCreate() {
    setCName(''); setCOrder('1'); setCDesc(''); setCLocked(false)
    setEditChap(null); setFormErr(''); setChapModal('create')
  }
  function openChapEdit(c: Chapter) {
    setCName(c.chapter_name); setCOrder(String(c.order_num)); setCDesc(c.description ?? ''); setCLocked(c.is_locked)
    setEditChap(c); setFormErr(''); setChapModal('edit')
  }

  const displayChapters = selectedSubject ? chapters : []

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-black text-text-main">Subjects & Chapters</h1>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
        {/* Subjects panel */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-text-main">Subjects ({subjects.length})</p>
            <button onClick={openSubjCreate}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-hover transition-colors">
              <span className="material-symbols-outlined text-[14px]">add</span>Add
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {subjects.map(s => (
              <div key={s.subject_id}
                onClick={() => setSelectedSubject(selectedSubject === s.subject_id ? null : s.subject_id)}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-all',
                  selectedSubject === s.subject_id ? 'border-primary bg-primary/5' : 'border-border bg-surface hover:border-primary/30'
                )}>
                <div className={cn('flex size-10 items-center justify-center rounded-xl flex-shrink-0', s.color_class ?? 'bg-primary/10 text-primary')}>
                  <span className="material-symbols-outlined text-xl">{s.icon ?? 'book'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-text-main text-sm">{s.subject_name}</p>
                  <p className="text-xs text-text-muted truncate">{s.description ?? 'No description'}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={e => { e.stopPropagation(); openSubjEdit(s) }}
                    className="rounded-lg p-1.5 text-text-muted hover:bg-primary/10 hover:text-primary">
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                  <button onClick={e => { e.stopPropagation(); setDeleteType('subject'); setDeleteId(s.subject_id) }}
                    className="rounded-lg p-1.5 text-text-muted hover:bg-danger/10 hover:text-danger">
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
            {subjects.length === 0 && <p className="py-4 text-center text-sm text-text-muted">No subjects yet.</p>}
          </div>
        </div>

        {/* Chapters panel */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-text-main">
              {selectedSubject
                ? `Chapters in ${subjects.find(s => s.subject_id === selectedSubject)?.subject_name ?? '...'} (${displayChapters.length})`
                : 'Select a subject to manage chapters'}
            </p>
            {selectedSubject && (
              <button onClick={openChapCreate}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-hover transition-colors">
                <span className="material-symbols-outlined text-[14px]">add</span>Add Chapter
              </button>
            )}
          </div>

          {!selectedSubject ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center">
              <span className="material-symbols-outlined text-4xl text-text-muted">menu_book</span>
              <p className="text-sm text-text-muted">Click a subject on the left to see its chapters</p>
            </div>
          ) : displayChapters.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-12 text-center">
              <span className="material-symbols-outlined text-4xl text-text-muted">library_books</span>
              <p className="text-sm text-text-muted">No chapters yet. Add one to get started.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {displayChapters.sort((a,b) => a.order_num - b.order_num).map(ch => (
                <div key={ch.chapter_id} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-border/50 text-xs font-black text-text-muted">
                    {String(ch.order_num).padStart(2,'0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-text-main text-sm">{ch.chapter_name}</p>
                      {ch.is_locked && <span className="material-symbols-outlined text-text-muted text-[14px]">lock</span>}
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                        {ch.question_count} qns
                      </span>
                    </div>
                    {ch.description && <p className="text-xs text-text-muted truncate">{ch.description}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openChapEdit(ch)}
                      className="rounded-lg p-1.5 text-text-muted hover:bg-primary/10 hover:text-primary">
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button onClick={() => { setDeleteType('chapter'); setDeleteId(ch.chapter_id) }}
                      className="rounded-lg p-1.5 text-text-muted hover:bg-danger/10 hover:text-danger">
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Subject modal */}
      <Modal isOpen={subjModal !== null} onClose={() => setSubjModal(null)} title={subjModal === 'edit' ? 'Edit Subject' : 'Add Subject'}>
        <form onSubmit={e => { e.preventDefault(); saveSubj.mutate({ id: editSubj?.subject_id, body: { subject_name: sName, slug: sSlug, description: sDesc, icon: sIcon, color_class: sColor } }) }} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" required><Input value={sName} onChange={e => { setSName(e.target.value); if (!editSubj) setSSlug(e.target.value.toLowerCase().replace(/\s+/g, '-')) }} placeholder="Mathematics" required /></Field>
            <Field label="Slug" required><Input value={sSlug} onChange={e => setSSlug(e.target.value)} placeholder="mathematics" required /></Field>
          </div>
          <Field label="Description"><Textarea value={sDesc} onChange={e => setSDesc(e.target.value)} rows={2} placeholder="Brief description..." /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Icon">
              <Select value={sIcon} onChange={e => setSIcon(e.target.value)}>
                {ICON_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
              </Select>
            </Field>
            <Field label="Color">
              <Select value={sColor} onChange={e => setSColor(e.target.value)}>
                {COLOR_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
            </Field>
          </div>
          {/* Preview */}
          <div className="flex items-center gap-3 rounded-xl bg-background p-3">
            <div className={cn('flex size-10 items-center justify-center rounded-xl', sColor)}>
              <span className="material-symbols-outlined">{sIcon}</span>
            </div>
            <p className="font-bold text-text-main">{sName || 'Subject name'}</p>
          </div>
          {formErr && <p className="text-sm text-danger">{formErr}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => setSubjModal(null)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-bold text-text-muted">Cancel</button>
            <button type="submit" disabled={saveSubj.isPending} className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-white disabled:opacity-50">{saveSubj.isPending ? 'Saving...' : editSubj ? 'Save' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      {/* Chapter modal */}
      <Modal isOpen={chapModal !== null} onClose={() => setChapModal(null)} title={chapModal === 'edit' ? 'Edit Chapter' : 'Add Chapter'}>
        <form onSubmit={e => { e.preventDefault(); saveChap.mutate({ id: editChap?.chapter_id, body: { subject_id: selectedSubject!, chapter_name: cName, order_num: Number(cOrder), description: cDesc, is_locked: cLocked } }) }} className="flex flex-col gap-4">
          <Field label="Chapter name" required><Input value={cName} onChange={e => setCName(e.target.value)} placeholder="Algebra" required /></Field>
          <Field label="Order number"><Input type="number" value={cOrder} onChange={e => setCOrder(e.target.value)} min="1" /></Field>
          <Field label="Description"><Textarea value={cDesc} onChange={e => setCDesc(e.target.value)} rows={2} placeholder="Brief description..." /></Field>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={cLocked} onChange={e => setCLocked(e.target.checked)} className="accent-primary size-4" />
            <span className="text-sm text-text-main">Lock this chapter (students cannot access)</span>
          </label>
          {formErr && <p className="text-sm text-danger">{formErr}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => setChapModal(null)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-bold text-text-muted">Cancel</button>
            <button type="submit" disabled={saveChap.isPending} className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-white disabled:opacity-50">{saveChap.isPending ? 'Saving...' : editChap ? 'Save' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={deleteType !== null} onClose={() => { setDeleteType(null); setDeleteId(null) }} title={`Delete ${deleteType === 'subject' ? 'Subject' : 'Chapter'}?`} size="sm">
        <p className="text-sm text-text-muted mb-5">
          {deleteType === 'subject'
            ? 'This deletes the subject AND all its chapters and questions. This cannot be undone.'
            : 'This deletes the chapter and all its questions. This cannot be undone.'}
        </p>
        <div className="flex gap-3">
          <button onClick={() => { setDeleteType(null); setDeleteId(null) }} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-bold text-text-muted">Cancel</button>
          <button onClick={() => deleteMut.mutate()} disabled={deleteMut.isPending} className="flex-1 rounded-xl bg-danger py-2.5 text-sm font-bold text-white disabled:opacity-50">
            {deleteMut.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
