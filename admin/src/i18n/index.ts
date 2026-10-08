import { useCallback } from 'react'
import { useUIStore } from '@/store/uiStore'
import type { Lang, LocalizedText } from '@/types'
import { ar } from './ar'
import { en } from './en'

const DICTS: Record<Lang, unknown> = { en, ar }

function lookup(dict: unknown, path: string): string | undefined {
  let node: unknown = dict
  for (const part of path.split('.')) {
    if (node && typeof node === 'object' && part in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[part]
    } else {
      return undefined
    }
  }
  return typeof node === 'string' ? node : undefined
}

export type TranslateVars = Record<string, string | number>

export function translate(lang: Lang, key: string, vars?: TranslateVars): string {
  const raw = lookup(DICTS[lang], key) ?? lookup(DICTS.en, key) ?? key
  if (!vars) return raw
  return raw.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : `{${k}}`))
}

/**
 * Main i18n hook.
 *   const { t, lang, dir, l } = useT()
 *   t('common.addToCart')            → "Add to Cart" / "أضيفي إلى السلة"
 *   t('common.off', { value: 20 })   → "20% off"
 *   l(product.shortDescription)      → picks the current language from a LocalizedText
 */
export function useT() {
  const lang = useUIStore((s) => s.lang)
  const t = useCallback((key: string, vars?: TranslateVars) => translate(lang, key, vars), [lang])
  const l = useCallback((text: LocalizedText | undefined) => (text ? (text[lang] || text.en) : ''), [lang])
  return { t, l, lang, dir: lang === 'ar' ? ('rtl' as const) : ('ltr' as const), isRTL: lang === 'ar' }
}

/** Non-hook translate (services/toasts outside React) */
export const tNow = (key: string, vars?: TranslateVars) => translate(useUIStore.getState().lang, key, vars)
