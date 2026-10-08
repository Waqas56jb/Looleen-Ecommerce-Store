import { mapCategory } from '../lib/category.mjs'
const cases = [
  ['Koleston Perfect 6/7 60ml', 'Wella Professionals', 'Salon Supplies/Hair Salon'],
  ['Dior Sauvage Eau de Parfum 100ml', 'Dior', 'Perfumes/Unisex Perfumes'],
  ['Sauvage EDT', 'Dior', 'Perfumes/Men\'s Perfumes', 'Men > Fragrance'],
  ['Rare Beauty Soft Pinch Liquid Blush', 'Rare Beauty', 'Makeup/Face'],
  ['شامبو للشعر الدهني', 'Keune', 'Care/Hair Care'],
  ['دهن عود ملكي', 'Ajmal', 'Perfumes/Unisex Perfumes'],
  ['Dyson Supersonic Hair Dryer', 'Dyson', 'Beauty Devices/Hair Devices'],
  ['CeraVe Hydrating Cleanser', 'CeraVe', 'Care/Skin Care'],
  ['Bleu de Chanel EDP pour homme', 'Chanel', 'Perfumes/Men\'s Perfumes'],
  ['CARE SATIN OIL MASK', 'Keune', 'Care/Hair Care'],
  ['Maybelline Lash Sensational Mascara', 'Maybelline', 'Makeup/Eyes'],
  ['Anastasia Brow Wiz', 'ABH', 'Makeup/Brows'],
  ['OPI Nail Lacquer Big Apple Red', 'OPI', 'Makeup/Nails'],
  ['Welloxon Perfect 6% 1L', 'Wella', 'Salon Supplies/Hair Salon'],
  ['Nivea Men Sensitive Shaving Gel', 'Nivea', 'Care/Men'],
  ['Mustela Hydra Bebe Body Lotion', 'Mustela', 'Care/Baby'],
  ['Vaseline Intensive Care Body Lotion', 'Vaseline', 'Care/Body Care'],
  ['كريم أساس فيت مي', 'Maybelline', 'Makeup/Face'],
  ['ماسكارا لاش برنسس', 'Essence', 'Makeup/Eyes'],
  ['STYLE TRIPLE X GEL', 'Keune', 'Care/Hair Care'],
]
let ok = 0
for (const [n, b, want, cat] of cases) {
  const c = mapCategory(n, cat ?? '', { brand: b })
  const got = `${c.mainEn}/${c.subEn}`
  if (got === want) ok++
  else console.log('✗', n, '→', got, 'want', want)
}
console.log(`${ok}/${cases.length} correct`)
