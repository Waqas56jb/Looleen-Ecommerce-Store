/**
 * Sephora KSA (sephora.me/sa-en).
 *
 * Findings: robots.txt and the sitemap index / sitemap files are publicly served, but every storefront
 * page (home, category, product pages) answers "403 Access Denied" from Akamai (errors.edgesuite.net)
 * to a plain, honestly identified HTTP client. The sitemaps hold only product URLs (no price, brand,
 * size), and robots.txt disallows the storefront API paths (*\/api/v1*, /on/demandware.store/*).
 * Per the collection rules we do NOT bypass bot protection, so no price records can be collected.
 *
 * This script re-checks that state every run:
 *   1. reads the sitemap index and the en-SA product sitemaps (counts the public product URLs),
 *   2. probes the home page and a few sample product pages from the sitemap,
 *   3. writes raw/sephora.report.json (blocked=true unless product pages become reachable).
 * If product pages ever return 200, it stops and reports that a page parser must be implemented.
 *
 * Usage: node collectors/sephora.mjs [--limit N]   (--limit accepted for interface parity)
 */
import { politeFetch, robotsAllowed } from '../lib/http.mjs'
import { RecordWriter, writeReport } from '../lib/record.mjs'

const STORE_ID = 'sephora'
const STORE_NAME = 'Sephora KSA'
const BASE = 'https://www.sephora.me'

const writer = new RecordWriter(STORE_ID)
const probes = []
const probe = async (url) => {
  const r = await politeFetch(url, { delayMs: 2000, cache: false, retries: 1 })
  const akamai = typeof r.data === 'string' && /Access Denied|edgesuite\.net/i.test(r.data)
  probes.push({ url, status: r.status, akamaiDenied: akamai })
  console.log(url, r.status, akamai ? '(Akamai Access Denied)' : '')
  return { ...r, akamai }
}

// 1. sitemaps (public)
const index = await probe(`${BASE}/sitemap.xml`)
const productSitemaps = index.ok ? [...index.data.matchAll(/<loc>([^<]+\/en-SA\/catalog\/productSlugs[^<]+)<\/loc>/g)].map((m) => m[1]) : []
const productUrls = new Set()
for (const sm of productSitemaps) {
  const r = await politeFetch(sm, { delayMs: 2000, cache: true })
  if (r.ok) for (const m of r.data.matchAll(/<loc>(https:\/\/www\.sephora\.me\/sa-en\/p\/[^<]+)<\/loc>/g)) productUrls.add(m[1])
}
const masterUrls = [...productUrls].filter((u) => /\/P\d+$/.test(u))
console.log(`sitemaps: ${productSitemaps.length} en-SA product sitemaps, ${productUrls.size} product URLs (${masterUrls.length} master product URLs)`)

// 2. storefront probes
await probe(`${BASE}/sa-en`)
const samples = masterUrls.slice(0, 3)
const sampleResults = []
for (const u of samples) {
  if (!(await robotsAllowed(u))) continue
  sampleResults.push(await probe(u))
}
const pagesReachable = sampleResults.some((r) => r.ok && !r.akamai)
const blocked = !pagesReachable

writeReport(STORE_ID, {
  storeName: STORE_NAME,
  baseUrl: `${BASE}/sa-en`,
  method: blocked ? 'none — product/category pages blocked by site protection (Akamai); only robots.txt + sitemaps reachable' : 'probe only — product pages reachable, parser not implemented',
  categoriesCovered: [],
  recordsWritten: writer.count,
  recordsRejected: 0,
  withBarcode: 0,
  withBrand: 0,
  withSize: 0,
  blocked,
  sitemapProductUrls: productUrls.size,
  sitemapMasterProductUrls: masterUrls.length,
  probes,
  notes: [
    'robots.txt and sitemap.xml (+ en-SA product/category sitemaps) are public and were read; they list product URLs only — no prices, brands or sizes.',
    'Storefront home, category and product pages return HTTP 403 "Access Denied" from Akamai (errors.edgesuite.net); robots.txt also disallows the storefront API paths (*/api/v1*, /on/demandware.store/*).',
    'No bypass attempted (no challenge solving, cookie/token reuse, headless browser, proxies) per collection rules. No price records collected.',
    `Public sitemap lists ${productUrls.size} sa-en product URLs (${masterUrls.length} master "P…" products) — catalog size reference only.`,
    'Store reported as "blocked by site protection".',
  ],
})
console.log(blocked ? 'Sephora KSA: blocked by site protection — no price records collected' : 'Product pages reachable — implement a page parser')
