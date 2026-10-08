import { useState, type FormEvent } from 'react'
import { Tag, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/common'
import { useT } from '@/i18n'
import { validateCoupon } from '@/services/orderService'
import { useCartStore, useCartTotals } from '@/store/cart'
import { formatPrice } from '@/utils'

/** Promo code input + applied-code chip. Validates via orderService. */
export function CouponForm() {
  const { t, lang } = useT()
  const coupon = useCartStore((s) => s.coupon)
  const setCoupon = useCartStore((s) => s.setCoupon)
  const removeCoupon = useCartStore((s) => s.removeCoupon)
  const totals = useCartTotals()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!code.trim()) {
      setError(t('cart.coupon.empty'))
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await validateCoupon(code, totals.subtotal)
      if (res.ok) {
        setCoupon(res.coupon)
        setCode('')
        toast.success(t('toast.couponApplied', { code: res.coupon.code }))
      } else {
        const msg = res.reason === 'min_subtotal' ? t('toast.couponMin', { amount: formatPrice(res.minSubtotal ?? 0, lang) }) : t('toast.couponInvalid')
        setError(msg)
        toast.error(msg)
      }
    } catch {
      setError(t('common.somethingWrong'))
    } finally {
      setLoading(false)
    }
  }

  if (coupon) {
    const notMet = coupon.minSubtotal && totals.subtotal < coupon.minSubtotal
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex h-9 items-center gap-2 rounded-full bg-success/10 ps-3 pe-1 text-[13px] font-semibold text-success">
            <Tag className="size-3.5" aria-hidden />
            <span dir="ltr">{coupon.code}</span>
            <button
              type="button"
              onClick={removeCoupon}
              aria-label={t('cart.coupon.remove', { code: coupon.code })}
              className="grid size-7 place-items-center rounded-full transition-colors hover:bg-success/15"
            >
              <X className="size-3.5" />
            </button>
          </span>
          {totals.discount > 0 && <span className="text-xs text-success">{t('cart.coupon.saving', { amount: formatPrice(totals.discount, lang) })}</span>}
        </div>
        {notMet && <p className="text-xs text-warning">{t('cart.coupon.notMet', { amount: formatPrice((coupon.minSubtotal ?? 0) - totals.subtotal, lang) })}</p>}
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-2">
      <label htmlFor="coupon-code" className="text-[13px] font-medium text-ink">
        {t('cart.coupon.label')}
      </label>
      <div className="flex gap-2">
        <input
          id="coupon-code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase())
            if (error) setError(null)
          }}
          placeholder={t('cart.coupon.placeholder')}
          autoComplete="off"
          dir="ltr"
          aria-invalid={!!error || undefined}
          aria-describedby={error ? 'coupon-error' : 'coupon-hint'}
          className="h-11 min-w-0 flex-1 rounded-xs border border-line bg-white px-4 text-sm tracking-wider uppercase outline-none placeholder:tracking-normal placeholder:normal-case focus:border-ink focus:ring-2 focus:ring-rose/15 aria-invalid:border-error rtl:text-end"
        />
        <Button type="submit" variant="outline" loading={loading} className="h-11">
          {t('cart.coupon.apply')}
        </Button>
      </div>
      {error ? (
        <p id="coupon-error" role="alert" className="text-xs text-error">
          {error}
        </p>
      ) : (
        <p id="coupon-hint" className="text-xs leading-relaxed text-muted">
          {t('cart.coupon.hint')}
        </p>
      )}
    </form>
  )
}
