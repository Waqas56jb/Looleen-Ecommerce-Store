import { AccountPageHeader } from '@/components/account/AccountUI'
import { PasswordForm, ProfessionalCard, ProfileDetailsForm } from '@/components/account/ProfileForms'
import { useDocumentMeta } from '@/hooks'
import { useT } from '@/i18n'
import { useAuthStore } from '@/store/auth'

export default function ProfilePage() {
  const { t } = useT()
  useDocumentMeta(t('account.profile.metaTitle'), t('account.profile.metaDesc'))
  const user = useAuthStore((s) => s.user)
  if (!user) return null
  return (
    <div>
      <AccountPageHeader title={t('account.profile.title')} description={t('account.profile.desc')} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <ProfileDetailsForm key={user.id} user={user} />
          <ProfessionalCard user={user} />
        </div>
        <div>
          <PasswordForm />
        </div>
      </div>
    </div>
  )
}
