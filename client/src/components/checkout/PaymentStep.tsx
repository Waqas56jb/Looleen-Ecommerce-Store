import { useState } from 'react'
import { Info, Lock } from 'lucide-react'
import { Input, PaymentMark, RadioCard } from '@/components/common'
import { PAYMENT_METHODS, type PaymentMethodId } from '@/config/store'
import { useT } from '@/i18n'
import { useCheckoutStore } from '@/store/checkout'
import { cn, formatPrice } from '@/utils'
import { formatCardNumber, formatExpiry, isCardMethod, validateCard, type CardDetails } from './helpers'
import { StepHeading, StepNav } from './StepHeading'

const GROUPS: { id: 'cards' | 'wallets' | 'bnpl' | 'other'; kind: string }[] = [
  { id: 'cards', kind: 'card' },
  { id: 'wallets', kind: 'wallet' },
  { id: 'bnpl', kind: 'bnpl' },
  { id: 'other', kind: 'cod' },
]

function CardForm({ card, onChange, showErrors }: { card: CardDetails; onChange: (c: CardDetails) => void; showErrors: boolean }) {
  const { t } = useT()
  const errors = showErrors ? validateCard(card) : {}
  const set = (k: keyof CardDetails, v: string) => onChange({ ...card, [k]: v })
  return (
    <div className="animate-fade-in grid grid-cols-1 gap-4 rounded-xs border border-line bg-mist/60 p-4 sm:grid-cols-2 sm:p-5">
      <Input
        label={t('checkout.payment.cardNumber')}
        inputMode="numeric"
        autoComplete="cc-number"
        dir="ltr"
        placeholder="1234 5678 9012 3456"
        value={card.number}
        onChange={(e) => set('number', formatCardNumber(e.target.value))}
        error={errors.number ? t('checkout.payment.invalidCard') : undefined}
        trailing={<Lock className="size-4 text-muted" aria-hidden />}
        wrapperClassName="sm:col-span-2"
        className="tracking-wider tabular-nums"
      />
      <Input
        label={t('checkout.payment.expiry')}
        inputMode="numeric"
        autoComplete="cc-exp"
        dir="ltr"
        placeholder="MM/YY"
        maxLength={5}
        value={card.expiry}
        onChange={(e) => set('expiry', formatExpiry(e.target.value))}
        error={errors.expiry ? t('checkout.payment.invalidExpiry') : undefined}
      />
      <Input
        label={t('checkout.payment.cvc')}
        inputMode="numeric"
        autoComplete="cc-csc"
        dir="ltr"
        placeholder="123"
        maxLength={4}
        type="password"
        value={card.cvc}
        onChange={(e) => set('cvc', e.target.value.replace(/\D/g, '').slice(0, 4))}
        error={errors.cvc ? t('checkout.payment.invalidCvc') : undefined}
      />
      <Input
        label={t('checkout.payment.cardName')}
        autoComplete="cc-name"
        dir="ltr"
        placeholder="NOURA ALQAHTANI"
        value={card.name}
        onChange={(e) => set('name', e.target.value)}
        error={errors.name ? t('common.required') : undefined}
        wrapperClassName="sm:col-span-2"
        className="uppercase"
      />
    </div>
  )
}

interface PaymentStepProps {
  total: number
  card: CardDetails
  onCardChange: (c: CardDetails) => void
  /** Shown when the user returned after a refresh and card fields were cleared */
  cardCleared?: boolean
  onBack: () => void
  onDone: () => void
}

export function PaymentStep({ total, card, onCardChange, cardCleared, onBack, onDone }: PaymentStepProps) {
  const { t, lang } = useT()
  const method = useCheckoutStore((s) => s.paymentMethod)
  const setMethod = useCheckoutStore((s) => s.setPaymentMethod)
  const [showErrors, setShowErrors] = useState(false)
  const [selectError, setSelectError] = useState(false)

  const installment = (n: number) => formatPrice(Math.round((total / n) * 100) / 100, lang)
  const desc = (id: PaymentMethodId) => {
    if (id === 'tabby') return t('checkout.payment.tabbyDesc', { amount: installment(4) })
    if (id === 'tamara') return t('checkout.payment.tamaraDesc', { amount: installment(3) })
    return t(`checkout.payment.${id}Desc`)
  }

  const next = () => {
    if (!method) {
      setSelectError(true)
      return
    }
    if (isCardMethod(method) && Object.keys(validateCard(card)).length) {
      setShowErrors(true)
      return
    }
    onDone()
  }

  const choose = (id: PaymentMethodId) => {
    setMethod(id)
    setSelectError(false)
  }

  return (
    <section aria-labelledby="step-payment">
      <StepHeading id="step-payment" title={t('checkout.payment.title')} subtitle={t('checkout.payment.subtitle')} />

      {cardCleared && isCardMethod(method) && (
        <p className="mb-5 flex gap-2 rounded-xs bg-champagne-soft/50 px-4 py-3 text-[13px] text-ink">
          <Info className="mt-0.5 size-4 shrink-0 text-champagne" aria-hidden />
          {t('checkout.payment.cardNotKept')}
        </p>
      )}

      <div className="space-y-7">
        {GROUPS.map((g) => {
          const methods = PAYMENT_METHODS.filter((m) => m.kind === g.kind)
          const showCard = g.id === 'cards' && isCardMethod(method)
          return (
            <fieldset key={g.id}>
              <legend className="mb-3 text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">{t(`checkout.payment.${g.id}`)}</legend>
              <div className={cn('grid gap-3', g.id === 'cards' ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
                {methods.map((m) => (
                  <RadioCard key={m.id} name="payment" value={m.id} checked={method === m.id} onChange={() => choose(m.id)} className={cn(g.kind === 'cod' && 'sm:col-span-2')}>
                    <div className={cn('flex gap-3', g.id === 'cards' ? 'flex-col items-start' : 'items-center justify-between')}>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">{lang === 'ar' ? m.labelAr : m.label}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted">{desc(m.id)}</p>
                      </div>
                      {m.kind !== 'cod' && <PaymentMark id={m.id} className="shrink-0" />}
                    </div>
                  </RadioCard>
                ))}
              </div>
              {showCard && (
                <div className="mt-3">
                  <CardForm card={card} onChange={onCardChange} showErrors={showErrors} />
                </div>
              )}
              {g.kind === 'bnpl' && (method === 'tabby' || method === 'tamara') && <p className="mt-2.5 text-xs text-muted">{t('checkout.payment.bnplNote')}</p>}
              {g.kind === 'cod' && method === 'cod' && <p className="mt-2.5 text-xs leading-relaxed text-muted">{t('checkout.payment.codNote')}</p>}
            </fieldset>
          )
        })}
      </div>

      {selectError && (
        <p role="alert" className="mt-4 text-sm text-error">
          {t('checkout.payment.selectError')}
        </p>
      )}

      <p className="mt-6 flex items-center gap-2 text-xs text-muted">
        <Lock className="size-3.5 shrink-0 text-success" aria-hidden />
        {t('checkout.payment.security')}
      </p>

      <StepNav onBack={onBack} onNext={next} />
    </section>
  )
}
