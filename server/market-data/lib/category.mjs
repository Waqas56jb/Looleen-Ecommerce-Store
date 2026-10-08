/**
 * Map any listing (name + store category, English or Arabic) to the LOOKS
 * category tree used by the website and admin (client/src/data/categories.ts).
 * Rules are ordered: first match wins. Low-confidence results are flagged.
 */

export const LOOKS_CATEGORIES = {
  care: { en: 'Care', ar: 'العناية', subs: { 'skin-care': ['Skin Care', 'العناية بالبشرة'], 'hair-care': ['Hair Care', 'العناية بالشعر'], 'body-care': ['Body Care', 'العناية بالجسم'], men: ['Men', 'الرجال'], baby: ['Baby', 'الأطفال'] } },
  makeup: { en: 'Makeup', ar: 'المكياج', subs: { face: ['Face', 'الوجه'], eyes: ['Eyes', 'العيون'], lips: ['Lips', 'الشفاه'], brows: ['Brows', 'الحواجب'], nails: ['Nails', 'الأظافر'], lenses: ['Lenses', 'العدسات'] } },
  perfumes: { en: 'Perfumes', ar: 'العطور', subs: { 'womens-perfumes': ["Women's Perfumes", 'عطور نسائية'], 'mens-perfumes': ["Men's Perfumes", 'عطور رجالية'], 'unisex-perfumes': ['Unisex Perfumes', 'عطور للجنسين'] } },
  'beauty-devices': { en: 'Beauty Devices', ar: 'أجهزة التجميل', subs: { 'facial-devices': ['Facial Devices', 'أجهزة الوجه'], 'hair-devices': ['Hair Devices', 'أجهزة الشعر'], 'styling-tools': ['Styling Tools', 'أدوات التصفيف'] } },
  'salon-supplies': { en: 'Salon Supplies', ar: 'مستلزمات الصالونات', subs: { 'hair-salon': ['Hair Salon', 'صالون الشعر'], 'nail-salon': ['Nail Salon', 'صالون الأظافر'], 'professional-tools': ['Professional Tools', 'أدوات احترافية'], 'disposable-supplies': ['Disposable Supplies', 'مستلزمات للاستخدام مرة واحدة'] } },
}

/** Professional / hair-care houses — their masks, oils and treatments are hair products */
const HAIR_BRANDS = /\b(wella|keune|olaplex|k18|kevin murphy|moroccanoil|kerastase|kérastase|redken|matrix|schwarzkopf|davines|joico|paul mitchell|amika|briogeo|color wow|gisou|bed head|tigi|alfaparf|lakme|lakmé|label\.?m|aveda|living proof|ouai|pantene|tresemme|elvive|fructis|head ?& ?shoulders|sunsilk|marc anthony|mielle|shea moisture|cantu|fudge|bumble|oribe|milbon|goldwell|alterna|nioxin|vatika|parachute)\b/

const FRAGRANCE = /\b(fragrances?|perfumes?|parfum|edt|edp|cologne|eau de)\b/

// Arabic has no \b in JS regex — use whitespace/edge/"|" boundaries
const AR = (words) => new RegExp(`(^|[\\s|،,(\\-])(${words})([\\s|،,)\\-]|$)`)

