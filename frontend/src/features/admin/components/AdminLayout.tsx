/**
 * AdminLayout — sidebar navigation for the admin section.
 * Uses nested React Router outlets so each admin page renders here.
 * WHY a separate layout and not the main Layout?
 * Admin needs different nav links and an "Admin Mode" banner.
 * Reusing the student Layout would mean conditionally hiding/showing
 * links — messy. A dedicated AdminLayout is clean and independent.
 */
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { useAuth } from '@/context/AuthContext'

const adminNav = [
  { to: '/admin',           icon: 'dashboard',            label: 'Overview',  end: true },
  { to: '/admin/users',     icon: 'group',                label: 'Users' },
  { to: '/admin/questions', icon: 'quiz',                 label: 'Questions' },
  { to: '/admin/subjects',  icon: 'menu_book',            label: 'Subjects & Chapters' },
  { to: '/admin/ocr',       icon: 'upload_file',          label: 'Upload PDF' },
]

export function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="flex w-60 flex-col border-r border-border bg-surface">
        {/* Logo + badge */}
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <span className="material-symbols-outlined text-primary text-[18px]">school</span>
            </div>
            <div>
              <p className="text-sm font-bold text-text-main">SmartSikshya</p>
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">Admin</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-1 p-3 overflow-y-auto">
          {adminNav.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={'end' in link ? link.end : false}
              className={({ isActive }) => cn(
                'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary text-white'
                  : 'text-text-muted hover:bg-border/40 hover:text-text-main'
              )}
            >
              {({ isActive }) => (
                <>
                  <span className={cn('material-symbols-outlined text-[20px]', isActive && 'icon-fill')}>
                    {link.icon}
                  </span>
                  {link.label}
                </>
              )}
            </NavLink>
          ))}

          <div className="my-2 border-t border-border" />

          <NavLink
            to="/dashboard"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-text-muted hover:bg-border/40 hover:text-text-main transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">open_in_new</span>
            Student View
          </NavLink>
        </nav>

        {/* User + logout */}
        <div className="border-t border-border p-3">
          <div className="mb-2 flex items-center gap-2 px-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">
              {user?.full_name?.charAt(0) ?? 'A'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-text-main">{user?.full_name}</p>
              <p className="truncate text-[10px] text-text-muted">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-text-muted hover:bg-danger/5 hover:text-danger transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex shrink-0 items-center justify-between border-b border-border bg-surface px-6 py-3">
          <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 px-3 py-1.5">
            <span className="material-symbols-outlined text-warning text-[16px]">admin_panel_settings</span>
            <span className="text-xs font-bold text-warning">Admin Mode — changes affect all users</span>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
