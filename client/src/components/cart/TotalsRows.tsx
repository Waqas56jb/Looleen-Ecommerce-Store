import type { ReactNode } from 'react'
import { Money } from '@/components/common'
import { STORE_CONFIG } from '@/config/store'
import { useT } from '@/i18n'
import { cn, formatPrice } from '@/utils'

interface TotalsRowsProps {
  subtotal: number
  discount: number
  vat: number
  shipping: number
  total: number
  couponCode?: string
  /** Label shown next to "Shipping" (e.g. "Standard delivery") */
  shippingLabel?: ReactNode
  className?: string
}

/** Subtotal → Discount → VAT → Shipping → Total. Shared by cart, checkout and order success. */
export function TotalsRows({ subtotal, discount, vat, shipping, total, couponCode, shippingLabel, className }: TotalsRowsProps) {
  const { t, lang } = useT()
  const row = 'flex items-baseline justify-between gap-4 text-sm'
  return (
    <dl className={cn('space-y-3', className)}>
      <div className={row}>
        <dt className="text-muted">{t('common.subtotal')}</dt>
        <dd className="tabular-nums text-ink"><Money value={subtotal} /></dd>
      </div>
      {discount > 0 && (
        <div className={row}>
          <dt className="text-muted">
            {t('common.discount')}
            {couponCode && (
              <span className="ms-1.5 text-xs" dir="ltr">
                ({couponCode})
              </span>
            )}
          </dt>
          <dd className="tabular-nums text-success">−<Money value={discount} /></dd>
        </div>
      )}
      <div className={row}>
        <dt className="text-muted">{t('common.vat', { rate: Math.round(STORE_CONFIG.vatRate * 100) })}</dt>
        <dd className="tabular-nums text-ink"><Money value={vat} /></dd>
      </div>
      <div className={row}>
        <dt className="text-muted">
          {t('common.shipping')}
          {shippingLabel && <span className="block text-xs text-muted/80">{shippingLabel}</span>}
        </dt>
        <dd className={cn('tabular-nums', shipping === 0 ? 'font-medium text-success' : 'text-ink')}>{shipping === 0 ? t('common.free') : formatPrice(shipping, lang)}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-4 border-t border-line pt-4">
        <dt className="text-[15px] font-semibold text-ink">{t('common.total')}</dt>
        <dd className="font-serif text-2xl font-medium tabular-nums text-ink"><Money value={total} /></dd>
      </div>
    </dl>
  )
}
