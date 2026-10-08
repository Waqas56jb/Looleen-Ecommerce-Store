import { Money } from '@/components/ui'
import { STORE_CONFIG } from '@/config/store'
import { useAsync } from '@/hooks'
import { useT } from '@/i18n'
import { getSettings } from '@/services/systemService'
import type { AdminOrder } from '@/types'
import { cityName, formatDate, paymentName } from '@/utils'
import { OrderTotals } from './OrderItemsCard'
import { lineCalc } from './orderUtils'

/**
 * Clean print-only invoice (hidden on screen). Uses plain divs — the global
 * print CSS hides every <header>, so no Card/PageHeader in here.
 */
export function OrderInvoicePrint({ order }: { order: AdminOrder }) {
  const { t, lang } = useT()
  const { data: settings } = useAsync(() => getSettings(), [])
  const g = settings?.general
  const a = order.address
  return (
    <div className="print-area hidden bg-white text-[12px] text-ink print:block">
      <div className="flex items-start justify-between gap-6 border-b-2 border-ink pb-4">
        <div>
          <p className="text-2xl font-semibold tracking-[0.2em]">{g?.storeName ?? STORE_CONFIG.name}</p>
          <p className="mt-1 text-muted">{g?.address ?? STORE_CONFIG.address}</p>
          <p className="text-muted" dir="ltr">
            {g?.storeEmail ?? STORE_CONFIG.supportEmail} · {g?.supportPhone ?? STORE_CONFIG.supportPhone}
          </p>
        </div>
        <div className="text-end">
          <p className="text-lg font-semibold uppercase">{t('orders.print.invoice')}</p>
          <p className="mt-1">
            {t('orders.print.invoiceNo')}: <span dir="ltr" className="font-medium">INV-{order.number.replace(/^[A-Z]+-/, '')}</span>
          </p>
          <p>
            {t('orders.col.order')}: <span dir="ltr" className="font-medium">{order.number}</span>
          </p>
          <p>
            {t('orders.print.date')}: {formatDate(order.createdAt, lang)}
          </p>
          <p>
            {t('orders.print.vatNo')}: <span dir="ltr" className="font-medium">{settings?.tax.vatNumber ?? '3XXXXXXXXXXXXX3'}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 py-4">
        <div>
          <p className="mb-1 text-[10px] font-semibold tracking-wide text-muted uppercase">{t('orders.print.billTo')}</p>
          <p className="font-medium">{order.customerName}</p>
          <p dir="ltr">{order.customerEmail}</p>
          <p dir="ltr">{order.customerPhone}</p>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-semibold tracking-wide text-muted uppercase">{t('orders.print.shipTo')}</p>
          <p className="font-medium">{a.fullName}</p>
          <p>
            {a.street}, {a.building}
            {a.apartment ? `, ${a.apartment}` : ''}
          </p>
          <p>
            {a.district}, {cityName(a.city, lang)} {a.postalCode}
          </p>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-semibold tracking-wide text-muted uppercase">{t('orders.print.paymentMethod')}</p>
          <p>
            {paymentName(order.paymentMethod, lang)} · {t(`status.${order.paymentStatus}`)}
          </p>
          <p className="mt-2 mb-1 text-[10px] font-semibold tracking-wide text-muted uppercase">{t('orders.print.shippingMethod')}</p>
          <p>{t(`shippingMethod.${order.shippingMethod}`)}</p>
        </div>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-y border-ink text-[10px] font-semibold tracking-wide uppercase">
            <th className="py-2 text-start">{t('orders.print.description')}</th>
            <th className="py-2 text-start">{t('orders.detail.sku')}</th>
            <th className="py-2 text-center">{t('orders.detail.qty')}</th>
            <th className="py-2 text-end">{t('orders.detail.unitPrice')}</th>
            <th className="py-2 text-end">{t('orders.detail.discount')}</th>
            <th className="py-2 text-end">{t('orders.detail.vat')}</th>
            <th className="py-2 text-end">{t('orders.detail.lineTotal')}</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((it, i) => {
            const c = lineCalc(order, it)
            return (
              <tr key={i} className="border-b border-line">
                <td className="py-2 pe-2">
                  {it.name}
                  {it.variant && <span className="text-muted"> · {it.variant}</span>}
                </td>
                <td className="py-2 font-mono text-[11px]" dir="ltr">
                  {it.sku}
                </td>
                <td className="py-2 text-center">{it.quantity}</td>
                <td className="py-2 text-end"><Money value={it.unitPrice} /></td>
                <td className="py-2 text-end">{c.discount > 0 ? <Money value={c.discount} /> : '—'}</td>
                <td className="py-2 text-end"><Money value={c.vat} /></td>
                <td className="py-2 text-end font-medium"><Money value={c.total} /></td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="mt-4 flex justify-end">
        <OrderTotals order={order} className="w-72 space-y-1.5" />
      </div>

      <p className="mt-8 border-t border-line pt-3 text-center text-[11px] text-muted">{t('orders.print.vatIncluded')}</p>
      <p className="mt-1 text-center text-[11px] text-muted">{t('orders.print.thanks')}</p>
    </div>
  )
}
