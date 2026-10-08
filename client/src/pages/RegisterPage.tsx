import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { firstName, useAuthRedirect } from '@/components/auth/useAuthRedirect'
import { useDocumentMeta } from '@/hooks'
import { useT } from '@/i18n'
import { useAuthStore } from '@/store/auth'
import type { User } from '@/types'

export default function RegisterPage() {
  const { t } = useT()
  useDocumentMeta(t('auth.register.metaTitle'), t('auth.register.metaDesc'))
  const user = useAuthStore((s) => s.user)
  const target = useAuthRedirect()
  const [params] = useSearchParams()

  if (user) return <Navigate to={target} replace />

  const onSuccess = (u: User) => toast.success(t('auth.register.welcome', { name: firstName(u.name) }))
  const loginHref = params.get('redirect') ? `/login?redirect=${encodeURIComponent(target)}` : '/login'

  return (
    <AuthLayout
      eyebrow={t('auth.register.eyebrow')}
      title={t('auth.register.title')}
      subtitle={t('auth.register.subtitle')}
      footer={
        <p>
          {t('auth.register.haveAccount')}{' '}
          <Link to={loginHref} className="font-semibold text-ink underline underline-offset-4 hover:text-rose">
            {t('auth.register.signIn')}
          </Link>
        </p>
      }
    >
      <RegisterForm onSuccess={onSuccess} />
    </AuthLayout>
  )
}
