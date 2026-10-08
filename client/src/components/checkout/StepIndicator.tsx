import { Check, ChevronRight } from 'lucide-react'
import { useT } from '@/i18n'
import { cn } from '@/utils'

export const CHECKOUT_STEPS = ['address', 'shipping', 'payment', 'review'] as const

/** Address → Shipping → Payment → Review. Completed steps are clickable to edit. */
export function StepIndicator({ current, onSelect }: { current: number; onSelect: (step: number) => void }) {
  const { t } = useT()
  return (
    <nav aria-label={t('checkout.steps.label')}>
      <p className="mb-3 text-xs text-muted sm:hidden">{t('checkout.steps.stepOf', { current: current + 1, total: CHECKOUT_STEPS.length })}</p>
      <ol className="flex items-center gap-1.5 sm:gap-3">
        {CHECKOUT_STEPS.map((id, i) => {
          const done = i < current
          const active = i === current
          const label = t(`checkout.steps.${id}`)
          const content = (
            <>
              <span
                className={cn(
                  'grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold transition-colors',
                  done && 'border-ink bg-ink text-ivory',
                  active && 'border-rose bg-rose text-white',
                  !done && !active && 'border-line bg-white text-muted',
                )}
              >
                {done ? <Check className="size-3.5" aria-hidden /> : i + 1}
              </span>
              <span className={cn('text-[13px] font-medium', active ? 'text-ink' : done ? 'text-ink' : 'text-muted', !active && 'hidden sm:inline')}>{label}</span>
            </>
          )
          return (
            <li key={id} className="flex min-w-0 items-center gap-1.5 sm:gap-3">
                {i > 0 && <ChevronRight className={cn('size-4 shrink-0 rtl:-scale-x-100', i <= current ? 'text-ink/60' : 'text-line')} aria-hidden />}
                {done ? (
                  <button
                    type="button"
                    onClick={() => onSelect(i)}
                    aria-label={t('checkout.steps.edit', { step: label })}
                    className="flex min-h-11 items-center gap-2 rounded-full pe-1 transition-opacity hover:opacity-70"
                  >
                    {content}
                  </button>
                ) : (
                  <span className="flex min-h-11 items-center gap-2" aria-current={active ? 'step' : undefined}>
                    {content}
                  </span>
                )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
