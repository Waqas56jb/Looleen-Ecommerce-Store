import { useEffect, useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { Button, DatePicker, Drawer, Input, SearchInput, Select } from '@/components/ui'
import { PAYMENT_METHODS } from '@/config/store'
import { useDebounce, type useListState } from '@/hooks'
import { useT } from '@/i18n'
import { ALL_ORDER_STATUSES } from '@/services/orderService'
import { cn, formatDate, formatNumber, paymentName } from '@/utils'
import { MultiCheckFilter } from './MultiCheckFilter'
import { resolveStatusParam } from './orderUtils'

type ListState = ReturnType<typeof useListState>

export const ORDER_FILTER_KEYS = ['status', 'payment', 'shipping', 'from', 'to', 'min', 'max']

/** Debounced text input bound to a URL filter key */
function useCommitted(value: string, commit: (v: string) => void, ms = 400) {
  const [local, setLocal] = useState(value)
  const debounced = useDebounce(local, ms)
  useEffect(() => setLocal(value), [value])
  useEffect(() => {
    if (debounced !== value) commit(debounced)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])
  return [local, setLocal] as const
}

export function OrderFilters({ list }: { list: ListState }) {
  const { t, lang } = useT()
  const [drawer, setDrawer] = useState(false)
  const [search, setSearch] = useCommitted(list.search, list.setSearch, 300)
  const [min, setMin] = useCommitted(list.filter('min'), (v) => list.setFilter('min', v))
  const [max, setMax] = useCommitted(list.filter('max'), (v) => list.setFilter('max', v))

  const statuses = resolveStatusParam(list.filterList('status'))
  const payments = list.filterList('payment')
  const statusOptions = ALL_ORDER_STATUSES.map((s) => ({ value: s, label: t(`status.${s}`) }))
  const paymentOptions = PAYMENT_METHODS.map((p) => ({ value: p.id, label: p[lang] }))
  const shippingOptions = [
    { value: 'standard', label: t('shippingMethod.standard') },
    { value: 'express', label: t('shippingMethod.express') },
  ]
  const activeCount = ORDER_FILTER_KEYS.filter((k) => list.filter(k)).length

  const fields = (inline: boolean) => (
    <>
      <MultiCheckFilter inline={inline} label={t('orders.filters.status')} options={statusOptions} value={statuses} onChange={(v) => list.setFilter('status', v)} />
      <MultiCheckFilter inline={inline} label={t('orders.filters.payment')} options={paymentOptions} value={payments} onChange={(v) => list.setFilter('payment', v)} />
      <Select
        aria-label={t('orders.filters.shipping')}
        label={inline ? t('orders.filters.shipping') : undefined}
        value={list.filter('shipping')}
        onChange={(e) => list.setFilter('shipping', e.target.value)}
        placeholder={t('orders.filters.anyShipping')}
        options={shippingOptions}
        wrapperClassName={inline ? '' : 'w-48'}
      />
    </>
  )

  const ranges = (inline: boolean) => (
    <>
      <fieldset className={cn('min-w-0', !inline && 'flex items-center gap-1.5')}>
        <legend className={cn(inline ? 'mb-2 text-[13px] font-medium text-ink' : 'sr-only')}>{t('orders.filters.dateRange')}</legend>
        <div className={cn('grid grid-cols-2 gap-2', !inline && 'flex items-center')}>
          <DatePicker aria-label={t('orders.filters.from')} label={inline ? t('orders.filters.from') : undefined} value={list.filter('from')} onChange={(v) => list.setFilter('from', v)} max={list.filter('to') || undefined} className={inline ? '' : 'w-38'} />
          {!inline && <span className="text-subtle">–</span>}
          <DatePicker aria-label={t('orders.filters.to')} label={inline ? t('orders.filters.to') : undefined} value={list.filter('to')} onChange={(v) => list.setFilter('to', v)} min={list.filter('from') || undefined} className={inline ? '' : 'w-38'} />
        </div>
      </fieldset>
      <fieldset className={cn('min-w-0', !inline && 'flex items-center gap-1.5')}>
        <legend className={cn(inline ? 'mb-2 text-[13px] font-medium text-ink' : 'sr-only')}>{t('orders.filters.totalRange')}</legend>
        <div className={cn('grid grid-cols-2 gap-2', !inline && 'flex items-center')}>
          <Input type="number" min={0} inputMode="decimal" aria-label={t('orders.chips.min')} label={inline ? t('orders.filters.min') : undefined} placeholder={inline ? '0' : t('orders.filters.min')} value={min} onChange={(e) => setMin(e.target.value)} dir="ltr" className={inline ? '' : 'w-24'} />
          {!inline && <span className="text-subtle">–</span>}
          <Input type="number" min={0} inputMode="decimal" aria-label={t('orders.chips.max')} label={inline ? t('orders.filters.max') : undefined} placeholder={inline ? '5000' : t('orders.filters.max')} value={max} onChange={(e) => setMax(e.target.value)} dir="ltr" className={inline ? '' : 'w-24'} />
        </div>
      </fieldset>
    </>
  )

  /* ---- active chips ---- */
  const chips: { key: string; label: string; onRemove: () => void }[] = []
  if (statuses.length) chips.push({ key: 'status', label: `${t('orders.chips.status')}: ${statuses.map((s) => t(`status.${s}`)).join(', ')}`, onRemove: () => list.setFilter('status', undefined) })
  if (payments.length) chips.push({ key: 'payment', label: `${t('orders.chips.payment')}: ${payments.map((p) => paymentName(p, lang)).join(', ')}`, onRemove: () => list.setFilter('payment', undefined) })
  if (list.filter('shipping')) chips.push({ key: 'shipping', label: `${t('orders.chips.shipping')}: ${t(`shippingMethod.${list.filter('shipping')}`)}`, onRemove: () => list.setFilter('shipping', undefined) })
  if (list.filter('from')) chips.push({ key: 'from', label: `${t('orders.chips.from')}: ${formatDate(list.filter('from'), lang)}`, onRemove: () => list.setFilter('from', undefined) })
  if (list.filter('to')) chips.push({ key: 'to', label: `${t('orders.chips.to')}: ${formatDate(list.filter('to'), lang)}`, onRemove: () => list.setFilter('to', undefined) })
  if (list.filter('min')) chips.push({ key: 'min', label: `${t('orders.chips.min')}: ${formatNumber(Number(list.filter('min')))}`, onRemove: () => list.setFilter('min', undefined) })
  if (list.filter('max')) chips.push({ key: 'max', label: `${t('orders.chips.max')}: ${formatNumber(Number(list.filter('max')))}`, onRemove: () => list.setFilter('max', undefined) })

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex w-full flex-wrap items-center gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder={t('orders.filters.searchPlaceholder')} className="min-w-0 flex-1 sm:max-w-xs" />
        <div className="hidden flex-wrap items-center gap-2 xl:flex">
          {fields(false)}
          {ranges(false)}
        </div>
        <Button variant="outline" className="xl:hidden" icon={<SlidersHorizontal className="size-4" />} onClick={() => setDrawer(true)}>
          {t('common.filters')}
          {activeCount > 0 && <span className="rounded bg-ink px-1.5 text-[11px] text-white tabular-nums">{activeCount}</span>}
        </Button>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map((c) => (
            <span key={c.key} className="inline-flex h-7 max-w-full items-center gap-1 rounded-md border border-line bg-mist ps-2.5 pe-1 text-xs text-ink">
              <span className="truncate">{c.label}</span>
              <button type="button" onClick={c.onRemove} aria-label={`${t('common.remove')} ${c.label}`} className="grid size-5 place-items-center rounded text-subtle hover:bg-surface hover:text-ink">
                <X className="size-3" />
              </button>
            </span>
          ))}
          <button type="button" onClick={() => list.clearFilters(ORDER_FILTER_KEYS)} className="px-1.5 text-xs font-medium text-muted hover:text-ink">
            {t('common.clearAll')}
          </button>
        </div>
      )}

      <Drawer
        open={drawer}
        onClose={() => setDrawer(false)}
        title={t('orders.filters.title')}
        footer={
          <>
            <Button variant="outline" onClick={() => list.clearFilters(ORDER_FILTER_KEYS)} disabled={!activeCount}>
              {t('common.clearAll')}
            </Button>
            <Button fullWidth onClick={() => setDrawer(false)}>
              {t('orders.filters.showResults')}
            </Button>
          </>
        }
      >
        <div className="space-y-6 p-5">
          {fields(true)}
          {ranges(true)}
        </div>
      </Drawer>
    </div>
  )
}
