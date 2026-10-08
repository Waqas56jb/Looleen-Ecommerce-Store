import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button, Input, Modal, RadioGroup, Select } from '@/components/ui'
import { useT } from '@/i18n'
import { updateCustomer } from '@/services/customerService'
import type { AdminCustomer, CityId, CustomerType, SalonType } from '@/types'
import { isValidEmail, isValidSaudiPhone } from '@/utils'
import { CUSTOMER_TYPES, SALON_TYPES, cityOptions, normalizeSaudiPhone } from './shared'

interface FormState {
  name: string
  email: string
  phone: string
  city: CityId
  customerType: CustomerType
  businessName: string
  businessType: SalonType | ''
  contactPerson: string
}

const fromCustomer = (c: AdminCustomer): FormState => ({
  name: c.name,
  email: c.email,
  phone: c.phone,
  city: c.city,
  customerType: c.customerType,
  businessName: c.businessName ?? '',
  businessType: c.businessType ?? '',
  contactPerson: c.contactPerson ?? '',
})

export function CustomerEditModal({ customer, onClose, onSaved }: { customer: AdminCustomer | null; onClose: () => void; onSaved?: (c: AdminCustomer) => void }) {
  const { t, lang } = useT()
  const [form, setForm] = useState<FormState | null>(customer ? fromCustomer(customer) : null)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [saving, setSaving] = useState(false)

  if (!customer || !form) return null
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm({ ...form, [k]: v })
    if (errors[k]) setErrors({ ...errors, [k]: undefined })
  }
  const isPro = form.customerType === 'professional'

  const validate = () => {
    const e: Partial<Record<keyof FormState, string>> = {}
    if (!form.name.trim()) e.name = t('common.fieldRequired')
    if (!form.email.trim()) e.email = t('common.fieldRequired')
    else if (!isValidEmail(form.email)) e.email = t('common.invalidEmail')
    if (!form.phone.trim()) e.phone = t('common.fieldRequired')
    else if (!isValidSaudiPhone(form.phone)) e.phone = t('common.invalidPhone')
    if (isPro && !form.businessName.trim()) e.businessName = t('common.fieldRequired')
    if (isPro && !form.businessType) e.businessType = t('common.fieldRequired')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (ev: FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      const updated = await updateCustomer(customer.id, {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: normalizeSaudiPhone(form.phone),
        city: form.city,
        customerType: form.customerType,
        businessName: isPro ? form.businessName.trim() : undefined,
        businessType: isPro && form.businessType ? form.businessType : undefined,
        contactPerson: isPro ? form.contactPerson.trim() || undefined : undefined,
      })
      toast.success(t('customers.edit.saved', { name: updated.name }))
      onSaved?.(updated)
      onClose()
    } catch {
      toast.error(t('customers.edit.failed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={saving ? () => undefined : onClose}
      title={t('customers.edit.title')}
      description={t('customers.edit.description')}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="customer-edit-form" loading={saving}>
            {saving ? t('common.saving') : t('common.saveChanges')}
          </Button>
        </>
      }
    >
      <form id="customer-edit-form" onSubmit={submit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label={t('customers.edit.name')} required value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} autoComplete="off" data-autofocus />
        <Input label={t('customers.edit.email')} required type="email" dir="ltr" value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />
        <Input
          label={t('customers.edit.phone')}
          required
          type="tel"
          dir="ltr"
          value={form.phone}
          onChange={(e) => set('phone', e.target.value)}
          onBlur={() => isValidSaudiPhone(form.phone) && set('phone', normalizeSaudiPhone(form.phone))}
          error={errors.phone}
          hint={t('customers.edit.phoneHint')}
          placeholder="+966 5X XXX XXXX"
        />
        <Select label={t('customers.edit.city')} required value={form.city} onChange={(e) => set('city', e.target.value as CityId)} options={cityOptions(lang)} />
        <div className="sm:col-span-2">
          <RadioGroup<CustomerType>
            name="customerType"
            label={t('customers.edit.customerType')}
            value={form.customerType}
            onChange={(v) => set('customerType', v)}
            direction="row"
            variant="card"
            options={CUSTOMER_TYPES.map((v) => ({ value: v, label: t(`status.${v}`) }))}
          />
        </div>
        {isPro && (
          <fieldset className="grid animate-fade-in grid-cols-1 gap-4 rounded-lg border border-line-soft bg-mist/50 p-4 sm:col-span-2 sm:grid-cols-2">
            <legend className="px-1 text-[13px] font-semibold text-ink">{t('customers.edit.businessSection')}</legend>
            <Input label={t('customers.edit.businessName')} required value={form.businessName} onChange={(e) => set('businessName', e.target.value)} error={errors.businessName} />
            <Select
              label={t('customers.edit.businessType')}
              required
              value={form.businessType}
              onChange={(e) => set('businessType', e.target.value as SalonType | '')}
              placeholder={t('customers.edit.selectType')}
              options={SALON_TYPES.map((s) => ({ value: s, label: t(`salonTypes.${s}`) }))}
              error={errors.businessType}
            />
            <Input label={t('customers.edit.contactPerson')} value={form.contactPerson} onChange={(e) => set('contactPerson', e.target.value)} wrapperClassName="sm:col-span-2" />
          </fieldset>
        )}
      </form>
    </Modal>
  )
}
