import { useSearchParams } from 'react-router-dom'
import { CalendarDays, CreditCard, MapPin, PackageSearch, ShieldCheck, Truck } from 'lucide-react'
import type { ReactNode } from 'react'
import { AddressLines } from '@/components/account/AddressForm'
import { OrderTimeline } from '@/components/account/OrderStatus'
import { TotalsRows } from '@/components/cart/TotalsRows'
import { paymentLabel } from '@/components/checkout/helpers'
import { AnimatedCheck, OrderNumber } from '@/components/checkout/SuccessParts'
import { ButtonLink, EmptyState, ErrorState, PaymentMark, Skeleton, SmartImage, Money } from '@/components/common'
import { useAsync, useDocumentMeta } from '@/hooks'
import { useT } from '@/i18n'
import { getOrderById } from '@/services/orderService'
import { useAuthStore } from '@/store/auth'
import { formatDate } from '@/utils'

function InfoCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="rounded-xs border border-line bg-white p-5">
      <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
        <span className="text-rose [&>svg]:size-4">{icon}</span>
        {title}
      </p>
      {children}
    </div>
  )
}

function SuccessSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 py-16" aria-busy>
      <Skeleton className="mx-auto size-24 rounded-full!" />
      <Skeleton className="mx-auto h-12 w-3/4" />
      <Skeleton className="mx-auto h-5 w-1/2" />
      <div className="grid grid-cols-1 gap-4 pt-8 sm:grid-cols-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-64" />
    </div>
  )
}

export default function OrderSuccessPage() {
  const { t, lang } = useT()
  useDocumentMeta(t('checkout.success.metaTitle'), t('checkout.success.metaDesc'))
  const [params] = useSearchParams()
  const id = params.get('order') ?? ''
  const user = useAuthStore((s) => s.user)
  const { data: order, loading, error, reload } = useAsync(() => (id ? getOrderById(id) : Promise.resolve(undefined)), [id])

  if (loading) return <div className="container-x"><SuccessSkeleton /></div>
  if (error) return <div className="container-x py-20"><ErrorState onRetry={reload} /></div>

  if (!order) {
    return (
      <div className="container-x py-16 sm:py-24">
        <EmptyState
          icon={<PackageSearch />}
          title={t('checkout.success.notFoundTitle')}
          description={t('checkout.success.notFoundDesc')}
          action={user ? { label: t('checkout.success.viewOrders'), to: '/account/orders' } : { label: t('common.continueShopping'), to: '/' }}
        />
      </div>
    )
  }

  const trackTo = user ? `/account/orders/${order.id}` : `/login?redirect=${encodeURIComponent(`/account/orders/${order.id}`)}`

  return (
    <div className="pb-20 sm:pb-28">
      <section className="bg-blush/40 py-14 text-center sm:py-20">
        <div className="container-x flex flex-col items-center">
          <AnimatedCheck />
          <p className="eyebrow animate-fade-up mt-7" style={{ animationDelay: '200ms' }}>
            {t('checkout.success.eyebrow')}
          </p>
          <h1 className="heading-page animate-fade-up mt-3 text-balance" style={{ animationDelay: '300ms' }}>
            {t('checkout.success.title')}
          </h1>
          <p className="body-lg animate-fade-up mt-4 max-w-xl text-balance" style={{ animationDelay: '400ms' }}>
            {t('checkout.success.subtitle')}
          </p>
          <div className="animate-fade-up mt-7 flex flex-col items-center gap-2" style={{ animationDelay: '500ms' }}>
            <OrderNumber number={order.number} />
            <p className="text-xs text-muted">{t('checkout.success.placedOn', { date: formatDate(order.createdAt, lang, { day: 'numeric', month: 'long', year: 'numeric' }) })}</p>
          </div>
          <div className="animate-fade-up mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row" style={{ animationDelay: '600ms' }}>
            <ButtonLink to={trackTo} variant="dark" size="lg">
              {t('checkout.success.track')}
            </ButtonLink>
            <ButtonLink to="/" variant="outline" size="lg">
              {t('common.continueShopping')}
            </ButtonLink>
          </div>
        </div>
      </section>

      <div className="container-x mt-12 max-w-5xl! sm:mt-16">
        <section aria-labelledby="progress-title" className="rounded-xs border border-line bg-white p-5 sm:p-8">
          <h2 id="progress-title" className="heading-card mb-6">
            {t('checkout.success.progress')}
          </h2>
          <OrderTimeline steps={order.timeline} horizontal />
        </section>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <InfoCard icon={<CalendarDays />} title={t('checkout.success.estimated')}>
            <p className="font-serif text-xl text-ink">{formatDate(order.estimatedDelivery, lang, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
              <Truck className="size-3.5" aria-hidden />
              {t(`checkout.shipping.${order.shippingMethod}`)}
            </p>
          </InfoCard>
          <InfoCard icon={<MapPin />} title={t('checkout.success.deliveryAddress')}>
            <AddressLines address={order.address} />
          </InfoCard>
          <InfoCard icon={<CreditCard />} title={t('checkout.success.paymentMethod')}>
            <div className="flex items-center gap-3">
              <PaymentMark id={order.paymentMethod} />
              <span className="text-sm text-ink">{paymentLabel(order.paymentMethod, lang)}</span>
            </div>
          </InfoCard>
        </div>

        <section aria-labelledby="summary-title" className="mt-6 grid grid-cols-1 gap-8 rounded-xs border border-line bg-white p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <h2 id="summary-title" className="heading-card mb-5">
              {t('checkout.success.summary')}
            </h2>
            <ul className="divide-y divide-line">
              {order.items.map((i) => (
                <li key={`${i.productId}-${i.variantLabel ?? ''}`} className="flex items-center gap-4 py-4 first:pt-0">
                  <SmartImage src={i.image} alt={i.name} width={140} height={175} wrapperClassName="w-16 shrink-0 aspect-[4/5] rounded-xs" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">{i.brandName}</p>
                    <p className="line-clamp-2 text-sm text-ink">{i.name}</p>
                    <p className="text-xs text-muted">
                      {i.variantLabel ? `${i.variantLabel} · ` : ''}
                      {t('checkout.summary.qty', { qty: i.quantity })}
                    </p>
                  </div>
                  <span className="text-sm font-medium tabular-nums"><Money value={i.price * i.quantity} /></span>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:border-s lg:border-line lg:ps-8">
            <TotalsRows subtotal={order.subtotal} discount={order.discount} vat={order.vat} shipping={order.shipping} total={order.total} couponCode={order.couponCode} />
            <p className="mt-6 flex gap-2 rounded-xs bg-champagne-soft/40 p-3 text-xs leading-relaxed text-ink">
              <ShieldCheck className="size-4 shrink-0 text-success" aria-hidden />
              {t('checkout.success.authentic')}
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
