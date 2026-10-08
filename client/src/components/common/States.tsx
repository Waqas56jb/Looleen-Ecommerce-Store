import type { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { useT } from '@/i18n'
import { cn } from '@/utils'
import { Button, ButtonLink } from './Button'

interface EmptyStateProps {
  icon: ReactNode
  title: ReactNode
  description?: ReactNode
  action?: { label: string; to?: string; onClick?: () => void }
  className?: string
  compact?: boolean
}

export function EmptyState({ icon, title, description, action, className, compact }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center text-center animate-fade-up', compact ? 'py-10' : 'py-16 sm:py-24', className)}>
      <div className="mb-6 grid size-20 place-items-center rounded-full bg-blush text-rose [&>svg]:size-8 [&>svg]:stroke-[1.4]">{icon}</div>
      <h2 className="font-serif text-2xl font-medium tracking-[-0.02em] sm:text-3xl">{title}</h2>
      {description && <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-muted">{description}</p>}
      {action &&
        (action.to ? (
          <ButtonLink to={action.to} className="mt-8" variant="dark">
            {action.label}
          </ButtonLink>
        ) : (
          <Button onClick={action.onClick} className="mt-8" variant="dark">
            {action.label}
          </Button>
        ))}
    </div>
  )
}

export function ErrorState({ onRetry, className }: { onRetry?: () => void; className?: string }) {
  const { t } = useT()
  return (
    <EmptyState
      className={className}
      icon={<AlertCircle />}
      title={t('common.somethingWrong')}
      description={t('common.somethingWrongDesc')}
      action={onRetry ? { label: t('common.tryAgain'), onClick: onRetry } : undefined}
    />
  )
}

/* ---------------- Skeletons ---------------- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden />
}

export function ProductCardSkeleton() {
  return (
    <div aria-hidden>
      <Skeleton className="aspect-[4/5] w-full" />
      <Skeleton className="mt-4 h-3 w-1/3" />
      <Skeleton className="mt-2.5 h-4 w-4/5" />
      <Skeleton className="mt-2 h-4 w-1/2" />
      <Skeleton className="mt-3 h-4 w-1/4" />
    </div>
  )
}

export function ProductGridSkeleton({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6', className)} role="status" aria-label="Loading products">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function ProductPageSkeleton() {
  return (
    <div className="container-x grid grid-cols-1 gap-10 py-8 lg:grid-cols-2 lg:gap-16 lg:py-12" role="status" aria-label="Loading product">
      <Skeleton className="aspect-square w-full" />
      <div className="space-y-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-4/5" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
    </div>
  )
}

export function CategorySkeleton() {
  return (
    <div className="container-x py-10" role="status" aria-label="Loading">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="mt-4 h-12 w-72" />
      <Skeleton className="mt-4 h-4 w-96 max-w-full" />
      <ProductGridSkeleton className="mt-10" />
    </div>
  )
}

export function BrandSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" role="status" aria-label="Loading brands">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-28" />
      ))}
    </div>
  )
}
