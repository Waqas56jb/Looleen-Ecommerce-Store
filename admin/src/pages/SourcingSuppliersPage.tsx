import { Link } from 'react-router-dom'
import { FileSpreadsheet, Truck } from 'lucide-react'
import { Card, EmptyState, ErrorState, KeyValue, Money, PageHeader, PageSkeleton } from '@/components/ui'
import { Pct, RetailerProgress, SourcingStatusBadge } from '@/components/sourcing/shared'
import { displayName } from '@/components/sourcing/format'
import { useAsync, useDocumentTitle } from '@/hooks'
import { useT } from '@/i18n'
import { getRules, getSuppliersOverview } from '@/services/sourcingService'
import { formatDate, formatNumber } from '@/utils'

export default function SourcingSuppliersPage() {
  const { t, lang } = useT()
  const S = (k: string) => t(`sourcing.suppliers.${k}`)
  useDocumentTitle(S('title'))
  const { data, loading, error, reload } = useAsync(() => getSuppliersOverview(), [])
  const rules = useAsync(() => getRules(), [])
  const min = rules.data?.minRetailers ?? 4

  if (loading && !data) return <PageSkeleton stats={0} rows={6} />
  if (error) return <ErrorState onRetry={reload} />

  return (
    <>
      <PageHeader title={S('title')} description={S('description')} breadcrumbs={[{ label: t('nav.sourcing') }, { label: S('title') }]} />
      {!data?.length ? (
        <div className="card">
          <EmptyState icon={<Truck />} title={S('title')} />
        </div>
      ) : (
        <div className="space-y-6">
          {data.map(({ supplier: s, products, approved, ready, avgMargin, rows }) => (
            <Card key={s.id} title={s.name} description={s.contact} padded={false}>
              <div className="grid grid-cols-1 gap-6 px-5 pb-5 lg:grid-cols-3">
                <KeyValue
                  className="self-start lg:col-span-1"
                  items={[
                    { label: S('priceList'), value: s.priceList },
                    { label: S('date'), value: formatDate(s.priceListDate, lang) },
                    { label: S('items'), value: <span className="tabular-nums">{formatNumber(s.itemsInList)}</span> },
                    { label: S('inReview'), value: <span className="tabular-nums">{products}</span> },
                    { label: S('ready'), value: <span className="tabular-nums">{ready}</span> },
                    { label: S('approved'), value: <span className="tabular-nums">{approved}</span> },
                    { label: S('avgMargin'), value: <Pct value={avgMargin} /> },
                  ]}
                />
                <div className="lg:col-span-2">
                  <p className="flex items-start gap-2 rounded-md bg-mist px-3 py-2 text-[12.5px] text-muted">
                    <FileSpreadsheet className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <span>
                      {S('basis')}: {s.priceBasis}. {S('newList')}
                    </span>
                  </p>
                  <p className="mt-4 mb-2 text-[13px] font-medium text-ink">{S('products')}</p>
                  <ul className="divide-y divide-line-soft rounded-md border border-line">
                    {rows.map((r) => (
                      <li key={r.id}>
                        <Link to={`/sourcing/${r.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5 hover:bg-mist">
                          <span className="min-w-0 flex-1 text-[13px] text-ink">
                            {displayName(r)}
                            <span className="block text-[11.5px] text-subtle" dir="ltr">
                              {r.offers.map((o) => o.code).join(' / ')}
                            </span>
                          </span>
                          {r.cost !== null && <Money value={r.cost} className="text-[13px] font-medium" />}
                          <RetailerProgress count={r.market.fresh} min={min} />
                          <SourcingStatusBadge status={r.status} short />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
