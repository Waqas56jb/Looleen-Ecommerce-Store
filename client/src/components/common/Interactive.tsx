import { useId, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react'
import { useCountdown } from '@/hooks'
import { useT } from '@/i18n'
import { cn } from '@/utils'

/* ---------------- Tabs ---------------- */

export function Tabs({ tabs, className }: { tabs: { id: string; label: ReactNode; content: ReactNode }[]; className?: string }) {
  const [active, setActive] = useState(tabs[0]?.id)
  const base = useId()
  return (
    <div className={className}>
      <div role="tablist" className="no-scrollbar flex gap-6 overflow-x-auto border-b border-line sm:gap-10">
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            role="tab"
            id={`${base}-tab-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls={`${base}-panel-${tab.id}`}
            tabIndex={active === tab.id ? 0 : -1}
            onClick={() => setActive(tab.id)}
            onKeyDown={(e) => {
              const dir = (e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0) * (document.dir === 'rtl' ? -1 : 1)
              if (dir) setActive(tabs[(i + dir + tabs.length) % tabs.length].id)
            }}
            className={cn(
              '-mb-px shrink-0 border-b-2 pb-3 text-sm font-medium tracking-wide transition-colors',
              active === tab.id ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${base}-panel-${tab.id}`}
          aria-labelledby={`${base}-tab-${tab.id}`}
          hidden={active !== tab.id}
          className="animate-fade-in pt-6"
        >
          {tab.content}
        </div>
      ))}
    </div>
  )
}

/* ---------------- Accordion ---------------- */

export function AccordionItem({ title, children, defaultOpen, className }: { title: ReactNode; children: ReactNode; defaultOpen?: boolean; className?: string }) {
  const [open, setOpen] = useState(!!defaultOpen)
  const id = useId()
  return (
    <div className={cn('border-b border-line', className)}>
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-4 py-5 text-start text-[15px] font-medium text-ink"
        >
          <span>{title}</span>
          <ChevronDown className={cn('size-4 shrink-0 text-muted transition-transform duration-300', open && 'rotate-180')} aria-hidden />
        </button>
      </h3>
      <div id={id} className={cn('grid transition-[grid-template-rows] duration-300 ease-out', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
        <div className="overflow-hidden">
          <div className="pb-5 text-[15px] leading-relaxed text-muted">{children}</div>
        </div>
      </div>
    </div>
  )
}

export function Accordion({ items, className }: { items: { title: ReactNode; content: ReactNode }[]; className?: string }) {
  return (
    <div className={cn('border-t border-line', className)}>
      {items.map((item, i) => (
        <AccordionItem key={i} title={item.title}>
          {item.content}
        </AccordionItem>
      ))}
    </div>
  )
}

/* ---------------- QuantitySelector ---------------- */

export function QuantitySelector({ value, onChange, min = 1, max = 10, size = 'md' }: { value: number; onChange: (v: number) => void; min?: number; max?: number; size?: 'sm' | 'md' }) {
  const { t } = useT()
  return (
    <div className={cn('inline-flex items-center rounded-full border border-line bg-white', size === 'sm' ? 'h-9' : 'h-12')} role="group" aria-label={t('common.quantity')}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className={cn('grid h-full place-items-center rounded-full text-ink transition-colors hover:bg-blush/60 disabled:opacity-30', size === 'sm' ? 'w-9' : 'w-12')}
      >
        <Minus className="size-3.5" />
      </button>
      <span className={cn('text-center text-sm font-semibold tabular-nums', size === 'sm' ? 'w-6' : 'w-8')} aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
        className={cn('grid h-full place-items-center rounded-full text-ink transition-colors hover:bg-blush/60 disabled:opacity-30', size === 'sm' ? 'w-9' : 'w-12')}
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  )
}

/* ---------------- Pagination ---------------- */

export function Pagination({ page, totalPages, onChange, className }: { page: number; totalPages: number; onChange: (p: number) => void; className?: string }) {
  const { t } = useT()
  if (totalPages <= 1) return null
  const pages: (number | '…')[] = []
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) pages.push(p)
    else if (pages[pages.length - 1] !== '…') pages.push('…')
  }
  const btn = 'grid size-10 place-items-center rounded-full text-sm transition-colors'
  return (
    <nav aria-label="Pagination" className={cn('flex items-center justify-center gap-1.5', className)}>
      <button type="button" className={cn(btn, 'hover:bg-blush disabled:opacity-30')} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label={t('common.previous')}>
        <ChevronLeft className="size-4 rtl:-scale-x-100" />
      </button>
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="px-1 text-muted">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            aria-label={t('common.page', { page: p })}
            className={cn(btn, p === page ? 'bg-ink text-ivory' : 'hover:bg-blush')}
          >
            {p}
          </button>
        ),
      )}
      <button type="button" className={cn(btn, 'hover:bg-blush disabled:opacity-30')} disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label={t('common.next')}>
        <ChevronRight className="size-4 rtl:-scale-x-100" />
      </button>
    </nav>
  )
}

/* ---------------- Countdown ---------------- */

export function Countdown({ to, tone = 'dark', onExpiredLabel, className }: { to?: string; tone?: 'dark' | 'light'; onExpiredLabel?: string; className?: string }) {
  const { days, hours, minutes, seconds, expired } = useCountdown(to)
  const { lang } = useT()
  if (expired) return <span className={cn('text-sm font-medium', tone === 'light' ? 'text-ivory/80' : 'text-muted', className)}>{onExpiredLabel ?? (lang === 'ar' ? 'انتهى العرض' : 'This offer has ended')}</span>
  const units = [
    { v: days, l: lang === 'ar' ? 'يوم' : 'Days' },
    { v: hours, l: lang === 'ar' ? 'ساعة' : 'Hrs' },
    { v: minutes, l: lang === 'ar' ? 'دقيقة' : 'Min' },
    { v: seconds, l: lang === 'ar' ? 'ثانية' : 'Sec' },
  ].filter((u, i) => i > 0 || u.v > 0)
  return (
    <div className={cn('flex items-center gap-2', className)} role="timer" aria-live="off" dir="ltr">
      {units.map((u, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={cn('flex min-w-14 flex-col items-center rounded-xs px-2 py-1.5', tone === 'light' ? 'bg-white/10 text-ivory' : 'bg-white text-ink shadow-soft')}>
            <span className="font-serif text-2xl leading-none font-semibold tabular-nums">{String(u.v).padStart(2, '0')}</span>
            <span className={cn('mt-1 text-[10px] tracking-[0.14em] uppercase', tone === 'light' ? 'text-ivory/60' : 'text-muted')}>{u.l}</span>
          </div>
          {i < units.length - 1 && <span className={cn('font-serif text-xl', tone === 'light' ? 'text-ivory/40' : 'text-ink/30')}>:</span>}
        </div>
      ))}
    </div>
  )
}
