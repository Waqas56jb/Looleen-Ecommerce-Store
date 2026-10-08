import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button, DatePicker, Drawer, Input, Segmented, Switch, Textarea, Thumb } from '@/components/ui'
import { useAsync } from '@/hooks'
import { useT } from '@/i18n'
import { getAllBrands, getCategories } from '@/services/catalogService'
import { saveOffer, type OfferInput } from '@/services/marketingService'
import { getAllProducts } from '@/services/productService'
import type { Lang, Offer } from '@/types'
import { isValidUrl } from '@/utils'
import { OfferPreview } from './OfferPreview'
import { fromDateInput, ImageUrlField, MultiCheckList, SAMPLE_BANNER_IMAGES, toDateInput, todayInput, type CheckOption } from './shared'

interface FormState {
  title: string
  titleAr: string
  description: string
  banner: string
  discountType: Offer['discountType']
  discountValue: string
  productIds: string[]
  categoryIds: string[]
  brandIds: string[]
  startDate: string
  endDate: string
  active: boolean
}

type Errors = Partial<Record<keyof FormState, string>>

const blank = (): FormState => ({
  title: '',
  titleAr: '',
  description: '',
  banner: SAMPLE_BANNER_IMAGES[3],
  discountType: 'percentage',
  discountValue: '20',
  productIds: [],
  categoryIds: [],
  brandIds: [],
  startDate: todayInput(),
  endDate: todayInput(14),
  active: true,
})

const fromOffer = (o: Offer): FormState => ({
  title: o.title,
  titleAr: o.titleAr,
  description: o.description,
  banner: o.banner,
  discountType: o.discountType,
  discountValue: String(o.discountValue),
  productIds: o.productIds,
  categoryIds: o.categoryIds,
  brandIds: o.brandIds,
  startDate: toDateInput(o.startDate),
  endDate: toDateInput(o.endDate),
  active: o.status !== 'disabled',
})

