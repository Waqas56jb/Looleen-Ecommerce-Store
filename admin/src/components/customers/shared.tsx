import { Briefcase, Crown } from 'lucide-react'
import { Badge } from '@/components/ui'
import { SAUDI_CITIES } from '@/config/store'
import { useT } from '@/i18n'
import type { AdminCustomer, CustomerType, Lang, SalonType } from '@/types'
import { cityName, formatDate } from '@/utils'

export const SALON_TYPES: SalonType[] = ['hair_salon', 'nail_salon', 'beauty_clinic', 'spa', 'makeup_studio', 'barbershop']
export const CUSTOMER_TYPES: CustomerType[] = ['regular', 'vip', 'professional']

export function cityOptions(lang: Lang) {
  return SAUDI_CITIES.map((c) => ({ value: c.id as string, label: c[lang] }))
}

/** VIP / Professional badge (nothing for regular customers). */
export function CustomerTypeBadge({ type }: { type: CustomerType }) {
  const { t } = useT()
  if (type === 'vip')
    return (
      <Badge tone="dark" icon={<Crown />}>
        {t('status.vip')}
      </Badge>
    )
  if (type === 'professional')
    return (
      <Badge tone="champagne" icon={<Briefcase />}>
        {t('status.professional')}
      </Badge>
    )
  return null
}

/** Normalises 05XXXXXXXX / 9665XXXXXXXX / +9665XXXXXXXX → "+966 5X XXX XXXX" */
export function normalizeSaudiPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  const local = digits.startsWith('966') ? digits.slice(3) : digits.startsWith('0') ? digits.slice(1) : digits
  if (local.length !== 9) return phone.trim()
  return `+966 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`
}

export function whatsappLink(phone: string) {
  return `https://wa.me/${phone.replace(/\D/g, '')}`
}

/** CSV row for exports (plain text, English headers). */
export function customerCsvRow(c: AdminCustomer, lang: Lang) {
  return {
    ID: c.id,
    Name: c.name,
    Email: c.email,
    Phone: c.phone,
    City: cityName(c.city, lang),
    Type: c.customerType,
    'Business name': c.businessName ?? '',
    'Business type': c.businessType ?? '',
    'Contact person': c.contactPerson ?? '',
    Status: c.status,
    Orders: c.ordersCount,
    'Total spent (SAR)': c.totalSpent,
    'Loyalty points': c.loyaltyPoints,
    'Last order': c.lastOrderAt ? formatDate(c.lastOrderAt, lang) : '',
    Registered: formatDate(c.registeredAt, lang),
  }
}
