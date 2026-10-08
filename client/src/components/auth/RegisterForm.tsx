import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button, Input } from '@/components/common'
import { useT } from '@/i18n'
import { AuthError, register } from '@/services/authService'
import type { User } from '@/types'
import { cn, isValidEmail, isValidSaudiPhone } from '@/utils'
import { FormError, fullSaudiPhone, isStrongPassword, PasswordField, PasswordStrength, PhoneField } from './Fields'

type Field = 'name' | 'email' | 'phone' | 'password' | 'confirm' | 'terms'

export function RegisterForm({ onSuccess }: { onSuccess: (user: User) => void }) {
  const { t } = useT()
  const [v, setV] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [terms, setTerms] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const set = (k: keyof typeof v, val: string) => {
    setV((s) => ({ ...s, [k]: val }))
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (v.name.trim().length < 2) next.name = t('common.required')
    if (!isValidEmail(v.email)) next.email = t('common.invalidEmail')
    if (!isValidSaudiPhone(fullSaudiPhone(v.phone))) next.phone = t('common.invalidPhone')
    if (!isStrongPassword(v.password)) next.password = t('auth.register.weak')
    if (!v.confirm) next.confirm = t('common.required')
    else if (v.confirm !== v.password) next.confirm = t('auth.register.mismatch')
    if (!terms) next.terms = t('auth.register.termsError')
    setErrors(next)
    setFormError(null)
    if (Object.keys(next).length) {
      const first = (['name', 'email', 'phone', 'password', 'confirm', 'terms'] as Field[]).find((f) => next[f])
      document.getElementById(`reg-${first}`)?.focus()
      return
    }
    setLoading(true)
    try {
      const user = await register({ name: v.name, email: v.email, phone: fullSaudiPhone(v.phone), password: v.password })
      onSuccess(user)
    } catch (err) {
      if (err instanceof AuthError && err.code === 'email_taken') {
        setErrors({ email: t('auth.register.emailTaken') })
      } else setFormError(t('common.somethingWrong'))
      setLoading(false)
    }
  }

  const [termsPre, rest = ''] = t('auth.register.terms').split('{terms}')
  const [termsMid, termsPost] = rest.split('{privacy}')

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Input id="reg-name" label={t('auth.register.name')} autoComplete="name" value={v.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
      <Input
        id="reg-email"
        label={t('auth.register.email')}
        type="email"
        autoComplete="email"
        dir="ltr"
        className="rtl:text-end"
        value={v.email}
        onChange={(e) => set('email', e.target.value)}
        error={errors.email}
      />
      <PhoneField id="reg-phone" label={t('auth.register.phone')} value={v.phone} onChange={(val) => set('phone', val)} error={errors.phone} />
      <PasswordField id="reg-password" label={t('auth.register.password')} autoComplete="new-password" value={v.password} onChange={(e) => set('password', e.target.value)} error={errors.password} />
      <PasswordStrength password={v.password} />
      <PasswordField id="reg-confirm" label={t('auth.register.confirm')} autoComplete="new-password" value={v.confirm} onChange={(e) => set('confirm', e.target.value)} error={errors.confirm} />

      <div>
        <label htmlFor="reg-terms" className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink">
          <input
            id="reg-terms"
            type="checkbox"
            checked={terms}
            onChange={(e) => {
              setTerms(e.target.checked)
              if (e.target.checked) setErrors((x) => ({ ...x, terms: undefined }))
            }}
            aria-invalid={!!errors.terms || undefined}
            aria-describedby={errors.terms ? 'reg-terms-error' : undefined}
            className={cn('mt-0.5 size-[18px] shrink-0 accent-ink', errors.terms && 'outline outline-error')}
          />
          <span>
            {termsPre}
            <Link to="/terms" target="_blank" className="font-medium underline underline-offset-4 hover:text-rose">
              {t('auth.register.termsLink')}
            </Link>
            {termsMid}
            <Link to="/privacy" target="_blank" className="font-medium underline underline-offset-4 hover:text-rose">
              {t('auth.register.privacyLink')}
            </Link>
            {termsPost}
          </span>
        </label>
        {errors.terms && (
          <p id="reg-terms-error" role="alert" className="mt-2 text-xs text-error">
            {errors.terms}
          </p>
        )}
      </div>

      <FormError message={formError} />

      <Button type="submit" variant="dark" size="lg" fullWidth loading={loading}>
        {t('auth.register.submit')}
      </Button>
    </form>
  )
}
