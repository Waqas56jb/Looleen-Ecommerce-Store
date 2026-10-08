import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useBlocker, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AlertCircle, BadgeCheck, CircleDot } from 'lucide-react'
import { Badge, Button, ConfirmDialog, FormSection, ImageUploaderMock, Input, RadioGroup, RiyalSign, Select, Switch, Textarea } from '@/components/ui'
import { useAsync } from '@/hooks'
import { useT } from '@/i18n'
import { getAllBrands, getCategories } from '@/services/catalogService'
import { createProduct, updateProduct } from '@/services/productService'
import type { AdminProduct, ProductFlags, ProductStatus } from '@/types'
import { cn, slugify } from '@/utils'
import { emptyFormState, fid, formStateFromProduct, toProductInput, validateProduct, type ProductFormState } from './formState'
import { discountPercent, marginPercent } from './productUtils'
import { KeywordsInput, SearchPreview } from './SeoFields'
import { VariantsEditor } from './VariantsEditor'

const SECTIONS = ['basic', 'pricing', 'inventory', 'media', 'variants', 'description', 'ingredients', 'seo', 'badges', 'shipping', 'visibility'] as const
type SectionId = (typeof SECTIONS)[number]

/** Which section each field lives in (for the nav error dots) */
const FIELD_SECTION: Record<string, SectionId> = {
  name: 'basic', slug: 'basic', brandId: 'basic', categoryId: 'basic', subcategoryId: 'basic', sku: 'basic',
  price: 'pricing', compareAtPrice: 'pricing', costPrice: 'pricing',
  stock: 'inventory', lowStockThreshold: 'inventory',
  images: 'media', variants: 'variants', weightGrams: 'shipping',
}

const FLAG_KEYS: (keyof ProductFlags)[] = ['original', 'authorized', 'featured', 'bestSeller', 'trending', 'newArrival', 'sale', 'professional']

function Counter({ value, max }: { value: string; max: number }) {
  return <span className={cn('tabular-nums', value.length > max && 'font-medium text-error')}>{value.length}/{max}</span>
}

interface Props {
  product?: AdminProduct
  /** Prefilled values for a new product (e.g. brand from /products/new?brand=) */
  defaults?: Partial<ProductFormState>
}

