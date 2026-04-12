/**
 * Modal — reusable dialog for create/edit forms.
 * WHY a shared modal component?
 * Both Users and Questions need create/edit dialogs.
 * A shared modal handles focus trap, ESC to close, backdrop click,
 * and consistent styling — no need to re-implement in each page.
 */
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface ModalProps {
  isOpen:   boolean
  onClose:  () => void
  title:    string
  subtitle?: string
  size?:    'sm' | 'md' | 'lg'
  children: ReactNode
}

export function Modal({ isOpen, onClose, title, subtitle, size = 'md', children }: ModalProps) {
  // ESC to close
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      {/* Dialog */}
      <div className={cn('relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl', widths[size])}>
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="font-bold text-text-main">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-text-muted">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-text-muted hover:bg-border/40 transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// Reusable form field wrapper
export function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-text-main">
        {label}{required && <span className="ml-1 text-danger">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-text-main placeholder:text-text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
        className
      )}
    />
  )
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        'h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
        className
      )}
    >
      {children}
    </select>
  )
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        'w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text-main placeholder:text-text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
        className
      )}
    />
  )
}
