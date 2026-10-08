import { useId, useState } from 'react'
import { ChevronDown, CreditCard, MapPin, RotateCcw, Truck } from 'lucide-react'
import { PaymentMarks } from '@/components/common'
import { SAUDI_CITIES, STORE_CONFIG, type CityId } from '@/config/store'
import { useT } from '@/i18n'
import { cn, formatPrice } from '@/utils'

const FAST_CITIES: CityId[] = ['jeddah', 'dammam', 'khobar', 'mecca', 'medina']

export function deliveryDays(city: CityId): string {
  if (city === 'riyadh') return '1–2'
  if (FAST_CITIES.includes(city)) return '2–3'
  return '3–5'
}

/** Delivery estimate by city, free-shipping note, BNPL and returns */
export function DeliveryInfo({ price, className }: { price: number; className?: string }) {
  const { t, lang } = useT()
  const [city, setCity] = useState<CityId>('riyadh')
  const selectId = useId()
  const cityName = SAUDI_CITIES.find((c) => c.id === city)?.[lang] ?? city
  const free = price >= STORE_CONFIG.freeShippingThreshold
  const installment = Math.ceil((price / 4) * 100) / 100

  const row = 'flex gap-3.5 py-4'
  const icon = 'mt-0.5 size-[18px] shrink-0 text-rose'

  return (
    <section aria-label={t('product.delivery.title')} className={cn('rounded-xs border border-line bg-white/60 px-5', className)}>
      <div className={row}>
        <Truck className={icon} strokeWidth={1.6} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink" aria-live="polite">
            {t('product.delivery.deliveringTo', { city: cityName, days: deliveryDays(city) })}
          </p>
          <p className="mt-0.5 text-xs text-muted">{t('product.delivery.orderNow')}</p>
          <div className="mt-2.5 flex items-center gap-2">
            <MapPin className="size-3.5 text-muted" aria-hidden />
            <label htmlFor={selectId} className="text-xs text-muted">
              {t('product.delivery.deliverTo')}
            </label>
            <div className="relative">
              <select
                id={selectId}
                value={city}
                onChange={(e) => setCity(e.target.value as CityId)}
                className="h-8 appearance-none rounded-full border border-line bg-white ps-3 pe-8 text-xs font-medium text-ink outline-none transition-colors hover:border-ink/40 focus:border-ink"
              >
                {SAUDI_CITIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c[lang]}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute end-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted" aria-hidden />
            </div>
          </div>
          <p className={cn('mt-2.5 text-xs', free ? 'font-medium text-success' : 'text-muted')}>
            {free ? t('product.delivery.freeEligible') : t('product.delivery.freeOver', { amount: formatPrice(STORE_CONFIG.freeShippingThreshold, lang) })}
          </p>
        </div>
      </div>
      <div className={cn(row, 'border-t border-line')}>
        <CreditCard className={icon} strokeWidth={1.6} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{t('product.delivery.installments')}</p>
          <p className="mt-0.5 text-xs text-muted">{t('product.delivery.tabby', { amount: formatPrice(installment, lang) })}</p>
          <PaymentMarks className="mt-3" />
        </div>
      </div>
      <div className={cn(row, 'border-t border-line')}>
        <RotateCcw className={icon} strokeWidth={1.6} aria-hidden />
        <div>
          <p className="text-sm font-semibold text-ink">{t('product.delivery.returns')}</p>
          <p className="mt-0.5 text-xs text-muted">{t('product.delivery.returnsDesc')}</p>
        </div>
      </div>
    </section>
  )
}
