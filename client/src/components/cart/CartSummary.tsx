import { ArrowRight, Lock } from 'lucide-react'
import { AuthenticityMessage, ButtonLink, PaymentMarks } from '@/components/common'
import { useT } from '@/i18n'
import { useCartStore, useCartTotals } from '@/store/cart'
import { formatPrice } from '@/utils'
import { CouponForm } from './CouponForm'
import { TotalsRows } from './TotalsRows'

/** Order summary panel for the cart page (sticky on desktop) */
export function CartSummary() {
  const { t, lang } = useT()
  const totals = useCartTotals()
  const coupon = useCartStore((s) => s.coupon)

  return (
    <aside aria-labelledby="cart-summary-title" className="space-y-5 lg:sticky lg:top-28">
      <div className="rounded-xs border border-line bg-white p-5 sm:p-7">
        <h2 id="cart-summary-title" className="heading-card">
          {t('cart.summaryTitle')}
        </h2>
        <div className="mt-5 border-b border-line pb-5">
          <CouponForm />
        </div>
        <TotalsRows
          className="mt-5"
          subtotal={totals.subtotal}
          discount={totals.discount}
          vat={totals.vat}
          shipping={totals.shipping}
          total={totals.total}
          couponCode={coupon?.code}
          shippingLabel={t('cart.shippingStandard')}
        />
        <p className="mt-2 text-end text-xs text-muted">{t('cart.vatIncluded')}</p>
        <p className="mt-4 text-xs leading-relaxed text-muted">{t('cart.expressNote')}</p>

        <ButtonLink to="/checkout" size="lg" fullWidth className="mt-6" icon={<Lock className="size-4" aria-hidden />}>
          {t('cart.checkoutCta')}
          <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden />
        </ButtonLink>

        <p className="mt-4 rounded-xs bg-mist px-4 py-3 text-xs leading-relaxed text-ink">
          {t('cart.installments', { amount: formatPrice(Math.round((totals.total / 4) * 100) / 100, lang) })}
        </p>

        <div className="mt-5">
          <p className="mb-2 text-[11px] font-medium tracking-[0.14em] text-muted uppercase">{t('cart.secureCheckout')}</p>
          <PaymentMarks />
        </div>
      </div>
      <AuthenticityMessage compact />
    </aside>
  )
}

/** Mobile-only sticky checkout bar */
export function CartStickyBar() {
  const { t, lang } = useT()
  const totals = useCartTotals()
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ivory/95 px-4 py-3 shadow-lift backdrop-blur lg:hidden">
      <ButtonLink to="/checkout" size="lg" fullWidth icon={<Lock className="size-4" aria-hidden />}>
        {t('cart.stickyCheckout', { total: formatPrice(totals.total, lang) })}
      </ButtonLink>
    </div>
  )
}
