import { useParams } from 'react-router-dom'
import { PackageOpen, SearchX } from 'lucide-react'
import { CategorySkeleton, EmptyState, ErrorState, TrustBar } from '@/components/common'
import { BrandHero } from '@/components/brand'
import { CatalogView, useCatalogQuery, useResultCountLabel, type FacetKey } from '@/components/category'
import { useAsync, useDocumentMeta } from '@/hooks'
import { useT } from '@/i18n'
import { getBrandBySlug } from '@/services/catalogService'

const HIDDEN: FacetKey[] = ['brands']

export default function BrandPage() {
  const { slug = '' } = useParams()
  const { t, l } = useT()
  const countLabel = useResultCountLabel()
  const { data: brand, loading, error, reload } = useAsync(() => getBrandBySlug(slug), [slug])
  const catalog = useCatalogQuery({ brands: brand ? [brand.id] : [] }, { hidden: HIDDEN, enabled: !!brand })

  useDocumentMeta(brand?.name ?? (loading ? undefined : t('catalog.brand.notFoundTitle')), brand ? l(brand.description) : undefined)

  if (error) return <ErrorState onRetry={reload} className="container-x" />
  if (loading && !brand) return <CategorySkeleton />
  if (!brand)
    return (
      <div className="container-x">
        <EmptyState icon={<SearchX />} title={t('catalog.brand.notFoundTitle')} description={t('catalog.brand.notFoundDesc')} action={{ label: t('catalog.brand.allBrands'), to: '/brands' }} />
      </div>
    )

  return (
    <div className="animate-fade-in">
      <BrandHero brand={brand} countLabel={countLabel} />
      <div className="container-x">
        <TrustBar variant="strip" />
      </div>
      <CatalogView
        catalog={catalog}
        emptyState={<EmptyState icon={<PackageOpen />} title={t('catalog.brand.empty', { brand: brand.name })} action={{ label: t('catalog.brand.allBrands'), to: '/brands' }} />}
      />
    </div>
  )
}
