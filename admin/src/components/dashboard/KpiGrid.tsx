import { Clock, Package, Receipt, RotateCcw, ShoppingBag, TriangleAlert, Users, Wallet } from 'lucide-react'
import { Money, StatCard } from '@/components/ui'
import { useT } from '@/i18n'
import type { DashboardStats } from '@/types'
import { formatNumber } from '@/utils'

export function KpiGrid({ stats, loading }: { stats?: DashboardStats; loading: boolean }) {
  const { t } = useT()
  const vs = t('common.vsPrevious')
  const busy = loading && !stats
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t('dashboard.kpi.revenue')} icon={<Wallet />} loading={busy} value={<Money value={stats?.revenue.value ?? 0} />} change={stats?.revenue.change} period={vs} />
        <StatCard label={t('dashboard.kpi.orders')} icon={<ShoppingBag />} loading={busy} value={formatNumber(stats?.orders.value ?? 0)} change={stats?.orders.change} period={vs} />
        <StatCard label={t('dashboard.kpi.customers')} icon={<Users />} loading={busy} value={formatNumber(stats?.customers.value ?? 0)} change={stats?.customers.change} period={vs} />
        <StatCard label={t('dashboard.kpi.productsSold')} icon={<Package />} loading={busy} value={formatNumber(stats?.productsSold.value ?? 0)} change={stats?.productsSold.change} period={vs} />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={t('dashboard.kpi.pendingOrders')}
          icon={<Clock />}
          tone="warning"
          loading={busy}
          value={formatNumber(stats?.pendingOrders ?? 0)}
          period={t('dashboard.kpi.pendingHint')}
          href="/orders?status=pending"
        />
        <StatCard
          label={t('dashboard.kpi.lowStock')}
          icon={<TriangleAlert />}
          tone={stats && stats.lowStock > 0 ? 'error' : 'default'}
          loading={busy}
          value={formatNumber(stats?.lowStock ?? 0)}
          period={t('dashboard.kpi.lowStockHint')}
          href="/inventory?status=low_stock"
        />
        <StatCard label={t('dashboard.kpi.returns')} icon={<RotateCcw />} loading={busy} value={formatNumber(stats?.returns ?? 0)} period={t('dashboard.kpi.returnsHint')} href="/returns" inverse />
        <StatCard label={t('dashboard.kpi.aov')} icon={<Receipt />} loading={busy} value={<Money value={stats?.averageOrderValue.value ?? 0} />} change={stats?.averageOrderValue.change} period={vs} />
      </div>
    </div>
  )
}
