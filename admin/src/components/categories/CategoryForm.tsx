import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button, FormSection, Input, Select, Switch, Textarea } from '@/components/ui'
import { IMAGE_POOL } from '@/data/catalog/images'
import { useT } from '@/i18n'
import { createCategory, updateCategory, type CategoryInput } from '@/services/catalogService'
import type { AdminCategory } from '@/types'
import { isValidUrl, slugify } from '@/utils'
import { CategoryPreview } from './CategoryPreview'
import { CharCount, ImageUrlField, SLUG_RE, StickyActionBar } from './formKit'

const SAMPLES = [IMAGE_POOL.skinmodel[0], IMAGE_POOL.flatlay[1], IMAGE_POOL.perfume[0], IMAGE_POOL.facialdevice[0], IMAGE_POOL.salon[0], IMAGE_POOL.lipstick[0]]

type CategoryWithCount = AdminCategory & { productCount: number }

interface CategoryFormProps {
  /** All categories (for parent options, slug uniqueness and sort order) */
  categories: CategoryWithCount[]
  initial?: AdminCategory
  defaultParent?: string | null
}

type Errors = Partial<Record<'nameEn' | 'nameAr' | 'slug' | 'image' | 'seoTitle' | 'seoDescription' | 'sortOrder', string>>

export function CategoryForm({ categories, initial, defaultParent = null }: CategoryFormProps) {
  const { t, l } = useT()
  const navigate = useNavigate()
  const isEdit = !!initial
  const siblingsCount = (parentId: string | null) => categories.filter((c) => c.parentId === parentId && c.id !== initial?.id).length

  const validParent = defaultParent && categories.some((c) => c.id === defaultParent && c.parentId === null) ? defaultParent : null
  const [form, setForm] = useState<CategoryInput>(() =>
    initial
      ? { name: initial.name, slug: initial.slug, parentId: initial.parentId, description: initial.description, image: initial.image, seoTitle: initial.seoTitle, seoDescription: initial.seoDescription, status: initial.status, sortOrder: initial.sortOrder }
      : { name: { en: '', ar: '' }, slug: '', parentId: validParent, description: { en: '', ar: '' }, image: '', seoTitle: '', seoDescription: '', status: 'active', sortOrder: siblingsCount(validParent) + 1 },
  )
  const [slugTouched, setSlugTouched] = useState(isEdit)
  const [sortTouched, setSortTouched] = useState(isEdit)
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof CategoryInput>(key: K, value: CategoryInput[K]) => setForm((f) => ({ ...f, [key]: value }))

  // Auto-slug from the English name until the slug is edited manually
  useEffect(() => {
    if (!slugTouched) setForm((f) => ({ ...f, slug: slugify(f.name.en) }))
  }, [form.name.en, slugTouched])

  const hasChildren = isEdit && categories.some((c) => c.parentId === initial!.id)
  const parentOptions = useMemo(
    () => [{ value: '', label: t('catalog.categoryForm.parentNone') }, ...categories.filter((c) => c.parentId === null && c.id !== initial?.id).sort((a, b) => a.sortOrder - b.sortOrder).map((c) => ({ value: c.id, label: l(c.name) }))],
    [categories, initial, l, t],
  )
  const parent = categories.find((c) => c.id === form.parentId)
  const productCount = initial ? (categories.find((c) => c.id === initial.id)?.productCount ?? 0) : 0

  const validate = (): Errors => {
    const e: Errors = {}
    const req = t('common.fieldRequired')
    if (!form.name.en.trim()) e.nameEn = req
    if (!form.name.ar.trim()) e.nameAr = req
    if (!form.slug.trim()) e.slug = req
    else if (!SLUG_RE.test(form.slug)) e.slug = t('catalog.categoryForm.slugInvalid')
    else if (categories.some((c) => c.slug === form.slug && c.id !== initial?.id)) e.slug = t('catalog.categoryForm.slugTaken')
    if (form.image && !isValidUrl(form.image)) e.image = t('catalog.categoryForm.imageInvalid')
    if (form.seoTitle.length > 60) e.seoTitle = t('catalog.categoryForm.seoTooLong', { max: 60 })
    if (form.seoDescription.length > 160) e.seoDescription = t('catalog.categoryForm.seoTooLong', { max: 160 })
    if (!Number.isFinite(form.sortOrder) || form.sortOrder < 0) e.sortOrder = t('common.mustBePositive')
    return e
  }

  const submit = async (ev: FormEvent) => {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) {
      toast.error(t('catalog.categoryForm.fixErrors'))
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      return
    }
    setSaving(true)
    const payload: CategoryInput = { ...form, name: { en: form.name.en.trim(), ar: form.name.ar.trim() }, slug: form.slug.trim() }
    try {
      if (isEdit) {
        await updateCategory(initial!.id, payload)
        toast.success(t('catalog.categoryForm.updated', { name: l(payload.name) }))
      } else {
        await createCategory(payload)
        toast.success(t('catalog.categoryForm.created', { name: l(payload.name) }))
      }
      navigate('/categories')
    } catch {
      toast.error(t('common.errorDesc'))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <FormSection title={t('catalog.categoryForm.sectionBasics')} description={t('catalog.categoryForm.sectionBasicsDesc')}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label={t('catalog.categoryForm.nameEn')} required value={form.name.en} onChange={(e) => set('name', { ...form.name, en: e.target.value })} error={errors.nameEn} dir="ltr" placeholder="e.g. Skin Care" />
              <Input label={t('catalog.categoryForm.nameAr')} required value={form.name.ar} onChange={(e) => set('name', { ...form.name, ar: e.target.value })} error={errors.nameAr} dir="rtl" placeholder="مثال: العناية بالبشرة" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label={t('catalog.categoryForm.slug')}
                required
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  set('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))
                }}
                error={errors.slug}
                hint={t('catalog.categoryForm.slugHint', { slug: form.slug || '…' })}
                dir="ltr"
              />
              <Select
                label={t('catalog.categoryForm.parent')}
                value={form.parentId ?? ''}
                options={parentOptions}
                disabled={hasChildren}
                hint={hasChildren ? t('catalog.categoryForm.parentLocked') : t('catalog.categoryForm.parentHint')}
                onChange={(e) => {
                  const p = e.target.value || null
                  setForm((f) => ({ ...f, parentId: p, sortOrder: sortTouched ? f.sortOrder : siblingsCount(p) + 1 }))
                }}
              />
            </div>
          </FormSection>

          <FormSection title={t('catalog.categoryForm.sectionContent')} description={t('catalog.categoryForm.sectionContentDesc')}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Textarea label={t('catalog.categoryForm.descEn')} value={form.description.en} onChange={(e) => set('description', { ...form.description, en: e.target.value })} dir="ltr" rows={4} />
              <Textarea label={t('catalog.categoryForm.descAr')} value={form.description.ar} onChange={(e) => set('description', { ...form.description, ar: e.target.value })} dir="rtl" rows={4} />
            </div>
          </FormSection>

          <FormSection title={t('catalog.categoryForm.sectionImage')} description={t('catalog.categoryForm.sectionImageDesc')}>
            <ImageUrlField
              label={t('catalog.categoryForm.image')}
              value={form.image}
              onChange={(v) => set('image', v)}
              error={errors.image}
              hint={t('catalog.categoryForm.imageHint')}
              samples={SAMPLES}
              samplesLabel={t('catalog.categoryForm.samples')}
              sampleAria={t('catalog.categoryForm.useSample')}
              previewClass="aspect-[3/4]"
            />
          </FormSection>

          <FormSection title={t('catalog.categoryForm.sectionSeo')} description={t('catalog.categoryForm.sectionSeoDesc')}>
            <Input label={t('catalog.categoryForm.seoTitle')} value={form.seoTitle} onChange={(e) => set('seoTitle', e.target.value)} error={errors.seoTitle} aside={<CharCount value={form.seoTitle} max={60} />} placeholder={`${form.name.en || 'Skin Care'} — Original Beauty | LOOKS`} />
            <Textarea label={t('catalog.categoryForm.seoDescription')} value={form.seoDescription} onChange={(e) => set('seoDescription', e.target.value)} error={errors.seoDescription} aside={<CharCount value={form.seoDescription} max={160} />} rows={3} />
            <div className="rounded-md border border-line-soft bg-mist/60 p-4" dir="ltr">
              <p className="mb-1 text-[11px] font-semibold tracking-wide text-subtle uppercase">{t('catalog.categoryForm.seoPreview')}</p>
              <p className="truncate text-xs text-success">looks.sa › category › {form.slug || '…'}</p>
              <p className="truncate text-[15px] text-info">{form.seoTitle || `${form.name.en || 'Category'} | LOOKS`}</p>
              <p className="line-clamp-2 text-[13px] text-muted">{form.seoDescription || form.description.en || '—'}</p>
            </div>
          </FormSection>
        </div>

        <div className="min-w-0 space-y-6">
          <FormSection title={t('catalog.categoryForm.sectionSettings')}>
            <Switch checked={form.status === 'active'} onChange={(v) => set('status', v ? 'active' : 'inactive')} label={t('catalog.categoryForm.status')} description={t('catalog.categoryForm.statusDesc')} />
            <Input
              label={t('catalog.categoryForm.sortOrder')}
              type="number"
              min={0}
              value={Number.isFinite(form.sortOrder) ? form.sortOrder : ''}
              onChange={(e) => {
                setSortTouched(true)
                set('sortOrder', e.target.value === '' ? NaN : Number(e.target.value))
              }}
              error={errors.sortOrder}
              hint={t('catalog.categoryForm.sortHint')}
              dir="ltr"
            />
          </FormSection>
          <div className="lg:sticky lg:top-20">
            <CategoryPreview name={form.name} image={form.image} productCount={productCount} parentName={parent ? l(parent.name) : undefined} active={form.status === 'active'} />
          </div>
        </div>
      </div>

      <StickyActionBar>
        <Button variant="outline" onClick={() => navigate('/categories')} disabled={saving}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" loading={saving}>
          {saving ? t('common.saving') : isEdit ? t('catalog.categoryForm.save') : t('catalog.categoryForm.create')}
        </Button>
      </StickyActionBar>
    </form>
  )
}
