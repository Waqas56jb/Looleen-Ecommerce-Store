import type { Category, Concern, LocalizedText } from './types'
import { poolImage } from './images'

export const categories: Category[] = [
  {
    slug: 'care',
    name: { en: 'Care', ar: 'العناية' },
    description: {
      en: 'Dermatologist-trusted skin, hair and body care from the world’s leading brands — every product 100% original.',
      ar: 'عناية بالبشرة والشعر والجسم يثق بها أطباء الجلد من أشهر العلامات العالمية — كل منتج أصلي 100%.',
    },
    image: poolImage('skinmodel', 0),
    subcategories: [
      { slug: 'skin-care', name: { en: 'Skin Care', ar: 'العناية بالبشرة' }, image: poolImage('skinset', 0) },
      { slug: 'hair-care', name: { en: 'Hair Care', ar: 'العناية بالشعر' }, image: poolImage('haircare', 0) },
      { slug: 'body-care', name: { en: 'Body Care', ar: 'العناية بالجسم' }, image: poolImage('bodylotion', 1) },
      { slug: 'men', name: { en: 'Men', ar: 'الرجال' }, image: poolImage('men', 0) },
      { slug: 'baby', name: { en: 'Baby', ar: 'الأطفال' }, image: poolImage('baby', 0) },
    ],
  },
  {
    slug: 'makeup',
    name: { en: 'Makeup', ar: 'المكياج' },
    description: {
      en: 'From flawless bases to statement lips — artist-approved makeup, authenticated and delivered across the Kingdom.',
      ar: 'من القاعدة المثالية إلى الشفاه الجريئة — مكياج معتمد من الفنانين وأصلي ويصلك في جميع أنحاء المملكة.',
    },
    image: poolImage('flatlay', 1),
    subcategories: [
      { slug: 'face', name: { en: 'Face', ar: 'الوجه' }, image: poolImage('foundation', 0) },
      { slug: 'eyes', name: { en: 'Eyes', ar: 'العيون' }, image: poolImage('eyeshadow', 3) },
      { slug: 'lips', name: { en: 'Lips', ar: 'الشفاه' }, image: poolImage('lipstick', 0) },
      { slug: 'brows', name: { en: 'Brows', ar: 'الحواجب' }, image: poolImage('brows', 0) },
      { slug: 'nails', name: { en: 'Nails', ar: 'الأظافر' }, image: poolImage('nails', 0) },
      { slug: 'lenses', name: { en: 'Lenses', ar: 'العدسات' }, image: poolImage('lenses', 0) },
    ],
  },
  {
    slug: 'perfumes',
    name: { en: 'Perfumes', ar: 'العطور' },
    description: {
      en: 'Signature scents from the great fragrance houses of Paris, Florence and beyond.',
      ar: 'عطور مميزة من أعرق دور العطور في باريس وفلورنسا وغيرها.',
    },
    image: poolImage('perfume', 7),
    subcategories: [
      { slug: 'womens-perfumes', name: { en: "Women's Perfumes", ar: 'عطور نسائية' }, image: poolImage('perfume', 0) },
      { slug: 'mens-perfumes', name: { en: "Men's Perfumes", ar: 'عطور رجالية' }, image: poolImage('mensperfume', 0) },
      { slug: 'unisex-perfumes', name: { en: 'Unisex Perfumes', ar: 'عطور للجنسين' }, image: poolImage('unisexperfume', 0) },
    ],
  },
  {
    slug: 'beauty-devices',
    name: { en: 'Beauty Devices', ar: 'أجهزة التجميل' },
    description: {
      en: 'Smart tools for salon-level results at home — facial devices, dryers and stylers.',
      ar: 'أدوات ذكية لنتائج بمستوى الصالون في المنزل — أجهزة الوجه ومجففات وأدوات التصفيف.',
    },
    image: poolImage('hairdryer', 2),
    subcategories: [
      { slug: 'facial-devices', name: { en: 'Facial Devices', ar: 'أجهزة الوجه' }, image: poolImage('facialdevice', 0) },
      { slug: 'hair-devices', name: { en: 'Hair Devices', ar: 'أجهزة الشعر' }, image: poolImage('hairdryer', 0) },
      { slug: 'styling-tools', name: { en: 'Styling Tools', ar: 'أدوات التصفيف' }, image: poolImage('styling', 0) },
    ],
  },
  {
    slug: 'salon-supplies',
    name: { en: 'Salon Supplies', ar: 'مستلزمات الصالونات' },
    description: {
      en: 'Professional-grade products and tools for salons, stylists and beauty professionals — bulk-friendly and 100% authentic.',
      ar: 'منتجات وأدوات احترافية للصالونات والمصففين وخبراء التجميل — مناسبة للشراء بالجملة وأصلية 100%.',
    },
    image: poolImage('hairsalonimg', 1),
    subcategories: [
      { slug: 'hair-salon', name: { en: 'Hair Salon', ar: 'صالون الشعر' }, image: poolImage('salonhair', 0) },
      { slug: 'nail-salon', name: { en: 'Nail Salon', ar: 'صالون الأظافر' }, image: poolImage('nailsalon', 0) },
      { slug: 'professional-tools', name: { en: 'Professional Tools', ar: 'أدوات احترافية' }, image: poolImage('tools', 0) },
      { slug: 'disposable-supplies', name: { en: 'Disposable Supplies', ar: 'مستلزمات للاستخدام مرة واحدة' }, image: poolImage('disposable', 0) },
    ],
  },
]

