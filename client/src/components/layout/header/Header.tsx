import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ChevronRight, Globe, Heart, Menu, Search, ShoppingBag, User } from 'lucide-react'
import { IconButton, Logo, SmartImage } from '@/components/common'
import { SearchBox } from '@/components/search/SearchBox'
import { brands } from '@/data/brands'
import { categories } from '@/data/categories'
import { announcementMessages, mainNav } from '@/data/navigation'
import { useScrolled } from '@/hooks'
import { useT } from '@/i18n'
import { useAuthStore } from '@/store/auth'
import { useCartStore } from '@/store/cart'
import { useUIStore } from '@/store/ui'
import { useWishlistStore } from '@/store/wishlist'
import { cn } from '@/utils'

/* ---------------- Announcement bar (rotating) ---------------- */

export function AnnouncementBar() {
  const { l } = useT()
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % announcementMessages.length), 4500)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="bg-ink text-ivory" role="region" aria-label="Announcements">
      <div className="container-x flex h-9 items-center justify-center overflow-hidden text-center text-[11.5px] tracking-[0.06em]">
        <p key={i} className="animate-slide-down truncate" aria-live="polite">
          {l(announcementMessages[i])}
        </p>
      </div>
    </div>
  )
}

/* ---------------- Count badge with bump animation ---------------- */

function CountBadge({ count, bumpKey }: { count: number; bumpKey?: number }) {
  if (!count) return null
  return (
    <span key={bumpKey} className="absolute -end-0.5 -top-0.5 grid h-[18px] min-w-[18px] animate-badge-bump place-items-center rounded-full bg-rose px-1 text-[10px] font-semibold text-white tabular-nums">
      {count > 99 ? '99+' : count}
    </span>
  )
}

/* ---------------- Mega menu panel ---------------- */

