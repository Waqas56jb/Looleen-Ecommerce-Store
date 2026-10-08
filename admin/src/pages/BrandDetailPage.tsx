import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ExternalLink, Globe, MapPin, MessageSquareText, Package, Pencil, Plus, SearchX, ShieldCheck, ShoppingBag, Star, Trash2, TrendingUp } from 'lucide-react'
import { AuthorizedBadge, BrandLogo, STOREFRONT_URL, useCountryName } from '@/components/brands/shared'
import { useBrandActions } from '@/components/brands/useBrandActions'
import { Badge, Button, ButtonLink, Card, DataTable, EmptyState, ErrorState, Img, KeyValue, Money, PageHeader, PageSkeleton, RatingStars, StatCard, StatusBadge, Thumb, buttonClass, type Column } from '@/components/ui'
import { useAsync, useDocumentTitle } from '@/hooks'
import { useT } from '@/i18n'
import { getBrand } from '@/services/catalogService'
import { getReviews } from '@/services/moderationService'
import { getProducts, type ProductRow } from '@/services/productService'
import { cn, formatDate, formatNumber, timeAgo } from '@/utils'

export default function BrandDetailPage() {
  const { id = '' } = useParams()
  const { t, l, lang } = useT()
  const navigate = useNavigate()
  const countryName = useCountryName()
  const brand = useAsync(() => getBrand(id), [id])
  const products = useAsync(() => getProducts({ filters: { brandId: id }, sortBy: 'unitsSold', sortDir: 'desc', page: 1, pageSize: 10000 }), [id])
  const reviews = useAsync(() => getReviews({ page: 1, pageSize: 10000, sortBy: 'createdAt', sortDir: 'desc' }), [])
  const b = brand.data
  useDocumentTitle(b?.name ?? t('nav.brands'))
  const actions = useBrandActions({ onChanged: brand.reload, onDeleted: () => navigate('/brands') })

  const items = products.data?.items
  const metrics = useMemo(() => {
    const list = items ?? []
    const reviewCount = list.reduce((s, p) => s + p.reviewCount, 0)
    const weighted = list.reduce((s, p) => s + p.rating * p.reviewCount, 0)
    return {
      count: list.length,
      active: list.filter((p) => p.derivedStatus === 'active').length,
      revenue: list.reduce((s, p) => s + p.revenue, 0),
      units: list.reduce((s, p) => s + p.unitsSold, 0),
      rating: reviewCount ? weighted / reviewCount : 0,
      reviewCount,
    }
  }, [items])

  const latestReviews = useMemo(() => {
    const ids = new Set((items ?? []).map((p) => p.id))
    return (reviews.data?.items ?? []).filter((r) => ids.has(r.productId)).slice(0, 5)
  }, [items, reviews.data])

  if (brand.error)
    return (
      <div className="card">
        <ErrorState onRetry={brand.reload} />
      </div>
    )
  if (brand.loading && !b) return <PageSkeleton stats={4} rows={6} />
  if (!b)
    return (
      <div className="card">
        <EmptyState icon={<SearchX />} title={t('catalog.brandForm.notFoundTitle')} description={t('catalog.brandForm.notFoundDesc')} action={{ label: t('catalog.brandForm.backToList'), to: '/brands' }} />
      </div>
    )

  const storefrontUrl = `${STOREFRONT_URL}/brand/${b.slug}`
  const columns: Column<ProductRow>[] = [
    {
      id: 'product',
      header: t('catalog.brandDetail.colProduct'),
      mobile: 'title',
      cell: (p) => (
        <div className="flex min-w-0 items-center gap-3">
          <Thumb src={p.images[0]} alt={p.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{lang === 'ar' && p.nameAr ? p.nameAr : p.name}</p>
            <p className="truncate text-xs text-muted" dir="ltr">
              {p.sku}
            </p>
          </div>
        </div>
      ),
    },
    { id: 'price', header: t('catalog.brandDetail.colPrice'), align: 'end', cell: (p) => <Money value={p.price} />, mobile: 'end' },
    {
      id: 'stock',
      header: t('catalog.brandDetail.colStock'),
      align: 'end',
      mobile: 'meta',
      cell: (p) => <span className={cn('tabular-nums', p.stock <= 0 ? 'font-medium text-error' : p.stock <= p.lowStockThreshold ? 'font-medium text-warning' : 'text-ink')}>{formatNumber(p.stock)}</span>,
    },
    { id: 'units', header: t('catalog.brandDetail.colUnits'), align: 'end', mobile: 'meta', cell: (p) => <span className="tabular-nums">{formatNumber(p.unitsSold)}</span> },
  ]

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={b.name}
        breadcrumbs={[{ label: t('nav.brands'), to: '/brands' }, { label: b.name }]}
        meta={
          <>
            <StatusBadge status={b.status} />
            {b.featured && (
              <Badge tone="champagne" icon={<Star className="fill-current" />}>
                {t('common.featured')}
              </Badge>
            )}
          </>
        }
        actions={
          <>
            <a href={storefrontUrl} target="_blank" rel="noreferrer" className={buttonClass('outline')}>
              <ExternalLink className="size-4" />
              {t('catalog.brandDetail.viewStorefront')}
            </a>
            <ButtonLink variant="outline" to={`/products/new?brand=${b.id}`} icon={<Plus className="size-4" />}>
              {t('catalog.brandDetail.addProduct')}
            </ButtonLink>
            <ButtonLink to={`/brands/${b.id}/edit`} icon={<Pencil className="size-4" />}>
              {t('common.edit')}
            </ButtonLink>
          </>
        }
      />

      {/* Hero */}
      <section className="card overflow-hidden">
        <div className="relative h-44 bg-blush sm:h-60">
          <Img src={b.banner} alt="" w={1400} className="absolute inset-0 size-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/35 to-ink/10" aria-hidden />
          <div className="absolute inset-x-0 bottom-0 flex items-end gap-4 p-4 text-white sm:p-6">
            <BrandLogo name={b.name} logo={b.logo} size="lg" className="shadow-pop max-sm:size-14 max-sm:text-base" />
            <div className="min-w-0">
              <p className="truncate font-serif text-2xl leading-tight sm:text-4xl">{b.name}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-white/80">
                <span dir="rtl">{b.nameAr}</span>
                {b.country && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5" aria-hidden />
                    {countryName(b.country)}
                  </span>
                )}
                {b.website && (
                  <a href={b.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline-offset-4 hover:text-white hover:underline" dir="ltr">
                    <Globe className="size-3.5" aria-hidden />
                    {b.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                  </a>
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-4 p-5">
          {b.authorized ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success-soft px-3 py-1 text-xs font-medium text-success">
                <ShieldCheck className="size-4" />
                {t('catalog.brandForm.authorizedBadge')}
              </span>
              <p className="text-[13px] text-muted">{t('catalog.brandDetail.authorizedNote')}</p>
            </div>
          ) : (
            <div className="flex gap-3 rounded-md border border-warning/25 bg-warning-soft p-4" role="note">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-ink">{t('catalog.brandDetail.notAuthorizedTitle')}</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{t('catalog.brandDetail.notAuthorizedBody')}</p>
              </div>
            </div>
          )}
          {l(b.description) && <p className="max-w-3xl text-sm leading-relaxed text-ink">{l(b.description)}</p>}
        </div>
      </section>

      {/* KPIs */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t('catalog.brandDetail.products')} value={formatNumber(metrics.count)} icon={<Package />} loading={!items} period={t('catalog.brandDetail.activeMeta', { count: metrics.active })} href={`/products?brand=${b.id}`} />
        <StatCard label={t('catalog.brandDetail.revenue')} value={<Money value={metrics.revenue} />} icon={<TrendingUp />} loading={!items} period={t('catalog.brandDetail.allTime')} />
        <StatCard label={t('catalog.brandDetail.unitsSold')} value={formatNumber(metrics.units)} icon={<ShoppingBag />} loading={!items} period={t('catalog.brandDetail.allTime')} />
        <StatCard
          label={t('catalog.brandDetail.avgRating')}
          value={metrics.reviewCount ? metrics.rating.toFixed(1) : '—'}
          icon={<Star />}
          loading={!items}
          period={metrics.reviewCount ? <RatingStars rating={metrics.rating} /> : undefined}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <div>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-semibold text-ink">{t('catalog.brandDetail.topProducts')}</h2>
                <p className="text-[13px] text-muted">{t('catalog.brandDetail.topProductsDesc')}</p>
              </div>
              {metrics.count > 8 && (
                <Link to={`/products?brand=${b.id}`} className="shrink-0 text-[13px] font-medium text-rose hover:underline">
                  {t('catalog.brandDetail.viewAllProducts')}
                </Link>
              )}
            </div>
            <DataTable
              columns={columns}
              rows={items?.slice(0, 8)}
              rowKey={(p) => p.id}
              loading={products.loading}
              error={products.error}
              onRetry={products.reload}
              onRowClick={(p) => navigate(`/products/${p.id}`)}
              dense
              empty={<EmptyState icon={<Package />} title={t('catalog.brandDetail.noProductsTitle')} description={t('catalog.brandDetail.noProductsDesc')} action={{ label: t('catalog.brandDetail.addProduct'), to: `/products/new?brand=${b.id}` }} />}
            />
          </div>

          <Card title={t('catalog.brandDetail.reviews')} description={t('catalog.brandDetail.reviewsDesc')} padded={false}>
            {reviews.loading && !reviews.data ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="skeleton h-16" />
                ))}
              </div>
            ) : latestReviews.length === 0 ? (
              <EmptyState icon={<MessageSquareText />} title={t('catalog.brandDetail.noReviews')} className="py-10" />
            ) : (
              <ul className="divide-y divide-line-soft border-t border-line-soft">
                {latestReviews.map((r) => (
                  <li key={r.id}>
                    <Link to={`/reviews/${r.id}`} className="block px-5 py-4 transition-colors hover:bg-mist/60">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <RatingStars rating={r.rating} />
                          <span className="text-[13px] font-medium text-ink">{r.title}</span>
                        </div>
                        <StatusBadge status={r.status} />
                      </div>
                      <p className="mt-1 line-clamp-2 text-[13px] text-muted">{r.body}</p>
                      <p className="mt-1.5 text-xs text-subtle">
                        {r.customerName} · {r.productName} · {timeAgo(r.createdAt, lang)}
                        {r.verified && <span className="text-success"> · {t('catalog.brandDetail.verifiedPurchase')}</span>}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <Card title={t('catalog.brandDetail.distributorCard')}>
            <div className="mb-4 flex items-center gap-3 rounded-md bg-mist p-3">
              <span className={cn('grid size-9 shrink-0 place-items-center rounded-full', b.authorized ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning')}>
                {b.authorized ? <ShieldCheck className="size-4" /> : <AlertTriangle className="size-4" />}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-ink">{b.distributor || t('catalog.brandDetail.notSet')}</p>
                <p className="text-xs text-muted">{t('catalog.brandDetail.distributorName')}</p>
              </div>
            </div>
            <KeyValue
              items={[
                { label: t('catalog.brandDetail.authorization'), value: <AuthorizedBadge authorized={b.authorized} /> },
                { label: t('catalog.brandDetail.country'), value: b.country ? countryName(b.country) : t('catalog.brandDetail.notSet') },
                {
                  label: t('catalog.brandDetail.website'),
                  value: b.website ? (
                    <a href={b.website} target="_blank" rel="noreferrer" className="text-rose hover:underline" dir="ltr">
                      {b.website.replace(/^https?:\/\//, '')}
                    </a>
                  ) : (
                    t('catalog.brandDetail.notSet')
                  ),
                },
                { label: t('catalog.brandDetail.slug'), value: <code dir="ltr" className="text-xs">/{b.slug}</code> },
                { label: t('catalog.brandDetail.created'), value: formatDate(b.createdAt, lang) },
              ]}
            />
          </Card>

          <Card title={t('common.actions')}>
            <div className="flex flex-col gap-2">
              <Button variant="outline" fullWidth onClick={() => actions.toggleFeatured(b)} icon={<Star className={cn('size-4', b.featured && 'fill-champagne text-champagne')} />}>
                {b.featured ? t('catalog.brands.unfeature') : t('catalog.brands.feature')}
              </Button>
              <Button variant="outline" fullWidth onClick={() => actions.toggleStatus(b)}>
                {b.status === 'active' ? t('catalog.brands.deactivate') : t('catalog.brands.activate')}
              </Button>
              <Button variant="ghost" fullWidth className="text-error hover:bg-error-soft" onClick={() => actions.requestDelete(b)} icon={<Trash2 className="size-4" />}>
                {t('common.delete')}
              </Button>
            </div>
          </Card>
        </div>
      </div>
      {actions.dialog}
    </div>
  )
}
