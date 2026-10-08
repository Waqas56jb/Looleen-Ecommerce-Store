import type { Concern, Gender, HairType, LocalizedText, Product, Shade, SizeOption, SkinType } from './types'
import { brands } from './brands'
import { categories } from './categories'
import { poolImage, type ImagePoolKey } from './images'

/* --------------------------------------------------------------------------
   Variant presets
   -------------------------------------------------------------------------- */

const SHADES: Record<string, Shade[]> = {
  foundation: [
    { id: '110', name: '110 Porcelain', hex: '#f3d9c4' },
    { id: '170', name: '170 Light Beige', hex: '#e9c6a6' },
    { id: '230', name: '230 Warm Sand', hex: '#d9ad86' },
    { id: '310', name: '310 Golden Honey', hex: '#c38f62' },
    { id: '390', name: '390 Caramel', hex: '#a6714a' },
    { id: '450', name: '450 Espresso', hex: '#6f4630' },
  ],
  lip: [
    { id: 'nude', name: 'Bare Nude', hex: '#c58e7c' },
    { id: 'rose', name: 'Dusty Rose', hex: '#b76e79' },
    { id: 'berry', name: 'Velvet Berry', hex: '#7e2f45' },
    { id: 'red', name: 'Classic Red', hex: '#a3202e' },
    { id: 'coral', name: 'Soft Coral', hex: '#e07a6b' },
  ],
  blush: [
    { id: 'petal', name: 'Petal', hex: '#e8a2a0' },
    { id: 'peach', name: 'Peach Glow', hex: '#f0a882' },
    { id: 'mauve', name: 'Mauve', hex: '#b97b8a' },
    { id: 'terracotta', name: 'Terracotta', hex: '#c06a4f' },
  ],
  eye: [
    { id: 'black', name: 'Blackest Black', hex: '#141012' },
    { id: 'brown', name: 'Brownish Black', hex: '#3b2a24' },
  ],
  brow: [
    { id: 'taupe', name: 'Taupe', hex: '#8d7563' },
    { id: 'soft-brown', name: 'Soft Brown', hex: '#6d5140' },
    { id: 'dark-brown', name: 'Dark Brown', hex: '#46312a' },
    { id: 'ebony', name: 'Ebony', hex: '#231a17' },
  ],
  nail: [
    { id: 'ballet', name: 'Ballet Slipper', hex: '#f1cfcf' },
    { id: 'rosewood', name: 'Rosewood', hex: '#9a5560' },
    { id: 'cherry', name: 'Big Apple Red', hex: '#a51c2a' },
    { id: 'mocha', name: 'Mocha Latte', hex: '#8a6556' },
    { id: 'bare', name: 'Bubble Bath', hex: '#efd6cf' },
  ],
  lens: [
    { id: 'hazel', name: 'Hazel Honey', hex: '#a07445' },
    { id: 'grey', name: 'Misty Grey', hex: '#8c9298' },
    { id: 'green', name: 'Olive Green', hex: '#6d7a4a' },
    { id: 'brown', name: 'Cocoa Brown', hex: '#5d3f2d' },
  ],
  bronze: [
    { id: 'light', name: 'Light', hex: '#d29b74' },
    { id: 'medium', name: 'Medium', hex: '#b67b55' },
    { id: 'deep', name: 'Deep', hex: '#8a573a' },
  ],
}

/** Size factory: [label, price multiplier relative to base price] */
const SIZE_PRESETS: Record<string, [string, number][]> = {
  serum: [['30 ml', 1], ['50 ml', 1.45]],
  cream: [['50 ml', 1], ['100 ml', 1.7]],
  hair: [['250 ml', 1], ['500 ml', 1.65], ['1000 ml', 2.6]],
  hairPro: [['100 ml', 1], ['250 ml', 2.1]],
  perfume: [['50 ml', 1], ['100 ml', 1.45]],
  body: [['250 ml', 1], ['400 ml', 1.4]],
}

function buildSizes(preset: string | undefined, price: number, compare?: number): SizeOption[] {
  if (!preset) return []
  return SIZE_PRESETS[preset].map(([label, m]) => ({
    id: label.replace(/\s/g, '').toLowerCase(),
    label,
    price: Math.round(price * m),
    compareAtPrice: compare ? Math.round(compare * m) : undefined,
  }))
}

/* --------------------------------------------------------------------------
   Subcategory content templates (ingredients / how to use / Arabic copy)
   -------------------------------------------------------------------------- */

interface SubTemplate {
  ingredients: string
  howTo: LocalizedText
  arDesc: (brand: string) => string
}

