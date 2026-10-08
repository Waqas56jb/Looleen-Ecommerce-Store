import { ShieldCheck, ShieldOff } from 'lucide-react'
import { Badge, Img } from '@/components/ui'
import { useT } from '@/i18n'
import { cn } from '@/utils'

export const COUNTRIES = ['France', 'USA', 'UK', 'Italy', 'Germany', 'South Korea', 'Japan', 'Spain', 'Switzerland', 'UAE', 'Saudi Arabia', 'Sweden', 'Australia', 'Canada', 'Israel']

export const STOREFRONT_URL = 'http://localhost:5173'

/** Localized country name (falls back to the stored English value) */
export function useCountryName() {
  const { t } = useT()
  return (country: string) => {
    if (!country) return ''
    const key = `catalog.countries.${country}`
    const v = t(key)
    return v === key ? country : v
  }
}

const PALETTES = [
  'bg-ink text-white',
  'bg-blush text-rose-dark',
  'bg-champagne-soft text-[#7a5a26]',
  'bg-mist text-ink',
  'bg-[#efe6e8] text-ink',
]

function monogram(name: string) {
  const words = name.replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean)
  if (words.length === 0) return '·'
  if (words.length === 1) return words[0].slice(0, words[0].length <= 4 ? words[0].length : 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

function hash(s: string) {
  let h = 0
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h
}

const SIZES = {
  sm: 'size-10 text-[11px] rounded-md',
  md: 'size-12 text-sm rounded-md',
  lg: 'size-20 text-xl rounded-lg',
  xl: 'size-24 text-2xl rounded-xl',
}

/** Brand logo image, or a refined serif monogram tile derived from the name */
export function BrandLogo({ name, logo, size = 'sm', className }: { name: string; logo?: string; size?: keyof typeof SIZES; className?: string }) {
  if (logo)
    return (
      <span className={cn('inline-grid shrink-0 place-items-center overflow-hidden border border-line-soft bg-white', SIZES[size], className)}>
        <Img src={logo} alt={name} w={200} className="size-full object-contain p-1" key={logo} />
      </span>
    )
  return (
    <span
      role="img"
      aria-label={name}
      className={cn('inline-grid shrink-0 place-items-center border border-black/5 font-serif font-semibold tracking-[0.08em] select-none', PALETTES[hash(name || '?') % PALETTES.length], SIZES[size], className)}
      dir="ltr"
    >
      {monogram(name || '?')}
    </span>
  )
}

export function AuthorizedBadge({ authorized, className }: { authorized: boolean; className?: string }) {
  const { t } = useT()
  return authorized ? (
    <Badge tone="success" icon={<ShieldCheck />} className={className}>
      {t('common.authorizedDistributor')}
    </Badge>
  ) : (
    <Badge tone="neutral" icon={<ShieldOff />} className={className}>
      {t('common.notAuthorized')}
    </Badge>
  )
}
