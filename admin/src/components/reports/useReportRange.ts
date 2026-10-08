import { useSearchParams } from 'react-router-dom'
import type { DateRange } from '@/types'

export type ReportPreset = '7d' | '30d' | '90d' | '12m' | 'custom'
export const REPORT_PRESETS: ReportPreset[] = ['7d', '30d', '90d', '12m', 'custom']

const iso = (d: Date) => d.toISOString().slice(0, 10)

/** Nearest predefined dataset for a custom span (in days) */
export function closestDataset(from: string, to: string): Exclude<DateRange, 'today' | 'yesterday' | 'year'> {
  const days = Math.max(1, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000) + 1)
  if (days <= 14) return '7d'
  if (days <= 55) return '30d'
  if (days <= 180) return '90d'
  return '12m'
}

/**
 * URL-synced report range (?range=30d | custom&from=…&to=…) shared by all report pages,
 * so moving between overview and detailed reports keeps the period.
 */
export function useReportRange() {
  const [params, setParams] = useSearchParams()
  const raw = params.get('range') as ReportPreset | null
  const preset: ReportPreset = raw && REPORT_PRESETS.includes(raw) ? raw : '30d'
  const today = new Date()
  const from = params.get('from') ?? iso(new Date(today.getTime() - 13 * 86_400_000))
  const to = params.get('to') ?? iso(today)
  const dataset: DateRange = preset === 'custom' ? closestDataset(from <= to ? from : to, from <= to ? to : from) : preset

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([k, v]) => (v === null ? next.delete(k) : next.set(k, v)))
    setParams(next, { replace: true })
  }

  return {
    preset,
    dataset,
    from,
    to,
    isCustom: preset === 'custom',
    /** query string to carry the range to another report page */
    search: params.toString() ? `?${params.toString()}` : '',
    setPreset: (p: ReportPreset) => update(p === 'custom' ? { range: 'custom', from, to } : { range: p === '30d' ? null : p, from: null, to: null }),
    setFrom: (v: string) => update({ from: v }),
    setTo: (v: string) => update({ to: v }),
  }
}

export type ReportRange = ReturnType<typeof useReportRange>
