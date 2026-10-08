import { Card, Money, Thumb } from '@/components/ui'
import { useT } from '@/i18n'
import type { AdminOrder } from '@/types'
import { itemCount, lineCalc } from './orderUtils'

export function OrderTotals({ order, className }: { order: AdminOrder; className?: string }) {
  const { t } = useT()
  const row = (label: React.ReactNode, value: React.ReactNode, strong?: boolean) => (
    <div className={strong ? 'flex items-baseline justify-between gap-4 border-t border-line pt-3 text-[15px] font-semibold text-ink' : 'flex items-baseline justify-between gap-4 text-[13px]'}>
      <dt className={strong ? '' : 'text-muted'}>{label}</dt>
      <dd className="text-end font-medium text-ink">{value}</dd>
    </div>
  )
  return (
    <dl className={className ?? 'ms-auto w-full max-w-sm space-y-2.5'}>
      {row(t('orders.detail.subtotal'), <Money value={order.subtotal} />)}
      {order.discount > 0 &&
        row(
          <span>
            {t('orders.detail.totalDiscount')}
            {order.couponCode && (
              <span className="ms-1.5 rounded border border-line bg-mist px-1.5 py-0.5 font-mono text-[11px] text-ink" dir="ltr">
                {order.couponCode}
              </span>
            )}
          </span>,
          <span className="text-success" dir="ltr">
            − <Money value={order.discount} />
          </span>,
        )}
      {row(t('orders.detail.vatLine'), <Money value={order.vat} />)}
      {row(t('orders.detail.shipping'), order.shipping === 0 ? <span className="text-success">{t('orders.detail.free')}</span> : <Money value={order.shipping} />)}
      {row(t('orders.detail.grandTotal'), <Money value={order.total} />, true)}
    </dl>
  )
}

export function OrderItemsCard({ order }: { order: AdminOrder }) {
  const { t } = useT()
  return (
    <Card title={t('orders.detail.items')} description={t('orders.detail.itemsCount', { count: itemCount(order) })} padded={false}>
      {/* Desktop table */}
      <div className="thin-scrollbar overflow-x-auto max-md:hidden">
        <table className="w-full min-w-[720px] text-[13px]">
          <thead>
            <tr className="border-y border-line text-[11.5px] font-semibold tracking-wide text-muted uppercase">
              <th scope="col" className="px-5 py-2.5 text-start">{t('orders.detail.product')}</th>
              <th scope="col" className="px-3 py-2.5 text-start">{t('orders.detail.sku')}</th>
              <th scope="col" className="px-3 py-2.5 text-center">{t('orders.detail.qty')}</th>
              <th scope="col" className="px-3 py-2.5 text-end">{t('orders.detail.unitPrice')}</th>
              <th scope="col" className="px-3 py-2.5 text-end">{t('orders.detail.discount')}</th>
              <th scope="col" className="px-3 py-2.5 text-end">{t('orders.detail.vat')}</th>
              <th scope="col" className="px-5 py-2.5 text-end">{t('orders.detail.lineTotal')}</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((it, i) => {
              const c = lineCalc(order, it)
              return (
                <tr key={`${it.productId}-${i}`} className="border-b border-line-soft">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Thumb src={it.image} alt={it.name} size="sm" />
                      <div className="min-w-0">
                        <p className="font-medium text-ink">{it.name}</p>
                        <p className="text-xs text-muted capitalize">
                          {it.brandName.replace(/-/g, ' ')}
                          {it.variant && <> · {it.variant}</>}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-muted" dir="ltr">
                    {it.sku}
                  </td>
                  <td className="px-3 py-3 text-center tabular-nums">{it.quantity}</td>
                  <td className="px-3 py-3 text-end"><Money value={it.unitPrice} /></td>
                  <td className="px-3 py-3 text-end">{c.discount > 0 ? <span className="text-success"><Money value={c.discount} /></span> : <span className="text-subtle">—</span>}</td>
                  <td className="px-3 py-3 text-end text-muted"><Money value={c.vat} /></td>
                  <td className="px-5 py-3 text-end font-medium"><Money value={c.total} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {/* Mobile list */}
      <ul className="divide-y divide-line-soft border-t border-line md:hidden">
        {order.items.map((it, i) => {
          const c = lineCalc(order, it)
          return (
            <li key={`${it.productId}-${i}`} className="flex gap-3 px-5 py-3.5">
              <Thumb src={it.image} alt={it.name} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-ink">{it.name}</p>
                <p className="text-xs text-muted capitalize">
                  {it.brandName.replace(/-/g, ' ')}
                  {it.variant && <> · {it.variant}</>}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-subtle" dir="ltr">
                  {it.sku}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                  <span className="inline-flex items-center gap-1" dir="ltr">
                    {it.quantity} × <Money value={it.unitPrice} />
                  </span>
                  <Money value={c.total} className="text-[13px] font-semibold text-ink" />
                </div>
              </div>
            </li>
          )
        })}
      </ul>
      <div className="border-t border-line-soft px-5 py-4">
        <OrderTotals order={order} />
      </div>
    </Card>
  )
}