export function OfferDrawer({ open, offer, onClose, onSaved }: { open: boolean; offer?: Offer | null; onClose: () => void; onSaved: () => void }) {
  const { t, l, lang } = useT()
  const O = (k: string, v?: Record<string, string | number>) => t(`marketing.offers.${k}`, v)
  const [form, setForm] = useState<FormState>(blank)
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)
  const [previewLang, setPreviewLang] = useState<Lang>(lang)

  const products = useAsync(() => (open ? getAllProducts() : Promise.resolve(undefined)), [open])
  const cats = useAsync(() => (open ? getCategories() : Promise.resolve(undefined)), [open])
  const brands = useAsync(() => (open ? getAllBrands() : Promise.resolve(undefined)), [open])

  useEffect(() => {
    if (!open) return
    setForm(offer ? fromOffer(offer) : blank())
    setErrors({})
    setPreviewLang(lang)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, offer])

  const productOptions = useMemo<CheckOption[]>(
    () => (products.data ?? []).map((p) => ({ value: p.id, label: lang === 'ar' ? p.nameAr : p.name, sub: `${p.brandName} · ${p.sku}`, thumb: <Thumb src={p.images[0]} alt="" size="xs" /> })),
    [products.data, lang],
  )
  const categoryOptions = useMemo<CheckOption[]>(() => {
    const list = cats.data ?? []
    return list
      .filter((c) => !c.parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .flatMap((top) => [{ value: top.id, label: l(top.name) }, ...list.filter((c) => c.parentId === top.id).map((c) => ({ value: c.id, label: l(c.name), child: true }))])
  }, [cats.data, l])
  const brandOptions = useMemo<CheckOption[]>(() => (brands.data ?? []).map((b) => ({ value: b.id, label: b.name, sub: b.nameAr })), [brands.data])

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const submit = async () => {
    const e: Errors = {}
    if (!form.title.trim()) e.title = O('errors.title')
    if (!form.titleAr.trim()) e.titleAr = O('errors.titleAr')
    const v = Number(form.discountValue)
    if (!form.discountValue || !(v > 0)) e.discountValue = O('errors.value')
    else if (form.discountType === 'percentage' && v > 100) e.discountValue = O('errors.percentMax')
    if (form.banner && !isValidUrl(form.banner)) e.banner = O('errors.banner')
    if (!form.startDate) e.startDate = O('errors.dates')
    if (!form.endDate) e.endDate = O('errors.dates')
    else if (form.startDate && form.endDate < form.startDate) e.endDate = t('marketing.shared.endAfterStart')
    setErrors(e)
    if (Object.keys(e).length) return
    const input: OfferInput = {
      title: form.title.trim(),
      titleAr: form.titleAr.trim(),
      description: form.description.trim(),
      banner: form.banner,
      discountType: form.discountType,
      discountValue: v,
      productIds: form.productIds,
      categoryIds: form.categoryIds,
      brandIds: form.brandIds,
      startDate: fromDateInput(form.startDate),
      endDate: fromDateInput(form.endDate, true),
      status: form.active ? 'active' : 'disabled',
    }
    setSaving(true)
    try {
      await saveOffer(input, offer?.id)
      toast.success(O(offer ? 'updatedToast' : 'createdToast', { name: input.title }))
      onSaved()
      onClose()
    } catch {
      toast.error(t('marketing.shared.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={saving ? () => undefined : onClose}
      title={offer ? O('editTitle') : O('createTitle')}
      widthClass="max-w-5xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving} className="flex-1 sm:flex-none">
            {t('common.cancel')}
          </Button>
          <Button onClick={submit} loading={saving} className="flex-1 sm:ms-auto sm:flex-none">
            {offer ? t('common.saveChanges') : O('saveCreate')}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-5">
        <form
          noValidate
          className="min-w-0 space-y-4 lg:col-span-3"
          onSubmit={(ev) => {
            ev.preventDefault()
            submit()
          }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label={O('offerTitle')} required value={form.title} onChange={(e) => set('title', e.target.value)} error={errors.title} placeholder="Fragrance Week" data-autofocus />
            <Input label={O('offerTitleAr')} required value={form.titleAr} onChange={(e) => set('titleAr', e.target.value)} error={errors.titleAr} dir="rtl" lang="ar" placeholder="أسبوع العطور" />
          </div>
          <Textarea label={O('descriptionLabel')} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder={O('descriptionPh')} rows={2} />
          <ImageUrlField label={O('banner')} value={form.banner} onChange={(v) => set('banner', v)} error={errors.banner} hint={O('bannerHint')} samplesLabel={O('samples')} />
          <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-ink">{O('discountType')}</span>
              <Segmented
                value={form.discountType}
                onChange={(v) => set('discountType', v)}
                options={[
                  { value: 'percentage', label: O('percentage') },
                  { value: 'fixed', label: O('fixed') },
                ]}
              />
            </div>
            <Input
              label={O('value')}
              required
              type="number"
              inputMode="decimal"
              min={0}
              value={form.discountValue}
              onChange={(e) => set('discountValue', e.target.value)}
              error={errors.discountValue}
              dir="ltr"
              trailing={<span className="text-xs">{form.discountType === 'percentage' ? '%' : t('common.sar')}</span>}
            />
            <DatePicker label={t('marketing.shared.startDate')} required value={form.startDate} onChange={(v) => set('startDate', v)} error={errors.startDate} />
            <DatePicker label={t('marketing.shared.endDate')} required value={form.endDate} min={form.startDate || undefined} onChange={(v) => set('endDate', v)} error={errors.endDate} />
          </div>
          <p className="text-xs text-muted">{O('scopeHint')}</p>
          <MultiCheckList label={O('products')} options={productOptions} value={form.productIds} onChange={(v) => set('productIds', v)} loading={products.loading && !products.data} maxHeightClass="max-h-64" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <MultiCheckList label={O('categories')} options={categoryOptions} value={form.categoryIds} onChange={(v) => set('categoryIds', v)} loading={cats.loading && !cats.data} maxHeightClass="max-h-52" />
            <MultiCheckList label={O('brands')} options={brandOptions} value={form.brandIds} onChange={(v) => set('brandIds', v)} loading={brands.loading && !brands.data} maxHeightClass="max-h-52" />
          </div>
          <div className="rounded-md border border-line p-3">
            <Switch checked={form.active} onChange={(v) => set('active', v)} label={O('active')} description={O('activeDesc')} />
          </div>
          <button type="submit" hidden />
        </form>
        <aside className="min-w-0 lg:col-span-2">
          <div className="space-y-3 lg:sticky lg:top-0">
            <div className="flex items-center justify-between gap-2">
              <p className="eyebrow">{O('storefrontPreview')}</p>
              <Segmented
                size="sm"
                value={previewLang}
                onChange={setPreviewLang}
                options={[
                  { value: 'en', label: 'EN' },
                  { value: 'ar', label: 'ع' },
                ]}
              />
            </div>
            <OfferPreview
              lang={previewLang}
              data={{ title: form.title, titleAr: form.titleAr, description: form.description, banner: form.banner, discountType: form.discountType, discountValue: Number(form.discountValue) || 0, startDate: form.startDate, endDate: form.endDate ? fromDateInput(form.endDate, true) : '' }}
            />
          </div>
        </aside>
      </div>
    </Drawer>
  )
}
