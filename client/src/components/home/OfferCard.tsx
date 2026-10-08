import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Countdown, SmartImage } from '@/components/common'
import { useT } from '@/i18n'
import type { Offer } from '@/types'
import { cn } from '@/utils'

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

export function CouponCode({ code, tone = 'dark' }: { code: string; tone?: 'dark' | 'light' }) {
  const { t } = useT()
  const [copied, setCopied] = useState(false)
  const onCopy = async () => {
    const ok = await copyText(code)
    if (ok) {
      setCopied(true)
      toast.success(t('home.offers.copiedToast', { code }), { description: t('home.offers.copiedDesc') })
      setTimeout(() => setCopied(false), 2000)
    } else {
      toast.error(t('home.offers.copyFailed', { code }))
    }
  }
  return (
    <div className={cn('flex items-center gap-1 rounded-full border border-dashed p-1 ps-4', tone === 'light' ? 'border-white/40' : 'border-ink/30 bg-white')}>
      <span className={cn('text-[10px] font-semibold tracking-[0.18em] uppercase', tone === 'light' ? 'text-ivory/60' : 'text-muted')}>{t('home.offers.code')}</span>
      <span className={cn('flex-1 px-1 font-mono text-sm font-semibold tracking-[0.12em]', tone === 'light' ? 'text-ivory' : 'text-ink')} dir="ltr">
        {code}
      </span>
      <button
        type="button"
        onClick={onCopy}
        aria-label={t('home.offers.copyCode', { code })}
        className={cn(
          'inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-colors',
          copied ? 'bg-success text-white' : tone === 'light' ? 'bg-white text-ink hover:bg-ivory' : 'bg-ink text-ivory hover:bg-ink-soft',
        )}
      >
        {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
        {copied ? t('common.copied') : t('common.copy')}
      </button>
    </div>
  )
}

export function OfferCard({ offer, featured }: { offer: Offer; featured?: boolean }) {
  const { t, l } = useT()
  return (
    <article className={cn('group flex h-full flex-col overflow-hidden rounded-xs border border-line bg-white', featured && 'lg:flex-row')}>
      <Link to={offer.href} tabIndex={-1} aria-hidden className={cn('relative block overflow-hidden', featured && 'lg:w-1/2')}>
        <SmartImage src={offer.image} alt="" width={featured ? 1000 : 800} height={featured ? 800 : 560} wrapperClassName={cn('aspect-[10/7]', featured && 'lg:aspect-auto lg:h-full lg:min-h-[380px]')} className="transition-transform duration-700 group-hover:scale-105" />
        <span className="absolute start-4 top-4 rounded-full bg-rose px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white shadow-soft">{l(offer.discountLabel)}</span>
      </Link>
      <div className={cn('flex flex-1 flex-col p-6 sm:p-8', featured && 'lg:justify-center lg:p-12')}>
        <h3 className={cn('font-serif leading-tight font-medium text-ink', featured ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-[28px]')}>
          <Link to={offer.href} className="transition-colors hover:text-rose">
            {l(offer.title)}
          </Link>
        </h3>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">{l(offer.description)}</p>
        <div className="mt-6">
          <p className="mb-2 text-[11px] font-semibold tracking-[0.2em] text-muted uppercase">{t('home.offers.endsIn')}</p>
          <Countdown to={offer.endsAt} />
        </div>
        <div className="mt-auto flex flex-col gap-4 pt-7 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          {offer.code && <CouponCode code={offer.code} />}
          <Link to={offer.href} className="group/link inline-flex items-center gap-1.5 text-sm font-medium text-ink">
            <span className="link-underline">{t('home.offers.shopOffer')}</span>
            <span aria-hidden className="transition-transform group-hover/link:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover/link:-translate-x-0.5">
              →
            </span>
          </Link>
        </div>
      </div>
    </article>
  )
}
