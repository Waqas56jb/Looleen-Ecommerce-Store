import { reviews as baseReviews } from '../catalog/reviews'
import { IMAGE_POOL } from '../catalog/images'
import { SAUDI_CITIES, STORE_CONFIG } from '@/config/store'
import type {
  ActivityLog,
  AdminNotification,
  AdminReview,
  Banner,
  Campaign,
  Coupon,
  HomepageSection,
  Offer,
  ReturnRequest,
  ReturnStatus,
  ReviewStatus,
  StoreSettings,
} from '@/types'
import { seedBrands, seedProducts } from './catalog'
import { ADMIN_IPS, daysAgo, daysFromNow, rng, round2 } from './helpers'
import { seedAdmins, seedCustomers, seedOrders } from './people'

const r = rng(2030)

/* ---------------- Reviews ---------------- */

const REVIEW_STATUS: ReviewStatus[] = ['approved', 'approved', 'approved', 'approved', 'approved', 'pending', 'pending', 'rejected', 'approved', 'hidden']

export const seedReviews: AdminReview[] = baseReviews
  .filter((_, i) => i % 6 === 0)
  .slice(0, 72)
  .map((rv, i) => {
    const product = seedProducts.find((p) => p.id === rv.productId)!
    const customer = seedCustomers[(i * 5) % seedCustomers.length]
    const status = i < 9 ? 'pending' : REVIEW_STATUS[i % REVIEW_STATUS.length]
    return {
      id: `rev-${2001 + i}`,
      productId: product.id,
      productName: product.name,
      customerId: customer.id,
      customerName: customer.name,
      rating: rv.rating,
      title: rv.title,
      body: rv.comment,
      images: i % 8 === 0 ? [product.images[0]] : [],
      verified: rv.verified,
      status,
      reply: status === 'approved' && i % 5 === 0 ? { text: 'Thank you for your lovely review! We’re so glad it arrived quickly.', by: 'Lama Al-Shehri', date: daysAgo(i % 20) } : undefined,
      helpful: rv.helpful,
      createdAt: daysAgo(i < 9 ? i % 3 : 3 + (i % 80), i % 12),
    }
  })

/* ---------------- Returns ---------------- */

const RETURN_FLOW: ReturnStatus[] = ['requested', 'approved', 'pickup_scheduled', 'received', 'refunded']
const RETURN_PLAN: ReturnStatus[] = ['requested', 'requested', 'requested', 'approved', 'approved', 'pickup_scheduled', 'pickup_scheduled', 'received', 'received', 'refunded', 'refunded', 'refunded', 'refunded', 'rejected', 'rejected', 'requested', 'approved', 'refunded']
const REASONS = ['Damaged on arrival', 'Wrong item received', 'Not as described', 'Allergic reaction', 'Changed my mind (sealed)', 'Wrong shade']

const deliveredOrders = seedOrders.filter((o) => ['delivered', 'refunded'].includes(o.status))

export const seedReturns: ReturnRequest[] = RETURN_PLAN.map((status, i) => {
  const order = deliveredOrders[i % deliveredOrders.length]
  const item = order.items[i % order.items.length]
  const created = daysAgo(1 + i * 2)
  const reachIdx = status === 'rejected' ? 0 : RETURN_FLOW.indexOf(status)
  const timeline = RETURN_FLOW.slice(0, reachIdx + 1).map((s, k) => ({ status: s, date: new Date(new Date(created).getTime() + k * 30 * 3_600_000).toISOString(), by: k === 0 ? order.customerName : 'Omar Al-Zahrani' }))
  if (status === 'rejected') timeline.push({ status: 'rejected', date: new Date(new Date(created).getTime() + 20 * 3_600_000).toISOString(), by: 'Omar Al-Zahrani', note: 'Opened cosmetic — not eligible under hygiene policy' } as never)
  const reason = REASONS[i % REASONS.length]
  return {
    id: `ret-${3001 + i}`,
    number: `RT-2026-${String(301 + i)}`,
    orderId: order.id,
    orderNumber: order.number,
    customerId: order.customerId,
    customerName: order.customerName,
    productId: item.productId,
    productName: item.name,
    productImage: item.image,
    quantity: 1,
    reason,
    description:
      reason === 'Damaged on arrival'
        ? 'The bottle cap was cracked and some product leaked inside the box.'
        : reason === 'Wrong item received'
          ? 'I ordered a different size but received this one.'
          : reason === 'Allergic reaction'
            ? 'I developed redness after two uses. Dermatologist advised to stop.'
            : reason === 'Wrong shade'
              ? 'The shade is much darker than shown on the website.'
              : 'The item is unopened and still sealed in original packaging.',
    images: i % 3 === 0 ? [item.image] : [],
    amount: round2(item.unitPrice * 1.15),
    status,
    timeline,
    createdAt: created,
  }
})

