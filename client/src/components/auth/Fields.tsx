import { forwardRef, useId, useState, type InputHTMLAttributes } from 'react'
import { Check, Eye, EyeOff } from 'lucide-react'
import { FieldWrap, Input } from '@/components/common'
import { useT } from '@/i18n'
import { cn } from '@/utils'

interface PhoneFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label: string
  value: string
  onChange: (local: string) => void
  error?: string
}

/** Saudi mobile input: fixed +966 prefix, user types the 9 local digits (5X XXX XXXX). */
export const PhoneField = forwardRef<HTMLInputElement, PhoneFieldProps>(function PhoneField({ label, value, onChange, error, id, ...rest }, ref) {
  const auto = useId()
  const fid = id ?? auto
  const format = (raw: string) => {
    let d = raw.replace(/\D/g, '')
    if (d.startsWith('966')) d = d.slice(3)
    if (d.startsWith('0')) d = d.slice(1)
    d = d.slice(0, 9)
    return [d.slice(0, 2), d.slice(2, 5), d.slice(5)].filter(Boolean).join(' ')
  }
  return (
    <FieldWrap id={fid} label={label} error={error}>
      <div
        dir="ltr"
        className={cn(
          'flex h-12 items-stretch overflow-hidden rounded-xs border bg-white/80 transition-colors focus-within:border-ink focus-within:bg-white focus-within:ring-2 focus-within:ring-rose/15',
          error ? 'border-error' : 'border-line',
        )}
      >
        <span className="flex items-center border-e border-line bg-mist px-3.5 text-[15px] font-medium text-ink select-none" aria-hidden>
          +966
        </span>
        <input
          ref={ref}
          id={fid}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="5X XXX XXXX"
          value={value}
          onChange={(e) => onChange(format(e.target.value))}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${fid}-error` : undefined}
          className="min-w-0 flex-1 bg-transparent px-4 text-[15px] tracking-wide text-ink outline-none placeholder:text-muted/70"
          {...rest}
        />
      </div>
    </FieldWrap>
  )
})

/** "+966 5X XXX XXXX" from the local digits typed in PhoneField */
export const fullSaudiPhone = (local: string) => `+966${local.replace(/\D/g, '')}`

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  error?: string
  hint?: string
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(function PasswordField({ label, error, hint, ...rest }, ref) {
  const { t } = useT()
  const [show, setShow] = useState(false)
  return (
    <Input
      ref={ref}
      label={label}
      type={show ? 'text' : 'password'}
      error={error}
      hint={hint}
      trailing={
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? t('auth.login.hidePassword') : t('auth.login.showPassword')}
          aria-pressed={show}
          className="grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-blush hover:text-ink"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      }
      {...rest}
    />
  )
})

/* ---------- Password strength ---------- */

export const passwordRules = (pw: string) => ({ length: pw.length >= 8, number: /\d/.test(pw), letter: /[a-zA-Z؀-ۿ]/.test(pw) })
export const isStrongPassword = (pw: string) => Object.values(passwordRules(pw)).every(Boolean)

export function PasswordStrength({ password }: { password: string }) {
  const { t } = useT()
  const rules = passwordRules(password)
  const score = Object.values(rules).filter(Boolean).length
  const label = score <= 1 ? t('auth.register.weakLabel') : score === 2 ? t('auth.register.fairLabel') : t('auth.register.strongLabel')
  const color = score <= 1 ? 'bg-error' : score === 2 ? 'bg-warning' : 'bg-success'
  if (!password) return null
  return (
    <div className="animate-fade-in -mt-1 space-y-2" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1" role="meter" aria-label={t('auth.register.strength')} aria-valuemin={0} aria-valuemax={3} aria-valuenow={score} aria-valuetext={label}>
          {[0, 1, 2].map((i) => (
            <span key={i} className={cn('h-1 flex-1 rounded-full transition-colors duration-300', i < score ? color : 'bg-line')} />
          ))}
        </div>
        <span className="w-14 text-end text-xs font-medium text-ink">{label}</span>
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {(
          [
            ['length', 'ruleLength'],
            ['number', 'ruleNumber'],
            ['letter', 'ruleLetter'],
          ] as const
        ).map(([k, key]) => (
          <li key={k} className={cn('flex items-center gap-1', rules[k] ? 'text-success' : 'text-muted')}>
            <Check className={cn('size-3', !rules[k] && 'opacity-30')} aria-hidden />
            {t(`auth.register.${key}`)}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Inline form-level error */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="animate-fade-in rounded-xs bg-error/10 px-4 py-3 text-sm text-error">
      {message}
    </p>
  )
}
