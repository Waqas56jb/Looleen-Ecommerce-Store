import { useSearchParams } from 'react-router-dom'
import { CategoryForm } from '@/components/categories/CategoryForm'
import { ErrorState, PageHeader, PageSkeleton } from '@/components/ui'
import { useAsync, useDocumentTitle } from '@/hooks'
import { useT } from '@/i18n'
import { getCategories } from '@/services/catalogService'

export default function CategoryCreatePage() {
  const { t } = useT()
  useDocumentTitle(t('catalog.categoryForm.newTitle'))
  const [params] = useSearchParams()
  const { data, error, reload } = useAsync(() => getCategories(), [])

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('catalog.categoryForm.newTitle')}
        description={t('catalog.categoryForm.newDesc')}
        breadcrumbs={[{ label: t('nav.categories'), to: '/categories' }, { label: t('catalog.categoryForm.newTitle') }]}
      />
      {error ? (
        <div className="card">
          <ErrorState onRetry={reload} />
        </div>
      ) : !data ? (
        <PageSkeleton stats={0} rows={8} />
      ) : (
        <CategoryForm categories={data} defaultParent={params.get('parent')} />
      )}
    </div>
  )
}
