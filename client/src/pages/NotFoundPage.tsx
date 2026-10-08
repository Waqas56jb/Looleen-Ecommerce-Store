import { Link } from 'react-router-dom'
import { ArrowRight, Award, Home, Sparkles, Tag } from 'lucide-react'
import { ButtonLink, SmartImage } from '@/components/common'
import { SearchBox } from '@/components/search/SearchBox'
import { useStaticCopy } from '@/components/static/copy'
import { poolImage } from '@/data/images'
import { useDocumentMeta } from '@/hooks'

export default function NotFoundPage() {
  const { c, t } = useStaticCopy()
  const n = c.notFound
  useDocumentMeta(n.metaTitle, n.text)

  const links = [
    { to: '/', label: t('common.home'), icon: Home },
    { to: '/new-arrivals', label: t('nav.newArrivals'), icon: Sparkles },
    { to: '/best-sellers', label: t('nav.bestSellers'), icon: Award },
    { to: '/brands', label: t('nav.brands'), icon: Tag },
  ]

  return (
    <section className="relative overflow-hidden bg-ivory" aria-labelledby="nf-title">
      <div className="container-x grid grid-cols-1 items-center gap-12 py-14 sm:py-20 lg:grid-cols-12 lg:gap-16 lg:py-28">
        <div className="lg:col-span-7">
          <p className="eyebrow mb-4 animate-fade-up">{n.eyebrow}</p>
          <p aria-hidden className="font-serif text-[120px] leading-[0.85] font-medium tracking-[-0.04em] text-blush-deep animate-fade-up sm:text-[180px] lg:text-[220px]" dir="ltr">
            4<span className="text-rose/70">0</span>4
          </p>
          <h1 id="nf-title" className="heading-page mt-4 text-balance animate-fade-up [animation-delay:60ms]">
            {n.title}
          </h1>
          <p className="body-lg mt-5 max-w-xl animate-fade-up [animation-delay:120ms]">{n.text}</p>

          <div className="relative z-30 mt-10 max-w-xl animate-fade-up [animation-delay:180ms]">
            <p className="mb-3 text-[13px] font-medium text-ink">{n.searchLabel}</p>
            <SearchBox />
          </div>

          <div className="mt-12">
            <p className="eyebrow mb-4 text-muted">{n.quickTitle}</p>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {links.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="group flex min-h-14 items-center gap-3 rounded-xs border border-line bg-white px-4 py-3 text-sm font-medium text-ink transition-all duration-300 hover:-translate-y-0.5 hover:border-ink/30 hover:shadow-soft"
                  >
                    <Icon className="size-4 shrink-0 text-rose" strokeWidth={1.6} aria-hidden />
                    <span className="flex-1">{label}</span>
                    <ArrowRight className="size-3.5 text-muted opacity-0 transition-opacity group-hover:opacity-100 rtl:-scale-x-100" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <ButtonLink to="/" variant="dark" className="mt-10">
            {n.backHome}
          </ButtonLink>
        </div>

        <div className="relative hidden lg:col-span-4 lg:col-start-9 lg:block">
          <span aria-hidden className="absolute inset-0 translate-x-4 translate-y-4 rounded-xs border border-champagne/50 rtl:-translate-x-4" />
          <SmartImage src={poolImage('flatlay', 4)} alt={n.imageAlt} width={800} height={1000} wrapperClassName="relative aspect-[4/5] rounded-xs" />
        </div>
      </div>
    </section>
  )
}
