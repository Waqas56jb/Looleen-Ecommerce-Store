import { Truck, Zap } from 'lucide-react'
import { AddressLines } from '@/components/account/AddressForm'
import { RadioCard } from '@/components/common'
import { STORE_CONFIG } from '@/config/store'
import { useT } from '@/i18n'
import { SHIPPING_OPTIONS } from '@/services/orderService'
import { computeTotals, useCartStore } from '@/store/cart'
import { useCheckoutStore } from '@/store/checkout'
import { formatPrice } from '@/utils'
import { deliveryRange } from './helpers'
import { StepHeading, StepNav } from './StepHeading'

export function ShippingStep({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const { t, lang } = useT()
  const items = useCartStore((s) => s.items)
  const coupon = useCartStore((s) => s.coupon)
  const method = useCheckoutStore((s) => s.shippingMethod)
  const setMethod = useCheckoutStore((s) => s.setShippingMethod)
  const address = useCheckoutStore((s) => s.address)

  return (
    <section aria-labelledby="step-shipping">
      <StepHeading id="step-shipping" title={t('checkout.shipping.title')} subtitle={t('checkout.shipping.subtitle')} />

      {address && (
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3 rounded-xs bg-mist px-4 py-3.5">
          <div>
            <p className="mb-1 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">{t('checkout.shipping.deliverTo')}</p>
            <AddressLines address={address} className="text-[13px] leading-relaxed text-muted not-italic" />
          </div>
          <button type="button" onClick={onBack} className="text-xs font-medium text-ink underline underline-offset-4 hover:text-rose">
            {t('checkout.review.edit')}
          </button>
        </div>
      )}

      <fieldset>
        <legend className="sr-only">{t('checkout.shipping.title')}</legend>
        <div className="grid gap-3">
          {SHIPPING_OPTIONS.map((opt) => {
            const price = computeTotals(items, coupon, opt.id).shipping
            const Icon = opt.id === 'express' ? Zap : Truck
            return (
              <RadioCard key={opt.id} name="shipping" value={opt.id} checked={method === opt.id} onChange={() => setMethod(opt.id)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <Icon className="mt-0.5 size-5 shrink-0 text-rose" strokeWidth={1.6} aria-hidden />
                    <div>
                      <p className="text-[15px] font-medium text-ink">{t(`checkout.shipping.${opt.id}`)}</p>
                      <p className="mt-0.5 text-[13px] text-muted">{t(`checkout.shipping.${opt.id}Desc`, { days: opt.days })}</p>
                      <p className="mt-1.5 text-xs text-ink">{t('checkout.shipping.arrives', { date: deliveryRange(opt.id, lang) })}</p>
                      {opt.id === 'standard' && (
                        <p className="mt-1 text-xs text-success">{t('checkout.shipping.freeOver', { amount: formatPrice(STORE_CONFIG.freeShippingThreshold, lang) })}</p>
                      )}
                    </div>
                  </div>
                  <span className={price === 0 ? 'text-sm font-semibold text-success' : 'text-sm font-semibold tabular-nums text-ink'}>{price === 0 ? t('common.free') : formatPrice(price, lang)}</span>
                </div>
              </RadioCard>
            )
          })}
        </div>
      </fieldset>

      <StepNav onBack={onBack} onNext={onDone} />
    </section>
  )
}
