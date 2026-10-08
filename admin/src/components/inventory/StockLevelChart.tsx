import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { axisProps, CHART, ChartTooltip, gridProps } from '@/components/charts/theme'
import { ChartCard } from '@/components/ui'
import { useT } from '@/i18n'
import type { StockMovement } from '@/types'
import { formatDate } from '@/utils'

/**
 * Stock level over time, reconstructed backwards from the current stock
 * and the signed movement quantities (newest first from the service).
 */
export function StockLevelChart({ movements, currentStock, threshold, loading }: { movements: StockMovement[]; currentStock: number; threshold: number; loading?: boolean }) {
  const { t, lang } = useT()
  const data = useMemo(() => {
    const asc = [...movements].sort((a, b) => a.date.localeCompare(b.date))
    const net = asc.reduce((s, m) => s + m.quantity, 0)
    let level = Math.max(0, currentStock - net)
    const points = [{ label: asc[0] ? formatDate(asc[0].date, lang, { day: 'numeric', month: 'short' }) : '', units: level }]
    asc.forEach((m) => {
      level = Math.max(0, level + m.quantity)
      points.push({ label: formatDate(m.date, lang, { day: 'numeric', month: 'short' }), units: level })
    })
    // anchor the final point to the real current stock
    points[points.length - 1].units = currentStock
    return points
  }, [movements, currentStock, lang])

  return (
    <ChartCard title={t('products.inventory.detail.chart')} description={t('products.inventory.detail.chartDesc')} height={240} loading={loading}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="stockFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART.rose} stopOpacity={0.22} />
              <stop offset="100%" stopColor={CHART.rose} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="label" {...axisProps} minTickGap={24} />
          <YAxis {...axisProps} allowDecimals={false} width={44} />
          <Tooltip content={<ChartTooltip />} />
          {threshold > 0 && <ReferenceLine y={threshold} stroke={CHART.champagne} strokeDasharray="4 4" label={{ value: t('products.inventory.col.threshold'), fill: CHART.champagne, fontSize: 10, position: 'insideTopRight' }} />}
          <Area type="stepAfter" dataKey="units" name={t('products.inventory.detail.units')} stroke={CHART.rose} strokeWidth={2} fill="url(#stockFill)" dot={{ r: 2.5, fill: CHART.rose, strokeWidth: 0 }} activeDot={{ r: 4 }} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
