import { useParams } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { CategorySkeleton, EmptyState, ErrorState, TrustBar } from '@/components/common'
import { CatalogView, CategoryHeader, ProCallout, SubcategoryChips, useCatalogQuery, useResultCountLabel } from '@/components/category'
import { useAsync, useDocumentMeta } from '@/hooks'
import { useT } from '@/i18n'
import { getCategoryBySlug, getCategoryCounts } from '@/services/catalogService'

export default function CategoryPage() {
  const { slug = '' } = useParams()
  const { t, l } = useT()
  const countLabel = useResultCountLabel()
  const found = useAsync(() => getCategoryBySlug(slug), [slug])
  const counts = useAsync(() => getCategoryCounts(), [])
  const match = found.data
  // `category` in ProductFilters matches either a top category or a subcategory slug
  const catalog = useCatalogQuery({ category: slug }, { enabled: !!match })

  const name = match ? l(match.kind === 'subcategory' ? match.sub.name : match.category.name) : undefined
  useDocumentMeta(name ?? (found.loading ? undefined : t('catalog.category.notFoundTitle')), match ? l(match.category.description) : undefined)

  if (found.error) return <ErrorState onRetry={found.reload} className="container-x" />
  if (found.loading && !match) return <CategorySkeleton />
  if (!match)
    return (
      <div className="container-x">
        <EmptyState
          icon={<Compass />}
          title={t('catalog.category.notFoundTitle')}
          description={t('catalog.category.notFoundDesc')}
          action={{ label: t('catalog.category.backHome'), to: '/' }}
        />
      </div>
    )

  const { category } = match
  const sub = match.kind === 'subcategory' ? match.sub : undefined

  return (
    <div className="animate-fade-in">
      <CategoryHeader category={category} sub={sub} productCount={counts.data?.[slug]} countLabel={countLabel} />
      <SubcategoryChips category={category} activeSlug={slug} counts={counts.data} />
      {category.slug === 'salon-supplies' && <ProCallout />}
      <div className="container-x pt-8">
        <TrustBar variant="strip" />
      </div>
      <CatalogView catalog={catalog} />
    </div>
  )
}
