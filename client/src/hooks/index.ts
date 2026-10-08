import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react'
import { STORE_CONFIG } from '@/config/store'

/**
 * Runs an async loader and tracks loading / error / data.
 *   const { data, loading, error, reload } = useAsync(() => getProductBySlug(slug), [slug])
 */
export function useAsync<T>(loader: () => Promise<T>, deps: DependencyList) {
  const [state, setState] = useState<{ data: T | undefined; loading: boolean; error: unknown }>({
    data: undefined,
    loading: true,
    error: null,
  })
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

/** Sets document.title as "<title> | <Store>" and the meta description */
export function useDocumentMeta(title?: string, description?: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${STORE_CONFIG.name}` : `${STORE_CONFIG.name} — Original Beauty, Authenticated`
    if (description) {
      let tag = document.querySelector('meta[name="description"]')
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute('name', 'description')
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', description)
    }
  }, [title, description])
}

/** Locks body scroll while `locked` is true (drawers, modals) */
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

/** Calls handler on Escape */
export function useEscape(handler: () => void, active = true) {
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && handler()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handler, active])
}

/** Live countdown to an ISO date */
export function useCountdown(target: string | undefined) {
  const calc = useCallback(() => {
    const diff = target ? Math.max(0, new Date(target).getTime() - Date.now()) : 0
    return {
      expired: !target || diff <= 0,
      days: Math.floor(diff / 86_400_000),
      hours: Math.floor((diff / 3_600_000) % 24),
      minutes: Math.floor((diff / 60_000) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    }
  }, [target])
  const [left, setLeft] = useState(calc)
  useEffect(() => {
    setLeft(calc())
    const id = setInterval(() => setLeft(calc()), 1000)
    return () => clearInterval(id)
  }, [calc])
  return left
}

/** true once the page has scrolled past `offset` px */
export function useScrolled(offset = 12) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > offset)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [offset])
  return scrolled
}

/** Adds the `in-view` reveal once an element enters the viewport */
export function useInView<T extends Element>(options: IntersectionObserverInit = { rootMargin: '0px 0px -10% 0px' }) {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    if (!('IntersectionObserver' in window)) {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true)
        io.disconnect()
      }
    }, options)
    io.observe(el)
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView])
  return { ref, inView }
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false))
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatches(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return matches
}
