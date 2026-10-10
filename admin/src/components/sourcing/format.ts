import type { SourcingProduct } from '@/types/sourcing'

/** Supplier lists use ALL-CAPS short names ("CARE ABSOLUTE VOLUME SHAMPOO") — show them readably with the brand */
export function displayName(p: Pick<SourcingProduct, 'brand' | 'nameEn' | 'size'>) {
  let n = p.nameEn
  if (n === n.toUpperCase()) n = n.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase())
  const first = p.brand.split(' ')[0].toLowerCase()
  if (!n.toLowerCase().startsWith(first)) n = `${p.brand} ${n}`
  if (p.size && !n.replace(/\s/g, '').toLowerCase().includes(p.size.replace(/\s/g, '').toLowerCase())) n = `${n} ${p.size}`
  return n
}
