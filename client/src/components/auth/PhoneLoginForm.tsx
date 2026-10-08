import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/common'
import { STORE_CONFIG } from '@/config/store'
import { useT } from '@/i18n'
import { AuthError, loginWithPhone, verifyOtp } from '@/services/authService'
import type { User } from '@/types'
import { isValidSaudiPhone } from '@/utils'
import { FormError, fullSaudiPhone, PhoneField } from './Fields'
import { OtpInput } from './OtpInput'

const RESEND_SECONDS = 60

/** Phone → OTP sign-in. All auth logic lives in authService. */
export function PhoneLoginForm({ onSuccess }: { onSuccess: (user: User) => void }) {
  const { t } = useT()
  const [phone, setPhone] = useState('')
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (seconds <= 0) return
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [seconds])

  const send = async (e?: FormEvent) => {
    e?.preventDefault()
    const full = fullSaudiPhone(phone)
    if (!isValidSaudiPhone(full)) {
      setError(t('common.invalidPhone'))
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await loginWithPhone(full)
      setSentTo(res.phone)
      setSeconds(res.expiresIn || RESEND_SECONDS)
      setOtp('')
    } catch {
      setError(t('common.somethingWrong'))
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    if (!sentTo || seconds > 0) return
    setError(null)
    try {
      const res = await loginWithPhone(sentTo)
      setSeconds(res.expiresIn || RESEND_SECONDS)
      setOtp('')
      toast(t('auth.login.resent'))
    } catch {
      setError(t('common.somethingWrong'))
    }
  }

  const verify = async (code = otp) => {
    if (!sentTo) return
    if (code.length < 6) {
      setError(t('auth.login.incompleteOtp'))
      return
    }
    setLoading(true)
    setError(null)
    try {
      const user = await verifyOtp(sentTo, code)
      onSuccess(user)
    } catch (err) {
      setError(err instanceof AuthError && err.code === 'invalid_otp' ? t('auth.login.invalidOtp') : t('common.somethingWrong'))
      setOtp('')
      setLoading(false)
    }
  }

  if (!sentTo) {
    return (
      <form onSubmit={send} noValidate className="space-y-5">
        <PhoneField
          label={t('auth.login.phone')}
          value={phone}
          onChange={(v) => {
            setPhone(v)
            if (error) setError(null)
          }}
          error={error ?? undefined}
          autoFocus
        />
        <Button type="submit" variant="dark" size="lg" fullWidth loading={loading}>
          {t('auth.login.sendCode')}
        </Button>
      </form>
    )
  }

  const [otpPre, otpPost] = t('auth.login.otpSent').split('{phone}')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        verify()
      }}
      noValidate
      className="animate-fade-in space-y-5"
    >
      <div>
        <button
          type="button"
          onClick={() => {
            setSentTo(null)
            setError(null)
            setOtp('')
          }}
          className="mb-4 inline-flex min-h-11 items-center gap-1.5 text-sm text-muted hover:text-ink"
        >
          <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden />
          {t('auth.login.changeNumber')}
        </button>
        <h2 className="font-serif text-2xl font-medium">{t('auth.login.otpTitle')}</h2>
        <p className="mt-1.5 text-sm text-muted">
          {otpPre}
          <span dir="ltr" className="font-medium whitespace-nowrap text-ink">
            {sentTo}
          </span>
          {otpPost}
        </p>
      </div>

      <OtpInput
        value={otp}
        onChange={(v) => {
          setOtp(v)
          if (error) setError(null)
          if (v.length === 6) verify(v)
        }}
        error={!!error}
        disabled={loading}
        describedBy="otp-hint"
      />

      <p id="otp-hint" className="flex items-center gap-2 rounded-xs bg-champagne-soft/50 px-3.5 py-2.5 text-xs text-ink">
        <KeyRound className="size-3.5 text-champagne" aria-hidden />
        {t('auth.login.demoCode', { code: STORE_CONFIG.mockOtp })}
      </p>

      <FormError message={error} />

      <Button type="submit" variant="dark" size="lg" fullWidth loading={loading}>
        {t('auth.login.verify')}
      </Button>

      <p className="text-center text-sm text-muted" aria-live="polite">
        {seconds > 0 ? (
          <span className="tabular-nums">{t('auth.login.resendIn', { seconds })}</span>
        ) : (
          <button type="button" onClick={resend} className="min-h-11 font-medium text-ink underline underline-offset-4 hover:text-rose">
            {t('auth.login.resend')}
          </button>
        )}
      </p>
    </form>
  )
}
