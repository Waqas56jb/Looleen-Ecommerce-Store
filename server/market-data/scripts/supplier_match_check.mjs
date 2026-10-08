/** Quick check: how many supplier items match market listings (same pipeline as build_master, supplier brands only). */
import fs from 'node:fs'
import path from 'node:path'
import { brandKey, canonicalBrands, clusterListings, matchSuppliersToMarket } from '../lib/match.mjs'
import { RAW_DIR, ROOT, splitArEn, hasArabic } from '../lib/record.mjs'
const S = fs.readdirSync(RAW_DIR).filter((f) => f.endsWith('.jsonl')).map((f) => f.replace('.jsonl', ''))
const listings = S.flatMap((s) => fs.readFileSync(path.join(RAW_DIR, `${s}.jsonl`), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l))).filter((r) => r.price && r.url && r.name)
const sup = fs.readdirSync(path.join(ROOT, 'suppliers')).filter((f) => f.endsWith('.json')).flatMap((f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'suppliers', f), 'utf8')).items)
const all = [...sup.map((s) => ({ brand: s.brand, barcode: s.barcode })), ...listings]
const canon = canonicalBrands(all)
const supBrands = new Set(sup.map((s) => canon.get(brandKey(s.brand))))
const items = [
  ...sup.map((s, i) => ({ key: `sup:${i}`, kind: 'supplier', storeId: `supplier:${s.supplier}`, brand: s.brand, brandCanon: canon.get(brandKey(s.brand)), name: s.nameEn ?? s.nameAr, nameEn: s.nameEn, size: /^\d+(\.\d+)?$/.test(String(s.size ?? '').trim()) ? `${s.size}ml` : s.size, barcode: s.barcode, ref: s })),
  ...listings
    .filter((l) => supBrands.has(canon.get(brandKey(l.brand))) || (l.barcode && sup.some((s) => s.barcode === l.barcode)))
    .map((l, i) => {
      const split = l.nameEn || l.nameAr ? { en: l.nameEn, ar: l.nameAr } : splitArEn(l.name)
      return { key: `lst:${i}`, kind: 'listing', storeId: l.storeId, brand: l.brand, brandCanon: canon.get(brandKey(l.brand)), name: l.name, nameEn: split.en ?? (hasArabic(l.name) ? null : l.name), size: l.size, barcode: l.barcode, ref: l }
    }),
]
console.log('brand listings considered', items.filter((i) => i.kind === 'listing').length)
const clusters = clusterListings(items)
const sm = matchSuppliersToMarket(clusters)
console.log('second pass attached', sm.attached.length, 'review', sm.review.length)
if (process.argv[3] === 'review') for (const r of sm.review) console.log('REVIEW', r.cover.toFixed(2), r.reason, '|', r.supplierCluster.members[0].ref.nameEn, r.supplierCluster.members[0].ref.size, '→', r.cluster.members.map((m) => (m.ref.name ?? "SUP:" + m.ref.nameEn).slice(0, 70)).join(' || '))
const res = {}
for (const c of clusters) {
  const s = c.members.filter((m) => m.kind === 'supplier')
  if (!s.length) continue
  const st = new Set(c.members.filter((m) => m.kind === 'listing').map((m) => m.storeId))
  const k = s[0].ref.supplier
  res[k] ??= { items: 0, matched: 0, multi: 0, byStore: {} }
  res[k].items += s.length
  if (st.size) res[k].matched += s.length
  if (st.size >= 2) res[k].multi += s.length
  st.forEach((x) => (res[k].byStore[x] = (res[k].byStore[x] ?? 0) + 1))
  if (process.argv[2] && k.toLowerCase().includes(process.argv[2]) && st.size) console.log(c.method.padEnd(12), s[0].ref.nameEn, s[0].ref.size, '|', c.members.filter((m) => m.kind === 'listing').map((m) => `${m.storeId}:${m.ref.price}:${m.ref.name.slice(0, 60)}`).join(' || '))
}
console.log(JSON.stringify(res, null, 1))
