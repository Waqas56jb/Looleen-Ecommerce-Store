import { Link } from 'react-router-dom'
import { ArrowRight, Info, ShieldCheck, Sparkles } from 'lucide-react'
import type { PolicyBlock } from '@/i18n/pages/pages'
import { cn } from '@/utils'
import { useStaticCopy } from './copy'

const NOTE_TONE = {
  rose: { box: 'border-rose/25 bg-rose-soft/60', icon: 'bg-rose text-white', Icon: ShieldCheck },
  champagne: { box: 'border-champagne/40 bg-champagne-soft/50', icon: 'bg-champagne text-white', Icon: Sparkles },
  ink: { box: 'border-ink bg-ink text-ivory', icon: 'bg-ivory text-ink', Icon: Info },
} as const

/** Renders one structured policy block (paragraph, list, table, cards…) */
export function PolicyBlockView({ block }: { block: PolicyBlock }) {
  const { f } = useStaticCopy()

  switch (block.type) {
    case 'p':
      return <p className="text-[15px] leading-[1.8] text-ink-soft sm:text-base">{f(block.text)}</p>

    case 'list':
      return (
        <ul className="space-y-3">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-ink-soft sm:text-base">
              <span aria-hidden className="mt-[0.6em] size-1.5 shrink-0 rotate-45 bg-rose" />
              <span>{f(item)}</span>
            </li>
          ))}
        </ul>
      )

    case 'steps':
      return (
        <ol className="grid grid-cols-1 gap-px overflow-hidden rounded-xs border border-line bg-line sm:grid-cols-2">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-4 bg-white p-5">
              <span className="font-serif text-3xl leading-none text-rose">{String(i + 1).padStart(2, '0')}</span>
              <span className="text-[15px] leading-relaxed text-ink-soft">{f(item)}</span>
            </li>
          ))}
        </ol>
      )

    case 'note': {
      const tone = NOTE_TONE[block.tone ?? 'champagne']
      return (
        <aside className={cn('flex gap-4 rounded-xs border p-5 sm:p-6', tone.box)}>
          <span className={cn('grid size-10 shrink-0 place-items-center rounded-full', tone.icon)}>
            <tone.Icon className="size-4.5" strokeWidth={1.8} aria-hidden />
          </span>
          <div>
            <p className={cn('font-semibold', block.tone === 'ink' ? 'text-ivory' : 'text-ink')}>{f(block.title)}</p>
            <p className={cn('mt-1 text-[15px] leading-relaxed', block.tone === 'ink' ? 'text-ivory/75' : 'text-ink-soft')}>{f(block.text)}</p>
          </div>
        </aside>
      )
    }

    case 'cards':
      return (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {block.items.map((card, i) => (
            <li key={i} className={cn('rounded-xs border p-5', i === 0 ? 'border-ink bg-ink text-ivory' : 'border-line bg-white')}>
              <p className={cn('eyebrow', i === 0 && 'text-champagne')}>{f(card.title)}</p>
              <p className={cn('mt-3 font-serif text-3xl leading-none font-medium', i === 0 ? 'text-ivory' : 'text-ink')} dir="auto">
                {f(card.value)}
              </p>
              <p className={cn('mt-3 text-[13px] leading-relaxed', i === 0 ? 'text-ivory/70' : 'text-muted')}>{f(card.text)}</p>
            </li>
          ))}
        </ul>
      )

    case 'table':
      return (
        <div className="overflow-hidden rounded-xs border border-line bg-white">
          <div className="no-scrollbar overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-start text-sm">
              {block.caption && <caption className="border-b border-line bg-mist px-5 py-3 text-start text-xs font-semibold tracking-wide text-muted uppercase">{f(block.caption)}</caption>}
              <thead>
                <tr className="border-b border-line">
                  {block.head.map((h, i) => (
                    <th key={i} scope="col" className="px-5 py-3 text-start text-[13px] font-semibold text-ink">
                      {f(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, r) => (
                  <tr key={r} className="border-b border-line last:border-0 even:bg-ivory/60">
                    {row.map((cell, i) =>
                      i === 0 ? (
                        <th key={i} scope="row" className="px-5 py-3.5 text-start font-medium text-ink">
                          {f(cell)}
                        </th>
                      ) : (
                        <td key={i} className="px-5 py-3.5 text-ink-soft">
                          {f(cell)}
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )

    case 'link':
      return (
        <div className="flex flex-col gap-3 rounded-xs border border-line bg-blush/50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[15px] text-ink">{f(block.text)}</p>
          <Link to={block.to} className="group inline-flex items-center gap-2 text-sm font-semibold text-rose hover:text-rose-dark">
            <span className="link-underline">{f(block.label)}</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" aria-hidden />
          </Link>
        </div>
      )
  }
}