const SUB: Record<string, SubTemplate> = {
  'skin-care': {
    ingredients: 'Aqua, Glycerin, Niacinamide, Sodium Hyaluronate, Panthenol, Ceramide NP, Tocopherol, Allantoin, Phenoxyethanol.',
    howTo: { en: 'Apply morning and evening to clean, dry skin. Gently press into face and neck. Follow with sunscreen in the morning.', ar: 'يوضع صباحًا ومساءً على بشرة نظيفة وجافة. يضغط بلطف على الوجه والرقبة. يتبع بواقي الشمس صباحًا.' },
    arDesc: (b) => `تركيبة متطورة من ${b} تمنح بشرتك عناية يومية فعالة ولطيفة بنتائج ملحوظة. منتج أصلي 100% من موزع معتمد.`,
  },
  'hair-care': {
    ingredients: 'Aqua, Cetearyl Alcohol, Argania Spinosa Kernel Oil, Hydrolyzed Keratin, Behentrimonium Chloride, Panthenol, Parfum.',
    howTo: { en: 'Apply to damp hair from mid-lengths to ends. Leave for 3–5 minutes, then rinse thoroughly. Use 2–3 times a week.', ar: 'يوضع على الشعر الرطب من المنتصف حتى الأطراف. يترك 3–5 دقائق ثم يشطف جيدًا. يستخدم 2–3 مرات أسبوعيًا.' },
    arDesc: (b) => `عناية احترافية بالشعر من ${b} تعيد له القوة واللمعان والنعومة. منتج أصلي 100% من موزع معتمد.`,
  },
  'body-care': {
    ingredients: 'Aqua, Glycerin, Butyrospermum Parkii Butter, Petrolatum, Dimethicone, Urea, Lactic Acid, Parfum.',
    howTo: { en: 'Massage generously onto clean skin after showering, focusing on dry areas. Use daily.', ar: 'يدلك بسخاء على بشرة نظيفة بعد الاستحمام مع التركيز على المناطق الجافة. يستخدم يوميًا.' },
    arDesc: (b) => `ترطيب غني من ${b} لبشرة ناعمة ومشرقة طوال اليوم. منتج أصلي 100% من موزع معتمد.`,
  },
  men: {
    ingredients: 'Aqua, Glycerin, Menthol, Aloe Barbadensis Leaf Juice, Argan Oil, Tocopherol, Parfum.',
    howTo: { en: 'Apply a small amount to clean skin or beard. Massage evenly. Use daily.', ar: 'توضع كمية صغيرة على بشرة أو لحية نظيفة وتدلك بالتساوي. يستخدم يوميًا.' },
    arDesc: (b) => `عناية رجالية متخصصة من ${b} لإطلالة مرتبة ومنتعشة. منتج أصلي 100% من موزع معتمد.`,
  },
  baby: {
    ingredients: 'Aqua, Glycerin, Persea Gratissima (Avocado) Oil, Helianthus Annuus Seed Oil, Panthenol. Fragrance-free, paraben-free.',
    howTo: { en: 'Apply gently to baby’s skin after bath or nappy change. Suitable from birth.', ar: 'يوضع بلطف على بشرة الطفل بعد الاستحمام أو تغيير الحفاض. مناسب منذ الولادة.' },
    arDesc: (b) => `عناية لطيفة وآمنة من ${b} لبشرة طفلك الرقيقة. منتج أصلي 100% من موزع معتمد.`,
  },
  face: {
    ingredients: 'Aqua, Cyclopentasiloxane, Titanium Dioxide, Glycerin, Iron Oxides, Dimethicone, Sodium Hyaluronate, Tocopherol.',
    howTo: { en: 'Apply to the center of the face and blend outward with a brush, sponge or fingertips. Build coverage as desired.', ar: 'يوضع في منتصف الوجه ويدمج للخارج بفرشاة أو إسفنجة أو بأطراف الأصابع. يمكن زيادة التغطية حسب الرغبة.' },
    arDesc: (b) => `قاعدة مكياج مثالية من ${b} بلمسة طبيعية وثبات يدوم طويلًا. منتج أصلي 100% من موزع معتمد.`,
  },
  eyes: {
    ingredients: 'Aqua, Paraffin, Cera Alba (Beeswax), Copernicia Cerifera Wax, Acacia Senegal Gum, Iron Oxides (CI 77499).',
    howTo: { en: 'Sweep from lash line outward. Layer for more intensity. Remove with an eye makeup remover.', ar: 'يطبق من خط الرموش للخارج. يمكن وضع طبقات لكثافة أكبر. يزال بمزيل مكياج العيون.' },
    arDesc: (b) => `مكياج عيون من ${b} لإطلالة آسرة وثبات طوال اليوم. منتج أصلي 100% من موزع معتمد.`,
  },
  lips: {
    ingredients: 'Ricinus Communis Seed Oil, Octyldodecanol, Cera Alba, Shea Butter, Tocopherol, CI 15850, CI 77491.',
    howTo: { en: 'Apply directly from the bullet, starting at the center of the lips and moving outward. Line first for precision.', ar: 'يطبق مباشرة من منتصف الشفاه نحو الأطراف. استخدمي محدد الشفاه أولًا لدقة أكبر.' },
    arDesc: (b) => `لون شفاه غني من ${b} بملمس مريح ولمسة نهائية فاخرة. منتج أصلي 100% من موزع معتمد.`,
  },
  brows: {
    ingredients: 'Hydrogenated Vegetable Oil, Synthetic Wax, Mica, Iron Oxides, Tocopherol.',
    howTo: { en: 'Use short, hair-like strokes to fill and define. Brush through with the spoolie to blend.', ar: 'ارسمي خطوطًا قصيرة تشبه الشعر لملء الحاجب وتحديده، ثم مشطي بالفرشاة للدمج.' },
    arDesc: (b) => `حواجب محددة وطبيعية مع ${b}. منتج أصلي 100% من موزع معتمد.`,
  },
  nails: {
    ingredients: 'Butyl Acetate, Ethyl Acetate, Nitrocellulose, Acetyl Tributyl Citrate, Isopropyl Alcohol. 10-free formula.',
    howTo: { en: 'Apply one coat of base, two thin coats of color, then seal with top coat. Allow each layer to dry.', ar: 'ضعي طبقة أساس ثم طبقتين رقيقتين من اللون ثم الطبقة العلوية. اتركي كل طبقة لتجف.' },
    arDesc: (b) => `طلاء أظافر احترافي من ${b} بلمعان عالٍ وثبات طويل. منتج أصلي 100% من موزع معتمد.`,
  },
  lenses: {
    ingredients: 'Hydrogel (HEMA), water content 38%. Sterile, buffered saline. Monthly disposable.',
    howTo: { en: 'Wash hands, place lens on fingertip and insert gently. Clean with solution after each use. Replace monthly.', ar: 'اغسلي يديك وضعي العدسة على طرف الإصبع وأدخليها بلطف. تنظف بالمحلول بعد كل استخدام وتستبدل شهريًا.' },
    arDesc: (b) => `عدسات ملونة مريحة من ${b} بلون طبيعي ساحر. منتج أصلي 100% من موزع معتمد.`,
  },
  'womens-perfumes': {
    ingredients: 'Alcohol Denat., Parfum (Fragrance), Aqua, Limonene, Linalool, Citronellol, Geraniol.',
    howTo: { en: 'Spray on pulse points — wrists, neck and behind the ears — from 15 cm away.', ar: 'يرش على نقاط النبض — المعصمين والرقبة وخلف الأذنين — من مسافة 15 سم.' },
    arDesc: (b) => `عطر نسائي آسر من ${b} بتوقيع فاخر يدوم طويلًا. منتج أصلي 100% من موزع معتمد.`,
  },
  'mens-perfumes': {
    ingredients: 'Alcohol Denat., Parfum (Fragrance), Aqua, Limonene, Linalool, Coumarin.',
    howTo: { en: 'Spray on chest and neck from 15 cm away. Avoid rubbing to keep the notes intact.', ar: 'يرش على الصدر والرقبة من مسافة 15 سم. تجنب الفرك للحفاظ على النفحات.' },
    arDesc: (b) => `عطر رجالي مميز من ${b} بحضور قوي وأنيق. منتج أصلي 100% من موزع معتمد.`,
  },
  'unisex-perfumes': {
    ingredients: 'Alcohol Denat., Parfum (Fragrance), Aqua, Benzyl Benzoate, Limonene, Linalool.',
    howTo: { en: 'Spray onto pulse points or clothing. Layer with matching body products for longer wear.', ar: 'يرش على نقاط النبض أو الملابس. يمكن دمجه مع منتجات الجسم لثبات أطول.' },
    arDesc: (b) => `عطر فاخر للجنسين من ${b} بتركيبة نادرة. منتج أصلي 100% من موزع معتمد.`,
  },
  'facial-devices': {
    ingredients: 'Device materials: medical-grade silicone, ABS. Rechargeable lithium-ion battery. Includes USB charging cable.',
    howTo: { en: 'Apply your cleanser or serum, then glide the device over the face in circular motions for 1–2 minutes.', ar: 'ضعي المنظف أو السيروم ثم مرري الجهاز على الوجه بحركات دائرية لمدة 1–2 دقيقة.' },
    arDesc: (b) => `جهاز تجميل ذكي من ${b} لنتائج بمستوى العيادة في المنزل. منتج أصلي 100% بضمان الوكيل.`,
  },
  'hair-devices': {
    ingredients: 'Device: digital motor, intelligent heat control, magnetic attachments. Saudi plug (Type G). 2-year agent warranty.',
    howTo: { en: 'Towel-dry hair, select heat and speed, and style section by section using the attachments.', ar: 'جففي الشعر بالمنشفة، اختاري الحرارة والسرعة، وصففي الشعر خصلة خصلة باستخدام الملحقات.' },
    arDesc: (b) => `جهاز شعر احترافي من ${b} لتجفيف سريع وتصفيف لامع دون تلف. منتج أصلي بضمان الوكيل.`,
  },
  'styling-tools': {
    ingredients: 'Device: ceramic/titanium plates, adjustable temperature 120–230°C, auto shut-off. Saudi plug. Agent warranty.',
    howTo: { en: 'Apply heat protectant to dry hair. Work in small sections, gliding smoothly from root to tip.', ar: 'ضعي واقي الحرارة على الشعر الجاف. اعملي على خصل صغيرة ومرري الأداة بسلاسة من الجذور للأطراف.' },
    arDesc: (b) => `أداة تصفيف احترافية من ${b} لنتائج صالون في المنزل. منتج أصلي بضمان الوكيل.`,
  },
  'hair-salon': {
    ingredients: 'Professional formula. Aqua, Cetearyl Alcohol, Hydrolyzed Wheat Protein, Bis-Aminopropyl Diglycol Dimaleate, Parfum.',
    howTo: { en: 'For professional use. Follow the technical sheet for mixing ratios and processing time.', ar: 'للاستخدام الاحترافي. اتبع الدليل الفني لنسب الخلط ووقت المعالجة.' },
    arDesc: (b) => `منتج صالونات احترافي من ${b} يعتمد عليه المصففون حول العالم. أصلي 100% من موزع معتمد.`,
  },
  'nail-salon': {
    ingredients: 'Professional nail formula. HEMA-free gel system / acetone-based remover. See label.',
    howTo: { en: 'For professional use. Cure gel layers under LED lamp for 30–60 seconds each.', ar: 'للاستخدام الاحترافي. تجفف طبقات الجل تحت مصباح LED لمدة 30–60 ثانية لكل طبقة.' },
    arDesc: (b) => `مستلزمات صالونات الأظافر من ${b} بجودة احترافية. أصلي 100% من موزع معتمد.`,
  },
  'professional-tools': {
    ingredients: 'Materials: Japanese stainless steel / synthetic taklon fibers / carbon. Ergonomic design.',
    howTo: { en: 'Clean and disinfect after each client. Store dry in the protective case.', ar: 'تنظف وتعقم بعد كل عميل. تحفظ جافة في العلبة الواقية.' },
    arDesc: (b) => `أدوات احترافية من ${b} بدقة وجودة يعتمد عليها الخبراء. أصلية 100%.`,
  },
  'disposable-supplies': {
    ingredients: '100% cotton / nitrile. Single use, hygienic packaging.',
    howTo: { en: 'Single use only. Dispose of hygienically after each client.', ar: 'للاستخدام مرة واحدة فقط. يتخلص منها بطريقة صحية بعد كل عميل.' },
    arDesc: (b) => `مستلزمات صحية للاستخدام مرة واحدة من ${b} لصالونات نظيفة وآمنة.`,
  },
}

