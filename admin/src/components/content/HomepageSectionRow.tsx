import type { DragEvent } from 'react'
import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react'
import { fieldClass, IconButton, Switch } from '@/components/ui'
import { useT } from '@/i18n'
import type { HomepageSection } from '@/types'
import { cn } from '@/utils'
import { SectionSchematic } from './SectionSchematic'

interface Props {
  section: HomepageSection
  index: number
  total: number
  dragging: boolean
  dropTarget: boolean
  onChange: (patch: Partial<HomepageSection>) => void
  onMove: (dir: -1 | 1) => void
  onDragStart: (e: DragEvent) => void
  onDragOver: (e: DragEvent) => void
  onDragEnd: () => void
  onDrop: (e: DragEvent) => void
  titleError?: boolean
}

export function HomepageSectionRow({ section, index, total, dragging, dropTarget, onChange, onMove, onDragStart, onDragOver, onDragEnd, onDrop, titleError }: Props) {
  const { t, lang } = useT()
  const H = (k: string, v?: Record<string, string | number>) => t(`marketing.homepage.${k}`, v)
  const label = lang === 'ar' ? section.titleAr || section.title : section.title
  return (
    <li
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        'relative flex flex-col gap-3 border-b border-line-soft p-3 transition-colors last:border-0 sm:flex-row sm:items-center sm:p-4',
        dragging && 'bg-mist opacity-60',
        dropTarget && 'bg-rose-soft/40',
        !section.enabled && 'bg-mist/50',
      )}
    >
      <div className="flex items-center gap-2 sm:contents">
        <button
          type="button"
          draggable
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          aria-label={H('dragHandle', { name: label })}
          title={H('dragHandle', { name: label })}
          className="grid h-9 w-6 shrink-0 cursor-grab place-items-center rounded text-subtle hover:bg-mist hover:text-ink active:cursor-grabbing max-sm:hidden"
        >
          <GripVertical className="size-4" />
        </button>
        <span className={cn('grid size-7 shrink-0 place-items-center rounded-md text-xs font-semibold tabular-nums', section.enabled ? 'bg-ink text-white' : 'bg-line text-muted')}>{index + 1}</span>
        <div className="w-24 shrink-0 sm:w-28">
          <SectionSchematic sectionKey={section.key} className={cn(!section.enabled && 'opacity-50')} />
        </div>
        <div className="ms-auto flex items-center gap-1 sm:hidden">
          <IconButton label={H('moveUp', { name: label })} size="sm" variant="outline" disabled={index === 0} onClick={() => onMove(-1)}>
            <ArrowUp />
          </IconButton>
          <IconButton label={H('moveDown', { name: label })} size="sm" variant="outline" disabled={index === total - 1} onClick={() => onMove(1)}>
            <ArrowDown />
          </IconButton>
          <Switch checked={section.enabled} onChange={(v) => onChange({ enabled: v })} />
        </div>
      </div>

      <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 md:grid-cols-2">
        <div className="min-w-0">
          <label className="sr-only" htmlFor={`hs-${section.id}-en`}>
            {H('titleEn')}
          </label>
          <input
            id={`hs-${section.id}-en`}
            value={section.title}
            onChange={(e) => onChange({ title: e.target.value })}
            dir="ltr"
            aria-invalid={(titleError && !section.title.trim()) || undefined}
            placeholder={H('titleEn')}
            className={cn(fieldClass, 'h-9 font-medium')}
          />
        </div>
        <div className="min-w-0">
          <label className="sr-only" htmlFor={`hs-${section.id}-ar`}>
            {H('titleAr')}
          </label>
          <input
            id={`hs-${section.id}-ar`}
            value={section.titleAr}
            onChange={(e) => onChange({ titleAr: e.target.value })}
            dir="rtl"
            lang="ar"
            aria-invalid={(titleError && !section.titleAr.trim()) || undefined}
            placeholder={H('titleAr')}
            className={cn(fieldClass, 'h-9')}
          />
        </div>
        <p className="truncate text-xs text-muted md:col-span-2">
          <span className="font-mono text-[11px] text-subtle" dir="ltr">
            {section.key}
          </span>
          {' · '}
          {section.note}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1 max-sm:hidden">
        <IconButton label={H('moveUp', { name: label })} size="sm" disabled={index === 0} onClick={() => onMove(-1)}>
          <ArrowUp />
        </IconButton>
        <IconButton label={H('moveDown', { name: label })} size="sm" disabled={index === total - 1} onClick={() => onMove(1)}>
          <ArrowDown />
        </IconButton>
        <div className="ms-2 flex w-20 items-center justify-end gap-2">
          <span className={cn('text-xs', section.enabled ? 'text-success' : 'text-subtle')}>{section.enabled ? H('visible') : H('hidden')}</span>
          <Switch checked={section.enabled} onChange={(v) => onChange({ enabled: v })} size="sm" />
        </div>
      </div>
    </li>
  )
}
