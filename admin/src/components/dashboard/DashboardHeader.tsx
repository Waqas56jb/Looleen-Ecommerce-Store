import { CalendarDays } from 'lucide-react'
import { PageHeader, Segmented } from '@/components/ui'
import { useT } from '@/i18n'
import { useAuthStore } from '@/store/authStore'
import type { DateRange } from '@/types'
import { formatDate } from '@/utils'

export const DASHBOARD_RANGES: DateRange[] = ['today', 'yesterday', '7d', '30d', '90d', 'year']

/** Hour of day in Riyadh (0–23), independent of the browser's timezone */
function riyadhHour(): number {
  return Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Asia/Riyadh' }).format(new Date())) % 24
}

export function DashboardHeader({ range, onRangeChange }: { range: DateRange; onRangeChange: (r: DateRange) => void }) {
  const { t, lang } = useT()
  const admin = useAuthStore((s) => s.admin)
  const firstName = admin?.name.split(/\s+/)[0] ?? ''
  const h = riyadhHour()
  const part = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
  const today = formatDate(new Date().toISOString(), lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Riyadh' })

  return (
    <PageHeader
      title={firstName ? t(`dashboard.greeting.${part}`, { name: firstName }) : t('dashboard.title')}
      description={
        <span className="flex flex-col gap-1">
          <span>{t('dashboard.subtitle')}</span>
          <span className="inline-flex items-center gap-1.5 text-xs text-subtle">
            <CalendarDays className="size-3.5" aria-hidden />
            {today}
          </span>
        </span>
      }
      actions={
        <div className="w-full md:w-auto" aria-label={t('dashboard.dateRange')}>
          <Segmented size="sm" value={range} onChange={onRangeChange} options={DASHBOARD_RANGES.map((r) => ({ value: r, label: t(`ranges.${r}`) }))} />
        </div>
      }
    />
  )
}
