import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { Badge, Button, Drawer, Input, RiyalSign, SearchInput, Select, Switch } from '@/components/ui'
import type { useListState } from '@/hooks'
import { useT } from '@/i18n'
import type { BrandRow } from '@/services/catalogService'
import type { AdminCategory } from '@/types'
import { cn } from '@/utils'
import { categoryOptions, FLAG_FILTERS, PRODUCT_FILTER_KEYS, PRODUCT_STATUSES } from './productUtils'

type ListState = ReturnType<typeof useListState>

interface Props {
  list: ListState
  brands: BrandRow[]
  categories: AdminCategory[]
}

function PriceRange({ list }: { list: ListState }) {
  const { t } = useT()
  const [min, setMin] = useState(list.filter('minPrice'))
  const [max, setMax] = useState(list.filter('maxPrice'))
  // keep local inputs in sync when chips are cleared
  const urlMin = list.filter('minPrice')
  const urlMax = list.filter('maxPrice')
  useEffect(() => setMin(urlMin), [urlMin])
  useEffect(() => setMax(urlMax), [urlMax])
  const commit = (key: 'minPrice' | 'maxPrice', v: string) => {
    const clean = v.trim() === '' || Number(v) < 0 || !Number.isFinite(Number(v)) ? '' : String(Number(v))
    if (clean !== list.filter(key)) list.setFilter(key, clean || undefined)
  }
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1.5 text-[13px] font-medium text-ink">{t('products.filter.price')}</legend>
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="number"
          min={0}
          inputMode="decimal"
          aria-label={t('products.filter.minPrice')}
          placeholder={t('products.filter.minPrice')}
          leading={<RiyalSign />}
          value={min}
          onChange={(e) => setMin(e.target.value)}
          onBlur={() => commit('minPrice', min)}
          onKeyDown={(e) => e.key === 'Enter' && commit('minPrice', min)}
          dir="ltr"
        />
        <Input
          type="number"
          min={0}
          inputMode="decimal"
          aria-label={t('products.filter.maxPrice')}
          placeholder={t('products.filter.maxPrice')}
          leading={<RiyalSign />}
          value={max}
          onChange={(e) => setMax(e.target.value)}
          onBlur={() => commit('maxPrice', max)}
          onKeyDown={(e) => e.key === 'Enter' && commit('maxPrice', max)}
          dir="ltr"
        />
      </div>
    </fieldset>
  )
}

