import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail, MailCheck } from 'lucide-react'
import { Button, ButtonLink, Input } from '@/components/ui'
import { useDocumentTitle } from '@/hooks'
import { useT } from '@/i18n'
import { requestPasswordReset } from '@/services/authService'
import { isValidEmail } from '@/utils'

export default function ForgotPasswordPage() {
  const { t } = useT()
  useDocumentTitle(t('auth.forgot.docTitle'))
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return setError(t('auth.errors.emailRequired'))
    if (!isValidEmail(email)) return setError(t('common.invalidEmail'))
    setError('')
    setLoading(true)
    try {
      const res = await requestPasswordReset(email.trim())
      setSentTo(res.email)
    } finally {
      setLoading(false)
    }
  }

  if (sentTo)
    return (
      <div className="animate-fade-up">
        <span className="grid size-12 place-items-center rounded-full bg-success-soft text-success">
          <MailCheck className="size-5" aria-hidden />
        </span>
        <h1 className="mt-5 font-serif text-[32px] leading-tight text-ink">{t('auth.forgot.sentTitle')}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted" role="status">
          {t('auth.forgot.sentBefore')}{' '}
          <span dir="ltr" className="font-medium text-ink">
            {sentTo}
          </span>
          {t('auth.forgot.sentAfter')}
        </p>
        <p className="mt-3 text-xs text-subtle">{t('auth.forgot.sentHint')}</p>
        <div className="mt-8 flex flex-col gap-2 sm:flex-row">
          <ButtonLink to="/login" size="lg" className="flex-1" icon={<ArrowLeft className="size-4 rtl:-scale-x-100" />}>
            {t('auth.forgot.back')}
          </ButtonLink>
          <Button variant="outline" size="lg" onClick={() => setSentTo(null)}>
            {t('auth.forgot.tryAnother')}
          </Button>
        </div>
      </div>
    )

  return (
    <div className="animate-fade-up">
      <p className="eyebrow">{t('auth.forgot.eyebrow')}</p>
      <h1 className="mt-2 font-serif text-[34px] leading-tight text-ink">{t('auth.forgot.title')}</h1>
      <p className="mt-1.5 text-sm text-muted">{t('auth.forgot.subtitle')}</p>
      <form onSubmit={submit} noValidate className="mt-6 space-y-4">
        <Input
          label={t('auth.email')}
          type="email"
          required
          autoComplete="email"
          autoFocus
          dir="ltr"
          className="text-start"
          leading={<Mail />}
          placeholder="name@beautystore.sa"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (error) setError('')
          }}
          error={error}
        />
        <Button type="submit" size="lg" fullWidth loading={loading}>
          {t('auth.forgot.submit')}
        </Button>
      </form>
      <Link to="/login" className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-ink">
        <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden />
        {t('auth.forgot.back')}
      </Link>
    </div>
  )
}