// [main, sub, test, lowConfidence?]
const RULES = [
  // Professional colour chemistry (before hair care)
  ['salon-supplies', 'hair-salon', /\b(hair colou?r|permanent colou?r|koleston|illumina|colou?r ?touch|shinefinity|tinta colou?r|so pure colou?r|semi colou?r|developer|oxidant|oxidi[sz]ing|welloxon|activator|bleach|blondor|lightener|freelight|magma|toner|bond (?:maker|multiplier|builder)|olaplex no\.? ?[12]\b|salon size|back ?bar|colou?r fresh)\b/],
  ['salon-supplies', 'hair-salon', AR('صبغة|صبغات|صبغه|اكسجين|أكسجين|مطور|مفتح|بودرة تفتيح|استخدام صالون|مستلزمات الصالون')],
  ['salon-supplies', 'nail-salon', /\b(gel ?colou?r|gel polish|uv lamp|led lamp|nail drill|acrylic powder|nail tips|cuticle pusher)\b/],
  ['salon-supplies', 'disposable-supplies', /\b(gloves|disposable|cotton pads?|salon towels?|foil|neck strips?|capes?|aprons?)\b/],
  ['salon-supplies', 'disposable-supplies', AR('قفازات|مناشف|قطن|ورق قصدير')],
  ['salon-supplies', 'professional-tools', /\b(scissors|shears|clippers?|combs?|brush set|makeup brush(?:es)?|sponge|beauty blender|tweezers?|eyelash curler)\b/],
  ['salon-supplies', 'professional-tools', AR('مقص|مشط|فرشاة|فرش|إسفنجة|اسفنجة|ملقط')],
  // Devices
  ['beauty-devices', 'hair-devices', /\b(hair ?dryer|blow ?dryer|supersonic|airwrap)\b/],
  ['beauty-devices', 'hair-devices', AR('مجفف شعر|مجفف الشعر|سشوار|استشوار')],
  ['beauty-devices', 'styling-tools', /\b(straightener|flat iron|curling (?:iron|wand)|curler|hot brush|crimper|styler)\b/],
  ['beauty-devices', 'styling-tools', AR('مكواة|مكواه|مموج|سيراميك')],
  ['beauty-devices', 'facial-devices', /\b(facial device|cleansing device|cleansing brush|microcurrent|led mask|epilator|ipl|shaver|face roller|gua sha|derma ?roller|massager)\b/],
  ['beauty-devices', 'facial-devices', AR('جهاز|أجهزة|اجهزة|ماكينة|رولر|مدلك')],
  // Fragrance
  ['perfumes', 'mens-perfumes', /\b(pour homme|for men|for him|men'?s (?:perfume|fragrance|cologne)|cologne|aftershave|after shave)\b/],
  ['perfumes', 'mens-perfumes', AR('رجالي|للرجال|عطور رجالية')],
  // Gender from the store's own category path, e.g. "Men > Fragrance"
  ['perfumes', 'mens-perfumes', (t) => /\bmen\b/.test(t) && !/\bwomen\b/.test(t) && FRAGRANCE.test(t)],
  ['perfumes', 'womens-perfumes', (t) => /\bwomen\b/.test(t) && FRAGRANCE.test(t)],
  ['perfumes', 'mens-perfumes', (t) => /men/.test(t) && !/women/.test(t) && /(fragrances?|perfumes?|parfum|edt|edp|cologne|eau de)/.test(t)],
  ['perfumes', 'womens-perfumes', (t) => /women/.test(t) && /(fragrances?|perfumes?|parfum|edt|edp|cologne|eau de)/.test(t)],
  ['perfumes', 'womens-perfumes', /\b(pour femme|for women|for her|women'?s (?:perfume|fragrance)|femme)\b/],
  ['perfumes', 'womens-perfumes', AR('نسائي|للنساء|عطور نسائية|نسائية')],
  ['perfumes', 'unisex-perfumes', /\b(unisex|oud|bakhoor|bukhoor|dehn al oud|attar)\b/],
  ['perfumes', 'unisex-perfumes', AR('للجنسين|عود|بخور|دهن العود|دهن عود')],
  // Fragrance with no gender cue: unisex, low confidence
  ['perfumes', 'unisex-perfumes', /\b(eau de parfum|eau de toilette|edp|edt|parfum|perfume|fragrance|body mist|hair mist|extrait)\b/, true],
  ['perfumes', 'unisex-perfumes', AR('عطر|عطور|بخاخ معطر|معطر|او دو بارفان|أو دو برفيوم'), true],
  // Makeup
  ['makeup', 'lenses', /\b(contact lens(?:es)?|colou?red lens(?:es)?|lenses)\b/],
  ['makeup', 'lenses', AR('عدسات|عدسة|عدسات لاصقة')],
  ['makeup', 'nails', /\b(nail (?:polish|lacquer|colou?r|care|strengthener|enamel|remover)|top coat|base coat)\b/],
  ['makeup', 'nails', AR('طلاء أظافر|طلاء اظافر|مناكير|اظافر|أظافر')],
  ['makeup', 'brows', /\b(brows?|eyebrows?)\b/],
  ['makeup', 'brows', AR('حواجب|حاجب|الحواجب')],
  ['makeup', 'lips', /\b(lip ?stick|lip ?gloss|lip ?liner|lip ?balm|lip ?oil|lip ?tint|lip ?stain|lips?)\b/],
  ['makeup', 'lips', AR('روج|احمر شفاه|أحمر شفاه|شفاه|الشفاه|شفايف|قلوس|ملمع شفاه')],
  ['makeup', 'eyes', /\b(mascara|eyeliner|eye ?liner|kohl|kajal|eyeshadow|eye ?shadow|eye palette|lashes|false lashes|eye primer)\b/],
  ['makeup', 'eyes', AR('ماسكارا|كحل|ايلاينر|آيلاينر|ظلال|رموش|محدد عيون|ظل عيون')],
  ['makeup', 'face', /\b(foundation|concealer|primer|powder|blush|bronzer|highlighter|contour|bb cream|cc cream|setting spray|compact|cushion|make-?up|tinted moisturi[sz]er)\b/],
  ['makeup', 'face', AR('كريم أساس|كريم اساس|فاونديشن|كونسيلر|خافي عيوب|بودرة|بودره|بلاشر|برونزر|هايلايتر|مكياج|ميكب|برايمر')],
  // Baby & men
  ['care', 'baby', /\b(baby|babies|infant|kids?|toddler|newborn|bebe)\b/],
  ['care', 'baby', AR('أطفال|اطفال|الطفل|للأطفال|للاطفال|رضع|بيبي')],
  ['care', 'men', /\b(beard|for men|men'?s|shaving|shave|razor|homme)\b/],
  ['care', 'men', AR('لحية|اللحية|حلاقة|الحلاقة|رجالي|للرجال')],
  // Hair brands: masks/oils/serums/treatments are hair products
  ['care', 'hair-care', (t, hair) => hair && /\b(mask|masque|oil|serum|spray|cream|treatment|lotion|elixir|balm|foam|mousse|tonic|ampoules?|gel|wax|paste|clay|style|styling|powder|lacquer)\b/.test(t)],
  // Hair care
  ['care', 'hair-care', /\b(shampoo|conditioner|hair (?:mask|oil|serum|spray|cream|treatment|lotion|tonic|gel|wax|mousse|loss|care)|leave-?in|scalp|keratin|dry shampoo|styling (?:gel|cream|wax)|hairspray|pomade)\b/],
  ['care', 'hair-care', AR('شامبو|بلسم|شعر|للشعر|الشعر|فروة|زيت شعر')],
  // Body care
  ['care', 'body-care', /\b(body (?:lotion|wash|cream|butter|oil|scrub|milk|splash)|shower gel|bath|soap|hand cream|foot cream|deodorant|antiperspirant|self ?tan|hair removal cream|wax strips)\b/],
  ['care', 'body-care', AR('الجسم|للجسم|استحمام|صابون|مزيل عرق|مزيل العرق|كريم اليدين|القدمين|شمع')],
  // Skin care
  ['care', 'skin-care', /\b(serum|moisturi[sz]er|cream|cleanser|face wash|toner|essence|ampoule|sunscreen|spf|sun ?block|mask|eye cream|exfoliat\w*|peel|retinol|niacinamide|hyaluronic|vitamin c|micellar|makeup remover|skin ?care|lotion|gel|balm|patch(?:es)?)\b/],
  ['care', 'skin-care', AR('بشرة|البشرة|الوجه|للوجه|سيروم|مرطب|غسول|تونر|واقي شمس|واقي الشمس|ماسك|قناع|كريم|لوشن|مزيل مكياج')],
]

/** → { main, sub, mainEn, mainAr, subEn, subAr, confident } (unmatched falls back to Care › Skin Care, not confident) */
export function mapCategory(name, storeCategory = '', hints = {}) {
  const text = `${name ?? ''} | ${storeCategory ?? ''} | ${hints.productLine ?? ''} | ${hints.supplierCategory ?? ''}`.toLowerCase()
  const hair = HAIR_BRANDS.test(`${hints.brand ?? ''} ${name ?? ''}`.toLowerCase())
  for (const [main, sub, test, low] of RULES) {
    const hit = typeof test === 'function' ? test(text, hair) : test.test(text)
    if (hit) return describe(main, sub, !low)
  }
  return describe('care', 'skin-care', false)
}

function describe(main, sub, confident) {
  const m = LOOKS_CATEGORIES[main]
  const [subEn, subAr] = m.subs[sub]
  return { main, sub, mainEn: m.en, mainAr: m.ar, subEn, subAr, confident }
}