/* ---------------- Coupons ---------------- */

export const seedCoupons: Coupon[] = [
  { id: 'cp-1', code: 'WELCOME10', description: '10% off the first order for new customers', type: 'percentage', value: 10, minOrder: 0, maxDiscount: 100, usageLimit: 5000, perCustomerLimit: 1, used: 1842, discountGiven: 48210, startDate: daysAgo(300), endDate: daysFromNow(85), categoryIds: [], brandIds: [], segment: 'new', enabled: true, createdAt: daysAgo(300) },
  { id: 'cp-2', code: 'BEAUTY15', description: '15% off orders over 300 SAR', type: 'percentage', value: 15, minOrder: 300, maxDiscount: 150, usageLimit: 2000, perCustomerLimit: 3, used: 764, discountGiven: 41980, startDate: daysAgo(60), endDate: daysFromNow(30), categoryIds: [], brandIds: [], segment: 'all', enabled: true, createdAt: daysAgo(60) },
  { id: 'cp-3', code: 'SALON20', description: '20% off professional orders over 500 SAR', type: 'percentage', value: 20, minOrder: 500, maxDiscount: 600, usageLimit: undefined, perCustomerLimit: undefined, used: 312, discountGiven: 52740, startDate: daysAgo(200), endDate: daysFromNow(165), categoryIds: ['salon-supplies'], brandIds: [], segment: 'professional', enabled: true, createdAt: daysAgo(200) },
  { id: 'cp-4', code: 'FREESHIP', description: 'Free standard delivery on any order', type: 'free_shipping', value: 0, minOrder: 100, usageLimit: 1000, perCustomerLimit: 2, used: 418, discountGiven: 10450, startDate: daysAgo(14), endDate: daysFromNow(16), categoryIds: [], brandIds: [], segment: 'all', enabled: true, createdAt: daysAgo(14) },
  { id: 'cp-5', code: 'OUD50', description: '50 SAR off Tom Ford fragrances', type: 'fixed', value: 50, minOrder: 400, usageLimit: 300, perCustomerLimit: 1, used: 96, discountGiven: 4800, startDate: daysAgo(20), endDate: daysFromNow(10), categoryIds: ['perfumes'], brandIds: ['tom-ford'], segment: 'all', enabled: true, createdAt: daysAgo(20) },
  { id: 'cp-6', code: 'NATIONALDAY95', description: 'Saudi National Day — 25% off sitewide', type: 'percentage', value: 25, minOrder: 150, maxDiscount: 250, usageLimit: 3000, perCustomerLimit: 1, used: 2611, discountGiven: 118300, startDate: daysAgo(20), endDate: daysAgo(14), categoryIds: [], brandIds: [], segment: 'all', enabled: true, createdAt: daysAgo(30) },
  { id: 'cp-7', code: 'WHITEFRIDAY', description: 'White Friday — up to 30% off', type: 'percentage', value: 30, minOrder: 200, maxDiscount: 400, usageLimit: 8000, perCustomerLimit: 2, used: 0, discountGiven: 0, startDate: daysFromNow(44), endDate: daysFromNow(52), categoryIds: [], brandIds: [], segment: 'all', enabled: true, createdAt: daysAgo(3) },
  { id: 'cp-8', code: 'VIP100', description: '100 SAR off for VIP members', type: 'fixed', value: 100, minOrder: 600, usageLimit: 500, perCustomerLimit: 1, used: 58, discountGiven: 5800, startDate: daysAgo(45), endDate: daysFromNow(45), categoryIds: [], brandIds: [], segment: 'vip', enabled: true, createdAt: daysAgo(45) },
  { id: 'cp-9', code: 'KBEAUTY12', description: '12% off COSRX & Medicube', type: 'percentage', value: 12, minOrder: 120, usageLimit: 600, perCustomerLimit: 2, used: 233, discountGiven: 6120, startDate: daysAgo(90), endDate: daysAgo(30), categoryIds: [], brandIds: ['cosrx', 'medicube'], segment: 'all', enabled: true, createdAt: daysAgo(90) },
  { id: 'cp-10', code: 'COMEBACK15', description: 'Win-back offer for inactive customers', type: 'percentage', value: 15, minOrder: 150, maxDiscount: 120, usageLimit: 800, perCustomerLimit: 1, used: 41, discountGiven: 2950, startDate: daysAgo(10), endDate: daysFromNow(20), categoryIds: [], brandIds: [], segment: 'inactive', enabled: false, createdAt: daysAgo(10) },
  { id: 'cp-11', code: 'RAMADAN26', description: 'Ramadan Kareem — 20% off fragrances', type: 'percentage', value: 20, minOrder: 200, maxDiscount: 300, usageLimit: 4000, perCustomerLimit: 2, used: 3120, discountGiven: 142600, startDate: daysAgo(230), endDate: daysAgo(200), categoryIds: ['perfumes'], brandIds: [], segment: 'all', enabled: true, createdAt: daysAgo(240) },
  { id: 'cp-12', code: 'DYSON200', description: '200 SAR off Dyson devices', type: 'fixed', value: 200, minOrder: 1500, usageLimit: 150, perCustomerLimit: 1, used: 37, discountGiven: 7400, startDate: daysAgo(5), endDate: daysFromNow(25), categoryIds: ['beauty-devices'], brandIds: ['dyson'], segment: 'all', enabled: true, createdAt: daysAgo(5) },
]

