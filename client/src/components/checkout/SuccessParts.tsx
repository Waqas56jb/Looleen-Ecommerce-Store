import { useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { useT } from '@/i18n'
import { cn } from '@/utils'

/** Circle + check mark that draws itself on mount */
export function AnimatedCheck({ className }: { className?: string }) {
  const [drawn, setDrawn] = useState(false)
  useEffect(() => {
    // Wait for the first paint so the stroke transition actually runs
    const id = setTimeout(() => setDrawn(true), 80)
    return () => clearTimeout(id)
  }, [])
  return (
    <span className={cn('animate-scale-in relative grid size-20 place-items-center rounded-full bg-success/10 sm:size-24', className)} aria-hidden>
      <svg viewBox="0 0 52 52" className="size-full text-success">
        <circle
          cx="26"
          cy="26"
          r="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="151"
          strokeDashoffset={drawn ? 0 : 151}
          style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.22,1,0.36,1)' }}
        />
        <path
          d="M15 27l7 7 15-16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="36"
          strokeDashoffset={drawn ? 0 : 36}
          style={{ transition: 'stroke-dashoffset 450ms cubic-bezier(0.22,1,0.36,1) 550ms' }}
        />
      </svg>
    </span>
  )
}

/** Order number with a copy-to-clipboard button */
export function OrderNumber({ number }: { number: string }) {
  const { t } = useT()
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(number)
      setCopied(true)
      toast.success(t('common.copied'), { description: number })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable — the number stays selectable */
    }
  }
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-line bg-white py-1 ps-5 pe-1">
      <span className="me-1 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">{t('checkout.success.orderNumber')}</span>
      <span dir="ltr" className="font-semibold tracking-wide text-ink tabular-nums select-all">
        {number}
      </span>
      <button
        type="button"
        onClick={copy}
        aria-label={t('checkout.success.copyNumber')}
        title={t('checkout.success.copyNumber')}
        className="ms-1 grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-blush hover:text-ink"
      >
        {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
      </button>
    </div>
  )
}
