import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from 'react'
import { useT } from '@/i18n'
import { cn } from '@/utils'

interface OtpInputProps {
  value: string
  onChange: (v: string) => void
  length?: number
  error?: boolean
  disabled?: boolean
  autoFocus?: boolean
  describedBy?: string
}

/** Six single-digit boxes with auto-advance, backspace and paste support. Always LTR. */
export function OtpInput({ value, onChange, length = 6, error, disabled, autoFocus = true, describedBy }: OtpInputProps) {
  const { t } = useT()
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const digits = Array.from({ length }, (_, i) => value[i] ?? '')
  /** Latest value, updated synchronously — fast typing fires events before React re-renders */
  const latest = useRef(value)
  useEffect(() => {
    latest.current = value
  }, [value])
  const emit = (v: string) => {
    latest.current = v
    onChange(v)
  }

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus()
  }, [autoFocus])

  const focus = (i: number) => refs.current[Math.max(0, Math.min(length - 1, i))]?.focus()

  const setAt = (i: number, d: string) => {
    const next = Array.from({ length }, (_, k) => latest.current[k] ?? '')
    next[i] = d
    emit(next.join('').slice(0, length))
  }

  const handleChange = (i: number, raw: string) => {
    const clean = raw.replace(/\D/g, '')
    if (!clean) {
      setAt(i, '')
      return
    }
    if (clean.length > 1) {
      // Autofill / fast typing — spread across boxes
      const next = (latest.current.slice(0, i) + clean).slice(0, length)
      emit(next)
      focus(next.length)
      return
    }
    setAt(i, clean)
    if (i < length - 1) focus(i + 1)
  }

  const handleKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      e.preventDefault()
      setAt(i - 1, '')
      focus(i - 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      focus(i - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      focus(i + 1)
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    e.preventDefault()
    emit(pasted)
    focus(pasted.length)
  }

  return (
    <div dir="ltr" role="group" aria-label={t('auth.login.otpLabel')} aria-describedby={describedBy} className="flex justify-between gap-2 sm:gap-3">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => {
            // Keep the code contiguous — jump to the first empty box
            if (i > latest.current.length) focus(latest.current.length)
            else e.target.select()
          }}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={length}
          disabled={disabled}
          aria-label={t('auth.login.digit', { n: i + 1 })}
          aria-invalid={error || undefined}
          className={cn(
            'h-14 w-full min-w-0 rounded-xs border bg-white text-center font-serif text-2xl font-medium text-ink outline-none transition-all duration-200 focus:border-ink focus:ring-2 focus:ring-rose/15 disabled:opacity-60 sm:h-16',
            error ? 'border-error' : d ? 'border-ink/50' : 'border-line',
          )}
        />
      ))}
    </div>
  )
}
