import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { Toaster } from 'sonner'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { LoadingSpinner } from '@/components/common'
import { Footer } from '@/components/layout/footer/Footer'
import { AnnouncementBar, Header } from '@/components/layout/header/Header'
import { MobileMenu, MobileSearch } from '@/components/layout/header/MobileNav'
import { ProductQuickView } from '@/components/product/ProductQuickView'
import { useT } from '@/i18n'
import { whatsappLink } from '@/utils'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

/** Floating WhatsApp button — bottom-end, so it mirrors to the left in RTL */
function FloatingWhatsAppButton() {
  const { t } = useT()
  return (
    <a
      href={whatsappLink()}
      target="_blank"
      rel="noreferrer"
      aria-label={t('common.whatsappChat')}
      title={t('common.whatsappChat')}
      className="group fixed end-4 bottom-4 z-40 flex h-14 items-center gap-2 rounded-full bg-[#25d366] ps-4 pe-4 text-white shadow-lift transition-all duration-300 hover:pe-5 sm:end-6 sm:bottom-6"
    >
      <MessageCircle className="size-6" fill="currentColor" strokeWidth={1.2} aria-hidden />
      <span className="hidden max-w-0 overflow-hidden text-sm font-medium whitespace-nowrap transition-all duration-300 group-hover:max-w-40 sm:inline">WhatsApp</span>
    </a>
  )
}

export function MainLayout() {
  const { dir, t } = useT()
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only z-[100] rounded-full bg-ink px-4 py-2 text-ivory focus:not-sr-only focus:fixed focus:start-4 focus:top-4">
        Skip to content
      </a>
      <ScrollToTop />
      <AnnouncementBar />
      <Header />
      <main id="main" className="flex-1">
        <Suspense fallback={<LoadingSpinner className="min-h-[60vh]" label={t('common.loading')} />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <CartDrawer />
      <MobileMenu />
      <MobileSearch />
      <ProductQuickView />
      <FloatingWhatsAppButton />
      <Toaster
        position={dir === 'rtl' ? 'bottom-left' : 'bottom-right'}
        dir={dir}
        offset={88}
        mobileOffset={{ bottom: 88 }}
        toastOptions={{
          classNames: {
            toast: '!rounded-xs !border-line !bg-white !text-ink !shadow-lift !font-sans',
            description: '!text-muted',
            actionButton: '!bg-ink !text-ivory !rounded-full',
          },
        }}
      />
    </div>
  )
}
