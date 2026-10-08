import { useMemo, useState } from 'react'
import { Gift, MessageSquareHeart, ShoppingBag, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { AccountPageHeader, Panel } from '@/components/account/AccountUI'
import { loyaltyTier } from '@/components/account/shell'
import { Button, ProgressBar } from '@/components/common'
import { STORE_CONFIG } from '@/config/store'
import { loyaltyActivity, loyaltyRewards } from '@/data/account'
import { useDocumentMeta } from '@/hooks'
import { useT } from '@/i18n'
import { updateProfile } from '@/services/authService'
import { useAuthStore } from '@/store/auth'
import type { LoyaltyActivity, LoyaltyReward } from '@/types'
import { cn, formatDate, formatPrice } from '@/utils'

const voucherCode = () => `LOOKS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

export default function LoyaltyPage() {
  const { t, l, lang } = useT()
  useDocumentMeta(t('account.loyalty.metaTitle'), t('account.loyalty.metaDesc'))
  const user = useAuthStore((s) => s.user)
  const [session, setSession] = useState<LoyaltyActivity[]>([])
  const [redeeming, setRedeeming] = useState<string | null>(null)

  const activity = useMemo(() => [...session, ...loyaltyActivity], [session])
  const earned = activity.filter((a) => a.points > 0).reduce((s, a) => s + a.points, 0)
  const used = activity.filter((a) => a.points < 0).reduce((s, a) => s - a.points, 0)

  if (!user) return null
  const points = user.loyaltyPoints
  const tier = loyaltyTier(points)
  const rate = STORE_CONFIG.loyalty.sarPerHundredPoints
  const fmt = (n: number) => n.toLocaleString('en-US')
  const tierName = (id: string) => t(`account.loyalty.tiers.${id}`)

  const redeem = async (r: LoyaltyReward) => {
    if (points < r.points) return
    setRedeeming(r.id)
    await updateProfile({ loyaltyPoints: points - r.points })
    const code = voucherCode()
    setSession((s) => [{ id: `s-${code}`, points: -r.points, date: new Date().toISOString(), label: { en: `Redeemed: ${r.title.en}`, ar: `استبدال: ${r.title.ar}` } }, ...s])
    setRedeeming(null)
    toast.success(t('account.loyalty.redeemed', { reward: l(r.title) }), { description: t('account.loyalty.voucher', { code }), duration: 10_000 })
  }

  const steps = [
    { icon: ShoppingBag, title: t('account.loyalty.step1'), desc: t('account.loyalty.step1Desc') },
    { icon: MessageSquareHeart, title: t('account.loyalty.step2'), desc: t('account.loyalty.step2Desc') },
    { icon: Gift, title: t('account.loyalty.step3'), desc: t('account.loyalty.step3Desc', { amount: formatPrice(rate, lang) }) },
  ]

  return (
    <div className="space-y-8">
      <AccountPageHeader title={t('account.loyalty.title')} description={t('account.loyalty.desc')} />

      {/* Hero */}
      <section className="relative overflow-hidden rounded-xs bg-ink text-ivory" aria-labelledby="loyalty-points">
        <div aria-hidden className="pointer-events-none absolute -end-16 -top-16 size-64 rounded-full border border-champagne/20" />
        <div aria-hidden className="pointer-events-none absolute -end-4 -top-4 size-40 rounded-full border border-champagne/15" />
        <div className="relative grid grid-cols-1 gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:p-10">
          <div>
            <p className="eyebrow inline-flex items-center gap-2 text-champagne">
              <Sparkles className="size-3.5" aria-hidden />
              {t('account.loyalty.tier', { tier: tierName(tier.current.id) })}
            </p>
            <p className="mt-6 text-xs tracking-[0.18em] text-ivory/60 uppercase">{t('account.loyalty.available')}</p>
            <p id="loyalty-points" className="mt-2 font-serif text-6xl leading-none font-medium tabular-nums sm:text-7xl">
              {fmt(points)}
            </p>
            <p className="mt-3 text-sm text-champagne">{t('account.loyalty.worth', { amount: formatPrice((points / 100) * rate, lang) })}</p>
            <div className="mt-8 max-w-md">
              {tier.next ? (
                <>
                  <div className="mb-2 flex justify-between text-xs text-ivory/60">
                    <span>{tierName(tier.current.id)}</span>
                    <span>{tierName(tier.next.id)}</span>
                  </div>
                  <ProgressBar value={tier.progress} className="bg-white/15" />
                  <p className="mt-3 text-sm text-ivory/75">{t('account.loyalty.toNext', { points: fmt(tier.remaining), tier: tierName(tier.next.id) })}</p>
                </>
              ) : (
                <p className="text-sm text-ivory/75">{t('account.loyalty.topTier')}</p>
              )}
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-px self-end overflow-hidden rounded-xs bg-white/10 lg:w-72 lg:grid-cols-1">
            <div className="bg-ink-soft p-4">
              <dt className="text-xs text-ivory/60">{t('account.loyalty.earned')}</dt>
              <dd className="mt-1 font-serif text-3xl font-medium tabular-nums">{fmt(earned)}</dd>
            </div>
            <div className="bg-ink-soft p-4">
              <dt className="text-xs text-ivory/60">{t('account.loyalty.used')}</dt>
              <dd className="mt-1 font-serif text-3xl font-medium tabular-nums">{fmt(used)}</dd>
            </div>
            <div className="col-span-2 bg-ink-soft p-4 lg:col-span-1">
              <dt className="sr-only">{t('account.loyalty.how')}</dt>
              <dd className="text-xs text-champagne">{t('account.loyalty.rate', { amount: formatPrice(rate, lang) })}</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Rewards */}
      <Panel title={t('account.loyalty.rewards')} description={t('account.loyalty.rewardsDesc')}>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {loyaltyRewards.map((r) => {
            const enough = points >= r.points
            return (
              <li key={r.id} className={cn('flex flex-col rounded-xs border p-5', enough ? 'border-champagne/50 bg-champagne-soft/25' : 'border-line bg-ivory/40')}>
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-rose shadow-soft">
                    <Gift className="size-[18px]" aria-hidden />
                  </span>
                  <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-ivory tabular-nums">{t('account.loyalty.pts', { points: fmt(r.points) })}</span>
                </div>
                <h3 className="mt-4 font-serif text-xl font-medium">{l(r.title)}</h3>
                <p className="mt-1 flex-1 text-sm text-muted">{l(r.description)}</p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  {!enough && <span className="text-xs text-muted">{t('account.loyalty.needMore', { points: fmt(r.points - points) })}</span>}
                  <Button size="sm" variant={enough ? 'primary' : 'outline'} disabled={!enough} loading={redeeming === r.id} onClick={() => redeem(r)} className="ms-auto">
                    {t('account.loyalty.redeem')}
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        {/* Activity */}
        <Panel title={t('account.loyalty.activity')} bodyClassName="p-0">
          {activity.length ? (
            <ul className="divide-y divide-line">
              {activity.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{l(a.label)}</p>
                    <p className="mt-0.5 text-xs text-muted">{formatDate(a.date, lang)}</p>
                  </div>
                  <span className={cn('shrink-0 text-sm font-semibold tabular-nums', a.points > 0 ? 'text-success' : 'text-muted')} dir="ltr">
                    {a.points > 0 ? '+' : '−'}
                    {fmt(Math.abs(a.points))}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-6 text-sm text-muted">{t('account.loyalty.activityEmpty')}</p>
          )}
        </Panel>

        {/* How it works */}
        <section className="rounded-xs bg-blush/60 p-5 sm:p-6" aria-labelledby="loyalty-how">
          <h2 id="loyalty-how" className="mb-6 font-serif text-xl font-medium tracking-[-0.015em] sm:text-2xl">{t('account.loyalty.how')}</h2>
          <ol className="space-y-6">
            {steps.map(({ icon: Icon, title, desc }, i) => (
              <li key={title} className="flex gap-4">
                <span className="relative grid size-11 shrink-0 place-items-center rounded-full bg-white text-rose">
                  <Icon className="size-5" strokeWidth={1.6} aria-hidden />
                  <span className="absolute -end-1 -top-1 grid size-5 place-items-center rounded-full bg-ink text-[10px] font-semibold text-ivory">{i + 1}</span>
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  )
}
