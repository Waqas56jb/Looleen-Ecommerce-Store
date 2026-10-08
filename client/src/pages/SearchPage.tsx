import { useNavigate, useSearchParams } from 'react-router-dom'
import { Breadcrumbs, TrustBar } from '@/components/common'
import {
  BestSellersRail,
  CatalogView,
  PopularSearches,
  SearchCategories,
  SearchNoResults,
  SearchRefineForm,
  useCatalogQuery,
  useResultCountLabel,
} from '@/components/category'
import { useDocumentMeta } from '@/hooks'
import { useT } from '@/i18n'

export default function SearchPage() {
  const [sp] = useSearchParams()
  const navigate = useNavigate()
  const { t } = useT()
  const countLabel = useResultCountLabel()
  const q = (sp.get('q') ?? '').trim()
  const catalog = useCatalogQuery({ query: q }, { enabled: !!q })
  const baseTotal = catalog.facetsLoading ? undefined : catalog.facets?.total

  useDocumentMeta(q ? t('catalog.search.title', { query: q }) : t('nav.searchTitle'))

  // A new query starts a fresh search (filters from the previous query no longer apply)
  const submit = (next: string) => navigate(next ? `/search?q=${encodeURIComponent(next)}` : '/search')

  return (
    <div className="animate-fade-in">
      <header className="bg-blush/40">
        <div className="container-x py-10 sm:py-14">
          <Breadcrumbs items={[{ label: t('nav.searchTitle') }]} />
          <p className="eyebrow mt-8">{t('catalog.search.eyebrow')}</p>
          <h1 className="heading-page mt-3 text-balance break-words">{q ? t('catalog.search.title', { query: q }) : t('catalog.search.startTitle')}</h1>
          <p className="mt-3 min-h-6 text-[15px] text-muted" aria-live="polite">
            {q ? (baseTotal !== undefined ? countLabel(baseTotal) : ' ') : t('catalog.search.startDesc')}
          </p>
          <SearchRefineForm query={q} onSubmit={submit} className="mt-7" />
          {!q && <PopularSearches className="mt-8" />}
        </div>
      </header>

      {!q ? (
        <>
          <SearchCategories />
          <BestSellersRail />
        </>
      ) : baseTotal === 0 ? (
        <SearchNoResults query={q} />
      ) : (
        <>
          <div className="container-x pt-8">
            <TrustBar variant="strip" />
          </div>
          <CatalogView catalog={catalog} />
        </>
      )}
    </div>
  )
}
