import type { ReactNode } from 'react'
import { formatCompact, formatNumber } from '@/utils'

/** Restrained chart palette — rose primary, espresso & champagne secondary */
export const CHART = {
  rose: '#B76E79',
  roseSoft: 'rgba(183,110,121,0.14)',
  ink: '#2A1E22',
  champagne: '#C9A66B',
  success: '#3F7656',
  muted: '#9A8F92',
  grid: '#EFE9E4',
  axis: '#9A8F92',
  series: ['#B76E79', '#2A1E22', '#C9A66B', '#7E5A63', '#D9B8BE', '#8C7B6B', '#3F7656', '#A97835'],
}

export const axisProps = {
  stroke: CHART.axis,
  tick: { fill: CHART.axis, fontSize: 11 },
  tickLine: false,
  axisLine: false,
} as const

export const gridProps = { stroke: CHART.grid, strokeDasharray: '3 3', vertical: false } as const

export const yMoney = (v: number) => formatCompact(v)

interface TooltipEntry {
  name?: string | number
  value?: number | string
  color?: string
  dataKey?: string | number
}

/** Shared tooltip: dark card with formatted values. `money` keys are prefixed with the Riyal sign. */
export function ChartTooltip({ active, payload, label, moneyKeys = [], labelFormatter }: { active?: boolean; payload?: TooltipEntry[]; label?: ReactNode; moneyKeys?: string[]; labelFormatter?: (l: ReactNode) => ReactNode }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-ink/10 bg-ink px-3 py-2 text-xs text-white shadow-pop">
      {label !== undefined && <p className="mb-1 font-medium text-white/70">{labelFormatter ? labelFormatter(label) : label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2 tabular-nums">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white/70">{p.name}</span>
          <span className="ms-auto font-medium">
            {moneyKeys.includes(String(p.dataKey)) ? 'SAR ' : ''}
            {typeof p.value === 'number' ? formatNumber(p.value, 0) : p.value}
          </span>
        </p>
      ))}
    </div>
  )
}