export function ProductFilters({ list, brands, categories }: Props) {
  const { t, lang } = useT()
  const [drawer, setDrawer] = useState<null | 'more' | 'all'>(null)

  const catOpts = useMemo(() => categoryOptions(categories, lang), [categories, lang])
  const brandOpts = useMemo(() => brands.map((b) => ({ value: b.id, label: b.name })), [brands])
  const stockOpts = [
    { value: 'in', label: t('products.filter.inStock') },
    { value: 'low', label: t('products.filter.lowStock') },
    { value: 'out', label: t('products.filter.outOfStock') },
  ]
  const statusOpts = PRODUCT_STATUSES.map((s) => ({ value: s, label: t(`status.${s}`) }))
  const ratingOpts = [
    { value: '4', label: t('products.filter.rating4') },
    { value: '4.5', label: t('products.filter.rating45') },
  ]

  const selects = {
    category: <Select aria-label={t('products.filter.category')} options={catOpts} placeholder={t('products.filter.allCategories')} value={list.filter('category')} onChange={(e) => list.setFilter('category', e.target.value || undefined)} />,
    brand: <Select aria-label={t('products.filter.brand')} options={brandOpts} placeholder={t('products.filter.allBrands')} value={list.filter('brand')} onChange={(e) => list.setFilter('brand', e.target.value || undefined)} />,
    stock: <Select aria-label={t('products.filter.stock')} options={stockOpts} placeholder={t('products.filter.anyStock')} value={list.filter('stock')} onChange={(e) => list.setFilter('stock', e.target.value || undefined)} />,
    status: <Select aria-label={t('products.filter.status')} options={statusOpts} placeholder={t('products.filter.anyStatus')} value={list.filter('status')} onChange={(e) => list.setFilter('status', e.target.value || undefined)} />,
    rating: <Select aria-label={t('products.filter.rating')} options={ratingOpts} placeholder={t('products.filter.anyRating')} value={list.filter('rating')} onChange={(e) => list.setFilter('rating', e.target.value || undefined)} />,
  }

  /* ---------- active chips ---------- */
  const chips: { key: string; keys: string[]; label: string }[] = []
  const catLabel = categories.find((c) => c.id === list.filter('category'))
  if (catLabel) chips.push({ key: 'category', keys: ['category'], label: catLabel.name[lang] || catLabel.name.en })
  const brand = brands.find((b) => b.id === list.filter('brand'))
  if (brand) chips.push({ key: 'brand', keys: ['brand'], label: brand.name })
  if (list.filter('status')) chips.push({ key: 'status', keys: ['status'], label: t(`status.${list.filter('status')}`) })
  const stock = stockOpts.find((o) => o.value === list.filter('stock'))
  if (stock) chips.push({ key: 'stock', keys: ['stock'], label: stock.label })
  const minP = list.filter('minPrice')
  const maxP = list.filter('maxPrice')
  if (minP || maxP) chips.push({ key: 'price', keys: ['minPrice', 'maxPrice'], label: t('products.filter.priceChip', { range: `${minP || '0'} – ${maxP || '∞'}` }) })
  if (list.filter('rating')) chips.push({ key: 'rating', keys: ['rating'], label: t('products.filter.ratingChip', { value: list.filter('rating') }) })
  FLAG_FILTERS.forEach((k) => list.filter(k) === '1' && chips.push({ key: k, keys: [k], label: t(`products.filter.${k}`) }))

  const moreCount = chips.filter((c) => ['price', 'rating', ...FLAG_FILTERS].includes(c.key)).length

  const flagToggles = (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-[13px] font-medium text-ink">{t('products.filter.flags')}</legend>
      <div className="divide-y divide-line-soft rounded-md border border-line">
        {FLAG_FILTERS.map((k) => (
          <div key={k} className="px-3 py-2.5">
            <Switch checked={list.filter(k) === '1'} onChange={(v) => list.setFilter(k, v ? '1' : undefined)} label={<span className="font-normal">{t(`products.filter.${k}`)}</span>} />
          </div>
        ))}
      </div>
    </fieldset>
  )

  const labelled = (label: string, node: ReactNode) => (
    <div className="space-y-1.5">
      <p className="text-[13px] font-medium text-ink">{label}</p>
      {node}
    </div>
  )

  return (
    <>
      <SearchInput value={list.search} onChange={list.setSearch} placeholder={t('products.searchPlaceholder')} className="w-full sm:w-64 lg:w-72" />

      {/* desktop inline */}
      <div className="hidden items-center gap-2 lg:flex [&_select]:h-8 [&_select]:text-[13px]">
        <div className="w-44">{selects.category}</div>
        <div className="w-36">{selects.brand}</div>
        <div className="w-32">{selects.stock}</div>
        <div className="w-32">{selects.status}</div>
        <Button variant="outline" size="sm" icon={<SlidersHorizontal className="size-4" />} onClick={() => setDrawer('more')}>
          {t('products.filter.more')}
          {moreCount > 0 && <span className="rounded bg-ink px-1.5 text-[11px] text-white tabular-nums">{moreCount}</span>}
        </Button>
      </div>

      {/* mobile / tablet */}
      <Button variant="outline" size="md" className="lg:hidden" icon={<SlidersHorizontal className="size-4" />} onClick={() => setDrawer('all')}>
        {t('common.filters')}
        {chips.length > 0 && <span className="rounded bg-ink px-1.5 text-[11px] text-white tabular-nums">{chips.length}</span>}
      </Button>

      {chips.length > 0 && (
        <div className="flex basis-full flex-wrap items-center gap-1.5 pt-1">
          {chips.map((c) => (
            <Badge key={c.key} tone="neutral" className="h-7 gap-1 bg-surface pe-1 text-ink">
              {c.label}
              <button type="button" aria-label={`${t('common.remove')} ${c.label}`} onClick={() => list.clearFilters(c.keys)} className="grid size-5 place-items-center rounded text-muted hover:bg-mist hover:text-ink">
                <X className="size-3" />
              </button>
            </Badge>
          ))}
          <button type="button" onClick={() => list.clearFilters(PRODUCT_FILTER_KEYS)} className="px-1.5 text-xs font-medium text-rose-dark hover:underline">
            {t('common.clearAll')}
          </button>
        </div>
      )}

      <Drawer
        open={!!drawer}
        onClose={() => setDrawer(null)}
        title={drawer === 'more' ? t('products.filter.more') : t('products.filter.title')}
        footer={
          <>
            <Button variant="outline" onClick={() => list.clearFilters(drawer === 'more' ? ['minPrice', 'maxPrice', 'rating', ...FLAG_FILTERS] : PRODUCT_FILTER_KEYS)}>
              {t('common.reset')}
            </Button>
            <Button className="flex-1" onClick={() => setDrawer(null)}>
              {t('products.filter.showResults')}
            </Button>
          </>
        }
      >
        <div className={cn('space-y-5 p-5')}>
          {drawer === 'all' && (
            <>
              {labelled(t('products.filter.category'), selects.category)}
              {labelled(t('products.filter.brand'), selects.brand)}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {labelled(t('products.filter.stock'), selects.stock)}
                {labelled(t('products.filter.status'), selects.status)}
              </div>
            </>
          )}
          <PriceRange list={list} />
          {labelled(t('products.filter.rating'), selects.rating)}
          {flagToggles}
        </div>
      </Drawer>
    </>
  )
}
