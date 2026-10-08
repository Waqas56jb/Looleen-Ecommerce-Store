import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { SETTINGS_NAV, SettingsError, SettingsShell, type SettingsSectionKey } from '@/components/settings/SettingsShell'
import { useAsync, useDocumentTitle } from '@/hooks'
import { useT } from '@/i18n'
import { getSettings } from '@/services/systemService'
import { useAuthStore } from '@/store/authStore'
import type { StoreSettings } from '@/types'

export default function SettingsPage() {
  const { t, lang } = useT()
  useDocumentTitle(t('common.settings'))
  const admin = useAuthStore((s) => s.admin)
  const { data, loading, error, reload } = useAsync(getSettings, [])

  const summary = (key: SettingsSectionKey, s: StoreSettings): string => {
    switch (key) {
      case 'general':
        return `${s.general.storeName} · ${s.general.storeEmail}`
      case 'store':
        return t('settings.overview.storeSummary', { currency: s.store.currency, threshold: s.store.freeShippingThreshold, fee: s.store.defaultShippingFee })
      case 'payment': {
        const on = Object.values(s.payments).filter(Boolean).length
        return t('settings.overview.paymentSummary', { count: on, total: Object.keys(s.payments).length })
      }
      case 'shipping':
        return t('settings.overview.shippingSummary', {
          methods: s.shipping.methods.filter((m) => m.enabled).length,
          regions: s.shipping.regions.filter((r) => r.enabled).length,
        })
      case 'tax':
        return s.tax.vatEnabled ? t('settings.overview.taxSummary', { rate: s.tax.vatRate, display: t(`settings.tax.${s.tax.display}`) }) : t('settings.overview.taxOff')
      case 'localization':
        return `${s.localization.defaultLanguage === 'ar' ? t('common.arabic') : t('common.english')} · ${s.localization.timezone} · ${s.localization.dateFormat}`
      case 'notifications': {
        const on = Object.values(s.notifications).filter(Boolean).length
        return t('settings.overview.notificationsSummary', { count: on, total: Object.keys(s.notifications).length })
      }
      case 'profile':
        return admin ? `${admin.name} · ${t(`roles.${admin.role}`)}` : ''
    }
  }

  return (
    <SettingsShell title={t('common.settings')} description={t('settings.overview.description')}>
      {error ? (
        <SettingsError onRetry={reload} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {SETTINGS_NAV.map((n) => (
            <Link key={n.key} to={n.to} className="card group flex items-start gap-4 p-5 transition-colors hover:border-ink/25">
              <span className="grid size-10 shrink-0 place-items-center rounded-md bg-mist text-ink transition-colors group-hover:bg-blush">
                <n.icon className="size-[18px]" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[15px] font-semibold text-ink">{t(`settings.nav.${n.key}`)}</span>
                  <ChevronRight className="size-4 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" aria-hidden />
                </span>
                <span className="mt-0.5 block text-[13px] text-muted">{t(`settings.overview.desc.${n.key}`)}</span>
                <span className="mt-3 block truncate rounded bg-mist px-2 py-1 text-xs text-ink" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                  {loading || !data ? <span className="skeleton inline-block h-3.5 w-40 align-middle" aria-hidden /> : summary(n.key, data)}
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </SettingsShell>
  )
}
