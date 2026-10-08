import { invalidAmount, NumberInput } from '@/components/settings/NumberInput'
import { ROW, SaveBar, SettingsError, SettingsShell, SettingsSkeleton } from '@/components/settings/SettingsShell'
import { useSettingsSection, type FieldErrors } from '@/components/settings/useSettingsSection'
import { Badge, FormSection, Input, Money, RiyalSign, Select, Switch } from '@/components/ui'
import { useDocumentTitle } from '@/hooks'
import { useT } from '@/i18n'
import type { StoreSettings } from '@/types'

type StoreS = StoreSettings['store']

export default function StoreSettingsPage() {
  const { t } = useT()
  const title = t('settings.nav.store')
  useDocumentTitle(title)

  const validate = (v: StoreS): FieldErrors => {
    const e: FieldErrors = {}
    for (const k of ['freeShippingThreshold', 'defaultShippingFee', 'expressShippingFee', 'orderMinimum'] as const) if (invalidAmount(v[k])) e[k] = t('common.mustBePositive')
    if (!v.currencySymbol.trim()) e.currencySymbol = t('common.fieldRequired')
    return e
  }
  const s = useSettingsSection('store', validate)
  const v = s.value

  return (
    <SettingsShell section="store" title={title} description={t('settings.store.description')}>
      {s.error ? (
        <SettingsError onRetry={s.reload} />
      ) : s.loading || !v ? (
        <SettingsSkeleton />
      ) : (
        <>
          <FormSection title={t('settings.store.currency')} description={t('settings.store.currencyDesc')}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_minmax(0,1.1fr)]">
              <Select
                label={t('settings.store.currencyCode')}
                required
                value={v.currency}
                onChange={(e) => s.patch({ currency: e.target.value })}
                options={[{ value: 'SAR', label: t('settings.store.sarLabel') }]}
                hint={t('settings.store.currencyHint')}
              />
              <Input
                label={t('settings.store.currencySymbol')}
                required
                dir="ltr"
                className="text-start"
                value={v.currencySymbol}
                onChange={(e) => s.patch({ currencySymbol: e.target.value })}
                error={s.errors.currencySymbol}
                hint={t('settings.store.symbolHint')}
              />
              <div className="flex items-center gap-4 rounded-md border border-line bg-mist/70 px-4 py-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-md bg-surface text-2xl text-ink shadow-card">
                  <RiyalSign />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">{t('settings.store.preview')}</p>
                  <p className="mt-0.5 text-xl font-semibold text-ink">
                    <Money value={1240} />
                  </p>
                  <p className="text-[11px] text-subtle">{t('settings.store.previewHint')}</p>
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection title={t('settings.store.pricing')} description={t('settings.store.pricingDesc')}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <NumberInput
                money
                label={t('settings.store.freeShippingThreshold')}
                required
                value={v.freeShippingThreshold}
                onChange={(n) => s.patch({ freeShippingThreshold: n })}
                error={s.errors.freeShippingThreshold}
                hint={t('settings.store.freeShippingHint')}
              />
              <NumberInput money label={t('settings.store.orderMinimum')} required value={v.orderMinimum} onChange={(n) => s.patch({ orderMinimum: n })} error={s.errors.orderMinimum} hint={t('settings.store.orderMinimumHint')} />
              <NumberInput money label={t('settings.store.defaultShippingFee')} required value={v.defaultShippingFee} onChange={(n) => s.patch({ defaultShippingFee: n })} error={s.errors.defaultShippingFee} />
              <NumberInput money label={t('settings.store.expressShippingFee')} required value={v.expressShippingFee} onChange={(n) => s.patch({ expressShippingFee: n })} error={s.errors.expressShippingFee} />
            </div>
            {Number.isFinite(v.freeShippingThreshold) && v.freeShippingThreshold > 0 && (
              <p className="rounded-md bg-mist px-3 py-2 text-xs text-muted">
                {t('settings.store.freeShippingPreviewBefore')} <Money value={v.freeShippingThreshold} className="font-semibold text-ink" /> {t('settings.store.freeShippingPreviewAfter')}
              </p>
            )}
          </FormSection>

          <FormSection title={t('settings.store.features')} description={t('settings.store.featuresDesc')}>
            <div className="divide-y divide-line-soft">
              <Switch
                className={ROW}
                label={
                  <span className="inline-flex items-center gap-2">
                    {t('settings.store.enableCod')} {v.enableCod && <Badge tone="success">{t('common.enabled')}</Badge>}
                  </span>
                }
                description={t('settings.store.enableCodDesc')}
                checked={v.enableCod}
                onChange={(b) => s.patch({ enableCod: b })}
              />
              <Switch className={ROW} label={t('settings.store.enableReviews')} description={t('settings.store.enableReviewsDesc')} checked={v.enableReviews} onChange={(b) => s.patch({ enableReviews: b })} />
              <Switch className={ROW} label={t('settings.store.enableWishlist')} description={t('settings.store.enableWishlistDesc')} checked={v.enableWishlist} onChange={(b) => s.patch({ enableWishlist: b })} />
              <Switch className={ROW} label={t('settings.store.enableLoyalty')} description={t('settings.store.enableLoyaltyDesc')} checked={v.enableLoyalty} onChange={(b) => s.patch({ enableLoyalty: b })} />
            </div>
          </FormSection>

          <SaveBar dirty={s.dirty} saving={s.saving} onSave={s.save} onDiscard={s.discard} />
        </>
      )}
    </SettingsShell>
  )
}