/* ---------------- Campaigns ---------------- */

export const seedCampaigns: Campaign[] = [
  { id: 'cm-1', name: 'Fragrance Week', nameAr: 'أسبوع العطور', type: 'seasonal', status: 'active', startDate: daysAgo(3), endDate: daysFromNow(4), budget: 18000, revenue: 96400, orders: 312, channels: ['email', 'instagram', 'onsite'], couponCode: undefined, createdAt: daysAgo(10) },
  { id: 'cm-2', name: 'Skin Care Flash Sale', nameAr: 'تخفيضات العناية بالبشرة', type: 'flash_sale', status: 'active', startDate: daysAgo(1), endDate: daysFromNow(1), budget: 9000, revenue: 41250, orders: 188, channels: ['push', 'sms', 'onsite'], createdAt: daysAgo(4) },
  { id: 'cm-3', name: 'Saudi National Day 95', nameAr: 'اليوم الوطني 95', type: 'national_day', status: 'ended', startDate: daysAgo(20), endDate: daysAgo(14), budget: 45000, revenue: 412800, orders: 2611, channels: ['email', 'sms', 'instagram', 'tiktok', 'onsite'], couponCode: 'NATIONALDAY95', createdAt: daysAgo(40) },
  { id: 'cm-4', name: 'White Friday 2026', nameAr: 'الجمعة البيضاء 2026', type: 'white_friday', status: 'scheduled', startDate: daysFromNow(44), endDate: daysFromNow(52), budget: 80000, revenue: 0, orders: 0, channels: ['email', 'sms', 'push', 'instagram', 'tiktok', 'onsite'], couponCode: 'WHITEFRIDAY', createdAt: daysAgo(3) },
  { id: 'cm-5', name: 'Olaplex Bond Repair Month', nameAr: 'شهر إصلاح الشعر مع أولابليكس', type: 'brand_promotion', status: 'active', startDate: daysAgo(12), endDate: daysFromNow(18), budget: 12000, revenue: 58300, orders: 401, channels: ['instagram', 'onsite'], createdAt: daysAgo(15) },
  { id: 'cm-6', name: 'K-Beauty Edit', nameAr: 'تشكيلة الجمال الكوري', type: 'new_collection', status: 'ended', startDate: daysAgo(90), endDate: daysAgo(30), budget: 15000, revenue: 73900, orders: 690, channels: ['tiktok', 'instagram', 'onsite'], couponCode: 'KBEAUTY12', createdAt: daysAgo(95) },
  { id: 'cm-7', name: 'Salon Pro Savings', nameAr: 'توفير المحترفين', type: 'salon_professional', status: 'active', startDate: daysAgo(30), endDate: daysFromNow(60), budget: 20000, revenue: 128700, orders: 214, channels: ['email', 'sms'], couponCode: 'SALON20', createdAt: daysAgo(32) },
  { id: 'cm-8', name: 'Ramadan Kareem', nameAr: 'رمضان كريم', type: 'ramadan', status: 'ended', startDate: daysAgo(230), endDate: daysAgo(200), budget: 60000, revenue: 538200, orders: 3120, channels: ['email', 'sms', 'push', 'instagram', 'tiktok', 'onsite'], couponCode: 'RAMADAN26', createdAt: daysAgo(250) },
  { id: 'cm-9', name: 'Winter Hydration', nameAr: 'ترطيب الشتاء', type: 'seasonal', status: 'draft', startDate: daysFromNow(60), endDate: daysFromNow(90), budget: 10000, revenue: 0, orders: 0, channels: ['email', 'onsite'], createdAt: daysAgo(1) },
]

