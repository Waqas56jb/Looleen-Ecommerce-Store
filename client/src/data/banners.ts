import type { Banner } from '@/types'
import { EDITORIAL } from './images'

export const heroBanners: Banner[] = [
  {
    id: 'authentic',
    eyebrow: { en: '100% Original · Authorized Distributors', ar: 'أصلي 100% · موزعون معتمدون' },
    title: { en: 'Beauty, Authenticated.', ar: 'جمال أصلي، موثّق.' },
    subtitle: { en: 'The world’s most loved beauty brands, sourced directly from their official Saudi distributors.', ar: 'أشهر علامات الجمال العالمية، مباشرة من موزعيها الرسميين في المملكة.' },
    ctaLabel: { en: 'Shop Now', ar: 'تسوقي الآن' },
    ctaHref: '/category/care',
    secondaryCtaLabel: { en: 'Explore Brands', ar: 'اكتشفي العلامات' },
    secondaryCtaHref: '/brands',
    image: EDITORIAL.heroAuthentic,
    mobileImage: EDITORIAL.heroAuthentic,
    tone: 'light',
  },
  {
    id: 'delivered',
    eyebrow: { en: 'Fast Delivery Across the Kingdom', ar: 'توصيل سريع في جميع أنحاء المملكة' },
    title: { en: 'Original Beauty. Delivered Across Saudi Arabia.', ar: 'جمال أصلي. يصلك في كل أنحاء السعودية.' },
    subtitle: { en: 'Free delivery on orders over 250 SAR. Pay with Mada, Apple Pay, Tabby or Tamara.', ar: 'توصيل مجاني للطلبات فوق 250 ريال. ادفعي بمدى أو Apple Pay أو تابي أو تمارا.' },
    ctaLabel: { en: 'Shop Skin Care', ar: 'تسوقي العناية بالبشرة' },
    ctaHref: '/category/skin-care',
    secondaryCtaLabel: { en: 'View Offers', ar: 'شاهدي العروض' },
    secondaryCtaHref: '/offers',
    image: EDITORIAL.heroDelivered,
    mobileImage: EDITORIAL.heroDelivered,
    tone: 'light',
  },
  {
    id: 'professional',
    eyebrow: { en: 'For Salons & Beauty Professionals', ar: 'للصالونات وخبراء التجميل' },
    title: { en: 'Professional Beauty Starts Here.', ar: 'الجمال الاحترافي يبدأ من هنا.' },
    subtitle: { en: 'Salon-grade color, care and tools from Wella, Olaplex, OPI and more — bulk-friendly and authentic.', ar: 'ألوان وعناية وأدوات بمستوى الصالونات من ويلا وأولابليكس وOPI وغيرها — مناسبة للجملة وأصلية.' },
    ctaLabel: { en: 'Shop Professional', ar: 'تسوقي المنتجات الاحترافية' },
    ctaHref: '/category/salon-supplies',
    secondaryCtaLabel: { en: 'Explore Brands', ar: 'اكتشفي العلامات' },
    secondaryCtaHref: '/brands',
    image: EDITORIAL.heroProfessional,
    mobileImage: EDITORIAL.heroProfessional,
    tone: 'light',
  },
]
