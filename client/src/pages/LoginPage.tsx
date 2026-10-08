import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { Mail, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { EmailLoginForm } from '@/components/auth/EmailLoginForm'
import { PhoneLoginForm } from '@/components/auth/PhoneLoginForm'
import { firstName, useAuthRedirect } from '@/components/auth/useAuthRedirect'
import { Tabs } from '@/components/common'
import { useDocumentMeta } from '@/hooks'
import { useT } from '@/i18n'
import { useAuthStore } from '@/store/auth'
import type { User } from '@/types'

export default function LoginPage() {
  const { t } = useT()
  useDocumentMeta(t('auth.login.metaTitle'), t('auth.login.metaDesc'))
  const user = useAuthStore((s) => s.user)
  const target = useAuthRedirect()
  const [params] = useSearchParams()

  if (user) return <Navigate to={target} replace />

  const onSuccess = (u: User) => toast.success(t('toast.signedIn', { name: firstName(u.name) }))
  const registerHref = params.get('redirect') ? `/register?redirect=${encodeURIComponent(target)}` : '/register'

  return (
    <AuthLayout
      eyebrow={t('auth.login.eyebrow')}
      title={t('auth.login.title')}
      subtitle={t('auth.login.subtitle')}
      footer={
        <div className="space-y-3">
          <p>
            {t('auth.login.noAccount')}{' '}
            <Link to={registerHref} className="font-semibold text-ink underline underline-offset-4 hover:text-rose">
              {t('auth.login.createAccount')}
            </Link>
          </p>
          <p>
            <Link to="/" className="text-xs text-muted underline-offset-4 hover:text-ink hover:underline">
              {t('auth.login.orGuest')}
            </Link>
          </p>
        </div>
      }
    >
      <Tabs
        tabs={[
          {
            id: 'phone',
            label: (
              <span className="flex items-center gap-2">
                <Smartphone className="size-4" aria-hidden />
                {t('auth.login.tabPhone')}
              </span>
            ),
            content: <PhoneLoginForm onSuccess={onSuccess} />,
          },
          {
            id: 'email',
            label: (
              <span className="flex items-center gap-2">
                <Mail className="size-4" aria-hidden />
                {t('auth.login.tabEmail')}
              </span>
            ),
            content: <EmailLoginForm onSuccess={onSuccess} />,
          },
        ]}
      />
    </AuthLayout>
  )
}
