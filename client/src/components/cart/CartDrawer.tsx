import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, Trash2, Truck } from 'lucide-react'
import { ButtonLink, Drawer, EmptyState, Price, ProgressBar, QuantitySelector, SmartImage, Money } from '@/components/common'
import { useShopActions } from '@/hooks/useShop'
import { useT } from '@/i18n'
import { useCartStore, useCartTotals } from '@/store/cart'
import { useUIStore } from '@/store/ui'
import { formatPrice } from '@/utils'

/** Free-shipping progress message + bar (shared by drawer and cart page) */
export function FreeShippingMeter() {
  const { t, lang } = useT()
  const totals = useCartTotals()
  return (
    <div className="rounded-xs bg-blush/60 p-4">
      <p className="mb-2.5 flex items-center gap-2 text-[13px] text-ink">
        <Truck className="size-4 shrink-0 text-rose" aria-hidden />
        {totals.freeShippingRemaining > 0 ? t('cart.addMore', { amount: formatPrice(totals.freeShippingRemaining, lang) }) : <span className="font-medium">{t('cart.freeUnlocked')}</span>}
      </p>
      <ProgressBar value={totals.freeShippingProgress} />
    </div>
  )
}

export function CartDrawer() {
  const open = useUIStore((s) => s.cartOpen)
  const setOpen = useUIStore((s) => s.setCartOpen)
  const items = useCartStore((s) => s.items)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const { removeFromCart } = useShopActions()
  const totals = useCartTotals()
  const { t } = useT()
  const navigate = useNavigate()
  const close = () => setOpen(false)

  return (
    <Drawer
      open={open}
      onClose={close}
      title={
        <span className="flex items-baseline gap-2">
          {t('cart.title')} <span className="font-sans text-sm text-muted">({totals.itemCount})</span>
        </span>
      }
      widthClass="sm:max-w-[440px]"
      footer={
        items.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">{t('common.subtotal')}</span>
              <span className="font-semibold tabular-nums"><Money value={totals.subtotal} /></span>
            </div>
            <p className="text-xs text-muted">{t('cart.taxesAtCheckout')}</p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <ButtonLink to="/cart" onClick={close} variant="outline">
                {t('cart.viewCart')}
              </ButtonLink>
              <ButtonLink to="/checkout" onClick={close}>
                {t('common.checkout')}
              </ButtonLink>
            </div>
          </div>
        )
      }
    >
      {items.length === 0 ? (
        <EmptyState
          compact
          icon={<ShoppingBag />}
          title={t('empty.cartTitle')}
          description={t('empty.cartDesc')}
          action={{
            label: t('common.shopNow'),
            onClick: () => {
              close()
              navigate('/best-sellers')
            },
          }}
        />
      ) : (
        <div className="px-5 py-5 sm:px-6">
          <FreeShippingMeter />
          <ul className="mt-2 divide-y divide-line">
            {items.map((item) => (
              <li key={item.key} className="flex gap-4 py-5">
                <Link to={`/product/${item.slug}`} onClick={close} className="shrink-0">
                  <SmartImage src={item.image} alt={item.name} width={180} height={225} wrapperClassName="w-20 aspect-[4/5] rounded-xs" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="text-[10.5px] font-semibold tracking-[0.14em] text-muted uppercase">{item.brandName}</p>
                  <Link to={`/product/${item.slug}`} onClick={close} className="mt-0.5 line-clamp-2 text-sm leading-snug text-ink hover:text-rose">
                    {item.name}
                  </Link>
                  {item.variantLabel && <p className="mt-1 text-xs text-muted">{item.variantLabel}</p>}
                  <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                    <QuantitySelector size="sm" value={item.quantity} max={item.maxQuantity} onChange={(q) => updateQuantity(item.key, q)} />
                    <Price price={item.price * item.quantity} compareAtPrice={item.compareAtPrice ? item.compareAtPrice * item.quantity : undefined} size="sm" className="flex-col items-end gap-0!" />
                  </div>
                </div>
                <button type="button" onClick={() => removeFromCart(item.key)} aria-label={`${t('common.remove')} ${item.name}`} className="grid size-8 shrink-0 place-items-center self-start rounded-full text-muted hover:bg-blush hover:text-error">
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Drawer>
  )
}
