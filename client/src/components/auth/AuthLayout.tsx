import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { SmartImage } from '@/components/common'
import { EDITORIAL } from '@/data/images'
import { useT } from '@/i18n'

/** Split-screen auth layout: editorial image on desktop, form column always. */
export function AuthLayout({ eyebrow, title, subtitle, children, footer }: { eyebrow: string; title: ReactNode; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  const { t } = useT()
  return (
    <div className="grid grid-cols-1 lg:min-h-[calc(100vh-120px)] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        <SmartImage src={EDITORIAL.auth} alt="" width={1200} height={1500} priority wrapperClassName="absolute inset-0" className="opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 p-12 text-ivory xl:p-16">
          <p className="eyebrow text-champagne-soft">{t('auth.asideEyebrow')}</p>
          <p className="mt-3 max-w-md font-serif text-4xl leading-[1.08] font-medium tracking-[-0.02em] xl:text-5xl">{t('auth.asideTitle')}</p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-ivory/80">{t('auth.asideBody')}</p>
          <ul className="mt-6 space-y-2 text-sm text-ivory/90">
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex items-center gap-2.5">
                <Check className="size-4 text-champagne" aria-hidden />
                {t(`auth.asidePoints.${i}`)}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex items-start justify-center px-4 py-12 sm:px-8 sm:py-16 lg:items-center lg:py-20">
        <div className="animate-fade-up w-full max-w-[440px]">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-3 font-serif text-4xl leading-[1.08] font-medium tracking-[-0.025em] text-balance sm:text-[44px]">{title}</h1>
          {subtitle && <p className="mt-3 text-[15px] leading-relaxed text-muted">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 border-t border-line pt-6 text-center text-sm text-muted">{footer}</div>}
        </div>
      </div>
    </div>
  )
}
