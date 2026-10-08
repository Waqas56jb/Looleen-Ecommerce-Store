import type { ReactNode } from 'react'
import { BadgeCheck, RotateCcw, Truck } from 'lucide-react'
import { AccordionItem, Tabs } from '@/components/common'
import { STORE_CONFIG } from '@/config/store'
import { CONCERN_LABELS, HAIR_TYPE_LABELS, SKIN_TYPE_LABELS } from '@/data/categories'
import { useT } from '@/i18n'
import type { LocalizedText, Product } from '@/types'
import { formatPrice } from '@/utils'

function ChipGroup({ label, items }: { label: string; items: LocalizedText[] }) {
  const { l } = useT()
  if (!items.length) return null
  return (
    <div>
      <p className="mb-2.5 text-[11px] font-semibold tracking-[0.18em] text-ink uppercase">{label}</p>
      <ul className="flex flex-wrap gap-2">
        {items.map((it) => (
          <li key={it.en} className="rounded-full border border-line bg-white px-3.5 py-1.5 text-xs text-ink">
            {l(it)}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Prose({ children }: { children: ReactNode }) {
  return <div className="max-w-3xl text-[15px] leading-[1.8] text-muted">{children}</div>
}

/** Description / Ingredients / How to use / Delivery & returns */
export function ProductTabs({ product }: { product: Product }) {
  const { t, l, lang } = useT()
  const { standard, express } = STORE_CONFIG.shipping

  const description = (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14">
      <Prose>
        {l(product.description)
          .split(/\n+/)
          .map((p, i) => (
            <p key={i} className={i > 0 ? 'mt-4' : undefined}>
              {p}
            </p>
          ))}
      </Prose>
      {(product.concerns.length > 0 || product.skinTypes.length > 0 || product.hairTypes.length > 0) && (
        <div className="flex flex-col gap-6 lg:border-s lg:border-line lg:ps-10">
          <ChipGroup label={t('product.tabs.concerns')} items={product.concerns.map((c) => CONCERN_LABELS[c]).filter(Boolean)} />
          <ChipGroup label={t('product.tabs.skinTypes')} items={product.skinTypes.map((s) => SKIN_TYPE_LABELS[s]).filter(Boolean)} />
          <ChipGroup label={t('product.tabs.hairTypes')} items={product.hairTypes.map((h) => HAIR_TYPE_LABELS[h]).filter(Boolean)} />
        </div>
      )}
    </div>
  )

  const ingredients = (
    <Prose>
      {product.ingredients ? (
        <p dir="ltr" className="text-start text-sm leading-[1.9] text-ink/80">
          {product.ingredients}
        </p>
      ) : (
        <p>{t('product.tabs.noIngredients')}</p>
      )}
      <p className="mt-5 text-xs text-muted">{t('product.tabs.ingredientsNote')}</p>
    </Prose>
  )

  const howToUse = (
    <Prose>
      <p>{l(product.howToUse)}</p>
    </Prose>
  )

  const policy = [
    {
      icon: Truck,
      title: t('product.tabs.shippingTitle'),
      body: t('product.tabs.shippingBody', {
        standardDays: standard.days,
        standard: formatPrice(standard.price, lang),
        threshold: formatPrice(STORE_CONFIG.freeShippingThreshold, lang),
        expressDays: express.days,
        express: formatPrice(express.price, lang),
      }),
    },
    { icon: RotateCcw, title: t('product.tabs.returnsTitle'), body: t('product.tabs.returnsBody') },
    { icon: BadgeCheck, title: t('product.tabs.authenticTitle'), body: t('product.tabs.authenticBody') },
  ]
  const delivery = (
    <ul className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-10">
      {policy.map(({ icon: Icon, title, body }) => (
        <li key={title}>
          <Icon className="size-5 text-rose" strokeWidth={1.6} aria-hidden />
          <p className="mt-3 text-sm font-semibold text-ink">{title}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
        </li>
      ))}
    </ul>
  )

  const items = [
    { id: 'description', label: t('product.tabs.description'), content: description },
    { id: 'ingredients', label: t('product.tabs.ingredients'), content: ingredients },
    { id: 'how-to-use', label: t('product.tabs.howToUse'), content: howToUse },
    { id: 'delivery', label: t('product.tabs.deliveryReturns'), content: delivery },
  ]

  return (
    <>
      <Tabs tabs={items} className="hidden md:block" />
      <div className="border-t border-line md:hidden">
        {items.map((it, i) => (
          <AccordionItem key={it.id} title={it.label} defaultOpen={i === 0}>
            {it.content}
          </AccordionItem>
        ))}
      </div>
    </>
  )
}
