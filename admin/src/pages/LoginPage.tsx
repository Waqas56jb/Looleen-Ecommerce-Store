import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircle, ArrowRight, KeyRound, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Button, Checkbox, Input } from '@/components/ui'
import { useDocumentTitle } from '@/hooks'
import { useT } from '@/i18n'
import { AuthError, DEMO_CREDENTIALS, login } from '@/services/authService'
import { isValidEmail } from '@/utils'

/** Only allow internal, same-origin redirect paths */
function safeRedirect(r: string | null) {
  if (!r || !r.startsWith('/') || r.startsWith('//') || r.startsWith('/\\') || r.startsWith('/login')) return '/dashboard'
  return r
}

export default function LoginPage() {
  const { t } = useT()
  useDocumentTitle(t('auth.login.docTitle'))
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e: typeof errors = {}
    if (!email.trim()) e.email = t('auth.errors.emailRequired')
    else if (!isValidEmail(email)) e.email = t('common.invalidEmail')
    if (!password) e.password = t('auth.errors.passwordRequired')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (ev: FormEvent) => {
    ev.preventDefault()
    setAuthError('')
    if (!validate()) return
    setLoading(true)
    try {
      const admin = await login(email, password, remember)
      toast.success(t('auth.login.welcomeToast', { name: admin.name.split(' ')[0] }))
      navigate(safeRedirect(params.get('redirect')), { replace: true })
    } catch (err) {
      setAuthError(err instanceof AuthError ? t('auth.errors.invalidCredentials') : t('auth.errors.generic'))
      setLoading(false)
    }
  }

  const fillDemo = () => {
    setEmail(DEMO_CREDENTIALS.email)
    setPassword(DEMO_CREDENTIALS.password)
    setErrors({})
    setAuthError('')
  }

  return (
    <div className="animate-fade-up">
      <p className="eyebrow">{t('auth.login.eyebrow')}</p>
      <h1 className="mt-2 font-serif text-[34px] leading-tight text-ink">{t('auth.login.title')}</h1>
      <p className="mt-1.5 text-sm text-muted">{t('auth.login.subtitle')}</p>

      {authError && (
        <div role="alert" className="mt-6 flex items-start gap-2.5 rounded-md border border-error/20 bg-error-soft px-3.5 py-3 text-[13px] text-error animate-fade-in">
          <AlertCircle className="mt-px size-4 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">{t('auth.errors.invalidTitle')}</p>
            <p className="mt-0.5 text-error/85">{authError}</p>
          </div>
        </div>
      )}

      <form onSubmit={submit} noValidate className="mt-6 space-y-4">
        <Input
          label={t('auth.email')}
          type="email"
          autoComplete="username"
          required
          dir="ltr"
          className="text-start"
          leading={<Mail />}
          placeholder="name@beautystore.sa"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (errors.email) setErrors((x) => ({ ...x, email: undefined }))
          }}
          error={errors.email}
          autoFocus
        />
        <PasswordInput
          label={t('auth.password')}
          autoComplete="current-password"
          required
          withIcon
          placeholder="••••••••"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            if (errors.password) setErrors((x) => ({ ...x, password: undefined }))
          }}
          error={errors.password}
          aside={
            <Link to="/forgot-password" className="font-medium text-rose hover:underline">
              {t('auth.login.forgot')}
            </Link>
          }
        />
        <Checkbox label={t('auth.login.remember')} description={t('auth.login.rememberHint')} checked={remember} onChange={(e) => setRemember(e.target.checked)} />
        <Button type="submit" size="lg" fullWidth loading={loading}>
          {loading ? t('auth.login.signingIn') : t('auth.login.submit')}
          {!loading && <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden />}
        </Button>
      </form>

      <div className="mt-8 rounded-md border border-dashed border-line bg-mist/60 p-3.5">
        <div className="flex items-start gap-2.5">
          <KeyRound className="mt-0.5 size-4 shrink-0 text-champagne" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-ink">{t('auth.login.demoTitle')}</p>
            <dl className="mt-1.5 space-y-0.5 text-xs text-muted">
              <div className="flex gap-2">
                <dt className="w-16 shrink-0">{t('auth.email')}</dt>
                <dd dir="ltr" className="truncate font-mono text-ink">
                  {DEMO_CREDENTIALS.email}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-16 shrink-0">{t('auth.password')}</dt>
                <dd dir="ltr" className="font-mono text-ink">
                  {DEMO_CREDENTIALS.password}
                </dd>
              </div>
            </dl>
            <Button variant="outline" size="xs" className="mt-2.5" onClick={fillDemo}>
              {t('auth.login.fillDemo')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
