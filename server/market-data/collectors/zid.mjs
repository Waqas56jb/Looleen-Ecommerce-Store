/**
 * Generic collector for Saudi stores on the Zid platform (keune-ksa.com, shehanasalon.com, …).
 *
 * robots.txt allows product and category pages (it disallows /api/, /cart and search URLs, which
 * are not used). Listing pages /products?page=N give product links; each product page embeds the
 * public product object (window.productObj) the store's own frontend uses: name, SKU (= EAN on most
 * stores), price, sale price, stock. Only factual fields are kept — no descriptions or images.
 *
 * Usage: node collectors/zid.mjs <host> <storeId> "<Store name>" [--brand "Keune"] [--path /categories/123] [--limit N]
 *   node collectors/zid.mjs keune-ksa.com keuneksa "Keune KSA (official)" --brand Keune
 */
import { politeFetch } from '../lib/http.mjs'
import { normalizeBarcode, parseSize, RecordWriter, writeReport } from '../lib/record.mjs'

const [host, storeId, storeName] = process.argv.slice(2)
const args = process.argv.slice(5)
const opt = (k) => {
  const i = args.indexOf(`--${k}`)
  return i >= 0 ? args[i + 1] : null
}
if (!host || !storeId || !storeName) {
  console.error('usage: node collectors/zid.mjs <host> <storeId> "<Store name>" [--brand B] [--path /categories/ID] [--limit N]')
  process.exit(1)
}
const BASE = `https://${host}`
const LIST = opt('path') ?? '/products'
const BRAND = opt('brand')
const LIMIT = opt('limit') ? Number(opt('limit')) : Infinity
const stats = { listPages: 0, products: 0, written: 0, failed: 0, noProductObj: 0 }

function productObj(html) {
  const i = html.indexOf('window.productObj = ')
  if (i < 0) return null
  const j = html.indexOf('</script>', i)
  try {
    return JSON.parse(html.slice(i + 20, j).trim().replace(/;\s*$/, ''))
  } catch {
    return null
  }
}

const links = new Set()
for (let page = 1; page <= 200; page++) {
  const res = await politeFetch(`${BASE}${LIST}?page=${page}`)
  stats.listPages++
  if (!res.ok) break
  const before = links.size
  for (const m of String(res.data).matchAll(/href="(\/products\/[^"?#]+)"/g)) links.add(decodeURIComponent(m[1]))
  if (links.size === before) break
  if (links.size >= LIMIT) break
}
console.log(`${storeName}: ${links.size} product links from ${stats.listPages} listing pages`)

const out = new RecordWriter(storeId)
for (const href of [...links].slice(0, LIMIT)) {
  const url = `${BASE}${href.split('/').map((s) => encodeURIComponent(s)).join('/').replace(/%2F/g, '/')}`
  const res = await politeFetch(url)
  stats.products++
  if (!res.ok) {
    stats.failed++
    continue
  }
  const o = productObj(String(res.data))
  if (!o) {
    stats.noProductObj++
    continue
  }
  const variants = o.has_variants && Array.isArray(o.variants) && o.variants.length ? o.variants : [o]
  for (const v of variants) {
    const price = Number(v.effective_price ?? v.sale_price ?? v.price)
    if (!(price > 0)) continue
    const list = Number(v.price)
    const name = [o.name, v !== o && v.name && v.name !== o.name ? v.name : ''].filter(Boolean).join(' — ').trim()
    const sz = parseSize(name)
    out.write({
      storeId,
      storeName,
      url: o.html_url ?? url,
      storeProductId: String(v.id ?? o.id),
      name,
      nameAr: /[؀-ۿ]/.test(name) ? name : null,
      nameEn: /[؀-ۿ]/.test(name) ? null : name,
      brand: o.brand_name ?? o.brand?.name ?? BRAND,
      category: Array.isArray(o.categories) ? o.categories.map((c) => c.name).join(' | ') : null,
      variant: v !== o ? (v.name ?? null) : null,
      size: sz ? `${sz.value} ${sz.unit}` : null,
      barcode: normalizeBarcode(v.barcode || v.sku || o.barcode || o.sku) ?? null,
      sku: v.sku || o.sku || null,
      price,
      originalPrice: list > price ? list : null,
      currency: o.currency ?? 'SAR',
      inStock: v.in_stock ?? o.in_stock ?? null,
      imageUrl: null,
      collectedAt: new Date().toISOString(),
    })
    stats.written++
  }
}
writeReport(storeId, {
  store: storeName,
  url: BASE,
  method: 'Zid storefront: listing pages + public product object on each product page (robots.txt allows product pages)',
  notes: `${stats.written} listings; ${stats.failed} failed pages; ${stats.noProductObj} pages without product data`,
  ...stats,
})
console.log(stats)
