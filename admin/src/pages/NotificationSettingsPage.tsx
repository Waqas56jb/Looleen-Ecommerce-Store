import { Mail } from 'lucide-react'
import { ROW, SaveBar, SettingsError, SettingsShell, SettingsSkeleton } from '@/components/settings/SettingsShell'
import { useSettingsSection } from '@/components/settings/useSettingsSection'
import { Button, Card } from '@/components/ui'
import { useDocumentTitle } from '@/hooks'
import { useT } from '@/i18n'
import { useAuthStore } from '@/store/authStore'
import type { StoreSettings } from '@/types'
import { Switch } from '@/components/ui'

type Keys = keyof StoreSettings['notifications']
const KEYS: Keys[] = ['newOrder', 'lowStock', 'newCustomer', 'returnRequest', 'reviewPending', 'dailySummary']

export default function NotificationSettingsPage() {
  const { t } = useT()
  const title = t('settings.nav.notifications')
  useDocumentTitle(title)
  const admin = useAuthStore((s) => s.admin)
  const s = useSettingsSection('notifications')
  const v = s.value
  const allOn = v ? KEYS.every((k) => v[k]) : false

  return (
    <SettingsShell section="notifications" title={title} description={t('settings.notifications.description')}>
      {s.error ? (
        <SettingsError onRetry={s.reload} />
      ) : s.loading || !v ? (
        <SettingsSkeleton cards={1} />
      ) : (
        <>
          <Card
            title={t('settings.notifications.email')}
            description={
              <span className="inline-flex flex-wrap items-center gap-1">
                <Mail className="size-3.5" aria-hidden />
                {t('settings.notifications.emailDesc')}{' '}
                <span dir="ltr" className="font-medium text-ink">
                  {admin?.email}
                </span>
              </span>
            }
            actions={
              <Button size="xs" variant="outline" onClick={() => s.setValue(Object.fromEntries(KEYS.map((k) => [k, !allOn])) as StoreSettings['notifications'])}>
                {allOn ? t('settings.notifications.disableAll') : t('settings.notifications.enableAll')}
              </Button>
            }
          >
            <div className="divide-y divide-line-soft border-t border-line-soft pt-4">
              {KEYS.map((k) => (
                <Switch key={k} className={ROW} label={t(`settings.notifications.${k}`)} description={t(`settings.notifications.${k}Desc`)} checked={v[k]} onChange={(b) => s.patch({ [k]: b } as Partial<StoreSettings['notifications']>)} />
              ))}
            </div>
          </Card>
          <SaveBar dirty={s.dirty} saving={s.saving} onSave={s.save} onDiscard={s.discard} />
        </>
      )}
    </SettingsShell>
  )
}
