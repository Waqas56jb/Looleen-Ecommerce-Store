import type { ReactNode } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { CHART, ChartTooltip } from './theme'

export interface DonutDatum {
  key: string
  name: string
  value: number
  color?: string
}

/** Donut with a center label. Colors follow the entity's position in the given order (never re-sorted). */
export function DonutChart({ data, money, center }: { data: DonutDatum[]; money?: boolean; center?: ReactNode }) {
  return (
    <div className="relative size-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={<ChartTooltip moneyKeys={money ? ['value'] : []} />} />
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="92%" paddingAngle={1.5} stroke="#fff" strokeWidth={2} isAnimationActive={false}>
            {data.map((d, i) => (
              <Cell key={d.key} fill={d.color ?? CHART.series[i % CHART.series.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {center && <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">{center}</div>}
    </div>
  )
}

/** Matching color for item i in a donut / categorical list */
export const seriesColor = (i: number) => CHART.series[i % CHART.series.length]