/** Homepage "Shop by category" tiles. `href` may target a parent or subcategory. */
export const featuredCategoryTiles: { name: LocalizedText; href: string; image: string }[] = [
  { name: { en: 'Skin Care', ar: 'العناية بالبشرة' }, href: '/category/skin-care', image: poolImage('skinmodel', 0) },
  { name: { en: 'Hair Care', ar: 'العناية بالشعر' }, href: '/category/hair-care', image: poolImage('salon', 2) },
  { name: { en: 'Makeup', ar: 'المكياج' }, href: '/category/makeup', image: poolImage('flatlay', 1) },
  { name: { en: 'Perfumes', ar: 'العطور' }, href: '/category/perfumes', image: poolImage('perfume', 7) },
  { name: { en: 'Beauty Devices', ar: 'أجهزة التجميل' }, href: '/category/beauty-devices', image: poolImage('hairdryer', 2) },
  { name: { en: 'Salon Supplies', ar: 'مستلزمات الصالونات' }, href: '/category/salon-supplies', image: poolImage('hairsalonimg', 1) },
]

export const CONCERN_LABELS: Record<Concern, LocalizedText> = {
  acne: { en: 'Acne & Blemishes', ar: 'حب الشباب والشوائب' },
  hydration: { en: 'Hydration', ar: 'الترطيب' },
  'anti-aging': { en: 'Anti-Aging', ar: 'مكافحة الشيخوخة' },
  'dark-spots': { en: 'Dark Spots', ar: 'البقع الداكنة' },
  'sun-protection': { en: 'Sun Protection', ar: 'الحماية من الشمس' },
  dryness: { en: 'Dry Skin', ar: 'البشرة الجافة' },
  sensitivity: { en: 'Sensitive Skin', ar: 'البشرة الحساسة' },
  'hair-loss': { en: 'Hair Loss', ar: 'تساقط الشعر' },
  frizz: { en: 'Frizz Control', ar: 'التحكم بالتجعد' },
  damage: { en: 'Damage Repair', ar: 'إصلاح التلف' },
  'long-wear': { en: 'Long Wear', ar: 'ثبات طويل' },
  volume: { en: 'Volume', ar: 'الكثافة' },
}

/** Homepage "Shop by concern" cards */
export const shopByConcern: { concern: Concern; image: string }[] = [
  { concern: 'acne', image: poolImage('skinmodel', 3) },
  { concern: 'dryness', image: poolImage('bodylotion', 2) },
  { concern: 'anti-aging', image: poolImage('skinmodel', 1) },
  { concern: 'hair-loss', image: poolImage('hairmodel', 0) },
  { concern: 'frizz', image: poolImage('salon', 2) },
  { concern: 'sensitivity', image: poolImage('skinmodel', 2) },
  { concern: 'hydration', image: poolImage('serum', 3) },
  { concern: 'sun-protection', image: poolImage('sunscreen', 0) },
]

export const SKIN_TYPE_LABELS: Record<string, LocalizedText> = {
  dry: { en: 'Dry', ar: 'جافة' },
  oily: { en: 'Oily', ar: 'دهنية' },
  combination: { en: 'Combination', ar: 'مختلطة' },
  sensitive: { en: 'Sensitive', ar: 'حساسة' },
  normal: { en: 'Normal', ar: 'عادية' },
}

export const HAIR_TYPE_LABELS: Record<string, LocalizedText> = {
  dry: { en: 'Dry', ar: 'جاف' },
  damaged: { en: 'Damaged', ar: 'تالف' },
  frizzy: { en: 'Frizzy', ar: 'مجعد' },
  colored: { en: 'Color-treated', ar: 'مصبوغ' },
  curly: { en: 'Curly', ar: 'كيرلي' },
  'hair-loss': { en: 'Hair Loss', ar: 'تساقط' },
  all: { en: 'All Hair Types', ar: 'جميع أنواع الشعر' },
}

/** Flat lookup: slug → { name, parent } for both levels */
export function findCategory(slug: string):
  | { kind: 'category'; category: Category }
  | { kind: 'subcategory'; category: Category; sub: Category['subcategories'][number] }
  | undefined {
  for (const c of categories) {
    if (c.slug === slug) return { kind: 'category', category: c }
    const sub = c.subcategories.find((s) => s.slug === slug)
    if (sub) return { kind: 'subcategory', category: c, sub }
  }
  return undefined
}
