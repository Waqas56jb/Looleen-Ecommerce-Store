import { Receipt } from 'lucide-react'
import { NumberInput } from '@/components/settings/NumberInput'
import { SaveBar, SettingsError, SettingsShell, SettingsSkeleton } from '@/components/settings/SettingsShell'
import { useSettingsSection, type FieldErrors } from '@/components/settings/useSettingsSection'
import { Card, FormSection, Input, Money, RadioGroup, Switch } from '@/components/ui'
import { useDocumentTitle } from '@/hooks'
import { useT } from '@/i18n'
import type { StoreSettings } from '@/types'
import { cn } from '@/utils'

type Tax = StoreSettings['tax']

export default function TaxSettingsPage() {
  const { t } = useT()
  const title = t('settings.nav.tax')
  useDocumentTitle(title)

  const validate = (v: Tax): FieldErrors => {
    const e: FieldErrors = {}
    if (v.vatEnabled) {
      if (!Number.isFinite(v.vatRate) || v.vatRate < 0 || v.vatRate > 100) e.vatRate = t('settings.tax.rateInvalid')
      if (!v.vatNumber.trim()) e.vatNumber = t('common.fieldRequired')
      else if (!/^3[0-9X]{13}3$/i.test(v.vatNumber.replace(/\s/g, ''))) e.vatNumber = t('settings.tax.vatNumberInvalid')
    }
    return e
  }
  const s = useSettingsSection('tax', validate)
  const v = s.value

  // Worked example on a 100 SAR price
  const price = 100
  const rate = v && v.vatEnabled && Number.isFinite(v.vatRate) ? v.vatRate : 0
  const inclusive = v?.display === 'inclusive'
  const net = inclusive ? price / (1 + rate / 100) : price
  const vat = inclusive ? price - net : (price * rate) / 100
  const total = inclusive ? price : price + vat

  return (
    <SettingsShell section="tax" title={title} description={t('settings.tax.description')}>
      {s.error ? (
        <SettingsError onRetry={s.reload} />
      ) : s.loading || !v ? (
        <SettingsSkeleton />
      ) : (
        <>
          <FormSection title={t('settings.tax.vat')} description={t('settings.tax.vatDesc')}>
            <Switch label={t('settings.tax.vatEnabled')} description={t('settings.tax.vatEnabledDesc')} checked={v.vatEnabled} onChange={(b) => s.patch({ vatEnabled: b })} />
            <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-2', !v.vatEnabled && 'opacity-60')}>
              <NumberInput label={t('settings.tax.vatRate')} required suffix="%" step="0.5" value={v.vatRate} onChange={(n) => s.patch({ vatRate: n })} disabled={!v.vatEnabled} error={s.errors.vatRate} hint={t('settings.tax.vatRateHint')} />
              <Input
                label={t('settings.tax.vatNumber')}
                required
                dir="ltr"
                className="text-start font-mono tracking-wide"
                maxLength={15}
                placeholder="3XXXXXXXXXXXXX3"
                value={v.vatNumber}
                onChange={(e) => s.patch({ vatNumber: e.target.value.toUpperCase() })}
                disabled={!v.vatEnabled}
                error={s.errors.vatNumber}
                hint={t('settings.tax.vatNumberHint')}
              />
            </div>
          </FormSection>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <FormSection title={t('settings.tax.display')} description={t('settings.tax.displayDesc')}>
              <RadioGroup
                name="tax-display"
                variant="card"
                value={v.display}
                onChange={(d) => s.patch({ display: d })}
                options={[
                  { value: 'inclusive', label: t('settings.tax.inclusive'), description: t('settings.tax.inclusiveDesc') },
                  { value: 'exclusive', label: t('settings.tax.exclusive'), description: t('settings.tax.exclusiveDesc') },
                ]}
              />
            </FormSection>
            <Card title={t('settings.tax.example')} description={t('settings.tax.exampleDesc')} actions={<Receipt className="size-4 text-subtle" aria-hidden />}>
              <dl className="space-y-2.5 text-[13px]" aria-live="polite">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">{t('settings.tax.exPrice')}</dt>
                  <dd>
                    <Money value={price} />
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">{inclusive ? t('settings.tax.exNet') : t('settings.tax.exNetSame')}</dt>
                  <dd>
                    <Money value={net} decimals={2} />
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">{t('settings.tax.exVat', { rate: Number.isFinite(rate) ? rate : 0 })}</dt>
                  <dd>
                    <Money value={vat} decimals={2} />
                  </dd>
                </div>
                <div className="flex justify-between gap-3 border-t border-line pt-2.5 text-sm font-semibold text-ink">
                  <dt>{t('settings.tax.exTotal')}</dt>
                  <dd>
                    <Money value={total} decimals={2} />
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-muted">{!v.vatEnabled ? t('settings.tax.exOff') : inclusive ? t('settings.tax.exInclusiveNote') : t('settings.tax.exExclusiveNote')}</p>
            </Card>
          </div>

          <SaveBar dirty={s.dirty} saving={s.saving} onSave={s.save} onDiscard={s.discard} />
        </>
      )}
    </SettingsShell>
  )
}
