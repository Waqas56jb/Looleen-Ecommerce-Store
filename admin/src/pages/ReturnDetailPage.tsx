import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Check, PackageCheck, RotateCcw, Truck, Undo2, X } from 'lucide-react'
import { Avatar, Button, ButtonLink, Card, EmptyState, ErrorState, Img, KeyValue, Money, PageHeader, PageSkeleton, StatusBadge, Thumb } from '@/components/ui'
import { EntityActivityCard } from '@/components/orders/OrderActivityCard'
import { ACTION_LABEL, nextReturnActions, ReturnActionDialog, type ReturnAction } from '@/components/returns/ReturnActionDialog'
import { ReturnTimelineCard } from '@/components/returns/ReturnTimelineCard'
import { useReasonLabel } from '@/components/returns/useReasonLabel'
import { useAsync, useDocumentTitle } from '@/hooks'
import { useT } from '@/i18n'
import { getCustomer } from '@/services/customerService'
import { getReturn } from '@/services/moderationService'
import { getOrder } from '@/services/orderService'
import { formatDate, formatDateTime, paymentName } from '@/utils'

const ICON: Record<ReturnAction, React.ReactNode> = {
  approved: <Check className="size-4" />,
  rejected: <X className="size-4" />,
  pickup_scheduled: <Truck className="size-4" />,
  received: <PackageCheck className="size-4" />,
  refunded: <RotateCcw className="size-4" />,
}

export default function ReturnDetailPage() {
  const { id = '' } = useParams()
  const { t, lang } = useT()
  const reasonLabel = useReasonLabel()
  const { data: ret, loading, error, reload } = useAsync(() => getReturn(id), [id])
  const related = useAsync(async () => (ret ? Promise.all([getCustomer(ret.customerId), getOrder(ret.orderId)]) : undefined), [ret?.customerId, ret?.orderId])
  const [action, setAction] = useState<ReturnAction | null>(null)
  useDocumentTitle(ret ? `${t('orders.returns.detail.title')} ${ret.number}` : t('orders.returns.title'))

  const crumbs = [{ label: t('nav.returns'), to: '/returns' }]
  if (loading && !ret) return <PageSkeleton stats={0} rows={6} />
  if (error) return <ErrorState onRetry={reload} />
  if (!ret)
    return (
      <>
        <PageHeader title={t('orders.returns.detail.notFoundTitle')} breadcrumbs={crumbs} />
        <div className="card">
          <EmptyState icon={<Undo2 />} title={t('orders.returns.detail.notFoundTitle')} description={t('orders.returns.detail.notFoundDesc')} action={{ label: t('orders.returns.detail.back'), to: '/returns' }} />
        </div>
      </>
    )

  const [customer, order] = related.data ?? []
  const actions = nextReturnActions(ret.status)

  return (
    <>
      <PageHeader
        breadcrumbs={[...crumbs, { label: ret.number }]}
        title={
          <>
            {t('orders.returns.detail.title')}{' '}
            <span dir="ltr" className="tabular-nums">
              {ret.number}
            </span>
          </>
        }
        meta={<StatusBadge status={ret.status} />}
        description={t('orders.returns.detail.requestedOn', { date: formatDateTime(ret.createdAt, lang) })}
        actions={actions.map((a) => (
          <Button key={a} variant={a === 'rejected' ? 'outline' : 'primary'} icon={ICON[a]} onClick={() => setAction(a)} className={a === 'rejected' ? 'text-error hover:text-error' : undefined}>
            {t(ACTION_LABEL[a])}
          </Button>
        ))}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Card title={t('orders.returns.detail.request')}>
            <KeyValue
              cols={2}
              items={[
                { label: t('orders.returns.detail.reason'), value: reasonLabel(ret.reason) },
                { label: t('orders.returns.detail.quantity'), value: <span className="tabular-nums">{ret.quantity}</span> },
                { label: t('orders.returns.detail.amount'), value: <Money value={ret.amount} /> },
                { label: t('common.status'), value: <StatusBadge status={ret.status} /> },
              ]}
            />
            <div className="mt-5">
              <p className="text-[13px] font-medium text-ink">{t('orders.returns.detail.description')}</p>
              <blockquote className="mt-1.5 rounded-md border-s-2 border-line bg-mist px-3.5 py-2.5 text-[13px] leading-relaxed text-ink">{ret.description}</blockquote>
            </div>
            {ret.images.length > 0 && (
              <div className="mt-5">
                <p className="text-[13px] font-medium text-ink">{t('orders.returns.detail.images')}</p>
                <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {ret.images.map((src, i) => (
                    <a key={i} href={src.startsWith('photo-') ? `https://images.unsplash.com/${src}?w=1200` : src} target="_blank" rel="noreferrer" className="overflow-hidden rounded-md border border-line hover:border-ink/30">
                      <Img src={src} alt={`${t('orders.returns.detail.images')} ${i + 1}`} w={320} h={320} className="aspect-square w-full" />
                    </a>
                  ))}
                </div>
              </div>
            )}
            {actions.length === 0 && <p className="mt-5 border-t border-line-soft pt-4 text-[13px] text-muted">{t('orders.returns.detail.closed')}</p>}
          </Card>

          <ReturnTimelineCard ret={ret} />
          <EntityActivityCard entity="return" entityId={ret.id} version={String(ret.timeline.length)} />
        </div>

        <div className="min-w-0 space-y-6">
          <Card title={t('orders.returns.detail.customer')}>
            <div className="flex items-center gap-3">
              <Avatar name={ret.customerName} size="lg" />
              <div className="min-w-0">
                <Link to={`/customers/${ret.customerId}`} className="block truncate text-sm font-semibold text-ink hover:text-rose-dark hover:underline">
                  {ret.customerName}
                </Link>
                {customer && (
                  <>
                    <p className="truncate text-xs text-muted" dir="ltr">
                      {customer.email}
                    </p>
                    <p className="text-xs text-muted" dir="ltr">
                      {customer.phone}
                    </p>
                  </>
                )}
              </div>
            </div>
          </Card>

          <Card
            title={t('orders.returns.detail.order')}
            actions={
              <ButtonLink to={`/orders/${ret.orderId}`} variant="outline" size="xs">
                {t('orders.returns.detail.viewOrder')}
              </ButtonLink>
            }
          >
            <KeyValue
              items={[
                {
                  label: t('orders.col.order'),
                  value: (
                    <Link to={`/orders/${ret.orderId}`} dir="ltr" className="hover:underline">
                      {ret.orderNumber}
                    </Link>
                  ),
                },
                { label: t('orders.returns.detail.orderDate'), value: order ? formatDate(order.createdAt, lang) : '—' },
                { label: t('orders.returns.detail.orderStatus'), value: order ? <StatusBadge status={order.status} /> : '—' },
                { label: t('orders.returns.detail.payment'), value: order ? paymentName(order.paymentMethod, lang) : '—' },
                { label: t('orders.returns.detail.orderTotal'), value: order ? <Money value={order.total} /> : '—' },
              ]}
            />
          </Card>

          <Card title={t('orders.returns.detail.product')}>
            <div className="flex items-center gap-3">
              <Thumb src={ret.productImage} alt={ret.productName} size="lg" />
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-ink">{ret.productName}</p>
                <Link to={`/products/${ret.productId}`} className="mt-1 inline-block text-xs font-medium text-rose-dark hover:underline">
                  {t('orders.returns.detail.viewProduct')}
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <ReturnActionDialog ret={ret} action={action} onClose={() => setAction(null)} onDone={reload} />
    </>
  )
}
