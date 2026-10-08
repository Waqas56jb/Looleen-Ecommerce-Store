import { lazy } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { AdminLayout } from '@/layouts/AdminLayout'
import { AuthLayout } from '@/layouts/AuthLayout'

const page = (load: () => Promise<{ default: React.ComponentType }>) => {
  const C = lazy(load)
  return <C />
}

const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: page(() => import('@/pages/LoginPage')) },
      { path: '/forgot-password', element: page(() => import('@/pages/ForgotPasswordPage')) },
    ],
  },
  {
    element: <AdminLayout />,
    children: [
      { path: '/', element: <Navigate to="/dashboard" replace /> },
      { path: '/dashboard', element: page(() => import('@/pages/DashboardPage')) },

      { path: '/products', element: page(() => import('@/pages/ProductsPage')) },
      { path: '/products/new', element: page(() => import('@/pages/ProductCreatePage')) },
      { path: '/products/:id', element: page(() => import('@/pages/ProductDetailPage')) },
      { path: '/products/:id/edit', element: page(() => import('@/pages/ProductEditPage')) },

      { path: '/categories', element: page(() => import('@/pages/CategoriesPage')) },
      { path: '/categories/new', element: page(() => import('@/pages/CategoryCreatePage')) },
      { path: '/categories/:id/edit', element: page(() => import('@/pages/CategoryEditPage')) },

      { path: '/brands', element: page(() => import('@/pages/BrandsPage')) },
      { path: '/brands/new', element: page(() => import('@/pages/BrandCreatePage')) },
      { path: '/brands/:id', element: page(() => import('@/pages/BrandDetailPage')) },
      { path: '/brands/:id/edit', element: page(() => import('@/pages/BrandEditPage')) },

      { path: '/inventory', element: page(() => import('@/pages/InventoryPage')) },
      { path: '/inventory/:id', element: page(() => import('@/pages/InventoryDetailPage')) },

      { path: '/orders', element: page(() => import('@/pages/OrdersPage')) },
      { path: '/orders/:id', element: page(() => import('@/pages/OrderDetailPage')) },

      { path: '/customers', element: page(() => import('@/pages/CustomersPage')) },
      { path: '/customers/professional', element: page(() => import('@/pages/ProfessionalCustomersPage')) },
      { path: '/customers/:id', element: page(() => import('@/pages/CustomerDetailPage')) },

      { path: '/coupons', element: page(() => import('@/pages/CouponsPage')) },
      { path: '/coupons/new', element: page(() => import('@/pages/CouponCreatePage')) },
      { path: '/coupons/:id/edit', element: page(() => import('@/pages/CouponEditPage')) },
      { path: '/campaigns', element: page(() => import('@/pages/CampaignsPage')) },
      { path: '/offers', element: page(() => import('@/pages/OffersPage')) },

      { path: '/banners', element: page(() => import('@/pages/BannersPage')) },
      { path: '/banners/new', element: page(() => import('@/pages/BannerCreatePage')) },
      { path: '/banners/:id/edit', element: page(() => import('@/pages/BannerEditPage')) },
      { path: '/content/homepage', element: page(() => import('@/pages/HomepageContentPage')) },

      { path: '/reviews', element: page(() => import('@/pages/ReviewsPage')) },
      { path: '/reviews/:id', element: page(() => import('@/pages/ReviewDetailPage')) },
      { path: '/returns', element: page(() => import('@/pages/ReturnsPage')) },
      { path: '/returns/:id', element: page(() => import('@/pages/ReturnDetailPage')) },

      { path: '/reports', element: page(() => import('@/pages/ReportsPage')) },
      { path: '/reports/sales', element: page(() => import('@/pages/SalesReportPage')) },
      { path: '/reports/products', element: page(() => import('@/pages/ProductReportPage')) },
      { path: '/reports/customers', element: page(() => import('@/pages/CustomerReportPage')) },

      { path: '/notifications', element: page(() => import('@/pages/NotificationsPage')) },
      { path: '/activity', element: page(() => import('@/pages/ActivityLogPage')) },

      { path: '/settings', element: page(() => import('@/pages/SettingsPage')) },
      { path: '/settings/general', element: page(() => import('@/pages/GeneralSettingsPage')) },
      { path: '/settings/store', element: page(() => import('@/pages/StoreSettingsPage')) },
      { path: '/settings/payment', element: page(() => import('@/pages/PaymentSettingsPage')) },
      { path: '/settings/shipping', element: page(() => import('@/pages/ShippingSettingsPage')) },
      { path: '/settings/tax', element: page(() => import('@/pages/TaxSettingsPage')) },
      { path: '/settings/localization', element: page(() => import('@/pages/LocalizationSettingsPage')) },
      { path: '/settings/notifications', element: page(() => import('@/pages/NotificationSettingsPage')) },

      { path: '/profile', element: page(() => import('@/pages/ProfilePage')) },
      { path: '*', element: page(() => import('@/pages/NotFoundPage')) },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
