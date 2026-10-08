import { BrandForm } from '@/components/brands/BrandForm'
import { ErrorState, PageHeader, PageSkeleton } from '@/components/ui'
import { useAsync, useDocumentTitle } from '@/hooks'
import { useT } from '@/i18n'
import { getAllBrands } from '@/services/catalogService'

export default function BrandCreatePage() {
  const { t } = useT()
  useDocumentTitle(t('catalog.brandForm.newTitle'))
  const { data, error, reload } = useAsync(() => getAllBrands(), [])
  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('catalog.brandForm.newTitle')}
        description={t('catalog.brandForm.newDesc')}
        breadcrumbs={[{ label: t('nav.brands'), to: '/brands' }, { label: t('catalog.brandForm.newTitle') }]}
      />
      {error ? (
        <div className="card">
          <ErrorState onRetry={reload} />
        </div>
      ) : !data ? (
        <PageSkeleton stats={0} rows={8} />
      ) : (
        <BrandForm existing={data} />
      )}
    </div>
  )
}