function MegaMenu({ slug, onClose }: { slug: string; onClose: () => void }) {
  const { t, l } = useT()
  const category = categories.find((c) => c.slug === slug)
  if (!category) return null
  const topBrands = brands.filter((b) => b.isFeatured).slice(0, 6)
  return (
    <div className="absolute inset-x-0 top-full z-40 animate-slide-down border-t border-line bg-ivory shadow-lift" onMouseLeave={onClose}>
      <div className="container-x grid grid-cols-12 gap-10 py-10">
        <div className="col-span-3">
          <p className="eyebrow mb-4">{l(category.name)}</p>
          <ul className="space-y-1">
            {category.subcategories.map((s) => (
              <li key={s.slug}>
                <Link to={`/category/${s.slug}`} onClick={onClose} className="group flex items-center justify-between py-1.5 font-serif text-xl tracking-[-0.01em] text-ink transition-colors hover:text-rose">
                  {l(s.name)}
                  <ChevronRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100 rtl:-scale-x-100" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
          <Link to={`/category/${category.slug}`} onClick={onClose} className="mt-5 inline-block text-sm font-medium text-ink underline underline-offset-4 hover:text-rose">
            {t('nav.allCategory', { name: l(category.name) })}
          </Link>
        </div>
        <div className="col-span-3">
          <p className="eyebrow mb-4 text-muted">{t('nav.shopByBrand')}</p>
          <ul className="space-y-2.5">
            {topBrands.map((b) => (
              <li key={b.id}>
                <Link to={`/brand/${b.slug}`} onClick={onClose} className="text-[15px] text-ink/80 transition-colors hover:text-rose">
                  {b.name}
                </Link>
              </li>
            ))}
          </ul>
          <Link to="/brands" onClick={onClose} className="mt-5 inline-block text-sm font-medium text-ink underline underline-offset-4 hover:text-rose">
            {t('common.exploreBrands')}
          </Link>
        </div>
        <div className="col-span-6 grid grid-cols-2 gap-4">
          {category.subcategories.slice(0, 2).map((s) => (
            <Link key={s.slug} to={`/category/${s.slug}`} onClick={onClose} className="group relative overflow-hidden rounded-xs">
              <SmartImage src={s.image ?? category.image} alt={l(s.name)} width={600} height={420} wrapperClassName="aspect-[10/7]" className="transition-transform duration-700 group-hover:scale-105" />
              <span className="absolute inset-0 bg-linear-to-t from-ink/60 to-transparent to-55%" />
              <span className="absolute bottom-4 start-4 font-serif text-2xl text-white">{l(s.name)}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---------------- Header ---------------- */

export function Header() {
  const { t, l } = useT()
  const scrolled = useScrolled(40)
  const location = useLocation()
  const [mega, setMega] = useState<string | null>(null)
  const closeTimer = useRef<number | undefined>(undefined)
  const toggleLang = useUIStore((s) => s.toggleLang)
  const setCartOpen = useUIStore((s) => s.setCartOpen)
  const setSearchOpen = useUIStore((s) => s.setSearchOpen)
  const setMobileMenuOpen = useUIStore((s) => s.setMobileMenuOpen)
  const cartCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0))
  const lastAddedAt = useCartStore((s) => s.lastAddedAt)
  const wishCount = useWishlistStore((s) => s.ids.length)
  const user = useAuthStore((s) => s.user)

  useEffect(() => setMega(null), [location.pathname])

  const openMega = (slug?: string) => {
    window.clearTimeout(closeTimer.current)
    setMega(slug ?? null)
  }
  const scheduleClose = () => {
    closeTimer.current = window.setTimeout(() => setMega(null), 150)
  }

  return (
    <header className={cn('sticky top-0 z-50 transition-all duration-300', scrolled ? 'border-b border-line/80 bg-ivory/85 shadow-[0_8px_30px_-20px_rgb(42_30_34/0.35)] backdrop-blur-xl' : 'bg-ivory/95 backdrop-blur')}>
      <div className={cn('container-x flex items-center gap-3 transition-[height] duration-300 lg:gap-8', scrolled ? 'h-16' : 'h-[72px] lg:h-20')}>
        {/* Mobile: menu */}
        <IconButton label={t('common.menu')} onClick={() => setMobileMenuOpen(true)} className="-ms-2 lg:hidden">
          <Menu className="size-5" />
        </IconButton>

        <Logo className="max-lg:absolute max-lg:inset-x-0 max-lg:mx-auto max-lg:w-fit" />

        <SearchBox className="mx-auto hidden max-w-xl flex-1 lg:block" />

        <div className="ms-auto flex items-center gap-0.5 lg:ms-0">
          <IconButton label={t('common.search')} onClick={() => setSearchOpen(true)} className="lg:hidden">
            <Search className="size-5" />
          </IconButton>
          <button type="button" onClick={toggleLang} className="hidden h-11 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-ink transition-colors hover:bg-blush/70 lg:inline-flex" aria-label={t('common.language')}>
            <Globe className="size-4" aria-hidden />
            {t('common.switchLanguage')}
          </button>
          <Link to={user ? '/account' : '/login'} className="relative hidden size-11 place-items-center rounded-full text-ink transition-colors hover:bg-blush/70 lg:grid" aria-label={t('common.account')} title={user?.name ?? t('common.signIn')}>
            <User className="size-5" />
            {user && <span className="absolute end-2 top-2 size-2 rounded-full bg-success ring-2 ring-ivory" aria-hidden />}
          </Link>
          <Link to="/account/wishlist" className="relative grid size-11 place-items-center rounded-full text-ink transition-colors hover:bg-blush/70" aria-label={`${t('common.wishlist')} (${wishCount})`}>
            <Heart className="size-5" />
            <CountBadge count={wishCount} />
          </Link>
          <IconButton label={`${t('cart.title')} (${cartCount})`} onClick={() => setCartOpen(true)} className="-me-2 lg:me-0">
            <ShoppingBag className="size-5" />
            <CountBadge count={cartCount} bumpKey={lastAddedAt} />
          </IconButton>
        </div>
      </div>

      {/* Desktop navigation */}
      <nav aria-label="Main" className="relative hidden border-t border-line/70 lg:block" onMouseLeave={scheduleClose}>
        <ul className="container-x flex h-12 items-center justify-center gap-9">
          {mainNav.map((item) => (
            <li key={item.href} onMouseEnter={() => openMega(item.megaCategory)} className="h-full">
              <NavLink
                to={item.href}
                onFocus={() => openMega(item.megaCategory)}
                aria-haspopup={item.megaCategory ? 'true' : undefined}
                aria-expanded={item.megaCategory ? mega === item.megaCategory : undefined}
                className={({ isActive }) =>
                  cn(
                    'relative flex h-full items-center text-[12.5px] font-medium tracking-[0.12em] uppercase transition-colors',
                    item.accent ? 'text-rose hover:text-rose-dark' : 'text-ink hover:text-rose',
                    'after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:origin-center after:scale-x-0 after:bg-current after:transition-transform after:duration-300',
                    (isActive || mega === item.megaCategory) && item.megaCategory && 'after:scale-x-100',
                    isActive && 'after:scale-x-100',
                  )
                }
              >
                {l(item.label)}
              </NavLink>
            </li>
          ))}
        </ul>
        {mega && (
          <div onMouseEnter={() => openMega(mega)}>
            <MegaMenu slug={mega} onClose={() => setMega(null)} />
          </div>
        )}
      </nav>
    </header>
  )
}
