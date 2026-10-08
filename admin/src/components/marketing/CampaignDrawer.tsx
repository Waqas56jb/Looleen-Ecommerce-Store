import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button, DatePicker, Drawer, Input, Select } from '@/components/ui'
import { useAsync } from '@/hooks'
import { useT } from '@/i18n'
import { getCoupons, saveCampaign, type CampaignInput } from '@/services/marketingService'
import type { Campaign, CampaignStatus, CampaignType } from '@/types'
import { CAMPAIGN_STATUSES, CAMPAIGN_TYPES, CHANNEL_ICONS, CHANNELS, type Channel } from './campaignMeta'
import { ChipToggleGroup, fromDateInput, toDateInput, todayInput } from './shared'

interface FormState {
  name: string
  nameAr: string
  type: CampaignType
  status: CampaignStatus
  startDate: string
  endDate: string
  budget: string
  channels: Channel[]
  couponCode: string
}

type Errors = Partial<Record<keyof FormState, string>>

const blank = (): FormState => ({ name: '', nameAr: '', type: 'seasonal', status: 'draft', startDate: todayInput(7), endDate: todayInput(14), budget: '10000', channels: ['email', 'onsite'], couponCode: '' })

const fromCampaign = (c: Campaign): FormState => ({
  name: c.name,
  nameAr: c.nameAr,
  type: c.type,
  status: c.status,
  startDate: toDateInput(c.startDate),
  endDate: toDateInput(c.endDate),
  budget: String(c.budget),
  channels: c.channels,
  couponCode: c.couponCode ?? '',
})

export function CampaignDrawer({ open, campaign, onClose, onSaved }: { open: boolean; campaign?: Campaign | null; onClose: () => void; onSaved: () => void }) {
  const { t } = useT()
  const [form, setForm] = useState<FormState>(blank)
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)
  const coupons = useAsync(() => (open ? getCoupons({ pageSize: 1000, sortBy: 'code', sortDir: 'asc' }) : Promise.resolve(undefined)), [open])
  const C = (k: string, v?: Record<string, string | number>) => t(`marketing.campaigns.${k}`, v)

  useEffect(() => {
    if (!open) return
    setForm(campaign ? fromCampaign(campaign) : blank())
    setErrors({})
  }, [open, campaign])

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const submit = async () => {
    const e: Errors = {}
    if (!form.name.trim()) e.name = C('errors.name')
    if (!form.nameAr.trim()) e.nameAr = C('errors.nameAr')
    if (form.budget === '' || !(Number(form.budget) >= 0)) e.budget = C('errors.budget')
    if (!form.channels.length) e.channels = C('errors.channels')
    if (!form.startDate) e.startDate = t('marketing.couponForm.errors.startRequired')
    if (!form.endDate) e.endDate = t('marketing.couponForm.errors.endRequired')
    else if (form.startDate && form.endDate < form.startDate) e.endDate = t('marketing.shared.endAfterStart')
    setErrors(e)
    if (Object.keys(e).length) return
    const input: CampaignInput = {
      name: form.name.trim(),
      nameAr: form.nameAr.trim(),
      type: form.type,
      status: form.status,
      startDate: fromDateInput(form.startDate),
      endDate: fromDateInput(form.endDate, true),
      budget: Number(form.budget),
      channels: CHANNELS.filter((c) => form.channels.includes(c)),
      couponCode: form.couponCode || undefined,
    }
    setSaving(true)
    try {
      await saveCampaign(input, campaign?.id)
      toast.success(C(campaign ? 'updatedToast' : 'createdToast', { name: input.name }))
      onSaved()
      onClose()
    } catch {
      toast.error(t('marketing.shared.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const couponOptions = (coupons.data?.items ?? []).map((c) => ({ value: c.code, label: `${c.code} · ${t(`status.${c.status}`)}` }))
  if (form.couponCode && !couponOptions.some((o) => o.value === form.couponCode)) couponOptions.unshift({ value: form.couponCode, label: form.couponCode })

  return (
    <Drawer
      open={open}
      onClose={saving ? () => undefined : onClose}
      title={campaign ? C('editTitle') : C('createTitle')}
      widthClass="max-w-lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving} className="flex-1 sm:flex-none">
            {t('common.cancel')}
          </Button>
          <Button onClick={submit} loading={saving} className="flex-1 sm:ms-auto sm:flex-none">
            {campaign ? t('common.saveChanges') : C('saveCreate')}
          </Button>
        </>
      }
    >
      <form
        noValidate
        className="space-y-4 p-5"
        onSubmit={(ev) => {
          ev.preventDefault()
          submit()
        }}
      >
        <Input label={C('name')} required value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} placeholder="Fragrance Week" data-autofocus />
        <Input label={C('nameAr')} required value={form.nameAr} onChange={(e) => set('nameAr', e.target.value)} error={errors.nameAr} dir="rtl" lang="ar" placeholder="أسبوع العطور" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label={C('type')} value={form.type} onChange={(e) => set('type', e.target.value as CampaignType)} options={CAMPAIGN_TYPES.map((v) => ({ value: v, label: t(`marketing.shared.campaignTypes.${v}`) }))} />
          <Select label={C('status')} value={form.status} onChange={(e) => set('status', e.target.value as CampaignStatus)} options={CAMPAIGN_STATUSES.map((v) => ({ value: v, label: t(`status.${v}`) }))} />
          <DatePicker label={t('marketing.shared.startDate')} required value={form.startDate} onChange={(v) => set('startDate', v)} error={errors.startDate} />
          <DatePicker label={t('marketing.shared.endDate')} required value={form.endDate} min={form.startDate || undefined} onChange={(v) => set('endDate', v)} error={errors.endDate} />
        </div>
        <Input label={C('budget')} required type="number" inputMode="decimal" min={0} value={form.budget} onChange={(e) => set('budget', e.target.value)} error={errors.budget} dir="ltr" trailing={<span className="text-xs">{t('common.sar')}</span>} />
        <ChipToggleGroup<Channel> label={C('channels')} options={CHANNELS.map((c) => ({ value: c, label: t(`marketing.shared.channels.${c}`), icon: CHANNEL_ICONS[c] }))} value={form.channels} onChange={(v) => set('channels', v)} error={errors.channels} />
        <Select label={C('coupon')} hint={C('couponHint')} value={form.couponCode} onChange={(e) => set('couponCode', e.target.value)} placeholder={C('noCoupon')} options={couponOptions} dir="ltr" />
        <button type="submit" hidden />
      </form>
    </Drawer>
  )
}
