import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Percent, Sparkles, Truck, Wand2, Banknote } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Card, DatePicker, FormSection, Input, RadioGroup, Switch, Textarea } from '@/components/ui'
import { ChipToggleGroup, fromDateInput, MultiCheckList, numOrUndef, StickyActionBar, toDateInput, todayInput, type CheckOption } from '@/components/marketing/shared'
import { useAsync } from '@/hooks'
import { useT } from '@/i18n'
import { getAllBrands, getCategories } from '@/services/catalogService'
import { createCoupon, isCouponCodeTaken, updateCoupon, type CouponInput } from '@/services/marketingService'
import type { Coupon, CouponStatus, CouponType, CustomerSegment } from '@/types'
import { CouponPreview } from './CouponPreview'
import { generateCouponCode } from './CouponValue'

interface FormState {
  code: string
  description: string
  type: CouponType
  value: string
  minOrder: string
  maxDiscount: string
  usageLimit: string
  perCustomerLimit: string
  startDate: string
  endDate: string
  categoryIds: string[]
  brandIds: string[]
  segment: CustomerSegment
  enabled: boolean
}

type Errors = Partial<Record<keyof FormState, string>>

const SEGMENTS: CustomerSegment[] = ['all', 'new', 'vip', 'professional', 'inactive']

function fromCoupon(c?: Coupon): FormState {
  if (!c)
    return {
      code: '',
      description: '',
      type: 'percentage',
      value: '10',
      minOrder: '0',
      maxDiscount: '',
      usageLimit: '',
      perCustomerLimit: '1',
      startDate: todayInput(),
      endDate: todayInput(30),
      categoryIds: [],
      brandIds: [],
      segment: 'all',
      enabled: true,
    }
  return {
    code: c.code,
    description: c.description,
    type: c.type,
    value: String(c.value),
    minOrder: String(c.minOrder),
    maxDiscount: c.maxDiscount !== undefined ? String(c.maxDiscount) : '',
    usageLimit: c.usageLimit !== undefined ? String(c.usageLimit) : '',
    perCustomerLimit: c.perCustomerLimit !== undefined ? String(c.perCustomerLimit) : '',
    startDate: toDateInput(c.startDate),
    endDate: toDateInput(c.endDate),
    categoryIds: c.categoryIds,
    brandIds: c.brandIds,
    segment: c.segment,
    enabled: c.enabled,
  }
}

/** Templates matching the store's best-performing codes */
const TEMPLATES: { key: string; label: string; patch: Partial<FormState> }[] = [
  { key: 'WELCOME10', label: 'exampleWelcome', patch: { code: 'WELCOME10', description: '10% off the first order for new customers', type: 'percentage', value: '10', minOrder: '0', maxDiscount: '100', usageLimit: '5000', perCustomerLimit: '1', segment: 'new', categoryIds: [], brandIds: [] } },
  { key: 'BEAUTY15', label: 'exampleBeauty', patch: { code: 'BEAUTY15', description: '15% off orders over 300 SAR', type: 'percentage', value: '15', minOrder: '300', maxDiscount: '150', usageLimit: '2000', perCustomerLimit: '3', segment: 'all', categoryIds: [], brandIds: [] } },
  { key: 'SALON20', label: 'exampleSalon', patch: { code: 'SALON20', description: '20% off professional orders over 500 SAR', type: 'percentage', value: '20', minOrder: '500', maxDiscount: '600', usageLimit: '', perCustomerLimit: '', segment: 'professional', categoryIds: ['salon-supplies'], brandIds: [] } },
]

function previewStatus(f: FormState): CouponStatus {
  if (!f.enabled) return 'disabled'
  const now = Date.now()
  if (f.startDate && new Date(`${f.startDate}T00:00:00`).getTime() > now) return 'scheduled'
  if (f.endDate && new Date(`${f.endDate}T23:59:59`).getTime() < now) return 'expired'
  return 'active'
}