/* --------------------------------------------------------------------------
   Product seeds
   flags: B=best seller · T=trending · N=new arrival · F=featured · P=professional
   -------------------------------------------------------------------------- */

interface Seed {
  name: string
  brand: string
  sub: string
  price: number
  was?: number
  rating: number
  reviews: number
  img: [ImagePoolKey, number]
  flags?: string
  desc: string
  concerns?: Concern[]
  skin?: SkinType[]
  hair?: HairType[]
  shades?: keyof typeof SHADES
  sizes?: keyof typeof SIZE_PRESETS
  gender?: Gender
  stock?: number
  tags?: string[]
}

const S: Seed[] = [
  /* ---------------- Skin care ---------------- */
  { name: 'Revitalift Filler Hyaluronic Acid Serum', brand: 'loreal-paris', sub: 'skin-care', price: 89, was: 115, rating: 4.6, reviews: 842, img: ['serum', 0], flags: 'BF', desc: 'A plumping serum with 1.5% pure hyaluronic acid that visibly fills fine lines and leaves skin bouncy and hydrated.', concerns: ['hydration', 'anti-aging'], skin: ['dry', 'normal', 'combination'], sizes: 'serum' },
  { name: 'Niacinamide 10% + Zinc 1%', brand: 'the-ordinary', sub: 'skin-care', price: 45, rating: 4.5, reviews: 2310, img: ['serum', 4], flags: 'BT', desc: 'A high-strength vitamin and mineral formula that targets blemishes, visible pores and uneven tone.', concerns: ['acne', 'dark-spots'], skin: ['oily', 'combination'], sizes: 'serum' },
  { name: 'Hyaluronic Acid 2% + B5', brand: 'the-ordinary', sub: 'skin-care', price: 49, rating: 4.6, reviews: 1655, img: ['serum', 6], flags: 'B', desc: 'Multi-depth hydration from low, medium and high molecular weight hyaluronic acid, finished with vitamin B5.', concerns: ['hydration'], skin: ['dry', 'normal', 'sensitive', 'combination', 'oily'], sizes: 'serum' },
  { name: 'Hydrating Facial Cleanser', brand: 'cerave', sub: 'skin-care', price: 69, rating: 4.8, reviews: 3120, img: ['cleanser', 0], flags: 'BF', desc: 'A gentle, non-foaming cleanser with three essential ceramides and hyaluronic acid that cleans without stripping.', concerns: ['hydration', 'dryness'], skin: ['dry', 'normal', 'sensitive'] },
  { name: 'Foaming Facial Cleanser', brand: 'cerave', sub: 'skin-care', price: 69, rating: 4.7, reviews: 1980, img: ['cleanser', 1], flags: 'T', desc: 'A refreshing gel-to-foam cleanser with niacinamide that removes excess oil while protecting the skin barrier.', concerns: ['acne'], skin: ['oily', 'combination'] },
  { name: 'Moisturising Cream', brand: 'cerave', sub: 'skin-care', price: 85, was: 99, rating: 4.8, reviews: 2604, img: ['cream', 0], flags: 'B', desc: 'A rich, non-greasy cream with ceramides and MVE technology for 24-hour moisture on face and body.', concerns: ['dryness', 'hydration'], skin: ['dry', 'sensitive', 'normal'], sizes: 'cream' },
  { name: 'Effaclar Duo+M Unifying Acne Care', brand: 'la-roche-posay', sub: 'skin-care', price: 119, was: 139, rating: 4.5, reviews: 1205, img: ['cleanser', 2], flags: 'BT', desc: 'Targets imperfections and post-blemish marks with niacinamide, salicylic acid and Procerad for clearer skin.', concerns: ['acne', 'dark-spots'], skin: ['oily', 'combination', 'sensitive'] },
  { name: 'Anthelios UVMune 400 Invisible Fluid SPF50+', brand: 'la-roche-posay', sub: 'skin-care', price: 135, rating: 4.7, reviews: 987, img: ['sunscreen', 0], flags: 'BFT', desc: 'Ultra-light, invisible sunscreen with Mexoryl 400 for very high protection against UVA and UVB rays.', concerns: ['sun-protection', 'sensitivity'], skin: ['sensitive', 'normal', 'oily', 'combination', 'dry'] },
  { name: 'Cicaplast Baume B5+', brand: 'la-roche-posay', sub: 'skin-care', price: 79, rating: 4.8, reviews: 1540, img: ['cream', 3], flags: 'T', desc: 'A soothing multi-purpose balm that repairs and comforts dry, irritated skin for the whole family.', concerns: ['sensitivity', 'dryness'], skin: ['sensitive', 'dry'] },
  { name: 'Minéral 89 Hyaluronic Acid Booster', brand: 'vichy', sub: 'skin-care', price: 145, was: 175, rating: 4.6, reviews: 712, img: ['serum', 2], flags: 'F', desc: 'A daily booster with 89% volcanic water and hyaluronic acid to strengthen and plump the skin barrier.', concerns: ['hydration', 'sensitivity'], skin: ['sensitive', 'dry', 'normal', 'combination'], sizes: 'serum' },
  { name: 'Hyaluron-Filler Night Cream', brand: 'eucerin', sub: 'skin-care', price: 159, rating: 4.4, reviews: 356, img: ['cream', 1], desc: 'A rich regenerating night cream that fills deep wrinkles and improves skin elasticity overnight.', concerns: ['anti-aging'], skin: ['dry', 'normal'], sizes: 'cream' },
  { name: 'Advanced Snail 96 Mucin Power Essence', brand: 'cosrx', sub: 'skin-care', price: 89, was: 109, rating: 4.7, reviews: 2210, img: ['serum', 3], flags: 'BT', desc: 'A lightweight essence with 96% snail secretion filtrate that repairs, hydrates and restores a healthy glow.', concerns: ['hydration', 'sensitivity'], skin: ['dry', 'sensitive', 'normal', 'combination'] },
  { name: 'Low pH Good Morning Gel Cleanser', brand: 'cosrx', sub: 'skin-care', price: 49, rating: 4.5, reviews: 1340, img: ['cleanser', 3], flags: 'N', desc: 'A mild, low-pH gel cleanser with BHA and tea tree oil for a fresh, balanced start to the day.', concerns: ['acne'], skin: ['oily', 'combination', 'sensitive'] },
  { name: 'Zero Pore Pad 2.0', brand: 'medicube', sub: 'skin-care', price: 99, rating: 4.5, reviews: 640, img: ['skinset', 2], flags: 'NT', desc: 'Dual-texture exfoliating pads with AHA and BHA that refine pores and smooth uneven texture.', concerns: ['acne'], skin: ['oily', 'combination'] },
  { name: 'Advanced Night Repair Synchronized Multi-Recovery Complex', brand: 'estee-lauder', sub: 'skin-care', price: 449, was: 520, rating: 4.8, reviews: 1890, img: ['serum', 1], flags: 'BF', desc: 'The legendary night serum that visibly reduces multiple signs of ageing and boosts radiance while you sleep.', concerns: ['anti-aging', 'hydration'], skin: ['dry', 'normal', 'combination', 'oily', 'sensitive'], sizes: 'serum' },
  { name: 'Moisture Surge 100H Auto-Replenishing Hydrator', brand: 'clinique', sub: 'skin-care', price: 189, rating: 4.7, reviews: 830, img: ['cream', 2], flags: 'T', desc: 'A refreshing gel-cream with aloe bio-ferment and hyaluronic acid for 100 hours of non-stop hydration.', concerns: ['hydration'], skin: ['dry', 'normal', 'combination'], sizes: 'cream' },
  { name: 'Advanced Génifique Serum', brand: 'lancome', sub: 'skin-care', price: 429, rating: 4.7, reviews: 905, img: ['serum', 5], flags: 'F', desc: 'A microbiome-science serum that strengthens the skin barrier for visibly younger, more radiant skin.', concerns: ['anti-aging'], skin: ['normal', 'dry', 'combination', 'sensitive'], sizes: 'serum' },
  { name: 'Micellar Cleansing Water All-in-1', brand: 'garnier', sub: 'skin-care', price: 35, was: 45, rating: 4.6, reviews: 2870, img: ['skinset', 1], flags: 'B', desc: 'A no-rinse micellar water that removes makeup and impurities in one gentle step.', concerns: ['sensitivity'], skin: ['sensitive', 'normal', 'dry', 'oily', 'combination'] },
  { name: 'Retinol 0.5% in Squalane', brand: 'the-ordinary', sub: 'skin-care', price: 59, rating: 4.3, reviews: 760, img: ['serum', 7], flags: 'N', desc: 'A moderate-strength retinol in a water-free squalane base to target fine lines and uneven texture.', concerns: ['anti-aging', 'dark-spots'], skin: ['normal', 'combination', 'oily'] },
  { name: 'Dioptimist Pure Vitamin C Serum', brand: 'la-roche-posay', sub: 'skin-care', price: 199, was: 235, rating: 4.4, reviews: 302, img: ['skinset', 3], flags: 'N', desc: 'A brightening serum with 12% pure vitamin C and salicylic acid for visibly smoother, glowing skin.', concerns: ['dark-spots', 'anti-aging'], skin: ['normal', 'combination', 'oily'], sizes: 'serum' },

  /* ---------------- Hair care ---------------- */
  { name: 'Olaplex No.3 Hair Perfector', brand: 'olaplex', sub: 'hair-care', price: 149, was: 175, rating: 4.7, reviews: 3410, img: ['haircare', 0], flags: 'BFT', desc: 'The cult at-home bond-building treatment that repairs and strengthens damaged, broken hair.', concerns: ['damage'], hair: ['damaged', 'colored', 'dry'] },
  { name: 'Olaplex No.4 Bond Maintenance Shampoo', brand: 'olaplex', sub: 'hair-care', price: 139, rating: 4.6, reviews: 1250, img: ['shampoo', 0], flags: 'B', desc: 'A highly moisturising shampoo that repairs and protects every hair type while restoring shine.', concerns: ['damage'], hair: ['damaged', 'colored', 'all'], sizes: 'hair' },
  { name: 'Olaplex No.7 Bonding Oil', brand: 'olaplex', sub: 'hair-care', price: 149, rating: 4.6, reviews: 980, img: ['hairoil', 1], flags: 'T', desc: 'A weightless, highly concentrated reparative styling oil that boosts shine, softness and color vibrancy.', concerns: ['frizz', 'damage'], hair: ['frizzy', 'damaged', 'colored'] },
  { name: 'K18 Leave-In Molecular Repair Hair Mask', brand: 'k18', sub: 'hair-care', price: 299, rating: 4.7, reviews: 1460, img: ['haircare', 1], flags: 'BFT', desc: 'A 4-minute leave-in mask with patented K18Peptide that reverses damage from bleach, color and heat.', concerns: ['damage'], hair: ['damaged', 'colored', 'dry'] },
  { name: 'Moroccanoil Treatment Original', brand: 'moroccanoil', sub: 'hair-care', price: 179, was: 205, rating: 4.8, reviews: 2140, img: ['hairoil', 0], flags: 'BF', desc: 'The original argan oil-infused treatment that conditions, speeds up drying and adds brilliant shine.', concerns: ['frizz'], hair: ['dry', 'frizzy', 'all'], sizes: 'hairPro', tags: ['argan'] },
  { name: 'Elvive Extraordinary Oil Nourishing Shampoo', brand: 'loreal-paris', sub: 'hair-care', price: 39, was: 49, rating: 4.5, reviews: 1690, img: ['shampoo', 1], flags: 'B', desc: 'A nourishing shampoo with six precious flower oils for silky, manageable, dry hair.', concerns: ['dryness'], hair: ['dry'], sizes: 'hair' },
  { name: 'Elvive Hyaluron Plump Conditioner', brand: 'loreal-paris', sub: 'hair-care', price: 39, rating: 4.4, reviews: 720, img: ['shampoo', 3], flags: 'N', desc: 'A moisture-plumping conditioner with hyaluronic acid for bouncy, hydrated hair.', concerns: ['hydration'], hair: ['dry', 'all'], sizes: 'hair' },
  { name: 'Fructis Hair Food Banana Mask', brand: 'garnier', sub: 'hair-care', price: 45, rating: 4.5, reviews: 1120, img: ['haircare', 2], flags: 'T', desc: 'A 3-in-1 nourishing mask with banana and amla for intensely nourished, soft dry hair.', concerns: ['dryness'], hair: ['dry', 'curly'] },
  { name: 'Angel Rinse Volumising Conditioner', brand: 'kevin-murphy', sub: 'hair-care', price: 165, rating: 4.5, reviews: 210, img: ['shampoo', 2], flags: 'P', desc: 'A lightweight volumising conditioner for fine, coloured hair, scented with natural extracts.', concerns: ['volume'], hair: ['colored'], sizes: 'hair' },
  { name: 'Hair Growth Serum Anti-Hair Loss', brand: 'vichy', sub: 'hair-care', price: 189, was: 219, rating: 4.3, reviews: 410, img: ['hairoil', 2], flags: 'N', desc: 'Dercos Aminexil treatment that reduces hair loss and strengthens hair from the root.', concerns: ['hair-loss'], hair: ['hair-loss'] },

  /* ---------------- Body care ---------------- */
  { name: 'Soft Moisturising Cream', brand: 'nivea', sub: 'body-care', price: 29, rating: 4.6, reviews: 2210, img: ['bodylotion', 1], flags: 'B', desc: 'A light, refreshing cream with jojoba oil and vitamin E for soft, supple skin on face, hands and body.', concerns: ['hydration'], skin: ['normal', 'dry'] },
  { name: 'Intensive Care Advanced Repair Lotion', brand: 'vaseline', sub: 'body-care', price: 35, was: 42, rating: 4.7, reviews: 1540, img: ['bodylotion', 0], flags: 'B', desc: 'A fragrance-free body lotion with micro-droplets of Vaseline Jelly to heal very dry skin.', concerns: ['dryness'], skin: ['dry', 'sensitive'], sizes: 'body' },
  { name: 'UreaRepair PLUS 10% Urea Lotion', brand: 'eucerin', sub: 'body-care', price: 89, rating: 4.7, reviews: 640, img: ['bodylotion', 3], flags: 'T', desc: 'Intensive relief for very dry, rough and itchy skin with 10% urea and ceramides.', concerns: ['dryness'], skin: ['dry'], sizes: 'body' },
  { name: 'Moisturising Lotion Face & Body', brand: 'cerave', sub: 'body-care', price: 75, rating: 4.7, reviews: 1180, img: ['bodylotion', 4], flags: 'F', desc: 'A lightweight daily lotion with ceramides and hyaluronic acid that absorbs quickly for 24h hydration.', concerns: ['hydration'], skin: ['normal', 'dry', 'sensitive'], sizes: 'body' },
  { name: 'Lipikar AP+M Triple Repair Balm', brand: 'la-roche-posay', sub: 'body-care', price: 129, rating: 4.8, reviews: 520, img: ['bodylotion', 5], flags: 'N', desc: 'A soothing body balm for very dry, eczema-prone skin — suitable for babies, children and adults.', concerns: ['dryness', 'sensitivity'], skin: ['dry', 'sensitive'], sizes: 'body' },
  { name: 'Body Milk Cocoa Butter', brand: 'vaseline', sub: 'body-care', price: 32, rating: 4.4, reviews: 610, img: ['bodylotion', 2], desc: 'A rich, glowing body milk with pure cocoa butter for radiant, deeply moisturised skin.', concerns: ['hydration'], skin: ['dry', 'normal'], sizes: 'body' },

  /* ---------------- Men ---------------- */
  { name: 'Men Expert Hydra Energetic Moisturiser', brand: 'loreal-paris', sub: 'men', price: 49, rating: 4.3, reviews: 480, img: ['men', 1], gender: 'men', desc: 'An anti-fatigue moisturiser with vitamin C and taurine that wakes up tired-looking skin.', concerns: ['hydration'], skin: ['normal', 'oily'] },
  { name: 'Men Sensitive Post Shave Balm', brand: 'nivea', sub: 'men', price: 39, was: 49, rating: 4.6, reviews: 830, img: ['men', 2], flags: 'B', gender: 'men', desc: 'An alcohol-free after-shave balm with chamomile that instantly soothes razor burn.', concerns: ['sensitivity'], skin: ['sensitive'] },
  { name: 'Beard & Skin Oil', brand: 'kevin-murphy', sub: 'men', price: 129, rating: 4.5, reviews: 145, img: ['men', 0], flags: 'N', gender: 'men', desc: 'A lightweight beard oil with argan and jojoba that softens beard hair and nourishes the skin beneath.', concerns: ['dryness'] },

  /* ---------------- Baby ---------------- */
  { name: 'Hydra Bébé Body Lotion', brand: 'mustela', sub: 'baby', price: 69, rating: 4.8, reviews: 410, img: ['baby', 0], flags: 'B', gender: 'kids', desc: 'A light, hydrating lotion with natural avocado for baby’s delicate skin — from birth.', concerns: ['hydration'], skin: ['sensitive'], sizes: 'body' },
  { name: 'Gentle Cleansing Gel Hair & Body', brand: 'mustela', sub: 'baby', price: 59, rating: 4.7, reviews: 335, img: ['bodylotion', 6], gender: 'kids', desc: 'A tear-free, soap-free cleansing gel that gently washes baby’s hair and body.', concerns: ['sensitivity'], skin: ['sensitive'] },
  { name: 'Baby Moisturising Cream', brand: 'cerave', sub: 'baby', price: 65, rating: 4.7, reviews: 220, img: ['cream', 4], flags: 'N', gender: 'kids', desc: 'A fragrance-free baby cream with ceramides to help protect baby’s developing skin barrier.', concerns: ['dryness', 'sensitivity'], skin: ['sensitive', 'dry'] },

  /* ---------------- Makeup · Face ---------------- */
  { name: "Pro Filt'r Soft Matte Longwear Foundation", brand: 'fenty-beauty', sub: 'face', price: 189, rating: 4.6, reviews: 2140, img: ['foundation', 2], flags: 'BFT', desc: 'A soft-matte, long-wear foundation with buildable medium-to-full coverage in an inclusive shade range.', concerns: ['long-wear'], skin: ['oily', 'combination', 'normal'], shades: 'foundation' },
  { name: 'Light Reflecting Advanced Skincare Foundation', brand: 'nars', sub: 'face', price: 229, rating: 4.6, reviews: 860, img: ['foundation', 3], flags: 'F', desc: 'A hybrid skincare foundation that blurs, smooths and reflects light for a natural, radiant finish.', skin: ['normal', 'dry', 'combination'], shades: 'foundation' },
  { name: 'Easy Bake Loose Baking & Setting Powder', brand: 'huda-beauty', sub: 'face', price: 155, was: 179, rating: 4.7, reviews: 1730, img: ['foundation', 1], flags: 'BT', desc: 'An ultra-fine setting powder that bakes, sets and blurs for a flawless, crease-free finish.', concerns: ['long-wear'], skin: ['oily', 'combination', 'normal'], shades: 'bronze' },
  { name: '#FauxFilter Luminous Matte Foundation', brand: 'huda-beauty', sub: 'face', price: 185, rating: 4.5, reviews: 940, img: ['foundation', 4], flags: 'B', desc: 'A full-coverage foundation with a luminous matte finish that stays put for up to 24 hours.', concerns: ['long-wear'], skin: ['oily', 'combination'], shades: 'foundation' },
  { name: 'Soft Pinch Liquid Blush', brand: 'rare-beauty', sub: 'face', price: 115, rating: 4.8, reviews: 2680, img: ['blush', 1], flags: 'BTF', desc: 'A weightless, long-lasting liquid blush that blends beautifully for a soft, healthy flush.', shades: 'blush' },
  { name: 'Orgasm Blush', brand: 'nars', sub: 'face', price: 145, rating: 4.7, reviews: 1320, img: ['blush', 0], flags: 'B', desc: 'The iconic peachy-pink blush with golden shimmer that flatters every skin tone.', shades: 'blush' },
  { name: 'Studio Fix Fluid SPF 15 Foundation', brand: 'mac', sub: 'face', price: 175, rating: 4.5, reviews: 1150, img: ['foundation', 0], flags: 'P', desc: 'A modern, medium-to-full coverage matte foundation with 24-hour wear, trusted by pros.', concerns: ['long-wear'], skin: ['oily', 'combination', 'normal'], shades: 'foundation' },
  { name: 'Luminous Silk Foundation', brand: 'giorgio-armani', sub: 'face', price: 265, rating: 4.7, reviews: 760, img: ['foundation', 5], flags: 'F', desc: 'A weightless, silky foundation for a natural, luminous glow with buildable medium coverage.', skin: ['normal', 'dry', 'combination'], shades: 'foundation' },
  { name: 'HD Skin Undetectable Foundation', brand: 'make-up-for-ever', sub: 'face', price: 219, rating: 4.5, reviews: 540, img: ['foundation', 3], flags: 'NP', desc: 'An undetectable, long-wear foundation with a natural finish built for HD cameras and real life.', concerns: ['long-wear'], shades: 'foundation' },
  { name: 'Airbrush Flawless Setting Spray', brand: 'charlotte-tilbury', sub: 'face', price: 155, rating: 4.6, reviews: 610, img: ['skinset', 4], flags: 'N', desc: 'A weightless setting spray that locks makeup for 16 hours with a fresh, hydrated finish.', concerns: ['long-wear'] },
  { name: 'Hollywood Flawless Filter', brand: 'charlotte-tilbury', sub: 'face', price: 199, was: 229, rating: 4.7, reviews: 1290, img: ['foundation', 4], flags: 'T', desc: 'A complexion booster that gives skin a soft-focus, lit-from-within glow.', shades: 'bronze' },
  { name: 'Fit Me Matte + Poreless Foundation', brand: 'maybelline', sub: 'face', price: 59, was: 69, rating: 4.4, reviews: 3020, img: ['foundation', 2], flags: 'B', desc: 'A lightweight matte foundation that refines pores and controls shine for a natural finish.', skin: ['oily', 'combination', 'normal'], shades: 'foundation' },

  /* ---------------- Makeup · Eyes ---------------- */
  { name: 'Lash Sensational Sky High Mascara', brand: 'maybelline', sub: 'eyes', price: 59, was: 69, rating: 4.6, reviews: 4210, img: ['mascara', 1], flags: 'BT', desc: 'A lengthening, volumising mascara with bamboo extract and a flex-tower brush for limitless length.', concerns: ['volume'], shades: 'eye' },
  { name: 'Lash Princess False Lash Effect Mascara', brand: 'essence', sub: 'eyes', price: 25, rating: 4.4, reviews: 2860, img: ['mascara', 0], flags: 'B', desc: 'A cult-favourite budget mascara with a conic brush for dramatic volume and length.', concerns: ['volume'], shades: 'eye' },
  { name: 'Modern Renaissance Eye Shadow Palette', brand: 'anastasia-beverly-hills', sub: 'eyes', price: 245, rating: 4.7, reviews: 1810, img: ['eyeshadow', 2], flags: 'BF', desc: 'Fourteen warm, wearable shades in matte and metallic finishes for endless looks.' },
  { name: 'Nude Obsessions Eyeshadow Palette', brand: 'huda-beauty', sub: 'eyes', price: 135, rating: 4.6, reviews: 960, img: ['eyeshadow', 1], flags: 'T', desc: 'A compact palette of nine nudes — mattes, shimmers and metallics — tailored to your undertone.' },
  { name: 'Epic Ink Liner Waterproof', brand: 'nyx', sub: 'eyes', price: 59, rating: 4.5, reviews: 1460, img: ['brows', 1], flags: 'B', desc: 'A waterproof liquid liner with a flexible brush tip for precise, jet-black wings.', concerns: ['long-wear'], shades: 'eye' },
  { name: 'Diorshow Iconic Overcurl Mascara', brand: 'dior', sub: 'eyes', price: 165, rating: 4.6, reviews: 520, img: ['mascara', 2], flags: 'N', desc: 'A volumising, curling mascara for spectacular lashes with 24-hour wear.', concerns: ['volume', 'long-wear'], shades: 'eye' },
  { name: 'Ultimate Shadow Palette — Warm Neutrals', brand: 'nyx', sub: 'eyes', price: 89, was: 109, rating: 4.4, reviews: 810, img: ['eyeshadow', 4], desc: 'Sixteen highly pigmented warm neutral shades in buttery matte and shimmer finishes.' },
  { name: 'Smudge Proof Waterproof Kohl', brand: 'kiko-milano', sub: 'eyes', price: 49, rating: 4.3, reviews: 410, img: ['eyeshadow', 6], flags: 'N', desc: 'An intense, creamy kohl pencil that glides on and stays waterproof all day.', concerns: ['long-wear'], shades: 'eye' },

  /* ---------------- Makeup · Lips ---------------- */
  { name: 'Dior Addict Lip Glow', brand: 'dior', sub: 'lips', price: 155, rating: 4.7, reviews: 1890, img: ['lipstick', 5], flags: 'BFT', desc: 'A colour-reviving lip balm that reacts to your lips’ natural pH for a custom, glowing tint.', shades: 'lip' },
  { name: 'Powder Kiss Lipstick', brand: 'mac', sub: 'lips', price: 99, rating: 4.6, reviews: 1430, img: ['lipstick', 1], flags: 'B', desc: 'A moisturising matte lipstick with a soft-focus, blurred finish that feels weightless.', shades: 'lip' },
  { name: 'Rouge Pur Couture The Slim', brand: 'ysl', sub: 'lips', price: 175, rating: 4.6, reviews: 720, img: ['lipstick', 6], flags: 'F', desc: 'A slim, sharp matte lipstick with intense colour and a comfortable leather-matte finish.', shades: 'lip' },
  { name: 'Matte Revolution Lipstick — Pillow Talk', brand: 'charlotte-tilbury', sub: 'lips', price: 145, rating: 4.8, reviews: 2210, img: ['lipstick', 7], flags: 'BT', desc: 'The world-famous nude-pink matte lipstick that flatters every complexion.', shades: 'lip' },
  { name: 'Butter Gloss', brand: 'nyx', sub: 'lips', price: 35, rating: 4.4, reviews: 1980, img: ['lipstick', 0], flags: 'B', desc: 'A creamy, non-sticky lip gloss with sheer-to-medium colour in delicious shades.', shades: 'lip' },
  { name: 'Gloss Bomb Universal Lip Luminizer', brand: 'fenty-beauty', sub: 'lips', price: 105, rating: 4.7, reviews: 1650, img: ['lipstick', 8], flags: 'T', desc: 'An explosive-shine lip gloss with a non-sticky formula and shea butter.', shades: 'lip' },
  { name: 'Super Stay Matte Ink Liquid Lipstick', brand: 'maybelline', sub: 'lips', price: 55, was: 65, rating: 4.5, reviews: 2760, img: ['lipstick', 3], flags: 'B', desc: 'A liquid lipstick with up to 16-hour wear and a precise arrow applicator.', concerns: ['long-wear'], shades: 'lip' },
  { name: 'Lip Sleeping Mask Berry', brand: 'kiko-milano', sub: 'lips', price: 45, rating: 4.3, reviews: 380, img: ['lipstick', 2], flags: 'N', desc: 'An overnight lip mask that softens and smooths dry lips while you sleep.', concerns: ['hydration'] },
  { name: 'Rouge Coco Flash', brand: 'chanel', sub: 'lips', price: 185, rating: 4.6, reviews: 490, img: ['lipstick', 4], flags: 'F', desc: 'A hydrating, shine-colour lipstick with a weightless feel and a vibrant, luminous finish.', shades: 'lip' },

  /* ---------------- Makeup · Brows ---------------- */
  { name: 'Brow Wiz Ultra-Slim Precision Pencil', brand: 'anastasia-beverly-hills', sub: 'brows', price: 115, rating: 4.7, reviews: 2340, img: ['brows', 0], flags: 'BF', desc: 'An ultra-slim retractable pencil for precise, hair-like strokes and natural definition.', shades: 'brow' },
  { name: 'Gimme Brow+ Volumizing Brow Gel', brand: 'benefit', sub: 'brows', price: 115, rating: 4.6, reviews: 1460, img: ['brows', 2], flags: 'T', desc: 'A tinted fibre gel that adds instant volume and shape to sparse brows.', concerns: ['volume'], shades: 'brow' },
  { name: 'Precisely, My Brow Pencil', brand: 'benefit', sub: 'brows', price: 109, rating: 4.6, reviews: 980, img: ['brows', 3], flags: 'N', desc: 'An ultra-fine brow-defining pencil that creates natural-looking, hair-like strokes.', shades: 'brow' },
  { name: 'Lift & Snatch! Brow Tint Pen', brand: 'nyx', sub: 'brows', price: 55, rating: 4.3, reviews: 520, img: ['brows', 1], desc: 'A micro-fine tint pen for long-lasting, feathered brows.', concerns: ['long-wear'], shades: 'brow' },

  /* ---------------- Makeup · Nails ---------------- */
  { name: 'Nail Lacquer — Big Apple Red', brand: 'opi', sub: 'nails', price: 45, rating: 4.7, reviews: 1120, img: ['nails', 0], flags: 'BP', desc: 'OPI’s iconic chip-resistant nail lacquer with a high-shine finish and the ProWide brush.', concerns: ['long-wear'], shades: 'nail' },
  { name: 'Infinite Shine Long-Wear Nail Polish', brand: 'opi', sub: 'nails', price: 59, rating: 4.6, reviews: 640, img: ['nails', 1], flags: 'T', desc: 'Gel-like shine and up to 11 days of wear without a UV lamp.', concerns: ['long-wear'], shades: 'nail' },
  { name: 'Gel Effect Nail Lacquer', brand: 'essence', sub: 'nails', price: 19, rating: 4.3, reviews: 860, img: ['nails', 2], flags: 'N', desc: 'A glossy nail lacquer with a gel-like finish and a wide brush for easy application.', shades: 'nail' },
  { name: 'Nail Envy Nail Strengthener', brand: 'opi', sub: 'nails', price: 89, rating: 4.6, reviews: 540, img: ['nails', 5], flags: 'P', desc: 'A strengthening treatment with hydrolysed wheat protein and calcium for stronger, longer nails.', concerns: ['damage'] },

  /* ---------------- Makeup · Lenses ---------------- */
  { name: 'Monthly Colored Contact Lenses', brand: 'huda-beauty', sub: 'lenses', price: 89, was: 109, rating: 4.4, reviews: 760, img: ['lenses', 1], flags: 'BT', desc: 'Comfortable monthly coloured lenses with a natural gradient for a soft, believable eye colour.', shades: 'lens' },
  { name: 'Natural Blend Daily Lenses (10 pairs)', brand: 'kiko-milano', sub: 'lenses', price: 75, rating: 4.3, reviews: 310, img: ['lenses', 2], flags: 'N', desc: 'Daily disposable coloured lenses with high water content for all-day comfort.', shades: 'lens' },
  { name: 'Glam Look Yearly Lenses', brand: 'nyx', sub: 'lenses', price: 119, rating: 4.2, reviews: 190, img: ['lenses', 3], desc: 'Yearly coloured lenses with a defined limbal ring for a striking, glamorous look.', shades: 'lens' },

  /* ---------------- Perfumes ---------------- */
  { name: 'N°5 Eau de Parfum', brand: 'chanel', sub: 'womens-perfumes', price: 625, rating: 4.8, reviews: 1320, img: ['perfume', 0], flags: 'BF', gender: 'women', desc: 'The timeless floral-aldehydic icon — a bouquet of May rose and jasmine wrapped in soft vanilla.', sizes: 'perfume' },
  { name: "J'adore Eau de Parfum", brand: 'dior', sub: 'womens-perfumes', price: 585, was: 650, rating: 4.8, reviews: 1120, img: ['perfume', 1], flags: 'BT', gender: 'women', desc: 'A luminous floral bouquet of ylang-ylang, Damascus rose and jasmine sambac.', sizes: 'perfume' },
  { name: 'Libre Eau de Parfum', brand: 'ysl', sub: 'womens-perfumes', price: 545, rating: 4.7, reviews: 860, img: ['perfume', 2], flags: 'T', gender: 'women', desc: 'A bold floral lavender fragrance with orange blossom and a warm vanilla-musk base.', sizes: 'perfume' },
  { name: 'Gucci Bloom Eau de Parfum', brand: 'gucci', sub: 'womens-perfumes', price: 495, rating: 4.6, reviews: 540, img: ['perfume', 3], flags: 'N', gender: 'women', desc: 'A rich white floral scent of tuberose, jasmine and Rangoon creeper.', sizes: 'perfume' },
  { name: 'La Vie Est Belle Eau de Parfum', brand: 'lancome', sub: 'womens-perfumes', price: 515, was: 575, rating: 4.7, reviews: 1430, img: ['perfume', 4], flags: 'B', gender: 'women', desc: 'A sweet gourmand iris fragrance with notes of praline, vanilla and patchouli.', sizes: 'perfume' },
  { name: 'Mon Guerlain Eau de Parfum', brand: 'guerlain', sub: 'womens-perfumes', price: 489, rating: 4.6, reviews: 330, img: ['perfume', 5], flags: 'F', gender: 'women', desc: 'A modern oriental lavender scent with Tahitian vanilla and sandalwood.', sizes: 'perfume' },
  { name: 'Bleu de Chanel Eau de Parfum', brand: 'chanel', sub: 'mens-perfumes', price: 595, rating: 4.8, reviews: 1980, img: ['mensperfume', 0], flags: 'BF', gender: 'men', desc: 'A woody aromatic fragrance of citrus, incense and cedar — the essence of freedom.', sizes: 'perfume' },
  { name: 'Sauvage Eau de Parfum', brand: 'dior', sub: 'mens-perfumes', price: 545, was: 610, rating: 4.8, reviews: 2410, img: ['mensperfume', 4], flags: 'BT', gender: 'men', desc: 'A fresh, raw and noble scent of Calabrian bergamot, ambroxan and vanilla.', sizes: 'perfume' },
  { name: 'Acqua di Giò Parfum', brand: 'giorgio-armani', sub: 'mens-perfumes', price: 495, rating: 4.7, reviews: 1120, img: ['mensperfume', 1], flags: 'T', gender: 'men', desc: 'An aquatic aromatic fragrance with marine notes, clary sage and patchouli.', sizes: 'perfume' },
  { name: 'Y Eau de Parfum', brand: 'ysl', sub: 'mens-perfumes', price: 455, rating: 4.6, reviews: 760, img: ['mensperfume', 2], flags: 'N', gender: 'men', desc: 'A fresh, intense fougère of apple, ginger, sage and amberwood.', sizes: 'perfume' },
  { name: 'Ombré Leather Eau de Parfum', brand: 'tom-ford', sub: 'mens-perfumes', price: 649, rating: 4.7, reviews: 430, img: ['mensperfume', 3], flags: 'F', gender: 'men', desc: 'A rich leather fragrance with cardamom, jasmine sambac and patchouli.', sizes: 'perfume' },
  { name: 'Oud Wood Eau de Parfum', brand: 'tom-ford', sub: 'unisex-perfumes', price: 1095, rating: 4.8, reviews: 620, img: ['unisexperfume', 0], flags: 'BF', gender: 'unisex', desc: 'A rare, exotic blend of oud, sandalwood, rosewood and cardamom — a Saudi favourite.', sizes: 'perfume', tags: ['oud'] },
  { name: 'Tobacco Vanille Eau de Parfum', brand: 'tom-ford', sub: 'unisex-perfumes', price: 1095, rating: 4.8, reviews: 540, img: ['unisexperfume', 1], flags: 'T', gender: 'unisex', desc: 'An opulent, warm fragrance of tobacco leaf, vanilla, tonka bean and dried fruits.', sizes: 'perfume' },
  { name: 'Aqua Allegoria Mandarine Basilic', brand: 'guerlain', sub: 'unisex-perfumes', price: 389, was: 435, rating: 4.5, reviews: 210, img: ['unisexperfume', 2], flags: 'N', gender: 'unisex', desc: 'A sparkling citrus-green fragrance of mandarin and basil — fresh and joyful.', sizes: 'perfume' },
  { name: 'Mémoire d’une Odeur Eau de Parfum', brand: 'gucci', sub: 'unisex-perfumes', price: 445, rating: 4.4, reviews: 180, img: ['unisexperfume', 3], gender: 'unisex', desc: 'A mineral aromatic scent with Roman chamomile, jasmine and musk.', sizes: 'perfume' },

  /* ---------------- Beauty devices ---------------- */
  { name: 'LUNA 4 Facial Cleansing Device', brand: 'foreo', sub: 'facial-devices', price: 899, was: 1099, rating: 4.6, reviews: 410, img: ['facialdevice', 0], flags: 'BF', desc: 'A smart, 2-zone facial cleansing and firming device with T-Sonic pulsations and app connectivity.', concerns: ['acne'], skin: ['normal', 'oily', 'combination', 'sensitive', 'dry'] },
  { name: 'Age-R Booster Pro', brand: 'medicube', sub: 'facial-devices', price: 1199, rating: 4.5, reviews: 260, img: ['facialdevice', 1], flags: 'TN', desc: 'A 6-in-1 at-home beauty device combining microcurrent, EMS and LED for firmer, glowing skin.', concerns: ['anti-aging'] },
  { name: 'Jade Facial Roller & Gua Sha Set', brand: 'medicube', sub: 'facial-devices', price: 129, rating: 4.3, reviews: 330, img: ['jade', 0], flags: 'N', desc: 'A natural jade roller and gua sha duo to depuff, sculpt and boost circulation.', concerns: ['anti-aging'] },
  { name: 'Supersonic Hair Dryer', brand: 'dyson', sub: 'hair-devices', price: 1899, rating: 4.8, reviews: 920, img: ['hairdryer', 0], flags: 'BFT', desc: 'Fast drying with intelligent heat control to protect natural shine — with five magnetic attachments.', hair: ['all'] },
  { name: 'Airwrap Multi-Styler Complete Long', brand: 'dyson', sub: 'hair-devices', price: 2499, was: 2699, rating: 4.7, reviews: 640, img: ['hairdryer', 2], flags: 'BT', desc: 'Curl, wave, smooth and dry with no extreme heat using the Coanda airflow effect.', hair: ['all'] },
  { name: 'Helios Professional Hair Dryer', brand: 'ghd', sub: 'hair-devices', price: 949, rating: 4.6, reviews: 210, img: ['hairdryer', 3], flags: 'NP', desc: 'A professional dryer with aerodynamic airflow for 30% faster drying and 2x shinier hair.', hair: ['all'] },
  { name: 'Platinum+ Professional Styler', brand: 'ghd', sub: 'styling-tools', price: 999, rating: 4.7, reviews: 480, img: ['styling', 0], flags: 'BP', desc: 'A smart straightener that predicts your hair’s needs for 70% stronger hair and 20% more colour protection.', hair: ['all', 'frizzy'] },
  { name: 'Nano Titanium Curling Iron 1¼"', brand: 'babyliss-pro', sub: 'styling-tools', price: 449, rating: 4.6, reviews: 330, img: ['curler', 0], flags: 'P', desc: 'A professional nano-titanium curling iron for long-lasting, glossy curls with less frizz.', hair: ['all'] },
  { name: 'Corrale Cordless Straightener', brand: 'dyson', sub: 'styling-tools', price: 1999, rating: 4.5, reviews: 180, img: ['styling', 0], flags: 'N', desc: 'A cordless straightener with flexing copper plates that shape around hair for less damage.', hair: ['all'] },

  /* ---------------- Salon supplies ---------------- */
  { name: 'Koleston Perfect ME+ Permanent Hair Color 60 ml', brand: 'wella-professionals', sub: 'hair-salon', price: 45, rating: 4.7, reviews: 520, img: ['salonhair', 0], flags: 'BP', desc: 'Professional permanent colour with ME+ molecule for vibrant, long-lasting results and full grey coverage.', hair: ['colored'], stock: 400 },
  { name: 'Welloxon Perfect Developer 6% 1L', brand: 'wella-professionals', sub: 'hair-salon', price: 69, rating: 4.6, reviews: 310, img: ['salonhair', 1], flags: 'P', desc: 'A creamy professional developer for precise, even lift and colour development.', stock: 260 },
  { name: 'Olaplex No.1 Bond Multiplier 525 ml (Salon Size)', brand: 'olaplex', sub: 'hair-salon', price: 899, rating: 4.9, reviews: 140, img: ['haircare', 3], flags: 'FP', desc: 'Salon-only bond multiplier added to colour and lightener services to protect hair integrity.', concerns: ['damage'], hair: ['damaged', 'colored'] },
  { name: 'Fusion Intense Repair Mask 500 ml', brand: 'wella-professionals', sub: 'hair-salon', price: 189, was: 215, rating: 4.6, reviews: 95, img: ['haircare', 4], flags: 'NP', desc: 'An intense repair mask with silk and amino acids for salon back-bar and retail.', concerns: ['damage'], hair: ['damaged'] },
  { name: 'GelColor Gel Nail Polish Kit', brand: 'opi', sub: 'nail-salon', price: 349, rating: 4.7, reviews: 120, img: ['nailsalon', 0], flags: 'P', desc: 'A professional gel system with base, top coat and three best-selling GelColor shades.', concerns: ['long-wear'] },
  { name: 'Expert Touch Lacquer Remover 960 ml', brand: 'opi', sub: 'nail-salon', price: 79, rating: 4.5, reviews: 88, img: ['nailsalon', 1], flags: 'P', desc: 'A salon-size, fast-acting remover with conditioning aloe vera for healthier nails.' },
  { name: 'Professional Makeup Brush Set (12 pcs)', brand: 'mac', sub: 'professional-tools', price: 499, was: 579, rating: 4.7, reviews: 260, img: ['brushes', 0], flags: 'FP', desc: 'A curated 12-piece set of pro face and eye brushes with synthetic fibres and a leather roll case.' },
  { name: 'Hairdressing Scissors 6" Japanese Steel', brand: 'babyliss-pro', sub: 'professional-tools', price: 389, rating: 4.6, reviews: 74, img: ['tools', 2], flags: 'NP', desc: 'Precision-sharp scissors forged from Japanese 440C steel with an ergonomic offset handle.' },
  { name: 'Carbon Cutting Comb Set', brand: 'babyliss-pro', sub: 'professional-tools', price: 59, rating: 4.4, reviews: 61, img: ['tools', 1], flags: 'P', desc: 'Anti-static, heat-resistant carbon combs in five essential salon sizes.' },
  { name: 'Ultra-Soft Salon Towels (12 pack)', brand: 'wella-professionals', sub: 'disposable-supplies', price: 119, rating: 4.5, reviews: 45, img: ['disposable', 0], flags: 'P', desc: 'Bleach-safe, quick-dry salon towels — highly absorbent and soft on clients’ skin.' },
  { name: 'Nitrile Gloves Powder-Free (100 pcs)', brand: 'wella-professionals', sub: 'disposable-supplies', price: 39, rating: 4.4, reviews: 130, img: ['tools', 4], flags: 'P', desc: 'Powder-free, latex-free nitrile gloves for colour services and hygienic treatments.', stock: 6 },
]

