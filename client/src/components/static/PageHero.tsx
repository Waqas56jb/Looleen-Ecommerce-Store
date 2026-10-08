import type { ReactNode } from 'react'
import { Breadcrumbs, SmartImage } from '@/components/common'
import { cn } from '@/utils'

interface PageHeroProps {
  eyebrow: string
  title: string
  lead?: string
  crumb: string
  /** Optional image — renders the hero as an editorial split */
  image?: string
  imageAlt?: string
  /** Extra content under the lead (search box, meta line, buttons) */
  children?: ReactNode
  align?: 'start' | 'center'
  className?: string
}

/** Editorial page header shared by all static pages */
export function PageHero({ eyebrow, title, lead, crumb, image, imageAlt = '', children, align = 'start', className }: PageHeroProps) {
  const centered = align === 'center' && !image
  return (
    <header className={cn('relative overflow-hidden border-b border-line bg-mist', className)}>
      {/* decorative arcs */}
      <span aria-hidden className="pointer-events-none absolute -end-24 -top-24 size-72 rounded-full border border-champagne/30 sm:size-96" />
      <span aria-hidden className="pointer-events-none absolute -end-10 -top-10 size-44 rounded-full border border-rose/15 sm:size-64" />

      <div className={cn('container-x relative', image ? 'grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-12 lg:gap-16 lg:py-16' : 'py-12 sm:py-16 lg:py-20')}>
        <div className={cn(image && 'lg:col-span-6', centered && 'mx-auto max-w-3xl text-center')}>
          <Breadcrumbs items={[{ label: crumb }]} className={cn('mb-8', centered && 'flex justify-center')} />
          <p className="eyebrow mb-4 animate-fade-up">{eyebrow}</p>
          <h1 className="heading-page text-balance animate-fade-up [animation-delay:60ms]">{title}</h1>
          {lead && <p className={cn('body-lg mt-5 max-w-2xl animate-fade-up [animation-delay:120ms]', centered && 'mx-auto')}>{lead}</p>}
          {children && <div className="mt-8 animate-fade-up [animation-delay:180ms]">{children}</div>}
        </div>
        {image && (
          <div className="lg:col-span-6">
            <SmartImage src={image} alt={imageAlt} width={1200} height={900} priority wrapperClassName="aspect-[4/3] rounded-xs" />
          </div>
        )}
      </div>
    </header>
  )
}
