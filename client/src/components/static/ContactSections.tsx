import type { ReactNode } from 'react'
import { ArrowUpRight, Building2, Clock, FileText, Landmark, Mail, MapPin, MessageCircle, Navigation, Phone, Receipt } from 'lucide-react'
import { SmartImage } from '@/components/common'
import { STORE_CONFIG } from '@/config/store'
import { EDITORIAL } from '@/data/images'
import { cn, whatsappLink } from '@/utils'
import { useStaticCopy } from './copy'

interface CardProps {
  icon: ReactNode
  title: string
  text: string
  value: ReactNode
  href?: string
  action?: string
  external?: boolean
  highlight?: boolean
}

function ContactCard({ icon, title, text, value, href, action, external, highlight }: CardProps) {
  const inner = (
    <>
      <span className={cn('grid size-12 place-items-center rounded-full transition-colors duration-300', highlight ? 'bg-rose text-white' : 'bg-blush text-rose group-hover:bg-rose group-hover:text-white')}>
        {icon}
      </span>
      <h3 className="heading-card mt-6">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
      <p className="mt-5 text-[15px] font-semibold text-ink">{value}</p>
      {action && (
        <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-medium text-rose">
          <span className="link-underline">{action}</span>
          <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden />
        </span>
      )}
    </>
  )
  const cls = cn('group flex h-full flex-col rounded-xs border bg-white p-6 transition-all duration-300 sm:p-7', highlight ? 'border-rose/40' : 'border-line', href && 'hover:-translate-y-0.5 hover:border-ink/30 hover:shadow-soft')
  return href ? (
    <a href={href} className={cls} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {inner}
    </a>
  ) : (
    <div className={cls}>{inner}</div>
  )
}

export function ContactCards() {
  const { c, f, lang } = useStaticCopy()
  const k = c.contact.cards
  const tel = `tel:${STORE_CONFIG.supportPhone.replace(/\s/g, '')}`
  const hours = lang === 'ar' ? c.contact.hoursValue : f(c.contact.hoursValue)
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <li>
        <ContactCard
          highlight
          icon={<MessageCircle className="size-5" strokeWidth={1.6} aria-hidden />}
          title={k.whatsapp.title}
          text={k.whatsapp.text}
          value={<span dir="ltr">{STORE_CONFIG.supportPhone}</span>}
          href={whatsappLink()}
          action={k.whatsapp.action}
          external
        />
      </li>
      <li>
        <ContactCard
          icon={<Phone className="size-5" strokeWidth={1.6} aria-hidden />}
          title={k.phone.title}
          text={k.phone.text}
          value={<span dir="ltr">{STORE_CONFIG.supportPhone}</span>}
          href={tel}
          action={k.phone.action}
        />
      </li>
      <li>
        <ContactCard
          icon={<Mail className="size-5" strokeWidth={1.6} aria-hidden />}
          title={k.email.title}
          text={k.email.text}
          value={<span dir="ltr" className="break-all">{STORE_CONFIG.supportEmail}</span>}
          href={`mailto:${STORE_CONFIG.supportEmail}`}
          action={k.email.action}
        />
      </li>
      <li>
        <ContactCard icon={<Clock className="size-5" strokeWidth={1.6} aria-hidden />} title={k.hours.title} text={k.hours.text} value={hours} />
      </li>
    </ul>
  )
}

export function BusinessInfo() {
  const { c } = useStaticCopy()
  const b = c.contact.business
  const rows = [
    { icon: Building2, label: b.legalName, value: STORE_CONFIG.legalName },
    { icon: FileText, label: b.cr, value: STORE_CONFIG.commercialRegistration },
    { icon: Receipt, label: b.vat, value: STORE_CONFIG.vatNumber },
    { icon: Landmark, label: b.address, value: STORE_CONFIG.address },
  ]
  return (
    <div className="flex h-full flex-col rounded-xs bg-ink p-6 text-ivory sm:p-8 lg:p-10">
      <p className="eyebrow text-champagne">{b.eyebrow}</p>
      <h2 className="heading-card mt-3 text-ivory sm:text-[28px]">{b.title}</h2>
      <dl className="mt-8 divide-y divide-ivory/10 border-y border-ivory/10">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex gap-4 py-4">
            <Icon className="mt-0.5 size-4.5 shrink-0 text-champagne" strokeWidth={1.6} aria-hidden />
            <div className="min-w-0">
              <dt className="text-xs tracking-wide text-ivory/55">{label}</dt>
              <dd className="mt-1 text-[15px] font-medium break-words text-ivory">
                <span dir="ltr" className="inline-block">{value}</span>
              </dd>
            </div>
          </div>
        ))}
      </dl>
      <p className="mt-6 text-xs leading-relaxed text-ivory/60">{b.note}</p>
    </div>
  )
}

export function MapBlock() {
  const { c, f, lang } = useStaticCopy()
  const m = c.contact.map
  const address = lang === 'ar' ? m.address : f(m.address)
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE_CONFIG.address)}`
  return (
    <div className="relative h-full min-h-[440px] overflow-hidden rounded-xs">
      <SmartImage src={EDITORIAL.contact} alt={m.imageAlt} width={1200} height={1000} wrapperClassName="absolute inset-0" />
      <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/50 via-ink/10 to-transparent" />
      {/* Stylised pin */}
      <span aria-hidden className="absolute inset-x-0 top-[32%] mx-auto w-fit">
        <span className="absolute inset-0 -m-3 animate-ping rounded-full bg-rose/30" />
        <span className="relative grid size-12 place-items-center rounded-full bg-rose text-white shadow-lift">
          <MapPin className="size-5" strokeWidth={1.8} />
        </span>
      </span>
      <div className="absolute inset-x-4 bottom-4 rounded-xs bg-ivory/95 p-5 shadow-lift backdrop-blur sm:inset-x-6 sm:bottom-6 sm:p-6">
        <p className="eyebrow">{m.eyebrow}</p>
        <h3 className="heading-card mt-2">{m.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{address}</p>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink transition-colors hover:text-rose"
        >
          <Navigation className="size-4 text-rose rtl:-scale-x-100" aria-hidden />
          <span className="link-underline">{m.directions}</span>
        </a>
      </div>
    </div>
  )
}
