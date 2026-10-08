import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, Eye, MessageSquare, Percent, ShoppingBag, ShoppingCart, TrendingUp } from 'lucide-react'
import { Badge, ButtonLink, Card, EmptyState, KeyValue, Money, ProgressBar, RatingStars, Skeleton, StatusBadge, Tabs, Thumb, Timeline, type Tone } from '@/components/ui'
import { useAsync } from '@/hooks'
import { useT } from '@/i18n'
import { getReviews } from '@/services/moderationService'
import type { ProductRow } from '@/services/productService'
import { getActivity } from '@/services/systemService'
import type { AdminCategory, LocalizedText, ProductFlags } from '@/types'
import { cn, formatCompact, formatDate, formatDateTime, formatNumber, timeAgo } from '@/utils'
import { discountPercent, marginPercent } from './productUtils'

const FLAG_TONES: Record<keyof ProductFlags, Tone> = {
  original: 'success',
  authorized: 'info',
  featured: 'champagne',
  bestSeller: 'rose',
  trending: 'rose',
  newArrival: 'dark',
  sale: 'error',
  professional: 'champagne',
}

export function FlagBadges({ flags }: { flags: ProductFlags }) {
  const { t } = useT()
  const on = (Object.keys(FLAG_TONES) as (keyof ProductFlags)[]).filter((k) => flags[k])
  if (!on.length) return <span className="text-[13px] text-subtle">{t('products.detail.noFlags')}</span>
  return (
    <div className="flex flex-wrap gap-1.5">
      {on.map((k) => (
        <Badge key={k} tone={FLAG_TONES[k]} icon={k === 'original' || k === 'authorized' ? <BadgeCheck /> : undefined}>
          {t(`products.form.flags.${k}`)}
        </Badge>
      ))}
    </div>
  )
}

/* ---------------- Analytics row ---------------- */

export function AnalyticsRow({ p }: { p: ProductRow }) {
  const { t } = useT()
  const conversion = p.views ? (p.unitsSold / p.views) * 100 : 0
  const items: { label: string; value: ReactNode; icon: ReactNode }[] = [
    { label: t('products.detail.unitsSold'), value: formatNumber(p.unitsSold), icon: <ShoppingBag /> },
    { label: t('products.detail.revenue'), value: <Money value={p.revenue} compact />, icon: <TrendingUp /> },
    { label: t('products.detail.views'), value: formatCompact(p.views), icon: <Eye /> },
    { label: t('products.detail.addToCarts'), value: formatCompact(p.addToCarts), icon: <ShoppingCart /> },
    { label: t('products.detail.conversion'), value: <span dir="ltr">{conversion.toFixed(1)}%</span>, icon: <Percent /> },
  ]
  return (
    <section aria-label={t('products.detail.analytics')} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((it, i) => (
        <div key={i} className={cn('card flex items-center gap-3 p-4', i === items.length - 1 && 'max-sm:col-span-2')}>
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-mist text-ink [&>svg]:size-4">{it.icon}</span>
          <div className="min-w-0">
            <p className="truncate text-xs text-muted">{it.label}</p>
            <p className="text-lg font-semibold text-ink tabular-nums">{it.value}</p>
          </div>
        </div>
      ))}
    </section>
  )
}

/* ---------------- Information ---------------- */

function LangText({ text, empty }: { text: LocalizedText; empty: string }) {
  const [tab, setTab] = useState<'en' | 'ar'>('en')
  const { t } = useT()
  const value = text[tab]
  return (
    <div>
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'en', label: t('common.english') },
          { value: 'ar', label: t('common.arabic') },
        ]}
      />
      <p dir={tab === 'ar' ? 'rtl' : 'ltr'} lang={tab} className={cn('pt-3 text-[13.5px] leading-relaxed whitespace-pre-line', value ? 'text-ink' : 'text-subtle')}>
        {value || empty}
      </p>
    </div>
  )
}

