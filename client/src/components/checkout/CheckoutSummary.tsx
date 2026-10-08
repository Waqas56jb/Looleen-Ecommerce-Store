import { useState } from 'react'
import { ChevronDown, ShoppingBag } from 'lucide-react'
import { AuthenticityMessage, SmartImage, Money } from '@/components/common'
import { TotalsRows } from '@/components/cart/TotalsRows'
import { useT } from '@/i18n'
import type { CartItem, CartTotals, ShippingMethod } from '@/types'
import { cn } from '@/utils'

interface Props {
  items: CartItem[]
  totals: CartTotals
  couponCode?: string
  shippingMethod: ShippingMethod
}

function ItemList({ items }: { items: CartItem[] }) {
  const { t } = useT()
  return (
    <ul className="space-y-4">
      {items.map((i) => (
        <li key={i.key} className="flex items-center gap-3.5">
          <span className="relative shrink-0">
            <SmartImage src={i.image} alt={i.name} width={120} height={150} wrapperClassName="w-14 aspect-[4/5] rounded-xs" />
            <span className="absolute -top-2 -end-2 grid size-5 place-items-center rounded-full bg-ink text-[10px] font-semibold text-ivory" aria-label={t('checkout.summary.qty', { qty: i.quantity })}>
              {i.quantity}
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">{i.brandName}</p>
            <p className="line-clamp-1 text-[13px] text-ink">{i.name}</p>
            {i.variantLabel && <p className="text-xs text-muted">{i.variantLabel}</p>}
          </div>
          <span className="text-[13px] font-medium tabular-nums text-ink"><Money value={i.price * i.quantity} /></span>
        </li>
      ))}
    </ul>
  )
}

/** Checkout sidebar: items + totals. Collapsible on mobile, sticky on desktop. */
export function CheckoutSummary({ items, totals, couponCode, shippingMethod }: Props) {
  const { t } = useT()
  const [open, setOpen] = useState(false)
  const body = (
    <>
      <ItemList items={items} />
      <TotalsRows
        className="mt-6 border-t border-line pt-5"
        subtotal={totals.subtotal}
        discount={totals.discount}
        vat={totals.vat}
        shipping={totals.shipping}
        total={totals.total}
        couponCode={couponCode}
        shippingLabel={t(`checkout.shipping.${shippingMethod}`)}
      />
    </>
  )

  return (
    <aside aria-labelledby="checkout-summary-title">
      {/* Mobile: collapsible */}
      <div className="rounded-xs border border-line bg-white lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="checkout-summary-mobile"
          className="flex min-h-14 w-full items-center justify-between gap-3 px-4 text-sm"
        >
          <span className="flex items-center gap-2 text-ink">
            <ShoppingBag className="size-4 text-rose" aria-hidden />
            {open ? t('checkout.summary.hide') : t('checkout.summary.show')}
            <ChevronDown className={cn('size-4 transition-transform duration-300', open && 'rotate-180')} aria-hidden />
          </span>
          <span className="font-semibold tabular-nums"><Money value={totals.total} /></span>
        </button>
        {open && (
          <div id="checkout-summary-mobile" className="animate-slide-down border-t border-line p-4">
            {body}
          </div>
        )}
      </div>

      {/* Desktop */}
      <div className="hidden space-y-5 lg:sticky lg:top-28 lg:block">
        <div className="rounded-xs border border-line bg-white p-7">
          <h2 id="checkout-summary-title" className="heading-card mb-6">
            {t('checkout.summary.title')}
          </h2>
          {body}
        </div>
        <AuthenticityMessage compact />
      </div>
    </aside>
  )
}
