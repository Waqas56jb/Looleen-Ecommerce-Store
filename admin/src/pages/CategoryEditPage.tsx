import { useParams } from 'react-router-dom'
import { FolderX } from 'lucide-react'
import { CategoryForm } from '@/components/categories/CategoryForm'
import { EmptyState, ErrorState, PageHeader, PageSkeleton, StatusBadge } from '@/components/ui'
import { useAsync, useDocumentTitle } from '@/hooks'
import { useT } from '@/i18n'
import { getCategories } from '@/services/catalogService'

export default function CategoryEditPage() {
  const { id = '' } = useParams()
  const { t, l } = useT()
  const { data, loading, error, reload } = useAsync(() => getCategories(), [id])
  const category = data?.find((c) => c.id === id)
  useDocumentTitle(category ? `${t('catalog.categoryForm.editTitle')} · ${l(category.name)}` : t('catalog.categoryForm.editTitle'))

  if (error)
    return (
      <div className="card">
        <ErrorState onRetry={reload} />
      </div>
    )
  if (loading && !data) return <PageSkeleton stats={0} rows={8} />
  if (!category)
    return (
      <div className="card">
        <EmptyState icon={<FolderX />} title={t('catalog.categoryForm.notFoundTitle')} description={t('catalog.categoryForm.notFoundDesc')} action={{ label: t('catalog.categoryForm.backToList'), to: '/categories' }} />
      </div>
    )

  const parent = data!.find((c) => c.id === category.parentId)
  return (
    <div className="animate-fade-in">
      <PageHeader
        title={l(category.name)}
        description={t('catalog.categoryForm.editDesc')}
        meta={<StatusBadge status={category.status} />}
        breadcrumbs={[
          { label: t('nav.categories'), to: '/categories' },
          ...(parent ? [{ label: l(parent.name), to: `/categories/${parent.id}/edit` }] : []),
          { label: l(category.name) },
        ]}
      />
      <CategoryForm key={category.id} categories={data!} initial={category} />
    </div>
  )
}
