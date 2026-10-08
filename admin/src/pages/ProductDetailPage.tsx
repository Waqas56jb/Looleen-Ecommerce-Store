import { useNavigate, useParams } from 'react-router-dom'
import { Archive, Copy, PackageSearch, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import { ActivityCard, AnalyticsRow, InfoCard, InventoryCard, PricingCard, ReviewsCard, VariantsCard } from '@/components/products/ProductDetailSections'
import { ProductGallery } from '@/components/products/ProductGallery'
import { useProductActions } from '@/components/products/useProductActions'
import { Button, ButtonLink, EmptyState, ErrorState, PageHeader, PageSkeleton, StatusBadge } from '@/components/ui'
import { useAsync, useDocumentTitle } from '@/hooks'
import { useT } from '@/i18n'
import { getCategories } from '@/services/catalogService'
import { getProduct } from '@/services/productService'

export default function ProductDetailPage() {
  const { id = '' } = useParams()
  const { t } = useT()
  const navigate = useNavigate()
  const { data: p, loading, error, reload } = useAsync(() => getProduct(id), [id])
  const cats = useAsync(() => getCategories(), [])
  useDocumentTitle(p?.name ?? t('products.title'))
  const actions = useProductActions({ onChanged: reload, onDeleted: () => navigate('/products') })

  if (loading && !p) return <PageSkeleton stats={5} rows={6} />
  if (error) return <ErrorState onRetry={reload} className="card" />
  if (!p)
    return (
      <div className="card">
        <EmptyState icon={<PackageSearch />} title={t('products.edit.notFound')} description={t('products.edit.notFoundDesc')} action={{ label: t('products.edit.back'), to: '/products' }} />
      </div>
    )

  return (
    <>
      <PageHeader
        title={p.name}
        meta={
          <>
            <StatusBadge status={p.derivedStatus} />
            <span className="rounded bg-mist px-1.5 py-0.5 font-mono text-xs text-muted" dir="ltr">
              {p.sku}
            </span>
          </>
        }
        description={`${p.brandName} · ${p.subcategoryName}`}
        breadcrumbs={[{ label: t('nav.catalog') }, { label: t('products.title'), to: '/products' }, { label: p.name }]}
        actions={
          <>
            <Button variant="outline" icon={<Copy className="size-4" />} loading={actions.busyId === p.id} onClick={() => actions.duplicate(p)}>
              {t('products.actions.duplicate')}
            </Button>
            {p.status === 'archived' ? (
              <Button variant="outline" icon={<RotateCcw className="size-4" />} onClick={() => actions.confirmActivate(p)}>
                {t('products.actions.activate')}
              </Button>
            ) : (
              <Button variant="outline" icon={<Archive className="size-4" />} onClick={() => actions.confirmArchive(p)}>
                {t('products.actions.archive')}
              </Button>
            )}
            <Button variant="outline" className="text-error hover:bg-error-soft" icon={<Trash2 className="size-4" />} onClick={() => actions.confirmDelete(p)}>
              {t('products.actions.delete')}
            </Button>
            <ButtonLink to={`/products/${p.id}/edit`} icon={<Pencil className="size-4" />}>
              {t('products.actions.edit')}
            </ButtonLink>
          </>
        }
      />

      <div className="space-y-6">
        <AnalyticsRow p={p} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="min-w-0 space-y-6 lg:col-span-2">
            <InfoCard p={p} categories={cats.data ?? []} />
            <VariantsCard p={p} />
            <ReviewsCard productId={p.id} />
          </div>
          <div className="min-w-0 space-y-6 max-lg:row-start-1">
            <ProductGallery images={p.images} name={p.name} />
            <PricingCard p={p} />
            <InventoryCard p={p} />
            <ActivityCard productId={p.id} refreshKey={p.updatedAt} />
          </div>
        </div>
      </div>
      {actions.dialog}
    </>
  )
}
