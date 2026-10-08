/**
 * Product matching across stores and supplier lists.
 *
 * Order of confidence:
 *   1. Barcode (EAN/GTIN) equality                       → "Barcode"
 *   2. Same brand + same size + near-identical name       → "Name + size"
 *      (Jaccard ≥ 0.75 on name tokens, ≥ 2 shared tokens, and IDENTICAL numeric
 *      tokens — so shades like 4/71 vs 4/75 or 7.1 vs 7.3 never merge)
 *   3. Otherwise the listing becomes its own product      → "Single listing"
 * A cluster never receives two different listings from the same store unless
 * they share a barcode (prevents merging two different variants of one store).
 */
import { hasArabic, parseSize } from './record.mjs'

const STRIP_BRAND = /\b(professionals?|professionnel|pro|cosmetics?|paris|new york|nyc|ny|official|beauty|makeup|skincare|laboratories|labs?|london|milano)\b/g
const STOP = new Set(['the', 'and', 'for', 'with', 'of', 'a', 'an', 'in', 'to', 'by', 'new', 'ml', 'g', 'gm', 'gr', 'oz', 'fl', 'l', 'pcs', 'x', 'size', 'full', 'edition', 'limited', 'set', 'pack'])

export function deaccent(s) {
  return (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '')
}

const AR_NORM = (s) => s.replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')

/**
 * Arabic → English for common beauty words and transliterated product-line names,
 * so an Arabic listing ("شامبو كيون كير فيتال نيوتريشن") can match an English
 * one ("Keune Care Vital Nutrition Shampoo"). Keys are AR_NORM-normalized.
 */
const AR_EN = Object.fromEntries(
  Object.entries({
    شامبو: 'shampoo', بلسم: 'conditioner', ماسك: 'mask', قناع: 'mask', كير: 'care', فيتال: 'vital', نيوتريشن: 'nutrition', نيوتريشين: 'nutrition',
    كولور: 'color', كولر: 'color', لون: 'color', بريليانز: 'brillianz', بريلينز: 'brillianz', بريليانس: 'brilliance', ساتان: 'satin', اويل: 'oil', زيت: 'oil',
    كيراتين: 'keratin', سموث: 'smooth', كيرل: 'curl', كونترول: 'control', ديرما: 'derma', اكتيفيت: 'activate', ريجوليت: 'regulate', اكسفوليت: 'exfoliate',
    سيلفر: 'silver', سيفيور: 'savior', سافيور: 'savior', بلوند: 'blonde', تينتا: 'tinta', ستايل: 'style', بخاخ: 'spray', سبراي: 'spray', جل: 'gel', كريم: 'cream',
    سيروم: 'serum', لوشن: 'lotion', ميراكل: 'miracle', اليكسير: 'elixir', اكسير: 'elixir', ابسليوت: 'absolute', ابسولوت: 'absolute', فوليوم: 'volume', كلاريفاي: 'clarify',
    امبولات: 'ampoules', امبولة: 'ampoule', معالج: 'treatment', غسول: 'cleanser', تونر: 'toner', واقي: 'sunscreen', مرطب: 'moisturizer', ماسكارا: 'mascara',
    كيون: 'keune', ويلا: 'wella', انفيجو: 'invigo', فيوجن: 'fusion', اليمنتس: 'elements', ايمي: 'eimi', كولستون: 'koleston', الومينا: 'illumina', اولابلكس: 'olaplex',
    موروكان: 'moroccan', ارغان: 'argan', ارجان: 'argan', هيالورونيك: 'hyaluronic', نياسيناميد: 'niacinamide', ريتينول: 'retinol', فيتامين: 'vitamin',
  }).map(([k, v]) => [AR_NORM(k), v]),
)

/** Arabic filler words that carry no product identity */
const AR_STOP = new Set(['من', 'مع', 'في', 'على', 'عن', 'الى', 'و', 'لل', 'شعر', 'للشعر', 'الشعر', 'لتغذيه', 'الحجم', 'الكبير', 'حجم', 'جديد', 'اصلي', 'مل', 'جم', 'غرام', 'لتر', 'بروفيشنال', 'بروفيشنالز', 'بروفيشينالز'].map(AR_NORM))

/** Bundles must never match single items (and vice versa) */
const BUNDLE = /\b(set|kit|bundle|duo|trio|value pack|gift)\b|مجموعه|مجموعة|طقم|بكج|×\s*\d|\bx\s*\d\b/i

