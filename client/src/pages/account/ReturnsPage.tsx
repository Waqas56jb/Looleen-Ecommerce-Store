import { useSearchParams } from 'react-router-dom'
import { RotateCcw, ShieldCheck } from 'lucide-react'
import { AccountPageHeader, Panel, PanelSkeleton } from '@/components/account/AccountUI'
import { ReturnCard, ReturnForm } from '@/components/account/Returns'
import { ArrowLink, EmptyState, ErrorState } from '@/components/common'
import { useAsync, useDocumentMeta } from '@/hooks'
import { useT } from '@/i18n'
import { getOrders } from '@/services/orderService'
import { useAccountStore } from '@/store/account'

export default function ReturnsPage() {
  const { t } = useT()
  useDocumentMeta(t('account.returns.metaTitle'), t('account.returns.metaDesc'))
  const [params] = useSearchParams()
  const returns = useAccountStore((s) => s.returns)
  const orders = useAsync(() => getOrders(), [])
  const prefill = params.get('order')

  return (
    <div className="space-y-8">
      <AccountPageHeader title={t('account.returns.title')} description={t('account.returns.desc')} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel title={t('account.returns.create')} description={t('account.returns.createDesc')}>
          {orders.loading ? (
            <PanelSkeleton bare rows={2} />
          ) : orders.error ? (
            <ErrorState onRetry={orders.reload} />
          ) : (
            <ReturnForm orders={orders.data ?? []} initialOrder={prefill} />
          )}
        </Panel>

        <aside className="h-fit rounded-xs bg-blush/60 p-5 sm:p-6" aria-labelledby="return-policy">
          <ShieldCheck className="size-6 text-rose" strokeWidth={1.6} aria-hidden />
          <h2 id="return-policy" className="mt-3 font-serif text-xl font-medium tracking-[-0.015em]">
            {t('account.returns.policyTitle')}
          </h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink/85">
            {['policy1', 'policy2', 'policy3', 'policy4'].map((k) => (
              <li key={k} className="flex gap-2.5">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-rose" aria-hidden />
                {t(`account.returns.${k}`)}
              </li>
            ))}
          </ul>
          <ArrowLink to="/return-policy" className="mt-5">
            {t('account.returns.policyLink')}
          </ArrowLink>
        </aside>
      </div>

      <section aria-labelledby="return-requests">
        <h2 id="return-requests" className="heading-card mb-4">
          {t('account.returns.requests')}
        </h2>
        {returns.length === 0 ? (
          <div className="rounded-xs border border-line bg-white">
            <EmptyState compact icon={<RotateCcw />} title={t('empty.returnsTitle')} description={t('empty.returnsDesc')} />
          </div>
        ) : (
          <ul className="space-y-4">
            {returns.map((r) => (
              <li key={r.id}>
                <ReturnCard request={r} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
