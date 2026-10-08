import { useCallback } from 'react'
import { useT } from '@/i18n'

/** Status word for running text ("marked as shipped") — lower-cased in English */
export function useStatusWord() {
  const { t, lang } = useT()
  return useCallback((s: string) => (lang === 'en' ? t(`status.${s}`).toLowerCase() : t(`status.${s}`)), [t, lang])
}