/** Brand key: Latin part when present (accent-free, suffixes stripped), else normalized Arabic */
export function brandKey(brand) {
  if (!brand) return ''
  const latin = deaccent(brand)
    .replace(/[؀-ۿﭐ-﷿ﹰ-﻿]+/g, ' ')
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9& ]+/g, ' ')
  const stripped = latin.replace(STRIP_BRAND, ' ').replace(/\s+/g, ' ').trim()
  if (stripped) return stripped.replace(/\s/g, '')
  if (latin.trim()) return latin.replace(/\s/g, '')
  // Arabic-only brand: use the English equivalent when known ("كيون" → "keune")
  const arWords = AR_NORM(brand).split(/\s+/).filter(Boolean)
  const translated = arWords.map((w) => AR_EN[w]).filter(Boolean)
  if (translated.length) return translated.join('')
  return AR_NORM(brand).replace(/[^؀-ۿ]/g, '')
}

/** Display brand: prefer the Latin form ("HUDA BEAUTY" from "هدى بيوتي - HUDA BEAUTY"), title-cased if ALL CAPS */
export function brandDisplay(brand) {
  if (!brand) return null
  const latin = brand
    .replace(/[؀-ۿﭐ-﷿ﹰ-﻿]+/g, ' ')
    .replace(/[|\-–—]+/g, ' ')
    .replace(/[()[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    // leftovers of a removed Arabic part: ": ma:nyo", "/ camomilla blu", "… ?… So"
    .replace(/^[:.,/\\…?!\s]+|[:.,/\\…?\s]+$/g, '')
  const s = (/[A-Za-z].*[A-Za-z]/.test(latin) && !/[…?]/.test(latin) ? latin : '') || brand.replace(/[()[\]]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!/[\p{L}\p{N}]/u.test(s)) return null
  return s === s.toUpperCase() && s.length > 4 ? s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\bL'o/i, "L'O") : s
}

function editDistance(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 99
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return dp[a.length][b.length]
}

/**
 * Resolve brand spelling variants to one canonical key, conservatively (a wrong merge is worse
 * than a missed one, because it can pair different products):
 *  1. Product-line suffixes on a known brand: "keunecare" → "keune", "niveamen" → "nivea".
 *  2. Near-identical Latin spellings: edit distance 1 (8+ letters) or 2 (12+ letters),
 *     e.g. "larouchposay" → "larocheposay".
 *  3. Arabic-only brand keys that share 4+ barcodes (and most of their barcodes) with one Latin brand.
 * Store mislabels (e.g. Garnier filed under L'Oréal) are NOT used as evidence.
 * items: [{ brand, barcode }] → Map(rawBrandKey → canonicalKey)
 */
const LINE_SUFFIX = /^(care|professional|professionals|pro|men|man|skin|skincare|hair|haircare|color|colour|cosmetics|beauty|paris|newyork|baby|kids|makeup|lab|labs|official)$/
export function canonicalBrands(items) {
  const count = new Map()
  const byBarcode = new Map()
  for (const it of items) {
    const k = brandKey(it.brand)
    if (!k) continue
    count.set(k, (count.get(k) ?? 0) + 1)
    if (it.barcode) {
      if (!byBarcode.has(it.barcode)) byBarcode.set(it.barcode, new Set())
      byBarcode.get(it.barcode).add(k)
    }
  }
  const target = new Map()
  const isLatin = (k) => /^[a-z0-9&]+$/.test(k)
  const keys = [...count.keys()]
  // 1. product-line suffixes
  for (const k of keys) {
    if (!isLatin(k)) continue
    for (const base of keys) {
      if (base === k || base.length < 4 || !isLatin(base) || (count.get(base) ?? 0) < 3) continue
      if (k.startsWith(base) && LINE_SUFFIX.test(k.slice(base.length))) {
        target.set(k, base)
        break
      }
    }
  }
  // 2. spelling variants → the more frequent spelling
  const latin = keys.filter((k) => isLatin(k) && k.length >= 8 && !target.has(k))
  for (let i = 0; i < latin.length; i++)
    for (let j = i + 1; j < latin.length; j++) {
      const a = latin[i]
      const b = latin[j]
      if (a[0] !== b[0]) continue
      const d = editDistance(a, b)
      if (!(d === 1 || (d === 2 && Math.min(a.length, b.length) >= 12))) continue
      const [from, to] = (count.get(a) ?? 0) >= (count.get(b) ?? 0) ? [b, a] : [a, b]
      if (!target.has(from) && !target.has(to)) target.set(from, to)
    }
  // 3. Arabic-only keys with strong barcode evidence
  const arStats = new Map()
  for (const set of byBarcode.values()) {
    const ar = [...set].filter((k) => !isLatin(k))
    const la = [...set].filter(isLatin)
    for (const a of ar) {
      if (!arStats.has(a)) arStats.set(a, { total: 0, to: new Map() })
      const st = arStats.get(a)
      st.total++
      for (const l of la) st.to.set(l, (st.to.get(l) ?? 0) + 1)
    }
  }
  for (const [a, st] of arStats) {
    const best = [...st.to.entries()].sort((x, y) => y[1] - x[1])[0]
    if (best && best[1] >= 4 && best[1] / st.total >= 0.7 && !target.has(a)) target.set(a, best[0])
  }
  const resolve = (k) => {
    const seen = new Set()
    while (target.has(k) && !seen.has(k)) {
      seen.add(k)
      k = target.get(k)
    }
    return k
  }
  return new Map(keys.map((k) => [k, resolve(k)]))
}

export function sizeKey(sz) {
  if (!sz) return null
  const v = sz.unit === 'ml' || sz.unit === 'g' ? Math.round(sz.value) : sz.value
  return `${v}${sz.unit}`
}

/** Latin + Arabic name tokens minus brand words, size text and stopwords */
export function nameTokens(name, brand) {
  const bk = new Set(deaccent(brand ?? '').toLowerCase().replace(/[^a-z0-9؀-ۿ ]+/g, ' ').split(/\s+/).filter(Boolean))
  // Also drop the translated form of Arabic brand words ("كيون" → "keune")
  for (const w of [...bk]) if (hasArabic(w)) bk.add(AR_EN[AR_NORM(w)] ?? '')
  const t = deaccent(name ?? '')
    .toLowerCase()
    .replace(/['’`]/g, '')
    // Strip size text (JS \b doesn't work after Arabic letters, so use a lookahead)
    .replace(/(\d+(?:[.,]\d+)?)\s*(ml|g|gr|gm|l|oz|fl\.? ?oz|مل|ملل|جم|جرام|غرام|لتر)(?![a-z؀-ۿ])/g, ' ')
    .replace(/[^a-z0-9./؀-ۿ ]+/g, ' ')
  const toks = t
    .split(/\s+/)
    .map((w) => w.replace(/^[./]+|[./]+$/g, ''))
    .filter((w) => w && !STOP.has(w))
    .map((w) => {
      if (!hasArabic(w)) return w
      const n = AR_NORM(w)
      if (AR_STOP.has(n)) return ''
      return AR_EN[n] ?? AR_EN[n.replace(/^ال/, '')] ?? n.replace(/^ال/, '')
    })
    .filter((w) => w && !bk.has(w))
  return [...new Set(toks)]
}

/** true when the listing is a set/kit/multi-pack */
export const isBundle = (name) => BUNDLE.test(name ?? '')

const numericTokens = (toks) => toks.filter((t) => /\d/.test(t)).sort().join(',')

/**
 * Generic product-type words. A match must share at least 2 tokens that are NOT
 * in this list (i.e. product-line words like "platinum", "aquaporin", "ultimate"),
 * so "Coach For Men EDP" never matches "Coach Platinum EDP for Men".
 */
const GENERIC = new Set(
  'eau de du la le parfum perfume toilette cologne edp edt extrait intense men man women woman her him homme femme unisex spray mist body face hair skin cream creme serum shampoo conditioner mask oil gel lotion balm wash cleanser toner essence ampoule treatment care moisturizer moisturising moisturizing moisturiser hydrating hydra repair daily night day natural organic dry oily normal combination sensitive all types type skin scalp spf sunscreen sun protection lip lips eye eyes foundation powder mascara liner pencil palette stick liquid matte soft refill travel mini size pack new formula professional pro deluxe classic original plus extra super ultra pure fresh color colour nourishing nutrition volume anti and with for from of the'
    .split(/\s+/),
)
const distinctiveShared = (a, b) => {
  const A = new Set(a)
  return b.filter((t) => A.has(t) && !GENERIC.has(t)).length
}

function jaccard(a, b) {
  const A = new Set(a)
  let inter = 0
  for (const x of b) if (A.has(x)) inter++
  return { score: inter / (A.size + b.length - inter || 1), inter }
}

/**
 * Cluster listings into products.
 * items: [{ key, storeId, brand, name, nameEn, size, barcode }]
 * returns clusters: [{ id, members: [items], method }]
 */
export function clusterListings(items) {
  const clusters = []
  const byBarcode = new Map()
  const buckets = new Map() // brandKey|sizeKey -> clusters

  const prep = (it) => {
    const sz = parseSize(it.size) ?? parseSize(it.nameEn) ?? parseSize(it.name)
    const bKey = it.brandCanon ?? brandKey(it.brand)
    const tokLatin = nameTokens(it.nameEn || it.name, it.brand)
    return { ...it, _bKey: bKey, _size: sz, _sizeKey: sizeKey(sz), _tokens: tokLatin, _nums: numericTokens(tokLatin), _bundle: isBundle(`${it.name ?? ''} ${it.nameEn ?? ''}`) }
  }

  const list = items.map(prep)
  // Barcode items first so name matches can attach to barcode clusters
  list.sort((a, b) => Number(!!b.barcode) - Number(!!a.barcode))

  for (const it of list) {
    // 1. barcode
    if (it.barcode && byBarcode.has(it.barcode)) {
      const c = byBarcode.get(it.barcode)
      c.members.push(it)
      c.stores.add(it.storeId)
      c.method = 'Barcode'
      continue
    }
    // 2. brand + size + name
    let target = null
    if (it._bKey && it._tokens.length >= 2) {
      const bucket = buckets.get(`${it._bKey}|${it._sizeKey}`) ?? []
      let best = null
      for (const c of bucket) {
        if (c.stores.has(it.storeId) && !(it.barcode && c.barcodes.has(it.barcode))) continue
        if (c.nums !== it._nums) continue
        if (c.bundle !== it._bundle) continue // never match a set/multi-pack with a single item
        if (it.barcode && c.barcodes.size && !c.barcodes.has(it.barcode)) continue // conflicting barcodes
        const { score, inter } = jaccard(c.tokens, it._tokens)
        // Containment: every word of the shorter name appears in the longer one
        // (handles "Shampoo Keune Care Vital Nutrition for nourishing" vs "Care Vital Nutrition Shampoo")
        const contain = inter / Math.min(c.tokens.length, it._tokens.length)
        const sized = it._sizeKey !== null
        const distinct = distinctiveShared(c.tokens, it._tokens)
        // Distinctive words present on only one side (e.g. "retinol", "platinum")
        const extra = [...c.tokens, ...it._tokens].filter((t) => !GENERIC.has(t) && !(c.tokens.includes(t) && it._tokens.includes(t))).length
        const ok =
          distinct >= 1 &&
          (sized ? (score >= 0.75 && inter >= 2) || (contain >= 1 && inter >= 3 && extra <= 1) : score >= 0.85 && inter >= 3 && extra === 0)
        if (ok && (!best || score > best.score)) best = { c, score }
      }
      if (best) target = best.c
    }
    if (target) {
      target.members.push(it)
      target.stores.add(it.storeId)
      if (it.barcode) {
        target.barcodes.add(it.barcode)
        byBarcode.set(it.barcode, target)
      }
      if (target.method !== 'Barcode') target.method = 'Name + size'
      continue
    }
    // 3. new cluster
    const c = { id: clusters.length + 1, members: [it], method: 'Single listing', stores: new Set([it.storeId]), barcodes: new Set(it.barcode ? [it.barcode] : []), tokens: it._tokens, nums: it._nums, bundle: it._bundle }
    clusters.push(c)
    if (it.barcode) byBarcode.set(it.barcode, c)
    const k = `${it._bKey}|${it._sizeKey}`
    if (!buckets.has(k)) buckets.set(k, [])
    buckets.get(k).push(c)
  }
  return clusters
}

/* ---------------- Supplier ↔ market matching (second pass) ---------------- */

/**
 * Supplier price lists use short English names ("CARE KERATIN SMOO CONDITIONER")
 * while many Saudi stores list the same product in Arabic only. This pass
 * attaches a supplier item that found no barcode match to the market product
 * with the same brand, the same size, the same product type and the same
 * product-line words (abbreviations allowed: "smoo" = "smooth").
 * Anything less certain is NOT merged — it is returned for manual review.
 */
const AR_EXTRA = Object.fromEntries(
  Object.entries({
    فايتال: 'vital', نيتريشن: 'nutrition', نيوتريشن: 'nutrition', نوتريشن: 'nutrition', سيفور: 'savior', سيفيور: 'savior', سافيور: 'savior', سافير: 'savior',
    ريجولت: 'regulate', ريجوليت: 'regulate', اكسفولت: 'exfoliate', اكسفوليت: 'exfoliate', اكتيفيت: 'activate', ابسولوت: 'absolute', ابسلوت: 'absolute',
    كيرلي: 'curl', كيرل: 'curl', بريلينز: 'brillianz', بريليانز: 'brillianz', بريلينت: 'brilliant', بريليانت: 'brilliant', جلوس: 'gloss',
    واكس: 'wax', موس: 'mousse', رغوه: 'mousse', بودره: 'powder', بودر: 'powder', معجون: 'paste', طين: 'clay', سيرم: 'serum', سيروم: 'serum',
    سبا: 'spa', باث: 'bath', ستريت: 'straight', ثيكنينج: 'thickening', ثيكنينغ: 'thickening', مات: 'matte', دراي: 'dry', تكستشرايزر: 'texturizer', تكستشرايزير: 'texturizer',
    الترا: 'ultra', هوت: 'hot', ايرون: 'iron', فورمينغ: 'forming', فورمينج: 'forming', بلو: 'blow', اوت: 'out', جيلي: 'gelee', هاي: 'high', امباكت: 'impact',
    سترونق: 'strong', سترونج: 'strong', سوفت: 'soft', ليكويد: 'liquid', فري: 'free', روت: 'root', فوليمايزر: 'volumizer', فوليومايزر: 'volumizer', لومي: 'lumi', كوات: 'coat',
    بوميد: 'pomade', اوريجينال: 'original', بيوريفاينج: 'purifying', تريتمنت: 'treatment', ليف: 'leave', بوند: 'bond', فيوجن: 'fusion', سماوث: 'smooth', سموث: 'smooth',
    هيوميديتي: 'humidity', شيلد: 'shield', سولت: 'salt', ميست: 'mist', فايبرز: 'fibers', كلاي: 'clay', بريسيجن: 'precision', بريسيشن: 'precision', تريبل: 'triple',
    انستانت: 'instant', ديفريز: 'defrizz', سيلك: 'silk', بوليش: 'polish', ثيرمال: 'thermal', بروتين: 'protein', بوروسيتي: 'porosity', فيلر: 'filler', بوستر: 'booster',
    ديفايننج: 'defining', ديفاينينج: 'defining', فوم: 'foam', لوشن: 'lotion', كونديشنر: 'conditioner', بلسم: 'conditioner', شامبو: 'shampoo', ماسك: 'mask', قناع: 'mask',
    بخاخ: 'spray', سبراي: 'spray', سبري: 'spray', جل: 'gel', كريم: 'cream', زيت: 'oil', امبولات: 'ampoules', امبولة: 'ampoules', فلفيت: 'velvet', كلاود: 'cloud',
    كلاريفاي: 'clarify', تينتا: 'tinta', كولور: 'color', كولر: 'color', ديرما: 'derma', كيراتين: 'keratin', ساتان: 'satin', ميراكل: 'miracle', اليكسير: 'elixir', سيلفر: 'silver', بلوند: 'blonde',
    فوليوم: 'volume', فيتال: 'vital',
    تاتش: 'touch', كولستون: 'koleston', بيرفكت: 'perfect', بيرفيكت: 'perfect', ايلومينا: 'illumina', الومينا: 'illumina', اليمنتس: 'elements', انفيجو: 'invigo', نوتري: 'nutri',
    نوتريكيرلز: 'nutricurls', كيرلز: 'curls', بلوندور: 'blondor', ريبير: 'repair', ريبair: 'repair', ريفليكشنز: 'reflections', ريفلكشن: 'reflections', ستايلر: 'styler', بيرل: 'pearl', ايمي: 'eimi',
    ويلافليكس: 'wellaflex', موشن: 'motion', اولتيميت: 'ultimate', التميت: 'ultimate', سيستم: 'system', لوكس: 'luxe', بريليانس: 'brilliance', هيدريت: 'hydrate', ريكوفر: 'recover',
  }).map(([k, v]) => [AR_NORM(k), v]),
)
/** product type words; equivalent types share one key */
const TYPE = { shampoo: 'shampoo', conditioner: 'conditioner', mask: 'mask', masque: 'mask', spray: 'spray', mist: 'spray', hairspray: 'spray', serum: 'serum', cream: 'cream', creambath: 'cream', oil: 'oil', gel: 'gel', gelee: 'gel', wax: 'wax', mousse: 'mousse', foam: 'mousse', lotion: 'lotion', powder: 'powder', paste: 'paste', clay: 'clay', pomade: 'pomade', ampoules: 'ampoules', booster: 'ampoules' }
const SUP_SKIP = new Set(['care', 'style', 'keune', 'wella', 'professionals', 'professional', 'pro', 'and', 'for', 'with', 'the', 'of', 'new', 'ml', 'hair'])
const SUP_WEAK = new Set(['treatment', 'phase', 'spray', 'bath', 'spa'])
const SYNONYM = { savor: 'savior', colour: 'color', nutr: 'nutrition', nutrit: 'nutrition', vol: 'volume' }
const SUP_BUNDLE = /\b(kit|bundle|duo|trio|gift|pack of)\b|مجموعه|مجموعة|طقم|بكج|×\s*\d|\b\d\s*x\s*\d|\bx\s*\d\b/i

function supTokens(name) {
  return deaccent(name ?? '')
    .toLowerCase()
    .replace(/(\d+(?:[.,]\d+)?)\s*(ml|g|gr|l|oz)(?![a-z])/g, ' ')
    .match(/\d+(?:[/.]\d+)+|[a-z0-9]+/g)
    ?.filter((w) => !SUP_SKIP.has(w)) ?? []
    .map((w) => SYNONYM[w] ?? w)
}
const SHADE = /^\d+(?:[/.]\d+)+$/
function marketTokens(text) {
  const out = []
  const clean = deaccent(text ?? '').toLowerCase().replace(/['’`]/g, '').replace(/(\d+(?:[.,]\d+)?)\s*(ml|g|gr|l|oz|مل|جم|غرام|لتر)(?![a-z؀-ۿ])/g, ' ')
  for (const raw of clean.match(/\d+(?:[/.]\d+)+|[a-z0-9؀-ۿ]+/g) ?? []) {
    if (!raw) continue
    if (!hasArabic(raw)) {
      out.push(SYNONYM[raw] ?? raw)
      continue
    }
    const n = AR_NORM(raw)
    const bare = n.replace(/^(وال|بال|لل|ال|و)/, '')
    const en = AR_EXTRA[n] ?? AR_EXTRA[bare] ?? AR_EN[n] ?? AR_EN[bare]
    if (en) out.push(en)
  }
  return out
}
const tokMatch = (s, set) => set.has(s) || (s.length >= 3 && !/^\d+$/.test(s) && [...set].some((l) => l.length > s.length && l.startsWith(s)))
const typesOf = (toks) => new Set(toks.map((t) => TYPE[t]).filter(Boolean))

function mostFrequent(arr) {
  const m = new Map()
  for (const x of arr) m.set(x, (m.get(x) ?? 0) + 1)
  return [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
}

/**
 * clusters: output of clusterListings (members carry kind 'supplier' | 'listing').
 * Merges confident matches in place and returns { attached, review }.
 */
export function matchSuppliersToMarket(clusters) {
  const isSupOnly = (c) => c.members.every((m) => m.kind === 'supplier')
  const byBrand = new Map()
  for (const c of clusters) {
    if (c.members.some((m) => m.kind === 'supplier')) continue
    const lst = c.members
    const brand = mostFrequent(lst.map((m) => m._bKey).filter(Boolean))
    if (!brand) continue
    const toks = new Set(lst.flatMap((m) => marketTokens(`${m.name ?? ''} ${m.nameEn ?? ''} ${m.ref?.nameAr ?? ''} ${m.ref?.nameEn ?? ''}`)))
    const sizes = new Set(lst.map((m) => m._sizeKey).filter(Boolean))
    const entry = { c, toks, sizes, types: typesOf([...toks]), bundle: lst.some((m) => SUP_BUNDLE.test(`${m.name ?? ''} ${m.nameEn ?? ''}`)) }
    if (!byBrand.has(brand)) byBrand.set(brand, [])
    byBrand.get(brand).push(entry)
  }
  // Product-line words of each brand's supplier items ("activate", "regulate", "tinta" …):
  // a store product carrying a line word the supplier item does NOT have is a different product
  const vocab = new Map()
  for (const c of clusters)
    for (const m of c.members)
      if (m.kind === 'supplier') {
        if (!vocab.has(m._bKey)) vocab.set(m._bKey, new Set())
        supTokens(m.nameEn ?? m.name).filter((t) => !TYPE[t] && !SUP_WEAK.has(t) && t.length >= 4).forEach((t) => vocab.get(m._bKey).add(t))
      }
  const attached = []
  const review = []
  const drop = new Set()
  for (const sc of clusters.filter(isSupOnly)) {
    const s = sc.members[0]
    const cands = byBrand.get(s._bKey) ?? []
    const toks = [...new Set(supTokens(s.nameEn ?? s.name))]
    const sTypes = typesOf(toks)
    const core = toks.filter((t) => !TYPE[t] && !SUP_WEAK.has(t))
    if (!core.length) continue
    const brandVocab = vocab.get(s._bKey) ?? new Set()
    const own = (w) => core.some((t) => t === w || (t.length >= 3 && w.startsWith(t)) || (w.length >= 3 && t.startsWith(w)))
    const bundle = SUP_BUNDLE.test(s.nameEn ?? s.name ?? '')
    const nums = core.filter((t) => /^\d/.test(t))
    const shades = core.filter((t) => SHADE.test(t)).sort().join(',')
    const scored = []
    for (const e of cands) {
      if (e.bundle !== bundle) continue
      if (nums.some((n) => !e.toks.has(n))) continue
      if ([...e.toks].filter((t) => SHADE.test(t)).sort().join(',') !== shades) continue // shade 7/7 ≠ 7/89
      const hit = core.filter((t) => tokMatch(t, e.toks)).length
      if (!hit) continue
      if ([...e.toks].some((w) => brandVocab.has(w) && !own(w))) continue // e.g. "derma activate" ≠ "derma exfoliate"
      const typeOk = !sTypes.size || [...sTypes].some((t) => e.types.has(t))
      if (sTypes.size && e.types.size && !typeOk) continue // shampoo never matches conditioner
      const sizeOk = !!s._sizeKey && e.sizes.has(s._sizeKey)
      if (s._sizeKey && e.sizes.size && !sizeOk) continue // different size = different product
      scored.push({ e, cover: hit / core.length, hit, typeOk, sizeOk })
    }
    scored.sort((a, b) => b.cover - a.cover || b.hit - a.hit)
    const strong = scored.filter((x) => x.sizeOk && x.typeOk && x.cover >= 0.75 && (x.hit >= 2 || core.length === 1))
    if (strong.length && (strong.length === 1 || strong[0].cover > strong[1].cover)) {
      const t = strong[0].e.c
      t.members.push(...sc.members)
      t.method = 'Supplier name + size'
      t.supplierScore = strong[0].cover
      drop.add(sc)
      attached.push({ supplier: s, cluster: t, cover: strong[0].cover })
      continue
    }
    // Uncertain → review list, never merged
    const maybe = (strong.length > 1 ? strong : scored.filter((x) => x.cover >= 0.5 && (x.typeOk || !sTypes.size) && (x.e.types.size || core.length >= 2))).slice(0, 3)
    for (const m of maybe.filter((x) => !x.e.c.members.some((mm) => mm.kind === 'supplier')))
      review.push({
        supplierCluster: sc,
        cluster: m.e.c,
        cover: m.cover,
        reason:
          strong.length > 1
            ? 'Two or more store products fit equally — choose the right one'
            : !m.sizeOk
              ? 'Size not shown by the store — confirm the size'
              : !m.typeOk
                ? 'Product type (shampoo, mask…) not shown in the store name'
                : 'Name only partly matches the abbreviated supplier name',
      })
  }
  for (let i = clusters.length - 1; i >= 0; i--) if (drop.has(clusters[i])) clusters.splice(i, 1)
  return { attached, review }
}
