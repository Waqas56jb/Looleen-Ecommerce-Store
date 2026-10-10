import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Card, ErrorState, Input, PageHeader, PageSkeleton, Switch } from '@/components/ui'
import { useAsync, useDocumentTitle } from '@/hooks'
import { useT } from '@/i18n'
import { getRetailers, getRules, saveRules } from '@/services/sourcingService'

export default function SourcingRulesPage() {
  const { t, lang } = useT()
  const R = (k: string, v?: Record<string, string | number>) => t(`sourcing.rules.${k}`, v)
  useDocumentTitle(R('title'))
  const rules = useAsync(() => getRules(), [])
  const retailers = useAsync(() => getRetailers(), [])
  // Edits start from the saved rules; null = untouched
  const [edited, setForm] = useState<{ minRetailers: string; maxPriceAgeDays: string; minMargin: string; requireVerifiedCost: boolean } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  const form = edited ?? {
    minRetailers: String(rules.data?.minRetailers ?? 4),
    maxPriceAgeDays: String(rules.data?.maxPriceAgeDays ?? 30),
    minMargin: String(Math.round((rules.data?.minMargin ?? 0.25) * 100)),
    requireVerifiedCost: rules.data?.requireVerifiedCost ?? true,
  }

  if ((rules.loading && !rules.data) || (retailers.loading && !retailers.data)) return <PageSkeleton stats={0} rows={6} />
  if (rules.error || retailers.error) return <ErrorState onRetry={() => (rules.reload(), retailers.reload())} />

  const save = async () => {
    const e: Record<string, string> = {}
    const min = Number(form.minRetailers)
    const age = Number(form.maxPriceAgeDays)
    const margin = Number(form.minMargin)
    if (!Number.isInteger(min) || min < 1 || min > 12) e.minRetailers = R('errMin')
    if (!Number.isInteger(age) || age < 1 || age > 365) e.maxPriceAgeDays = R('errAge')
    if (!(margin >= 0 && margin <= 90)) e.minMargin = R('errMargin')
    setErrors(e)
    if (Object.keys(e).length) return
    setBusy(true)
    try {
      await saveRules({ minRetailers: min, maxPriceAgeDays: age, minMargin: margin / 100, requireVerifiedCost: form.requireVerifiedCost })
      toast.success(R('saved'))
      setForm(null)
      rules.reload()
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title={R('title')} description={R('description')} breadcrumbs={[{ label: t('nav.sourcing') }, { label: R('title') }]} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card
          title={R('rulesCard')}
          className="xl:col-span-1"
          footer={
            <div className="flex justify-end">
              <Button onClick={save} loading={busy}>
                {t('common.saveChanges')}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Input label={R('minRetailers')} hint={R('minRetailersHint')} type="number" min={1} max={12} value={form.minRetailers} onChange={(e) => setForm({ ...form, minRetailers: e.target.value })} error={errors.minRetailers} dir="ltr" />
            <Input label={R('maxAge')} hint={R('maxAgeHint')} type="number" min={1} max={365} value={form.maxPriceAgeDays} onChange={(e) => setForm({ ...form, maxPriceAgeDays: e.target.value })} error={errors.maxPriceAgeDays} dir="ltr" />
            <Input label={R('minMargin')} hint={R('minMarginHint')} type="number" min={0} max={90} value={form.minMargin} onChange={(e) => setForm({ ...form, minMargin: e.target.value })} error={errors.minMargin} dir="ltr" />
            <Switch checked={form.requireVerifiedCost} onChange={(v) => setForm({ ...form, requireVerifiedCost: v })} label={R('requireCost')} description={R('requireCostHint')} />
          </div>
        </Card>

        <Card title={R('retailers')} description={R('retailersDesc')} className="xl:col-span-2" padded={false}>
          <ul className="divide-y divide-line-soft border-t border-line-soft">
            {retailers.data?.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start gap-x-4 gap-y-1.5 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[13px] font-medium text-ink hover:text-rose-dark hover:underline">
                    {r.name}
                    <ExternalLink className="size-3" aria-hidden />
                  </a>
                  <p className="text-xs text-muted">{lang === 'ar' ? (r.noteAr ?? r.note) : r.note}</p>
                  {r.brands && <p className="text-xs text-subtle">{R('onlyBrands', { brands: r.brands.join(', ') })}</p>}
                </div>
                <Badge tone={r.collection === 'automatic' ? 'success' : 'champagne'}>{t(`sourcing.collection.${r.collection}`)}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  )
}
