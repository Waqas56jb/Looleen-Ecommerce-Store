import { CalendarDays, Languages } from 'lucide-react'
import { toast } from 'sonner'
import { SaveBar, SettingsError, SettingsShell, SettingsSkeleton } from '@/components/settings/SettingsShell'
import { useSettingsSection, type FieldErrors } from '@/components/settings/useSettingsSection'
import { Badge, Button, Checkbox, Field, FormSection, Select } from '@/components/ui'
import { useDocumentTitle } from '@/hooks'
import { translate, useT } from '@/i18n'
import { useUIStore } from '@/store/uiStore'
import type { Lang, StoreSettings } from '@/types'

type Loc = StoreSettings['localization']
type DateFormat = Loc['dateFormat']

const DATE_FORMATS: DateFormat[] = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']

function formatWith(fmt: DateFormat, d: Date, tz: string) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: tz, day: '2-digit', month: '2-digit', year: 'numeric' }).formatToParts(d)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  const [dd, mm, yyyy] = [get('day'), get('month'), get('year')]
  return fmt === 'DD/MM/YYYY' ? `${dd}/${mm}/${yyyy}` : fmt === 'MM/DD/YYYY' ? `${mm}/${dd}/${yyyy}` : `${yyyy}-${mm}-${dd}`
}

export default function LocalizationSettingsPage() {
  const { t, lang } = useT()
  const setLang = useUIStore((s) => s.setLang)
  const title = t('settings.nav.localization')
  useDocumentTitle(title)

  const validate = (v: Loc): FieldErrors => {
    const e: FieldErrors = {}
    if (!v.supported.includes('en')) e.supported = t('settings.localization.englishRequired')
    if (!v.supported.includes(v.defaultLanguage)) e.defaultLanguage = t('settings.localization.defaultMustBeSupported')
    return e
  }
  const s = useSettingsSection('localization', validate)
  const v = s.value

  const langLabel = (l: Lang) => (l === 'ar' ? t('common.arabic') : t('common.english'))
  const toggleSupported = (l: Lang, on: boolean) =>
    s.setValue((prev) => {
      const supported = on ? Array.from(new Set([...prev.supported, l])) : prev.supported.filter((x) => x !== l)
      return { ...prev, supported: (['en', 'ar'] as Lang[]).filter((x) => supported.includes(x)), defaultLanguage: !on && prev.defaultLanguage === l ? 'en' : prev.defaultLanguage }
    })

  const switchNow = () => {
    if (!v) return
    const target = v.defaultLanguage === lang ? (lang === 'en' ? 'ar' : 'en') : v.defaultLanguage
    setLang(target)
    toast.success(translate(target, 'settings.localization.switched'))
  }

  return (
    <SettingsShell section="localization" title={title} description={t('settings.localization.description')}>
      {s.error ? (
        <SettingsError onRetry={s.reload} />
      ) : s.loading || !v ? (
        <SettingsSkeleton />
      ) : (
        <>
          <FormSection title={t('settings.localization.languages')} description={t('settings.localization.languagesDesc')}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select
                label={t('settings.localization.defaultLanguage')}
                required
                value={v.defaultLanguage}
                onChange={(e) => s.patch({ defaultLanguage: e.target.value as Lang })}
                options={(['en', 'ar'] as Lang[]).map((l) => ({ value: l, label: langLabel(l), disabled: !v.supported.includes(l) }))}
                error={s.errors.defaultLanguage}
                hint={t('settings.localization.defaultLanguageHint')}
              />
              <Field label={t('settings.localization.supported')} required error={s.errors.supported} hint={t('settings.localization.supportedHint')}>
                <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1.5">
                  <Checkbox label={t('common.english')} description={t('settings.localization.requiredLang')} checked={v.supported.includes('en')} disabled onChange={() => undefined} />
                  <Checkbox label={t('common.arabic')} description={t('settings.localization.rtl')} checked={v.supported.includes('ar')} onChange={(e) => toggleSupported('ar', e.target.checked)} />
                </div>
              </Field>
            </div>
            <div className="flex flex-col gap-3 rounded-md border border-line bg-mist/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Languages className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
                <div>
                  <p className="text-sm font-medium text-ink">
                    {t('settings.localization.adminLanguage')} <Badge className="ms-1">{langLabel(lang)}</Badge>
                  </p>
                  <p className="mt-0.5 text-xs text-muted">{t('settings.localization.adminLanguageDesc')}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={switchNow}>
                {t('settings.localization.switchNow', { lang: langLabel(v.defaultLanguage === lang ? (lang === 'en' ? 'ar' : 'en') : v.defaultLanguage) })}
              </Button>
            </div>
          </FormSection>

          <FormSection title={t('settings.localization.regional')} description={t('settings.localization.regionalDesc')}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select label={t('settings.localization.currency')} required value={v.currency} onChange={(e) => s.patch({ currency: e.target.value })} options={[{ value: 'SAR', label: t('settings.store.sarLabel') }]} />
              <Select
                label={t('settings.localization.timezone')}
                required
                value={v.timezone}
                onChange={(e) => s.patch({ timezone: e.target.value })}
                options={[{ value: 'Asia/Riyadh', label: t('settings.localization.riyadhTz') }]}
                hint={t('settings.localization.timezoneHint')}
              />
              <Select
                label={t('settings.localization.dateFormat')}
                required
                value={v.dateFormat}
                onChange={(e) => s.patch({ dateFormat: e.target.value as DateFormat })}
                options={DATE_FORMATS.map((f) => ({ value: f, label: f }))}
              />
              <div className="flex items-center gap-3 rounded-md border border-line bg-mist/60 px-4 py-3 md:mt-6">
                <CalendarDays className="size-4 shrink-0 text-muted" aria-hidden />
                <div>
                  <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">{t('settings.localization.todayPreview')}</p>
                  <p dir="ltr" className="text-start text-base font-semibold text-ink tabular-nums" aria-live="polite">
                    {formatWith(v.dateFormat, new Date(), v.timezone)}
                  </p>
                </div>
              </div>
            </div>
          </FormSection>

          <SaveBar dirty={s.dirty} saving={s.saving} onSave={s.save} onDiscard={s.discard} />
        </>
      )}
    </SettingsShell>
  )
}