/* ---------------- Offers ---------------- */

export const seedOffers: Offer[] = [
  { id: 'of-1', title: 'Skin Care Flash Sale', titleAr: 'تخفيضات العناية بالبشرة السريعة', description: 'Up to 25% off dermatologist favourites from La Roche-Posay, Vichy and CeraVe.', banner: IMAGE_POOL.skinset[0], discountType: 'percentage', discountValue: 25, productIds: [], categoryIds: ['skin-care'], brandIds: ['la-roche-posay', 'vichy', 'cerave'], startDate: daysAgo(1), endDate: daysFromNow(1), status: 'active', createdAt: daysAgo(4) },
  { id: 'of-2', title: 'Fragrance Week', titleAr: 'أسبوع العطور', description: 'Selected luxury perfumes from Dior, Lancôme and Guerlain at special prices.', banner: IMAGE_POOL.perfume[4], discountType: 'percentage', discountValue: 15, productIds: [], categoryIds: ['perfumes'], brandIds: ['dior', 'lancome', 'guerlain'], startDate: daysAgo(3), endDate: daysFromNow(4), status: 'active', createdAt: daysAgo(10) },
  { id: 'of-3', title: 'Welcome Gift', titleAr: 'هدية الترحيب', description: 'New to LOOKS? 10% off your first order with WELCOME10.', banner: IMAGE_POOL.flatlay[3], discountType: 'percentage', discountValue: 10, productIds: [], categoryIds: [], brandIds: [], startDate: daysAgo(300), endDate: daysFromNow(85), status: 'active', createdAt: daysAgo(300) },
  { id: 'of-4', title: 'Salon Pro Savings', titleAr: 'توفير المحترفين', description: '20% off professional supplies with SALON20 (min. 500 SAR).', banner: IMAGE_POOL.hairsalonimg[0], discountType: 'percentage', discountValue: 20, productIds: [], categoryIds: ['salon-supplies'], brandIds: [], startDate: daysAgo(30), endDate: daysFromNow(60), status: 'active', createdAt: daysAgo(32) },
  { id: 'of-5', title: 'Dyson Device Days', titleAr: 'أيام أجهزة دايسون', description: '200 SAR off Dyson Supersonic and Airwrap.', banner: IMAGE_POOL.hairdryer[2], discountType: 'fixed', discountValue: 200, productIds: ['p104', 'p105'], categoryIds: [], brandIds: ['dyson'], startDate: daysFromNow(3), endDate: daysFromNow(25), status: 'scheduled', createdAt: daysAgo(5) },
  { id: 'of-6', title: 'National Day Sale', titleAr: 'تخفيضات اليوم الوطني', description: '25% off sitewide for Saudi National Day.', banner: IMAGE_POOL.arab[0], discountType: 'percentage', discountValue: 25, productIds: [], categoryIds: [], brandIds: [], startDate: daysAgo(20), endDate: daysAgo(14), status: 'expired', createdAt: daysAgo(40) },
]

