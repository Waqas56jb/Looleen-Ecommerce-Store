import { lazy } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AccountLayout } from '@/layouts/AccountLayout'
import { MainLayout } from '@/layouts/MainLayout'
import Home from '@/pages/Home'

/* Route-level code splitting — the home page ships in the main bundle */
const CategoryPage = lazy(() => import('@/pages/CategoryPage'))
const ProductPage = lazy(() => import('@/pages/ProductPage'))
const BrandsPage = lazy(() => import('@/pages/BrandsPage'))
const BrandPage = lazy(() => import('@/pages/BrandPage'))
const SearchPage = lazy(() => import('@/pages/SearchPage'))
const OffersPage = lazy(() => import('@/pages/OffersPage'))
const BestSellersPage = lazy(() => import('@/pages/BestSellersPage'))
const NewArrivalsPage = lazy(() => import('@/pages/NewArrivalsPage'))
const CartPage = lazy(() => import('@/pages/CartPage'))
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'))
const OrderSuccessPage = lazy(() => import('@/pages/OrderSuccessPage'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'))
const AboutPage = lazy(() => import('@/pages/AboutPage'))
const ContactPage = lazy(() => import('@/pages/ContactPage'))
const FAQPage = lazy(() => import('@/pages/FAQPage'))
const ShippingPolicyPage = lazy(() => import('@/pages/ShippingPolicyPage'))
const ReturnPolicyPage = lazy(() => import('@/pages/ReturnPolicyPage'))
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage'))
const TermsPage = lazy(() => import('@/pages/TermsPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

const AccountPage = lazy(() => import('@/pages/account/AccountPage'))
const OrdersPage = lazy(() => import('@/pages/account/OrdersPage'))
const OrderDetailPage = lazy(() => import('@/pages/account/OrderDetailPage'))
const WishlistPage = lazy(() => import('@/pages/account/WishlistPage'))
const AddressesPage = lazy(() => import('@/pages/account/AddressesPage'))
const LoyaltyPage = lazy(() => import('@/pages/account/LoyaltyPage'))
const ReviewsPage = lazy(() => import('@/pages/account/ReviewsPage'))
const NotificationsPage = lazy(() => import('@/pages/account/NotificationsPage'))
const ProfilePage = lazy(() => import('@/pages/account/ProfilePage'))
const ReturnsPage = lazy(() => import('@/pages/account/ReturnsPage'))
const SupportPage = lazy(() => import('@/pages/account/SupportPage'))

const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/category/:slug', element: <CategoryPage /> },
      { path: '/brands', element: <BrandsPage /> },
      { path: '/brand/:slug', element: <BrandPage /> },
      { path: '/product/:slug', element: <ProductPage /> },
      { path: '/search', element: <SearchPage /> },
      { path: '/offers', element: <OffersPage /> },
      { path: '/best-sellers', element: <BestSellersPage /> },
      { path: '/new-arrivals', element: <NewArrivalsPage /> },
      { path: '/cart', element: <CartPage /> },
      { path: '/checkout', element: <CheckoutPage /> },
      { path: '/order-success', element: <OrderSuccessPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/wishlist', element: <WishlistPage /> },
      {
        path: '/account',
        element: <AccountLayout />,
        children: [
          { index: true, element: <AccountPage /> },
          { path: 'orders', element: <OrdersPage /> },
          { path: 'orders/:id', element: <OrderDetailPage /> },
          { path: 'wishlist', element: <WishlistPage /> },
          { path: 'addresses', element: <AddressesPage /> },
          { path: 'loyalty', element: <LoyaltyPage /> },
          { path: 'reviews', element: <ReviewsPage /> },
          { path: 'notifications', element: <NotificationsPage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'returns', element: <ReturnsPage /> },
          { path: 'support', element: <SupportPage /> },
        ],
      },
      { path: '/about', element: <AboutPage /> },
      { path: '/contact', element: <ContactPage /> },
      { path: '/faq', element: <FAQPage /> },
      { path: '/shipping-policy', element: <ShippingPolicyPage /> },
      { path: '/return-policy', element: <ReturnPolicyPage /> },
      { path: '/privacy', element: <PrivacyPage /> },
      { path: '/terms', element: <TermsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
