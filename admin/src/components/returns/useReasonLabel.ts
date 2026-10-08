import { useCallback } from 'react'
import { useT } from '@/i18n'

/** Translates a seeded return reason; falls back to the raw text for custom reasons */
export function useReasonLabel() {
  const { t } = useT()
  return useCallback(
    (reason: string) => {
      if (reason.includes('.')) return reason
      const key = `orders.returns.reasons.${reason}`
      const v = t(key)
      return v === key ? reason : v
    },
    [t],
  )
}
