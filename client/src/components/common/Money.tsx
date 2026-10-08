import { useT } from '@/i18n'
import { cn, formatNumber } from '@/utils'

/**
 * Official Saudi Riyal sign (SAMA, Feb 2025 — Unicode U+20C1).
 * Rendered as inline SVG because most system fonts don't ship the glyph yet.
 * Path data from the MIT-licensed `riyal` package (riyal.js.org).
 */
export function RiyalSign({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1124.14 1256.39" aria-hidden="true" focusable="false" fill="currentColor" className={cn('inline-block h-[0.82em] w-auto shrink-0', className)}>
      <path d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z" />
      <path d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z" />
    </svg>
  )
}

/**
 * Money amount with the Riyal sign, e.g. "⃁ 1,240.50".
 * The sign sits to the left of the number in both languages (SAMA guideline),
 * so the pair is always laid out LTR. Screen readers hear "1,240.50 SAR" / "1,240.50 ريال".
 */
export function Money({ value, className, signClassName }: { value: number; className?: string; signClassName?: string }) {
  const { lang } = useT()
  const n = formatNumber(value)
  return (
    <span className={cn('inline-flex items-baseline gap-[0.22em] whitespace-nowrap tabular-nums', className)} dir="ltr">
      <RiyalSign className={cn('translate-y-[0.06em]', signClassName)} />
      <span aria-hidden="true">{n}</span>
      <span className="sr-only">{lang === 'ar' ? `${n} ريال` : `${n} SAR`}</span>
    </span>
  )
}
