import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CalendarClock, ChevronLeft, CreditCard, MessageCircle, PackageSearch, RotateCcw, ShoppingBag, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { Panel } from '@/components/account/AccountUI'
import { AddressLines } from '@/components/account/AddressForm'
import { OrderStatusBadge, OrderTimeline } from '@/components/account/OrderStatus'
import { AuthenticityMessage, Button, ButtonLink, buttonClass, EmptyState, ErrorState, Skeleton, SmartImage, Money } from '@/components/common'
import { PAYMENT_METHODS, STORE_CONFIG } from '@/config/store'
import { useAsync, useDocumentMeta } from '@/hooks'
import { useShopActions } from '@/hooks/useShop'
import { useT } from '@/i18n'
import { getOrderById } from '@/services/orderService'
import { getProductsByIds } from '@/services/productService'
import { formatDate, formatPrice, whatsappLink } from '@/utils'

function DetailSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-10 w-72 max-w-full" />
      <Skeleton className="h-28 w-full" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    </div>
  )
}

export default function OrderDetailPage() {
  const { id = '' } = useParams()
  const { t, lang } = useT()
  const { addToCart } = useShopActions()
  const { data: order, loading, error, reload } = useAsync(() => getOrderById(id), [id])
  const [buying, setBuying] = useState(false)
  useDocumentMeta(order ? t('account.orderDetail.metaTitle', { number: order.number }) : t('account.orders.metaTitle'))

  const back = (
    <Link to="/account/orders" className="mb-5 inline-flex h-10 items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink">
      <ChevronLeft className="size-4 rtl:-scale-x-100" aria-hidden />
      {t('account.orderDetail.back')}
    </Link>
  )

  if (loading) return <DetailSkeleton />
  if (error) return <ErrorState onRetry={reload} />
  if (!order)
    return (
      <div>
        {back}
        <div className="rounded-xs border border-line bg-white">
          <EmptyState icon={<PackageSearch />} title={t('account.orderDetail.notFound')} description={t('account.orderDetail.notFoundDesc')} action={{ label: t('account.orderDetail.back'), to: '/account/orders' }} />
        </div>
      </div>
    )

  const payment = PAYMENT_METHODS.find((p) => p.id === order.paymentMethod)
  const ship = STORE_CONFIG.shipping[order.shippingMethod]
  const delivered = order.status === 'delivered'
  const cancelled = order.status === 'cancelled'
  const deliveredStep = order.timeline.find((s) => s.status === 'delivered' && s.done)

  const buyAgain = async () => {
    setBuying(true)
    try {
      const products = await getProductsByIds(order.items.map((i) => i.productId))
      let added = 0
      order.items.forEach((item) => {
        const p = products.find((x) => x.id === item.productId)
        if (!p || p.stockStatus === 'out_of_stock') return
        const shadeId = p.shades.find((s) => s.name === item.variantLabel)?.id
        const sizeId = p.sizes.find((s) => s.label === item.variantLabel)?.id
        if (addToCart(p, { quantity: item.quantity, shadeId, sizeId, openCart: true })) added++
      })
      if (!added) toast.error(t('account.orderDetail.buyAgainNone'))
    } finally {
      setBuying(false)
    }
  }

  const rows: { label: string; value: string; tone?: 'discount' }[] = [
    { label: t('common.subtotal'), value: formatPrice(order.subtotal, lang) },
    ...(order.discount > 0
      ? [{ label: order.couponCode ? `${t('common.discount')} · ${t('account.orderDetail.coupon', { code: order.couponCode })}` : t('common.discount'), value: `−${formatPrice(order.discount, lang)}`, tone: 'discount' as const }]
      : []),
    { label: t('account.orderDetail.vatNote'), value: formatPrice(order.vat, lang) },
    { label: t('common.shipping'), value: order.shipping === 0 ? t('common.free') : formatPrice(order.shipping, lang) },
  ]

  return (
    <div>
      {back}
      <header className="mb-8 flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-2">{t('account.orders.order')}</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-3xl leading-tight font-medium tracking-[-0.02em] sm:text-4xl" dir="ltr">{order.number}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-2 text-sm text-muted">{t('account.orderDetail.placedOn', { date: formatDate(order.createdAt, lang, { day: 'numeric', month: 'long', year: 'numeric' }) })}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="dark" onClick={buyAgain} loading={buying} icon={<ShoppingBag className="size-4" />}>
            {t('account.orderDetail.buyAgain')}
          </Button>
          {delivered && (
            <ButtonLink to={`/account/returns?order=${encodeURIComponent(order.number)}`} variant="outline" icon={<RotateCcw className="size-4" />}>
              {t('account.orderDetail.requestReturn')}
            </ButtonLink>
          )}
          <a href={whatsappLink(t('account.orderDetail.helpMessage', { number: order.number }))} target="_blank" rel="noreferrer" className={buttonClass('ghost', 'md')}>
            <MessageCircle className="size-4" aria-hidden />
            {t('account.orderDetail.needHelp')}
          </a>
        </div>
      </header>

      <div className="space-y-6">
        <Panel title={t('account.orderDetail.tracking')}>
          <OrderTimeline steps={order.timeline} horizontal />
        </Panel>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Panel title={t('account.orderDetail.items')} bodyClassName="p-0">
            <ul className="divide-y divide-line">
              {order.items.map((item, i) => (
                <li key={`${item.productId}-${i}`} className="flex gap-4 p-5 sm:p-6">
                  <Link to={`/product/${item.slug}`} className="shrink-0">
                    <SmartImage src={item.image} alt={item.name} width={180} height={220} wrapperClassName="aspect-[4/5] w-20 rounded-xs sm:w-24" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 sm:flex-row">
                    <div className="min-w-0">
                      <p className="eyebrow text-muted">{item.brandName}</p>
                      <Link to={`/product/${item.slug}`} className="mt-1 block text-[15px] font-medium text-ink hover:text-rose">
                        {item.name}
                      </Link>
                      {item.variantLabel && <p className="mt-1 text-xs text-muted">{item.variantLabel}</p>}
                      <p className="mt-1 text-xs text-muted">
                        {t('common.qty')}: <span className="tabular-nums">{item.quantity}</span> × <Money value={item.price} />
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold tabular-nums sm:text-end"><Money value={item.price * item.quantity} /></p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-line p-5 sm:p-6">
              <AuthenticityMessage compact />
            </div>
          </Panel>

          <div className="space-y-6">
            <Panel title={t('account.orderDetail.summary')}>
              <dl className="space-y-3 text-sm">
                {rows.map((r) => (
                  <div key={r.label} className="flex justify-between gap-4">
                    <dt className="text-muted">{r.label}</dt>
                    <dd className={r.tone === 'discount' ? 'font-medium text-success tabular-nums' : 'tabular-nums'}>{r.value}</dd>
                  </div>
                ))}
                <div className="flex justify-between gap-4 border-t border-line pt-3 text-base font-semibold">
                  <dt>{t('common.total')}</dt>
                  <dd className="tabular-nums"><Money value={order.total} /></dd>
                </div>
              </dl>
            </Panel>

            <Panel title={t('account.orderDetail.delivery')}>
              <AddressLines address={order.address} />
              <dl className="mt-5 space-y-4 border-t border-line pt-5 text-sm">
                <div className="flex gap-3">
                  <Truck className="mt-0.5 size-4 shrink-0 text-rose" aria-hidden />
                  <div>
                    <dt className="text-xs text-muted">{t('account.orderDetail.shippingMethod')}</dt>
                    <dd className="font-medium">{t(`account.orderDetail.${order.shippingMethod}`, { days: ship.days })}</dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CreditCard className="mt-0.5 size-4 shrink-0 text-rose" aria-hidden />
                  <div>
                    <dt className="text-xs text-muted">{t('account.orderDetail.payment')}</dt>
                    <dd className="font-medium">{payment ? (lang === 'ar' ? payment.labelAr : payment.label) : order.paymentMethod}</dd>
                  </div>
                </div>
                {!cancelled && (
                  <div className="flex gap-3">
                    <CalendarClock className="mt-0.5 size-4 shrink-0 text-rose" aria-hidden />
                    <div>
                      <dt className="text-xs text-muted">{delivered ? t('account.orderDetail.deliveredOn') : t('account.orderDetail.estimated')}</dt>
                      <dd className="font-medium">{formatDate(deliveredStep?.date ?? order.estimatedDelivery, lang, { weekday: 'long', day: 'numeric', month: 'long' })}</dd>
                    </div>
                  </div>
                )}
              </dl>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  )
}
