import { useRef, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { IconButton, ProductCardSkeleton, ProductGridSkeleton } from '@/components/common'
import { useT } from '@/i18n'
import type { Product } from '@/types'
import { cn } from '@/utils'
import { ProductCard } from './ProductCard'

interface ProductGridProps {
  products: Product[] | undefined
  loading?: boolean
  layout?: 'grid' | 'list'
  /** Columns at lg breakpoint */
  columns?: 3 | 4 | 5
  skeletonCount?: number
  empty?: ReactNode
  className?: string
}

export function ProductGrid({ products, loading, layout = 'grid', columns = 4, skeletonCount = 8, empty, className }: ProductGridProps) {
  if (loading && !products?.length) return <ProductGridSkeleton count={skeletonCount} className={className} />
  if (!products?.length) return <>{empty ?? null}</>
  if (layout === 'list') {
    return (
      <div className={cn('flex flex-col gap-6', loading && 'opacity-60 transition-opacity', className)}>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} layout="list" />
        ))}
      </div>
    )
  }
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3',
        columns === 4 && 'lg:grid-cols-4',
        columns === 5 && 'lg:grid-cols-4 xl:grid-cols-5',
        loading && 'opacity-60 transition-opacity',
        className,
      )}
    >
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 4} />
      ))}
    </div>
  )
}

/** Horizontal scroll-snap rail with arrow controls (desktop) and swipe (mobile) */
export function ProductRail({ products, loading, className, ranked }: { products: Product[] | undefined; loading?: boolean; className?: string; ranked?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const { t, isRTL } = useT()
  const scroll = (dir: 1 | -1) => {
    const el = ref.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.85 * (isRTL ? -1 : 1), behavior: 'smooth' })
  }
  return (
    <div className={cn('group/rail relative', className)}>
      <div ref={ref} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 sm:-mx-6 sm:gap-5 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:px-0">
        {loading || !products
          ? Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="w-[46%] shrink-0 sm:w-[31%] lg:w-[calc(25%-15px)]">
                <ProductCardSkeleton />
              </div>
            ))
          : products.map((p, i) => (
              <div key={p.id} className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[calc(25%-15px)]">
                <ProductCard product={p} rank={ranked ? i + 1 : undefined} />
              </div>
            ))}
      </div>
      <IconButton label={t('common.previous')} variant="solid" onClick={() => scroll(-1)} className="absolute start-0 top-[38%] hidden -translate-x-1/2 opacity-0 transition-opacity group-hover/rail:opacity-100 lg:inline-flex rtl:translate-x-1/2">
        <ChevronLeft className="size-5 rtl:-scale-x-100" />
      </IconButton>
      <IconButton label={t('common.next')} variant="solid" onClick={() => scroll(1)} className="absolute end-0 top-[38%] hidden translate-x-1/2 opacity-0 transition-opacity group-hover/rail:opacity-100 lg:inline-flex rtl:-translate-x-1/2">
        <ChevronRight className="size-5 rtl:-scale-x-100" />
      </IconButton>
    </div>
  )
}
