import { Link } from 'react-router-dom'
import { Mail, MapPin, Phone } from 'lucide-react'
import { Avatar, Card, KeyValue, Money, StatusBadge } from '@/components/ui'
import { useAsync } from '@/hooks'
import { useT } from '@/i18n'
import { getOrdersByCustomer } from '@/services/orderService'
import type { AdminOrder } from '@/types'
import { cityName, formatDate, paymentName } from '@/utils'
import { estimatedDelivery } from './orderUtils'

export function CustomerCard({ order }: { order: AdminOrder }) {
  const { t } = useT()
  const { data } = useAsync(() => getOrdersByCustomer(order.customerId), [order.customerId])
  return (
    <Card title={t('orders.detail.customer')}>
      <div className="flex items-center gap-3">
        <Avatar name={order.customerName} size="lg" />
        <div className="min-w-0">
          <Link to={`/customers/${order.customerId}`} className="block truncate text-sm font-semibold text-ink hover:text-rose-dark hover:underline">
            {order.customerName}
          </Link>
          <p className="text-xs text-muted">{data ? t('orders.detail.ordersCount', { count: data.length }) : '…'}</p>
        </div>
      </div>
      <ul className="mt-4 space-y-2 text-[13px]">
        <li className="flex min-w-0 items-center gap-2">
          <Mail className="size-4 shrink-0 text-subtle" aria-hidden />
          <a href={`mailto:${order.customerEmail}`} dir="ltr" className="truncate text-ink hover:underline">
            {order.customerEmail}
          </a>
        </li>
        <li className="flex items-center gap-2">
          <Phone className="size-4 shrink-0 text-subtle" aria-hidden />
          <a href={`tel:${order.customerPhone.replace(/\s/g, '')}`} dir="ltr" className="text-ink hover:underline">
            {order.customerPhone}
          </a>
        </li>
      </ul>
    </Card>
  )
}

export function AddressCard({ order }: { order: AdminOrder }) {
  const { t, lang } = useT()
  const a = order.address
  return (
    <Card title={t('orders.detail.address')}>
      <div className="flex gap-2.5 text-[13px] leading-relaxed text-ink">
        <MapPin className="mt-0.5 size-4 shrink-0 text-subtle" aria-hidden />
        <address className="not-italic">
          <span className="block font-medium">{a.fullName}</span>
          <span className="block">
            {a.street}, {t('orders.detail.building', { value: a.building })}
            {a.apartment && <>, {t('orders.detail.apt', { value: a.apartment })}</>}
          </span>
          <span className="block">
            {a.district}, {cityName(a.city, lang)}
          </span>
          <span className="block text-muted">{t('orders.detail.postal', { value: a.postalCode })}</span>
          <span className="mt-1 block text-muted" dir="ltr">
            {a.phone}
          </span>
        </address>
      </div>
    </Card>
  )
}

export function PaymentCard({ order }: { order: AdminOrder }) {
  const { t, lang } = useT()
  return (
    <Card title={t('orders.detail.payment')}>
      <KeyValue
        items={[
          { label: t('orders.detail.method'), value: paymentName(order.paymentMethod, lang) },
          { label: t('orders.detail.paymentStatus'), value: <StatusBadge status={order.paymentStatus} /> },
          { label: t('orders.detail.amount'), value: <Money value={order.total} /> },
          { label: t('orders.detail.gatewayRef'), value: <span className="text-xs font-normal text-subtle">{t('orders.detail.gatewayNote')}</span> },
        ]}
      />
    </Card>
  )
}

export function ShippingCard({ order }: { order: AdminOrder }) {
  const { t, lang } = useT()
  const delivered = order.timeline.find((e) => e.status === 'delivered')
  return (
    <Card title={t('orders.detail.shippingCard')}>
      <KeyValue
        items={[
          { label: t('orders.detail.shippingMethod'), value: t(`shippingMethod.${order.shippingMethod}`) },
          { label: t('orders.detail.carrier'), value: order.carrier ?? <span className="font-normal text-subtle">{t('orders.detail.notAssigned')}</span> },
          {
            label: t('orders.detail.tracking'),
            value: order.trackingNumber ? (
              <span dir="ltr" className="font-mono text-xs">
                {order.trackingNumber}
              </span>
            ) : (
              <span className="font-normal text-subtle">{t('orders.detail.notAssigned')}</span>
            ),
          },
          delivered
            ? { label: t('orders.detail.deliveredOn'), value: formatDate(delivered.date, lang) }
            : { label: t('orders.detail.eta'), value: order.status === 'cancelled' ? '—' : formatDate(estimatedDelivery(order), lang) },
        ]}
      />
    </Card>
  )
}
