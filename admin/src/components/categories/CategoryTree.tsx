import { useState, type DragEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowUp, ChevronRight, FolderPlus, GripVertical, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Dropdown, IconButton, Switch, Thumb } from '@/components/ui'
import { useT } from '@/i18n'
import type { CategoryNode } from '@/services/catalogService'
import { cn, formatNumber } from '@/utils'
import { Highlight } from './formKit'

interface TreeProps {
  nodes: CategoryNode[]
  expanded: Set<string>
  onToggleExpand: (id: string) => void
  query: string
  /** Ids of nodes that match the search (or have matching descendants) */
  visible: Set<string> | null
  onToggleStatus: (node: CategoryNode, active: boolean) => void
  onMove: (parentId: string | null, orderedIds: string[]) => void
  onDelete: (node: CategoryNode) => void
}

/** Grid template shared by the header and every row (desktop) */
const GRID = 'md:grid md:grid-cols-[minmax(0,1fr)_170px_90px_70px_150px] md:items-center md:gap-4'

export function CategoryTree({ nodes, expanded, onToggleExpand, query, visible, onToggleStatus, onMove, onDelete }: TreeProps) {
  const { t } = useT()
  const [drag, setDrag] = useState<{ id: string; parentId: string | null } | null>(null)
  const [over, setOver] = useState<{ id: string; after: boolean } | null>(null)
  const reorderable = !query.trim()

  const reorder = (siblings: CategoryNode[], fromId: string, toId: string, after: boolean) => {
    const ids = siblings.map((s) => s.id).filter((id) => id !== fromId)
    let idx = ids.indexOf(toId)
    if (idx < 0) return
    if (after) idx += 1
    ids.splice(idx, 0, fromId)
    if (ids.join() !== siblings.map((s) => s.id).join()) onMove(siblings[0].parentId, ids)
  }

  const renderLevel = (list: CategoryNode[], depth: number) => (
    <ul role={depth === 0 ? 'tree' : 'group'} aria-label={depth === 0 ? t('catalog.categories.title') : undefined} className={cn(depth > 0 && 'bg-mist/40')}>
      {list
        .filter((n) => !visible || visible.has(n.id))
        .map((node) => {
          const hasChildren = node.children.length > 0
          const isOpen = expanded.has(node.id) || (!!visible && hasChildren)
          const isDragging = drag?.id === node.id
          const isOver = over?.id === node.id && drag && drag.id !== node.id
          const canDropHere = drag && drag.parentId === node.parentId
          const siblingIds = list.map((s) => s.id)
          const pos = siblingIds.indexOf(node.id)
          const move = (dir: -1 | 1) => {
            const ids = [...siblingIds]
            const j = pos + dir
            if (j < 0 || j >= ids.length) return
            ;[ids[pos], ids[j]] = [ids[j], ids[pos]]
            onMove(node.parentId, ids)
          }
          const onDragOver = (e: DragEvent) => {
            if (!canDropHere) return
            e.preventDefault()
            e.dataTransfer.dropEffect = 'move'
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
            const after = e.clientY > rect.top + rect.height / 2
            if (over?.id !== node.id || over.after !== after) setOver({ id: node.id, after })
          }
          const onDrop = (e: DragEvent) => {
            if (!canDropHere || !drag) return
            e.preventDefault()
            reorder(list, drag.id, node.id, over?.after ?? false)
            setDrag(null)
            setOver(null)
          }
          return (
            <li key={node.id} role="treeitem" aria-expanded={hasChildren ? isOpen : undefined} aria-level={depth + 1} className="border-b border-line-soft last:border-b-0">
              <div
                draggable={reorderable}
                onDragStart={(e) => {
                  e.stopPropagation()
                  e.dataTransfer.effectAllowed = 'move'
                  e.dataTransfer.setData('text/plain', node.id)
                  setDrag({ id: node.id, parentId: node.parentId })
                }}
                onDragEnd={() => {
                  setDrag(null)
                  setOver(null)
                }}
                onDragOver={onDragOver}
                onDrop={onDrop}
                className={cn(
                  'group relative flex items-center gap-2 px-3 py-2.5 transition-colors sm:px-4',
                  GRID,
                  'hover:bg-mist/70',
                  isDragging && 'opacity-40',
                  node.status === 'inactive' && 'bg-mist/30',
                )}
              >
                {isOver && <span aria-hidden className={cn('pointer-events-none absolute inset-x-3 h-0.5 rounded-full bg-rose', over?.after ? '-bottom-px' : '-top-px')} />}
                {/* Category cell */}
                <div className="flex min-w-0 flex-1 items-center gap-2" style={{ paddingInlineStart: depth * 28 }}>
                  <span
                    className={cn('hidden shrink-0 text-subtle md:inline-flex', reorderable ? 'cursor-grab active:cursor-grabbing hover:text-ink' : 'cursor-not-allowed opacity-40')}
                    title={reorderable ? t('catalog.categories.dragHandle') : t('catalog.categories.reorderDisabled')}
                    aria-hidden
                  >
                    <GripVertical className="size-4" />
                  </span>
                  {hasChildren ? (
                    <IconButton size="xs" label={t(isOpen ? 'catalog.categories.collapse' : 'catalog.categories.expand', { name: node.name.en })} onClick={() => onToggleExpand(node.id)} aria-expanded={isOpen}>
                      <ChevronRight className={cn('transition-transform duration-200 rtl:-scale-x-100', isOpen && 'rotate-90 rtl:-rotate-90')} />
                    </IconButton>
                  ) : (
                    <span className="size-7 shrink-0" aria-hidden />
                  )}
                  <Thumb src={node.image} alt={node.name.en} size={depth === 0 ? 'sm' : 'xs'} />
                  <div className="min-w-0">
                    <p className={cn('truncate text-ink', depth === 0 ? 'text-sm font-semibold' : 'text-[13px] font-medium')}>
                      <LocalName node={node} query={query} />
                    </p>
                    <p className="truncate text-xs text-muted">
                      <OtherName node={node} query={query} />
                      {hasChildren && <span className="text-subtle"> · {t('catalog.categories.subCount', { count: node.children.length })}</span>}
                    </p>
                    <p className="truncate text-[11.5px] text-subtle md:hidden" dir="ltr">
                      /{node.slug} · {t('catalog.categories.productsCount', { count: formatNumber(node.productCount) })}
                    </p>
                  </div>
                </div>
                {/* Slug */}
                <code className="hidden truncate text-xs text-muted md:block" dir="ltr">
                  /<Highlight text={node.slug} query={query} />
                </code>
                {/* Products */}
                <span className="hidden text-end text-[13px] text-ink tabular-nums md:block">{formatNumber(node.productCount)}</span>
                {/* Status */}
                <span className="shrink-0" data-no-drag>
                  <Switch checked={node.status === 'active'} onChange={(v) => onToggleStatus(node, v)} size="sm" id={`cat-status-${node.id}`} />
                  <label htmlFor={`cat-status-${node.id}`} className="sr-only">
                    {t('catalog.categories.toggleLabel', { name: node.name.en })}
                  </label>
                </span>
                {/* Actions */}
                <div className="flex shrink-0 items-center justify-end gap-0.5">
                  <span className="hidden items-center gap-0.5 sm:inline-flex">
                    <IconButton size="xs" label={t('catalog.categories.moveUp')} onClick={() => move(-1)} disabled={!reorderable || pos === 0}>
                      <ArrowUp />
                    </IconButton>
                    <IconButton size="xs" label={t('catalog.categories.moveDown')} onClick={() => move(1)} disabled={!reorderable || pos === siblingIds.length - 1}>
                      <ArrowDown />
                    </IconButton>
                  </span>
                  <RowMenu node={node} canUp={reorderable && pos > 0} canDown={reorderable && pos < siblingIds.length - 1} onMove={move} onDelete={onDelete} />
                </div>
              </div>
              {hasChildren && isOpen && renderLevel(node.children, depth + 1)}
            </li>
          )
        })}
    </ul>
  )

  return (
    <div className="card overflow-hidden">
      <div className={cn('hidden border-b border-line bg-surface px-4 py-2.5 text-[11.5px] font-semibold tracking-wide text-muted uppercase', GRID)}>
        <span className="ps-6">{t('catalog.categories.colCategory')}</span>
        <span>{t('catalog.categories.colSlug')}</span>
        <span className="text-end">{t('catalog.categories.colProducts')}</span>
        <span>{t('catalog.categories.colStatus')}</span>
        <span className="text-end">{t('common.actions')}</span>
      </div>
      {renderLevel(nodes, 0)}
    </div>
  )
}

