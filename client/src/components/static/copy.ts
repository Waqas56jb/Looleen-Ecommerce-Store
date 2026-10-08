import { useCallback } from 'react'
import { STORE_CONFIG } from '@/config/store'
import { useT } from '@/i18n'
import { pages } from '@/i18n/pages/pages'

/** Cash-on-delivery fee shown in policy/FAQ copy (SAR, VAT incl.) */
export const COD_FEE = 15

/** Values interpolated into static copy — all sourced from STORE_CONFIG */
export function storeVars(lang: 'en' | 'ar'): Record<string, string | number> {
  const s = STORE_CONFIG
  return {
    store: s.name,
    tagline: lang === 'ar' ? s.taglineAr : s.tagline,
    legalName: s.legalName,
    cr: s.commercialRegistration,
    vat: s.vatNumber,
    address: s.address,
    email: s.supportEmail,
    phone: s.supportPhone,
    hours: s.workingHours,
    threshold: s.freeShippingThreshold,
    standardPrice: s.shipping.standard.price,
    standardDays: s.shipping.standard.days,
    expressPrice: s.shipping.express.price,
    expressDays: s.shipping.express.days,
    pointsPerSar: s.loyalty.pointsPerSar,
    pointsValue: s.loyalty.sarPerHundredPoints,
    codFee: COD_FEE,
  }
}

export function fill(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m))
}

/**
 * Structured copy for the static pages in the active language, plus `f()`
 * which fills {store}, {email}, {threshold}… placeholders.
 */
export function useStaticCopy() {
  const { lang, t, dir, isRTL } = useT()
  const c = pages[lang]
  const f = useCallback((text: string, extra?: Record<string, string | number>) => fill(text, { ...storeVars(lang), ...extra }), [lang])
  return { c, f, lang, t, dir, isRTL }
}
