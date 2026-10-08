import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { STORE_CONFIG } from '@/config/store'
import { seedAddresses } from '@/data/addresses'
import { seedNotifications, seedReturns, seedTickets } from '@/data/account'
import { seedOrders } from '@/data/orders'
import type { Address, NotificationItem, Order, ReturnRequest, Review, SupportTicket } from '@/types'
import { uid } from '@/utils'

/**
 * Customer-owned data persisted locally (stands in for the future server).
 * Components should go through services/* where an async API is expected.
 */
interface AccountState {
  addresses: Address[]
  orders: Order[]
  notifications: NotificationItem[]
  myReviews: Review[]
  returns: ReturnRequest[]
  tickets: SupportTicket[]

  saveAddress: (a: Omit<Address, 'id'> & { id?: string }) => Address
  deleteAddress: (id: string) => void
  setDefaultAddress: (id: string) => void

  addOrder: (o: Order) => void

  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  deleteNotification: (id: string) => void

  addReview: (r: Review) => void
  addReturn: (r: Omit<ReturnRequest, 'id' | 'status' | 'createdAt'>) => ReturnRequest
  addTicket: (t: Pick<SupportTicket, 'subject' | 'message'>) => SupportTicket
}

export const useAccountStore = create<AccountState>()(
  persist(
    (set, get) => ({
      addresses: seedAddresses,
      orders: seedOrders,
      notifications: seedNotifications,
      myReviews: [],
      returns: seedReturns,
      tickets: seedTickets,

      saveAddress: (input) => {
        const list = get().addresses
        const isFirst = list.length === 0
        const address: Address = { ...input, id: input.id ?? uid('addr'), isDefault: input.isDefault || isFirst }
        let next = input.id ? list.map((a) => (a.id === input.id ? address : a)) : [...list, address]
        if (address.isDefault) next = next.map((a) => ({ ...a, isDefault: a.id === address.id }))
        set({ addresses: next })
        return address
      },
      deleteAddress: (id) => {
        let next = get().addresses.filter((a) => a.id !== id)
        if (next.length && !next.some((a) => a.isDefault)) next = next.map((a, i) => ({ ...a, isDefault: i === 0 }))
        set({ addresses: next })
      },
      setDefaultAddress: (id) => set({ addresses: get().addresses.map((a) => ({ ...a, isDefault: a.id === id })) }),

      addOrder: (o) => set({ orders: [o, ...get().orders] }),

      markNotificationRead: (id) => set({ notifications: get().notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }),
      markAllNotificationsRead: () => set({ notifications: get().notifications.map((n) => ({ ...n, read: true })) }),
      deleteNotification: (id) => set({ notifications: get().notifications.filter((n) => n.id !== id) }),

      addReview: (r) => set({ myReviews: [r, ...get().myReviews] }),
      addReturn: (r) => {
        const req: ReturnRequest = { ...r, id: uid('rt'), status: 'requested', createdAt: new Date().toISOString() }
        set({ returns: [req, ...get().returns] })
        return req
      },
      addTicket: (t) => {
        const ticket: SupportTicket = { ...t, id: uid('tk'), status: 'open', createdAt: new Date().toISOString() }
        set({ tickets: [ticket, ...get().tickets] })
        return ticket
      },
    }),
    {
      name: `${STORE_CONFIG.storagePrefix}account`,
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
)

export const useUnreadCount = () => useAccountStore((s) => s.notifications.filter((n) => !n.read).length)
