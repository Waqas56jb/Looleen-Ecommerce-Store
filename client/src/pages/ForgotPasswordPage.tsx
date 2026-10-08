import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, MailCheck } from 'lucide-react'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { FormError } from '@/components/auth/Fields'
import { Button, Input } from '@/components/common'
import { useDocumentMeta } from '@/hooks'
import { useT } from '@/i18n'
import { requestPasswordReset } from '@/services/authService'
import { isValidEmail } from '@/utils'

export default function ForgotPasswordPage() {
  const { t } = useT()
  useDocumentMeta(t('auth.forgot.metaTitle'), t('auth.forgot.metaDesc'))
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!isValidEmail(email)) {
      setError(t('common.invalidEmail'))
      return
    }
    setLoading(true)
    setFormError(null)
    try {
      const res = await requestPasswordReset(email.trim())
      setSentTo(res.email)
    } catch {
      setFormError(t('common.somethingWrong'))
    } finally {
      setLoading(false)
    }
  }

  const back = (
    <Link to="/login" className="inline-flex min-h-11 items-center gap-2 font-medium text-ink hover:text-rose">
      <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden />
      {t('auth.forgot.backToLogin')}
    </Link>
  )

  if (sentTo) {
    const [pre, post] = t('auth.forgot.sentBody').split('{email}')
    return (
      <AuthLayout eyebrow={t('auth.forgot.eyebrow')} title={t('auth.forgot.sentTitle')} footer={back}>
        <div className="animate-fade-in space-y-6" role="status">
          <span className="grid size-16 place-items-center rounded-full bg-success/10 text-success">
            <MailCheck className="size-7" strokeWidth={1.6} aria-hidden />
          </span>
          <p className="text-[15px] leading-relaxed text-muted">
            {pre}
            <span dir="ltr" className="font-medium text-ink">
              {sentTo}
            </span>
            {post}
          </p>
          <Button
            variant="outline"
            size="lg"
            fullWidth
            onClick={() => {
              setSentTo(null)
              setEmail('')
            }}
          >
            {t('auth.forgot.tryAnother')}
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout eyebrow={t('auth.forgot.eyebrow')} title={t('auth.forgot.title')} subtitle={t('auth.forgot.subtitle')} footer={back}>
      <form onSubmit={submit} noValidate className="space-y-5">
        <Input
          label={t('auth.forgot.email')}
          type="email"
          autoComplete="email"
          dir="ltr"
          className="rtl:text-end"
          autoFocus
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (error) setError(undefined)
          }}
          error={error}
        />
        <FormError message={formError} />
        <Button type="submit" variant="dark" size="lg" fullWidth loading={loading}>
          {t('auth.forgot.submit')}
        </Button>
      </form>
    </AuthLayout>
  )
}
