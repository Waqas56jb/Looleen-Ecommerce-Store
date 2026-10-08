import { useState } from 'react'
import { AtSign, MapPin, MessageCircle, Phone, RotateCcw, Store } from 'lucide-react'
import { toast } from 'sonner'
import { SaveBar, SettingsError, SettingsShell, SettingsSkeleton } from '@/components/settings/SettingsShell'
import { useSettingsSection, type FieldErrors } from '@/components/settings/useSettingsSection'
import { Button, ConfirmDialog, FormSection, Img, Input, Textarea } from '@/components/ui'
import { useDocumentTitle } from '@/hooks'
import { useT } from '@/i18n'
import { resetDemoData } from '@/services/systemService'
import type { StoreSettings } from '@/types'
import { isValidEmail, isValidSaudiPhone, isValidUrl } from '@/utils'

type General = StoreSettings['general']

function makeValidate(tr: (k: string) => string) {
  return (v: General): FieldErrors => {
  const e: FieldErrors = {}
  if (!v.storeName.trim()) e.storeName = tr('common.fieldRequired')
  if (!v.storeEmail.trim()) e.storeEmail = tr('common.fieldRequired')
  else if (!isValidEmail(v.storeEmail)) e.storeEmail = tr('common.invalidEmail')
  if (!v.supportPhone.trim()) e.supportPhone = tr('common.fieldRequired')
  else if (!isValidSaudiPhone(v.supportPhone)) e.supportPhone = tr('common.invalidPhone')
  if (v.whatsapp.trim() && !isValidSaudiPhone(v.whatsapp)) e.whatsapp = tr('common.invalidPhone')
  if (!v.address.trim()) e.address = tr('common.fieldRequired')
  if (v.logoUrl.trim() && !isValidUrl(v.logoUrl)) e.logoUrl = tr('common.invalidUrl')
  if (v.faviconUrl.trim() && !isValidUrl(v.faviconUrl)) e.faviconUrl = tr('common.invalidUrl')
  return e
  }
}

export default function GeneralSettingsPage() {
  const { t } = useT()
  const title = t('settings.nav.general')
  useDocumentTitle(title)
  const s = useSettingsSection('general', makeValidate(t))
  const [confirmReset, setConfirmReset] = useState(false)
  const v = s.value

  const doReset = async () => {
    await resetDemoData()
    toast.success(t('settings.general.resetDone'))
    setTimeout(() => window.location.reload(), 600)
  }

  return (
    <SettingsShell section="general" title={title} description={t('settings.general.description')}>
      {s.error ? (
        <SettingsError onRetry={s.reload} />
      ) : s.loading || !v ? (
        <SettingsSkeleton />
      ) : (
        <>
          <FormSection title={t('settings.general.storeInfo')} description={t('settings.general.storeInfoDesc')}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label={t('settings.general.storeName')} required leading={<Store />} value={v.storeName} onChange={(e) => s.patch({ storeName: e.target.value })} error={s.errors.storeName} />
              <Input
                label={t('settings.general.storeEmail')}
                required
                type="email"
                dir="ltr"
                className="text-start"
                leading={<AtSign />}
                value={v.storeEmail}
                onChange={(e) => s.patch({ storeEmail: e.target.value })}
                error={s.errors.storeEmail}
                hint={t('settings.general.storeEmailHint')}
              />
              <Input
                label={t('settings.general.supportPhone')}
                required
                type="tel"
                dir="ltr"
                className="text-start"
                leading={<Phone />}
                placeholder="+966 5X XXX XXXX"
                value={v.supportPhone}
                onChange={(e) => s.patch({ supportPhone: e.target.value })}
                error={s.errors.supportPhone}
                hint={t('settings.general.phoneHint')}
              />
              <Input
                label={t('settings.general.whatsapp')}
                type="tel"
                dir="ltr"
                className="text-start"
                leading={<MessageCircle />}
                placeholder="+966 5X XXX XXXX"
                value={v.whatsapp}
                onChange={(e) => s.patch({ whatsapp: e.target.value })}
                error={s.errors.whatsapp}
                hint={t('settings.general.whatsappHint')}
              />
            </div>
            <Textarea label={t('settings.general.address')} required rows={2} value={v.address} onChange={(e) => s.patch({ address: e.target.value })} error={s.errors.address} />
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <MapPin className="size-3.5" aria-hidden />
              {t('settings.general.addressHint')}
            </p>
          </FormSection>

          <FormSection title={t('settings.general.branding')} description={t('settings.general.brandingDesc')}>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="flex gap-4">
                <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-md border border-line bg-mist">
                  <Img key={v.logoUrl} src={v.logoUrl || '/logo.jpeg'} alt={t('settings.general.logo')} w={200} className="size-full object-contain" />
                </div>
                <Input
                  wrapperClassName="flex-1"
                  label={t('settings.general.logo')}
                  dir="ltr"
                  className="text-start"
                  placeholder="/logo.jpeg"
                  value={v.logoUrl}
                  onChange={(e) => s.patch({ logoUrl: e.target.value })}
                  error={s.errors.logoUrl}
                  hint={t('settings.general.logoHint')}
                />
              </div>
              <div className="flex gap-4">
                <div className="grid size-20 shrink-0 place-items-center rounded-md border border-line bg-mist">
                  <span className="grid size-9 place-items-center overflow-hidden rounded bg-surface shadow-card">
                    <Img key={v.faviconUrl} src={v.faviconUrl || '/favicon.svg'} alt={t('settings.general.favicon')} w={64} className="size-6 object-contain" />
                  </span>
                </div>
                <Input
                  wrapperClassName="flex-1"
                  label={t('settings.general.favicon')}
                  dir="ltr"
                  className="text-start"
                  placeholder="/favicon.svg"
                  value={v.faviconUrl}
                  onChange={(e) => s.patch({ faviconUrl: e.target.value })}
                  error={s.errors.faviconUrl}
                  hint={t('settings.general.faviconHint')}
                />
              </div>
            </div>
          </FormSection>

          <section className="card border-error/30">
            <header className="border-b border-error/15 px-5 py-4">
              <h2 className="text-[15px] font-semibold text-error">{t('settings.general.danger')}</h2>
              <p className="mt-0.5 text-[13px] text-muted">{t('settings.general.dangerDesc')}</p>
            </header>
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{t('settings.general.resetTitle')}</p>
                <p className="mt-0.5 text-xs text-muted">{t('settings.general.resetDesc')}</p>
              </div>
              <Button variant="danger" icon={<RotateCcw className="size-4" />} onClick={() => setConfirmReset(true)}>
                {t('settings.general.resetButton')}
              </Button>
            </div>
          </section>

          <SaveBar dirty={s.dirty} saving={s.saving} onSave={s.save} onDiscard={s.discard} />
        </>
      )}
      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={doReset}
        title={t('settings.general.resetConfirmTitle')}
        description={t('settings.general.resetConfirmDesc')}
        confirmLabel={t('settings.general.resetButton')}
      />
    </SettingsShell>
  )
}
