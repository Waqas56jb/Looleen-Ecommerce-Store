/**
 * Al-Dawaa pharmacy (al-dawaa.com) — access check + report.
 *
 * As of 2026-10 every URL on www.al-dawaa.com (including robots.txt and sitemap.xml) returns a
 * Cloudflare "Attention Required!" 403 challenge page to non-browser clients. Per the collection
 * rules we do NOT attempt to bypass bot protection (no challenge solving, cookie spoofing,
 * headless browsers or proxies). Because no page loads, no public storefront config (e.g. a
 * GraphQL/REST/Algolia search endpoint) can be discovered legitimately either.
 *
 * This script re-probes the public entry points once each (politely, uncached). If any of them
 * starts returning real content, it reports that so a real collector can be written; otherwise
 * it writes raw/aldawaa.report.json with blocked: true and zero records.
 *
 * Usage: node collectors/aldawaa.mjs
 */
import { politeFetch } from '../lib/http.mjs'
import { writeReport } from '../lib/record.mjs'

const STORE_ID = 'aldawaa'
const STORE_NAME = 'Al-Dawaa'
const BASE = 'https://www.al-dawaa.com'

const PROBES = [
  `${BASE}/robots.txt`,
  `${BASE}/sitemap.xml`,
  `${BASE}/`,
  `${BASE}/ar/`,
  `${BASE}/en/`,
  `${BASE}/graphql`, // Magento GraphQL (common storefront API)
  `${BASE}/rest/V1/store/storeConfigs`, // Magento REST public config
  'https://al-dawaa.com/robots.txt',
]

const isChallenge = (r) =>
  r.status === 403 ||
  r.status === 503 ||
  (typeof r.data === 'string' && /Attention Required!|cf-chl|challenge-platform|Just a moment\.\.\./i.test(r.data))

const results = []
for (const url of PROBES) {
  // checkRobots stays on (robots.txt itself is unreachable, so the client treats it as no rules)
  const r = await politeFetch(url, { delayMs: 2000, retries: 1, cache: false })
  const challenge = !r.ok && isChallenge(r)
  results.push({ url, status: r.status, cloudflareChallenge: challenge })
  console.log(url, r.status, challenge ? 'Cloudflare challenge' : '')
}

const accessible = results.filter((r) => r.status === 200)
const blocked = accessible.length === 0

writeReport(STORE_ID, {
  storeName: STORE_NAME,
  baseUrl: BASE,
  method: blocked ? 'none — blocked by site protection' : 'probe only (some endpoints accessible — collector not yet implemented)',
  categoriesCovered: [],
  recordsWritten: 0,
  recordsRejected: 0,
  withBarcode: 0,
  withBrand: 0,
  withSize: 0,
  blocked,
  probes: results,
  notes: blocked
    ? 'Blocked by site protection: every probed URL (robots.txt, sitemap.xml, home page in ar/en, Magento GraphQL and REST config endpoints, bare domain) returns a Cloudflare "Attention Required!" 403 challenge to scripted requests. No public sitemap, feed or storefront JSON endpoint is reachable without solving the challenge, which the collection rules forbid. No data collected. Options: ask Al-Dawaa for a product/price feed or partner API, or collect manually from the website.'
    : `Some endpoints responded 200: ${accessible.map((r) => r.url).join(', ')} — investigate whether a legitimate public catalog source exists.`,
})
console.log(blocked ? 'Al-Dawaa: blocked by site protection — report written.' : 'Al-Dawaa: some endpoints accessible — see report.')
