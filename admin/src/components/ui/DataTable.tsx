import { useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Columns3, X } from 'lucide-react'
import { useT } from '@/i18n'
import { cn } from '@/utils'
import { Button, IconButton } from './Button'
import { EmptyState, ErrorState, Skeleton } from './Display'
import { Checkbox } from './Form'
import { Dropdown } from './Overlay'

export interface Column<T> {
  id: string
  header: ReactNode
  cell: (row: T) => ReactNode
  /** Sort key passed to onSort (omit to make the column unsortable) */
  sortKey?: string
  align?: 'start' | 'end' | 'center'
  className?: string
  headerClassName?: string
  /** Column can be hidden via the column picker (default true for non-primary columns) */
  hideable?: boolean
  defaultHidden?: boolean
  /** Role in the mobile card layout */
  mobile?: 'title' | 'subtitle' | 'meta' | 'end' | 'hidden'
  width?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[] | undefined
  rowKey: (row: T) => string
  loading?: boolean
  error?: unknown
  onRetry?: () => void
  /* pagination (server-style) */
  total?: number
  page?: number
  pageSize?: number
  onPageChange?: (p: number) => void
  onPageSizeChange?: (s: number) => void
  /* sorting */
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  onSort?: (key: string) => void
  /* selection */
  selectable?: boolean
  selected?: Set<string>
  onSelectedChange?: (s: Set<string>) => void
  bulkActions?: (ids: string[], clear: () => void) => ReactNode
  /* misc */
  onRowClick?: (row: T) => void
  toolbar?: ReactNode
  empty?: ReactNode
  className?: string
  /** Stable id to remember column visibility */
  tableId?: string
  dense?: boolean
  /** Show the mobile card layout below md (default true) */
  mobileCards?: boolean
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  error,
  onRetry,
  total,
  page = 1,
  pageSize = 20,
  onPageChange,
  onPageSizeChange,
  sortBy,
  sortDir,
  onSort,
  selectable,
  selected,
  onSelectedChange,
  bulkActions,
  onRowClick,
  toolbar,
  empty,
  className,
  tableId,
  dense,
  mobileCards = true,
}: DataTableProps<T>) {
  const { t } = useT()
  const storageKey = tableId ? `admin_table_${tableId}` : undefined
  const [hidden, setHidden] = useState<Set<string>>(() => {
    try {
      const raw = storageKey && localStorage.getItem(storageKey)
      if (raw) return new Set(JSON.parse(raw) as string[])
    } catch {
      /* ignore */
    }
    return new Set(columns.filter((c) => c.defaultHidden).map((c) => c.id))
  })
  const toggleHidden = (id: string) => {
    const next = new Set(hidden)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setHidden(next)
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify([...next]))
  }
  const visible = columns.filter((c) => !hidden.has(c.id))
  const sel = selected ?? new Set<string>()
  const pageIds = rows?.map(rowKey) ?? []
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => sel.has(id))
  const someOnPage = pageIds.some((id) => sel.has(id))
  const setSel = (s: Set<string>) => onSelectedChange?.(s)
  const togglePage = () => {
    const next = new Set(sel)
    if (allOnPage) pageIds.forEach((id) => next.delete(id))
    else pageIds.forEach((id) => next.add(id))
    setSel(next)
  }
  const toggleRow = (id: string) => {
    const next = new Set(sel)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSel(next)
  }
  const totalCount = total ?? rows?.length ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(totalCount, page * pageSize)
  const hideable = columns.filter((c) => c.hideable !== false && c.mobile !== 'title')
  const showSkeleton = loading && !rows?.length

  const align = (a?: Column<T>['align']) => (a === 'end' ? 'text-end' : a === 'center' ? 'text-center' : 'text-start')
  const pad = dense ? 'px-3 py-2' : 'px-4 py-3'

  return (
    <div className={cn('card min-w-0 overflow-hidden', className)}>
      {/* Toolbar */}
      {(toolbar || hideable.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 border-b border-line-soft px-3 py-3 sm:px-4">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{toolbar}</div>
          {hideable.length > 0 && (
            <Dropdown
              widthClass="w-56"
              trigger={({ toggle }) => (
                <Button variant="outline" size="sm" onClick={toggle} icon={<Columns3 className="size-4" />} className="max-md:hidden">
                  {t('common.columns')}
                </Button>
              )}
            >
              <div className="max-h-72 space-y-2 overflow-y-auto p-3">
                {hideable.map((c) => (
                  <Checkbox key={c.id} label={c.header} checked={!hidden.has(c.id)} onChange={() => toggleHidden(c.id)} />
                ))}
              </div>
            </Dropdown>
          )}
        </div>
      )}

      {/* Bulk action bar */}
      {selectable && sel.size > 0 && (
        <div className="flex animate-slide-down flex-wrap items-center gap-2 border-b border-line-soft bg-mist px-3 py-2 sm:px-4">
          <span className="text-[13px] font-medium text-ink">{t('common.selected', { count: sel.size })}</span>
          <div className="flex flex-wrap items-center gap-2">{bulkActions?.([...sel], () => setSel(new Set()))}</div>
          <IconButton label={t('common.clear')} size="sm" onClick={() => setSel(new Set())} className="ms-auto">
            <X />
          </IconButton>
        </div>
      )}

      {error ? (
        <ErrorState onRetry={onRetry} />
      ) : !showSkeleton && rows && rows.length === 0 ? (
        (empty ?? <EmptyState title={t('common.noResults')} description={t('common.noResultsDesc')} />)
      ) : (
        <>
          {/* Desktop table */}
          <div className={cn('thin-scrollbar relative overflow-x-auto', mobileCards && 'max-md:hidden')}>
            <table className="w-full min-w-[640px] border-collapse text-[13px]">
              <thead className="sticky top-0 z-10 bg-surface">
                <tr className="border-b border-line">
                  {selectable && (
                    <th scope="col" className="w-10 ps-4 pe-0">
                      <Checkbox aria-label={t('common.selectAll')} checked={allOnPage} indeterminate={!allOnPage && someOnPage} onChange={togglePage} />
                    </th>
                  )}
                  {visible.map((c) => {
                    const active = c.sortKey && sortBy === c.sortKey
                    return (
                      <th key={c.id} scope="col" style={{ width: c.width }} className={cn(pad, 'text-[11.5px] font-semibold tracking-wide whitespace-nowrap text-muted uppercase', align(c.align), c.headerClassName)} aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}>
                        {c.sortKey && onSort ? (
                          <button type="button" onClick={() => onSort(c.sortKey!)} className={cn('group inline-flex items-center gap-1 uppercase hover:text-ink', active && 'text-ink', c.align === 'end' && 'flex-row-reverse')}>
                            {c.header}
                            {active ? sortDir === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" /> : <ArrowUpDown className="size-3 opacity-0 transition-opacity group-hover:opacity-60" />}
                          </button>
                        ) : (
                          c.header
                        )}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody className={cn(loading && rows?.length && 'opacity-60 transition-opacity')}>
                {showSkeleton
                  ? Array.from({ length: Math.min(pageSize, 8) }, (_, i) => (
                      <tr key={i} className="border-b border-line-soft">
                        {selectable && <td className="ps-4" />}
                        {visible.map((c) => (
                          <td key={c.id} className={pad}>
                            <Skeleton className="h-4 w-full max-w-36" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : rows!.map((row) => {
                      const id = rowKey(row)
                      const isSel = sel.has(id)
                      return (
                        <tr
                          key={id}
                          onClick={onRowClick ? (e) => !(e.target as HTMLElement).closest('a,button,input,label,[data-no-row-click]') && onRowClick(row) : undefined}
                          onKeyDown={onRowClick ? (e) => e.key === 'Enter' && e.currentTarget === e.target && onRowClick(row) : undefined}
                          tabIndex={onRowClick ? 0 : undefined}
                          className={cn('border-b border-line-soft transition-colors last:border-0', onRowClick && 'cursor-pointer hover:bg-mist/70 focus-visible:bg-mist', isSel && 'bg-rose-soft/50')}
                        >
                          {selectable && (
                            <td className="w-10 ps-4 pe-0" data-no-row-click>
                              <Checkbox aria-label={t('common.selectRow')} checked={isSel} onChange={() => toggleRow(id)} />
                            </td>
                          )}
                          {visible.map((c) => (
                            <td key={c.id} className={cn(pad, 'align-middle text-ink', align(c.align), c.className)}>
                              {c.cell(row)}
                            </td>
                          ))}
                        </tr>
                      )
                    })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          {mobileCards && (
            <ul className="divide-y divide-line-soft md:hidden">
              {showSkeleton
                ? Array.from({ length: 5 }, (_, i) => (
                    <li key={i} className="space-y-2 p-4">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </li>
                  ))
                : rows!.map((row) => {
                    const id = rowKey(row)
                    const title = columns.find((c) => c.mobile === 'title') ?? columns[0]
                    const subtitle = columns.filter((c) => c.mobile === 'subtitle')
                    const end = columns.filter((c) => c.mobile === 'end')
                    const meta = columns.filter((c) => c.mobile === 'meta' || (!c.mobile && c !== title))
                    return (
                      <li key={id} className={cn('relative flex gap-3 p-4', sel.has(id) && 'bg-rose-soft/50')}>
                        {selectable && (
                          <div className="pt-0.5">
                            <Checkbox aria-label={t('common.selectRow')} checked={sel.has(id)} onChange={() => toggleRow(id)} />
                          </div>
                        )}
                        <div
                          className={cn('min-w-0 flex-1', onRowClick && 'cursor-pointer')}
                          onClick={onRowClick ? (e) => !(e.target as HTMLElement).closest('a,button,input,label,[data-no-row-click]') && onRowClick(row) : undefined}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-ink">{title.cell(row)}</div>
                              {subtitle.map((c) => (
                                <div key={c.id} className="mt-0.5 text-xs text-muted">
                                  {c.cell(row)}
                                </div>
                              ))}
                            </div>
                            {end.length > 0 && (
                              <div className="flex shrink-0 flex-col items-end gap-1 text-end text-[13px]">
                                {end.map((c) => (
                                  <div key={c.id}>{c.cell(row)}</div>
                                ))}
                              </div>
                            )}
                          </div>
                          {meta.length > 0 && (
                            <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                              {meta
                                .filter((c) => c.id !== 'actions')
                                .map((c) => (
                                  <div key={c.id} className="flex min-w-0 flex-col">
                                    <dt className="text-[10.5px] tracking-wide text-subtle uppercase">{c.header}</dt>
                                    <dd className="min-w-0 truncate text-ink">{c.cell(row)}</dd>
                                  </div>
                                ))}
                            </dl>
                          )}
                        </div>
                        {columns.find((c) => c.id === 'actions') && <div data-no-row-click>{columns.find((c) => c.id === 'actions')!.cell(row)}</div>}
                      </li>
                    )
                  })}
            </ul>
          )}

          {/* Pagination */}
          {onPageChange && totalCount > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft px-3 py-2.5 text-[13px] text-muted sm:px-4">
              <span className="tabular-nums">{t('common.showing', { from, to, total: totalCount })}</span>
              <div className="flex items-center gap-2">
                {onPageSizeChange && (
                  <label className="hidden items-center gap-2 sm:flex">
                    <span>{t('common.rowsPerPage')}</span>
                    <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))} className="h-8 rounded-md border border-line bg-surface px-2 text-[13px] text-ink">
                      {[10, 20, 50, 100].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <Pagination page={page} totalPages={totalPages} onChange={onPageChange} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  const { t } = useT()
  if (totalPages <= 1) return null
  const pages: (number | '…')[] = []
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) pages.push(p)
    else if (pages[pages.length - 1] !== '…') pages.push('…')
  }
  return (
    <nav aria-label="Pagination" className="flex items-center gap-1">
      <IconButton label={t('common.previous')} size="sm" variant="outline" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft className="rtl:-scale-x-100" />
      </IconButton>
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="px-1 text-subtle max-sm:hidden">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn('h-8 min-w-8 rounded-md px-2 text-[13px] tabular-nums transition-colors max-sm:hidden', p === page ? 'bg-ink text-white' : 'text-ink hover:bg-mist')}
          >
            {p}
          </button>
        ),
      )}
      <span className="px-1 text-xs tabular-nums sm:hidden">
        {page}/{totalPages}
      </span>
      <IconButton label={t('common.next')} size="sm" variant="outline" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        <ChevronRight className="rtl:-scale-x-100" />
      </IconButton>
    </nav>
  )
}

/** Skeleton table for full-page loading states */
export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="card overflow-hidden" role="status" aria-label="Loading table">
      <div className="border-b border-line-soft p-4">
        <Skeleton className="h-8 w-64" />
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex gap-4 border-b border-line-soft p-4 last:border-0">
          {Array.from({ length: cols }, (_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function EmptyTableState(props: Parameters<typeof EmptyState>[0]) {
  return <EmptyState {...props} />
}
