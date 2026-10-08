import { forwardRef, useState, type ComponentProps } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { Input } from '@/components/ui'
import { useT } from '@/i18n'
import { cn } from '@/utils'

type Props = Omit<ComponentProps<typeof Input>, 'type' | 'trailing'> & { withIcon?: boolean }

/** Password input with a show/hide toggle */
export const PasswordInput = forwardRef<HTMLInputElement, Props>(function PasswordInput({ withIcon = false, ...rest }, ref) {
  const { t } = useT()
  const [show, setShow] = useState(false)
  return (
    <Input
      ref={ref}
      type={show ? 'text' : 'password'}
      dir="ltr"
      leading={withIcon ? <Lock /> : undefined}
      trailing={
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? t('auth.hidePassword') : t('auth.showPassword')}
          aria-pressed={show}
          className="grid size-7 place-items-center rounded text-subtle transition-colors hover:bg-mist hover:text-ink"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      }
      {...rest}
      className={cn('text-start', rest.className)}
    />
  )
})

export type StrengthLevel = 0 | 1 | 2 | 3 | 4

/** 0 = empty, 1 = weak, 2 = fair, 3 = good, 4 = strong */
export function passwordStrength(pw: string): StrengthLevel {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (pw.length < 8) return 1
  return Math.min(4, Math.max(1, score - 1)) as StrengthLevel
}

const LEVEL_KEYS = ['', 'weak', 'fair', 'good', 'strong'] as const
const LEVEL_COLORS = ['bg-line', 'bg-error', 'bg-warning', 'bg-info', 'bg-success']

export function PasswordStrengthMeter({ password }: { password: string }) {
  const { t } = useT()
  const level = passwordStrength(password)
  const checks = [
    { ok: password.length >= 8, label: t('auth.rules.length') },
    { ok: /[a-z]/.test(password) && /[A-Z]/.test(password), label: t('auth.rules.case') },
    { ok: /\d/.test(password), label: t('auth.rules.number') },
    { ok: /[^A-Za-z0-9]/.test(password), label: t('auth.rules.symbol') },
  ]
  return (
    <div className="space-y-2" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="grid flex-1 grid-cols-4 gap-1" aria-hidden>
          {[1, 2, 3, 4].map((i) => (
            <span key={i} className={cn('h-1.5 rounded-full transition-colors', level >= i ? LEVEL_COLORS[level] : 'bg-line')} />
          ))}
        </div>
        <span className="w-16 text-end text-xs font-medium text-muted">{level ? t(`auth.strength.${LEVEL_KEYS[level]}`) : ''}</span>
      </div>
      <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {checks.map((c) => (
          <li key={c.label} className={cn('flex items-center gap-1.5 text-xs', c.ok ? 'text-success' : 'text-subtle')}>
            <span className={cn('size-1.5 shrink-0 rounded-full', c.ok ? 'bg-success' : 'bg-line')} aria-hidden />
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
