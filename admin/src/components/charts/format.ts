import type { Lang } from '@/types'
import { formatDate } from '@/utils'

const MONTHS_AR: Record<string, string> = {
  Jan: 'يناير',
  Feb: 'فبراير',
  Mar: 'مارس',
  Apr: 'أبريل',
  May: 'مايو',
  Jun: 'يونيو',
  Jul: 'يوليو',
  Aug: 'أغسطس',
  Sep: 'سبتمبر',
  Oct: 'أكتوبر',
  Nov: 'نوفمبر',
  Dec: 'ديسمبر',
}

/**
 * Series label → display label.
 *   "2026-10-12" → "12 Oct" / "12 أكتوبر"; "14:00" stays; "Oct" stays (Arabic month name in ar).
 */
export function formatSeriesLabel(label: string, lang: Lang = 'en'): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(label)) return formatDate(`${label}T12:00:00+03:00`, lang, { day: 'numeric', month: 'short', timeZone: 'Asia/Riyadh' })
  if (lang === 'ar' && MONTHS_AR[label]) return MONTHS_AR[label]
  return label
}

/** Longer label for tooltips: "12 Oct 2026" for dates */
export function formatSeriesLabelLong(label: string, lang: Lang = 'en'): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(label)) return formatDate(`${label}T12:00:00+03:00`, lang, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Riyadh' })
  return formatSeriesLabel(label, lang)
}
