import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Monitor, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Card, DatePicker, FormSection, Input, Segmented, Select, StatusBadge } from '@/components/ui'
import { fromDateInput, ImageUrlField, SAMPLE_BANNER_IMAGES, StickyActionBar, toDateInput, todayInput } from '@/components/marketing/shared'
import { useT } from '@/i18n'
import { createBanner, updateBanner, type BannerInput } from '@/services/marketingService'
import type { Banner, BannerPlacement, Lang } from '@/types'
import { isValidUrl } from '@/utils'
import { BannerPreview } from './BannerPreview'
import { BANNER_STATUSES, isValidCtaUrl, PLACEMENTS } from './bannerMeta'

interface FormState {
  title: string
  titleAr: string
  subtitle: string
  subtitleAr: string
  imageDesktop: string
  imageMobile: string
  ctaLabel: string
  ctaLabelAr: string
  ctaUrl: string
  placement: BannerPlacement
  startDate: string
  endDate: string
  status: Banner['status']
  sortOrder: string
}

type Errors = Partial<Record<keyof FormState, string>>

function initial(b?: Banner, defaults?: { sortOrder?: number; placement?: BannerPlacement }): FormState {
  if (!b)
    return {
      title: '',
      titleAr: '',
      subtitle: '',
      subtitleAr: '',
      imageDesktop: SAMPLE_BANNER_IMAGES[0],
      imageMobile: '',
      ctaLabel: 'Shop Now',
      ctaLabelAr: 'تسوقي الآن',
      ctaUrl: '/category/makeup',
      placement: defaults?.placement ?? 'homepage_hero',
      startDate: todayInput(),
      endDate: todayInput(30),
      status: 'published',
      sortOrder: String(defaults?.sortOrder ?? 1),
    }
  return {
    title: b.title,
    titleAr: b.titleAr,
    subtitle: b.subtitle,
    subtitleAr: b.subtitleAr,
    imageDesktop: b.imageDesktop,
    imageMobile: b.imageMobile === b.imageDesktop ? '' : b.imageMobile,
    ctaLabel: b.ctaLabel,
    ctaLabelAr: b.ctaLabelAr,
    ctaUrl: b.ctaUrl,
    placement: b.placement,
    startDate: toDateInput(b.startDate),
    endDate: toDateInput(b.endDate),
    status: b.status,
    sortOrder: String(b.sortOrder),
  }
}

