import { Link } from 'react-router-dom'
import { ArrowRight, MessageCircle } from 'lucide-react'
import { buttonClass } from '@/components/common'
import { cn, whatsappLink } from '@/utils'
import { useStaticCopy } from './copy'

/** Dark "Still need help?" band with WhatsApp + contact links */
export function HelpBand({ title, text, className }: { title?: string; text?: string; className?: string }) {
  const { c, f } = useStaticCopy()
  return (
    <section className={cn('bg-ink text-ivory', className)} aria-labelledby="help-band-title">
      <div className="container-x flex flex-col gap-8 py-14 sm:py-16 lg:flex-row lg:items-center lg:justify-between lg:py-20">
        <div className="max-w-xl">
          <p className="eyebrow mb-3 text-champagne">{f('{store}')} · {c.contact.hero.eyebrow}</p>
          <h2 id="help-band-title" className="heading-section text-ivory">
            {title ?? c.shared.needHelpTitle}
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ivory/70">{text ?? c.shared.needHelpText}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className={buttonClass('primary', 'lg')}>
            <MessageCircle className="size-4" aria-hidden />
            {c.shared.whatsappCta}
          </a>
          <Link to="/contact" className={buttonClass('outline', 'lg', 'border-ivory/60 text-ivory hover:bg-ivory hover:text-ink')}>
            {c.shared.contactCta}
            <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  )
}