/* ---------------- Banners ---------------- */

export const seedBanners: Banner[] = [
  { id: 'bn-1', title: 'Beauty, Authenticated.', titleAr: 'جمال أصلي، موثّق.', subtitle: 'The world’s most loved beauty brands, sourced directly from their official Saudi distributors.', subtitleAr: 'أشهر علامات الجمال العالمية، مباشرة من موزعيها الرسميين في المملكة.', imageDesktop: IMAGE_POOL.arab[0], imageMobile: IMAGE_POOL.arab[0], ctaLabel: 'Shop Now', ctaLabelAr: 'تسوقي الآن', ctaUrl: '/category/care', placement: 'homepage_hero', startDate: daysAgo(30), endDate: daysFromNow(60), status: 'published', sortOrder: 1, clicks: 4210, impressions: 118400, createdAt: daysAgo(30) },
  { id: 'bn-2', title: 'Original Beauty. Delivered Across Saudi Arabia.', titleAr: 'جمال أصلي. يصلك في كل أنحاء السعودية.', subtitle: 'Free delivery on orders over SAR 250.', subtitleAr: 'توصيل مجاني للطلبات فوق 250 ريال.', imageDesktop: IMAGE_POOL.skinmodel[0], imageMobile: IMAGE_POOL.skinmodel[0], ctaLabel: 'Shop Skin Care', ctaLabelAr: 'تسوقي العناية بالبشرة', ctaUrl: '/category/skin-care', placement: 'homepage_hero', startDate: daysAgo(30), endDate: daysFromNow(60), status: 'published', sortOrder: 2, clicks: 3120, impressions: 109800, createdAt: daysAgo(30) },
  { id: 'bn-3', title: 'Professional Beauty Starts Here.', titleAr: 'الجمال الاحترافي يبدأ من هنا.', subtitle: 'Salon-grade colour, care and tools — bulk-friendly and authentic.', subtitleAr: 'ألوان وعناية وأدوات بمستوى الصالونات — مناسبة للجملة وأصلية.', imageDesktop: IMAGE_POOL.salon[0], imageMobile: IMAGE_POOL.salon[0], ctaLabel: 'Shop Professional', ctaLabelAr: 'تسوقي المنتجات الاحترافية', ctaUrl: '/category/salon-supplies', placement: 'homepage_hero', startDate: daysAgo(30), endDate: daysFromNow(60), status: 'published', sortOrder: 3, clicks: 1980, impressions: 101200, createdAt: daysAgo(30) },
  { id: 'bn-4', title: 'Your Beauty Ritual, Elevated.', titleAr: 'روتين جمالك، بمستوى أرقى.', subtitle: 'Layer serums, creams and SPF from the brands dermatologists trust.', subtitleAr: 'سيرومات وكريمات وواقيات شمس من العلامات التي يثق بها أطباء الجلد.', imageDesktop: IMAGE_POOL.skinmodel[1], imageMobile: IMAGE_POOL.skinmodel[1], ctaLabel: 'Discover Skin Care', ctaLabelAr: 'اكتشفي العناية بالبشرة', ctaUrl: '/category/skin-care', placement: 'editorial', startDate: daysAgo(14), endDate: daysFromNow(40), status: 'published', sortOrder: 1, clicks: 860, impressions: 40300, createdAt: daysAgo(14) },
  { id: 'bn-5', title: 'Fragrance Week', titleAr: 'أسبوع العطور', subtitle: 'Up to 15% off Dior, Lancôme and Guerlain.', subtitleAr: 'خصم حتى 15% على ديور ولانكوم وجيرلان.', imageDesktop: IMAGE_POOL.perfume[4], imageMobile: IMAGE_POOL.perfume[4], ctaLabel: 'Shop Perfumes', ctaLabelAr: 'تسوقي العطور', ctaUrl: '/category/perfumes', placement: 'promotional', startDate: daysAgo(3), endDate: daysFromNow(4), status: 'published', sortOrder: 1, clicks: 1540, impressions: 52800, createdAt: daysAgo(4) },
  { id: 'bn-6', title: 'Makeup Must-Haves', titleAr: 'أساسيات المكياج', subtitle: 'Fenty, Huda Beauty, Rare Beauty and more.', subtitleAr: 'فنتي وهدى بيوتي ورير بيوتي والمزيد.', imageDesktop: IMAGE_POOL.flatlay[1], imageMobile: IMAGE_POOL.flatlay[1], ctaLabel: 'Shop Makeup', ctaLabelAr: 'تسوقي المكياج', ctaUrl: '/category/makeup', placement: 'category', startDate: daysAgo(10), endDate: daysFromNow(50), status: 'published', sortOrder: 1, clicks: 420, impressions: 19800, createdAt: daysAgo(10) },
  { id: 'bn-7', title: 'Dyson Device Days', titleAr: 'أيام أجهزة دايسون', subtitle: '200 SAR off Supersonic and Airwrap.', subtitleAr: 'خصم 200 ريال على Supersonic وAirwrap.', imageDesktop: IMAGE_POOL.hairdryer[2], imageMobile: IMAGE_POOL.hairdryer[2], ctaLabel: 'Shop Devices', ctaLabelAr: 'تسوقي الأجهزة', ctaUrl: '/category/beauty-devices', placement: 'promotional', startDate: daysFromNow(3), endDate: daysFromNow(25), status: 'scheduled', sortOrder: 2, clicks: 0, impressions: 0, createdAt: daysAgo(5) },
  { id: 'bn-8', title: 'Free Delivery Weekend', titleAr: 'عطلة التوصيل المجاني', subtitle: 'Free standard delivery on every order.', subtitleAr: 'توصيل عادي مجاني على كل الطلبات.', imageDesktop: IMAGE_POOL.flatlay[2], imageMobile: IMAGE_POOL.flatlay[2], ctaLabel: 'Shop Best Sellers', ctaLabelAr: 'تسوقي الأكثر مبيعًا', ctaUrl: '/best-sellers', placement: 'mobile_hero', startDate: daysAgo(2), endDate: daysFromNow(2), status: 'published', sortOrder: 1, clicks: 690, impressions: 21400, createdAt: daysAgo(2) },
  { id: 'bn-9', title: 'White Friday Is Coming', titleAr: 'الجمعة البيضاء قادمة', subtitle: 'Up to 30% off — mark your calendar.', subtitleAr: 'خصم حتى 30% — احفظي الموعد.', imageDesktop: IMAGE_POOL.editorial[0], imageMobile: IMAGE_POOL.editorial[0], ctaLabel: 'Join the List', ctaLabelAr: 'انضمي للقائمة', ctaUrl: '/offers', placement: 'homepage_hero', startDate: daysFromNow(30), endDate: daysFromNow(52), status: 'draft', sortOrder: 4, clicks: 0, impressions: 0, createdAt: daysAgo(1) },
]

