import type { LoyaltyActivity, LoyaltyReward, NotificationItem, ReturnRequest, SupportTicket } from '@/types'

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString()

export const seedNotifications: NotificationItem[] = [
  { id: 'n1', type: 'order', read: false, date: daysAgo(0), href: '/account/orders/o-3', title: { en: 'Your order is out for delivery', ar: 'طلبك في الطريق إليك' }, body: { en: 'Order SX-2026-10312 will arrive today. Our courier will call you before delivery.', ar: 'سيصل الطلب SX-2026-10312 اليوم. سيتصل بك المندوب قبل التوصيل.' } },
  { id: 'n2', type: 'offer', read: false, date: daysAgo(1), href: '/offers', title: { en: 'Fragrance Week is live', ar: 'أسبوع العطور بدأ' }, body: { en: 'Up to 15% off Dior, Lancôme and Guerlain — this week only.', ar: 'خصم حتى 15% على ديور ولانكوم وجيرلان — هذا الأسبوع فقط.' } },
  { id: 'n3', type: 'order', read: false, date: daysAgo(3), href: '/account/orders/o-2', title: { en: 'Order shipped', ar: 'تم شحن طلبك' }, body: { en: 'Order SX-2026-10398 has left our Riyadh warehouse.', ar: 'غادر الطلب SX-2026-10398 مستودعنا في الرياض.' } },
  { id: 'n4', type: 'new_arrival', read: true, date: daysAgo(6), href: '/new-arrivals', title: { en: 'New from Medicube', ar: 'جديد من ميديكيوب' }, body: { en: 'The Age-R Booster Pro has just landed — with official agent warranty.', ar: 'وصل جهاز Age-R Booster Pro للتو — بضمان الوكيل الرسمي.' } },
  { id: 'n5', type: 'tip', read: true, date: daysAgo(9), href: '/category/skin-care', title: { en: 'Beauty tip: SPF in the Saudi summer', ar: 'نصيحة جمال: واقي الشمس في صيف السعودية' }, body: { en: 'Reapply sunscreen every two hours outdoors — even on cloudy days.', ar: 'أعيدي وضع واقي الشمس كل ساعتين في الخارج — حتى في الأيام الغائمة.' } },
  { id: 'n6', type: 'order', read: true, date: daysAgo(18), href: '/account/orders/o-4', title: { en: 'Order delivered', ar: 'تم توصيل طلبك' }, body: { en: 'Order SX-2026-10112 was delivered. Share a review and earn 50 points.', ar: 'تم توصيل الطلب SX-2026-10112. شاركي تقييمك واكسبي 50 نقطة.' } },
]

export const loyaltyRewards: LoyaltyReward[] = [
  { id: 'lr1', points: 500, title: { en: '25 SAR off', ar: 'خصم 25 ريال' }, description: { en: 'A 25 SAR voucher on any order.', ar: 'قسيمة بقيمة 25 ريال على أي طلب.' } },
  { id: 'lr2', points: 1000, title: { en: '60 SAR off', ar: 'خصم 60 ريال' }, description: { en: 'A 60 SAR voucher on orders over 300 SAR.', ar: 'قسيمة بقيمة 60 ريال على الطلبات فوق 300 ريال.' } },
  { id: 'lr3', points: 1500, title: { en: 'Free express delivery × 3', ar: 'توصيل سريع مجاني × 3' }, description: { en: 'Three free express deliveries.', ar: 'ثلاث مرات توصيل سريع مجاني.' } },
  { id: 'lr4', points: 2500, title: { en: 'Luxury sample box', ar: 'صندوق عينات فاخر' }, description: { en: 'A curated box of five deluxe samples.', ar: 'صندوق مختار من خمس عينات فاخرة.' } },
]

export const loyaltyActivity: LoyaltyActivity[] = [
  { id: 'la1', points: 312, date: daysAgo(18), label: { en: 'Order SX-2026-10112', ar: 'الطلب SX-2026-10112' } },
  { id: 'la2', points: 50, date: daysAgo(16), label: { en: 'Product review', ar: 'تقييم منتج' } },
  { id: 'la3', points: -500, date: daysAgo(30), label: { en: 'Redeemed: 25 SAR off', ar: 'استبدال: خصم 25 ريال' } },
  { id: 'la4', points: 1899, date: daysAgo(41), label: { en: 'Order SX-2026-10045', ar: 'الطلب SX-2026-10045' } },
  { id: 'la5', points: -1000, date: daysAgo(44), label: { en: 'Redeemed: 60 SAR off', ar: 'استبدال: خصم 60 ريال' } },
  { id: 'la6', points: 100, date: daysAgo(90), label: { en: 'Welcome bonus', ar: 'مكافأة الترحيب' } },
]

export const seedReturns: ReturnRequest[] = [
  { id: 'rt1', orderNumber: 'SX-2026-09987', productName: 'Nail Lacquer — Big Apple Red', reason: 'Damaged on arrival', description: 'The cap was cracked and some polish leaked into the box.', status: 'refunded', createdAt: daysAgo(85) },
  { id: 'rt2', orderNumber: 'SX-2026-10112', productName: 'Foaming Facial Cleanser', reason: 'Wrong item received', description: 'I ordered the Hydrating Cleanser but received the Foaming one.', status: 'pickup_scheduled', createdAt: daysAgo(12) },
]

export const seedTickets: SupportTicket[] = [
  { id: 'tk1', subject: 'Batch code verification', message: 'Can you confirm the batch code on my Chanel N°5 is from the official distributor?', status: 'answered', createdAt: daysAgo(20) },
  { id: 'tk2', subject: 'Salon account pricing', message: 'I own a salon in Riyadh. Do you offer professional pricing for bulk Wella colour orders?', status: 'open', createdAt: daysAgo(2) },
]

export const RETURN_REASONS = [
  { id: 'damaged', en: 'Damaged on arrival', ar: 'تالف عند الوصول' },
  { id: 'wrong', en: 'Wrong item received', ar: 'استلمت منتجًا خاطئًا' },
  { id: 'not-as-described', en: 'Not as described', ar: 'غير مطابق للوصف' },
  { id: 'allergy', en: 'Allergic reaction', ar: 'رد فعل تحسسي' },
  { id: 'changed-mind', en: 'Changed my mind (sealed)', ar: 'غيرت رأيي (مغلق)' },
] as const
