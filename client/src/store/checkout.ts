import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { STORE_CONFIG, type PaymentMethodId } from '@/config/store'
import type { Address, ShippingMethod } from '@/types'

export type CheckoutAddress = Omit<Address, 'id' | 'isDefault' | 'label'> & { id?: string }

/** Checkout draft, kept in sessionStorage so a refresh doesn’t lose progress */
interface CheckoutState {
  step: number
  address: CheckoutAddress | null
  shippingMethod: ShippingMethod
  paymentMethod: PaymentMethodId | null
  setStep: (s: number) => void
  setAddress: (a: CheckoutAddress) => void
  setShippingMethod: (m: ShippingMethod) => void
  setPaymentMethod: (p: PaymentMethodId) => void
  reset: () => void
}

const initial = { step: 0, address: null, shippingMethod: 'standard' as ShippingMethod, paymentMethod: null }

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      ...initial,
      setStep: (step) => set({ step }),
      setAddress: (address) => set({ address }),
      setShippingMethod: (shippingMethod) => set({ shippingMethod }),
      setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
      reset: () => set(initial),
    }),
    { name: `${STORE_CONFIG.storagePrefix}checkout`, storage: createJSONStorage(() => sessionStorage) },
  ),
)
