import { Link, useNavigate, useParams } from 'react-router-dom'
import { BadgeCheck, Check, ChevronRight, EyeOff, ThumbsUp, Trash2, X } from 'lucide-react'
import { Avatar, Badge, Button, ButtonLink, Card, EmptyState, ErrorState, Img, KeyValue, Money, PageHeader, PageSkeleton, RatingStars, StatusBadge, Thumb } from '@/components/ui'
import { CustomerTypeBadge } from '@/components/customers/shared'
import { ReviewReply } from '@/components/reviews/ReviewReply'
import { useReviewModeration } from '@/components/reviews/ReviewModeration'
import { useAsync, useDocumentTitle } from '@/hooks'
import { useT } from '@/i18n'
import { getCustomer } from '@/services/customerService'
import { getReview } from '@/services/moderationService'
import { getProduct } from '@/services/productService'
import { cityName, formatDate, formatDateTime, formatNumber } from '@/utils'

export default function ReviewDetailPage() {
  const { id = '' } = useParams()
  const { t, lang } = useT()
  const navigate = useNavigate()
  const { data: review, loading, error, reload } = useAsync(() => getReview(id), [id])
  const related = useAsync(async () => (review ? Promise.all([getCustomer(review.customerId), getProduct(review.productId)]) : undefined), [review?.customerId, review?.productId])
  const [customer, product] = related.data ?? []
  const mod = useReviewModeration({ onChanged: reload, onDeleted: () => navigate('/reviews', { replace: true }) })
  useDocumentTitle(review ? t('customers.reviews.detail.reviewBy', { name: review.customerName }) : t('customers.reviews.title'))

  const crumbs = [{ label: t('nav.reviews'), to: '/reviews' }]
  if (loading && !review) return <PageSkeleton stats={0} rows={4} />
  if (error) return <ErrorState onRetry={reload} />
  if (!review)
    return (
      <>
        <PageHeader title={t('customers.reviews.detail.notFoundTitle')} breadcrumbs={crumbs} />
        <div className="card">
          <EmptyState title={t('customers.reviews.detail.notFoundTitle')} description={t('customers.reviews.detail.notFoundDesc')} action={{ label: t('customers.reviews.detail.backToList'), to: '/reviews' }} />
        </div>
      </>
    )

  const r = review
  const busy = mod.busyId === r.id
  const productName = product ? (lang === 'ar' ? product.nameAr : product.name) : r.productName

  return (
    <>
      <PageHeader
        title={t('customers.reviews.detail.reviewBy', { name: r.customerName })}
        breadcrumbs={[...crumbs, { label: r.title }]}
        meta={<StatusBadge status={r.status} />}
        description={`${r.productName} · ${formatDateTime(r.createdAt, lang)}`}
        actions={
          <>
            {r.status !== 'approved' && (
              <Button icon={<Check className="size-4" />} onClick={() => mod.approve(r)} loading={busy}>
                {t('customers.reviews.actions.approve')}
              </Button>
            )}
            {r.status !== 'rejected' && (
              <Button variant="outline" icon={<X className="size-4" />} onClick={() => mod.reject(r)} disabled={busy}>
                {t('customers.reviews.actions.reject')}
              </Button>
            )}
            {r.status !== 'hidden' && (
              <Button variant="outline" icon={<EyeOff className="size-4" />} onClick={() => mod.hide(r)} disabled={busy}>
                {t('customers.reviews.actions.hide')}
              </Button>
            )}
            <Button variant="ghost" className="text-error hover:bg-error-soft" icon={<Trash2 className="size-4" />} onClick={() => mod.remove(r)} disabled={busy}>
              {t('customers.reviews.actions.delete')}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
          <Card>
            <div className="flex flex-wrap items-center gap-3">
              <RatingStars rating={r.rating} size={18} />
              <span className="text-sm font-semibold text-ink tabular-nums">{r.rating.toFixed(1)}</span>
              {r.verified ? (
                <Badge tone="success" icon={<BadgeCheck />}>
                  {t('customers.reviews.detail.verified')}
                </Badge>
              ) : (
                <Badge>{t('customers.reviews.detail.unverified')}</Badge>
              )}
            </div>
            <h2 className="mt-4 text-lg font-semibold text-ink">{r.title}</h2>
            <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-ink/85">{r.body}</p>
            {r.images.length > 0 && (
              <div className="mt-5">
                <p className="eyebrow mb-2">{t('customers.reviews.detail.images')}</p>
                <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {r.images.map((src, i) => (
                    <li key={i}>
                      <a href={src.startsWith('http') ? src : undefined} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-md border border-line-soft">
                        <Img src={src} alt={t('customers.reviews.detail.image', { index: i + 1 })} w={320} h={320} className="aspect-square w-full" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-line-soft pt-4 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <ThumbsUp className="size-3.5" aria-hidden />
                {t('customers.reviews.detail.helpful', { count: formatNumber(r.helpful) })}
              </span>
              <span>{formatDateTime(r.createdAt, lang)}</span>
            </div>
          </Card>

          <ReviewReply key={`${r.id}-${r.reply?.date ?? 'none'}`} review={r} onSaved={reload} />
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Card title={t('customers.reviews.detail.customer')}>
            <Link to={`/customers/${r.customerId}`} className="group flex items-center gap-3 rounded-md">
              <Avatar name={r.customerName} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="truncate font-medium text-ink group-hover:text-rose-dark">{r.customerName}</p>
                  {customer && <CustomerTypeBadge type={customer.customerType} />}
                </div>
                {customer && (
                  <p className="truncate text-xs text-muted">
                    <span dir="ltr">{customer.email}</span> · {cityName(customer.city, lang)}
                  </p>
                )}
              </div>
              <ChevronRight className="size-4 text-subtle rtl:-scale-x-100" aria-hidden />
            </Link>
            <ButtonLink to={`/customers/${r.customerId}`} variant="outline" size="sm" className="mt-4 w-full">
              {t('customers.reviews.detail.viewProfile')}
            </ButtonLink>
          </Card>

          <Card title={t('customers.reviews.detail.product')}>
            <Link to={`/products/${r.productId}`} className="group flex items-center gap-3">
              <Thumb src={product?.images[0]} alt={productName} size="lg" />
              <div className="min-w-0 flex-1">
                {product && <p className="text-[11px] tracking-wide text-subtle uppercase">{product.brandName}</p>}
                <p className="line-clamp-2 text-[13px] font-medium text-ink group-hover:text-rose-dark">{productName}</p>
                {product && <Money value={product.price} className="mt-0.5 text-[13px]" />}
              </div>
            </Link>
            {product && (
              <div className="mt-3 flex items-center gap-2 text-xs text-muted">
                <RatingStars rating={product.rating} size={11} showValue />
                <span>({formatNumber(product.reviewCount)})</span>
              </div>
            )}
            <ButtonLink to={`/products/${r.productId}`} variant="outline" size="sm" className="mt-4 w-full">
              {t('customers.reviews.detail.viewProduct')}
            </ButtonLink>
          </Card>

          <Card title={t('customers.reviews.detail.moderation')}>
            <KeyValue
              items={[
                { label: t('customers.reviews.detail.status'), value: <StatusBadge status={r.status} /> },
                { label: t('customers.reviews.detail.rating'), value: <RatingStars rating={r.rating} showValue /> },
                { label: t('customers.reviews.detail.submitted'), value: formatDate(r.createdAt, lang) },
                { label: t('customers.reviews.detail.verified'), value: r.verified ? t('common.yes') : t('common.no') },
              ]}
            />
          </Card>
        </div>
      </div>
      {mod.dialogs}
    </>
  )
}
