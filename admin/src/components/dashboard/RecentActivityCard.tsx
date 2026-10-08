import type { ReactNode } from 'react'
import { ArrowRight, Boxes, FileText, FolderTree, Image, LogIn, Megaphone, Package, RotateCcw, Settings, ShoppingBag, Star, Tag, Ticket, Gift, UserRound, LayoutTemplate } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, EmptyState, ErrorState, Skeleton } from '@/components/ui'
import { useAsync } from '@/hooks'
import { useT } from '@/i18n'
import { getRecentActivity } from '@/services/systemService'
import type { ActivityEntity } from '@/types'
import { cn, timeAgo } from '@/utils'

const ENTITY_ICON: Record<ActivityEntity, ReactNode> = {
  product: <Package />,
  order: <ShoppingBag />,
  customer: <UserRound />,
  brand: <Tag />,
  category: <FolderTree />,
  coupon: <Ticket />,
  campaign: <Megaphone />,
  offer: <Gift />,
  banner: <Image />,
  review: <Star />,
  return: <RotateCcw />,
  inventory: <Boxes />,
  settings: <Settings />,
  session: <LogIn />,
  content: <LayoutTemplate />,
}

export function RecentActivityCard({ className }: { className?: string }) {
  const { t, lang } = useT()
  const { data, loading, error, reload } = useAsync(() => getRecentActivity(8), [])

  return (
    <Card
      className={className}
      title={t('dashboard.activity.title')}
      description={t('dashboard.activity.description')}
      actions={
        <Link to="/activity" className="inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-[13px] font-medium text-ink hover:bg-mist">
          {t('common.viewAll')}
          <ArrowRight className="size-3.5 rtl:-scale-x-100" aria-hidden />
        </Link>
      }
    >
      {error ? (
        <ErrorState onRetry={reload} className="py-8" />
      ) : loading && !data ? (
        <div className="space-y-4">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="size-8 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-4/5" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : !data?.length ? (
        <EmptyState icon={<FileText />} title={t('dashboard.activity.empty')} className="py-8" />
      ) : (
        <ol className="relative">
          {data.map((a, i) => (
            <li key={a.id} className="relative flex gap-3 pb-4 last:pb-0">
              {i < data.length - 1 && <span aria-hidden className="absolute start-[15px] top-9 bottom-1 w-px bg-line" />}
              <span
                className={cn(
                  'relative z-10 grid size-8 shrink-0 place-items-center rounded-full border [&>svg]:size-3.5',
                  a.status === 'failed' ? 'border-error/20 bg-error-soft text-error' : a.entity === 'order' ? 'border-rose/20 bg-rose-soft text-rose-dark' : 'border-line bg-mist text-ink',
                )}
              >
                {ENTITY_ICON[a.entity] ?? <FileText />}
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-[13px] leading-snug text-ink">{a.description}</p>
                <p className="mt-0.5 text-xs text-muted">
                  <span className="font-medium text-ink/80">{a.userName}</span>
                  <span aria-hidden> · </span>
                  <time dateTime={a.date}>{timeAgo(a.date, lang)}</time>
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}
