import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { AddressLines } from '@/components/account/AddressForm'
import { PaymentMark, SmartImage, Money } from '@/components/common'
import { TotalsRows } from '@/components/cart/TotalsRows'
import { useT } from '@/i18n'
import { useCartStore } from '@/store/cart'
import { useCheckoutStore } from '@/store/checkout'
import type { CartTotals } from '@/types'
import { cn, formatPrice } from '@/utils'
import { deliveryRange, isCardMethod, paymentLabel, type CardDetails } from './helpers'
import { StepHeading, StepNav } from './StepHeading'

function Block({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  const { t } = useT()
  return (
    <div className="rounded-xs border border-line bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">{title}</h3>
        <button type="button" onClick={onEdit} className="min-h-8 text-xs font-medium text-ink underline underline-offset-4 hover:text-rose">
          {t('checkout.review.edit')}
        </button>
      </div>
      {children}
    </div>
  )
}

interface ReviewStepProps {
  totals: CartTotals
  card: CardDetails
  placing: boolean
  error: string | null
  onEdit: (step: number) => void
  onPlace: () => void
}

export function ReviewStep({ totals, card, placing, error, onEdit, onPlace }: ReviewStepProps) {
  const { t, lang } = useT()
  const items = useCartStore((s) => s.items)
  const coupon = useCartStore((s) => s.coupon)
  const { address, shippingMethod, paymentMethod } = useCheckoutStore()
  const [agreed, setAgreed] = useState(false)
  const [termsError, setTermsError] = useState(false)

  const place = () => {
    if (!agreed) {
      setTermsError(true)
      return
    }
    onPlace()
  }

  const [before, after] = t('checkout.review.terms').split('{terms}')

  return (
    <section aria-labelledby="step-review">
      <StepHeading id="step-review" title={t('checkout.review.title')} subtitle={t('checkout.review.subtitle')} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Block title={t('checkout.review.address')} onEdit={() => onEdit(0)}>
          {address && <AddressLines address={address} />}
        </Block>
        <div className="grid gap-4">
          <Block title={t('checkout.review.shipping')} onEdit={() => onEdit(1)}>
            <p className="text-sm font-medium text-ink">
              {t(`checkout.shipping.${shippingMethod}`)} · {totals.shipping === 0 ? t('common.free') : formatPrice(totals.shipping, lang)}
            </p>
            <p className="mt-0.5 text-xs text-muted">{deliveryRange(shippingMethod, lang)}</p>
          </Block>
          <Block title={t('checkout.review.payment')} onEdit={() => onEdit(2)}>
            {paymentMethod && (
              <div className="flex items-center gap-3">
                <PaymentMark id={paymentMethod} />
                <span className="text-sm text-ink">
                  {isCardMethod(paymentMethod) && card.number ? (
                    <span dir="ltr">•••• {card.number.replace(/\D/g, '').slice(-4)}</span>
                  ) : (
                    paymentLabel(paymentMethod, lang)
                  )}
                </span>
              </div>
            )}
          </Block>
        </div>
      </div>

      <div className="mt-4 rounded-xs border border-line bg-white p-5">
        <h3 className="mb-4 text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
          {t('checkout.review.items')} ({totals.itemCount})
        </h3>
        <ul className="divide-y divide-line">
          {items.map((i) => (
            <li key={i.key} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
              <SmartImage src={i.image} alt={i.name} width={120} height={150} wrapperClassName="w-14 shrink-0 aspect-[4/5] rounded-xs" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">{i.brandName}</p>
                <p className="line-clamp-1 text-sm text-ink">{i.name}</p>
                <p className="text-xs text-muted">
                  {i.variantLabel ? `${i.variantLabel} · ` : ''}
                  {t('checkout.summary.qty', { qty: i.quantity })}
                </p>
              </div>
              <span className="text-sm font-medium tabular-nums"><Money value={i.price * i.quantity} /></span>
            </li>
          ))}
        </ul>
        <TotalsRows
          className="mt-5 border-t border-line pt-5"
          subtotal={totals.subtotal}
          discount={totals.discount}
          vat={totals.vat}
          shipping={totals.shipping}
          total={totals.total}
          couponCode={coupon?.code}
          shippingLabel={t(`checkout.shipping.${shippingMethod}`)}
        />
      </div>

      <div className="mt-6">
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => {
              setAgreed(e.target.checked)
              if (e.target.checked) setTermsError(false)
            }}
            aria-invalid={termsError || undefined}
            aria-describedby={termsError ? 'terms-error' : undefined}
            className={cn('mt-0.5 size-[18px] shrink-0 accent-ink', termsError && 'outline outline-error')}
          />
          <span>
            {before}
            <Link to="/terms" target="_blank" className="font-medium underline underline-offset-4 hover:text-rose">
              {t('checkout.review.termsLink')}
            </Link>
            {after}
          </span>
        </label>
        {termsError && (
          <p id="terms-error" role="alert" className="mt-2 text-xs text-error">
            {t('checkout.review.termsError')}
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xs bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </p>
      )}

      <StepNav
        onBack={() => onEdit(2)}
        onNext={place}
        loading={placing}
        nextIcon={<Lock className="size-4" aria-hidden />}
        nextLabel={
          placing ? t('checkout.review.placing') : `${t('checkout.review.placeOrder')} · ${formatPrice(totals.total, lang)}`
        }
      />
    </section>
  )
}
