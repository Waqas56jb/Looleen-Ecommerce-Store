import { useId } from 'react'
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useT } from '@/i18n'
import type { SeriesPoint } from '@/types'
import { formatCompact } from '@/utils'
import { formatSeriesLabel, formatSeriesLabelLong } from './format'
import { axisProps, CHART, ChartTooltip, gridProps, yMoney } from './theme'

interface RevenueChartProps {
  data: SeriesPoint[]
  /** Overlay the orders line on a secondary (right) axis */
  showOrders?: boolean
  revenueLabel: string
  ordersLabel?: string
  /** Hide the y axis (sparkline-like mini chart) */
  compact?: boolean
}

/** Revenue area (rose gradient) with optional orders line in ink */
export function RevenueChart({ data, showOrders, revenueLabel, ordersLabel, compact }: RevenueChartProps) {
  const { lang } = useT()
  const gid = useId().replace(/:/g, '')
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: compact ? 4 : 0, left: compact ? 4 : -8, bottom: 0 }}>
        <defs>
          <linearGradient id={`rev-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART.rose} stopOpacity={0.28} />
            <stop offset="100%" stopColor={CHART.rose} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="label" {...axisProps} tickFormatter={(v: string) => formatSeriesLabel(v, lang)} minTickGap={20} tickMargin={8} />
        {!compact && <YAxis yAxisId="rev" {...axisProps} tickFormatter={yMoney} width={52} />}
        {compact && <YAxis yAxisId="rev" hide />}
        {showOrders && <YAxis yAxisId="ord" orientation="right" {...axisProps} tickFormatter={(v: number) => formatCompact(v)} width={40} />}
        <Tooltip
          cursor={{ stroke: CHART.muted, strokeDasharray: '3 3' }}
          content={<ChartTooltip moneyKeys={['revenue']} labelFormatter={(l) => formatSeriesLabelLong(String(l), lang)} />}
        />
        <Area
          yAxisId="rev"
          type="monotone"
          dataKey="revenue"
          name={revenueLabel}
          stroke={CHART.rose}
          strokeWidth={2}
          fill={`url(#rev-${gid})`}
          activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
          isAnimationActive={false}
        />
        {showOrders && (
          <Line yAxisId="ord" type="monotone" dataKey="orders" name={ordersLabel} stroke={CHART.ink} strokeWidth={1.75} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }} isAnimationActive={false} />
        )}
      </AreaChart>
    </ResponsiveContainer>
  )
}
