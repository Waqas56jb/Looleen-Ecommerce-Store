import type { LocalizedText } from '@/types'
import { categories } from './categories'

export interface NavItem {
  label: LocalizedText
  href: string
  /** Category slug when the item opens a mega menu */
  megaCategory?: string
  accent?: boolean
}

export const mainNav: NavItem[] = [
  { label: { en: 'New Arrivals', ar: 'وصل حديثًا' }, href: '/new-arrivals' },
  ...categories.map((c) => ({ label: c.name, href: `/category/${c.slug}`, megaCategory: c.slug })),
  { label: { en: 'Brands', ar: 'العلامات' }, href: '/brands' },
  { label: { en: 'Offers', ar: 'العروض' }, href: '/offers', accent: true },
]

export const announcementMessages: LocalizedText[] = [
  { en: '100% Original Products • Authorized Saudi Distributors • Fast Delivery Across Saudi Arabia', ar: 'منتجات أصلية 100% • موزعون سعوديون معتمدون • توصيل سريع لجميع أنحاء المملكة' },
  { en: 'Free delivery on orders over SAR 250', ar: 'توصيل مجاني للطلبات فوق 250 ريال' },
  { en: 'Split your payment with Tabby or Tamara — 0% interest', ar: 'قسّمي دفعتك مع تابي أو تمارا — بدون فوائد' },
]

export const footerLinks: { title: LocalizedText; links: { label: LocalizedText; href: string }[] }[] = [
  {
    title: { en: 'Shop', ar: 'تسوق' },
    links: [
      { label: { en: 'Skin Care', ar: 'العناية بالبشرة' }, href: '/category/skin-care' },
      { label: { en: 'Hair Care', ar: 'العناية بالشعر' }, href: '/category/hair-care' },
      { label: { en: 'Makeup', ar: 'المكياج' }, href: '/category/makeup' },
      { label: { en: 'Perfumes', ar: 'العطور' }, href: '/category/perfumes' },
      { label: { en: 'Salon Supplies', ar: 'مستلزمات الصالونات' }, href: '/category/salon-supplies' },
      { label: { en: 'All Brands', ar: 'جميع العلامات' }, href: '/brands' },
    ],
  },
  {
    title: { en: 'Customer Care', ar: 'خدمة العملاء' },
    links: [
      { label: { en: 'Contact Us', ar: 'تواصل معنا' }, href: '/contact' },
      { label: { en: 'FAQ', ar: 'الأسئلة الشائعة' }, href: '/faq' },
      { label: { en: 'Shipping Policy', ar: 'سياسة الشحن' }, href: '/shipping-policy' },
      { label: { en: 'Returns & Refunds', ar: 'الإرجاع والاسترداد' }, href: '/return-policy' },
      { label: { en: 'Track Order', ar: 'تتبع الطلب' }, href: '/account/orders' },
    ],
  },
  {
    title: { en: 'Company', ar: 'الشركة' },
    links: [
      { label: { en: 'About Us', ar: 'من نحن' }, href: '/about' },
      { label: { en: 'Privacy Policy', ar: 'سياسة الخصوصية' }, href: '/privacy' },
      { label: { en: 'Terms & Conditions', ar: 'الشروط والأحكام' }, href: '/terms' },
    ],
  },
]
