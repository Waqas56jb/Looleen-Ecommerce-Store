import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Check } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Select, Textarea } from '@/components/common'
import { RETURN_REASONS } from '@/data/account'
import { useT } from '@/i18n'
import { useAccountStore } from '@/store/account'
import type { Order, ReturnRequest, ReturnStatus } from '@/types'
import { cn, formatDate } from '@/utils'

export const RETURN_FLOW: ReturnStatus[] = ['requested', 'approved', 'pickup_scheduled', 'received', 'refunded']

/** Shows a stored reason (English label or id) in the current language */
export function useReasonLabel() {
  const { lang } = useT()
  return (reason: string) => {
    const r = RETURN_REASONS.find((x) => x.id === reason || x.en === reason)
    return r ? r[lang] : reason
  }
}

export function ReturnStepper({ request }: { request: ReturnRequest }) {
  const { t, lang } = useT()
  const reached = RETURN_FLOW.indexOf(request.status)
  const start = new Date(request.createdAt).getTime()
  return (
    <ol className="grid grid-cols-1 gap-4 sm:grid-cols-5 sm:gap-0">
      {RETURN_FLOW.map((s, i) => {
        const done = i <= reached
        // Mock dates: each completed stage is ~1.5 days after the previous one
        const date = done ? new Date(start + i * 36 * 3_600_000).toISOString() : undefined
        return (
          <li key={s} className="relative flex items-center gap-3 sm:flex-col sm:items-center sm:gap-2 sm:text-center">
            {i < RETURN_FLOW.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  'absolute start-[13px] top-7 h-[calc(100%-12px)] w-px sm:start-[50%] sm:top-[13px] sm:h-px sm:w-full',
                  i < reached ? 'bg-ink' : 'bg-line',
                )}
              />
            )}
            <span
              className={cn(
                'relative z-10 grid size-7 shrink-0 place-items-center rounded-full border text-[11px] font-semibold',
                done ? 'border-ink bg-ink text-ivory' : 'border-line bg-white text-muted',
                i === reached && 'ring-4 ring-rose/20',
              )}
            >
              {done ? <Check className="size-3.5" aria-hidden /> : i + 1}
            </span>
            <span>
              <span className={cn('block text-xs font-medium', done ? 'text-ink' : 'text-muted')}>{t(`status.${s}`)}</span>
              {date && <span className="block text-[11px] text-muted">{formatDate(date, lang, { day: 'numeric', month: 'short' })}</span>}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export function ReturnCard({ request }: { request: ReturnRequest }) {
  const { t, lang } = useT()
  const reasonLabel = useReasonLabel()
  const done = request.status === 'refunded'
  return (
    <article className="rounded-xs border border-line bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-ink">{request.productName}</h3>
          <p className="mt-1 text-xs text-muted">
            <span dir="ltr">{request.orderNumber}</span> · {t('account.returns.requestedOn', { date: formatDate(request.createdAt, lang) })}
          </p>
        </div>
        <Badge tone={done ? 'success' : 'champagne'}>{t(`status.${request.status}`)}</Badge>
      </div>
      <p className="mt-3 text-sm text-ink">
        <span className="text-muted">{t('account.returns.reason')}:</span> {reasonLabel(request.reason)}
      </p>
      {request.description && <p className="mt-1 text-sm leading-relaxed text-muted">{request.description}</p>}
      <div className="mt-5 border-t border-line pt-5">
        <ReturnStepper request={request} />
      </div>
    </article>
  )
}

export function ReturnForm({ orders, initialOrder }: { orders: Order[]; initialOrder?: string | null }) {
  const { t, lang } = useT()
  const addReturn = useAccountStore((s) => s.addReturn)
  const delivered = useMemo(() => orders.filter((o) => o.status === 'delivered'), [orders])
  const initial = delivered.find((o) => o.number === initialOrder || o.id === initialOrder)?.number ?? ''
  const [orderNumber, setOrderNumber] = useState(initial)
  const [productId, setProductId] = useState('')
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => setOrderNumber(initial), [initial])

  const order = delivered.find((o) => o.number === orderNumber)
  const items = order?.items ?? []

  // Auto-pick the product when the order has only one
  useEffect(() => {
    setProductId(items.length === 1 ? items[0].productId : '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber])

  if (!delivered.length) return <p className="text-sm text-muted">{t('account.returns.noDelivered')}</p>

  const clearErr = (k: string) => errors[k] && setErrors((e) => ({ ...e, [k]: undefined }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!order) next.order = t('common.required')
    if (!productId) next.product = t('common.required')
    if (!reason) next.reason = t('common.required')
    if (description.trim().length < 10) next.description = t('account.returns.descMin')
    setErrors(next)
    if (Object.keys(next).length || !order) return
    const item = items.find((i) => i.productId === productId)
    const r = RETURN_REASONS.find((x) => x.id === reason)
    setLoading(true)
    await new Promise((res) => setTimeout(res, 400))
    addReturn({
      orderNumber: order.number,
      productName: item ? `${item.name}${item.variantLabel ? ` — ${item.variantLabel}` : ''}` : '',
      reason: r?.en ?? reason,
      description: description.trim(),
    })
    setLoading(false)
    setProductId(items.length === 1 ? items[0].productId : '')
    setReason('')
    setDescription('')
    toast.success(t('account.returns.submitted'))
  }

  return (
    <form noValidate onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Select
        label={t('account.returns.order')}
        placeholder={t('account.returns.selectOrder')}
        value={orderNumber}
        onChange={(e) => {
          setOrderNumber(e.target.value)
          clearErr('order')
        }}
        error={errors.order}
        options={delivered.map((o) => ({ value: o.number, label: `${o.number} · ${formatDate(o.createdAt, lang)}` }))}
      />
      <Select
        label={t('account.returns.product')}
        placeholder={t('account.returns.selectProduct')}
        value={productId}
        disabled={!order}
        onChange={(e) => {
          setProductId(e.target.value)
          clearErr('product')
        }}
        error={errors.product}
        options={items.map((i) => ({ value: i.productId, label: `${i.brandName} — ${i.name}${i.variantLabel ? ` (${i.variantLabel})` : ''}` }))}
      />
      <Select
        label={t('account.returns.reason')}
        placeholder={t('account.returns.selectReason')}
        value={reason}
        onChange={(e) => {
          setReason(e.target.value)
          clearErr('reason')
        }}
        error={errors.reason}
        wrapperClassName="sm:col-span-2"
        options={RETURN_REASONS.map((r) => ({ value: r.id, label: r[lang] }))}
      />
      <div className="sm:col-span-2">
        <Textarea
          label={t('account.returns.description')}
          placeholder={t('account.returns.descriptionPh')}
          value={description}
          maxLength={600}
          onChange={(e) => {
            setDescription(e.target.value)
            clearErr('description')
          }}
          error={errors.description}
        />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" variant="dark" size="lg" loading={loading} className="w-full sm:w-auto">
          {t('account.returns.submit')}
        </Button>
      </div>
    </form>
  )
}
