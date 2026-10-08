import type { ComponentProps } from 'react'
import { Input, RiyalSign } from '@/components/ui'

type Props = Omit<ComponentProps<typeof Input>, 'type' | 'value' | 'onChange'> & {
  value: number
  onChange: (v: number) => void
  /** Shows the official Riyal sign as the leading adornment */
  money?: boolean
  suffix?: string
}

/** Numeric input that keeps a number in state (empty → 0 on blur-free typing as NaN guard) */
export function NumberInput({ value, onChange, money, suffix, min = 0, step, ...rest }: Props) {
  return (
    <Input
      type="number"
      inputMode="decimal"
      dir="ltr"
      min={min}
      step={step ?? (money ? '0.01' : '1')}
      value={Number.isFinite(value) ? value : ''}
      onChange={(e) => onChange(e.target.value === '' ? NaN : Number(e.target.value))}
      leading={money ? <RiyalSign className="h-[0.9em]" /> : undefined}
      trailing={suffix ? <span className="text-xs text-muted">{suffix}</span> : undefined}
      className="text-start tabular-nums"
      {...rest}
    />
  )
}

/** Validation helper: required finite number ≥ 0 */
export function invalidAmount(n: number) {
  return !Number.isFinite(n) || n < 0
}
