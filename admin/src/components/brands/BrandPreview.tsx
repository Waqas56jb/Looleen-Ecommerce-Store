import { ArrowRight, ShieldCheck, Star } from 'lucide-react'
import { Img } from '@/components/ui'
import { useT } from '@/i18n'
import { cn } from '@/utils'
import { BrandLogo, useCountryName } from './shared'

interface BrandPreviewProps {
  name: string
  nameAr: string
  logo?: string
  banner: string
  description: string
  country: string
  authorized: boolean
  featured: boolean
  active: boolean
}

/** Mimics the storefront brand banner card */
export function BrandPreview(p: BrandPreviewProps) {
  const { t, lang } = useT()
  const countryName = useCountryName()
  const title = (lang === 'ar' ? p.nameAr || p.name : p.name || p.nameAr) || t('catalog.brandForm.untitled')
  const sub = lang === 'ar' ? p.name : p.nameAr
  return (
    <section className="card overflow-hidden">
      <header className="border-b border-line-soft px-5 py-4">
        <h2 className="text-[15px] font-semibold text-ink">{t('catalog.brandForm.preview')}</h2>
        <p className="mt-0.5 text-[13px] text-muted">{t('catalog.brandForm.previewDesc')}</p>
      </header>
      <div className={cn('bg-mist p-4 transition-opacity', !p.active && 'opacity-60')}>
        <article className="overflow-hidden rounded-lg bg-surface shadow-card">
          <div className="relative aspect-[16/9] bg-blush">
            <Img src={p.banner || undefined} alt="" w={700} className="absolute inset-0 size-full" key={p.banner} />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-ink/5" aria-hidden />
            {p.featured && (
              <span className="absolute end-3 top-3 inline-flex items-center gap-1 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-ink">
                <Star className="size-3 fill-champagne text-champagne" />
                {t('common.featured')}
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-4 text-white">
              <BrandLogo name={p.name || p.nameAr || '?'} logo={p.logo} size="md" className="shadow-card" />
              <div className="min-w-0">
                <p className="truncate font-serif text-2xl leading-tight">{title}</p>
                <p className="truncate text-xs text-white/75">
                  {sub}
                  {p.country && <span> · {countryName(p.country)}</span>}
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-3 p-4">
            {p.authorized && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success-soft px-2.5 py-1 text-[11px] font-medium text-success">
                <ShieldCheck className="size-3.5" />
                {t('catalog.brandForm.authorizedBadge')}
              </span>
            )}
            <p className="line-clamp-3 text-[13px] leading-relaxed text-muted">{p.description || '—'}</p>
            <span className="inline-flex items-center gap-1 text-[13px] font-medium text-ink underline-offset-4">
              {t('catalog.brandForm.discover')}
              <ArrowRight className="size-3.5 rtl:-scale-x-100" />
            </span>
          </div>
        </article>
      </div>
    </section>
  )
}
