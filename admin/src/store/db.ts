/**
 * Mock database — one persisted Zustand store per collection (localStorage
 * keys `admin_<name>`). ONLY services/* may read or write these stores;
 * UI components go through the services so a real API can replace them.
 */
import { create, type StoreApi, type UseBoundStore } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { STORE_CONFIG } from '@/config/store'
import { seedBrands, seedCategories, seedMovements, seedProducts } from '@/data/seed/catalog'
import { seedActivity, seedBanners, seedCampaigns, seedCoupons, seedHomepage, seedNotifications, seedOffers, seedReturns, seedReviews, seedSettings } from '@/data/seed/operations'
import { seedAdmins, seedCustomers, seedOrders, seedTickets } from '@/data/seed/people'
import type {
  ActivityLog,
  AdminBrand,
  AdminCategory,
  AdminCustomer,
  AdminNotification,
  AdminOrder,
  AdminProduct,
  AdminReview,
  AdminUser,
  Banner,
  Campaign,
  Coupon,
  HomepageSection,
  Offer,
  ReturnRequest,
  StockMovement,
  StoreSettings,
  SupportTicket,
} from '@/types'

export interface Collection<T> {
  items: T[]
  set: (items: T[]) => void
  reset: () => void
}

/** Bump to force-reseed every browser when seed data shape changes */
const DB_VERSION = 2

function collection<T>(name: string, seed: T[]): UseBoundStore<StoreApi<Collection<T>>> {
  return create<Collection<T>>()(
    persist(
      (set) => ({
        items: seed,
        set: (items) => set({ items }),
        reset: () => set({ items: seed }),
      }),
      {
        name: `${STORE_CONFIG.storagePrefix}${name}`,
        version: DB_VERSION,
        storage: createJSONStorage(() => localStorage),
        partialize: (s) => ({ items: s.items }) as Collection<T>,
        migrate: () => ({ items: seed }) as Collection<T>,
      },
    ),
  )
}

export const db = {
  products: collection<AdminProduct>('products', seedProducts),
  brands: collection<AdminBrand>('brands', seedBrands),
  categories: collection<AdminCategory>('categories', seedCategories),
  movements: collection<StockMovement>('inventory', seedMovements),
  orders: collection<AdminOrder>('orders', seedOrders),
  customers: collection<AdminCustomer>('customers', seedCustomers),
  tickets: collection<SupportTicket>('tickets', seedTickets),
  reviews: collection<AdminReview>('reviews', seedReviews),
  returns: collection<ReturnRequest>('returns', seedReturns),
  coupons: collection<Coupon>('coupons', seedCoupons),
  campaigns: collection<Campaign>('campaigns', seedCampaigns),
  offers: collection<Offer>('offers', seedOffers),
  banners: collection<Banner>('banners', seedBanners),
  homepage: collection<HomepageSection>('homepage', seedHomepage),
  notifications: collection<AdminNotification>('notifications', seedNotifications),
  activity: collection<ActivityLog>('activity', seedActivity),
  admins: collection<AdminUser>('admins', seedAdmins),
}

export type DbName = keyof typeof db

interface SettingsState {
  settings: StoreSettings
  setSettings: (s: StoreSettings) => void
}

export const settingsDb = create<SettingsState>()(
  persist(
    (set) => ({ settings: seedSettings, setSettings: (settings) => set({ settings }) }),
    { name: `${STORE_CONFIG.storagePrefix}settings`, version: DB_VERSION, migrate: () => ({ settings: seedSettings }) as SettingsState },
  ),
)

/* ---------------- Generic helpers used by services ---------------- */

export function all<K extends DbName>(name: K): ReturnType<(typeof db)[K]['getState']>['items'] {
  return db[name].getState().items as never
}

export function write<K extends DbName>(name: K, items: ReturnType<(typeof db)[K]['getState']>['items']) {
  ;(db[name].getState().set as (i: unknown) => void)(items)
}

/** Reset every collection to seed data (Settings → "Reset demo data") */
export function resetAll() {
  Object.values(db).forEach((c) => c.getState().reset())
  settingsDb.getState().setSettings(seedSettings)
}
