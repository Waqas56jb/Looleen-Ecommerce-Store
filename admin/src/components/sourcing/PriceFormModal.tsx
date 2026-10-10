import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Checkbox, Input, Modal, RadioGroup, Select, Switch, Textarea } from '@/components/ui'
import { useT } from '@/i18n'
import { savePrice, searchLink, type PriceInput } from '@/services/sourcingService'
import type { CompetitorPrice, MatchBy, Retailer, SourcingRow } from '@/types/sourcing'
import { isValidUrl } from '@/utils'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  product: SourcingRow
  retailers: Retailer[]
  /** Pre-selected retailer (when opened from a retailer row) */
  retailerId?: string
  /** Existing manual price to edit */
  editing?: CompetitorPrice
}

const today = () => new Date().toISOString().slice(0, 10)

export function PriceFormModal({ open, onClose, onSaved, product, retailers, retailerId, editing }: Props) {
  const { t } = useT()
  const F = (k: string, v?: Record<string, string | number>) => t(`sourcing.priceForm.${k}`, v)
  // Mounted fresh each time it opens (parent renders it conditionally), so state starts from props
  const [form, setForm] = useState(() => {
    const rid = editing?.retailerId ?? retailerId ?? retailers[0]?.id ?? ''
    const r = retailers.find((x) => x.id === rid)
    return {
      retailerId: rid,
      price: editing ? String(editing.price) : '',
      originalPrice: editing?.originalPrice ? String(editing.originalPrice) : '',
      seller: editing?.seller ?? (r && r.id !== 'amazon' && r.id !== 'noon' ? r.name : ''),
      inStock: editing?.inStock ?? true,
      url: editing?.url ?? '',
      listedName: editing?.listedName ?? '',
      matchBy: editing?.matchBy ?? ((product.barcode ? 'barcode' : 'name_size') as MatchBy),
      verifiedAt: editing ? editing.verifiedAt.slice(0, 10) : today(),
      note: editing?.note ?? '',
    }
  })
  const [confirmed, setConfirmed] = useState(!!editing)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))
  const retailer = retailers.find((r) => r.id === form.retailerId)

  const submit = async () => {
    const e: Record<string, string> = {}
    const price = Number(form.price)
    if (!(price > 0)) e.price = F('errPrice')
    if (!isValidUrl(form.url) || !/^https?:\/\//.test(form.url)) e.url = F('errUrl')
    if (!form.seller.trim()) e.seller = F('errSeller')
    if (!form.listedName.trim()) e.listedName = F('errName')
    if (!confirmed) e.confirm = F('errConfirm')
    setErrors(e)
    if (Object.keys(e).length) return
    setBusy(true)
    try {
      const input: PriceInput = {
        retailerId: form.retailerId,
        price,
        originalPrice: Number(form.originalPrice) > price ? Number(form.originalPrice) : null,
        seller: form.seller.trim(),
        inStock: form.inStock,
        url: form.url.trim(),
        matchBy: form.matchBy,
        listedName: form.listedName.trim(),
        verifiedAt: new Date(`${form.verifiedAt}T12:00:00`).toISOString(),
        note: form.note.trim() || undefined,
      }
      await savePrice(product.id, input, editing?.id)
      toast.success(F('saved', { store: retailer?.name ?? '' }))
      onSaved()
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={F(editing ? 'titleEdit' : 'titleAdd')}
      description={F('desc')}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            {t('common.cancel')}
          </Button>
          <Button onClick={submit} loading={busy}>
            {F('save')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {product.decision && <p className="rounded-md border border-warning/20 bg-warning-soft px-3 py-2 text-[13px] text-warning">{F('reopenWarning')}</p>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label={F('retailer')} value={form.retailerId} onChange={(e) => set('retailerId', e.target.value)} options={retailers.map((r) => ({ value: r.id, label: `${r.name} · ${t(`sourcing.sourceShort.${r.collection}`)}` }))} disabled={!!editing} />
          {retailer && (
            <div className="flex items-end">
              <a href={searchLink(retailer, product)} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line px-3 text-[13px] font-medium text-ink hover:bg-mist">
                <ExternalLink className="size-3.5" aria-hidden />
                {t('sourcing.detail.searchStore')} — {retailer.name}
              </a>
            </div>
          )}
          <Input label={F('price')} type="number" inputMode="decimal" min={0} step="0.01" required value={form.price} onChange={(e) => set('price', e.target.value)} error={errors.price} dir="ltr" />
          <Input label={F('originalPrice')} type="number" inputMode="decimal" min={0} step="0.01" value={form.originalPrice} onChange={(e) => set('originalPrice', e.target.value)} dir="ltr" />
          <Input label={F('seller')} required value={form.seller} onChange={(e) => set('seller', e.target.value)} error={errors.seller} hint={F('sellerHint')} />
          <Input label={F('verifiedAt')} type="date" required value={form.verifiedAt} max={today()} onChange={(e) => set('verifiedAt', e.target.value)} dir="ltr" />
          <Input label={F('url')} required type="url" value={form.url} onChange={(e) => set('url', e.target.value)} error={errors.url} placeholder="https://" dir="ltr" wrapperClassName="sm:col-span-2" />
          <Input label={F('listedName')} required value={form.listedName} onChange={(e) => set('listedName', e.target.value)} error={errors.listedName} wrapperClassName="sm:col-span-2" />
        </div>
        <RadioGroup
          name="matchBy"
          label={F('matchBy')}
          value={form.matchBy}
          onChange={(v) => set('matchBy', v)}
          direction="row"
          options={[
            { value: 'barcode', label: t('sourcing.matchBy.barcode') },
            { value: 'name_size', label: t('sourcing.matchBy.name_size') },
          ]}
        />
        <Switch checked={form.inStock} onChange={(v) => set('inStock', v)} label={F('stock')} />
        <Textarea label={F('note')} rows={2} value={form.note} onChange={(e) => set('note', e.target.value)} />
        <div>
          <Checkbox checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} label={F('confirm')} />
          {errors.confirm && <p className="mt-1 text-xs text-error">{errors.confirm}</p>}
        </div>
      </div>
    </Modal>
  )
}
