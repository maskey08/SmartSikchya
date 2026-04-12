import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/axios'
import { cn } from '@/lib/cn'
import { Modal, Field, Input, Select } from '../components/Modal'

interface AdminUser {
  user_id: number; full_name: string | null; email: string; role: string
  total_xp: number; level: number; session_count: number; current_streak: number
  created_at: string | null; avatar_url: string | null
}

const adminUsersApi = {
  list:   (search?: string, role?: string) =>
    api.get<AdminUser[]>('/admin/users', { params: { search, role } }).then(r => r.data),
  create: (data: object)          => api.post('/admin/users', data),
  update: (id: number, data: object) => api.patch(`/admin/users/${id}`, data),
  delete: (id: number)            => api.delete(`/admin/users/${id}`),
}

// ── Create/Edit form ──────────────────────────────────────────
interface UserFormProps {
  initial?: Partial<AdminUser> | null
  onClose: () => void
  onSave:  (data: object) => void
  isSaving: boolean
  error:   string
}
function UserForm({ initial, onClose, onSave, isSaving, error }: UserFormProps) {
  const [fullName, setFullName] = useState(initial?.full_name ?? '')
  const [email,    setEmail]    = useState(initial?.email ?? '')
  const [role,     setRole]     = useState(initial?.role ?? 'student')
  const [password, setPassword] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data: Record<string, string> = { full_name: fullName, role }
    if (!initial) {
      data.email    = email
      data.password = password
    } else if (password) {
      data.password = password
    }
    onSave(data)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Full name" required>
        <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Doe" required />
      </Field>

      {!initial && (
        <Field label="Email" required>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="student@example.com" required />
        </Field>
      )}

      <Field label={initial ? 'New password (leave blank to keep)' : 'Password'} required={!initial}>
        <Input type="password" value={password} onChange={e => setPassword(e.target.value)}
          placeholder={initial ? 'Leave blank to keep current' : 'Min. 8 characters'}
          minLength={password ? 8 : undefined} required={!initial} />
      </Field>

      <Field label="Role" required>
        <Select value={role} onChange={e => setRole(e.target.value)}>
          <option value="student">Student</option>
          <option value="admin">Admin</option>
        </Select>
      </Field>

      {error && (
        <div className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose}
          className="flex-1 rounded-xl border border-border py-2.5 text-sm font-bold text-text-muted hover:bg-border/40 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={isSaving}
          className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-50 transition-colors">
          {isSaving ? 'Saving...' : initial ? 'Save Changes' : 'Create User'}
        </button>
      </div>
    </form>
  )
}

// ── Main page ──────────────────────────────────────────────────
export default function AdminUsersPage() {
  const qc = useQueryClient()
  const [search,    setSearch]    = useState('')
  const [roleFilter,setRoleFilter]= useState('')
  const [modal,     setModal]     = useState<'create' | 'edit' | null>(null)
  const [editUser,  setEditUser]  = useState<AdminUser | null>(null)
  const [formError, setFormError] = useState('')
  const [deleteId,  setDeleteId]  = useState<number | null>(null)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter],
    queryFn: () => adminUsersApi.list(search || undefined, roleFilter || undefined),
  })

  const saveMutation = useMutation({
    mutationFn: (data: { id?: number; body: object }) =>
      data.id ? adminUsersApi.update(data.id, data.body) : adminUsersApi.create(data.body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); setModal(null); setFormError('') },
    onError: (err: any) => setFormError(err?.response?.data?.detail ?? 'Error saving user.'),
  })

  const deleteMutation = useMutation({
    mutationFn: adminUsersApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); setDeleteId(null) },
  })

  function openEdit(u: AdminUser) { setEditUser(u); setFormError(''); setModal('edit') }
  function openCreate() { setEditUser(null); setFormError(''); setModal('create') }

  const ROLE_COLOR: Record<string, string> = {
    admin:   'bg-primary/10 text-primary',
    student: 'bg-border text-text-muted',
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-text-main">Users</h1>
          <p className="text-sm text-text-muted">{users.length} accounts</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-hover transition-colors">
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute inset-y-0 left-3 flex items-center text-text-muted pointer-events-none">
            <span className="material-symbols-outlined text-[18px]">search</span>
          </span>
          <input type="text" placeholder="Search name or email..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-4 text-sm focus:border-primary focus:outline-none" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-main focus:border-primary focus:outline-none">
          <option value="">All roles</option>
          <option value="student">Students</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-text-muted">Loading...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background text-xs uppercase tracking-wider text-text-muted">
                  <th className="px-5 py-3 text-left">User</th>
                  <th className="px-5 py-3 text-left">Role</th>
                  <th className="px-5 py-3 text-left">XP / Level</th>
                  <th className="px-5 py-3 text-left">Sessions</th>
                  <th className="px-5 py-3 text-left">Streak</th>
                  <th className="px-5 py-3 text-left">Joined</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map(u => (
                  <tr key={u.user_id} className="hover:bg-background transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} className="size-8 rounded-full object-cover" alt="" />
                        ) : (
                          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">
                            {u.full_name?.charAt(0).toUpperCase() ?? '?'}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-text-main">{u.full_name ?? '—'}</p>
                          <p className="text-xs text-text-muted">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn('rounded-full px-2.5 py-1 text-xs font-bold capitalize', ROLE_COLOR[u.role] ?? 'bg-border text-text-muted')}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-bold text-warning">{u.total_xp}</span>
                      <span className="ml-1.5 text-xs text-text-muted">Lv.{u.level}</span>
                    </td>
                    <td className="px-5 py-3 text-text-muted">{u.session_count}</td>
                    <td className="px-5 py-3">
                      {u.current_streak > 0 ? (
                        <span className="flex items-center gap-1 text-warning font-bold">
                          <span className="material-symbols-outlined text-[14px] icon-fill">local_fire_department</span>
                          {u.current_streak}d
                        </span>
                      ) : <span className="text-text-muted">—</span>}
                    </td>
                    <td className="px-5 py-3 text-xs text-text-muted">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(u)} title="Edit"
                          className="rounded-lg p-1.5 text-text-muted hover:bg-primary/10 hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onClick={() => setDeleteId(u.user_id)} title="Delete"
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
      </div>

      {/* Create modal */}
      <Modal isOpen={modal === 'create'} onClose={() => setModal(null)} title="Add New User" subtitle="Create a student or admin account">
        <UserForm onClose={() => setModal(null)} onSave={body => saveMutation.mutate({ body })}
          isSaving={saveMutation.isPending} error={formError} />
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={modal === 'edit'} onClose={() => setModal(null)} title="Edit User" subtitle={editUser?.email}>
        <UserForm initial={editUser} onClose={() => setModal(null)}
          onSave={body => saveMutation.mutate({ id: editUser!.user_id, body })}
          isSaving={saveMutation.isPending} error={formError} />
      </Modal>

      {/* Delete confirm modal */}
      <Modal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} title="Delete User?" size="sm">
        <p className="text-sm text-text-muted mb-5">
          This permanently deletes the account and all their sessions, XP, and progress. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)}
            className="flex-1 rounded-xl border border-border py-2.5 text-sm font-bold text-text-muted hover:bg-border/40">
            Cancel
          </button>
          <button onClick={() => deleteMutation.mutate(deleteId!)} disabled={deleteMutation.isPending}
            className="flex-1 rounded-xl bg-danger py-2.5 text-sm font-bold text-white hover:bg-danger/90 disabled:opacity-50">
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
