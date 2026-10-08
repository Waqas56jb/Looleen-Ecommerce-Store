import type { Address } from '@/types'

export const seedAddresses: Address[] = [
  {
    id: 'addr-1',
    label: 'Home',
    fullName: 'Noura Al-Qahtani',
    phone: '+966 55 123 4567',
    city: 'riyadh',
    district: 'Al Malqa',
    street: 'Anas Ibn Malik Road',
    building: '4821',
    apartment: '12',
    postalCode: '13521',
    isDefault: true,
  },
  {
    id: 'addr-2',
    label: 'Office',
    fullName: 'Noura Al-Qahtani',
    phone: '+966 55 123 4567',
    city: 'riyadh',
    district: 'Al Olaya',
    street: 'King Fahd Road',
    building: '7700',
    apartment: 'Floor 9',
    postalCode: '12211',
    isDefault: false,
  },
]
