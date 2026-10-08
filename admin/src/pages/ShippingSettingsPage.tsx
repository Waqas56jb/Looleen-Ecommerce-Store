import { MapPin, Truck, Zap } from 'lucide-react'
import { invalidAmount, NumberInput } from '@/components/settings/NumberInput'
import { SaveBar, SettingsError, SettingsShell, SettingsSkeleton } from '@/components/settings/SettingsShell'
import { useSettingsSection, type FieldErrors } from '@/components/settings/useSettingsSection'
import { Badge, Button, Card, fieldClass, Input, Money, Switch } from '@/components/ui'
import { useDocumentTitle } from '@/hooks'
import { useT } from '@/i18n'
import type { StoreSettings } from '@/types'
import { cityName, cn } from '@/utils'

type Shipping = StoreSettings['shipping']
type Method = Shipping['methods'][number]
type Region = Shipping['regions'][number]

const DAYS_RE = /^\d{1,2}(\s*[–-]\s*\d{1,2})?$/

export default function ShippingSettingsPage() {
  const { t, lang } = useT()
  const title = t('settings.nav.shipping')
  useDocumentTitle(title)

  const validate = (v: Shipping): FieldErrors => {
    const e: FieldErrors = {}
    v.methods.forEach((m, i) => {
      if (!m.name.trim()) e[`m${i}.name`] = t('common.fieldRequired')
      if (!m.nameAr.trim()) e[`m${i}.nameAr`] = t('common.fieldRequired')
      if (invalidAmount(m.price)) e[`m${i}.price`] = t('common.mustBePositive')
      if (invalidAmount(m.freeThreshold)) e[`m${i}.freeThreshold`] = t('common.mustBePositive')
      if (!m.estimate.trim()) e[`m${i}.estimate`] = t('common.fieldRequired')
    })
    if (!v.methods.some((m) => m.enabled)) e.methods = t('settings.shipping.oneMethod')
    v.regions.forEach((r) => {
      if (r.enabled && !DAYS_RE.test(r.standardDays.trim())) e[`r.${r.city}.standardDays`] = t('settings.shipping.daysInvalid')
      if (r.enabled && !DAYS_RE.test(r.expressDays.trim())) e[`r.${r.city}.expressDays`] = t('settings.shipping.daysInvalid')
    })
    if (!v.regions.some((r) => r.enabled)) e.regions = t('settings.shipping.oneRegion')
    return e
  }

  const s = useSettingsSection('shipping', validate)
  const v = s.value
  const setMethod = (i: number, p: Partial<Method>) => s.setValue((prev) => ({ ...prev, methods: prev.methods.map((m, j) => (j === i ? { ...m, ...p } : m)) }))
  const setRegion = (city: string, p: Partial<Region>) => s.setValue((prev) => ({ ...prev, regions: prev.regions.map((r) => (r.city === city ? { ...r, ...p } : r)) }))
  const setAllRegions = (enabled: boolean) => s.setValue((prev) => ({ ...prev, regions: prev.regions.map((r) => ({ ...r, enabled })) }))

  return (
    <SettingsShell section="shipping" title={title} description={t('settings.shipping.description')}>
      {s.error ? (
        <SettingsError onRetry={s.reload} />
      ) : s.loading || !v ? (
        <SettingsSkeleton />
      ) : (
        <>
          <section aria-labelledby="ship-methods">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 id="ship-methods" className="text-[15px] font-semibold text-ink">
                  {t('settings.shipping.methods')}
                </h2>
                <p className="text-[13px] text-muted">{t('settings.shipping.methodsDesc')}</p>
              </div>
            </div>
            {s.errors.methods && (
              <p role="alert" className="mb-3 text-xs text-error">
                {s.errors.methods}
              </p>
            )}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {v.methods.map((m, i) => {
                const Icon = m.id === 'express' ? Zap : Truck
                return (
                  <article key={m.id} className={cn('card flex flex-col', !m.enabled && 'opacity-80')}>
                    <header className="flex items-center justify-between gap-3 border-b border-line-soft px-5 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={cn('grid size-9 shrink-0 place-items-center rounded-md', m.id === 'express' ? 'bg-champagne-soft text-[#7a5a26]' : 'bg-mist text-ink')}>
                          <Icon className="size-4" aria-hidden />
                        </span>
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-ink">{lang === 'ar' ? m.nameAr || m.name : m.name || m.nameAr}</h3>
                          <p className="text-xs text-muted">
                            {Number.isFinite(m.price) && <Money value={m.price} />} · {m.estimate}
                          </p>
                        </div>
                      </div>
                      <Switch checked={m.enabled} onChange={(b) => setMethod(i, { enabled: b })} id={`method-${m.id}`} />
                      <label htmlFor={`method-${m.id}`} className="sr-only">
                        {t('common.enabled')}
                      </label>
                    </header>
                    <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                      <Input label={t('settings.shipping.nameEn')} required dir="ltr" className="text-start" value={m.name} onChange={(e) => setMethod(i, { name: e.target.value })} error={s.errors[`m${i}.name`]} />
                      <Input label={t('settings.shipping.nameAr')} required dir="rtl" className="text-start" value={m.nameAr} onChange={(e) => setMethod(i, { nameAr: e.target.value })} error={s.errors[`m${i}.nameAr`]} />
                      <NumberInput money label={t('settings.shipping.price')} required value={m.price} onChange={(n) => setMethod(i, { price: n })} error={s.errors[`m${i}.price`]} />
                      <NumberInput
                        money
                        label={t('settings.shipping.freeThreshold')}
                        value={m.freeThreshold}
                        onChange={(n) => setMethod(i, { freeThreshold: n })}
                        error={s.errors[`m${i}.freeThreshold`]}
                        hint={t('settings.shipping.freeThresholdHint')}
                      />
                      <Input
                        wrapperClassName="sm:col-span-2"
                        label={t('settings.shipping.estimate')}
                        required
                        value={m.estimate}
                        onChange={(e) => setMethod(i, { estimate: e.target.value })}
                        error={s.errors[`m${i}.estimate`]}
                        placeholder="2–4 business days"
                      />
                    </div>
                  </article>
                )
              })}
            </div>
          </section>

          <Card
            title={t('settings.shipping.regions')}
            description={t('settings.shipping.regionsDesc')}
            padded={false}
            actions={
              <div className="flex flex-wrap gap-1.5">
                <Button size="xs" variant="outline" onClick={() => setAllRegions(true)}>
                  {t('settings.shipping.enableAll')}
                </Button>
                <Button size="xs" variant="ghost" onClick={() => setAllRegions(false)}>
                  {t('settings.shipping.disableAll')}
                </Button>
              </div>
            }
          >
            {s.errors.regions && (
              <p role="alert" className="px-5 pb-2 text-xs text-error">
                {s.errors.regions}
              </p>
            )}
            <div className="border-t border-line-soft">
              <div className="hidden grid-cols-[minmax(0,1.4fr)_100px_minmax(0,1fr)_minmax(0,1fr)] gap-4 border-b border-line px-5 py-2.5 text-[11.5px] font-semibold tracking-wide text-muted uppercase md:grid">
                <span>{t('common.city')}</span>
                <span>{t('common.status')}</span>
                <span>{t('settings.shipping.standardDays')}</span>
                <span>{t('settings.shipping.expressDays')}</span>
              </div>
              <ul className="divide-y divide-line-soft">
                {v.regions.map((r) => {
                  const sid = `region-${r.city}`
                  const stdErr = s.errors[`r.${r.city}.standardDays`]
                  const expErr = s.errors[`r.${r.city}.expressDays`]
                  return (
                    <li key={r.city} className={cn('grid grid-cols-2 items-center gap-x-4 gap-y-3 px-5 py-3 md:grid-cols-[minmax(0,1.4fr)_100px_minmax(0,1fr)_minmax(0,1fr)]', !r.enabled && 'bg-mist/50')}>
                      <label htmlFor={sid} className="flex min-w-0 items-center gap-2 text-sm font-medium text-ink">
                        <MapPin className="size-4 shrink-0 text-subtle" aria-hidden />
                        <span className="truncate">{cityName(r.city, lang)}</span>
                      </label>
                      <div className="flex items-center justify-end gap-2 md:justify-start">
                        <Switch id={sid} size="sm" checked={r.enabled} onChange={(b) => setRegion(r.city, { enabled: b })} />
                        <Badge tone={r.enabled ? 'success' : 'neutral'} className="max-md:hidden">
                          {r.enabled ? t('common.active') : t('common.inactive')}
                        </Badge>
                      </div>
                      <DaysInput label={t('settings.shipping.standardDays')} value={r.standardDays} disabled={!r.enabled} error={stdErr} onChange={(x) => setRegion(r.city, { standardDays: x })} unit={t('settings.shipping.days')} />
                      <DaysInput label={t('settings.shipping.expressDays')} value={r.expressDays} disabled={!r.enabled} error={expErr} onChange={(x) => setRegion(r.city, { expressDays: x })} unit={t('settings.shipping.days')} />
                    </li>
                  )
                })}
              </ul>
            </div>
          </Card>

          <SaveBar dirty={s.dirty} saving={s.saving} onSave={s.save} onDiscard={s.discard} />
        </>
      )}
    </SettingsShell>
  )
}

function DaysInput({ label, value, onChange, disabled, error, unit }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean; error?: string; unit: string }) {
  return (
    <div className="min-w-0">
      <span className="mb-1 block text-[10.5px] tracking-wide text-subtle uppercase md:hidden">{label}</span>
      <div className="relative">
        <input
          aria-label={label}
          dir="ltr"
          value={value}
          disabled={disabled}
          aria-invalid={!!error || undefined}
          onChange={(e) => onChange(e.target.value)}
          placeholder="2–4"
          className={cn(fieldClass, 'h-8 pe-12 text-start tabular-nums')}
        />
        <span className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-2.5 text-xs text-subtle">{unit}</span>
      </div>
      {error && <p className="mt-1 text-[11px] text-error">{error}</p>}
    </div>
  )
}