/* ---------------- Homepage sections ---------------- */

const SECTION_DEFS: [string, string, string, string][] = [
  ['hero', 'Hero slider', 'السلايدر الرئيسي', 'Rotating homepage hero banners'],
  ['trust', 'Trust bar', 'شريط الثقة', 'Original · Authorized · Delivery · Secure payment'],
  ['categories', 'Shop by category', 'تسوقي حسب الفئة', 'Six editorial category tiles'],
  ['brands', 'Featured brands', 'العلامات المميزة', 'Brand wordmark strip'],
  ['offers', 'Flash deals', 'العروض السريعة', 'On-sale products with countdown'],
  ['best_sellers', 'Best sellers', 'الأكثر مبيعًا', 'Ranked product rail'],
  ['new_arrivals', 'New arrivals', 'وصل حديثًا', 'Editorial image + newest products'],
  ['trending', 'Trending now', 'الرائج الآن', 'Dark band with a featured product'],
  ['concerns', 'Shop by concern', 'تسوقي حسب المشكلة', 'Acne, dry skin, hair loss and more'],
  ['editorial', 'Editorial banner', 'البانر التحريري', '“Your Beauty Ritual, Elevated.”'],
  ['professional', 'Salon professionals', 'المحترفون', 'Dark section for salon customers'],
  ['testimonials', 'Testimonials', 'آراء العملاء', 'Customer quotes carousel'],
  ['newsletter', 'Newsletter', 'النشرة البريدية', '“Join the Beauty List” sign-up'],
  ['gallery', 'Instagram gallery', 'معرض إنستغرام', 'Six-image social grid'],
]

