import { Link } from 'react-router-dom'
import { MessageCircle, ShieldCheck } from 'lucide-react'
import { Breadcrumbs, SmartImage } from '@/components/common'
import { useT } from '@/i18n'
import type { Category, LocalizedText } from '@/types'
import { cn, whatsappLink } from '@/utils'

interface CategoryHeaderProps {
  category: Category
  sub?: Category['subcategories'][number]
  productCount?: number
  countLabel: (n: number) => string
}

/** Editorial split header: copy on the inline-start, image on the inline-end */
export function CategoryHeader({ category, sub, productCount, countLabel }: CategoryHeaderProps) {
  const { t, l } = useT()
  const name = l(sub?.name ?? category.name)
  const image = sub?.image ?? category.image
  const crumbs = sub ? [{ label: l(category.name), to: `/category/${category.slug}` }, { label: name }] : [{ label: name }]

  return (
    <header className="bg-blush/40">
      <div className="container-x grid grid-cols-1 items-stretch gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
        <div className="flex flex-col justify-center py-8 sm:py-12 lg:py-16 lg:pe-14">
          <Breadcrumbs items={crumbs} />
          <p className="eyebrow mt-8">{sub ? l(category.name) : t('catalog.category.eyebrow')}</p>
          <h1 className="heading-page mt-3 text-balance">{name}</h1>
          <p className="body-lg mt-4 max-w-xl">{l(category.description)}</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-muted">
            {productCount !== undefined && <span className="font-medium text-ink">{countLabel(productCount)}</span>}
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-success" aria-hidden />
              {t('common.originalAuthorized')}
            </span>
          </div>
        </div>
        <div className="relative -mx-4 sm:-mx-6 lg:mx-0">
          <SmartImage
            src={image}
            alt={name}
            width={1100}
            height={800}
            priority
            wrapperClassName="h-48 sm:h-64 lg:absolute lg:inset-0 lg:h-full"
            className="animate-fade-in"
          />
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/15 to-transparent" aria-hidden />
        </div>
      </div>
    </header>
  )
}

interface ChipItem {
  slug: string
  name: LocalizedText
  image?: string
}

/** Scrollable chip row of subcategories (top category) or siblings (subcategory) */
export function SubcategoryChips({ category, activeSlug, counts }: { category: Category; activeSlug?: string; counts?: Record<string, number> }) {
  const { t, l } = useT()
  const items: (ChipItem & { all?: boolean })[] = [
    { slug: category.slug, name: { en: t('catalog.category.all', { name: category.name.en }), ar: t('catalog.category.all', { name: category.name.ar }) }, all: true },
    ...category.subcategories,
  ]
  return (
    <nav aria-label={t('catalog.category.browse')} className="container-x pt-8">
      <ul className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:px-0">
        {items.map((s) => {
          const active = s.all ? !activeSlug || activeSlug === category.slug : activeSlug === s.slug
          const count = counts?.[s.slug]
          return (
            <li key={s.slug} className="shrink-0">
              <Link
                to={`/category/${s.slug}`}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group flex h-11 items-center gap-2.5 rounded-full border ps-1.5 pe-4 text-[13px] font-medium transition-colors duration-200',
                  s.all && 'ps-4',
                  active ? 'border-ink bg-ink text-ivory' : 'border-line bg-white/70 text-ink hover:border-ink/60',
                )}
              >
                {s.image && <SmartImage src={s.image} alt="" width={80} height={80} wrapperClassName="size-8 shrink-0 rounded-full" />}
                <span className="whitespace-nowrap">{l(s.name)}</span>
                {count !== undefined && <span className={cn('text-[11px] tabular-nums', active ? 'text-ivory/60' : 'text-muted')}>{count}</span>}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/** Salon-supplies callout pointing professionals to WhatsApp */
export function ProCallout() {
  const { t } = useT()
  return (
    <aside className="container-x pt-8">
      <div className="flex flex-col gap-5 rounded-xs bg-ink px-6 py-6 text-ivory sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="max-w-2xl">
          <p className="eyebrow text-champagne">{t('catalog.category.proEyebrow')}</p>
          <h2 className="mt-2 font-serif text-2xl font-medium tracking-[-0.02em]">{t('catalog.category.proTitle')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-ivory/70">{t('catalog.category.proDesc')}</p>
        </div>
        <a
          href={whatsappLink(t('catalog.category.proMessage'))}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#25d366] px-6 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <MessageCircle className="size-4" fill="currentColor" strokeWidth={1.2} aria-hidden />
          {t('catalog.category.proCta')}
        </a>
      </div>
    </aside>
  )
}
