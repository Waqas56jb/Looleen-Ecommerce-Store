import { clusterListings, brandKey, nameTokens } from '../lib/match.mjs'
import { mapCategory } from '../lib/category.mjs'
const items = [
  { key: 1, storeId: 'a', brand: 'Wella Professionals', name: 'Wella Professionals KP Deep Browns 4/71 60ml', size: '60ml', barcode: '8005610657561' },
  { key: 2, storeId: 'b', brand: 'WELLA', name: 'Koleston Perfect Deep Browns 4/71 60 ml', size: null, barcode: '8005610657561' },
  { key: 3, storeId: 'b', brand: 'WELLA', name: 'Koleston Perfect Deep Browns 4/75 60 ml', size: null },
  { key: 4, storeId: 'c', brand: 'Olaplex', name: 'Olaplex No.3 Hair Perfector 100ml', size: '100ml' },
  { key: 5, storeId: 'd', brand: 'أولابليكس OLAPLEX', name: 'OLAPLEX No.3 Hair Perfector - 100 ml', size: null },
  { key: 6, storeId: 'd', brand: 'Olaplex', name: 'Olaplex No.3 Hair Perfector 250ml', size: '250ml' },
  { key: 7, storeId: 'c', brand: "L'Oréal Paris", name: "L'Oreal Elvive Extraordinary Oil Shampoo 400ml", size: '400ml' },
  { key: 8, storeId: 'e', brand: 'LOREAL', name: 'Elvive Extraordinary Oil Shampoo 400 ml', size: null },
]
const cl = clusterListings(items)
cl.forEach((c) => console.log(c.id, c.method, c.members.map((m) => m.key).join('+')))
console.log(brandKey("L'Oréal Paris"), brandKey('LOREAL'), brandKey('هدى بيوتي - HUDA BEAUTY'), brandKey('Wella Professionals'))
for (const n of ['Koleston Perfect 6/7 developer', 'Dior Sauvage Eau de Parfum 100ml', 'Rare Beauty Soft Pinch Liquid Blush', 'شامبو للشعر الدهني', 'Dyson Supersonic Hair Dryer', 'CeraVe Hydrating Cleanser', 'Bleu de Chanel EDP pour homme', 'Keune Care Satin Oil Mask'])
  { const c = mapCategory(n, '', { brand: n.split(' ')[0] }); console.log(n.padEnd(42), '→', c.mainEn, '/', c.subEn, c.confident ? '' : '(low)') }
// Cross-script Keune + bundle guard
const k = clusterListings([
  { key: 'sup', storeId: 'supplier:Keune', brand: 'Keune', name: 'CARE VITAL NUTRITION SHAMPOO', nameEn: 'CARE VITAL NUTRITION SHAMPOO', size: '1000ml' },
  { key: 'loo', storeId: 'looieen', brand: 'كيون', name: 'شامبو كيون كير فيتال نيوتريشن لتغذية الشعر 1000 مل', size: '1000 مل' },
  { key: 'set', storeId: 'whites', brand: 'KEUNE', name: 'مجموعة كيون فيتال نيوتريشن لتغذية الشعر - الحجم الكبير (1000 مل × 2)', size: '1000 مل' },
  { key: 'cond', storeId: 'niceone', brand: 'Keune', name: 'Keune Care Vital Nutrition Conditioner 1000ml', size: '1000ml' },
])
k.forEach((c) => console.log('keune', c.method, c.members.map((m) => m.key).join('+')))
const g = clusterListings([
  { key: 'faces', storeId: 'faces', brand: 'Coach', name: 'Coach For Men Eau de Parfum', size: '60ml' },
  { key: 'nahdi', storeId: 'nahdi', brand: 'Coach', name: 'Coach Platinum Eau de Parfum for Men - 60 ml', size: '60 ml' },
  { key: 'w', storeId: 'whites', brand: 'Coach', name: 'Coach Platinum Eau De Parfum For Men - 60 Ml', size: '60 Ml' },
  { key: 'sun1', storeId: 'whites', brand: 'Sunsilk', name: 'Sunsilk Shampoo Honey Anti-Breakage 400Ml', size: '400Ml' },
  { key: 'sun2', storeId: 'nahdi', brand: 'Sunsilk', name: 'Sunsilk Shampoo Honey Anti Breakage 400 ml', size: '400 ml' },
])
g.forEach((c) => console.log('guard', c.method, c.members.map((m) => m.key).join('+')))
