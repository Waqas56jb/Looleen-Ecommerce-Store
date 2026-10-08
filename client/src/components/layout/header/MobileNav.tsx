import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Globe, Heart, MessageCircle, Package, User } from 'lucide-react'
import { AccordionItem, Drawer, Logo } from '@/components/common'
import { SearchBox } from '@/components/search/SearchBox'
import { categories } from '@/data/categories'
import { useEscape, useLockBodyScroll } from '@/hooks'
import { useT } from '@/i18n'
import { useAuthStore } from '@/store/auth'
import { useUIStore } from '@/store/ui'
import { whatsappLink } from '@/utils'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

/** Full-height mobile navigation drawer with expandable categories */
export function MobileMenu() {
  const open = useUIStore((s) => s.mobileMenuOpen)
  const setOpen = useUIStore((s) => s.setMobileMenuOpen)
  const toggleLang = useUIStore((s) => s.toggleLang)
  const user = useAuthStore((s) => s.user)
  const { t, l } = useT()
  const location = useLocation()
  useEffect(() => setOpen(false), [location.pathname, location.search, setOpen])
  const close = () => setOpen(false)

  const linkCls = 'block py-2.5 text-[15px] text-ink/80 hover:text-rose'
  return (
    <Drawer open={open} onClose={close} side="start" title={<Logo showTagline={false} className="items-start" />}>
      <nav aria-label="Mobile" className="px-5 pb-8">
        <ul className="border-b border-line py-3">
          <li>
            <Link to="/new-arrivals" className="block py-3 font-serif text-2xl">
              {t('nav.newArrivals')}
            </Link>
          </li>
          <li>
            <Link to="/best-sellers" className="block py-3 font-serif text-2xl">
              {t('nav.bestSellers')}
            </Link>
          </li>
          <li>
            <Link to="/offers" className="block py-3 font-serif text-2xl text-rose">
              {t('nav.offers')}
            </Link>
          </li>
        </ul>
        {categories.map((c) => (
          <AccordionItem key={c.slug} title={<span className="font-serif text-2xl font-normal">{l(c.name)}</span>}>
            <ul className="-mt-2 ps-1">
              <li>
                <Link to={`/category/${c.slug}`} className={`${linkCls} font-medium text-ink`}>
                  {t('nav.allCategory', { name: l(c.name) })}
                </Link>
              </li>
              {c.subcategories.map((s) => (
                <li key={s.slug}>
                  <Link to={`/category/${s.slug}`} className={linkCls}>
                    {l(s.name)}
                  </Link>
                </li>
              ))}
            </ul>
          </AccordionItem>
        ))}
        <Link to="/brands" className="block border-b border-line py-5 font-serif text-2xl">
          {t('nav.brands')}
        </Link>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <Link to={user ? '/account' : '/login'} className="flex h-12 items-center gap-2 rounded-xs bg-white px-4 text-sm font-medium">
            <User className="size-4" aria-hidden /> {user ? t('common.account') : t('common.signIn')}
          </Link>
          <Link to="/account/orders" className="flex h-12 items-center gap-2 rounded-xs bg-white px-4 text-sm font-medium">
            <Package className="size-4" aria-hidden /> {t('common.orders')}
          </Link>
          <Link to="/account/wishlist" className="flex h-12 items-center gap-2 rounded-xs bg-white px-4 text-sm font-medium">
            <Heart className="size-4" aria-hidden /> {t('common.wishlist')}
          </Link>
          <button type="button" onClick={toggleLang} className="flex h-12 items-center gap-2 rounded-xs bg-white px-4 text-sm font-medium">
            <Globe className="size-4" aria-hidden /> {t('common.switchLanguage')}
          </button>
        </div>
        <a href={whatsappLink()} target="_blank" rel="noreferrer" className="mt-2 flex h-12 items-center justify-center gap-2 rounded-xs bg-success text-sm font-medium text-white">
          <MessageCircle className="size-4" aria-hidden /> {t('common.whatsappChat')}
        </a>
      </nav>
    </Drawer>
  )
}

/** Full-screen mobile search overlay */
export function MobileSearch() {
  const open = useUIStore((s) => s.searchOpen)
  const setOpen = useUIStore((s) => s.setSearchOpen)
  const { t } = useT()
  const location = useLocation()
  useLockBodyScroll(open)
  useEscape(() => setOpen(false), open)
  useEffect(() => setOpen(false), [location.pathname, location.search, setOpen])
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[75] animate-fade-in bg-ivory" role="dialog" aria-modal="true" aria-label={t('common.search')}>
      <div className="container-x pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="mb-4 flex items-center justify-between">
          <p className="font-serif text-2xl">{t('nav.searchTitle')}</p>
          <button type="button" onClick={() => setOpen(false)} aria-label={t('common.close')} className="grid size-11 place-items-center rounded-full hover:bg-blush">
            <X className="size-5" />
          </button>
        </div>
        <SearchBox variant="overlay" autoFocus onNavigate={() => setOpen(false)} />
      </div>
    </div>,
    document.body,
  )
}
