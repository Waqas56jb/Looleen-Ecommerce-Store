import { Gift, Heart, Package, Sparkles, Truck } from 'lucide-react'
import { AccountPageHeader, Panel, PanelSkeleton, StatCard } from '@/components/account/AccountUI'
import { AddressCard } from '@/components/account/AddressCard'
import { OrderList } from '@/components/account/OrderList'
import { firstName, loyaltyTier } from '@/components/account/shell'
import { ArrowLink, ButtonLink, EmptyState, ErrorState, ProgressBar, SectionHeading } from '@/components/common'
import { ProductRail } from '@/components/product'
import { STORE_CONFIG } from '@/config/store'
import { loyaltyRewards } from '@/data/account'
import { useAsync, useDocumentMeta } from '@/hooks'
import { useT } from '@/i18n'
import { getOrders } from '@/services/orderService'
import { getBestSellingProducts } from '@/services/productService'
import { useAccountStore } from '@/store/account'
import { useAuthStore } from '@/store/auth'
import { useWishlistStore } from '@/store/wishlist'
import { formatPrice } from '@/utils'

export default function AccountPage() {
  const { t, l, lang } = useT()
  useDocumentMeta(t('account.dashboard.metaTitle'), t('account.dashboard.metaDesc'))
  const user = useAuthStore((s) => s.user)
  const wishCount = useWishlistStore((s) => s.ids.length)
  const defaultAddress = useAccountStore((s) => s.addresses.find((a) => a.isDefault) ?? s.addresses[0])
  const orders = useAsync(() => getOrders(), [])
  const recommended = useAsync(() => getBestSellingProducts(8), [])

  if (!user) return null
  const points = user.loyaltyPoints
  const pending = orders.data?.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length ?? 0
  const nextReward = [...loyaltyRewards].sort((a, b) => a.points - b.points).find((r) => r.points > points)
  const tier = loyaltyTier(points)
  const value = (points / 100) * STORE_CONFIG.loyalty.sarPerHundredPoints

  return (
    <div className="space-y-10 lg:space-y-12">
      <AccountPageHeader eyebrow={t(`account.loyalty.tier`, { tier: t(`account.loyalty.tiers.${tier.current.id}`) })} title={t('account.dashboard.welcome', { name: firstName(user.name) })} description={t('account.dashboard.desc')} />

      <ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <li><StatCard icon={<Package />} label={t('account.dashboard.totalOrders')} value={orders.loading ? '–' : (orders.data?.length ?? 0)} /></li>
        <li><StatCard icon={<Truck />} label={t('account.dashboard.pendingOrders')} value={orders.loading ? '–' : pending} /></li>
        <li><StatCard accent icon={<Sparkles />} label={t('account.dashboard.loyaltyPoints')} value={points.toLocaleString('en-US')} hint={t('account.loyalty.worth', { amount: formatPrice(value, lang) })} /></li>
        <li><StatCard icon={<Heart />} label={t('account.dashboard.wishlistItems')} value={wishCount} /></li>
      </ul>

      <section aria-labelledby="recent-orders">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 id="recent-orders" className="heading-card">{t('account.dashboard.recentOrders')}</h2>
          <ArrowLink to="/account/orders">{t('common.viewAll')}</ArrowLink>
        </div>
        {orders.loading ? (
          <PanelSkeleton />
        ) : orders.error ? (
          <ErrorState onRetry={orders.reload} />
        ) : !orders.data?.length ? (
          <div className="rounded-xs border border-line bg-white">
            <EmptyState compact icon={<Package />} title={t('empty.ordersTitle')} description={t('empty.ordersDesc')} action={{ label: t('common.shopNow'), to: '/best-sellers' }} />
          </div>
        ) : (
          <OrderList orders={orders.data.slice(0, 3)} compact />
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel title={t('account.dashboard.defaultAddress')} action={<ArrowLink to="/account/addresses">{t('account.dashboard.manage')}</ArrowLink>} bodyClassName="p-0">
          {defaultAddress ? (
            <AddressCard address={defaultAddress} className="border-0 hover:shadow-none" />
          ) : (
            <div className="p-5 sm:p-6">
              <p className="text-sm text-muted">{t('account.dashboard.noAddress')}</p>
              <ButtonLink to="/account/addresses" variant="outline" size="sm" className="mt-4">{t('account.dashboard.addAddress')}</ButtonLink>
            </div>
          )}
        </Panel>

        <section className="relative overflow-hidden rounded-xs bg-ink p-5 text-ivory sm:p-6" aria-labelledby="dash-loyalty">
          <Gift className="absolute -end-6 -top-6 size-32 text-champagne/10" strokeWidth={1} aria-hidden />
          <p className="eyebrow text-champagne">{t('account.loyalty.tier', { tier: t(`account.loyalty.tiers.${tier.current.id}`) })}</p>
          <h2 id="dash-loyalty" className="mt-2 font-serif text-2xl font-medium tracking-[-0.015em]">{t('account.dashboard.loyaltyTitle')}</h2>
          <p className="mt-4 font-serif text-5xl leading-none font-medium tabular-nums">
            {points.toLocaleString('en-US')} <span className="text-base text-ivory/60">{t('account.loyalty.pts', { points: '' }).trim()}</span>
          </p>
          {nextReward ? (
            <>
              <ProgressBar value={points / nextReward.points} className="mt-5 bg-white/15" />
              <p className="mt-3 text-sm text-ivory/75">{t('account.dashboard.toNextReward', { points: (nextReward.points - points).toLocaleString('en-US'), reward: l(nextReward.title) })}</p>
            </>
          ) : (
            <p className="mt-4 text-sm text-ivory/75">{t('account.dashboard.allRewardsUnlocked')}</p>
          )}
          <ArrowLink to="/account/loyalty" tone="light" className="mt-5">{t('account.dashboard.viewRewards')}</ArrowLink>
        </section>
      </div>

      <section aria-labelledby="recommended" className="border-t border-line pt-10">
        <SectionHeading as="h2" title={<span id="recommended">{t('account.dashboard.recommended')}</span>} description={t('account.dashboard.recommendedDesc')} action={<ArrowLink to="/best-sellers">{t('common.viewAll')}</ArrowLink>} className="[&_h2]:text-3xl sm:[&_h2]:text-4xl" />
        {recommended.error ? <ErrorState onRetry={recommended.reload} /> : <ProductRail products={recommended.data} loading={recommended.loading} />}
      </section>
    </div>
  )
}
