import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, MessageCircle, Phone, ShieldCheck } from 'lucide-react'
import { AccordionItem, Button, Logo, PaymentMarks } from '@/components/common'
import { STORE_CONFIG } from '@/config/store'
import { footerLinks } from '@/data/navigation'
import { useT } from '@/i18n'
import { isValidEmail, whatsappLink } from '@/utils'

/* Simple brand glyphs (lucide v1 ships no brand icons) */
const SocialIcon = {
  instagram: (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
      <path d="M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.7 5.7 0 1 0 4.9 5.7V9.1a7.3 7.3 0 0 0 4.3 1.4V7.4a4.3 4.3 0 0 1-3.2-1.6Z" />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
      <path d="M13.5 21v-7.5H16l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4A20 20 0 0 0 14.3 4c-2.2 0-3.7 1.3-3.7 3.8v2.7H8v3h2.6V21h2.9Z" />
    </svg>
  ),
}

/** Newsletter sign-up (mock) — used in the footer and on the home page */
export function NewsletterForm({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  const { t } = useT()
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  if (state === 'done') return <p className={tone === 'light' ? 'text-sm text-ivory' : 'text-sm text-success'}>{t('common.newsletterSuccess')}</p>
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        if (!isValidEmail(email)) return setState('error')
        setState('loading')
        setTimeout(() => setState('done'), 600)
      }}
      className="w-full"
    >
      <div className="flex gap-2">
        <label className="sr-only" htmlFor={`nl-${tone}`}>
          {t('common.emailPlaceholder')}
        </label>
        <input
          id={`nl-${tone}`}
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (state === 'error') setState('idle')
          }}
          placeholder={t('common.emailPlaceholder')}
          aria-invalid={state === 'error' || undefined}
          className={
            tone === 'light'
              ? 'h-12 min-w-0 flex-1 rounded-full border border-white/25 bg-white/10 px-5 text-sm text-ivory outline-none placeholder:text-ivory/50 focus:border-white/60'
              : 'h-12 min-w-0 flex-1 rounded-full border border-line bg-white px-5 text-sm outline-none focus:border-ink'
          }
        />
        <Button type="submit" loading={state === 'loading'} variant={tone === 'light' ? 'light' : 'dark'} className="h-12 shrink-0">
          {t('common.newsletterCta')}
        </Button>
      </div>
      {state === 'error' && <p className={tone === 'light' ? 'mt-2 text-xs text-rose-soft' : 'mt-2 text-xs text-error'}>{t('common.invalidEmail')}</p>}
    </form>
  )
}

export function Footer() {
  const { t, l } = useT()
  const year = new Date().getFullYear()
  return (
    <footer className="mt-auto bg-ink text-ivory">
      <div className="border-b border-white/10">
        <div className="container-x flex flex-col items-start gap-6 py-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-md">
            <p className="font-serif text-3xl tracking-[-0.02em]">{t('common.newsletterTitle')}</p>
            <p className="mt-2 text-sm text-ivory/60">{t('common.newsletterDesc')}</p>
          </div>
          <div className="w-full max-w-lg">
            <NewsletterForm tone="light" />
          </div>
        </div>
      </div>

      <div className="container-x grid grid-cols-1 gap-10 py-14 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Logo tone="light" className="items-start" />
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-ivory/65">{t('footer.statement')}</p>
          <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-champagne">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
            {t('footer.authentic')}
          </p>
          <div className="mt-6 space-y-2 text-sm text-ivory/75">
            <a href={whatsappLink()} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-ivory">
              <MessageCircle className="size-4" aria-hidden /> {t('common.whatsappChat')}
            </a>
            <a href={`tel:${STORE_CONFIG.supportPhone.replace(/\s/g, '')}`} className="flex items-center gap-2 hover:text-ivory" dir="ltr">
              <Phone className="size-4" aria-hidden /> {STORE_CONFIG.supportPhone}
            </a>
            <a href={`mailto:${STORE_CONFIG.supportEmail}`} className="flex items-center gap-2 hover:text-ivory">
              <Mail className="size-4" aria-hidden /> {STORE_CONFIG.supportEmail}
            </a>
          </div>
        </div>

        {/* Desktop columns */}
        <div className="hidden gap-8 lg:col-span-5 lg:col-start-6 lg:grid lg:grid-cols-3">
          {footerLinks.map((col) => (
            <div key={col.title.en}>
              <p className="mb-5 text-[11px] font-semibold tracking-[0.2em] text-ivory/50 uppercase">{l(col.title)}</p>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link to={link.href} className="link-underline text-sm text-ivory/80 hover:text-ivory">
                      {l(link.label)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Mobile accordions */}
        <div className="lg:hidden [&_button]:text-ivory [&_div]:border-white/10">
          {footerLinks.map((col) => (
            <AccordionItem key={col.title.en} title={l(col.title)} className="border-white/10">
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link to={link.href} className="text-sm text-ivory/75">
                      {l(link.label)}
                    </Link>
                  </li>
                ))}
              </ul>
            </AccordionItem>
          ))}
        </div>

        <div className="lg:col-span-2 lg:col-start-11 lg:row-start-1">
          <p className="mb-5 text-[11px] font-semibold tracking-[0.2em] text-ivory/50 uppercase">{t('footer.follow')}</p>
          <div className="flex gap-2">
            {(Object.keys(SocialIcon) as (keyof typeof SocialIcon)[]).map((k) => (
              <a key={k} href={STORE_CONFIG.social[k]} target="_blank" rel="noreferrer" aria-label={k} className="grid size-10 place-items-center rounded-full border border-white/20 text-ivory/80 transition-colors hover:border-white hover:text-white">
                {SocialIcon[k]}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-5 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-2.5 text-[11px] font-semibold tracking-[0.2em] text-ivory/50 uppercase">{t('footer.payments')}</p>
            <PaymentMarks include={['mada', 'visa', 'mastercard', 'applepay', 'stcpay', 'tabby', 'tamara', 'cod']} />
          </div>
          <div className="text-xs text-ivory/50 lg:text-end">
            <p>{t('footer.rights', { year, store: STORE_CONFIG.name })}</p>
            <p className="mt-1" dir="ltr">
              {t('footer.cr', { cr: STORE_CONFIG.commercialRegistration, vat: STORE_CONFIG.vatNumber })}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
