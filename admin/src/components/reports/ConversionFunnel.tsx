import { Card, Skeleton } from '@/components/ui'
import { useT } from '@/i18n'
import { cn, formatNumber } from '@/utils'

export interface FunnelData {
  sessions: number
  addToCart: number
  checkout: number
  purchases: number
}

const STEPS: (keyof FunnelData)[] = ['sessions', 'addToCart', 'checkout', 'purchases']
const SHADES = ['bg-ink', 'bg-[#7E5A63]', 'bg-rose', 'bg-champagne']

export function ConversionFunnel({ data, loading, className }: { data?: FunnelData; loading?: boolean; className?: string }) {
  const { t } = useT()
  return (
    <Card title={t('reports.funnel.title')} description={t('reports.funnel.description')} className={className}>
      {!data ? (
        <div className="space-y-5">
          {STEPS.map((s) => (
            <Skeleton key={s} className="h-12" />
          ))}
        </div>
      ) : (
        <ol className={cn('space-y-4', loading && 'opacity-60 transition-opacity')}>
          {STEPS.map((step, i) => {
            const value = data[step]
            const share = value / Math.max(1, data.sessions)
            const prev = i > 0 ? data[STEPS[i - 1]] : 0
            const stepRate = i > 0 ? (value / Math.max(1, prev)) * 100 : 100
            return (
              <li key={step}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <span className="flex items-center gap-2 text-[13px] font-medium text-ink">
                    <span className="grid size-5 place-items-center rounded-full bg-mist text-[10.5px] text-muted tabular-nums">{i + 1}</span>
                    {t(`reports.funnel.${step}`)}
                  </span>
                  <span className="text-sm font-semibold text-ink tabular-nums">{formatNumber(value)}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-mist">
                  <div className={cn('h-full rounded-full transition-[width] duration-500', SHADES[i])} style={{ width: `${Math.max(1.5, share * 100)}%` }} />
                </div>
                <div className="mt-1 flex justify-between gap-3 text-[11.5px] text-muted">
                  <span>{i > 0 ? t('reports.funnel.stepRate', { value: stepRate.toFixed(1) }) : ' '}</span>
                  <span>{t('reports.funnel.ofTotal', { value: (share * 100).toFixed(share < 0.1 ? 2 : 1) })}</span>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </Card>
  )
}