/* --------------------------------------------------------------------------
   Builder
   -------------------------------------------------------------------------- */

const subToCategory = new Map<string, string>()
categories.forEach((c) => c.subcategories.forEach((s) => subToCategory.set(s.slug, c.slug)))

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function shortOf(desc: string): string {
  const first = desc.split(/(?<=[.—])\s/)[0]
  return first.length > 110 ? first.slice(0, 107).trimEnd() + '…' : first
}

const DAY = 86_400_000
const NOW = new Date('2026-10-08T09:00:00Z').getTime()

export const products: Product[] = S.map((s, i) => {
  const brand = brands.find((b) => b.slug === s.brand)!
  const flags = s.flags ?? ''
  const tpl = SUB[s.sub]
  const id = `p${String(i + 1).padStart(3, '0')}`
  const stock = s.stock ?? ((i * 37) % 9 === 0 ? 4 : 18 + ((i * 53) % 140))
  const discount = s.was ? Math.round(((s.was - s.price) / s.was) * 100) : 0
  const [poolKey, poolIdx] = s.img
  const images = [poolImage(poolKey, poolIdx), poolImage(poolKey, poolIdx + 1), poolImage(poolKey, poolIdx + 2)]
  const isNew = flags.includes('N')
  const createdAt = new Date(NOW - (isNew ? (i % 12) + 1 : 30 + ((i * 11) % 300)) * DAY).toISOString()
  const name = s.name
  return {
    id,
    slug: slugify(`${brand.name} ${name}`),
    name,
    brandId: brand.id,
    brandName: brand.name,
    category: subToCategory.get(s.sub)!,
    subcategory: s.sub,
    description: {
      en: `${s.desc} Sourced directly from the authorized ${brand.name} distributor in Saudi Arabia, so every unit is 100% original with full batch traceability.`,
      ar: tpl.arDesc(brand.nameAr),
    },
    shortDescription: { en: shortOf(s.desc), ar: tpl.arDesc(brand.nameAr).split('.')[0] + '.' },
    price: s.price,
    compareAtPrice: s.was,
    discountPercentage: discount,
    currency: 'SAR',
    rating: s.rating,
    reviewCount: s.reviews,
    images: [...new Set(images)],
    thumbnail: images[0],
    shades: s.shades ? SHADES[s.shades] : [],
    sizes: buildSizes(s.sizes, s.price, s.was),
    stock,
    stockStatus: stock === 0 ? 'out_of_stock' : stock <= 8 ? 'low_stock' : 'in_stock',
    isOriginal: true,
    isAuthorized: true,
    isFeatured: flags.includes('F'),
    isBestSeller: flags.includes('B'),
    isTrending: flags.includes('T'),
    isNewArrival: isNew,
    isOnSale: discount > 0,
    tags: [brand.name.toLowerCase(), s.sub, ...(s.tags ?? [])],
    concerns: s.concerns ?? [],
    skinTypes: s.skin ?? [],
    hairTypes: s.hair ?? [],
    ingredients: tpl.ingredients,
    howToUse: tpl.howTo,
    deliveryEstimate: '1–3',
    sku: `LK-${s.sub.slice(0, 3).toUpperCase()}-${String(1000 + i * 7)}`,
    barcode: String(3600000000000 + i * 104729),
    gender: s.gender ?? (s.sub.startsWith('mens') ? 'men' : 'women'),
    professionalProduct: flags.includes('P') || !!brand.professional && subToCategory.get(s.sub) === 'salon-supplies',
    salesCount: Math.round(s.reviews * (flags.includes('B') ? 3.2 : 1.4)),
    createdAt,
  }
})

/* A couple of products are deliberately out of stock to exercise UI states */
;['p082', 'p076'].forEach((id) => {
  const p = products.find((x) => x.id === id)
  if (p) {
    p.stock = 0
    p.stockStatus = 'out_of_stock'
  }
})
