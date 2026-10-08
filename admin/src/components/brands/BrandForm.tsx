import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ShieldCheck } from 'lucide-react'
import { CharCount, ImageUrlField, SLUG_RE, StickyActionBar } from '@/components/categories/formKit'
import { Button, FormSection, Input, Select, Switch, Textarea } from '@/components/ui'
import { IMAGE_POOL } from '@/data/catalog/images'
import { useT } from '@/i18n'
import { createBrand, updateBrand, type BrandInput } from '@/services/catalogService'
import type { AdminBrand } from '@/types'
import { cn, isValidUrl, slugify } from '@/utils'
import { BrandPreview } from './BrandPreview'
import { COUNTRIES, useCountryName } from './shared'

const BANNER_SAMPLES = [IMAGE_POOL.perfume[0], IMAGE_POOL.editorial[0], IMAGE_POOL.flatlay[0], IMAGE_POOL.skinset[1], IMAGE_POOL.salon[1], IMAGE_POOL.lipstick[2]]
const LOGO_SAMPLES = [IMAGE_POOL.perfume[2], IMAGE_POOL.serum[1], IMAGE_POOL.cream[2]]

type Errors = Partial<Record<'name' | 'nameAr' | 'slug' | 'logo' | 'banner' | 'website' | 'distributor', string>>

interface BrandFormProps {
  /** Existing slugs (id → slug) for uniqueness */
  existing: { id: string; slug: string }[]
  initial?: AdminBrand
}

