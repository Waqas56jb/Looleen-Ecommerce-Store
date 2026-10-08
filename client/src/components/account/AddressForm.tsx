import { useState, type FormEvent } from 'react'
import { Button, Checkbox, Input, Select } from '@/components/common'
import { SAUDI_CITIES, type CityId } from '@/config/store'
import { useT } from '@/i18n'
import type { Address } from '@/types'
import { isValidSaudiPhone, normalizeSaudiPhone } from '@/utils'

export type AddressInput = Omit<Address, 'id' | 'isDefault' | 'label'> & { label?: string; isDefault?: boolean }

const EMPTY: AddressInput = { fullName: '', phone: '', city: 'riyadh', district: '', street: '', building: '', apartment: '', postalCode: '', label: '', isDefault: false }

interface AddressFormProps {
  initial?: Partial<AddressInput>
  onSubmit: (value: AddressInput) => void | Promise<void>
  submitLabel?: string
  onCancel?: () => void
  /** Show "Label" + "Set as default" (account) — hidden in checkout */
  showMeta?: boolean
  loading?: boolean
}

/** Saudi address form with validation — used by checkout and the address book */
export function AddressForm({ initial, onSubmit, submitLabel, onCancel, showMeta, loading }: AddressFormProps) {
  const { t, lang } = useT()
  const [v, setV] = useState<AddressInput>({ ...EMPTY, ...initial })
  const [errors, setErrors] = useState<Partial<Record<keyof AddressInput, string>>>({})
  const set = <K extends keyof AddressInput>(k: K, val: AddressInput[K]) => {
    setV((s) => ({ ...s, [k]: val }))
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const validate = () => {
    const e: typeof errors = {}
    if (!v.fullName.trim()) e.fullName = t('common.required')
    if (!isValidSaudiPhone(v.phone)) e.phone = t('common.invalidPhone')
    if (!v.district.trim()) e.district = t('common.required')
    if (!v.street.trim()) e.street = t('common.required')
    if (!v.building.trim()) e.building = t('common.required')
    if (!/^\d{5}$/.test(v.postalCode.trim())) e.postalCode = lang === 'ar' ? 'الرمز البريدي 5 أرقام' : 'Postal code must be 5 digits'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit({ ...v, phone: normalizeSaudiPhone(v.phone) })
  }

  const L = (en: string, ar: string) => (lang === 'ar' ? ar : en)

  return (
    <form noValidate onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {showMeta && <Input label={L('Address label', 'اسم العنوان')} placeholder={L('Home, Office…', 'المنزل، العمل…')} value={v.label ?? ''} onChange={(e) => set('label', e.target.value)} wrapperClassName="sm:col-span-2" />}
      <Input label={L('Full name', 'الاسم الكامل')} autoComplete="name" value={v.fullName} onChange={(e) => set('fullName', e.target.value)} error={errors.fullName} />
      <Input label={L('Mobile number', 'رقم الجوال')} type="tel" inputMode="tel" autoComplete="tel" dir="ltr" placeholder="+966 5X XXX XXXX" value={v.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone} />
      <Select
        label={L('City', 'المدينة')}
        value={v.city}
        onChange={(e) => set('city', e.target.value as CityId)}
        options={SAUDI_CITIES.map((c) => ({ value: c.id, label: lang === 'ar' ? c.ar : c.en }))}
      />
      <Input label={L('District', 'الحي')} value={v.district} onChange={(e) => set('district', e.target.value)} error={errors.district} />
      <Input label={L('Street', 'الشارع')} autoComplete="address-line1" value={v.street} onChange={(e) => set('street', e.target.value)} error={errors.street} wrapperClassName="sm:col-span-2" />
      <Input label={L('Building no.', 'رقم المبنى')} value={v.building} onChange={(e) => set('building', e.target.value)} error={errors.building} />
      <Input label={L('Apartment / floor', 'الشقة / الطابق')} optional optionalLabel={t('common.optional')} value={v.apartment ?? ''} onChange={(e) => set('apartment', e.target.value)} />
      <Input label={L('Postal code', 'الرمز البريدي')} inputMode="numeric" dir="ltr" maxLength={5} value={v.postalCode} onChange={(e) => set('postalCode', e.target.value.replace(/\D/g, ''))} error={errors.postalCode} />
      {showMeta && (
        <div className="flex items-end sm:col-span-1">
          <Checkbox label={L('Set as default address', 'تعيين كعنوان افتراضي')} checked={!!v.isDefault} onChange={(e) => set('isDefault', e.target.checked)} />
        </div>
      )}
      <div className="mt-2 flex gap-3 sm:col-span-2">
        <Button type="submit" variant="dark" size="lg" loading={loading} className="flex-1 sm:flex-none">
          {submitLabel ?? t('common.save')}
        </Button>
        {onCancel && (
          <Button variant="ghost" size="lg" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
        )}
      </div>
    </form>
  )
}

/** Compact address display */
export function AddressLines({ address, className }: { address: AddressInput; className?: string }) {
  const { lang } = useT()
  const city = SAUDI_CITIES.find((c) => c.id === address.city)
  return (
    <address className={className ?? 'text-sm leading-relaxed text-muted not-italic'}>
      <span className="block font-medium text-ink">{address.fullName}</span>
      <span className="block">
        {address.building} {address.street}
        {address.apartment ? `, ${address.apartment}` : ''}
      </span>
      <span className="block">
        {address.district}, {lang === 'ar' ? city?.ar : city?.en} {address.postalCode}
      </span>
      <span className="block" dir="ltr">
        {address.phone}
      </span>
    </address>
  )
}
