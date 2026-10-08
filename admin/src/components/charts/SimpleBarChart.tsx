import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCompact } from '@/utils'
import { axisProps, CHART, ChartTooltip, gridProps, yMoney } from './theme'

export interface BarSeries {
  key: string
  name: string
  color?: string
  stackId?: string
}

interface SimpleBarChartProps<T> {
  data: T[]
  /** Category key (x axis, or y axis when horizontal) */
  categoryKey: keyof T & string
  bars: BarSeries[]
  horizontal?: boolean
  money?: boolean
  formatCategory?: (v: string) => string
  formatTooltipLabel?: (v: string) => string
  /** Width reserved for category labels in horizontal mode */
  categoryWidth?: number
}

/** Thin bars with rounded data-ends, subtle grid, compact value axis */
export function SimpleBarChart<T>({ data, categoryKey, bars, horizontal, money, formatCategory, formatTooltipLabel, categoryWidth = 96 }: SimpleBarChartProps<T>) {
  const valueFmt = money ? yMoney : (v: number) => formatCompact(v)
  const fmtCat = (v: unknown) => (formatCategory ? formatCategory(String(v)) : String(v))
  const stacked = bars.some((b) => b.stackId)
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 8, right: 8, left: horizontal ? 0 : -8, bottom: 0 }} barCategoryGap={horizontal ? '28%' : '22%'}>
        <CartesianGrid {...gridProps} vertical={horizontal} horizontal={!horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" {...axisProps} tickFormatter={valueFmt} />
            <YAxis type="category" dataKey={categoryKey as string} {...axisProps} width={categoryWidth} tickFormatter={fmtCat} interval={0} />
          </>
        ) : (
          <>
            <XAxis dataKey={categoryKey as string} {...axisProps} tickFormatter={fmtCat} minTickGap={16} tickMargin={8} />
            <YAxis {...axisProps} tickFormatter={valueFmt} width={52} />
          </>
        )}
        <Tooltip
          cursor={{ fill: 'rgba(42,30,34,0.04)' }}
          content={<ChartTooltip moneyKeys={money ? bars.map((b) => b.key) : []} labelFormatter={(l) => (formatTooltipLabel ? formatTooltipLabel(String(l)) : fmtCat(l))} />}
        />
        {bars.map((b, i) => {
          const last = !stacked || i === bars.length - 1
          const r = 4
          return (
            <Bar
              key={b.key}
              dataKey={b.key}
              name={b.name}
              fill={b.color ?? CHART.series[i % CHART.series.length]}
              stackId={b.stackId}
              maxBarSize={horizontal ? 18 : 28}
              radius={last ? (horizontal ? [0, r, r, 0] : [r, r, 0, 0]) : 0}
              isAnimationActive={false}
            />
          )
        })}
      </BarChart>
    </ResponsiveContainer>
  )
}

/** Single-measure line chart (e.g. average order value) */
export function SimpleLineChart<T>({ data, xKey, yKey, name, money, color = CHART.ink, formatX, formatTooltipLabel }: { data: T[]; xKey: keyof T & string; yKey: keyof T & string; name: string; money?: boolean; color?: string; formatX?: (v: string) => string; formatTooltipLabel?: (v: string) => string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey={xKey as string} {...axisProps} tickFormatter={(v: unknown) => (formatX ? formatX(String(v)) : String(v))} minTickGap={20} tickMargin={8} />
        <YAxis {...axisProps} tickFormatter={money ? yMoney : (v: number) => formatCompact(v)} width={52} domain={['auto', 'auto']} />
        <Tooltip
          cursor={{ stroke: CHART.muted, strokeDasharray: '3 3' }}
          content={<ChartTooltip moneyKeys={money ? [yKey] : []} labelFormatter={(l) => (formatTooltipLabel ? formatTooltipLabel(String(l)) : String(l))} />}
        />
        <Line type="monotone" dataKey={yKey} name={name} stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
