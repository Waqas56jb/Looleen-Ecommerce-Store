import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAsync } from '@/hooks'
import { queryProducts } from '@/services/productService'
import type { ProductFilters, SortOption } from '@/types'
import {
  FILTER_PARAM_KEYS,
  PAGE_SIZE,
  buildFacets,
  countActive,
  parseFilters,
  parseSort,
  toProductFilters,
  writeFilter,
  type ArrayFilterKey,
  type CatalogFilters,
  type CatalogViewMode,
  type FacetKey,
} from './catalogModel'

interface Options {
  /** Facets the page controls itself (e.g. `brands` on a brand page) */
  hidden?: FacetKey[]
  pageSize?: number
  /** Skip loading entirely (e.g. search page with an empty query) */
  enabled?: boolean
}

/**
 * URL-driven catalog state. Filters, sort, view and page live in the query
 * string so listings are shareable and work with the back button.
 *   const catalog = useCatalogQuery({ category: 'makeup' })
 */
export function useCatalogQuery(base: ProductFilters, { hidden = [], pageSize = PAGE_SIZE, enabled = true }: Options = {}) {
  const [sp, setSp] = useSearchParams()
  const baseKey = JSON.stringify(base)
  const spKey = sp.toString()

  const filters = useMemo(() => parseFilters(sp), [spKey]) // eslint-disable-line react-hooks/exhaustive-deps
  const sort = parseSort(sp)
  const view: CatalogViewMode = sp.get('view') === 'list' ? 'list' : 'grid'
  const page = Math.max(1, Number(sp.get('page')) || 1)

  // Hidden facets are owned by the page; never let a stray URL param leak in
  const effective = useMemo<CatalogFilters>(() => {
    const f = { ...filters }
    if (hidden.includes('brands')) f.brands = []
    if (hidden.includes('pro')) f.pro = false
    return f
  }, [filters, hidden.join(',')]) // eslint-disable-line react-hooks/exhaustive-deps

  const query = useMemo(() => toProductFilters(base, effective), [baseKey, effective]) // eslint-disable-line react-hooks/exhaustive-deps
  const queryKey = JSON.stringify(query)

  const results = useAsync(
    () => (enabled ? queryProducts({ ...query, sort, page, pageSize }) : Promise.resolve(undefined)),
    [enabled, queryKey, sort, page, pageSize],
  )

  /** Base set (page filters only) → facet options with counts */
  const facetsAsync = useAsync(
    () => (enabled ? queryProducts({ ...base, pageSize: 10_000 }).then((r) => buildFacets(r.items)) : Promise.resolve(undefined)),
    [enabled, baseKey],
  )

  const update = useCallback(
    (fn: (next: URLSearchParams) => URLSearchParams, resetPage = true) => {
      setSp(
        (prev) => {
          let next = fn(new URLSearchParams(prev))
          if (resetPage) {
            next = new URLSearchParams(next)
            next.delete('page')
          }
          return next
        },
        { preventScrollReset: true },
      )
    },
    [setSp],
  )

  const setFilter = useCallback(
    <K extends FacetKey>(key: K, value: CatalogFilters[K]) => update((p) => writeFilter(p, key, value)),
    [update],
  )

  const toggleValue = useCallback(
    (key: ArrayFilterKey, value: string) =>
      update((p) => {
        const current = parseFilters(p)[key] as string[]
        const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
        return writeFilter(p, key, next as CatalogFilters[typeof key])
      }),
    [update],
  )

  const clearAll = useCallback(
    () =>
      update((p) => {
        FILTER_PARAM_KEYS.filter((k) => !hidden.includes(k)).forEach((k) => p.delete(k))
        return p
      }),
    [update, hidden.join(',')], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const setSort = useCallback(
    (s: SortOption) =>
      update((p) => {
        if (s === 'featured') p.delete('sort')
        else p.set('sort', s)
        return p
      }),
    [update],
  )

  const setView = useCallback(
    (v: CatalogViewMode) =>
      update((p) => {
        if (v === 'grid') p.delete('view')
        else p.set('view', v)
        return p
      }, false),
    [update],
  )

  const setPage = useCallback(
    (n: number) =>
      update((p) => {
        if (n <= 1) p.delete('page')
        else p.set('page', String(n))
        return p
      }, false),
    [update],
  )

  return {
    result: results.data,
    loading: results.loading,
    error: results.error,
    reload: () => {
      results.reload()
      facetsAsync.reload()
    },
    facets: facetsAsync.data,
    facetsLoading: facetsAsync.loading,
    filters: effective,
    activeCount: countActive(effective, hidden),
    hidden,
    setFilter,
    toggleValue,
    clearAll,
    sort,
    setSort,
    view,
    setView,
    page,
    setPage,
  }
}

export type CatalogQuery = ReturnType<typeof useCatalogQuery>
