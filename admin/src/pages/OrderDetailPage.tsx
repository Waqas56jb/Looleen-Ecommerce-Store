import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { ChevronDown, Mail, MessageCircle, Phone, Printer, RefreshCw, RotateCcw, ShoppingBag, XCircle } from 'lucide-react'
import { Button, Dropdown, EmptyState, ErrorState, PageHeader, PageSkeleton, StatusBadge } from '@/components/ui'
import { EntityActivityCard } from '@/components/orders/OrderActivityCard'
import { OrderInvoicePrint } from '@/components/orders/OrderInvoicePrint'
import { OrderItemsCard } from '@/components/orders/OrderItemsCard'
import { OrderNotesCard } from '@/components/orders/OrderNotesCard'
import { AddressCard, CustomerCard, PaymentCard, ShippingCard } from '@/components/orders/OrderSideCards'
import { OrderTimelineCard } from '@/components/orders/OrderTimelineCard'
import { canCancel, canRefund, nextStatuses, openWhatsApp } from '@/components/orders/orderUtils'
import { RefundModal } from '@/components/orders/RefundModal'
import { UpdateStatusModal } from '@/components/orders/UpdateStatusModal'
import { useAsync, useDocumentTitle } from '@/hooks'
import { useT } from '@/i18n'
import { getOrder } from '@/services/orderService'
import { formatDateTime } from '@/utils'

export default function OrderDetailPage() {
  const { id = '' } = useParams()
  const { t, lang } = useT()
  const [params, setParams] = useSearchParams()
  const { data: order, loading, error, reload } = useAsync(() => getOrder(id), [id])
  const [modal, setModal] = useState<'status' | 'cancel' | 'refund' | null>(null)
  useDocumentTitle(order ? `${t('orders.detail.orderTitle')} ${order.number}` : t('orders.title'))

  // Opened from the list's "Print invoice" action
  const wantsPrint = params.get('print') === '1'
  useEffect(() => {
    if (!order || !wantsPrint) return
    setParams((p) => {
      const n = new URLSearchParams(p)
      n.delete('print')
      return n
    }, { replace: true })
    const timer = setTimeout(() => window.print(), 400)
    return () => clearTimeout(timer)
  }, [order, wantsPrint, setParams])

  const crumbs = [{ label: t('nav.orders'), to: '/orders' }]
  if (loading && !order) return <PageSkeleton stats={0} rows={8} />
  if (error) return <ErrorState onRetry={reload} />
  if (!order)
    return (
      <>
        <PageHeader title={t('orders.detail.notFoundTitle')} breadcrumbs={crumbs} />
        <div className="card">
          <EmptyState icon={<ShoppingBag />} title={t('orders.detail.notFoundTitle')} description={t('orders.detail.notFoundDesc')} action={{ label: t('orders.detail.back'), to: '/orders' }} />
        </div>
      </>
    )

  const hasNext = nextStatuses(order.status).length > 0

  return (
    <>
      <div className="no-print">
        <PageHeader
          breadcrumbs={[...crumbs, { label: order.number }]}
          title={
            <>
              {t('orders.detail.orderTitle')}{' '}
              <span dir="ltr" className="tabular-nums">
                #{order.number}
              </span>
            </>
          }
          meta={
            <>
              <StatusBadge status={order.status} />
              <StatusBadge status={order.paymentStatus} />
            </>
          }
          description={t('orders.detail.placedOn', { date: formatDateTime(order.createdAt, lang) })}
          actions={
            <>
              <Dropdown
                items={[
                  { label: t('orders.actions.whatsapp'), icon: <MessageCircle />, onClick: () => openWhatsApp(order.customerPhone) },
                  { label: t('orders.actions.call'), icon: <Phone />, onClick: () => (window.location.href = `tel:${order.customerPhone.replace(/\s/g, '')}`) },
                  { label: t('orders.actions.email'), icon: <Mail />, onClick: () => (window.location.href = `mailto:${order.customerEmail}?subject=${encodeURIComponent(`${t('orders.detail.orderTitle')} ${order.number}`)}`) },
                ]}
                trigger={({ toggle, open }) => (
                  <Button variant="outline" onClick={toggle} aria-expanded={open}>
                    {t('orders.actions.contact')}
                    <ChevronDown className="size-4 text-subtle" aria-hidden />
                  </Button>
                )}
              />
              <Button variant="outline" icon={<Printer className="size-4" />} onClick={() => window.print()}>
                {t('common.print')}
              </Button>
              {canRefund(order) && (
                <Button variant="outline" icon={<RotateCcw className="size-4" />} onClick={() => setModal('refund')}>
                  {t('orders.actions.refund')}
                </Button>
              )}
              {canCancel(order.status) && (
                <Button variant="outline" icon={<XCircle className="size-4" />} onClick={() => setModal('cancel')} className="text-error hover:text-error">
                  {t('orders.actions.cancel')}
                </Button>
              )}
              {hasNext && (
                <Button icon={<RefreshCw className="size-4" />} onClick={() => setModal('status')}>
                  {t('orders.actions.updateStatus')}
                </Button>
              )}
            </>
          }
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="min-w-0 space-y-6 lg:col-span-2">
            <OrderItemsCard order={order} />
            <OrderTimelineCard order={order} />
            <OrderNotesCard order={order} onAdded={reload} />
            <EntityActivityCard entity="order" entityId={order.id} version={order.updatedAt + order.notes.length} />
          </div>
          <div className="min-w-0 space-y-6">
            <CustomerCard order={order} />
            <AddressCard order={order} />
            <PaymentCard order={order} />
            <ShippingCard order={order} />
          </div>
        </div>
      </div>

      <OrderInvoicePrint order={order} />

      <UpdateStatusModal order={order} open={modal === 'status' || modal === 'cancel'} initialStatus={modal === 'cancel' ? 'cancelled' : undefined} onClose={() => setModal(null)} onDone={reload} />
      <RefundModal order={order} open={modal === 'refund'} onClose={() => setModal(null)} onDone={reload} />
    </>
  )
}