export function BrandForm({ existing, initial }: BrandFormProps) {
  const { t, l } = useT()
  const navigate = useNavigate()
  const countryName = useCountryName()
  const isEdit = !!initial
  const [form, setForm] = useState<BrandInput>(() =>
    initial
      ? { name: initial.name, nameAr: initial.nameAr, slug: initial.slug, logo: initial.logo, banner: initial.banner, description: initial.description, country: initial.country, website: initial.website, distributor: initial.distributor, authorized: initial.authorized, featured: initial.featured, status: initial.status }
      : { name: '', nameAr: '', slug: '', logo: '', banner: '', description: { en: '', ar: '' }, country: '', website: '', distributor: '', authorized: false, featured: false, status: 'active' },
  )
  const [slugTouched, setSlugTouched] = useState(isEdit)
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)
  const set = <K extends keyof BrandInput>(key: K, value: BrandInput[K]) => setForm((f) => ({ ...f, [key]: value }))

  useEffect(() => {
    if (!slugTouched) setForm((f) => ({ ...f, slug: slugify(f.name) }))
  }, [form.name, slugTouched])

  const countryOptions = [...new Set([...COUNTRIES, ...(form.country ? [form.country] : [])])].map((c) => ({ value: c, label: countryName(c) }))

  const validate = (): Errors => {
    const e: Errors = {}
    const req = t('common.fieldRequired')
    if (!form.name.trim()) e.name = req
    if (!form.nameAr.trim()) e.nameAr = req
    if (!form.slug.trim()) e.slug = req
    else if (!SLUG_RE.test(form.slug)) e.slug = t('catalog.brandForm.slugInvalid')
    else if (existing.some((b) => b.slug === form.slug && b.id !== initial?.id)) e.slug = t('catalog.brandForm.slugTaken')
    if (form.logo && !isValidUrl(form.logo)) e.logo = t('catalog.brandForm.imageInvalid')
    if (form.banner && !isValidUrl(form.banner)) e.banner = t('catalog.brandForm.imageInvalid')
    if (form.website && !/^https?:\/\/[^\s.]+\.[^\s]{2,}/i.test(form.website.trim())) e.website = t('common.invalidUrl')
    if (form.authorized && !form.distributor.trim()) e.distributor = t('catalog.brandForm.distributorRequired')
    return e
  }

  const submit = async (ev: FormEvent) => {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) {
      toast.error(t('catalog.brandForm.fixErrors'))
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      return
    }
    setSaving(true)
    const payload: BrandInput = { ...form, name: form.name.trim(), nameAr: form.nameAr.trim(), slug: form.slug.trim(), logo: form.logo?.trim() || undefined, website: form.website.trim(), distributor: form.distributor.trim() }
    try {
      if (isEdit) {
        await updateBrand(initial!.id, payload)
        toast.success(t('catalog.brandForm.updated', { name: payload.name }))
        navigate(`/brands/${initial!.id}`)
      } else {
        const created = await createBrand(payload)
        toast.success(t('catalog.brandForm.created', { name: payload.name }))
        navigate(`/brands/${created.id}`)
      }
    } catch {
      toast.error(t('common.errorDesc'))
      setSaving(false)
    }
  }

  const cancel = () => navigate(isEdit ? `/brands/${initial!.id}` : '/brands')

  return (
    <form onSubmit={submit} noValidate>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <FormSection title={t('catalog.brandForm.sectionIdentity')} description={t('catalog.brandForm.sectionIdentityDesc')}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label={t('catalog.brandForm.name')} required value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} dir="ltr" placeholder="e.g. La Roche-Posay" />
              <Input label={t('catalog.brandForm.nameAr')} required value={form.nameAr} onChange={(e) => set('nameAr', e.target.value)} error={errors.nameAr} dir="rtl" placeholder="مثال: لاروش بوزيه" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label={t('catalog.brandForm.slug')}
                required
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  set('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))
                }}
                error={errors.slug}
                hint={t('catalog.brandForm.slugHint', { slug: form.slug || '…' })}
                dir="ltr"
              />
              <Select label={t('catalog.brandForm.country')} value={form.country} onChange={(e) => set('country', e.target.value)} options={countryOptions} placeholder={t('catalog.brandForm.countryPlaceholder')} />
            </div>
            <Input label={t('catalog.brandForm.website')} type="url" value={form.website} onChange={(e) => set('website', e.target.value)} error={errors.website} hint={t('catalog.brandForm.websiteHint')} dir="ltr" placeholder="https://www.brand.com" />
          </FormSection>

          <FormSection title={t('catalog.brandForm.sectionMedia')} description={t('catalog.brandForm.sectionMediaDesc')}>
            <ImageUrlField
              label={t('catalog.brandForm.logo')}
              value={form.logo ?? ''}
              onChange={(v) => set('logo', v)}
              error={errors.logo}
              hint={t('catalog.brandForm.logoHint')}
              samples={LOGO_SAMPLES}
              samplesLabel={t('catalog.categoryForm.samples')}
              sampleAria={t('catalog.categoryForm.useSample')}
              previewClass="aspect-square"
              contain
            />
            <div className="border-t border-line-soft pt-4">
              <ImageUrlField
                label={t('catalog.brandForm.banner')}
                value={form.banner}
                onChange={(v) => set('banner', v)}
                error={errors.banner}
                hint={t('catalog.brandForm.bannerHint')}
                samples={BANNER_SAMPLES}
                samplesLabel={t('catalog.categoryForm.samples')}
                sampleAria={t('catalog.categoryForm.useSample')}
                previewClass="aspect-[16/9]"
              />
            </div>
          </FormSection>

          <FormSection title={t('catalog.brandForm.sectionContent')}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Textarea label={t('catalog.brandForm.descEn')} value={form.description.en} onChange={(e) => set('description', { ...form.description, en: e.target.value })} dir="ltr" rows={5} aside={<CharCount value={form.description.en} max={400} />} />
              <Textarea label={t('catalog.brandForm.descAr')} value={form.description.ar} onChange={(e) => set('description', { ...form.description, ar: e.target.value })} dir="rtl" rows={5} aside={<CharCount value={form.description.ar} max={400} />} />
            </div>
          </FormSection>

          <FormSection title={t('catalog.brandForm.sectionDistribution')} description={t('catalog.brandForm.sectionDistributionDesc')}>
            <Input label={t('catalog.brandForm.distributor')} value={form.distributor} onChange={(e) => set('distributor', e.target.value)} error={errors.distributor} hint={t('catalog.brandForm.distributorHint')} required={form.authorized} placeholder="e.g. Riyadh Beauty Distribution Co." />
            <div className={cn('rounded-lg border p-4 transition-colors sm:p-5', form.authorized ? 'border-success/30 bg-success-soft/60' : 'border-champagne/40 bg-champagne-soft/50')}>
              <div className="flex items-start gap-3">
                <span className={cn('grid size-10 shrink-0 place-items-center rounded-full', form.authorized ? 'bg-success text-white' : 'bg-surface text-[#7a5a26]')}>
                  <ShieldCheck className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-ink">{t('catalog.brandForm.authorizedTitle')}</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted">{t('catalog.brandForm.authorizedBody')}</p>
                  </div>
                  <div className="rounded-md border border-line-soft bg-surface p-3">
                    <Switch checked={form.authorized} onChange={(v) => set('authorized', v)} label={t('catalog.brandForm.authorized')} description={form.authorized ? t('catalog.brandForm.authorizedOn') : t('catalog.brandForm.authorizedOff')} />
                  </div>
                  {form.authorized && (
                    <span className="inline-flex animate-fade-in items-center gap-1.5 rounded-full border border-success/20 bg-surface px-2.5 py-1 text-xs font-medium text-success">
                      <ShieldCheck className="size-3.5" />
                      {t('catalog.brandForm.authorizedBadge')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </FormSection>
        </div>

        <div className="min-w-0 space-y-6">
          <FormSection title={t('catalog.brandForm.sectionVisibility')}>
            <Switch checked={form.status === 'active'} onChange={(v) => set('status', v ? 'active' : 'inactive')} label={t('catalog.brandForm.status')} description={t('catalog.brandForm.statusDesc')} />
            <Switch checked={form.featured} onChange={(v) => set('featured', v)} label={t('catalog.brandForm.featured')} description={t('catalog.brandForm.featuredDesc')} />
          </FormSection>
          <div className="lg:sticky lg:top-20">
            <BrandPreview
              name={form.name}
              nameAr={form.nameAr}
              logo={form.logo || undefined}
              banner={form.banner}
              description={l(form.description) || form.description.ar}
              country={form.country}
              authorized={form.authorized}
              featured={form.featured}
              active={form.status === 'active'}
            />
          </div>
        </div>
      </div>

      <StickyActionBar>
        <Button variant="outline" onClick={cancel} disabled={saving}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" loading={saving}>
          {saving ? t('common.saving') : isEdit ? t('catalog.brandForm.save') : t('catalog.brandForm.create')}
        </Button>
      </StickyActionBar>
    </form>
  )
}