export const seedHomepage: HomepageSection[] = SECTION_DEFS.map(([key, title, titleAr, note], i) => ({ id: `hs-${key}`, key, title, titleAr, note, enabled: true, order: i + 1 }))

/* ---------------- Notifications ---------------- */

const lowStock = seedProducts.filter((p) => p.stock <= p.lowStockThreshold).slice(0, 6)

export const seedNotifications: AdminNotification[] = [
  ...seedOrders.slice(0, 8).map((o, i) => ({ id: `nt-o${i}`, type: 'new_order' as const, title: `New order ${o.number}`, body: `${o.customerName} placed an order of ${STORE_CONFIG.currency} ${o.total.toLocaleString('en-US')}.`, href: `/orders/${o.id}`, read: i > 2, date: o.createdAt })),
  ...lowStock.map((p, i) => ({ id: `nt-s${i}`, type: 'low_stock' as const, title: p.stock === 0 ? `Out of stock: ${p.name}` : `Low stock: ${p.name}`, body: `${p.stock} units left (threshold ${p.lowStockThreshold}). SKU ${p.sku}.`, href: `/inventory/${p.id}`, read: i > 1, date: daysAgo(i * 0.4) })),
  ...seedCustomers.slice(0, 4).map((c, i) => ({ id: `nt-c${i}`, type: 'new_customer' as const, title: 'New customer registered', body: `${c.name} from ${SAUDI_CITIES.find((x) => x.id === c.city)!.en} created an account.`, href: `/customers/${c.id}`, read: i > 0, date: c.registeredAt })),
  ...seedReturns.slice(0, 3).map((rt, i) => ({ id: `nt-r${i}`, type: 'return_request' as const, title: `Return request ${rt.number}`, body: `${rt.customerName} requested a return: ${rt.reason}.`, href: `/returns/${rt.id}`, read: i > 0, date: rt.createdAt })),
  ...seedReviews.filter((x) => x.status === 'pending').slice(0, 3).map((rv, i) => ({ id: `nt-v${i}`, type: 'review_pending' as const, title: 'Review awaiting moderation', body: `${rv.rating}★ on ${rv.productName} by ${rv.customerName}.`, href: `/reviews/${rv.id}`, read: false, date: rv.createdAt })),
  { id: 'nt-cm1', type: 'campaign_ending' as const, title: 'Campaign ending soon', body: 'Skin Care Flash Sale ends in 24 hours.', href: '/campaigns', read: false, date: daysAgo(0, 2) },
  { id: 'nt-cm2', type: 'campaign_ending' as const, title: 'Campaign ending soon', body: 'Fragrance Week ends in 4 days.', href: '/campaigns', read: true, date: daysAgo(1) },
].sort((a, b) => b.date.localeCompare(a.date))

/* ---------------- Activity log ---------------- */

