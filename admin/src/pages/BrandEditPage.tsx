import { useParams } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import { BrandForm } from '@/components/brands/BrandForm'
import { EmptyState, ErrorState, PageHeader, PageSkeleton, StatusBadge } from '@/components/ui'
import { useAsync, useDocumentTitle } from '@/hooks'
import { useT } from '@/i18n'
import { getAllBrands } from '@/services/catalogService'

export default function BrandEditPage() {
  const { id = '' } = useParams()
  const { t } = useT()
  const { data, loading, error, reload } = useAsync(() => getAllBrands(), [id])
  const brand = data?.find((b) => b.id === id)
  useDocumentTitle(brand ? `${t('catalog.brandForm.editTitle')} · ${brand.name}` : t('catalog.brandForm.editTitle'))

  if (error)
    return (
      <div className="card">
        <ErrorState onRetry={reload} />
      </div>
    )
  if (loading && !data) return <PageSkeleton stats={0} rows={8} />
  if (!brand)
    return (
      <div className="card">
        <EmptyState icon={<SearchX />} title={t('catalog.brandForm.notFoundTitle')} description={t('catalog.brandForm.notFoundDesc')} action={{ label: t('catalog.brandForm.backToList'), to: '/brands' }} />
      </div>
    )
  return (
    <div className="animate-fade-in">
      <PageHeader
        title={brand.name}
        description={t('catalog.brandForm.editDesc')}
        meta={<StatusBadge status={brand.status} />}
        breadcrumbs={[{ label: t('nav.brands'), to: '/brands' }, { label: brand.name, to: `/brands/${brand.id}` }, { label: t('common.edit') }]}
      />
      <BrandForm key={brand.id} existing={data!} initial={brand} />
    </div>
  )
}
