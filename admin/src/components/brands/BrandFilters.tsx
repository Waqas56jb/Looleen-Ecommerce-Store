import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { Button, Drawer, Select } from '@/components/ui'
import { useT } from '@/i18n'

export const BRAND_FILTER_KEYS = ['status', 'featured', 'authorized'] as const

interface BrandFiltersProps {
  value: (key: string) => string
  onChange: (key: string, v: string | undefined) => void
  onClear: () => void
}

function useOptions() {
  const { t } = useT()
  return {
    status: [
      { value: '', label: t('catalog.brands.anyStatus') },
      { value: 'active', label: t('status.active') },
      { value: 'inactive', label: t('status.inactive') },
    ],
    featured: [
      { value: '', label: t('catalog.brands.anyFeatured') },
      { value: 'yes', label: t('catalog.brands.featuredOnly') },
      { value: 'no', label: t('catalog.brands.notFeatured') },
    ],
    authorized: [
      { value: '', label: t('catalog.brands.anyAuthorized') },
      { value: 'yes', label: t('catalog.brands.authorizedOnly') },
      { value: 'no', label: t('catalog.brands.notAuthorizedOnly') },
    ],
  }
}

/** Inline selects on desktop, a "Filters" drawer on mobile */
export function BrandFilters({ value, onChange, onClear }: BrandFiltersProps) {
  const { t } = useT()
  const opts = useOptions()
  const [open, setOpen] = useState(false)
  const active = BRAND_FILTER_KEYS.filter((k) => value(k)).length
  const labels = { status: t('catalog.brands.filterStatus'), featured: t('catalog.brands.filterFeatured'), authorized: t('catalog.brands.filterAuthorized') }

  return (
    <>
      <div className="hidden items-center gap-2 md:flex">
        {BRAND_FILTER_KEYS.map((k) => (
          <Select key={k} aria-label={labels[k]} options={opts[k]} value={value(k)} onChange={(e) => onChange(k, e.target.value || undefined)} className="h-8 w-auto min-w-36 text-[13px]" />
        ))}
        {active > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            {t('common.clearAll')}
          </Button>
        )}
      </div>
      <Button variant="outline" size="sm" className="md:hidden" onClick={() => setOpen(true)} icon={<SlidersHorizontal className="size-4" />}>
        {t('common.filters')}
        {active > 0 && <span className="rounded bg-ink px-1.5 text-[11px] text-white tabular-nums">{active}</span>}
      </Button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={t('common.filters')}
        footer={
          <>
            <Button variant="outline" fullWidth onClick={onClear}>
              {t('common.clearAll')}
            </Button>
            <Button fullWidth onClick={() => setOpen(false)}>
              {t('common.apply')}
            </Button>
          </>
        }
      >
        <div className="space-y-4 p-5">
          {BRAND_FILTER_KEYS.map((k) => (
            <Select key={k} label={labels[k]} options={opts[k]} value={value(k)} onChange={(e) => onChange(k, e.target.value || undefined)} />
          ))}
        </div>
      </Drawer>
    </>
  )
}

export function parseBrandFilters(get: (k: string) => string) {
  const bool = (v: string) => (v === 'yes' ? true : v === 'no' ? false : undefined)
  return { status: get('status') || undefined, featured: bool(get('featured')), authorized: bool(get('authorized')) }
}