const ACT_TEMPLATES: [ActivityLog['action'], ActivityLog['entity'], (n: string) => string][] = [
  ['updated', 'product', (n) => `Product '${n}' was updated.`],
  ['status_changed', 'order', (n) => `Order ${n} was marked as shipped.`],
  ['created', 'coupon', (n) => `Coupon ${n} was created.`],
  ['created', 'customer', (n) => `Customer ${n} registered.`],
  ['approved', 'review', (n) => `Review on '${n}' was approved.`],
  ['published', 'banner', (n) => `Banner '${n}' was published.`],
  ['adjusted', 'inventory', (n) => `Stock adjusted for '${n}' (+24, received shipment).`],
  ['created', 'product', (n) => `Product '${n}' was added to the catalog.`],
  ['refunded', 'return', (n) => `Return ${n} was refunded.`],
  ['updated', 'settings', () => 'Shipping settings were updated.'],
  ['login', 'session', () => 'Signed in to the admin panel.'],
  ['exported', 'order', () => 'Orders were exported to CSV.'],
]

export const seedActivity: ActivityLog[] = Array.from({ length: 64 }, (_, i) => {
  const [action, entity, fn] = ACT_TEMPLATES[i % ACT_TEMPLATES.length]
  const admin = seedAdmins[i % 6]
  const product = seedProducts[(i * 11) % seedProducts.length]
  const order = seedOrders[i % seedOrders.length]
  const name =
    entity === 'order' ? order.number : entity === 'coupon' ? seedCoupons[i % seedCoupons.length].code : entity === 'customer' ? seedCustomers[i % seedCustomers.length].name : entity === 'banner' ? seedBanners[i % seedBanners.length].title : entity === 'return' ? seedReturns[i % seedReturns.length].number : product.name
  return {
    id: `act-${5001 + i}`,
    userId: entity === 'customer' ? 'system' : admin.id,
    userName: entity === 'customer' ? 'System' : admin.name,
    action,
    entity,
    entityId: entity === 'order' ? order.id : entity === 'product' || entity === 'inventory' || entity === 'review' ? product.id : undefined,
    description: fn(name),
    ip: entity === 'customer' ? '—' : ADMIN_IPS[i % ADMIN_IPS.length],
    status: i % 29 === 28 ? 'failed' : 'success',
    date: daysAgo(i * 0.35, i % 5),
  }
})

/* ---------------- Settings ---------------- */

export const seedSettings: StoreSettings = {
  general: { storeName: STORE_CONFIG.name, storeEmail: STORE_CONFIG.supportEmail, supportPhone: STORE_CONFIG.supportPhone, whatsapp: STORE_CONFIG.whatsapp, address: STORE_CONFIG.address, logoUrl: '/logo.jpeg', faviconUrl: '/favicon.svg' },
  store: { currency: 'SAR', currencySymbol: STORE_CONFIG.currencySymbol, freeShippingThreshold: 250, defaultShippingFee: 25, expressShippingFee: 40, orderMinimum: 0, enableCod: true, enableReviews: true, enableWishlist: true, enableLoyalty: true },
  payments: { mada: true, visa: true, mastercard: true, applepay: true, stcpay: true, tabby: true, tamara: true, cod: true },
  shipping: {
    methods: [
      { id: 'standard', name: 'Standard Delivery', nameAr: 'التوصيل العادي', price: 25, freeThreshold: 250, estimate: '2–4 business days', enabled: true },
      { id: 'express', name: 'Express Delivery', nameAr: 'التوصيل السريع', price: 40, freeThreshold: 0, estimate: '1–2 business days', enabled: true },
    ],
    regions: SAUDI_CITIES.map((c, i) => ({ city: c.id, enabled: true, standardDays: i < 2 ? '1–2' : i < 6 ? '2–3' : '3–5', expressDays: i < 6 ? '1' : '1–2' })),
  },
  tax: { vatEnabled: true, vatRate: 15, display: 'inclusive', vatNumber: '3XXXXXXXXXXXXX3' },
  localization: { defaultLanguage: 'en', supported: ['en', 'ar'], currency: 'SAR', timezone: 'Asia/Riyadh', dateFormat: 'DD/MM/YYYY' },
  notifications: { newOrder: true, lowStock: true, newCustomer: false, returnRequest: true, reviewPending: true, dailySummary: true },
}

/** Brand name lookup helper for seeds that need it */
export const brandName = (id: string) => seedBrands.find((b) => b.id === id)?.name ?? id
void r
