import type { Coupon, Offer } from '@/types'
import { poolImage } from './images'

/** Rolling end dates so countdowns are always live in the demo */
function inHours(h: number): string {
  return new Date(Date.now() + h * 3_600_000).toISOString()
}

export const offers: Offer[] = [
  {
    id: 'flash-skin',
    title: { en: 'Skin Care Flash Sale', ar: 'تخفيضات العناية بالبشرة السريعة' },
    description: { en: 'Up to 25% off dermatologist favourites from La Roche-Posay, Vichy and CeraVe.', ar: 'خصم حتى 25% على مفضلات أطباء الجلد من لاروش بوزيه وفيشي وسيرافي.' },
    discountLabel: { en: 'Up to 25% off', ar: 'خصم حتى 25%' },
    image: poolImage('skinset', 0),
    href: '/offers?category=care',
    endsAt: inHours(30),
  },
  {
    id: 'fragrance-week',
    title: { en: 'Fragrance Week', ar: 'أسبوع العطور' },
    description: { en: 'Selected luxury perfumes from Dior, Lancôme and Guerlain at special prices.', ar: 'عطور فاخرة مختارة من ديور ولانكوم وجيرلان بأسعار خاصة.' },
    discountLabel: { en: 'Up to 15% off', ar: 'خصم حتى 15%' },
    image: poolImage('perfume', 4),
    href: '/offers?category=perfumes',
    endsAt: inHours(76),
  },
  {
    id: 'welcome',
    title: { en: 'Welcome Gift', ar: 'هدية الترحيب' },
    description: { en: 'New to LOOKS? Enjoy 10% off your first order with code WELCOME10.', ar: 'جديدة في LOOKS؟ استمتعي بخصم 10% على طلبك الأول بالكود WELCOME10.' },
    code: 'WELCOME10',
    discountLabel: { en: '10% off', ar: 'خصم 10%' },
    image: poolImage('flatlay', 3),
    href: '/category/makeup',
    endsAt: inHours(24 * 20),
  },
  {
    id: 'salon',
    title: { en: 'Salon Pro Savings', ar: 'توفير المحترفين' },
    description: { en: '20% off professional supplies for salons with code SALON20 (min. 500 SAR).', ar: 'خصم 20% على المستلزمات الاحترافية للصالونات بالكود SALON20 (حد أدنى 500 ريال).' },
    code: 'SALON20',
    discountLabel: { en: '20% off', ar: 'خصم 20%' },
    image: poolImage('hairsalonimg', 0),
    href: '/category/salon-supplies',
    endsAt: inHours(24 * 9),
  },
]

/** Main homepage flash deal countdown */
export const flashDealEndsAt = inHours(11.5)

export const coupons: Coupon[] = [
  { code: 'WELCOME10', type: 'percent', value: 10, description: { en: '10% off your order', ar: 'خصم 10% على طلبك' } },
  { code: 'BEAUTY15', type: 'percent', value: 15, minSubtotal: 300, description: { en: '15% off orders over 300 SAR', ar: 'خصم 15% على الطلبات فوق 300 ريال' } },
  { code: 'SALON20', type: 'percent', value: 20, minSubtotal: 500, description: { en: '20% off professional orders over 500 SAR', ar: 'خصم 20% على الطلبات الاحترافية فوق 500 ريال' } },
]
