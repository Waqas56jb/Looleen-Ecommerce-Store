/**
 * Global business configuration for the admin. Default values only —
 * the live, editable copy lives in the settings service (persisted).
 */
export const STORE_CONFIG = {
  name: 'LOOKS',
  shortName: 'LK',
  tagline: 'All About You',
  adminTitle: 'LOOKS Admin',
  storefrontUrl: 'http://localhost:5173',
  currency: 'SAR',
  currencyNameAr: 'ريال',
  /** Official Saudi Riyal sign (U+20C1) — drawn as SVG by <Money /> */
  currencySymbol: '⃁',
  vatRate: 0.15,
  freeShippingThreshold: 250,
  shipping: {
    standard: { price: 25, days: '2–4' },
    express: { price: 40, days: '1–2' },
  },
  supportPhone: '+966 50 000 0000',
  whatsapp: '+966 50 000 0000',
  supportEmail: 'care@looks.sa',
  address: 'King Fahd Road, Al Olaya, Riyadh 12211, Saudi Arabia',
  timezone: 'Asia/Riyadh',
  defaultLanguage: 'en' as const,
  storagePrefix: 'admin_',
  mockLatency: [150, 300] as const,
} as const

export const SAUDI_CITIES = [
  { id: 'riyadh', en: 'Riyadh', ar: 'الرياض' },
  { id: 'jeddah', en: 'Jeddah', ar: 'جدة' },
  { id: 'dammam', en: 'Dammam', ar: 'الدمام' },
  { id: 'khobar', en: 'Khobar', ar: 'الخبر' },
  { id: 'mecca', en: 'Mecca', ar: 'مكة المكرمة' },
  { id: 'medina', en: 'Medina', ar: 'المدينة المنورة' },
  { id: 'abha', en: 'Abha', ar: 'أبها' },
  { id: 'tabuk', en: 'Tabuk', ar: 'تبوك' },
  { id: 'taif', en: 'Taif', ar: 'الطائف' },
  { id: 'jubail', en: 'Jubail', ar: 'الجبيل' },
] as const

export const PAYMENT_METHODS = [
  { id: 'mada', en: 'Mada', ar: 'مدى' },
  { id: 'visa', en: 'Visa', ar: 'فيزا' },
  { id: 'mastercard', en: 'Mastercard', ar: 'ماستركارد' },
  { id: 'applepay', en: 'Apple Pay', ar: 'Apple Pay' },
  { id: 'stcpay', en: 'STC Pay', ar: 'STC Pay' },
  { id: 'tabby', en: 'Tabby', ar: 'تابي' },
  { id: 'tamara', en: 'Tamara', ar: 'تمارا' },
  { id: 'cod', en: 'Cash on Delivery', ar: 'الدفع عند الاستلام' },
] as const

export type CityId = (typeof SAUDI_CITIES)[number]['id']
export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]['id']
