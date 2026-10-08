/**
 * Global business configuration. Every store-wide value (name, money,
 * shipping rules, contact channels) must come from here so the brand and
 * rules can change in one place.
 */
export const STORE_CONFIG = {
  name: 'LOOKS',
  tagline: 'All About You',
  taglineAr: 'كل ما يخصك',
  legalName: 'LOOKS Beauty Trading Est.',
  commercialRegistration: '1010XXXXXX',
  vatNumber: '3XXXXXXXXXXXXX3',
  currency: 'SAR',
  /** Official Saudi Riyal sign (U+20C1). The UI draws it as SVG via <Money />. */
  currencySymbol: '⃁',
  currencyNameAr: 'ريال',
  vatRate: 0.15,
  freeShippingThreshold: 250,
  shipping: {
    standard: { price: 25, days: '2–4' },
    express: { price: 40, days: '1–2' },
  },
  supportPhone: '+966 50 000 0000',
  whatsappNumber: '966500000000',
  supportEmail: 'care@looks.sa',
  address: 'King Fahd Road, Al Olaya, Riyadh 12211, Saudi Arabia',
  workingHours: 'Sun – Thu, 9:00 AM – 10:00 PM',
  defaultLanguage: 'en' as const,
  social: {
    instagram: 'https://instagram.com/',
    tiktok: 'https://tiktok.com/',
    facebook: 'https://facebook.com/',
  },
  loyalty: { pointsPerSar: 1, sarPerHundredPoints: 5 },
  mockOtp: '123456',
  storagePrefix: 'looks_store_',
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
  { id: 'mada', label: 'Mada', labelAr: 'مدى', kind: 'card' },
  { id: 'visa', label: 'Visa', labelAr: 'فيزا', kind: 'card' },
  { id: 'mastercard', label: 'Mastercard', labelAr: 'ماستركارد', kind: 'card' },
  { id: 'applepay', label: 'Apple Pay', labelAr: 'Apple Pay', kind: 'wallet' },
  { id: 'stcpay', label: 'STC Pay', labelAr: 'STC Pay', kind: 'wallet' },
  { id: 'tabby', label: 'Tabby', labelAr: 'تابي', kind: 'bnpl' },
  { id: 'tamara', label: 'Tamara', labelAr: 'تمارا', kind: 'bnpl' },
  { id: 'cod', label: 'Cash on Delivery', labelAr: 'الدفع عند الاستلام', kind: 'cod' },
] as const

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]['id']
export type CityId = (typeof SAUDI_CITIES)[number]['id']
