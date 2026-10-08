import { BadgeCheck, BellRing, Camera, Flag, Leaf, Mail, MessageSquare, Moon, Music2, Scissors, Sparkles, Store, Tag, Zap } from 'lucide-react'
import type { ReactNode } from 'react'
import { useT } from '@/i18n'
import type { Campaign, CampaignStatus, CampaignType } from '@/types'
import { cn } from '@/utils'

export type Channel = Campaign['channels'][number]

export const CAMPAIGN_TYPES: CampaignType[] = ['flash_sale', 'seasonal', 'brand_promotion', 'new_collection', 'salon_professional', 'ramadan', 'national_day', 'white_friday']
export const CAMPAIGN_STATUSES: CampaignStatus[] = ['draft', 'scheduled', 'active', 'ended']
export const CHANNELS: Channel[] = ['email', 'sms', 'push', 'instagram', 'tiktok', 'onsite']

/** Subtle, distinct icon + tint per campaign type */
const TYPE_META: Record<CampaignType, { icon: ReactNode; cls: string }> = {
  flash_sale: { icon: <Zap />, cls: 'bg-warning-soft text-warning' },
  seasonal: { icon: <Leaf />, cls: 'bg-success-soft text-success' },
  brand_promotion: { icon: <BadgeCheck />, cls: 'bg-info-soft text-info' },
  new_collection: { icon: <Sparkles />, cls: 'bg-champagne-soft text-[#7a5a26]' },
  salon_professional: { icon: <Scissors />, cls: 'bg-mist text-ink' },
  ramadan: { icon: <Moon />, cls: 'bg-[#eceaf4] text-[#4f4a7a]' },
  national_day: { icon: <Flag />, cls: 'bg-success-soft text-[#1f6b45]' },
  white_friday: { icon: <Tag />, cls: 'bg-rose-soft text-rose-dark' },
}

export function CampaignTypeIcon({ type, className }: { type: CampaignType; className?: string }) {
  const m = TYPE_META[type]
  return (
    <span className={cn('grid size-9 shrink-0 place-items-center rounded-md [&>svg]:size-4', m.cls, className)} aria-hidden>
      {m.icon}
    </span>
  )
}

export function CampaignTypeLabel({ type }: { type: CampaignType }) {
  const { t } = useT()
  const m = TYPE_META[type]
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[13px]">
      <span className={cn('grid size-5 place-items-center rounded [&>svg]:size-3', m.cls)} aria-hidden>
        {m.icon}
      </span>
      {t(`marketing.shared.campaignTypes.${type}`)}
    </span>
  )
}

export const CHANNEL_ICONS: Record<Channel, ReactNode> = {
  email: <Mail />,
  sms: <MessageSquare />,
  push: <BellRing />,
  instagram: <Camera />,
  tiktok: <Music2 />,
  onsite: <Store />,
}

export function ChannelChips({ channels, max = 6 }: { channels: Channel[]; max?: number }) {
  const { t } = useT()
  const shown = channels.slice(0, max)
  return (
    <span className="flex flex-wrap gap-1">
      {shown.map((c) => (
        <span key={c} className="inline-flex h-[22px] items-center gap-1 rounded border border-line bg-mist px-1.5 text-[11px] font-medium whitespace-nowrap text-muted [&>svg]:size-3" title={t(`marketing.shared.channels.${c}`)}>
          {CHANNEL_ICONS[c]}
          {t(`marketing.shared.channels.${c}`)}
        </span>
      ))}
      {channels.length > max && <span className="text-[11px] text-subtle">+{channels.length - max}</span>}
    </span>
  )
}
