import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { AddressStep } from '@/components/checkout/AddressStep'
import { CheckoutSummary } from '@/components/checkout/CheckoutSummary'
import { EMPTY_CARD, isCardMethod, isCardValid, type CardDetails } from '@/components/checkout/helpers'
import { PaymentStep } from '@/components/checkout/PaymentStep'
import { ReviewStep } from '@/components/checkout/ReviewStep'
import { ShippingStep } from '@/components/checkout/ShippingStep'
import { StepIndicator } from '@/components/checkout/StepIndicator'
import { useDocumentMeta } from '@/hooks'
import { useT } from '@/i18n'
import { placeOrder } from '@/services/orderService'
import { computeTotals, useCartStore } from '@/store/cart'
import { useCheckoutStore } from '@/store/checkout'

export default function CheckoutPage() {
  const { t } = useT()
  useDocumentMeta(t('checkout.metaTitle'), t('checkout.metaDesc'))
  const navigate = useNavigate()

  const items = useCartStore((s) => s.items)
  const coupon = useCartStore((s) => s.coupon)
  const clearCart = useCartStore((s) => s.clearCart)
  const { step: storedStep, address, shippingMethod, paymentMethod, setStep, reset } = useCheckoutStore()

  // Card details stay in memory only — never persisted.
  const [card, setCard] = useState<CardDetails>(EMPTY_CARD)
  const [cardCleared, setCardCleared] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const placedRef = useRef(false)

  const totals = computeTotals(items, coupon, shippingMethod)

  // Never show a step whose prerequisites are missing (e.g. after a refresh)
  let step = Math.min(Math.max(storedStep, 0), 3)
  if (!address) step = 0
  else if (step === 3 && (!paymentMethod || (isCardMethod(paymentMethod) && !isCardValid(card)))) step = 2

  useEffect(() => {
    if (step !== storedStep) {
      if (storedStep === 3 && step === 2 && isCardMethod(paymentMethod)) setCardCleared(true)
      setStep(step)
    }
  }, [step, storedStep, paymentMethod, setStep])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

  if (items.length === 0 && !placedRef.current) return <Navigate to="/cart" replace />

  const go = (s: number) => {
    setError(null)
    setStep(s)
  }

  const submitOrder = async () => {
    if (!address || !paymentMethod) return
    setPlacing(true)
    setError(null)
    try {
      const deliveryAddress = { ...address }
      delete deliveryAddress.id
      const order = await placeOrder({ items, coupon, address: deliveryAddress, shippingMethod, paymentMethod })
      placedRef.current = true
      navigate(`/order-success?order=${encodeURIComponent(order.id)}`, { replace: true })
      clearCart()
      reset()
      toast.success(t('toast.orderPlaced'))
    } catch {
      setError(t('checkout.review.failed'))
      setPlacing(false)
    }
  }

  return (
    <div className="bg-mist/40 pb-20">
      <div className="container-x pt-6 sm:pt-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link to="/cart" className="inline-flex min-h-11 items-center gap-2 text-sm text-muted transition-colors hover:text-ink">
            <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden />
            {t('checkout.backToBag')}
          </Link>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium tracking-[0.14em] text-success uppercase">
            <Lock className="size-3.5" aria-hidden />
            {t('checkout.secure')}
          </span>
        </div>
        <h1 className="heading-page mt-3 sm:mt-4">{t('checkout.title')}</h1>

        <div className="mt-6 grid grid-cols-1 gap-8 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-14 xl:grid-cols-[minmax(0,1fr)_440px]">
          <div className="order-2 lg:order-1">
            <div className="mb-8 border-b border-line pb-5">
              <StepIndicator current={step} onSelect={go} />
            </div>
            <div key={step} className="animate-fade-up">
              {step === 0 && <AddressStep onDone={() => go(1)} />}
              {step === 1 && <ShippingStep onBack={() => go(0)} onDone={() => go(2)} />}
              {step === 2 && (
                <PaymentStep
                  total={totals.total}
                  card={card}
                  onCardChange={(c) => {
                    setCard(c)
                    setCardCleared(false)
                  }}
                  cardCleared={cardCleared}
                  onBack={() => go(1)}
                  onDone={() => go(3)}
                />
              )}
              {step === 3 && <ReviewStep totals={totals} card={card} placing={placing} error={error} onEdit={go} onPlace={submitOrder} />}
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <CheckoutSummary items={items} totals={totals} couponCode={coupon?.code} shippingMethod={shippingMethod} />
          </div>
        </div>
      </div>
    </div>
  )
}
