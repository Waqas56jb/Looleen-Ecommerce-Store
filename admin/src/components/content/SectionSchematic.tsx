import type { ReactNode } from 'react'
import { cn } from '@/utils'

/**
 * Tiny CSS wireframe representing a homepage section (used as row thumbnail
 * and in the stacked page preview). Pure decoration — aria-hidden.
 */
export function SectionSchematic({ sectionKey, className, compact }: { sectionKey: string; className?: string; compact?: boolean }) {
  const bar = 'rounded-[2px] bg-ink/15'
  const tile = 'rounded-[2px] bg-ink/10'
  const h = compact ? 'h-7' : 'h-10'
  let body: ReactNode
  switch (sectionKey) {
    case 'hero':
      body = (
        <div className="relative size-full overflow-hidden rounded-[2px] bg-gradient-to-r from-ink/70 to-ink/20 rtl:bg-gradient-to-l">
          <div className="absolute start-[8%] top-1/2 w-[40%] -translate-y-1/2 space-y-[3px]">
            <div className="h-[3px] w-1/2 rounded bg-white/70" />
            <div className="h-[4px] w-full rounded bg-white/90" />
            <div className="h-[3px] w-1/3 rounded-full bg-white" />
          </div>
        </div>
      )
      break
    case 'trust':
      body = (
        <div className="flex size-full items-center justify-around gap-1 rounded-[2px] bg-ink/5 px-1">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center gap-[2px]">
              <span className="size-[5px] rounded-full bg-ink/30" />
              <span className="h-[3px] w-3 rounded bg-ink/20" />
            </div>
          ))}
        </div>
      )
      break
    case 'categories':
    case 'concerns':
      body = (
        <div className={cn('grid size-full gap-[3px]', sectionKey === 'categories' ? 'grid-cols-6' : 'grid-cols-5')}>
          {Array.from({ length: sectionKey === 'categories' ? 6 : 5 }, (_, i) => (
            <div key={i} className={cn(tile, sectionKey === 'concerns' && 'rounded-full')} />
          ))}
        </div>
      )
      break
    case 'brands':
      body = (
        <div className="flex size-full items-center justify-around gap-1 px-1">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} className={cn(bar, 'h-[4px] w-3')} />
          ))}
        </div>
      )
      break
    case 'offers':
    case 'best_sellers':
      body = (
        <div className="grid size-full grid-cols-4 gap-[3px]">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex flex-col gap-[2px]">
              <div className={cn(tile, 'relative flex-1')}>{sectionKey === 'offers' && <span className="absolute start-[2px] top-[2px] h-[3px] w-[6px] rounded bg-rose/70" />}</div>
              <div className={cn(bar, 'h-[3px] w-3/4')} />
            </div>
          ))}
        </div>
      )
      break
    case 'new_arrivals':
      body = (
        <div className="grid size-full grid-cols-5 gap-[3px]">
          <div className="col-span-2 rounded-[2px] bg-champagne/40" />
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className={tile} />
          ))}
        </div>
      )
      break
    case 'trending':
    case 'professional':
      body = (
        <div className="flex size-full items-center gap-[4px] rounded-[2px] bg-ink/80 p-[4px]">
          <div className="w-2/5 space-y-[3px]">
            <div className="h-[3px] w-2/3 rounded bg-white/60" />
            <div className="h-[4px] w-full rounded bg-white/85" />
          </div>
          <div className={cn('h-full flex-1 rounded-[2px]', sectionKey === 'trending' ? 'bg-rose/50' : 'bg-champagne/50')} />
        </div>
      )
      break
    case 'editorial':
      body = (
        <div className="relative size-full overflow-hidden rounded-[2px] bg-gradient-to-br from-blush to-champagne/50">
          <div className="absolute inset-x-[25%] top-1/2 h-[4px] -translate-y-1/2 rounded bg-ink/40" />
        </div>
      )
      break
    case 'testimonials':
      body = (
        <div className="grid size-full grid-cols-3 gap-[3px]">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="space-y-[2px] rounded-[2px] border border-ink/10 p-[2px]">
              <div className={cn(bar, 'h-[2px] w-full')} />
              <div className={cn(bar, 'h-[2px] w-2/3')} />
              <span className="block size-[4px] rounded-full bg-champagne" />
            </div>
          ))}
        </div>
      )
      break
    case 'newsletter':
      body = (
        <div className="flex size-full flex-col items-center justify-center gap-[3px] rounded-[2px] bg-blush/70">
          <div className={cn(bar, 'h-[3px] w-1/3')} />
          <div className="flex w-1/2 gap-[2px]">
            <div className="h-[5px] flex-1 rounded-[1px] bg-white" />
            <div className="h-[5px] w-[10px] rounded-[1px] bg-ink/60" />
          </div>
        </div>
      )
      break
    case 'gallery':
      body = (
        <div className="grid size-full grid-cols-6 gap-[2px]">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className={cn('rounded-[2px]', i % 2 ? 'bg-rose/25' : 'bg-champagne/30')} />
          ))}
        </div>
      )
      break
    default:
      body = <div className={cn(tile, 'size-full')} />
  }
  return (
    <div aria-hidden className={cn('w-full rounded-[3px] border border-line bg-surface p-[3px]', h, className)}>
      {body}
    </div>
  )
}
