import { useEffect, useMemo, useState, type DragEvent } from 'react'
import { AlertTriangle, CheckCircle2, ExternalLink, LayoutTemplate, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Button, buttonClass, Card, ErrorState, PageHeader, Skeleton } from '@/components/ui'
import { HomepageSectionRow } from '@/components/content/HomepageSectionRow'
import { SectionSchematic } from '@/components/content/SectionSchematic'
import { STORE_CONFIG } from '@/config/store'
import { useAsync, useDocumentTitle } from '@/hooks'
import { useT } from '@/i18n'
import { getHomepageSections, saveHomepageSections } from '@/services/marketingService'
import type { HomepageSection } from '@/types'
import { cn } from '@/utils'

const snapshot = (s: HomepageSection[]) => JSON.stringify(s.map(({ id, title, titleAr, enabled }) => [id, title, titleAr, enabled]))

export default function HomepageContentPage() {
  const { t, lang } = useT()
  const H = (k: string, v?: Record<string, string | number>) => t(`marketing.homepage.${k}`, v)
  useDocumentTitle(H('title'))
  const remote = useAsync(() => getHomepageSections(), [])
  const [saved, setSaved] = useState<HomepageSection[] | null>(null)
  const [sections, setSections] = useState<HomepageSection[]>([])
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [titleError, setTitleError] = useState(false)

  useEffect(() => {
    if (remote.data) {
      setSaved(remote.data)
      setSections(remote.data)
    }
  }, [remote.data])

  const dirty = useMemo(() => !!saved && snapshot(saved) !== snapshot(sections), [saved, sections])

  // Warn before leaving with unsaved edits
  useEffect(() => {
    if (!dirty) return
    const on = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', on)
    return () => window.removeEventListener('beforeunload', on)
  }, [dirty])

  const patch = (id: string, p: Partial<HomepageSection>) => setSections((list) => list.map((s) => (s.id === id ? { ...s, ...p } : s)))

  const moveTo = (from: number, to: number) =>
    setSections((list) => {
      if (to < 0 || to >= list.length || from === to) return list
      const next = [...list]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })

  const onDragStart = (id: string) => (e: DragEvent) => {
    setDragId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
    const row = (e.currentTarget as HTMLElement).closest('li')
    if (row) e.dataTransfer.setDragImage(row, 24, 24)
  }
  const onDragOver = (id: string) => (e: DragEvent) => {
    if (!dragId) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (overId !== id) setOverId(id)
  }
  const onDrop = (id: string) => (e: DragEvent) => {
    e.preventDefault()
    if (dragId && dragId !== id) {
      const from = sections.findIndex((s) => s.id === dragId)
      const to = sections.findIndex((s) => s.id === id)
      moveTo(from, to)
    }
    setDragId(null)
    setOverId(null)
  }
  const onDragEnd = () => {
    setDragId(null)
    setOverId(null)
  }

  const save = async () => {
    if (sections.some((s) => !s.title.trim() || !s.titleAr.trim())) {
      setTitleError(true)
      toast.error(H('titleRequired'))
      return
    }
    setTitleError(false)
    setSaving(true)
    try {
      const result = await saveHomepageSections(sections.map((s) => ({ ...s, title: s.title.trim(), titleAr: s.titleAr.trim() })))
      setSaved(result)
      setSections(result)
      toast.success(H('savedToast'))
    } catch {
      toast.error(t('marketing.shared.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const reset = () => {
    if (!saved) return
    setSections(saved)
    setTitleError(false)
    toast(H('resetToast'))
  }

  const enabled = sections.filter((s) => s.enabled)

  return (
    <>
      <PageHeader
        title={H('title')}
        description={H('description')}
        breadcrumbs={[{ label: t('nav.content') }, { label: t('nav.homepage') }]}
        meta={
          saved ? (
            dirty ? (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning">
                <span className="size-1.5 rounded-full bg-current" aria-hidden />
                {H('unsaved')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                <CheckCircle2 className="size-3.5 text-success" aria-hidden />
                {H('allSaved')}
              </span>
            )
          ) : undefined
        }
        actions={
          <>
            <a href={`${STORE_CONFIG.storefrontUrl}/`} target="_blank" rel="noreferrer" className={buttonClass('outline')}>
              <ExternalLink className="size-4 rtl:-scale-x-100" aria-hidden />
              {H('openStorefront')}
            </a>
            <Button variant="outline" icon={<RotateCcw className="size-4" />} onClick={reset} disabled={!dirty || saving}>
              {H('reset')}
            </Button>
            <Button onClick={save} loading={saving} disabled={!dirty}>
              {H('save')}
            </Button>
          </>
        }
      />

      {remote.error ? (
        <Card>
          <ErrorState onRetry={remote.reload} />
        </Card>
      ) : !saved ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="card space-y-3 p-4 lg:col-span-2">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="card min-w-0 overflow-hidden lg:col-span-2" aria-labelledby="hs-list-title">
            <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft px-4 py-3">
              <div>
                <h2 id="hs-list-title" className="text-[15px] font-semibold text-ink">
                  {H('sectionsList')}
                </h2>
                <p className="text-xs text-muted">{H('dragTip')}</p>
              </div>
              <span className="rounded bg-mist px-2 py-0.5 text-xs text-muted tabular-nums">{H('visibleCount', { count: enabled.length, total: sections.length })}</span>
            </header>
            <ol>
              {sections.map((s, i) => (
                <HomepageSectionRow
                  key={s.id}
                  section={s}
                  index={i}
                  total={sections.length}
                  dragging={dragId === s.id}
                  dropTarget={overId === s.id && dragId !== s.id}
                  titleError={titleError}
                  onChange={(p) => patch(s.id, p)}
                  onMove={(d) => moveTo(i, i + d)}
                  onDragStart={onDragStart(s.id)}
                  onDragOver={onDragOver(s.id)}
                  onDrop={onDrop(s.id)}
                  onDragEnd={onDragEnd}
                />
              ))}
            </ol>
          </section>

          <aside className="min-w-0">
            <Card className="lg:sticky lg:top-20" title={H('pagePreview')} description={H('pagePreviewDesc')} actions={<LayoutTemplate className="size-4 text-subtle" aria-hidden />}>
              {enabled.length === 0 ? (
                <p className="flex items-start gap-2 rounded-md bg-warning-soft p-3 text-xs text-warning">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  {H('noneEnabled')}
                </p>
              ) : (
                <div className="thin-scrollbar max-h-[70vh] overflow-y-auto rounded-md border border-line bg-mist p-2">
                  {/* Faux browser chrome */}
                  <div className="mb-2 flex items-center gap-1 px-1" aria-hidden>
                    <span className="size-1.5 rounded-full bg-ink/20" />
                    <span className="size-1.5 rounded-full bg-ink/20" />
                    <span className="size-1.5 rounded-full bg-ink/20" />
                    <span className="ms-2 h-2.5 flex-1 rounded bg-surface" />
                  </div>
                  <div className="mb-1.5 flex h-5 items-center justify-between rounded-[3px] bg-surface px-2" aria-hidden>
                    <span className="font-serif text-[9px] font-bold tracking-widest text-ink">LOOKS</span>
                    <span className="flex gap-1">
                      <span className="h-[3px] w-4 rounded bg-ink/15" />
                      <span className="h-[3px] w-4 rounded bg-ink/15" />
                      <span className="h-[3px] w-4 rounded bg-ink/15" />
                    </span>
                  </div>
                  <ol className="space-y-1.5">
                    {enabled.map((s, i) => (
                      <li key={s.id} className={cn('rounded-[4px] bg-surface p-1.5 transition-colors', overId === s.id && 'ring-1 ring-rose/50')}>
                        <p className="mb-1 flex items-center gap-1.5 text-[10.5px] font-medium text-ink">
                          <span className="text-subtle tabular-nums">{i + 1}</span>
                          <span className="truncate">{lang === 'ar' ? s.titleAr || s.title : s.title}</span>
                        </p>
                        <SectionSchematic sectionKey={s.key} compact={!['hero', 'trending', 'professional', 'editorial'].includes(s.key)} className={s.key === 'hero' ? 'h-14' : undefined} />
                      </li>
                    ))}
                  </ol>
                  <div className="mt-1.5 h-6 rounded-[3px] bg-ink/80" aria-hidden />
                </div>
              )}
            </Card>
          </aside>
        </div>
      )}
    </>
  )
}
