import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ChevronsDownUp, ChevronsUpDown, FolderTree, Layers, Package, Plus, SearchX, ToggleRight } from 'lucide-react'
import { CategoryTree } from '@/components/categories/CategoryTree'
import { Button, ButtonLink, ConfirmDialog, EmptyState, ErrorState, PageHeader, SearchInput, Skeleton, StatCard } from '@/components/ui'
import { useAsync, useDocumentTitle } from '@/hooks'
import { useT } from '@/i18n'
import { deleteCategory, getCategoryTree, reorderCategories, updateCategory, type CategoryNode } from '@/services/catalogService'
import { formatNumber } from '@/utils'

/** Replace the children list of `parentId` (null = root) with the new order */
function applyOrder(nodes: CategoryNode[], parentId: string | null, ids: string[]): CategoryNode[] {
  const sortList = (list: CategoryNode[]) => ids.map((id) => list.find((n) => n.id === id)!).filter(Boolean)
  if (parentId === null) return sortList(nodes)
  return nodes.map((n) => (n.id === parentId ? { ...n, children: sortList(n.children) } : { ...n, children: applyOrder(n.children, parentId, ids) }))
}

function patchNode(nodes: CategoryNode[], id: string, patch: Partial<CategoryNode>): CategoryNode[] {
  return nodes.map((n) => (n.id === id ? { ...n, ...patch } : { ...n, children: patchNode(n.children, id, patch) }))
}

export default function CategoriesPage() {
  const { t, l } = useT()
  useDocumentTitle(t('catalog.categories.title'))
  const { data, loading, error, reload } = useAsync(() => getCategoryTree(), [])
  const [tree, setTree] = useState<CategoryNode[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [initialized, setInitialized] = useState(false)
  const [query, setQuery] = useState('')
  const [toDelete, setToDelete] = useState<CategoryNode | null>(null)

  useEffect(() => {
    if (!data) return
    setTree(data)
    if (!initialized) {
      setExpanded(new Set(data.map((n) => n.id)))
      setInitialized(true)
    }
  }, [data, initialized])

  const stats = useMemo(() => {
    const subs = tree.flatMap((n) => n.children)
    const all = [...tree, ...subs]
    return {
      main: tree.length,
      sub: subs.length,
      active: all.filter((c) => c.status === 'active').length,
      inactive: all.filter((c) => c.status !== 'active').length,
      categorized: tree.reduce((s, n) => s + n.productCount, 0),
    }
  }, [tree])

  /** null = no search; otherwise ids to keep (matches + their ancestors) */
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return null
    const keep = new Set<string>()
    const match = (n: CategoryNode) => [n.name.en, n.name.ar, n.slug].some((s) => s.toLowerCase().includes(q))
    const walk = (list: CategoryNode[], ancestors: string[]): void =>
      list.forEach((n) => {
        if (match(n)) [...ancestors, n.id].forEach((id) => keep.add(id))
        walk(n.children, [...ancestors, n.id])
      })
    walk(tree, [])
    return keep
  }, [tree, query])

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const onMove = async (parentId: string | null, ids: string[]) => {
    const prev = tree
    setTree(applyOrder(tree, parentId, ids))
    try {
      await reorderCategories(parentId, ids)
      toast.success(t('catalog.categories.reordered'))
    } catch {
      setTree(prev)
      toast.error(t('catalog.categories.reorderFailed'))
    }
  }

  const onToggleStatus = async (node: CategoryNode, active: boolean) => {
    const status = active ? 'active' : 'inactive'
    setTree((cur) => patchNode(cur, node.id, { status }))
    try {
      await updateCategory(node.id, { status })
      toast.success(t(active ? 'catalog.categories.enabledToast' : 'catalog.categories.disabledToast', { name: l(node.name) }))
    } catch {
      setTree((cur) => patchNode(cur, node.id, { status: node.status }))
      toast.error(t('common.errorDesc'))
    }
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    const ok = await deleteCategory(toDelete.id)
    if (!ok) {
      toast.error(t('catalog.categories.deleteBlocked', { count: formatNumber(toDelete.productCount) }))
      return
    }
    toast.success(t('catalog.categories.deleted', { name: l(toDelete.name) }))
    reload()
  }

  const allExpanded = tree.filter((n) => n.children.length).every((n) => expanded.has(n.id))
  const noMatches = visible && visible.size === 0

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('catalog.categories.title')}
        description={t('catalog.categories.description')}
        breadcrumbs={[{ label: t('nav.categories') }]}
        actions={
          <ButtonLink to="/categories/new" icon={<Plus className="size-4" />}>
            {t('catalog.categories.add')}
          </ButtonLink>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t('catalog.categories.statMain')} value={formatNumber(stats.main)} icon={<FolderTree />} loading={loading && !data} />
        <StatCard label={t('catalog.categories.statSub')} value={formatNumber(stats.sub)} icon={<Layers />} loading={loading && !data} />
        <StatCard
          label={t('catalog.categories.statActive')}
          value={formatNumber(stats.active)}
          icon={<ToggleRight />}
          tone="success"
          loading={loading && !data}
          period={stats.inactive > 0 ? t('catalog.categories.statActiveMeta', { count: stats.inactive }) : undefined}
        />
        <StatCard label={t('catalog.categories.statCategorized')} value={formatNumber(stats.categorized)} icon={<Package />} loading={loading && !data} />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={query} onChange={setQuery} placeholder={t('catalog.categories.searchPlaceholder')} className="w-full sm:max-w-sm" />
        <div className="flex items-center gap-2">
          <p className="hidden text-xs text-subtle xl:block">{query ? t('catalog.categories.reorderDisabled') : t('catalog.categories.keyboardHint')}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded(allExpanded ? new Set() : new Set(tree.map((n) => n.id)))}
            icon={allExpanded ? <ChevronsDownUp className="size-4" /> : <ChevronsUpDown className="size-4" />}
            disabled={!!query}
          >
            {allExpanded ? t('catalog.categories.collapseAll') : t('catalog.categories.expandAll')}
          </Button>
        </div>
      </div>

      <div className="mt-4">
        {error ? (
          <div className="card">
            <ErrorState onRetry={reload} />
          </div>
        ) : !data ? (
          <div className="card space-y-1 p-3" role="status" aria-label={t('common.loading')}>
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : tree.length === 0 ? (
          <div className="card">
            <EmptyState icon={<FolderTree />} title={t('catalog.categories.emptyTitle')} description={t('catalog.categories.emptyDesc')} action={{ label: t('catalog.categories.add'), to: '/categories/new' }} />
          </div>
        ) : noMatches ? (
          <div className="card">
            <EmptyState icon={<SearchX />} title={t('catalog.categories.noMatchesTitle', { q: query })} description={t('catalog.categories.noMatchesDesc')} action={{ label: t('common.clear'), onClick: () => setQuery('') }} />
          </div>
        ) : (
          <CategoryTree nodes={tree} expanded={expanded} onToggleExpand={toggleExpand} query={query} visible={visible} onToggleStatus={onToggleStatus} onMove={onMove} onDelete={setToDelete} />
        )}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title={toDelete ? t('catalog.categories.deleteTitle', { name: l(toDelete.name) }) : ''}
        description={t('catalog.categories.deleteDesc')}
        confirmLabel={t('common.delete')}
      >
        {toDelete && toDelete.children.length > 0 && <p className="rounded-md bg-warning-soft px-3 py-2 text-[13px] text-warning">{t('catalog.categories.deleteWithChildren', { count: toDelete.children.length })}</p>}
      </ConfirmDialog>
    </div>
  )
}
