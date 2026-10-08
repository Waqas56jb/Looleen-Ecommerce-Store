import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import { Button, Input } from '@/components/common'
import { useT } from '@/i18n'
import { AuthError, loginWithEmail } from '@/services/authService'
import type { User } from '@/types'
import { isValidEmail } from '@/utils'
import { FormError, PasswordField } from './Fields'

/** Mock-mode demo account (see authService) */
const DEMO_EMAIL = 'noura@example.com'

export function EmailLoginForm({ onSuccess }: { onSuccess: (user: User) => void }) {
  const { t } = useT()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!isValidEmail(email)) next.email = t('common.invalidEmail')
    if (!password) next.password = t('common.required')
    else if (password.length < 6) next.password = t('auth.login.passwordShort')
    setErrors(next)
    setFormError(null)
    if (Object.keys(next).length) return
    setLoading(true)
    try {
      const user = await loginWithEmail(email, password)
      onSuccess(user)
    } catch (err) {
      setFormError(err instanceof AuthError && err.code === 'invalid_credentials' ? t('auth.login.invalidCredentials') : t('common.somethingWrong'))
      setLoading(false)
    }
  }

  const [demoPre, demoPost] = t('auth.login.demoEmail').split('{email}')

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Input
        label={t('auth.login.email')}
        type="email"
        autoComplete="email"
        dir="ltr"
        className="rtl:text-end"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value)
          if (errors.email) setErrors((x) => ({ ...x, email: undefined }))
        }}
        error={errors.email}
      />
      <div>
        <PasswordField
          label={t('auth.login.password')}
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            if (errors.password) setErrors((x) => ({ ...x, password: undefined }))
          }}
          error={errors.password}
        />
        <div className="mt-2 text-end">
          <Link to="/forgot-password" className="text-[13px] font-medium text-ink underline-offset-4 hover:text-rose hover:underline">
            {t('auth.login.forgot')}
          </Link>
        </div>
      </div>

      <p className="flex items-start gap-2 rounded-xs bg-champagne-soft/50 px-3.5 py-2.5 text-xs leading-relaxed text-ink">
        <KeyRound className="mt-0.5 size-3.5 shrink-0 text-champagne" aria-hidden />
        <span>
          {demoPre}
          <button type="button" onClick={() => setEmail(DEMO_EMAIL)} dir="ltr" className="font-semibold underline underline-offset-2 hover:text-rose">
            {DEMO_EMAIL}
          </button>
          {demoPost}
        </span>
      </p>

      <FormError message={formError} />

      <Button type="submit" variant="dark" size="lg" fullWidth loading={loading}>
        {t('auth.login.submit')}
      </Button>
    </form>
  )
}
