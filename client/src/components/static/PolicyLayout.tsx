import { useEffect, useState } from 'react'
import { CalendarDays, ChevronDown, List } from 'lucide-react'
import { useDocumentMeta } from '@/hooks'
import type { PolicyCopy } from '@/i18n/pages/pages'
import { cn } from '@/utils'
import { useStaticCopy } from './copy'
import { HelpBand } from './HelpBand'
import { PageHero } from './PageHero'
import { PolicyBlockView } from './PolicyBlocks'

/** Tracks which section is currently being read */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0])
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    const visible = new Map<string, number>()
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => (e.isIntersecting ? visible.set(e.target.id, e.boundingClientRect.top) : visible.delete(e.target.id)))
        const first = ids.find((id) => visible.has(id))
        if (first) setActive(first)
      },
      { rootMargin: '-25% 0px -60% 0px', threshold: 0 },
    )
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [ids])
  return [active, setActive] as const
}

function TocList({ sections, active, onPick }: { sections: PolicyCopy['sections']; active: string; onPick: (id: string) => void }) {
  return (
    <ol className="space-y-0.5">
      {sections.map((s, i) => (
        <li key={s.id}>
          <a
            href={`#${s.id}`}
            onClick={(e) => {
              e.preventDefault()
              onPick(s.id)
            }}
            aria-current={active === s.id ? 'location' : undefined}
            className={cn(
              'flex min-h-11 items-center gap-3 border-s-2 py-2 ps-4 text-sm transition-colors duration-200',
              active === s.id ? 'border-rose font-medium text-ink' : 'border-line text-muted hover:border-ink/30 hover:text-ink',
            )}
          >
            <span className={cn('w-5 shrink-0 text-xs tabular-nums', active === s.id ? 'text-rose' : 'text-muted/70')}>{String(i + 1).padStart(2, '0')}</span>
            <span>{s.title}</span>
          </a>
        </li>
      ))}
    </ol>
  )
}

/**
 * Shared layout for Shipping / Returns / Privacy / Terms.
 * Desktop: sticky TOC on the inline-start side with active-section highlight.
 * Mobile: collapsible TOC above the content.
 */
export function PolicyLayout({ copy }: { copy: PolicyCopy }) {
  const { c, f } = useStaticCopy()
  useDocumentMeta(f(copy.metaTitle), f(copy.metaDescription))

  const [ids] = useState(() => copy.sections.map((s) => s.id))
  const [active, setActive] = useActiveSection(ids)
  const [tocOpen, setTocOpen] = useState(false)

  const pick = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    setActive(id)
    setTocOpen(false)
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    history.replaceState(null, '', `#${id}`)
    el.focus({ preventScroll: true })
  }

  const activeIndex = Math.max(0, copy.sections.findIndex((s) => s.id === active))

  return (
    <>
      <PageHero eyebrow={copy.eyebrow} title={copy.title} lead={f(copy.intro)} crumb={copy.title}>
        <p className="inline-flex items-center gap-2 rounded-full border border-line bg-white/70 px-4 py-2 text-xs font-medium text-muted">
          <CalendarDays className="size-3.5 text-rose" aria-hidden />
          {c.shared.lastUpdated}
        </p>
      </PageHero>

      <div className="container-x grid grid-cols-1 gap-10 py-10 sm:py-14 lg:grid-cols-12 lg:gap-16 lg:py-20">
        {/* TOC */}
        <aside className="lg:col-span-4 xl:col-span-3">
          {/* Mobile: collapsible */}
          <div className="sticky top-16 z-20 -mx-4 border-b border-line bg-ivory/95 px-4 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
            <button
              type="button"
              aria-expanded={tocOpen}
              aria-controls="policy-toc-mobile"
              onClick={() => setTocOpen((o) => !o)}
              className="flex min-h-13 w-full items-center gap-3 py-3 text-start"
            >
              <List className="size-4 shrink-0 text-rose" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-semibold tracking-[0.18em] text-muted uppercase">{c.shared.onThisPage}</span>
                <span className="block truncate text-sm font-medium text-ink">
                  {String(activeIndex + 1).padStart(2, '0')} · {copy.sections[activeIndex]?.title}
                </span>
              </span>
              <ChevronDown className={cn('size-4 shrink-0 text-muted transition-transform duration-300', tocOpen && 'rotate-180')} aria-hidden />
            </button>
            <nav
              id="policy-toc-mobile"
              aria-label={c.shared.contents}
              className={cn('grid transition-[grid-template-rows] duration-300 ease-out', tocOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}
            >
              <div className="overflow-hidden">
                <div className="max-h-[60vh] overflow-y-auto pb-4">
                  <TocList sections={copy.sections} active={active} onPick={pick} />
                </div>
              </div>
            </nav>
          </div>

          {/* Desktop: sticky */}
          <nav aria-label={c.shared.contents} className="sticky top-32 hidden lg:block">
            <p className="eyebrow mb-5">{c.shared.onThisPage}</p>
            <TocList sections={copy.sections} active={active} onPick={pick} />
          </nav>
        </aside>

        {/* Content */}
        <article className="min-w-0 lg:col-span-8 xl:col-span-8">
          <div className="space-y-14 sm:space-y-16">
            {copy.sections.map((s, i) => (
              <section key={s.id} id={s.id} tabIndex={-1} aria-labelledby={`${s.id}-title`} className="scroll-mt-36 outline-none lg:scroll-mt-32">
                <div className="mb-6 flex items-baseline gap-4 border-b border-line pb-4">
                  <span className="font-serif text-lg text-rose tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                  <h2 id={`${s.id}-title`} className="heading-card text-balance sm:text-[28px]">
                    {s.title}
                  </h2>
                </div>
                <div className="space-y-5">
                  {s.blocks.map((b, j) => (
                    <PolicyBlockView key={j} block={b} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>
      </div>

      <HelpBand title={c.shared.questionsTitle} text={f(c.shared.questionsText)} />
    </>
  )
}
