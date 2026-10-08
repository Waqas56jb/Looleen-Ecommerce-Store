import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { AuthorizedBadge, Button, Modal, OriginalBadge, Price, ProductPageSkeleton, QuantitySelector, RatingStars, SmartImage } from '@/components/common'
import { useAsync } from '@/hooks'
import { useShopActions } from '@/hooks/useShop'
import { useT } from '@/i18n'
import { getProductBySlug } from '@/services/productService'
import { useUIStore } from '@/store/ui'
import { useWishlistStore } from '@/store/wishlist'
import { cn } from '@/utils'
import { unitPrice } from '@/utils/catalog'
import { VariantSelector } from './VariantSelector'

/** Global quick-view modal, driven by useUIStore().quickViewSlug */
export function ProductQuickView() {
  const slug = useUIStore((s) => s.quickViewSlug)
  const close = useUIStore((s) => s.closeQuickView)
  const { t, l } = useT()
  const { data: product, loading } = useAsync(() => (slug ? getProductBySlug(slug) : Promise.resolve(undefined)), [slug])
  const { addToCart, toggleWishlist } = useShopActions()
  const wished = useWishlistStore((s) => (product ? s.ids.includes(product.id) : false))
  const [shadeId, setShadeId] = useState<string>()
  const [sizeId, setSizeId] = useState<string>()
  const [qty, setQty] = useState(1)
  const [image, setImage] = useState(0)

  useEffect(() => {
    setShadeId(product?.shades[0]?.id)
    setSizeId(product?.sizes[0]?.id)
    setQty(1)
    setImage(0)
  }, [product])

  const oos = product?.stockStatus === 'out_of_stock'
  const price = product ? unitPrice(product, sizeId) : undefined

  return (
    <Modal open={!!slug} onClose={close} size="xl" title={undefined}>
      {loading || !product ? (
        <ProductPageSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-10">
          <div>
            <SmartImage src={product.images[image]} alt={product.name} width={800} height={1000} wrapperClassName="aspect-[4/5] rounded-xs" />
            {product.images.length > 1 && (
              <div className="mt-3 flex gap-2">
                {product.images.map((src, i) => (
                  <button key={src} type="button" onClick={() => setImage(i)} aria-label={`Image ${i + 1}`} className={cn('w-16 overflow-hidden rounded-xs ring-1 transition', i === image ? 'ring-ink' : 'ring-transparent opacity-70 hover:opacity-100')}>
                    <SmartImage src={src} alt="" width={160} height={200} wrapperClassName="aspect-[4/5]" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <Link to={`/brand/${product.brandId}`} onClick={close} className="eyebrow text-muted hover:text-rose">
              {product.brandName}
            </Link>
            <h2 className="mt-2 font-serif text-3xl leading-tight font-medium tracking-[-0.02em]">{product.name}</h2>
            <RatingStars rating={product.rating} count={product.reviewCount} showValue className="mt-3" />
            <Price price={price!.price} compareAtPrice={price!.compareAtPrice} size="lg" className="mt-4" />
            <p className="mt-1 text-xs text-muted">{t('common.vatIncluded')}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <OriginalBadge size="md" className="bg-mist" />
              <AuthorizedBadge size="md" />
            </div>
            <p className="mt-5 text-[15px] leading-relaxed text-muted">{l(product.shortDescription)}</p>
            <div className="mt-6">
              <VariantSelector product={product} shadeId={shadeId} sizeId={sizeId} onShade={setShadeId} onSize={setSizeId} compact />
            </div>
            <div className="mt-6 flex items-center gap-3">
              <QuantitySelector value={qty} onChange={setQty} max={Math.max(1, Math.min(product.stock, 10))} />
              <Button
                size="lg"
                className="flex-1"
                disabled={oos}
                onClick={() => {
                  if (addToCart(product, { quantity: qty, shadeId, sizeId })) close()
                }}
              >
                {oos ? t('common.outOfStock') : t('common.addToCart')}
              </Button>
              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                aria-pressed={wished}
                aria-label={wished ? t('common.removeFromWishlist') : t('common.addToWishlist')}
                className="grid size-12 shrink-0 place-items-center rounded-full border border-line hover:border-ink"
              >
                <Heart className={cn('size-5', wished && 'fill-rose text-rose')} />
              </button>
            </div>
            <Link to={`/product/${product.slug}`} onClick={close} className="mt-6 text-sm font-medium text-ink underline underline-offset-4 hover:text-rose">
              {t('common.viewDetails')}
            </Link>
          </div>
        </div>
      )}
    </Modal>
  )
}
