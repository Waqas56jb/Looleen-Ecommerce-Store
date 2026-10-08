import { formatSeriesLabelLong } from '@/components/charts/format'
import type { Lang, SeriesPoint } from '@/types'

/** CSV rows for a revenue series (plain numbers; currency in the header) */
export function seriesCsvRows(series: SeriesPoint[], lang: Lang = 'en') {
  return series.map((p) => ({
    Period: /^\d{4}-\d{2}-\d{2}$/.test(p.label) ? p.label : formatSeriesLabelLong(p.label, lang),
    'Revenue (SAR)': p.revenue,
    Orders: p.orders,
    'Average Order Value (SAR)': p.aov ?? (p.orders ? Math.round(p.revenue / p.orders) : 0),
    Customers: p.customers ?? '',
  }))
}
