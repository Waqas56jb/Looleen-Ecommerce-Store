import { ArrowRight, Eye, MessageCircle, MoreHorizontal, Printer, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Dropdown, IconButton, type MenuItem } from '@/components/ui'
import { useT } from '@/i18n'
import type { AdminOrder, OrderStatus } from '@/types'
import { nextStatuses, openWhatsApp } from './orderUtils'

export function OrderRowActions({ order, onStatus }: { order: AdminOrder; onStatus: (o: AdminOrder, s: OrderStatus) => void }) {
  const { t } = useT()
  const navigate = useNavigate()
  const next = nextStatuses(order.status)
  const items: MenuItem[] = [
    { label: t('orders.actions.view'), icon: <Eye />, onClick: () => navigate(`/orders/${order.id}`) },
    { label: t('orders.actions.print'), icon: <Printer />, onClick: () => navigate(`/orders/${order.id}?print=1`) },
    { label: t('orders.actions.whatsapp'), icon: <MessageCircle />, onClick: () => openWhatsApp(order.customerPhone) },
  ]
  if (next.length) {
    items.push({ divider: true, label: '' })
    items.push(
      ...next.map<MenuItem>((s) => ({
        label: t('orders.actions.markAs', { status: t(`status.${s}`) }),
        icon: s === 'cancelled' ? <XCircle /> : <ArrowRight className="rtl:-scale-x-100" />,
        danger: s === 'cancelled',
        onClick: () => onStatus(order, s),
      })),
    )
  }
  return (
    <Dropdown
      widthClass="w-60"
      items={items}
      trigger={({ toggle, open }) => (
        <IconButton label={t('orders.actions.more')} size="sm" onClick={toggle} aria-expanded={open} aria-haspopup="menu">
          <MoreHorizontal />
        </IconButton>
      )}
    />
  )
}