export function InfoCard({ p, categories }: { p: ProductRow; categories: AdminCategory[] }) {
  const { t, l, lang } = useT()
  const cat = categories.find((c) => c.id === p.categoryId)
  const sub = categories.find((c) => c.id === p.subcategoryId)
  const none = t('products.detail.noContent')
  return (
    <Card title={t('products.detail.information')}>
      <div className="space-y-5">
        {p.nameAr && (
          <p dir="rtl" lang="ar" className="text-[15px] font-medium text-ink">
            {p.nameAr}
          </p>
        )}
        <KeyValue
          cols={2}
          items={[
            {
              label: t('products.detail.brand'),
              value: (
                <Link to={`/brands/${p.brandId}`} className="text-rose-dark hover:underline">
                  {p.brandName}
                </Link>
              ),
            },
            { label: t('products.detail.category'), value: cat ? l(cat.name) : p.categoryName },
            { label: t('products.detail.subcategory'), value: sub ? l(sub.name) : p.subcategoryName },
            { label: t('products.detail.sku'), value: <span dir="ltr" className="font-mono">{p.sku}</span> },
            { label: t('products.detail.barcode'), value: <span dir="ltr" className="font-mono">{p.barcode || '—'}</span> },
            { label: t('products.detail.weight'), value: p.weightGrams ? `${formatNumber(p.weightGrams)} ${t('products.form.weightUnit')}` : '—' },
            { label: t('products.detail.created'), value: formatDate(p.createdAt, lang) },
            { label: t('products.detail.updated'), value: formatDate(p.updatedAt, lang) },
          ]}
        />
        <div>
          <p className="mb-2 text-[13px] text-muted">{t('products.detail.flags')}</p>
          <FlagBadges flags={p.flags} />
        </div>
        <div className="grid grid-cols-1 gap-5 border-t border-line-soft pt-4">
          <div>
            <h3 className="mb-1 text-[13px] font-semibold text-ink">{t('products.detail.shortDescription')}</h3>
            <LangText text={p.shortDescription} empty={none} />
          </div>
          <div>
            <h3 className="mb-1 text-[13px] font-semibold text-ink">{t('products.detail.description')}</h3>
            <LangText text={p.description} empty={none} />
          </div>
          <div>
            <h3 className="mb-1 text-[13px] font-semibold text-ink">{t('products.detail.howToUse')}</h3>
            <LangText text={p.howToUse} empty={none} />
          </div>
          <div>
            <h3 className="mb-1.5 text-[13px] font-semibold text-ink">{t('products.detail.ingredients')}</h3>
            <p dir="ltr" className={cn('text-[13px] leading-relaxed', p.ingredients ? 'text-muted' : 'text-subtle')}>
              {p.ingredients || none}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}

/* ---------------- Pricing & inventory ---------------- */

export function PricingCard({ p }: { p: ProductRow }) {
  const { t } = useT()
  const margin = marginPercent(p.price, p.costPrice)
  const discount = discountPercent(p.price, p.compareAtPrice)
  return (
    <Card title={t('products.detail.pricing')}>
      <p className="text-2xl font-semibold text-ink">
        <Money value={p.price} />
      </p>
      {discount > 0 && (
        <p className="mt-1 flex items-center gap-2 text-[13px]">
          <Money value={p.compareAtPrice!} className="text-subtle line-through" />
          <Badge tone="rose">−{discount}%</Badge>
        </p>
      )}
      <KeyValue
        className="mt-4 border-t border-line-soft pt-4"
        items={[
          { label: t('products.detail.compareAt'), value: p.compareAtPrice ? <Money value={p.compareAtPrice} /> : '—' },
          { label: t('products.detail.cost'), value: <Money value={p.costPrice} /> },
          {
            label: t('products.detail.margin'),
            value: <span className={cn('tabular-nums', margin !== null && margin < 20 ? 'text-warning' : 'text-success')} dir="ltr">{margin === null ? '—' : `${margin}%`}</span>,
          },
        ]}
      />
    </Card>
  )
}

export function InventoryCard({ p }: { p: ProductRow }) {
  const { t } = useT()
  const available = Math.max(0, p.stock - p.reserved)
  const status = p.stock <= 0 ? 'out_of_stock' : p.stock <= p.lowStockThreshold ? 'low_stock' : 'in_stock'
  const ratio = p.lowStockThreshold > 0 ? Math.min(1, p.stock / (p.lowStockThreshold * 4)) : 1
  return (
    <Card title={t('products.detail.inventory')} actions={<StatusBadge status={status} />}>
      <div className="flex items-baseline gap-2">
        <span className={cn('text-2xl font-semibold tabular-nums', status === 'out_of_stock' ? 'text-error' : status === 'low_stock' ? 'text-warning' : 'text-ink')}>{formatNumber(p.stock)}</span>
        <span className="text-[13px] text-muted">{t('products.detail.stock')}</span>
      </div>
      <ProgressBar value={ratio} tone={status === 'out_of_stock' ? 'error' : status === 'low_stock' ? 'warning' : 'success'} className="mt-3" />
      <KeyValue
        className="mt-4"
        items={[
          { label: t('products.detail.reserved'), value: <span className="tabular-nums">{formatNumber(p.reserved)}</span> },
          { label: t('products.detail.available'), value: <span className="tabular-nums">{formatNumber(available)}</span> },
          { label: t('products.detail.threshold'), value: <span className="tabular-nums">{formatNumber(p.lowStockThreshold)}</span> },
        ]}
      />
      <ButtonLink to={`/inventory/${p.id}`} variant="outline" size="sm" className="mt-4 w-full">
        {t('products.detail.manageInventory')}
      </ButtonLink>
    </Card>
  )
}

/* ---------------- Variants ---------------- */

export function VariantsCard({ p }: { p: ProductRow }) {
  const { t } = useT()
  return (
    <Card title={t('products.detail.variants')} padded={false} actions={p.variants.length ? <Badge>{p.variants.length}</Badge> : undefined}>
      {p.variants.length === 0 ? (
        <p className="px-5 pb-5 text-[13px] text-subtle">{t('products.detail.noVariants')}</p>
      ) : (
        <div className="thin-scrollbar overflow-x-auto">
          <table className="w-full min-w-[520px] text-[13px]">
            <thead>
              <tr className="border-y border-line-soft text-[11.5px] tracking-wide text-muted uppercase">
                <th className="px-5 py-2 text-start font-semibold">{t('products.form.variantName')}</th>
                <th className="px-3 py-2 text-start font-semibold">{t('products.form.variantSku')}</th>
                <th className="px-3 py-2 text-end font-semibold">{t('products.form.variantPrice')}</th>
                <th className="px-3 py-2 text-end font-semibold">{t('products.form.variantStock')}</th>
                <th className="px-5 py-2 text-end font-semibold">{t('common.status')}</th>
              </tr>
            </thead>
            <tbody>
              {p.variants.map((v) => (
                <tr key={v.id} className="border-b border-line-soft last:border-0">
                  <td className="px-5 py-2.5">
                    <span className="flex items-center gap-2.5">
                      {v.kind === 'shade' && v.hex ? <span className="size-5 shrink-0 rounded-full border border-line" style={{ background: v.hex }} aria-hidden /> : v.image ? <Thumb src={v.image} alt="" size="xs" /> : null}
                      <span className="font-medium text-ink">{v.name}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-muted" dir="ltr">
                    {v.sku}
                  </td>
                  <td className="px-3 py-2.5 text-end">
                    <Money value={v.price} />
                  </td>
                  <td className={cn('px-3 py-2.5 text-end tabular-nums', v.stock <= 0 && 'text-error')}>{formatNumber(v.stock)}</td>
                  <td className="px-5 py-2.5 text-end">
                    <StatusBadge status={v.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

/* ---------------- Reviews ---------------- */

export function ReviewsCard({ productId }: { productId: string }) {
  const { t, lang } = useT()
  const { data, loading } = useAsync(() => getReviews({ filters: { productId }, pageSize: 6 }), [productId])
  const avg = data?.items.length ? data.items.reduce((s, r) => s + r.rating, 0) / data.items.length : 0
  return (
    <Card
      title={t('products.detail.reviews')}
      description={data && data.total > 0 ? t('products.detail.reviewsCount', { count: data.total, rating: avg.toFixed(1) }) : undefined}
      padded={false}
      actions={data && data.total > 0 ? <ButtonLink to="/reviews" variant="ghost" size="sm">{t('common.viewAll')}</ButtonLink> : undefined}
    >
      {loading && !data ? (
        <div className="space-y-3 px-5 pb-5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : !data?.items.length ? (
        <EmptyState icon={<MessageSquare />} title={t('products.detail.noReviews')} className="py-8" />
      ) : (
        <ul className="divide-y divide-line-soft border-t border-line-soft">
          {data.items.map((r) => (
            <li key={r.id}>
              <Link to={`/reviews/${r.id}`} className="block px-5 py-3.5 transition-colors hover:bg-mist/60">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <RatingStars rating={r.rating} size={12} />
                    <span className="truncate text-[13px] font-medium text-ink">{r.title}</span>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <p className="mt-1 line-clamp-2 text-[13px] text-muted">{r.body}</p>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs text-subtle">
                  <span>{r.customerName}</span>
                  <span aria-hidden>·</span>
                  <span>{formatDate(r.createdAt, lang)}</span>
                  {r.verified && (
                    <span className="inline-flex items-center gap-1 text-success">
                      <BadgeCheck className="size-3" /> {t('products.detail.verified')}
                    </span>
                  )}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

/* ---------------- Activity ---------------- */

export function ActivityCard({ productId, refreshKey }: { productId: string; refreshKey?: unknown }) {
  const { t, lang } = useT()
  const { data, loading } = useAsync(async () => {
    const res = await getActivity({ pageSize: 10000 })
    return res.items.filter((a) => a.entityId === productId).slice(0, 8)
  }, [productId, refreshKey])
  return (
    <Card title={t('products.detail.activity')}>
      {loading && !data ? (
        <Skeleton className="h-24" />
      ) : !data?.length ? (
        <p className="text-[13px] text-subtle">{t('products.detail.noActivity')}</p>
      ) : (
        <Timeline
          items={data.map((a) => ({
            title: a.description,
            description: a.userName,
            time: <span title={formatDateTime(a.date, lang)}>{timeAgo(a.date, lang)}</span>,
            tone: a.status === 'failed' ? 'error' : 'done',
          }))}
        />
      )}
    </Card>
  )
}
