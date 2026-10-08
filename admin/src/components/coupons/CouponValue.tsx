import { Money } from '@/components/ui'
import { useT } from '@/i18n'
import type { Coupon } from '@/types'

/** "15%", Riyal amount, or "Free shipping" */
export function CouponValue({ coupon, className }: { coupon: Pick<Coupon, 'type' | 'value'>; className?: string }) {
  const { t } = useT()
  if (coupon.type === 'percentage')
    return (
      <span className={className} dir="ltr">
        {coupon.value}%
      </span>
    )
  if (coupon.type === 'fixed') return <Money value={coupon.value} className={className} />
  return <span className={className}>{t('marketing.shared.freeShipping')}</span>
}

/** Plain-text value for CSV */
export function couponValueText(c: Pick<Coupon, 'type' | 'value'>): string {
  if (c.type === 'percentage') return `${c.value}%`
  if (c.type === 'fixed') return `SAR ${c.value}`
  return 'Free shipping'
}

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** Random readable code, e.g. "LOOKS-" style without ambiguous chars: GLOW7K4P */
export function generateCouponCode(prefix?: string): string {
  const words = ['GLOW', 'BEAUTY', 'LOOKS', 'RADIANT', 'SILK', 'OUD', 'ROSE', 'LUXE']
  const head = prefix || words[Math.floor(Math.random() * words.length)]
  let tail = ''
  for (let i = 0; i < 4; i++) tail += CHARS[Math.floor(Math.random() * CHARS.length)]
  return `${head}${tail}`.slice(0, 20)
}
