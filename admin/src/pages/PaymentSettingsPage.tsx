import { Lock, ShieldCheck } from 'lucide-react'
import { SaveBar, SettingsError, SettingsShell, SettingsSkeleton } from '@/components/settings/SettingsShell'
import { useSettingsSection } from '@/components/settings/useSettingsSection'
import { Badge, Button, Card, Switch } from '@/components/ui'
import { PAYMENT_METHODS, type PaymentMethodId } from '@/config/store'
import { useDocumentTitle } from '@/hooks'
import { useT } from '@/i18n'
import { cn } from '@/utils'

/** Text logo marks — real brand assets get wired in with the backend integration */
const MARKS: Record<PaymentMethodId, { text: string; className: string }> = {
  mada: { text: 'mada', className: 'bg-[#eef6e6] text-[#3f7a1f] font-bold lowercase' },
  visa: { text: 'VISA', className: 'bg-[#e9edf7] text-[#1a1f71] font-extrabold italic tracking-wide' },
  mastercard: { text: 'MC', className: 'bg-[#fdf0e6] text-[#c2410c] font-bold' },
  applepay: { text: 'Pay', className: 'bg-ink text-white font-semibold' },
  stcpay: { text: 'stc', className: 'bg-[#f1e9f8] text-[#4f008c] font-bold lowercase' },
  tabby: { text: 'tabby', className: 'bg-[#e6faf3] text-[#047857] font-bold lowercase' },
  tamara: { text: 'tamara', className: 'bg-[#fdf3e7] text-[#b45309] font-bold lowercase' },
  cod: { text: 'COD', className: 'bg-mist text-ink font-semibold' },
}

export default function PaymentSettingsPage() {
  const { t, lang } = useT()
  const title = t('settings.nav.payment')
  useDocumentTitle(title)
  const s = useSettingsSection('payments')
  const v = s.value
  const enabledCount = v ? Object.values(v).filter(Boolean).length : 0

  return (
    <SettingsShell section="payment" title={title} description={t('settings.payment.description')}>
      {s.error ? (
        <SettingsError onRetry={s.reload} />
      ) : s.loading || !v ? (
        <SettingsSkeleton cards={1} />
      ) : (
        <>
          <div className="flex items-start gap-3 rounded-lg border border-info/20 bg-info-soft px-4 py-3 text-[13px] text-info">
            <ShieldCheck className="mt-px size-4 shrink-0" aria-hidden />
            <p>{t('settings.payment.securityNote')}</p>
          </div>
          <Card
            title={t('settings.payment.methods')}
            description={t('settings.payment.methodsDesc')}
            actions={<Badge tone={enabledCount ? 'success' : 'neutral'}>{t('settings.payment.enabledCount', { count: enabledCount, total: PAYMENT_METHODS.length })}</Badge>}
            padded={false}
          >
            <ul className="divide-y divide-line-soft border-t border-line-soft">
              {PAYMENT_METHODS.map((m) => {
                const mark = MARKS[m.id]
                return (
                  <li key={m.id} className={cn('flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-4', !v[m.id] && 'bg-mist/40')}>
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      <span dir="ltr" className={cn('grid h-9 w-16 shrink-0 place-items-center rounded-md border border-line-soft text-[13px]', mark.className)} aria-hidden>
                        {mark.text}
                      </span>
                      <Switch
                        className="min-w-0 flex-1"
                        label={
                          <span className="inline-flex flex-wrap items-center gap-2">
                            {m[lang]}
                            {v[m.id] ? <Badge tone="success" dot>{t('common.enabled')}</Badge> : <Badge>{t('common.disabled')}</Badge>}
                          </span>
                        }
                        description={
                          <>
                            <span className="block">{t(`settings.payment.desc.${m.id}`)}</span>
                            <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-subtle">
                              <Lock className="size-3" aria-hidden />
                              {t('settings.payment.credentialsNote')}
                            </span>
                          </>
                        }
                        checked={v[m.id]}
                        onChange={(b) => s.setValue((prev) => ({ ...prev, [m.id]: b }))}
                      />
                    </div>
                    <Button variant="outline" size="sm" disabled className="self-start sm:self-center" title={t('settings.payment.configureLater')}>
                      {t('settings.payment.configure')}
                    </Button>
                  </li>
                )
              })}
            </ul>
          </Card>
          <SaveBar dirty={s.dirty} saving={s.saving} onSave={s.save} onDiscard={s.discard} />
        </>
      )}
    </SettingsShell>
  )
}
