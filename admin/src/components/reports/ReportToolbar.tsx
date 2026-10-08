import type { ReactNode } from 'react'
import { Download, Info, Printer } from 'lucide-react'
import { Button, DatePicker, Segmented } from '@/components/ui'
import { useT } from '@/i18n'
import { formatDate } from '@/utils'
import { REPORT_PRESETS, type ReportRange } from './useReportRange'

/** Range filter (+ custom dates) and export actions shown under report headers */
export function ReportToolbar({ range, onExportCsv, onPrint, extra }: { range: ReportRange; onExportCsv?: () => void; onPrint?: () => void; extra?: ReactNode }) {
  const { t } = useT()
  return (
    <div className="no-print mb-6 flex flex-col gap-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented value={range.preset} onChange={range.setPreset} options={REPORT_PRESETS.map((p) => ({ value: p, label: t(`reports.ranges.${p}`) }))} />
        <div className="flex flex-wrap items-center gap-2">
          {extra}
          {onExportCsv && (
            <Button variant="outline" size="sm" icon={<Download className="size-4" />} onClick={onExportCsv}>
              {t('common.exportCsv')}
            </Button>
          )}
          {onPrint && (
            <Button variant="outline" size="sm" icon={<Printer className="size-4" />} onClick={onPrint}>
              {t('reports.exportPdf')}
            </Button>
          )}
        </div>
      </div>
      {range.isCustom && (
        <div className="flex animate-slide-down flex-col gap-3 rounded-lg border border-line bg-surface p-3 sm:flex-row sm:items-end">
          <DatePicker label={t('common.from')} value={range.from} max={range.to} onChange={range.setFrom} wrapperClassName="sm:w-44" />
          <DatePicker label={t('common.to')} value={range.to} min={range.from} onChange={range.setTo} wrapperClassName="sm:w-44" />
          <p className="flex items-center gap-1.5 pb-2 text-xs text-subtle">
            <Info className="size-3.5 shrink-0" aria-hidden />
            {t('reports.closest', { range: t(`reports.ranges.${range.dataset}`) })}
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Print-only header + print fixes (the global print CSS hides every <header>,
 * which would also hide card titles; re-show those inside the report).
 */
export function PrintHeader({ title, rangeLabel }: { title: string; rangeLabel: string }) {
  const { t, lang } = useT()
  return (
    <>
      <style>{`@media print {
  .report-print section > header { display: flex !important; }
  .report-print .card { break-inside: avoid; box-shadow: none !important; }
  .report-print > header { display: none !important; }
  @page { margin: 14mm; }
}`}</style>
      <div className="mb-6 hidden border-b border-line pb-4 print:block">
        <p className="text-xs tracking-widest text-muted uppercase">LOOKS · {t('reports.title')}</p>
        <p className="mt-1 text-xl font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-xs text-muted">
          {rangeLabel} · {t('reports.generatedOn', { date: formatDate(new Date().toISOString(), lang) })}
        </p>
      </div>
    </>
  )
}

/** Human label for the active range ("Last 30 days" or "1 Oct 2026 – 8 Oct 2026") */
export function useRangeLabel(range: ReportRange): string {
  const { t, lang } = useT()
  if (range.isCustom) return `${formatDate(`${range.from}T12:00:00+03:00`, lang)} – ${formatDate(`${range.to}T12:00:00+03:00`, lang)}`
  return t(`ranges.${range.preset}`)
}
