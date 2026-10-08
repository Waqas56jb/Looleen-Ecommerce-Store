import { DonutChart, seriesColor } from '@/components/charts/DonutChart'
import { Card, ErrorState, Money, Skeleton } from '@/components/ui'
import { useAsync } from '@/hooks'
import { useT } from '@/i18n'
import { getCategorySales } from '@/services/analyticsService'
import type { DateRange } from '@/types'
import { cn } from '@/utils'

export function CategorySalesCard({ range, className, title, description }: { range: DateRange; className?: string; title?: string; description?: string }) {
  const { t, lang } = useT()
  const { data, loading, error, reload } = useAsync(() => getCategorySales(range), [range])
  const total = data?.reduce((s, c) => s + c.revenue, 0) ?? 0

  return (
    <Card title={title ?? t('dashboard.categories.title')} description={description ?? t('dashboard.categories.description')} className={className}>
      {error ? (
        <ErrorState onRetry={reload} className="py-8" />
      ) : loading && !data ? (
        <div className="space-y-4">
          <Skeleton className="mx-auto size-44 rounded-full" />
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-5" />
          ))}
        </div>
      ) : (
        <div className={cn('flex flex-col gap-5', loading && 'opacity-60 transition-opacity')}>
          <div className="mx-auto h-48 w-full max-w-[220px]" dir="ltr">
            <DonutChart
              money
              data={(data ?? []).map((c, i) => ({ key: c.id, name: c[lang], value: c.revenue, color: seriesColor(i) }))}
              center={
                <div>
                  <p className="text-[11px] text-muted" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                    {t('common.total')}
                  </p>
                  <Money value={total} compact className="text-base font-semibold text-ink" />
                </div>
              }
            />
          </div>
          <ul className="space-y-2.5">
            {(data ?? []).map((c, i) => (
              <li key={c.id} className="flex items-center gap-2.5 text-[13px]">
                <span className="size-2.5 shrink-0 rounded-sm" style={{ background: seriesColor(i) }} aria-hidden />
                <span className="min-w-0 flex-1 truncate text-ink">{c[lang]}</span>
                <span className="w-12 text-end text-muted tabular-nums" dir="ltr">
                  {c.percentage.toFixed(1)}%
                </span>
                <Money value={c.revenue} className="w-24 justify-end font-medium text-ink" />
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}
