import { normalizeBarcode, parseSize, parsePrice, splitArEn } from '../lib/record.mjs'
import { robotsAllowed } from '../lib/http.mjs'
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) { console.log('FAIL', m, a, b); process.exitCode = 1 } }
eq(normalizeBarcode('8005610657561'), '8005610657561', 'ean13 valid')
eq(normalizeBarcode('8005610657562'), null, 'ean13 bad checksum')
eq(parseSize('CARE VITAL 1000ml')?.value, 1000, 'ml')
eq(parseSize('1L shampoo')?.value, 1000, 'L')
eq(parseSize('15x2ml ampoules')?.value, 30, 'pack')
eq(parseSize('شامبو 250 مل')?.value, 250, 'arabic ml')
eq(parseSize('KP 6/7 60ml')?.value, 60, 'kp')
eq(parsePrice('1,299.50 SAR'), 1299.5, 'price')
eq(parsePrice('١٢٩٫٥٠'), 129.5, 'arabic digits')
eq(splitArEn('هدى بيوتي - HUDA BEAUTY'), { ar: 'هدى بيوتي', en: 'HUDA BEAUTY' }, 'split')
console.log('selftest done')
const sites = ['https://looieen.com/', 'https://www.goldenscent.com/', 'https://www.noon.com/saudi-en/', 'https://www.amazon.sa/', 'https://www.whites.sa/ar-sa', 'https://www.al-dawaa.com/', 'https://www.nahdionline.com/ar-sa', 'https://beautyselect.sa/en/', 'https://cosmetics.sa/en', 'https://kohlalward.com/en', 'https://www.watsons.sa/', 'https://www.sephora.me/sa-en', 'https://www.faces.sa/en/', 'https://niceonesa.com/ar']
for (const s of sites) {
  let home = '?'
  try { const r = await fetch(s, { headers: { 'user-agent': 'Mozilla/5.0 Chrome/129.0' }, redirect: 'follow' }); home = r.status + ' ' + (r.headers.get('server') || '') + ' ' + (r.headers.get('x-powered-by') || '') } catch (e) { home = 'ERR ' + e.message }
  console.log(s.padEnd(42), 'home:', home.padEnd(28), 'robots-root-allowed:', await robotsAllowed(s))
}
