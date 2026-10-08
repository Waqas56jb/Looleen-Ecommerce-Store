import { ChangePasswordCard, ProfileForm, RolesMatrix, TeamCard, YourPermissionsCard } from '@/components/settings/ProfileSections'
import { SettingsShell } from '@/components/settings/SettingsShell'
import { EmptyState } from '@/components/ui'
import { useDocumentTitle } from '@/hooks'
import { useT } from '@/i18n'
import { useAuthStore } from '@/store/authStore'

export default function ProfilePage() {
  const { t } = useT()
  const title = t('common.profile')
  useDocumentTitle(title)
  const admin = useAuthStore((s) => s.admin)

  return (
    <SettingsShell section="profile" title={title} description={t('system.profile.description')}>
      {!admin ? (
        <div className="card">
          <EmptyState title={t('common.notFound')} description={t('common.notFoundDesc')} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            {/* key resets the form if the profile changes elsewhere */}
            <ProfileForm key={`${admin.id}-${admin.name}-${admin.email}-${admin.phone}-${admin.avatar ?? ''}`} admin={admin} />
            <ChangePasswordCard />
          </div>
          <YourPermissionsCard role={admin.role} />
          <RolesMatrix currentRole={admin.role} />
          <TeamCard />
        </>
      )}
    </SettingsShell>
  )
}
