import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { SmartImage, Money } from '@/components/common'
import { useT } from '@/i18n'
import type { Order } from '@/types'
import { cn, formatDate } from '@/utils'
import { OrderStatusBadge } from './OrderStatus'

/** Overlapping product thumbnails with a "+n" counter */
export function OrderThumbs({ order, max = 3, size = 'md' }: { order: Order; max?: number; size?: 'sm' | 'md' }) {
  const { t } = useT()
  const shown = order.items.slice(0, max)
  const extra = order.items.length - shown.length
  const box = size === 'md' ? 'size-12' : 'size-10'
  return (
    <div className="flex items-center">
      {shown.map((item, i) => (
        <SmartImage
          key={`${item.productId}-${i}`}
          src={item.image}
          alt={item.name}
          width={120}
          height={120}
          wrapperClassName={cn(box, 'shrink-0 rounded-xs border-2 border-white bg-mist', i > 0 && '-ms-3')}
        />
      ))}
      {extra > 0 && (
        <span className={cn(box, '-ms-3 grid shrink-0 place-items-center rounded-xs border-2 border-white bg-blush text-xs font-semibold text-ink')}>
          {t('account.orders.more', { count: extra })}
        </span>
      )}
    </div>
  )
}

const itemCount = (o: Order) => o.items.reduce((s, i) => s + i.quantity, 0)

/** Orders as a table on md+ and stacked cards on mobile */
export function OrderList({ orders, compact }: { orders: Order[]; compact?: boolean }) {
  const { t, lang } = useT()
  const countLabel = (o: Order) => {
    const n = itemCount(o)
    return n === 1 ? t('account.orders.oneItem') : t('account.orders.itemsCount', { count: n })
  }
  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xs border border-line bg-white md:block">
        <table className="w-full text-sm">
          <thead className="bg-mist/70 text-xs tracking-wide text-muted uppercase">
            <tr>
              <th scope="col" className="px-5 py-3 text-start font-medium">{t('account.orders.order')}</th>
              {!compact && <th scope="col" className="px-5 py-3 text-start font-medium">{t('account.orders.items')}</th>}
              <th scope="col" className="px-5 py-3 text-start font-medium">{t('account.orders.status')}</th>
              <th scope="col" className="px-5 py-3 text-end font-medium">{t('account.orders.total')}</th>
              <th scope="col" className="px-5 py-3"><span className="sr-only">{t('account.orders.view')}</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.map((o) => (
              <tr key={o.id} className="transition-colors hover:bg-ivory/60">
                <td className="px-5 py-4 align-middle">
                  <span className="block font-semibold text-ink" dir="ltr">{o.number}</span>
                  <span className="mt-0.5 block text-xs text-muted">{formatDate(o.createdAt, lang)}</span>
                </td>
                {!compact && (
                  <td className="px-5 py-4 align-middle">
                    <div className="flex items-center gap-3">
                      <OrderThumbs order={o} />
                      <span className="text-xs text-muted">{countLabel(o)}</span>
                    </div>
                  </td>
                )}
                <td className="px-5 py-4 align-middle"><OrderStatusBadge status={o.status} /></td>
                <td className="px-5 py-4 text-end align-middle font-semibold tabular-nums"><Money value={o.total} /></td>
                <td className="px-5 py-4 text-end align-middle">
                  <Link to={`/account/orders/${o.id}`} className="group inline-flex items-center gap-1 text-sm font-medium whitespace-nowrap text-ink hover:text-rose">
                    <span className="link-underline">{t('account.orders.view')}</span>
                    <ChevronRight className="size-4 rtl:-scale-x-100" aria-hidden />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {orders.map((o) => (
          <li key={o.id}>
            <Link to={`/account/orders/${o.id}`} className="block rounded-xs border border-line bg-white p-4 transition-colors active:bg-mist">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink" dir="ltr">{o.number}</p>
                  <p className="mt-0.5 text-xs text-muted">{formatDate(o.createdAt, lang)}</p>
                </div>
                <OrderStatusBadge status={o.status} />
              </div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <div className="flex items-center gap-3">
                  <OrderThumbs order={o} size="sm" />
                  <span className="text-xs text-muted">{countLabel(o)}</span>
                </div>
                <div className="text-end">
                  <p className="font-semibold tabular-nums"><Money value={o.total} /></p>
                  <p className="mt-0.5 inline-flex items-center gap-0.5 text-xs font-medium text-rose">
                    {t('account.orders.view')}
                    <ChevronRight className="size-3.5 rtl:-scale-x-100" aria-hidden />
                  </p>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
