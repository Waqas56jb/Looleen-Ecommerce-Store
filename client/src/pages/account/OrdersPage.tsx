import { useMemo, useState } from 'react'
import { Package, SearchX } from 'lucide-react'
import { AccountPageHeader, FilterChips, PanelSkeleton } from '@/components/account/AccountUI'
import { OrderList } from '@/components/account/OrderList'
import { EmptyState, ErrorState } from '@/components/common'
import { useAsync, useDocumentMeta } from '@/hooks'
import { useT } from '@/i18n'
import { getOrders } from '@/services/orderService'
import type { Order, OrderStatus } from '@/types'

type Filter = 'all' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

const GROUPS: Record<Exclude<Filter, 'all'>, OrderStatus[]> = {
  processing: ['processing', 'confirmed', 'packed'],
  shipped: ['shipped', 'out_for_delivery'],
  delivered: ['delivered'],
  cancelled: ['cancelled'],
}

const matches = (o: Order, f: Filter) => f === 'all' || GROUPS[f].includes(o.status)

export default function OrdersPage() {
  const { t } = useT()
  useDocumentMeta(t('account.orders.metaTitle'), t('account.orders.metaDesc'))
  const { data, loading, error, reload } = useAsync(() => getOrders(), [])
  const [filter, setFilter] = useState<Filter>('all')

  const options = useMemo(
    () =>
      (['all', 'processing', 'shipped', 'delivered', 'cancelled'] as Filter[]).map((id) => ({
        id,
        label: t(`account.orders.${id}`),
        count: data ? data.filter((o) => matches(o, id)).length : undefined,
      })),
    [data, t],
  )
  const visible = data?.filter((o) => matches(o, filter)) ?? []

  return (
    <div>
      <AccountPageHeader title={t('account.orders.title')} description={t('account.orders.desc')} />
      {loading ? (
        <PanelSkeleton rows={4} />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : !data?.length ? (
        <div className="rounded-xs border border-line bg-white">
          <EmptyState icon={<Package />} title={t('empty.ordersTitle')} description={t('empty.ordersDesc')} action={{ label: t('common.shopNow'), to: '/best-sellers' }} />
        </div>
      ) : (
        <>
          <FilterChips options={options} value={filter} onChange={setFilter} label={t('account.orders.filterLabel')} className="mb-6" />
          {visible.length ? (
            <OrderList orders={visible} />
          ) : (
            <div className="rounded-xs border border-line bg-white">
              <EmptyState compact icon={<SearchX />} title={t('account.orders.emptyFilter')} description={t('account.orders.emptyFilterDesc')} action={{ label: t('account.orders.showAll'), onClick: () => setFilter('all') }} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
