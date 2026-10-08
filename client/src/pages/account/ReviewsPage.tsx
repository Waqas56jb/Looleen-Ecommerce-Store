import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, MessageSquareHeart, PenLine } from 'lucide-react'
import { AccountPageHeader, Panel, PanelSkeleton } from '@/components/account/AccountUI'
import { WriteReviewModal } from '@/components/account/WriteReviewModal'
import { Button, EmptyState, ErrorState, RatingStars, SmartImage } from '@/components/common'
import { useAsync, useDocumentMeta } from '@/hooks'
import { useT } from '@/i18n'
import { getOrders } from '@/services/orderService'
import { getProductsByIds } from '@/services/productService'
import { useAccountStore } from '@/store/account'
import type { OrderItem } from '@/types'
import { formatDate } from '@/utils'

export default function ReviewsPage() {
  const { t, lang } = useT()
  useDocumentMeta(t('account.reviews.metaTitle'), t('account.reviews.metaDesc'))
  const myReviews = useAccountStore((s) => s.myReviews)
  const orders = useAsync(() => getOrders(), [])
  const reviewedKey = myReviews.map((r) => r.productId).join(',')
  const products = useAsync(() => getProductsByIds(myReviews.map((r) => r.productId)), [reviewedKey])
  const [writing, setWriting] = useState<OrderItem | null>(null)

  /** Unique products from delivered orders that haven't been reviewed yet */
  const awaiting = useMemo(() => {
    const reviewed = new Set(myReviews.map((r) => r.productId))
    const seen = new Set<string>()
    const list: { item: OrderItem; date: string }[] = []
    orders.data
      ?.filter((o) => o.status === 'delivered')
      .forEach((o) =>
        o.items.forEach((item) => {
          if (reviewed.has(item.productId) || seen.has(item.productId)) return
          seen.add(item.productId)
          list.push({ item, date: o.createdAt })
        }),
      )
    return list
  }, [orders.data, myReviews])

  return (
    <div className="space-y-8">
      <AccountPageHeader title={t('account.reviews.title')} description={t('account.reviews.desc')} />

      <Panel title={t('account.reviews.awaiting')} description={t('account.reviews.awaitingDesc')} bodyClassName="p-0">
        {orders.loading ? (
          <PanelSkeleton bare />
        ) : orders.error ? (
          <ErrorState onRetry={orders.reload} />
        ) : awaiting.length === 0 ? (
          <p className="flex items-center gap-2 p-5 text-sm text-muted sm:p-6">
            <BadgeCheck className="size-4 text-success" aria-hidden />
            {t('account.reviews.allReviewed')}
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {awaiting.map(({ item, date }) => (
              <li key={item.productId} className="flex flex-wrap items-center gap-4 p-5 sm:flex-nowrap sm:p-6">
                <Link to={`/product/${item.slug}`} className="shrink-0">
                  <SmartImage src={item.image} alt={item.name} width={140} height={175} wrapperClassName="aspect-[4/5] w-16 rounded-xs" />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="eyebrow text-muted">{item.brandName}</p>
                  <Link to={`/product/${item.slug}`} className="mt-1 block text-[15px] font-medium hover:text-rose">
                    {item.name}
                  </Link>
                  <p className="mt-1 text-xs text-muted">{t('account.reviews.purchasedOn', { date: formatDate(date, lang) })}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setWriting(item)} icon={<PenLine className="size-3.5" />} className="w-full sm:w-auto">
                  {t('account.reviews.write')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <section aria-labelledby="my-reviews">
        <h2 id="my-reviews" className="heading-card mb-4">{t('account.reviews.yours')}</h2>
        {myReviews.length === 0 ? (
          <div className="rounded-xs border border-line bg-white">
            <EmptyState compact icon={<MessageSquareHeart />} title={t('empty.reviewsTitle')} description={t('empty.reviewsDesc')} />
          </div>
        ) : (
          <ul className="space-y-4">
            {myReviews.map((r) => {
              const p = products.data?.find((x) => x.id === r.productId)
              return (
                <li key={r.id}>
                  <article className="flex gap-4 rounded-xs border border-line bg-white p-5 sm:gap-5 sm:p-6">
                    {p ? (
                      <Link to={`/product/${p.slug}`} className="shrink-0">
                        <SmartImage src={p.thumbnail} alt={p.name} width={140} height={175} wrapperClassName="aspect-[4/5] w-16 rounded-xs sm:w-20" />
                      </Link>
                    ) : (
                      <span className="skeleton aspect-[4/5] w-16 shrink-0 sm:w-20" aria-hidden />
                    )}
                    <div className="min-w-0 flex-1">
                      {p && (
                        <p className="text-xs text-muted">
                          {p.brandName} · <Link to={`/product/${p.slug}`} className="hover:text-ink">{p.name}</Link>
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <RatingStars rating={r.rating} />
                        <span className="text-xs text-muted">{formatDate(r.date, lang)}</span>
                        {r.verified && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                            <BadgeCheck className="size-3.5" aria-hidden />
                            {t('account.reviews.verified')}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-2 font-serif text-lg font-medium">{r.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted">{r.comment}</p>
                    </div>
                  </article>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <WriteReviewModal item={writing} onClose={() => setWriting(null)} />
    </div>
  )
}
