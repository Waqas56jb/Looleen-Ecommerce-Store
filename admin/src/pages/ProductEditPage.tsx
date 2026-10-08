import { useParams } from 'react-router-dom'
import { PackageSearch } from 'lucide-react'
import { ProductForm } from '@/components/products/ProductForm'
import { EmptyState, ErrorState, PageHeader, PageSkeleton, StatusBadge } from '@/components/ui'
import { useAsync, useDocumentTitle } from '@/hooks'
import { useT } from '@/i18n'
import { getProduct } from '@/services/productService'

export default function ProductEditPage() {
  const { id = '' } = useParams()
  const { t } = useT()
  const { data: product, loading, error, reload } = useAsync(() => getProduct(id), [id])
  useDocumentTitle(product ? `${t('products.editTitle')} · ${product.name}` : t('products.editTitle'))

  if (loading && !product) return <PageSkeleton stats={0} rows={8} />
  if (error) return <ErrorState onRetry={reload} className="card" />
  if (!product)
    return (
      <div className="card">
        <EmptyState icon={<PackageSearch />} title={t('products.edit.notFound')} description={t('products.edit.notFoundDesc')} action={{ label: t('products.edit.back'), to: '/products' }} />
      </div>
    )

  return (
    <>
      <PageHeader
        title={product.name}
        meta={<StatusBadge status={product.derivedStatus} />}
        description={t('products.editDescription')}
        breadcrumbs={[{ label: t('nav.catalog') }, { label: t('products.title'), to: '/products' }, { label: product.name, to: `/products/${product.id}` }, { label: t('common.edit') }]}
      />
      <ProductForm key={product.id} product={product} />
    </>
  )
}
