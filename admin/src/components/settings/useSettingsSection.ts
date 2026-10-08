import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useAsync } from '@/hooks'
import { useT } from '@/i18n'
import { getSettings, updateSettings } from '@/services/systemService'
import type { StoreSettings } from '@/types'

export type FieldErrors = Record<string, string>

/**
 * Loads one settings section, tracks a local draft, detects dirty state,
 * validates and saves through updateSettings(section, value).
 */
export function useSettingsSection<K extends keyof StoreSettings>(section: K, validate?: (v: StoreSettings[K]) => FieldErrors) {
  const { t } = useT()
  const { data, loading, error, reload } = useAsync(getSettings, [])
  const [initial, setInitial] = useState<StoreSettings[K] | null>(null)
  const [value, setValue] = useState<StoreSettings[K] | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (data) {
      setInitial(data[section])
      setValue(data[section])
    }
  }, [data, section])

  const dirty = useMemo(() => initial !== null && JSON.stringify(initial) !== JSON.stringify(value), [initial, value])

  // Re-validate live once the user has attempted to save
  useEffect(() => {
    if (submitted && value && validate) setErrors(validate(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, submitted])

  const update = useCallback((next: StoreSettings[K] | ((prev: StoreSettings[K]) => StoreSettings[K])) => {
    setValue((prev) => (prev === null ? prev : typeof next === 'function' ? (next as (p: StoreSettings[K]) => StoreSettings[K])(prev) : next))
  }, [])

  const patch = useCallback((p: Partial<StoreSettings[K]>) => setValue((prev) => (prev === null ? prev : { ...prev, ...p })), [])

  const discard = useCallback(() => {
    setValue(initial)
    setErrors({})
    setSubmitted(false)
  }, [initial])

  const save = useCallback(async () => {
    if (!value) return false
    const errs = validate ? validate(value) : {}
    setErrors(errs)
    setSubmitted(true)
    if (Object.keys(errs).length > 0) {
      toast.error(t('settings.fixErrors'))
      return false
    }
    setSaving(true)
    try {
      const next = await updateSettings(section, value)
      setInitial(next[section])
      setValue(next[section])
      setSubmitted(false)
      toast.success(t('common.settingsSaved'))
      return true
    } catch {
      toast.error(t('settings.saveFailed'))
      return false
    } finally {
      setSaving(false)
    }
  }, [value, validate, section, t])

  return { all: data, value, initial, setValue: update, patch, dirty, errors, saving, save, discard, loading: loading && !value, error, reload }
}