export function ProductForm({ product, defaults }: Props) {
  const { t, lang } = useT()
  const navigate = useNavigate()
  const isEdit = !!product
  const initial = useMemo(() => (product ? formStateFromProduct(product) : { ...emptyFormState(), ...defaults }), [product, defaults])
  const [s, setS] = useState<ProductFormState>(initial)
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial))
  const [slugTouched, setSlugTouched] = useState(isEdit)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<null | 'draft' | 'publish'>(null)
  const [active, setActive] = useState<SectionId>('basic')
  const skipBlock = useRef(false)

  const brands = useAsync(() => getAllBrands(), [])
  const cats = useAsync(() => getCategories(), [])
  const topCats = useMemo(() => (cats.data ?? []).filter((c) => !c.parentId).sort((a, b) => a.sortOrder - b.sortOrder), [cats.data])
  const subCats = useMemo(() => (cats.data ?? []).filter((c) => c.parentId && c.parentId === s.categoryId).sort((a, b) => a.sortOrder - b.sortOrder), [cats.data, s.categoryId])
  const brand = brands.data?.find((b) => b.id === s.brandId)

  const dirty = JSON.stringify(s) !== baseline
  const set = <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => {
    setS((prev) => ({ ...prev, [key]: value }))
    if (errors[key as string]) setErrors(({ [key as string]: _drop, ...rest }) => rest)
  }

  /* ---------- unsaved-changes protection ---------- */
  useEffect(() => {
    if (!dirty) return
    const on = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', on)
    return () => window.removeEventListener('beforeunload', on)
  }, [dirty])
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && !skipBlock.current && currentLocation.pathname !== nextLocation.pathname)
  const proceeding = useRef(false)

  /* ---------- section nav highlight ---------- */
  useEffect(() => {
    const els = SECTIONS.map((id) => document.getElementById(`section-${id}`)).filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (vis) setActive(vis.target.id.replace('section-', '') as SectionId)
      },
      { rootMargin: '-80px 0px -60% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  /* ---------- derived ---------- */
  const priceN = Number(s.price) || 0
  const compareN = Number(s.compareAtPrice) || 0
  const costN = Number(s.costPrice) || 0
  const discount = discountPercent(priceN, compareN)
  const margin = s.costPrice.trim() ? marginPercent(priceN, costN) : null
  const err = (key: string) => (errors[key] ? t(errors[key]) : undefined)
  const sectionHasError = (id: SectionId) => Object.keys(errors).some((k) => FIELD_SECTION[k] === id)

  const onName = (name: string) => {
    setS((prev) => ({ ...prev, name, slug: slugTouched ? prev.slug : slugify(name) }))
    setErrors(({ name: _n, slug: _s, ...rest }) => rest)
  }

  /* ---------- submit ---------- */
  const submit = async (mode: 'draft' | 'publish') => {
    const status: ProductStatus = mode === 'draft' ? 'draft' : s.status
    const found = validateProduct(s, status, product?.id)
    setErrors(found)
    const keys = Object.keys(found)
    if (keys.length) {
      toast.error(t('products.form.errors.fixErrors', { count: keys.length }))
      const el = document.getElementById(fid(keys[0])) ?? document.getElementById(`section-${FIELD_SECTION[keys[0]]}`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) setTimeout(() => el.focus({ preventScroll: true }), 350)
      return
    }
    setSaving(mode)
    try {
      const input = toProductInput(s, status)
      if (isEdit) {
        const { reserved: _r, ...patch } = input
        await updateProduct(product.id, patch)
        toast.success(t('products.toast.updated', { name: input.name }))
        setBaseline(JSON.stringify({ ...s, status }))
        setS((prev) => ({ ...prev, status }))
        skipBlock.current = true
        navigate(`/products/${product.id}`)
      } else {
        const created = await createProduct(input)
        toast.success(t(status === 'draft' ? 'products.toast.createdDraft' : 'products.toast.created', { name: created.name }))
        skipBlock.current = true
        navigate(`/products/${created.id}`)
      }
    } catch {
      toast.error(t('products.toast.failed'))
    } finally {
      setSaving(null)
    }
  }

  const cancel = () => navigate(isEdit ? `/products/${product.id}` : '/products')

  const section = (id: SectionId, children: ReactNode, actions?: ReactNode) => (
    <FormSection id={`section-${id}`} title={t(`products.form.sections.${id}`)} description={t(`products.form.sections.${id}Desc`)} actions={actions}>
      {children}
    </FormSection>
  )

  const money = (key: 'price' | 'compareAtPrice' | 'costPrice', label: string, hint?: string, required?: boolean) => (
    <Input
      id={fid(key)}
      label={label}
      required={required}
      hint={hint}
      error={err(key)}
      type="number"
      min={0}
      step="0.01"
      inputMode="decimal"
      dir="ltr"
      placeholder="0.00"
      leading={<RiyalSign />}
      value={s[key]}
      onChange={(e) => set(key, e.target.value)}
    />
  )

  const primaryLabel = s.status === 'active' ? t('products.form.publish') : isEdit ? t('common.saveChanges') : t('common.save')

  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)]">
        {/* Section nav (desktop) */}
        <nav aria-label={t('products.form.sectionNav')} className="hidden lg:block">
          <div className="sticky top-24 space-y-0.5">
            <p className="eyebrow mb-2 px-3">{t('products.form.sectionNav')}</p>
            {SECTIONS.map((id) => (
              <a
                key={id}
                href={`#section-${id}`}
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  setActive(id)
                }}
                aria-current={active === id ? 'true' : undefined}
                className={cn(
                  'flex items-center justify-between gap-2 rounded-md border-s-2 px-3 py-1.5 text-[13px] transition-colors',
                  active === id ? 'border-rose bg-surface font-medium text-ink shadow-card' : 'border-transparent text-muted hover:text-ink',
                )}
              >
                {t(`products.form.sections.${id}`)}
                {sectionHasError(id) && <AlertCircle className="size-3.5 text-error" aria-label={t('common.required')} />}
              </a>
            ))}
          </div>
        </nav>

        <form
          className="min-w-0 space-y-6"
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            submit('publish')
          }}
        >
          {section(
            'basic',
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input id={fid('name')} label={t('products.form.name')} required value={s.name} onChange={(e) => onName(e.target.value)} error={err('name')} placeholder={t('products.form.namePlaceholder')} dir="ltr" />
                <Input id={fid('nameAr')} label={t('products.form.nameAr')} value={s.nameAr} onChange={(e) => set('nameAr', e.target.value)} placeholder={t('products.form.nameArPlaceholder')} dir="rtl" lang="ar" />
              </div>
              <Input
                id={fid('slug')}
                label={t('products.form.slug')}
                required
                value={s.slug}
                dir="ltr"
                leading={<span className="text-xs">/product/</span>}
                className="ps-[4.75rem]"
                onChange={(e) => {
                  setSlugTouched(true)
                  set('slug', slugify(e.target.value) || e.target.value.toLowerCase())
                }}
                error={err('slug')}
                hint={t('products.form.slugHint')}
              />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Select
                  id={fid('brandId')}
                  label={t('products.form.brand')}
                  required
                  value={s.brandId}
                  onChange={(e) => set('brandId', e.target.value)}
                  options={(brands.data ?? []).map((b) => ({ value: b.id, label: b.authorized ? `${b.name}  ✓` : b.name }))}
                  placeholder={t('products.form.selectBrand')}
                  error={err('brandId')}
                  hint={
                    brand ? (
                      brand.authorized ? (
                        <span className="inline-flex items-center gap-1 text-success">
                          <BadgeCheck className="size-3.5" /> {t('products.form.authorizedHint')}
                        </span>
                      ) : (
                        t('products.form.notAuthorizedHint')
                      )
                    ) : undefined
                  }
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Select
                    id={fid('categoryId')}
                    label={t('products.form.category')}
                    required
                    value={s.categoryId}
                    onChange={(e) => {
                      const v = e.target.value
                      setS((prev) => ({ ...prev, categoryId: v, subcategoryId: '' }))
                      setErrors(({ categoryId: _c, ...rest }) => rest)
                    }}
                    options={topCats.map((c) => ({ value: c.id, label: c.name[lang] || c.name.en }))}
                    placeholder={t('products.form.selectCategory')}
                    error={err('categoryId')}
                  />
                  <Select
                    id={fid('subcategoryId')}
                    label={t('products.form.subcategory')}
                    required
                    disabled={!s.categoryId}
                    value={s.subcategoryId}
                    onChange={(e) => set('subcategoryId', e.target.value)}
                    options={subCats.map((c) => ({ value: c.id, label: c.name[lang] || c.name.en }))}
                    placeholder={s.categoryId ? t('products.form.selectSubcategory') : t('products.form.selectCategoryFirst')}
                    error={err('subcategoryId')}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input id={fid('sku')} label={t('products.form.sku')} required value={s.sku} dir="ltr" className="font-mono" onChange={(e) => set('sku', e.target.value.toUpperCase())} error={err('sku')} hint={t('products.form.skuHint')} />
                <Input id={fid('barcode')} label={t('products.form.barcode')} value={s.barcode} dir="ltr" inputMode="numeric" className="font-mono" onChange={(e) => set('barcode', e.target.value)} placeholder="6281000000000" />
              </div>
            </>,
          )}

          {section(
            'pricing',
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {money('price', t('products.form.price'), undefined, true)}
                {money('compareAtPrice', t('products.form.compareAt'), t('products.form.compareAtHint'))}
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {money('costPrice', t('products.form.cost'), t('products.form.costHint'))}
                <div className="flex flex-wrap items-start gap-2 md:pt-7">
                  <Badge tone={discount > 0 ? 'rose' : 'neutral'} className="h-7">
                    {t('products.form.discount')}: {discount > 0 ? `−${discount}%` : t('products.form.noDiscount')}
                  </Badge>
                  <Badge tone={margin === null ? 'neutral' : margin < 20 ? 'warning' : 'success'} className="h-7">
                    {t('products.form.margin')}: <span dir="ltr">{margin === null ? '—' : `${margin}%`}</span>
                  </Badge>
                  {margin !== null && (
                    <Badge tone="neutral" className="h-7 gap-1">
                      {t('products.form.profit')}:{' '}
                      <span dir="ltr" className="inline-flex items-center gap-0.5 tabular-nums">
                        <RiyalSign /> {(priceN - costN).toFixed(2)}
                      </span>
                    </Badge>
                  )}
                </div>
              </div>
            </>,
          )}

          {section(
            'inventory',
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Input id={fid('stock')} label={t('products.form.stock')} required type="number" min={0} dir="ltr" value={s.stock} onChange={(e) => set('stock', e.target.value)} error={err('stock')} hint={isEdit ? t('products.form.stockAdjustHint') : undefined} />
                <Input id={fid('lowStockThreshold')} label={t('products.form.threshold')} type="number" min={0} dir="ltr" value={s.lowStockThreshold} onChange={(e) => set('lowStockThreshold', e.target.value)} error={err('lowStockThreshold')} hint={t('products.form.thresholdHint')} />
                {isEdit && <Input id={fid('reserved')} label={t('products.form.reserved')} value={String(s.reserved)} readOnly disabled dir="ltr" hint={t('products.form.reservedHint')} />}
              </div>
              {isEdit && (
                <p className="text-xs text-muted">
                  {t('products.form.available')}: <span className="font-medium text-ink tabular-nums">{Math.max(0, (Number(s.stock) || 0) - s.reserved)}</span>
                </p>
              )}
            </>,
          )}

          {section(
            'media',
            <div id={fid('images')} tabIndex={-1} className="outline-none">
              <ImageUploaderMock value={s.images} onChange={(v) => set('images', v)} />
              {err('images') && (
                <p role="alert" className="mt-2 text-xs text-error">
                  {err('images')}
                </p>
              )}
            </div>,
          )}

          {section(
            'variants',
            <VariantsEditor
              kind={s.variantKind}
              onKindChange={(k) => setS((prev) => ({ ...prev, variantKind: k, variants: prev.variants.map((v) => ({ ...v, kind: k, hex: k === 'shade' ? (v.hex ?? '#D9B8BE') : undefined })) }))}
              variants={s.variants}
              onChange={(v) => set('variants', v)}
              baseSku={s.sku}
              basePrice={priceN}
              error={err('variants')}
            />,
          )}

          {section(
            'description',
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Textarea rows={3} label={t('products.form.shortDescEn')} dir="ltr" value={s.shortDescription.en} maxLength={300} aside={<Counter value={s.shortDescription.en} max={300} />} onChange={(e) => set('shortDescription', { ...s.shortDescription, en: e.target.value })} />
                <Textarea rows={3} label={t('products.form.shortDescAr')} dir="rtl" lang="ar" value={s.shortDescription.ar} maxLength={300} aside={<Counter value={s.shortDescription.ar} max={300} />} onChange={(e) => set('shortDescription', { ...s.shortDescription, ar: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Textarea rows={7} label={t('products.form.descEn')} dir="ltr" value={s.description.en} maxLength={4000} aside={<Counter value={s.description.en} max={4000} />} onChange={(e) => set('description', { ...s.description, en: e.target.value })} />
                <Textarea rows={7} label={t('products.form.descAr')} dir="rtl" lang="ar" value={s.description.ar} maxLength={4000} aside={<Counter value={s.description.ar} max={4000} />} onChange={(e) => set('description', { ...s.description, ar: e.target.value })} />
              </div>
            </>,
          )}

          {section(
            'ingredients',
            <>
              <Textarea rows={4} label={t('products.form.ingredients')} dir="ltr" value={s.ingredients} hint={t('products.form.ingredientsHint')} placeholder="Aqua, Glycerin, Niacinamide, Sodium Hyaluronate…" onChange={(e) => set('ingredients', e.target.value)} />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Textarea rows={4} label={t('products.form.howToUseEn')} dir="ltr" value={s.howToUse.en} aside={<Counter value={s.howToUse.en} max={1000} />} maxLength={1000} onChange={(e) => set('howToUse', { ...s.howToUse, en: e.target.value })} />
                <Textarea rows={4} label={t('products.form.howToUseAr')} dir="rtl" lang="ar" value={s.howToUse.ar} aside={<Counter value={s.howToUse.ar} max={1000} />} maxLength={1000} onChange={(e) => set('howToUse', { ...s.howToUse, ar: e.target.value })} />
              </div>
            </>,
          )}

          {section(
            'seo',
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="space-y-4">
                <Input id={fid('seoTitle')} label={t('products.form.seoTitle')} value={s.seo.title} placeholder={s.name} aside={<Counter value={s.seo.title} max={60} />} onChange={(e) => set('seo', { ...s.seo, title: e.target.value })} />
                <Textarea rows={3} label={t('products.form.metaDescription')} value={s.seo.description} placeholder={s.shortDescription.en} aside={<Counter value={s.seo.description} max={160} />} onChange={(e) => set('seo', { ...s.seo, description: e.target.value })} />
                <Input
                  label={t('products.form.slug')}
                  value={s.slug}
                  dir="ltr"
                  leading={<span className="text-xs">/product/</span>}
                  className="ps-[4.75rem]"
                  onChange={(e) => {
                    setSlugTouched(true)
                    set('slug', slugify(e.target.value) || e.target.value.toLowerCase())
                  }}
                />
                <KeywordsInput id={fid('keywords')} label={t('products.form.keywords')} hint={t('products.form.keywordsHint')} placeholder={t('products.form.keywordsPlaceholder')} value={s.seo.keywords} onChange={(k) => set('seo', { ...s.seo, keywords: k })} />
              </div>
              <SearchPreview title={s.seo.title || s.name} description={s.seo.description || s.shortDescription.en} slug={s.slug} />
            </div>,
          )}

          {section(
            'badges',
            <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
              {FLAG_KEYS.map((k) => (
                <div key={k} className="border-b border-line-soft py-3 last:border-0 sm:[&:nth-last-child(2)]:border-0">
                  <Switch checked={s.flags[k]} onChange={(v) => set('flags', { ...s.flags, [k]: v })} label={t(`products.form.flags.${k}`)} description={t(`products.form.flags.${k}Desc`)} />
                </div>
              ))}
            </div>,
          )}

          {section(
            'shipping',
            <>
              <div className="max-w-xs">
                <Input id={fid('weightGrams')} label={t('products.form.weight')} type="number" min={0} dir="ltr" value={s.weightGrams} placeholder="250" trailing={<span className="text-xs">{t('products.form.weightUnit')}</span>} onChange={(e) => set('weightGrams', e.target.value)} error={err('weightGrams')} hint={t('products.form.weightHint')} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-md border border-line p-3">
                  <Switch checked={s.coldChain} onChange={(v) => set('coldChain', v)} label={t('products.form.coldChain')} description={t('products.form.coldChainDesc')} />
                </div>
                <div className="rounded-md border border-line p-3">
                  <Switch checked={s.fragile} onChange={(v) => set('fragile', v)} label={t('products.form.fragile')} description={t('products.form.fragileDesc')} />
                </div>
              </div>
            </>,
          )}

          {section(
            'visibility',
            <div className="[&_fieldset>div]:grid [&_fieldset>div]:grid-cols-1 [&_fieldset>div]:sm:grid-cols-3">
              <RadioGroup
                name="product-status"
                variant="card"
                value={s.status}
                onChange={(v) => set('status', v)}
                options={(['active', 'draft', 'archived'] as const).map((v) => ({ value: v, label: t(`products.form.status.${v}`), description: t(`products.form.status.${v}Desc`) }))}
              />
            </div>,
          )}

          {/* Sticky action bar */}
          <div className="sticky bottom-0 z-30 -mx-4 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:mx-0 lg:rounded-lg lg:border lg:shadow-pop">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className={cn('inline-flex items-center gap-1.5 text-xs', dirty ? 'text-warning' : 'text-muted')}>
                <CircleDot className="size-3.5" aria-hidden />
                {dirty ? t('products.form.unsaved') : t('products.form.allSaved')}
              </p>
              <div className="flex flex-1 flex-wrap justify-end gap-2 sm:flex-none">
                <Button variant="ghost" onClick={cancel} disabled={!!saving}>
                  {t('products.form.cancel')}
                </Button>
                <Button variant="outline" onClick={() => submit('draft')} loading={saving === 'draft'} disabled={!!saving}>
                  {t('products.form.saveDraft')}
                </Button>
                <Button type="submit" loading={saving === 'publish'} disabled={!!saving}>
                  {primaryLabel}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        onClose={() => {
          if (!proceeding.current && blocker.state === 'blocked') blocker.reset()
          proceeding.current = false
        }}
        onConfirm={() => {
          proceeding.current = true
          if (blocker.state === 'blocked') blocker.proceed()
        }}
        title={t('products.confirm.discardTitle')}
        description={t('products.confirm.discardDesc')}
        confirmLabel={t('products.confirm.discard')}
        cancelLabel={t('products.confirm.keepEditing')}
      />
    </>
  )
}
