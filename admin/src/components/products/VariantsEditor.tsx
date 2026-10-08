import { Layers, Plus, Sparkles, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Dropdown, EmptyState, IconButton, Input, RiyalSign, Segmented, Switch, Thumb } from '@/components/ui'
import { useT } from '@/i18n'
import type { ProductVariant } from '@/types'
import { cn, slugify, uid } from '@/utils'

export type VariantKind = ProductVariant['kind']

const PRESETS: Record<VariantKind, { label: string; items: { name: string; hex?: string }[] }[]> = {
  shade: [
    { label: 'Light / Medium / Tan / Deep', items: [{ name: 'Light', hex: '#F3D9C4' }, { name: 'Medium', hex: '#DDB08C' }, { name: 'Tan', hex: '#B9845A' }, { name: 'Deep', hex: '#7A4E33' }] },
    { label: 'Nude / Rose / Berry / Red', items: [{ name: 'Nude', hex: '#C99583' }, { name: 'Rose', hex: '#C46A7A' }, { name: 'Berry', hex: '#8A2E4F' }, { name: 'Classic Red', hex: '#B3202E' }] },
  ],
  size: [
    { label: '100ml / 250ml / 500ml', items: [{ name: '100ml' }, { name: '250ml' }, { name: '500ml' }] },
    { label: '30ml / 50ml / 100ml', items: [{ name: '30ml' }, { name: '50ml' }, { name: '100ml' }] },
  ],
  pack: [
    { label: 'Single / Pack of 3 / Pack of 6', items: [{ name: 'Single' }, { name: 'Pack of 3' }, { name: 'Pack of 6' }] },
    { label: 'Salon 12 / Salon 24', items: [{ name: 'Salon pack of 12' }, { name: 'Salon pack of 24' }] },
  ],
}

interface Props {
  kind: VariantKind
  onKindChange: (k: VariantKind) => void
  variants: ProductVariant[]
  onChange: (v: ProductVariant[]) => void
  baseSku: string
  basePrice: number
  error?: string
}

export function VariantsEditor({ kind, onKindChange, variants, onChange, baseSku, basePrice, error }: Props) {
  const { t } = useT()
  const patch = (id: string, p: Partial<ProductVariant>) => onChange(variants.map((v) => (v.id === id ? { ...v, ...p } : v)))
  const makeSku = (name: string) => `${baseSku || 'SKU'}-${slugify(name).toUpperCase().replace(/-/g, '').slice(0, 8) || variants.length + 1}`

  const add = () =>
    onChange([...variants, { id: uid('v'), kind, name: '', hex: kind === 'shade' ? '#D9B8BE' : undefined, sku: '', price: basePrice || 0, stock: 0, status: 'active' }])

  const generate = (items: { name: string; hex?: string }[]) => {
    const existing = new Set(variants.map((v) => v.name.toLowerCase()))
    const fresh = items
      .filter((i) => !existing.has(i.name.toLowerCase()))
      .map<ProductVariant>((i) => ({ id: uid('v'), kind, name: i.name, hex: i.hex, sku: makeSku(i.name), price: basePrice || 0, stock: 0, status: 'active' }))
    if (!fresh.length) return
    onChange([...variants, ...fresh])
    toast.success(t('products.form.variantsGenerated', { count: fresh.length }))
  }

  return (
    <div className="space-y-4" id="pf-variants">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1.5">
          <p className="text-[13px] font-medium text-ink">{t('products.form.variantType')}</p>
          <Segmented
            value={kind}
            onChange={onKindChange}
            options={(['shade', 'size', 'pack'] as const).map((k) => ({ value: k, label: t(`products.form.variantKinds.${k}`) }))}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Dropdown
            widthClass="w-64"
            trigger={({ toggle }) => (
              <Button variant="outline" size="sm" icon={<Sparkles className="size-4" />} onClick={toggle}>
                {t('products.form.generate')}
              </Button>
            )}
            items={PRESETS[kind].map((p) => ({ label: p.label, onClick: () => generate(p.items) }))}
          />
          <Button variant="outline" size="sm" icon={<Plus className="size-4" />} onClick={add}>
            {t('products.form.addVariant')}
          </Button>
        </div>
      </div>

      {variants.length === 0 ? (
        <EmptyState icon={<Layers />} title={t('products.form.noVariants')} description={t('products.form.noVariantsDesc')} className="rounded-md border border-dashed border-line py-8" />
      ) : (
        <ul className="space-y-3">
          {variants.map((v, i) => (
            <li key={v.id} className={cn('rounded-md border border-line bg-surface p-3', v.status === 'inactive' && 'bg-mist/60')}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.7fr)_minmax(0,1.3fr)_auto] xl:items-end">
                <div className="flex items-end gap-2">
                  {kind === 'shade' && (
                    <label className="shrink-0">
                      <span className="sr-only">{t('products.form.shadeColor')}</span>
                      <input
                        type="color"
                        value={v.hex ?? '#D9B8BE'}
                        onChange={(e) => patch(v.id, { hex: e.target.value })}
                        className="h-9 w-10 cursor-pointer rounded-md border border-line bg-surface p-1"
                        aria-label={`${t('products.form.shadeColor')} ${i + 1}`}
                      />
                    </label>
                  )}
                  {kind !== 'shade' && v.image && <Thumb src={v.image} alt={v.name} size="xs" className="mb-0.5" />}
                  <Input
                    wrapperClassName="flex-1"
                    label={t('products.form.variantName')}
                    value={v.name}
                    onChange={(e) => patch(v.id, { name: e.target.value })}
                    error={error && !v.name.trim() ? error : undefined}
                    placeholder={kind === 'shade' ? 'Medium 220' : kind === 'size' ? '250ml' : 'Pack of 3'}
                  />
                </div>
                <Input label={t('products.form.variantSku')} value={v.sku} dir="ltr" className="font-mono text-[13px]" onChange={(e) => patch(v.id, { sku: e.target.value.toUpperCase() })} placeholder={makeSku(v.name || String(i + 1))} />
                <Input
                  label={t('products.form.variantPrice')}
                  type="number"
                  min={0}
                  step="0.01"
                  dir="ltr"
                  leading={<RiyalSign />}
                  value={String(v.price)}
                  onChange={(e) => patch(v.id, { price: Math.max(0, Number(e.target.value) || 0) })}
                />
                <Input label={t('products.form.variantStock')} type="number" min={0} dir="ltr" value={String(v.stock)} onChange={(e) => patch(v.id, { stock: Math.max(0, Math.floor(Number(e.target.value) || 0)) })} />
                <Input label={t('products.form.variantImage')} dir="ltr" value={v.image ?? ''} placeholder="https://… / photo-…" onChange={(e) => patch(v.id, { image: e.target.value || undefined })} />
                <div className="flex items-center justify-between gap-3 sm:col-span-2 xl:col-span-1 xl:h-9 xl:justify-end">
                  <Switch size="sm" checked={v.status === 'active'} onChange={(on) => patch(v.id, { status: on ? 'active' : 'inactive' })} label={<span className="text-xs font-normal text-muted xl:sr-only">{t('products.form.variantStatus')}</span>} />
                  <IconButton label={t('products.form.removeVariant')} variant="danger" size="sm" onClick={() => onChange(variants.filter((x) => x.id !== v.id))}>
                    <Trash2 />
                  </IconButton>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
