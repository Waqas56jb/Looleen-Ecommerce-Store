import { useCallback, useEffect, useMemo, useRef, useState, type DependencyList } from 'react'
import { useSearchParams } from 'react-router-dom'
import { STORE_CONFIG } from '@/config/store'

/**
 * Runs an async loader and tracks loading / error / data.
 * Keeps previous data while reloading (no flash on filter changes).
 *   const { data, loading, error, reload } = useAsync(() => getProducts(q), [q])
 */
export function useAsync<T>(loader: () => Promise<T>, deps: DependencyList) {
  const [state, setState] = useState<{ data: T | undefined; loading: boolean; error: unknown }>({ data: undefined, loading: true, error: null })
  const [nonce, setNonce] = useState(0)
  const loaderRef = useRef(loader)
  loaderRef.current = loader
  useEffect(() => {
    let alive = true
    setState((s) => ({ ...s, loading: true, error: null }))
    loaderRef
      .current()
      .then((data) => alive && setState({ data, loading: false, error: null }))
      .catch((error) => alive && setState({ data: undefined, loading: false, error }))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])
  const reload = useCallback(() => setNonce((n) => n + 1), [])
  return { ...state, reload }
}

export function useDebounce<T>(value: T, ms = 250): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms)
    return () => clearTimeout(id)
  }, [value, ms])
  return v
}

/** document.title = "<title> · LOOKS Admin" */
export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${STORE_CONFIG.adminTitle}` : STORE_CONFIG.adminTitle
  }, [title])
}

export function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [locked])
}

export function useEscape(handler: () => void, active = true) {
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && handler()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handler, active])
}

/** Global keyboard shortcut, e.g. useHotkey('k', open, { meta: true }) — meta = Ctrl or ⌘ */
export function useHotkey(key: string, handler: (e: KeyboardEvent) => void, opts: { meta?: boolean } = {}) {
  const ref = useRef(handler)
  ref.current = handler
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== key.toLowerCase()) return
      if (opts.meta && !(e.metaKey || e.ctrlKey)) return
      e.preventDefault()
      ref.current(e)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [key, opts.meta])
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatches(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return matches
}

export function useClickOutside<T extends HTMLElement>(onOutside: () => void, active = true) {
  const ref = useRef<T>(null)
  useEffect(() => {
    if (!active) return
    const on = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && onOutside()
    document.addEventListener('mousedown', on)
    return () => document.removeEventListener('mousedown', on)
  }, [onOutside, active])
  return ref
}

/**
 * Table list state synced to the URL (?q=&page=&sort=&dir=&<filters>).
 * Filters are string values; arrays are comma-separated.
 */
export function useListState(defaults: { sortBy?: string; sortDir?: 'asc' | 'desc'; pageSize?: number } = {}) {
  const [params, setParams] = useSearchParams()
  const search = params.get('q') ?? ''
  const page = Number(params.get('page') ?? 1) || 1
  const pageSize = Number(params.get('size') ?? defaults.pageSize ?? 20) || 20
  const sortBy = params.get('sort') ?? defaults.sortBy
  const sortDir = (params.get('dir') as 'asc' | 'desc' | null) ?? defaults.sortDir ?? 'desc'

  const update = useCallback(
    (patch: Record<string, string | number | undefined | null>, resetPage = true) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          Object.entries(patch).forEach(([k, v]) => (v === undefined || v === null || v === '' ? next.delete(k) : next.set(k, String(v))))
          if (resetPage && !('page' in patch)) next.delete('page')
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  const filter = useCallback((key: string) => params.get(key) ?? '', [params])
  const filterList = useCallback((key: string) => (params.get(key) ? params.get(key)!.split(',') : []), [params])

  const query = useMemo(() => ({ search, page, pageSize, sortBy, sortDir }), [search, page, pageSize, sortBy, sortDir])

  return {
    query,
    search,
    page,
    pageSize,
    sortBy,
    sortDir,
    params,
    filter,
    filterList,
    setSearch: (q: string) => update({ q }),
    setPage: (p: number) => update({ page: p > 1 ? p : undefined }, false),
    setPageSize: (s: number) => update({ size: s }),
    setSort: (key: string) => update({ sort: key, dir: sortBy === key && sortDir === 'desc' ? 'asc' : 'desc' }),
    setFilter: (key: string, value: string | string[] | undefined) => update({ [key]: Array.isArray(value) ? value.join(',') : value }),
    clearFilters: (keys: string[]) => update(Object.fromEntries(keys.map((k) => [k, undefined]))),
  }
}
