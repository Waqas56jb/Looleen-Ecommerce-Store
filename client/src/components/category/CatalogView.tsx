import { useRef, useState, type ReactNode } from 'react'
import { PackageSearch, SlidersHorizontal } from 'lucide-react'
import { Button, Drawer, EmptyState, ErrorState, Pagination, ProductGridSkeleton } from '@/components/common'
import { ProductGrid } from '@/components/product'
import { useT } from '@/i18n'
import { cn } from '@/utils'
import { ActiveFilters } from './ActiveFilters'
import { FilterPanel } from './FilterPanel'
import { SortSelect, ViewToggle } from './SortSelect'
import type { CatalogQuery } from './useCatalogQuery'

export function useResultCountLabel() {
  const { t } = useT()
  return (count: number) => (count === 1 ? t('catalog.resultOne') : t('catalog.resultCount', { count: count.toLocaleString('en-US') }))
}

interface CatalogViewProps {
  catalog: CatalogQuery
  /** Shown when the base set itself is empty (no filters active) */
  emptyState?: ReactNode
  className?: string
  id?: string
}

/**
 * Full listing experience: sticky sidebar (desktop) / filter drawer (mobile),
 * toolbar with count + sort + view toggle, active chips, grid and pagination.
 */
export function CatalogView({ catalog, emptyState, className, id = 'results' }: CatalogViewProps) {
  const { t } = useT()
  const countLabel = useResultCountLabel()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const topRef = useRef<HTMLDivElement>(null)
  const { result, loading, error, reload, activeCount, clearAll, sort, setSort, view, setView, setPage } = catalog

  const total = result?.total ?? 0
  const goToPage = (n: number) => {
    setPage(n)
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const countText = !result
    ? ' '
    : result.totalPages > 1
      ? t('catalog.showing', {
          from: (result.page - 1) * result.pageSize + 1,
          to: Math.min(result.page * result.pageSize, total),
          total: total.toLocaleString('en-US'),
        })
      : countLabel(total)

  const filterHeading = (
    <div className="flex items-center justify-between pb-4">
      <h2 className="eyebrow text-ink">{t('filters.title')}</h2>
      {activeCount > 0 && (
        <button type="button" onClick={clearAll} className="text-[13px] font-medium text-rose underline-offset-4 hover:underline">
          {t('common.clearAll')}
        </button>
      )}
    </div>
  )

  let body: ReactNode
  if (error) body = <ErrorState onRetry={reload} />
  else if (!result) body = <ProductGridSkeleton count={9} className="lg:grid-cols-3" />
  else if (total === 0)
    body =
      activeCount === 0 && emptyState ? (
        emptyState
      ) : (
        <EmptyState
          icon={<PackageSearch />}
          title={t('empty.filtersTitle')}
          description={t('empty.filtersDesc')}
          action={activeCount ? { label: t('common.clearAll'), onClick: clearAll } : undefined}
        />
      )
  else
    body = (
      <>
        <ProductGrid products={result.items} loading={loading} layout={view} columns={3} />
        <Pagination page={result.page} totalPages={result.totalPages} onChange={goToPage} className="mt-14" />
      </>
    )

  return (
    <section aria-labelledby={`${id}-heading`} className={cn('container-x pb-20 sm:pb-24', className)}>
      <div ref={topRef} id={id} className="scroll-mt-20 lg:scroll-mt-32" />
      <div className="grid grid-cols-1 gap-x-10 xl:gap-x-14 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[270px_minmax(0,1fr)]">
        {/* Desktop sidebar — inline-start, mirrors automatically in RTL */}
        <aside className="hidden lg:block" aria-label={t('filters.title')}>
          <div className="no-scrollbar sticky top-32 max-h-[calc(100dvh-9rem)] overflow-y-auto pt-6 pb-10">
            {filterHeading}
            <FilterPanel catalog={catalog} />
          </div>
        </aside>

        <div className="min-w-0">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 border-b border-line py-4 lg:pt-6">
            <h2 id={`${id}-heading`} className="order-last w-full text-[13px] text-muted sm:order-none sm:w-auto sm:flex-1" aria-live="polite">
              {countText}
            </h2>
            <Button
              variant="outline"
              className="h-11 flex-1 border-line sm:flex-none lg:hidden"
              icon={<SlidersHorizontal className="size-4" aria-hidden />}
              onClick={() => setDrawerOpen(true)}
              aria-haspopup="dialog"
            >
              {t('catalog.filtersButton')}
              {activeCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-rose px-1.5 text-[10.5px] font-semibold text-white">{activeCount}</span>}
            </Button>
            <SortSelect value={sort} onChange={setSort} className="flex-1 sm:flex-none" />
            <ViewToggle value={view} onChange={setView} className="hidden sm:inline-flex" />
          </div>

          <ActiveFilters catalog={catalog} className="pt-4" />

          <div className="pt-8">{body}</div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      <FilterDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} catalog={catalog} total={total} loading={loading} />
    </section>
  )
}

function FilterDrawer({ open, onClose, catalog, total, loading }: { open: boolean; onClose: () => void; catalog: CatalogQuery; total: number; loading: boolean }) {
  const { t } = useT()
  return (
    <Drawer
      side="bottom"
      open={open}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          {t('filters.title')}
          {catalog.activeCount > 0 && <span className="font-sans text-sm font-normal text-muted">({catalog.activeCount})</span>}
        </span>
      }
      footer={
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={catalog.clearAll} disabled={!catalog.activeCount} className="shrink-0">
            {t('common.clearAll')}
          </Button>
          <Button variant="dark" fullWidth onClick={onClose} aria-busy={loading || undefined}>
            {t('filters.show', { count: total.toLocaleString('en-US') })}
          </Button>
        </div>
      }
    >
      <div className="px-5 pb-6">
        <FilterPanel catalog={catalog} className="border-t-0" />
      </div>
    </Drawer>
  )
}
