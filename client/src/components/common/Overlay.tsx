import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useEscape, useLockBodyScroll } from '@/hooks'
import { useT } from '@/i18n'
import { cn } from '@/utils'
import { IconButton } from './Button'

/** Moves focus into the panel on open and restores it on close */
function useFocusTrap(open: boolean) {
  const panelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    const focusables = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])') ?? [])
    requestAnimationFrame(() => (focusables()[0] ?? panel)?.focus())
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !panel) return
      const items = focusables()
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      prev?.focus?.()
    }
  }, [open])
  return panelRef
}

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  hideClose?: boolean
}

export function Modal({ open, onClose, title, children, size = 'md', className, hideClose }: ModalProps) {
  const { t } = useT()
  useLockBodyScroll(open)
  useEscape(onClose, open)
  const panelRef = useFocusTrap(open)
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6" role="presentation">
      <div className="absolute inset-0 animate-fade-in bg-ink/45 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        tabIndex={-1}
        className={cn(
          'relative max-h-[92dvh] w-full animate-slide-up overflow-y-auto rounded-t-[14px] bg-ivory shadow-lift outline-none sm:animate-scale-in sm:rounded-xs',
          size === 'sm' && 'sm:max-w-md',
          size === 'md' && 'sm:max-w-xl',
          size === 'lg' && 'sm:max-w-3xl',
          size === 'xl' && 'sm:max-w-5xl',
          className,
        )}
      >
        {(title || !hideClose) && (
          <div className={cn('sticky top-0 z-10 flex items-center justify-between gap-4 bg-ivory/95 px-5 pt-5 pb-3 backdrop-blur sm:px-7', !title && 'absolute end-0 bg-transparent')}>
            {title && <h2 className="font-serif text-2xl font-medium tracking-[-0.02em]">{title}</h2>}
            {!hideClose && (
              <IconButton label={t('common.close')} onClick={onClose} size="sm" variant="solid">
                <X className="size-4" />
              </IconButton>
            )}
          </div>
        )}
        <div className={cn('px-5 pb-6 sm:px-7 sm:pb-7', !title && 'pt-5')}>{children}</div>
      </div>
    </div>,
    document.body,
  )
}

interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  /** Inline edge the drawer slides from (mirrors automatically in RTL) */
  side?: 'start' | 'end' | 'bottom'
  children: ReactNode
  footer?: ReactNode
  widthClass?: string
  className?: string
}

export function Drawer({ open, onClose, title, side = 'end', children, footer, widthClass = 'sm:max-w-md', className }: DrawerProps) {
  const { t } = useT()
  useLockBodyScroll(open)
  useEscape(onClose, open)
  const panelRef = useFocusTrap(open)
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[70]" role="presentation">
      <div className="absolute inset-0 animate-fade-in bg-ink/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        tabIndex={-1}
        className={cn(
          'absolute flex flex-col bg-ivory shadow-lift outline-none',
          side === 'end' && cn('inset-y-0 end-0 w-full animate-slide-in-end', widthClass),
          side === 'start' && cn('inset-y-0 start-0 w-[88%] max-w-sm animate-slide-in-start'),
          side === 'bottom' && 'inset-x-0 bottom-0 max-h-[88dvh] animate-slide-up rounded-t-[14px]',
          className,
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div className="min-w-0 font-serif text-2xl font-medium tracking-[-0.02em]">{title}</div>
          <IconButton label={t('common.close')} onClick={onClose} size="sm">
            <X className="size-5" />
          </IconButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {footer && <div className="shrink-0 border-t border-line bg-white/70 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
