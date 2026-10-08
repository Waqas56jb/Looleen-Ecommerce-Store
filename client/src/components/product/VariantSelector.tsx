import { useT } from '@/i18n'
import { Money } from '@/components/common'
import type { Product } from '@/types'
import { cn } from '@/utils'

interface VariantSelectorProps {
  product: Product
  shadeId?: string
  sizeId?: string
  onShade: (id: string) => void
  onSize: (id: string) => void
  compact?: boolean
}

/** Shade swatches (makeup) and size pills (hair, skin, perfume) */
export function VariantSelector({ product, shadeId, sizeId, onShade, onSize, compact }: VariantSelectorProps) {
  const { t } = useT()
  const shade = product.shades.find((s) => s.id === shadeId)
  return (
    <div className={cn('flex flex-col', compact ? 'gap-4' : 'gap-6')}>
      {product.shades.length > 0 && (
        <fieldset>
          <legend className="mb-3 text-[13px] text-muted">
            {t('common.shade')}: <span className="font-medium text-ink">{shade?.name}</span>
          </legend>
          <div className="flex flex-wrap gap-2.5">
            {product.shades.map((s) => (
              <label key={s.id} className="cursor-pointer" title={s.name}>
                <input type="radio" name={`shade-${product.id}`} value={s.id} checked={s.id === shadeId} onChange={() => onShade(s.id)} className="peer sr-only" />
                <span
                  className={cn(
                    'block rounded-full ring-1 ring-black/10 ring-offset-2 ring-offset-ivory transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-rose',
                    compact ? 'size-7' : 'size-9',
                    s.id === shadeId ? 'ring-2 ring-ink' : 'hover:ring-ink/40',
                  )}
                  style={{ background: s.hex }}
                />
                <span className="sr-only">{s.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {product.sizes.length > 0 && (
        <fieldset>
          <legend className="mb-3 text-[13px] text-muted">{t('common.size')}</legend>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <label key={s.id} className="cursor-pointer">
                <input type="radio" name={`size-${product.id}`} value={s.id} checked={s.id === sizeId} onChange={() => onSize(s.id)} className="peer sr-only" />
                <span
                  className={cn(
                    'flex h-11 min-w-20 flex-col items-center justify-center rounded-full border px-4 text-sm transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-rose/40',
                    s.id === sizeId ? 'border-ink bg-ink text-ivory' : 'border-line bg-white text-ink hover:border-ink/50',
                  )}
                >
                  <span className="font-medium">{s.label}</span>
                  {!compact && s.price && product.sizes.length > 1 && <span className={cn('text-[10.5px]', s.id === sizeId ? 'text-ivory/70' : 'text-muted')}><Money value={s.price} /></span>}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </div>
  )
}
