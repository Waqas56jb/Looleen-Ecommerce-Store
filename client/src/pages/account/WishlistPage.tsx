import { useMemo, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Heart, ShoppingBag, Trash2, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { AccountPageHeader } from '@/components/account/AccountUI'
import { useInAccountShell } from '@/components/account/shell'
import { Breadcrumbs, Button, EmptyState, ErrorState, ProductGridSkeleton } from '@/components/common'
import { ProductCard } from '@/components/product'
import { useAsync, useDocumentMeta } from '@/hooks'
import { useShopActions } from '@/hooks/useShop'
import { useT } from '@/i18n'
import { getProductsByIds } from '@/services/productService'
import { useAuthStore } from '@/store/auth'
import { useCartStore } from '@/store/cart'
import { useUIStore } from '@/store/ui'
import { useWishlistStore } from '@/store/wishlist'

/** Standalone wrapper used at /wishlist and for guests (outside the account sidebar) */
function GuestShell({ children }: { children: ReactNode }) {
  const { t } = useT()
  return (
    <div className="bg-ivory">
      <div className="container-x py-10 lg:py-16">
        <Breadcrumbs items={[{ label: t('account.wishlist.title') }]} className="mb-6" />
        {children}
      </div>
    </div>
  )
}

export default function WishlistPage() {
  const { t } = useT()
  useDocumentMeta(t('account.wishlist.metaTitle'), t('account.wishlist.metaDesc'))
  const inShell = useInAccountShell()
  const user = useAuthStore((s) => s.user)
  const { pathname } = useLocation()
  const ids = useWishlistStore((s) => s.ids)
  const removeWish = useWishlistStore((s) => s.remove)
  const addItem = useCartStore((s) => s.addItem)
  const setCartOpen = useUIStore((s) => s.setCartOpen)
  const { addToCart } = useShopActions()
  const key = ids.join(',')
  const { data, loading, error, reload } = useAsync(() => getProductsByIds(ids), [key])

  // Keep wishlist order and hide removed items instantly (no refetch flash)
  const products = useMemo(() => (data ? ids.map((id) => data.find((p) => p.id === id)).filter((p) => !!p) : undefined), [data, ids])

  const moveToCart = (id: string) => {
    const p = products?.find((x) => x.id === id)
    if (p && addToCart(p)) removeWish(p.id)
  }

  const remove = (id: string, name: string) => {
    removeWish(id)
    toast(t('toast.removedFromWishlist'), { description: name })
  }

  const addAll = () => {
    const available = products?.filter((p) => p.stockStatus !== 'out_of_stock') ?? []
    if (!available.length) return toast.error(t('toast.outOfStock'))
    available.forEach((p) => addItem(p))
    toast.success(t('account.wishlist.allAdded', { count: available.length }), { action: { label: t('common.viewBag'), onClick: () => setCartOpen(true) } })
  }

  const header = (
    <AccountPageHeader
      title={t('account.wishlist.title')}
      description={ids.length ? t('account.wishlist.count', { count: ids.length }) : t('account.wishlist.desc')}
      action={
        ids.length > 0 && (
          <Button variant="dark" onClick={addAll} icon={<ShoppingBag className="size-4" />} disabled={!products?.length}>
            {t('account.wishlist.addAll')}
          </Button>
        )
      }
    />
  )

  let body: ReactNode
  if (!ids.length) {
    body = (
      <div className="rounded-xs border border-line bg-white">
        <EmptyState icon={<Heart />} title={t('empty.wishlistTitle')} description={t('empty.wishlistDesc')} action={{ label: t('account.wishlist.startShopping'), to: '/best-sellers' }} />
      </div>
    )
  } else if (error) {
    body = <ErrorState onRetry={reload} />
  } else if (loading && !products) {
    body = <ProductGridSkeleton count={Math.min(ids.length, 6)} className="md:grid-cols-3 lg:grid-cols-3" />
  } else {
    body = (
      <ul className={inShell ? 'grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3' : 'grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4'}>
        {products?.map((p) => (
          <li key={p.id} className="flex flex-col">
            <ProductCard product={p} className="flex-1" />
            <div className="mt-4 flex flex-col gap-1.5 sm:flex-row sm:items-center">
              <Button size="sm" variant="outline" onClick={() => moveToCart(p.id)} disabled={p.stockStatus === 'out_of_stock'} className="flex-1">
                <ShoppingBag className="size-3.5" aria-hidden />
                {p.stockStatus === 'out_of_stock' ? t('common.outOfStock') : t('account.wishlist.moveToCart')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove(p.id, p.name)} aria-label={`${t('account.wishlist.remove')} — ${p.name}`}>
                <Trash2 className="size-3.5" aria-hidden />
                {t('account.wishlist.remove')}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    )
  }

  const content = (
    <>
      {header}
      {!user && (
        <p className="mb-8 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xs border border-champagne/40 bg-champagne-soft/40 px-4 py-3 text-sm text-ink">
          <UserRound className="size-4 text-[#7a5a2a]" aria-hidden />
          <span>{t('account.wishlist.guestNote')}</span>
          <Link to={`/login?redirect=${encodeURIComponent(pathname)}`} className="font-semibold underline underline-offset-4 hover:text-rose">
            {t('common.signIn')}
          </Link>
        </p>
      )}
      {body}
    </>
  )

  return inShell ? <div>{content}</div> : <GuestShell>{content}</GuestShell>
}
