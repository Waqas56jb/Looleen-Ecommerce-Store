import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, X } from 'lucide-react'
import { useClickOutside, useEscape, useLockBodyScroll } from '@/hooks'
import { useT } from '@/i18n'
import { cn } from '@/utils'
import { Button, IconButton } from './Button'

function useFocusTrap(open: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const panel = ref.current
    const focusables = () => Array.from(panel?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])') ?? [])
    requestAnimationFrame(() => {
      const auto = panel?.querySelector<HTMLElement>('[data-autofocus]')
      ;(auto ?? focusables()[0] ?? panel)?.focus()
    })
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !panel) return
      const items = focusables()
      if (!items.length) return
      if (e.shiftKey && document.activeElement === items[0]) {
        e.preventDefault()
        items[items.length - 1].focus()
      } else if (!e.shiftKey && document.activeElement === items[items.length - 1]) {
        e.preventDefault()
        items[0].focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      prev?.focus?.()
    }
  }, [open])
  return ref
}

/* ---------------- Modal ---------------- */

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function Modal({ open, onClose, title, description, children, footer, size = 'md', className }: ModalProps) {
  const { t } = useT()
  useLockBodyScroll(open)
  useEscape(onClose, open)
  const ref = useFocusTrap(open)
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6" role="presentation">
      <div className="absolute inset-0 animate-fade-in bg-ink/40" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[92dvh] w-full animate-scale-in flex-col rounded-t-xl bg-surface shadow-pop outline-none sm:rounded-lg',
          size === 'sm' && 'sm:max-w-md',
          size === 'md' && 'sm:max-w-lg',
          size === 'lg' && 'sm:max-w-2xl',
          size === 'xl' && 'sm:max-w-4xl',
          className,
        )}
      >
        {title && (
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line-soft px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-ink">{title}</h2>
              {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
            </div>
            <IconButton label={t('common.close')} onClick={onClose} size="sm" className="-me-1.5 -mt-1">
              <X />
            </IconButton>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-line-soft px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

/* ---------------- Drawer ---------------- */

interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  footer?: ReactNode
  side?: 'start' | 'end'
  widthClass?: string
}

export function Drawer({ open, onClose, title, children, footer, side = 'end', widthClass = 'max-w-md' }: DrawerProps) {
  const { t } = useT()
  useLockBodyScroll(open)
  useEscape(onClose, open)
  const ref = useFocusTrap(open)
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[70]" role="presentation">
      <div className="absolute inset-0 animate-fade-in bg-ink/35" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        tabIndex={-1}
        className={cn('absolute inset-y-0 flex w-full flex-col bg-surface shadow-pop outline-none', widthClass, side === 'end' ? 'end-0 animate-slide-in-end' : 'start-0 animate-slide-in-start')}
      >
        {title !== undefined && (
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-line-soft px-5 py-3.5">
            <div className="min-w-0 text-base font-semibold text-ink">{title}</div>
            <IconButton label={t('common.close')} onClick={onClose} size="sm">
              <X />
            </IconButton>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="flex shrink-0 gap-2 border-t border-line-soft px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

/* ---------------- ConfirmDialog ---------------- */

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: ReactNode
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'default'
  children?: ReactNode
}

/** Required before every destructive action (delete, archive, reject, cancel, refund) */
export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel, cancelLabel, tone = 'danger', children }: ConfirmDialogProps) {
  const { t } = useT()
  const [busy, setBusy] = useState(false)
  const run = async () => {
    setBusy(true)
    try {
      await onConfirm()
      onClose()
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal
      open={open}
      onClose={busy ? () => undefined : onClose}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            {cancelLabel ?? t('common.cancel')}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={run} loading={busy} data-autofocus>
            {confirmLabel ?? t('common.confirm')}
          </Button>
        </>
      }
    >
      <div className="flex gap-4 pt-1">
        <span className={cn('grid size-10 shrink-0 place-items-center rounded-full', tone === 'danger' ? 'bg-error-soft text-error' : 'bg-mist text-ink')}>
          <AlertTriangle className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          {description && <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>}
          {children && <div className="mt-3">{children}</div>}
        </div>
      </div>
    </Modal>
  )
}

/* ---------------- Dropdown menu ---------------- */

export interface MenuItem {
  label: ReactNode
  icon?: ReactNode
  onClick?: () => void
  href?: string
  danger?: boolean
  disabled?: boolean
  divider?: boolean
}

interface DropdownProps {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode
  items?: MenuItem[]
  children?: ReactNode
  align?: 'start' | 'end'
  widthClass?: string
  className?: string
}

export function Dropdown({ trigger, items, children, align = 'end', widthClass = 'w-52', className }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false), open)
  useEscape(() => setOpen(false), open)
  return (
    <div ref={ref} className={cn('relative inline-block', className)}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div role="menu" className={cn('absolute top-[calc(100%+6px)] z-50 animate-slide-down overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-pop', widthClass, align === 'end' ? 'end-0' : 'start-0')}>
          {children}
          {items?.map((it, i) =>
            it.divider ? (
              <div key={i} className="my-1 border-t border-line-soft" role="separator" />
            ) : (
              <button
                key={i}
                type="button"
                role="menuitem"
                disabled={it.disabled}
                onClick={() => {
                  setOpen(false)
                  it.onClick?.()
                }}
                className={cn('flex w-full items-center gap-2.5 px-3 py-2 text-start text-[13px] transition-colors disabled:opacity-40 [&>svg]:size-4', it.danger ? 'text-error hover:bg-error-soft' : 'text-ink hover:bg-mist')}
              >
                {it.icon}
                <span className="flex-1">{it.label}</span>
              </button>
            ),
          )}
        </div>
      )}
    </div>
  )
}

/* ---------------- Tooltip (CSS-only, hover + focus) ---------------- */

export function Tooltip({ content, children, side = 'top' }: { content: ReactNode; children: ReactNode; side?: 'top' | 'bottom' }) {
  return (
    <span className="group/tt relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute start-1/2 z-50 -translate-x-1/2 rounded-md bg-ink px-2 py-1 text-[11px] whitespace-nowrap text-white opacity-0 shadow-pop transition-opacity duration-150 group-focus-within/tt:opacity-100 group-hover/tt:opacity-100 rtl:translate-x-1/2',
          side === 'top' ? 'bottom-[calc(100%+6px)]' : 'top-[calc(100%+6px)]',
        )}
      >
        {content}
      </span>
    </span>
  )
}
