import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartCard } from '@/components/ui'
import { CHART, ChartTooltip, axisProps } from '@/components/charts/theme'
import { useT } from '@/i18n'
import { SALON_TYPES } from './shared'

/** Horizontal bars: professional accounts per salon type. */
export function SalonTypeChart({ byType, loading, className }: { byType?: Record<string, number>; loading?: boolean; className?: string }) {
  const { t } = useT()
  const data = SALON_TYPES.map((type) => ({ type, name: t(`salonTypes.${type}`), accounts: byType?.[type] ?? 0 })).sort((a, b) => b.accounts - a.accounts)
  const max = Math.max(1, ...data.map((d) => d.accounts))
  return (
    <ChartCard title={t('customers.professional.chartTitle')} description={t('customers.professional.chartDesc')} height={260} loading={loading} className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 0 }} barCategoryGap={8}>
          <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" allowDecimals={false} {...axisProps} domain={[0, max]} />
          <YAxis type="category" dataKey="name" width={104} {...axisProps} />
          <Tooltip cursor={{ fill: CHART.roseSoft }} content={<ChartTooltip />} />
          <Bar dataKey="accounts" name={t('customers.professional.accounts')} radius={[0, 4, 4, 0]} maxBarSize={22}>
            {data.map((d, i) => (
              <Cell key={d.type} fill={i === 0 ? CHART.rose : CHART.ink} fillOpacity={i === 0 ? 1 : 0.78} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
