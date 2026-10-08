import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Box, CornerDownLeft, FolderTree, Search, ShoppingBag, Tag, User } from 'lucide-react'
import { useAsync, useDebounce, useEscape, useHotkey, useLockBodyScroll } from '@/hooks'
import { useT } from '@/i18n'
import { globalSearch } from '@/services/systemService'
import { useUIStore } from '@/store/uiStore'
import { cn } from '@/utils'
import { Thumb } from '@/components/ui'
import { COMMANDS } from './navigation'

interface Item {
  key: string
  group: string
  title: string
  subtitle?: string
  to: string
  icon: React.ReactNode
}

/** Ctrl/⌘ + K — jump to pages and search products, orders, customers, brands, categories */
export function CommandPalette() {
  const open = useUIStore((s) => s.commandOpen)
  const setOpen = useUIStore((s) => s.setCommandOpen)
  const { t, lang } = useT()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const debounced = useDebounce(q, 150)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  useHotkey('k', () => setOpen(!useUIStore.getState().commandOpen), { meta: true })
  useEscape(() => setOpen(false), open)
  useLockBodyScroll(open)
  useEffect(() => {
    if (open) {
      setQ('')
      setActive(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])
  const { data } = useAsync(() => globalSearch(debounced), [debounced])

  const L = (en: string, ar: string) => (lang === 'ar' ? ar : en)
  const items: Item[] = useMemo(() => {
    const term = q.trim().toLowerCase()
    const pages = COMMANDS.filter((c) => !term || t(c.labelKey).toLowerCase().includes(term) || c.keywords.includes(term)).map((c) => {
      const Icon = c.icon
      return { key: `nav-${c.to}`, group: L('Go to', 'انتقل إلى'), title: t(c.labelKey), to: c.to, icon: <Icon className="size-4" /> }
    })
    if (!data || term.length < 2) return pages
    return [
      ...data.products.map((p) => ({ key: `p-${p.id}`, group: t('nav.products'), title: p.title, subtitle: p.subtitle, to: `/products/${p.id}`, icon: p.image ? <Thumb src={p.image} alt="" size="xs" /> : <Box className="size-4" /> })),
      ...data.orders.map((o) => ({ key: `o-${o.id}`, group: t('nav.orders'), title: o.title, subtitle: o.subtitle, to: `/orders/${o.id}`, icon: <ShoppingBag className="size-4" /> })),
      ...data.customers.map((c) => ({ key: `c-${c.id}`, group: t('nav.customers'), title: c.title, subtitle: c.subtitle, to: `/customers/${c.id}`, icon: <User className="size-4" /> })),
      ...data.brands.map((b) => ({ key: `b-${b.id}`, group: t('nav.brands'), title: b.title, subtitle: b.subtitle, to: `/brands/${b.id}`, icon: <Tag className="size-4" /> })),
      ...data.categories.map((c) => ({ key: `k-${c.id}`, group: t('nav.categories'), title: c.title, subtitle: c.subtitle, to: `/categories/${c.id}/edit`, icon: <FolderTree className="size-4" /> })),
      ...pages,
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, q, lang])

  useEffect(() => setActive(0), [items.length])
  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const go = (it: Item) => {
    setOpen(false)
    navigate(it.to)
  }

  if (!open) return null
  let lastGroup = ''
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-start justify-center p-3 pt-[10vh] sm:p-6 sm:pt-[12vh]" role="presentation">
      <div className="absolute inset-0 animate-fade-in bg-ink/40" onClick={() => setOpen(false)} aria-hidden />
      <div role="dialog" aria-modal="true" aria-label={t('common.commandHint')} className="relative w-full max-w-xl animate-scale-in overflow-hidden rounded-xl border border-line bg-surface shadow-pop">
        <div className="flex items-center gap-3 border-b border-line-soft px-4">
          <Search className="size-4 shrink-0 text-subtle" aria-hidden />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActive((a) => Math.min(items.length - 1, a + 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive((a) => Math.max(0, a - 1))
              } else if (e.key === 'Enter' && items[active]) {
                e.preventDefault()
                go(items[active])
              }
            }}
            placeholder={L('Search products, orders, customers, brands…', 'ابحث عن المنتجات والطلبات والعملاء والعلامات…')}
            role="combobox"
            aria-expanded="true"
            aria-controls="cmd-list"
            aria-activedescendant={items[active] ? `cmd-${items[active].key}` : undefined}
            className="h-13 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-subtle"
          />
          <kbd className="rounded border border-line px-1.5 py-0.5 text-[10px] text-subtle">ESC</kbd>
        </div>
        <div ref={listRef} id="cmd-list" role="listbox" className="thin-scrollbar max-h-[55vh] overflow-y-auto p-2">
          {items.length === 0 && <p className="px-3 py-8 text-center text-sm text-muted">{t('common.noResults')}</p>}
          {items.map((it, i) => {
            const header = it.group !== lastGroup
            lastGroup = it.group
            return (
              <div key={it.key}>
                {header && <p className="px-3 pt-3 pb-1 text-[10.5px] font-semibold tracking-[0.12em] text-subtle uppercase">{it.group}</p>}
                <button
                  id={`cmd-${it.key}`}
                  data-idx={i}
                  role="option"
                  aria-selected={i === active}
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(it)}
                  className={cn('flex w-full items-center gap-3 rounded-md px-3 py-2 text-start transition-colors', i === active ? 'bg-mist' : '')}
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-md border border-line-soft bg-surface text-muted">{it.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] text-ink">{it.title}</span>
                    {it.subtitle && <span className="block truncate text-xs text-muted">{it.subtitle}</span>}
                  </span>
                  {i === active ? <CornerDownLeft className="size-3.5 text-subtle" /> : <ArrowRight className="size-3.5 text-transparent" />}
                </button>
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-4 border-t border-line-soft px-4 py-2 text-[11px] text-subtle">
          <span>↑↓ {L('navigate', 'للتنقل')}</span>
          <span>↵ {L('open', 'للفتح')}</span>
          <span className="ms-auto" dir="ltr">
            Ctrl / ⌘ + K
          </span>
        </div>
      </div>
    </div>,
    document.body,
  )
}
