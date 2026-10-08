import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Activity, Heart, LifeBuoy, MapPin, MessageSquareText, ShoppingBag } from 'lucide-react'
import { Badge, ButtonLink, Card, EmptyState, KeyValue, Money, RatingStars, Skeleton, StatusBadge, Thumb, Timeline } from '@/components/ui'
import { useAsync } from '@/hooks'
import { useT } from '@/i18n'
import { getTickets } from '@/services/customerService'
import { getReviews } from '@/services/moderationService'
import { getOrdersByCustomer } from '@/services/orderService'
import { getAllProducts } from '@/services/productService'
import { getActivity } from '@/services/systemService'
import type { AdminCustomer } from '@/types'
import { cityName, formatDate, formatNumber, timeAgo } from '@/utils'

function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  )
}

function SectionEmpty({ icon, text }: { icon: ReactNode; text: string }) {
  return <EmptyState icon={icon} title={text} className="py-8" />
}

/* ---------------- Recent orders ---------------- */

export function RecentOrdersCard({ customer }: { customer: AdminCustomer }) {
  const { t, lang } = useT()
  const { data, loading } = useAsync(() => getOrdersByCustomer(customer.id), [customer.id])
  const orders = [...(data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6)
  return (
    <Card
      title={t('customers.detail.recentOrders')}
      padded={false}
      actions={
        data && data.length > 0 ? (
          <ButtonLink to={`/orders?q=${encodeURIComponent(customer.email)}`} variant="ghost" size="sm">
            {t('customers.detail.viewAllOrders')}
          </ButtonLink>
        ) : undefined
      }
    >
      {loading && !data ? (
        <div className="px-5 pb-5">
          <ListSkeleton />
        </div>
      ) : orders.length === 0 ? (
        <SectionEmpty icon={<ShoppingBag />} text={t('customers.detail.noOrders')} />
      ) : (
        <>
          <div className="thin-scrollbar overflow-x-auto max-sm:hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-y border-line-soft bg-mist/40 text-[11.5px] tracking-wide text-muted uppercase">
                  <th className="px-5 py-2.5 text-start font-semibold">{t('customers.detail.order')}</th>
                  <th className="px-3 py-2.5 text-start font-semibold">{t('customers.detail.date')}</th>
                  <th className="px-3 py-2.5 text-end font-semibold">{t('customers.detail.items')}</th>
                  <th className="px-3 py-2.5 text-start font-semibold">{t('common.status')}</th>
                  <th className="px-5 py-2.5 text-end font-semibold">{t('customers.detail.total')}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-line-soft last:border-0 hover:bg-mist/50">
                    <td className="px-5 py-3">
                      <Link to={`/orders/${o.id}`} className="font-medium text-ink hover:text-rose-dark hover:underline" dir="ltr">
                        {o.number}
                      </Link>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-muted">{formatDate(o.createdAt, lang)}</td>
                    <td className="px-3 py-3 text-end tabular-nums">{formatNumber(o.items.reduce((s, i) => s + i.quantity, 0))}</td>
                    <td className="px-3 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-5 py-3 text-end">
                      <Money value={o.total} className="font-medium" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="divide-y divide-line-soft border-t border-line-soft sm:hidden">
            {orders.map((o) => (
              <li key={o.id}>
                <Link to={`/orders/${o.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-mist/50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink" dir="ltr">
                      {o.number}
                    </p>
                    <p className="text-xs text-muted">
                      {formatDate(o.createdAt, lang)} · {t('common.itemsCount', { count: o.items.reduce((s, i) => s + i.quantity, 0) })}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Money value={o.total} className="text-sm font-medium" />
                    <StatusBadge status={o.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  )
}

/* ---------------- Wishlist ---------------- */

export function WishlistCard({ customer }: { customer: AdminCustomer }) {
  const { t, lang } = useT()
  const { data, loading } = useAsync(() => (customer.wishlist.length ? getAllProducts() : Promise.resolve([])), [customer.id, customer.wishlist.join(',')])
  const ids = new Set(customer.wishlist)
  const products = (data ?? []).filter((p) => ids.has(p.id))
  return (
    <Card title={t('customers.detail.wishlist')} description={products.length ? t('customers.detail.wishlistCount', { count: products.length }) : undefined}>
      {loading && !data ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <SectionEmpty icon={<Heart />} text={t('customers.detail.noWishlist')} />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {products.map((p) => (
            <li key={p.id}>
              <Link to={`/products/${p.id}`} className="group flex h-full flex-col gap-2 rounded-md border border-line-soft p-2.5 transition-colors hover:border-ink/20">
                <div className="aspect-square w-full">
                  <Thumb src={p.images[0]} alt={lang === 'ar' ? p.nameAr : p.name} className="size-full" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[11px] tracking-wide text-subtle uppercase">{p.brandName}</p>
                  <p className="line-clamp-2 text-[13px] leading-snug font-medium text-ink group-hover:text-rose-dark">{lang === 'ar' ? p.nameAr : p.name}</p>
                </div>
                <div className="mt-auto flex items-baseline gap-1.5">
                  <Money value={p.price} className="text-[13px] font-semibold" />
                  {p.compareAtPrice && p.compareAtPrice > p.price && <Money value={p.compareAtPrice} className="text-[11px] text-subtle line-through" />}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

/* ---------------- Reviews ---------------- */

export function CustomerReviewsCard({ customer }: { customer: AdminCustomer }) {
  const { t, lang } = useT()
  const { data, loading } = useAsync(() => getReviews({ filters: { customerId: customer.id }, pageSize: 50 }), [customer.id])
  const reviews = data?.items ?? []
  return (
    <Card title={t('customers.detail.reviews')} padded={false}>
      {loading && !data ? (
        <div className="px-5 pb-5">
          <ListSkeleton />
        </div>
      ) : reviews.length === 0 ? (
        <SectionEmpty icon={<MessageSquareText />} text={t('customers.detail.noReviews')} />
      ) : (
        <ul className="divide-y divide-line-soft border-t border-line-soft">
          {reviews.slice(0, 6).map((r) => (
            <li key={r.id}>
              <Link to={`/reviews/${r.id}`} className="block px-5 py-3.5 hover:bg-mist/50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <RatingStars rating={r.rating} size={12} />
                    <span className="truncate text-xs text-muted">{r.productName}</span>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <p className="mt-1.5 text-[13px] font-medium text-ink">{r.title}</p>
                <p className="mt-0.5 line-clamp-2 text-[13px] text-muted">{r.body}</p>
                <p className="mt-1 text-[11.5px] text-subtle">{timeAgo(r.createdAt, lang)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

/* ---------------- Addresses ---------------- */

export function AddressesCard({ customer }: { customer: AdminCustomer }) {
  const { t, lang } = useT()
  return (
    <Card title={t('customers.detail.addresses')}>
      {customer.addresses.length === 0 ? (
        <SectionEmpty icon={<MapPin />} text={t('customers.detail.noAddresses')} />
      ) : (
        <ul className="grid grid-cols-1 gap-3">
          {customer.addresses.map((a, i) => (
            <li key={i} className="rounded-md border border-line-soft p-3.5 text-[13px]">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-ink">{a.fullName}</p>
                {i === 0 && <Badge tone="neutral">{t('customers.detail.defaultAddress')}</Badge>}
              </div>
              <p className="mt-1 text-muted">
                {a.street}, {t('customers.detail.building', { value: a.building })}
                {a.apartment ? `, ${t('customers.detail.apartment', { value: a.apartment })}` : ''}
              </p>
              <p className="text-muted">
                {a.district}, {cityName(a.city, lang)} <span dir="ltr">{a.postalCode}</span>
              </p>
              <p className="mt-1 text-muted tabular-nums" dir="ltr">
                {a.phone}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

/* ---------------- Support tickets ---------------- */

export function TicketsCard({ customer }: { customer: AdminCustomer }) {
  const { t, lang } = useT()
  const { data, loading } = useAsync(() => getTickets(customer.id), [customer.id])
  return (
    <Card title={t('customers.detail.tickets')} padded={false}>
      {loading && !data ? (
        <div className="px-5 pb-5">
          <ListSkeleton rows={2} />
        </div>
      ) : !data?.length ? (
        <SectionEmpty icon={<LifeBuoy />} text={t('customers.detail.noTickets')} />
      ) : (
        <ul className="divide-y divide-line-soft border-t border-line-soft">
          {[...data]
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .map((tk) => (
              <li key={tk.id} className="flex items-start justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-ink">{tk.subject}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    <span dir="ltr">#{tk.id.toUpperCase()}</span> · {formatDate(tk.createdAt, lang)}
                  </p>
                </div>
                <StatusBadge status={tk.status} />
              </li>
            ))}
        </ul>
      )}
    </Card>
  )
}

/* ---------------- Activity ---------------- */

export function CustomerActivityCard({ customer, refreshKey }: { customer: AdminCustomer; refreshKey?: unknown }) {
  const { t, lang } = useT()
  const { data, loading } = useAsync(() => getActivity({ pageSize: 10000 }), [customer.id, refreshKey])
  const items = (data?.items ?? []).filter((a) => (a.entity === 'customer' && a.entityId === customer.id) || a.description.includes(customer.name)).slice(0, 8)
  return (
    <Card title={t('customers.detail.activity')}>
      {loading && !data ? (
        <ListSkeleton rows={3} />
      ) : items.length === 0 ? (
        <SectionEmpty icon={<Activity />} text={t('customers.detail.noActivity')} />
      ) : (
        <Timeline
          items={items.map((a) => ({
            title: a.description,
            description: a.userName,
            time: timeAgo(a.date, lang),
            tone: a.status === 'failed' ? 'error' : 'done',
          }))}
        />
      )}
    </Card>
  )
}

/* ---------------- Business (professional accounts) ---------------- */

export function BusinessCard({ customer }: { customer: AdminCustomer }) {
  const { t } = useT()
  return (
    <Card title={t('customers.detail.business')} className="border-champagne/40">
      <KeyValue
        items={[
          { label: t('customers.detail.businessName'), value: customer.businessName ?? '—' },
          { label: t('customers.detail.businessType'), value: customer.businessType ? t(`salonTypes.${customer.businessType}`) : '—' },
          { label: t('customers.detail.contactPerson'), value: customer.contactPerson ?? customer.name },
        ]}
      />
    </Card>
  )
}