function LocalName({ node, query }: { node: CategoryNode; query: string }) {
  const { lang } = useT()
  return <Highlight text={lang === 'ar' ? node.name.ar : node.name.en} query={query} />
}

function OtherName({ node, query }: { node: CategoryNode; query: string }) {
  const { lang } = useT()
  const other = lang === 'ar' ? node.name.en : node.name.ar
  return (
    <span dir={lang === 'ar' ? 'ltr' : 'rtl'} className="inline-block">
      <Highlight text={other} query={query} />
    </span>
  )
}

function RowMenu({ node, canUp, canDown, onMove, onDelete }: { node: CategoryNode; canUp: boolean; canDown: boolean; onMove: (d: -1 | 1) => void; onDelete: (n: CategoryNode) => void }) {
  const { t, l } = useT()
  const navigate = useNavigate()
  return (
    <Dropdown
      widthClass="w-52"
      trigger={({ toggle, open }) => (
        <IconButton size="sm" label={`${t('common.actions')} — ${l(node.name)}`} onClick={toggle} aria-haspopup="menu" aria-expanded={open}>
          <MoreHorizontal />
        </IconButton>
      )}
      items={[
        { label: t('common.edit'), icon: <Pencil />, onClick: () => navigate(`/categories/${node.id}/edit`) },
        ...(node.parentId === null ? [{ label: t('catalog.categories.addSub'), icon: <FolderPlus />, onClick: () => navigate(`/categories/new?parent=${node.id}`) }] : []),
        { label: t('catalog.categories.moveUp'), icon: <ArrowUp />, onClick: () => onMove(-1), disabled: !canUp },
        { label: t('catalog.categories.moveDown'), icon: <ArrowDown />, onClick: () => onMove(1), disabled: !canDown },
        { label: '', divider: true },
        { label: t('common.delete'), icon: <Trash2 />, danger: true, onClick: () => onDelete(node) },
      ]}
    />
  )
}