export function BannerForm({ banner, defaultSortOrder, defaultPlacement }: { banner?: Banner; defaultSortOrder?: number; defaultPlacement?: BannerPlacement }) {
  const { t, lang } = useT()
  const navigate = useNavigate()
  const B = (k: string, v?: Record<string, string | number>) => t(`marketing.bannerForm.${k}`, v)
  const [form, setForm] = useState<FormState>(() => initial(banner, { sortOrder: defaultSortOrder, placement: defaultPlacement }))
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState<null | Banner['status']>(null)
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [previewLang, setPreviewLang] = useState<Lang>(lang)

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const validate = (status: Banner['status']): Errors => {
    const e: Errors = {}
    if (!form.title.trim()) e.title = B('errors.title')
    if (!form.titleAr.trim()) e.titleAr = B('errors.titleAr')
    if (!form.imageDesktop) e.imageDesktop = B('errors.image')
    else if (!isValidUrl(form.imageDesktop)) e.imageDesktop = B('errors.imageInvalid')
    if (form.imageMobile && !isValidUrl(form.imageMobile)) e.imageMobile = B('errors.imageInvalid')
    if (form.ctaUrl && !isValidCtaUrl(form.ctaUrl)) e.ctaUrl = B('errors.ctaUrl')
    if (!!form.ctaLabel.trim() !== !!form.ctaLabelAr.trim()) e[form.ctaLabel.trim() ? 'ctaLabelAr' : 'ctaLabel'] = B('errors.ctaLabel')
    if (!form.startDate) e.startDate = B('errors.dates')
    if (!form.endDate) e.endDate = B('errors.dates')
    else if (form.startDate && form.endDate < form.startDate) e.endDate = t('marketing.shared.endAfterStart')
    if (status === 'scheduled' && form.startDate && new Date(`${form.startDate}T00:00:00`).getTime() <= Date.now()) e.startDate = B('errors.scheduledStart')
    return e
  }

  const save = async (status: Banner['status']) => {
    const e = validate(status)
    setErrors(e)
    if (Object.keys(e).length) {
      toast.error(t('marketing.shared.fixErrors'))
      return
    }
    const input: BannerInput = {
      title: form.title.trim(),
      titleAr: form.titleAr.trim(),
      subtitle: form.subtitle.trim(),
      subtitleAr: form.subtitleAr.trim(),
      imageDesktop: form.imageDesktop,
      imageMobile: form.imageMobile || form.imageDesktop,
      ctaLabel: form.ctaLabel.trim(),
      ctaLabelAr: form.ctaLabelAr.trim(),
      ctaUrl: form.ctaUrl.trim(),
      placement: form.placement,
      startDate: fromDateInput(form.startDate),
      endDate: fromDateInput(form.endDate, true),
      status,
      sortOrder: Math.max(1, Math.round(Number(form.sortOrder) || 1)),
    }
    setSaving(status)
    try {
      if (banner) await updateBanner(banner.id, input)
      else await createBanner(input)
      const key = status === 'draft' ? 'savedDraftToast' : status === 'scheduled' ? 'scheduledToast' : 'publishedToast'
      toast.success(B(key, { name: input.title }))
      navigate('/banners')
    } catch {
      toast.error(t('marketing.shared.saveFailed'))
    } finally {
      setSaving(null)
    }
  }

  const primaryStatus: Banner['status'] = form.status === 'scheduled' ? 'scheduled' : 'published'

  return (
    <form
      noValidate
      onSubmit={(ev) => {
        ev.preventDefault()
        save(primaryStatus)
      }}
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="min-w-0 space-y-6 xl:col-span-3">
          <FormSection title={B('sections.content')} description={B('sections.contentDesc')}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label={B('titleEn')} required value={form.title} onChange={(e) => set('title', e.target.value)} error={errors.title} maxLength={80} aside={`${form.title.length}/80`} placeholder="Beauty, Authenticated." dir="ltr" />
              <Input label={B('titleAr')} required value={form.titleAr} onChange={(e) => set('titleAr', e.target.value)} error={errors.titleAr} maxLength={80} aside={`${form.titleAr.length}/80`} placeholder="جمال أصلي، موثّق." dir="rtl" lang="ar" />
              <Input label={B('subtitle')} value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} maxLength={140} placeholder="Free delivery on orders over SAR 250." dir="ltr" />
              <Input label={B('subtitleAr')} value={form.subtitleAr} onChange={(e) => set('subtitleAr', e.target.value)} maxLength={140} placeholder="توصيل مجاني للطلبات فوق 250 ريال." dir="rtl" lang="ar" />
            </div>
          </FormSection>

          <FormSection title={B('sections.media')} description={B('sections.mediaDesc')}>
            <ImageUrlField label={B('imageDesktop')} required value={form.imageDesktop} onChange={(v) => set('imageDesktop', v)} error={errors.imageDesktop} samplesLabel={B('samples')} />
            <ImageUrlField label={B('imageMobile')} value={form.imageMobile} onChange={(v) => set('imageMobile', v)} error={errors.imageMobile} hint={B('imageMobileHint')} samplesLabel={B('samples')} />
          </FormSection>

          <FormSection title={B('sections.cta')} description={B('sections.ctaDesc')}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label={B('ctaLabel')} value={form.ctaLabel} onChange={(e) => set('ctaLabel', e.target.value)} error={errors.ctaLabel} maxLength={30} dir="ltr" />
              <Input label={B('ctaLabelAr')} value={form.ctaLabelAr} onChange={(e) => set('ctaLabelAr', e.target.value)} error={errors.ctaLabelAr} maxLength={30} dir="rtl" lang="ar" />
            </div>
            <Input label={B('ctaUrl')} value={form.ctaUrl} onChange={(e) => set('ctaUrl', e.target.value.trim())} error={errors.ctaUrl} hint={B('ctaUrlHint')} dir="ltr" placeholder="/category/makeup" spellCheck={false} />
          </FormSection>

          <FormSection title={B('sections.publishing')}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select label={B('placement')} value={form.placement} onChange={(e) => set('placement', e.target.value as BannerPlacement)} options={PLACEMENTS.map((p) => ({ value: p, label: t(`marketing.shared.placements.${p}`) }))} />
              <Input label={B('sortOrder')} type="number" min={1} inputMode="numeric" value={form.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} hint={B('sortOrderHint')} dir="ltr" />
              <DatePicker label={t('marketing.shared.startDate')} required value={form.startDate} onChange={(v) => set('startDate', v)} error={errors.startDate} />
              <DatePicker label={t('marketing.shared.endDate')} required value={form.endDate} min={form.startDate || undefined} onChange={(v) => set('endDate', v)} error={errors.endDate} />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-ink">{B('status')}</span>
              <Segmented value={form.status} onChange={(v) => set('status', v)} options={BANNER_STATUSES.map((s) => ({ value: s, label: t(`status.${s}`) }))} className="w-fit" />
            </div>
          </FormSection>
        </div>

        <aside className="min-w-0 xl:col-span-2">
          <Card
            className="xl:sticky xl:top-20"
            title={B('preview')}
            description={B('previewNote')}
            actions={<StatusBadge status={form.status} />}
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <Segmented
                size="sm"
                value={device}
                onChange={setDevice}
                options={[
                  { value: 'desktop', label: <span className="inline-flex items-center gap-1.5"><Monitor className="size-3.5" />{t('common.desktop')}</span> },
                  { value: 'mobile', label: <span className="inline-flex items-center gap-1.5"><Smartphone className="size-3.5" />{t('common.mobile')}</span> },
                ]}
              />
              <Segmented
                size="sm"
                value={previewLang}
                onChange={setPreviewLang}
                options={[
                  { value: 'en', label: 'EN' },
                  { value: 'ar', label: 'AR' },
                ]}
              />
            </div>
            <BannerPreview device={device} lang={previewLang} data={form} />
            <p className="mt-3 truncate text-xs text-muted" dir="ltr">
              {form.ctaUrl || '—'} · {t(`marketing.shared.placements.${form.placement}`)}
            </p>
          </Card>
        </aside>
      </div>

      <StickyActionBar>
        <Button variant="ghost" onClick={() => navigate('/banners')} disabled={!!saving}>
          {t('common.cancel')}
        </Button>
        <Button variant="outline" onClick={() => save('draft')} loading={saving === 'draft'} disabled={!!saving && saving !== 'draft'}>
          {B('saveDraft')}
        </Button>
        <Button type="submit" loading={saving === primaryStatus} disabled={!!saving && saving !== primaryStatus}>
          {primaryStatus === 'scheduled' ? B('schedule') : B('publish')}
        </Button>
      </StickyActionBar>
    </form>
  )
}
