import type { ReactNode } from 'react'
import { Breadcrumbs, SmartImage } from '@/components/common'
import { categories } from '@/data/categories'
import { useT } from '@/i18n'
import { cn } from '@/utils'

/* ---------------- Editorial page hero (offers / best sellers / new arrivals) ---------------- */

interface ListingHeroProps {
  image: string
  eyebrow: string
  title: string
  description: string
  crumb: string
  children?: ReactNode
}

export function ListingHero({ image, eyebrow, title, description, crumb, children }: ListingHeroProps) {
  return (
    <section className="relative isolate overflow-hidden bg-ink text-ivory">
      <SmartImage src={image} alt="" width={1920} height={760} priority wrapperClassName="absolute! inset-0 -z-10 bg-ink" />
      <span className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/85 via-ink/45 to-ink/20 lg:bg-gradient-to-r lg:from-ink/80 lg:via-ink/40 lg:to-ink/5 lg:rtl:bg-gradient-to-l" aria-hidden />
      <div className="container-x flex min-h-[420px] flex-col justify-end pt-8 pb-12 sm:min-h-[460px] sm:pb-16 lg:min-h-[520px] lg:pb-20">
        <Breadcrumbs items={[{ label: crumb }]} className="mb-auto [&_li]:text-ivory/65 [&_a:hover]:text-ivory [&_.text-ink]:text-ivory" />
        <div className="mt-24 max-w-2xl animate-fade-up">
          <p className="eyebrow text-champagne">{eyebrow}</p>
          <h1 className="heading-page mt-4 text-balance text-white">{title}</h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-ivory/75 sm:text-lg">{description}</p>
          {children && <div className="mt-8">{children}</div>}
        </div>
      </div>
    </section>
  )
}

/* ---------------- Filter chips ---------------- */

export interface ChipOption<T extends string | number> {
  value: T
  label: string
}

export function ChipRow<T extends string | number>({ label, options, value, onChange, className }: { label: string; options: ChipOption<T>[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={cn('flex min-w-0 items-center gap-3', className)} role="group" aria-label={label}>
      <span className="hidden shrink-0 text-[11px] font-semibold tracking-[0.2em] text-muted uppercase sm:inline">{label}</span>
      <div className="no-scrollbar -mx-4 flex min-w-0 flex-1 gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:px-0">
        {options.map((o) => {
          const active = o.value === value
          return (
            <button
              key={String(o.value)}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(o.value)}
              className={cn(
                'h-10 shrink-0 rounded-full border px-4 text-[13px] font-medium whitespace-nowrap transition-colors duration-200',
                active ? 'border-ink bg-ink text-ivory' : 'border-line bg-white text-ink hover:border-ink/50',
              )}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Top-level category slugs usable as `?category=` filters */
export const CATEGORY_FILTERS = ['care', 'makeup', 'perfumes', 'beauty-devices', 'salon-supplies'] as const

export function useCategoryOptions(allLabel: string): ChipOption<string>[] {
  const { l } = useT()
  return [
    { value: '', label: allLabel },
    ...CATEGORY_FILTERS.map((slug) => ({ value: slug, label: l(categories.find((c) => c.slug === slug)?.name) || slug })),
  ]
}

export function isCategoryFilter(v: string | null): v is (typeof CATEGORY_FILTERS)[number] {
  return !!v && (CATEGORY_FILTERS as readonly string[]).includes(v)
}

/** Scrolls smoothly to an element (used after pagination) */
export function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY - 120
  window.scrollTo({ top, behavior: 'smooth' })
}