export function CouponForm({ coupon }: { coupon?: Coupon }) {
  const { t, l } = useT()
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(() => fromCoupon(coupon))
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)
  const F = (k: string, v?: Record<string, string | number>) => t(`marketing.couponForm.${k}`, v)

  const cats = useAsync(() => getCategories(), [])
  const brands = useAsync(() => getAllBrands(), [])

  const categoryOptions = useMemo<CheckOption[]>(() => {
    const list = cats.data ?? []
    const tops = list.filter((c) => !c.parentId).sort((a, b) => a.sortOrder - b.sortOrder)
    return tops.flatMap((top) => [
      { value: top.id, label: l(top.name), sub: undefined },
      ...list
        .filter((c) => c.parentId === top.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((c) => ({ value: c.id, label: l(c.name), child: true })),
    ])
  }, [cats.data, l])
  const brandOptions = useMemo<CheckOption[]>(() => (brands.data ?? []).map((b) => ({ value: b.id, label: b.name, sub: b.nameAr })), [brands.data])

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const validate = (): Errors => {
    const e: Errors = {}
    const code = form.code.trim()
    if (!code) e.code = F('errors.codeRequired')
    else if (!/^[A-Z0-9][A-Z0-9-]{2,19}$/.test(code)) e.code = F('errors.codeFormat')
    else if (isCouponCodeTaken(code, coupon?.id)) e.code = F('errors.codeTaken')
    if (form.type !== 'free_shipping') {
      const v = Number(form.value)
      if (!form.value || !Number.isFinite(v) || v <= 0) e.value = F('errors.valueRequired')
      else if (form.type === 'percentage' && v > 100) e.value = F('errors.percentMax')
    }
    if (form.minOrder && Number(form.minOrder) < 0) e.minOrder = F('errors.negative')
    if (form.maxDiscount && Number(form.maxDiscount) < 0) e.maxDiscount = F('errors.negative')
    const whole = (s: string) => s === '' || (Number.isInteger(Number(s)) && Number(s) >= 1)
    if (!whole(form.usageLimit)) e.usageLimit = F('errors.wholeNumber')
    if (!whole(form.perCustomerLimit)) e.perCustomerLimit = F('errors.wholeNumber')
    if (!form.startDate) e.startDate = F('errors.startRequired')
    if (!form.endDate) e.endDate = F('errors.endRequired')
    else if (form.startDate && form.endDate < form.startDate) e.endDate = t('marketing.shared.endAfterStart')
    return e
  }

  const submit = async () => {
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) {
      toast.error(t('marketing.shared.fixErrors'))
      return
    }
    const input: CouponInput = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      type: form.type,
      value: form.type === 'free_shipping' ? 0 : Number(form.value),
      minOrder: Number(form.minOrder || 0),
      maxDiscount: form.type === 'percentage' ? numOrUndef(form.maxDiscount) : undefined,
      usageLimit: numOrUndef(form.usageLimit),
      perCustomerLimit: numOrUndef(form.perCustomerLimit),
      startDate: fromDateInput(form.startDate),
      endDate: fromDateInput(form.endDate, true),
      categoryIds: form.categoryIds,
      brandIds: form.brandIds,
      segment: form.segment,
      enabled: form.enabled,
    }
    setSaving(true)
    try {
      if (coupon) {
        await updateCoupon(coupon.id, input)
        toast.success(F('updatedToast', { code: input.code }))
      } else {
        await createCoupon(input)
        toast.success(F('createdToast', { code: input.code }))
      }
      navigate('/coupons')
    } catch {
      toast.error(t('marketing.shared.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const typeIcon = { percentage: <Percent className="size-4" />, fixed: <Banknote className="size-4" />, free_shipping: <Truck className="size-4" /> }

  return (
    <form
      noValidate
      onSubmit={(ev) => {
        ev.preventDefault()
        submit()
      }}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <FormSection title={F('sections.details')} description={F('sections.detailsDesc')}>
            <div className="flex items-start gap-2">
              <Input
                label={F('code')}
                required
                value={form.code}
                onChange={(e) => set('code', e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 20))}
                hint={F('codeHint')}
                error={errors.code}
                dir="ltr"
                maxLength={20}
                autoComplete="off"
                spellCheck={false}
                className="font-mono font-semibold tracking-wider"
                placeholder="BEAUTY15"
                wrapperClassName="flex-1"
              />
              <Button variant="outline" icon={<Wand2 className="size-4" />} onClick={() => set('code', generateCouponCode())} className="mt-[26px]">
                {F('generate')}
              </Button>
            </div>
            <Textarea label={F('description')} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder={F('descriptionPh')} rows={2} maxLength={160} aside={`${form.description.length}/160`} />
          </FormSection>

          <FormSection title={F('sections.discount')} description={F('sections.discountDesc')}>
            <div className="[&_fieldset>div]:grid [&_fieldset>div]:grid-cols-1 sm:[&_fieldset>div]:grid-cols-3">
              <RadioGroup<CouponType>
                name="coupon-type"
                variant="card"
                direction="row"
                value={form.type}
                onChange={(v) => set('type', v)}
                options={(['percentage', 'fixed', 'free_shipping'] as CouponType[]).map((v) => ({
                  value: v,
                  label: (
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      {typeIcon[v]}
                      {t(`marketing.shared.couponTypes.${v}`)}
                    </span>
                  ),
                  description: F(`typeDesc.${v}`),
                }))}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {form.type !== 'free_shipping' && (
                <Input
                  label={form.type === 'percentage' ? F('valuePercent') : F('valueFixed')}
                  required
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={form.type === 'percentage' ? 100 : undefined}
                  value={form.value}
                  onChange={(e) => set('value', e.target.value)}
                  error={errors.value}
                  trailing={<span className="text-xs">{form.type === 'percentage' ? '%' : t('common.sar')}</span>}
                  dir="ltr"
                />
              )}
              <Input label={F('minOrder')} type="number" inputMode="decimal" min={0} value={form.minOrder} onChange={(e) => set('minOrder', e.target.value)} hint={F('minOrderHint')} error={errors.minOrder} dir="ltr" />
              {form.type === 'percentage' && (
                <Input label={F('maxDiscount')} type="number" inputMode="decimal" min={0} value={form.maxDiscount} onChange={(e) => set('maxDiscount', e.target.value)} hint={F('maxDiscountHint')} error={errors.maxDiscount} dir="ltr" />
              )}
            </div>
          </FormSection>

          <FormSection title={F('sections.limits')} description={F('sections.limitsDesc')}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label={F('usageLimit')} type="number" inputMode="numeric" min={1} value={form.usageLimit} onChange={(e) => set('usageLimit', e.target.value)} hint={F('usageLimitHint')} error={errors.usageLimit} placeholder={t('marketing.shared.unlimited')} dir="ltr" />
              <Input label={F('perCustomerLimit')} type="number" inputMode="numeric" min={1} value={form.perCustomerLimit} onChange={(e) => set('perCustomerLimit', e.target.value)} hint={F('perCustomerHint')} error={errors.perCustomerLimit} placeholder={t('marketing.shared.unlimited')} dir="ltr" />
            </div>
          </FormSection>

          <FormSection title={F('sections.schedule')} description={F('sections.scheduleDesc')}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DatePicker label={t('marketing.shared.startDate')} required value={form.startDate} onChange={(v) => set('startDate', v)} error={errors.startDate} />
              <DatePicker label={t('marketing.shared.endDate')} required value={form.endDate} min={form.startDate || undefined} onChange={(v) => set('endDate', v)} error={errors.endDate} />
            </div>
          </FormSection>

          <FormSection title={F('sections.eligibility')} description={F('sections.eligibilityDesc')}>
            <ChipToggleGroup<CustomerSegment>
              label={F('segment')}
              options={SEGMENTS.map((s) => ({ value: s, label: t(`marketing.shared.segments.${s}`) }))}
              value={[form.segment]}
              onChange={(v) => set('segment', v.filter((x) => x !== form.segment)[0] ?? form.segment)}
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <MultiCheckList label={F('categories')} hint={F('categoriesHint')} options={categoryOptions} value={form.categoryIds} onChange={(v) => set('categoryIds', v)} loading={cats.loading && !cats.data} />
              <MultiCheckList label={F('brands')} hint={F('brandsHint')} options={brandOptions} value={form.brandIds} onChange={(v) => set('brandIds', v)} loading={brands.loading && !brands.data} />
            </div>
          </FormSection>
        </div>

        <aside className="min-w-0 space-y-6">
          <div className="space-y-6 lg:sticky lg:top-20">
            <Card title={F('preview.title')} description={F('preview.note')}>
              <CouponPreview
                data={{
                  code: form.code,
                  description: form.description,
                  type: form.type,
                  value: Number(form.value) || 0,
                  minOrder: Number(form.minOrder) || 0,
                  maxDiscount: numOrUndef(form.maxDiscount),
                  usageLimit: numOrUndef(form.usageLimit),
                  perCustomerLimit: numOrUndef(form.perCustomerLimit),
                  startDate: form.startDate ? fromDateInput(form.startDate) : undefined,
                  endDate: form.endDate ? fromDateInput(form.endDate, true) : undefined,
                  restricted: form.categoryIds.length + form.brandIds.length > 0,
                  segment: form.segment,
                  status: previewStatus(form),
                }}
              />
            </Card>
            <Card title={F('sections.status')}>
              <Switch checked={form.enabled} onChange={(v) => set('enabled', v)} label={F('enabled')} description={F('enabledDesc')} />
            </Card>
            {!coupon && (
              <Card title={F('examples')} description={F('examplesDesc')}>
                <div className="space-y-2">
                  {TEMPLATES.map((tp) => (
                    <button
                      key={tp.key}
                      type="button"
                      onClick={() => {
                        const code = isCouponCodeTaken(tp.key) ? generateCouponCode(tp.key.replace(/\d+$/, '')) : tp.key
                        setForm((f) => ({ ...f, ...tp.patch, code }))
                        setErrors({})
                      }}
                      className="flex w-full items-center gap-3 rounded-md border border-line px-3 py-2.5 text-start transition-colors hover:border-ink/30 hover:bg-mist"
                    >
                      <Sparkles className="size-4 shrink-0 text-champagne" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-medium text-ink">{F(tp.label)}</span>
                        <span className="block truncate text-xs text-muted">{tp.patch.description}</span>
                      </span>
                      <span className="font-mono text-xs font-semibold text-ink" dir="ltr">
                        {tp.key}
                      </span>
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </aside>
      </div>

      <StickyActionBar>
        <Button variant="outline" onClick={() => navigate('/coupons')} disabled={saving}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" loading={saving}>
          {coupon ? t('common.saveChanges') : F('saveCreate')}
        </Button>
      </StickyActionBar>
    </form>
  )
}

