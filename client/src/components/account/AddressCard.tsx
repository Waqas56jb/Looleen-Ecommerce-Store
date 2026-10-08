import { MapPin, Pencil, Star, Trash2 } from 'lucide-react'
import { Badge } from '@/components/common'
import { useT } from '@/i18n'
import type { Address } from '@/types'
import { cn } from '@/utils'
import { AddressLines } from './AddressForm'

interface AddressCardProps {
  address: Address
  onEdit?: () => void
  onDelete?: () => void
  onSetDefault?: () => void
  className?: string
}

export function AddressCard({ address, onEdit, onDelete, onSetDefault, className }: AddressCardProps) {
  const { t } = useT()
  const actionCls = 'inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors'
  return (
    <article className={cn('flex h-full flex-col rounded-xs border bg-white p-5 transition-shadow hover:shadow-soft', address.isDefault ? 'border-ink/70' : 'border-line', className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex min-w-0 items-center gap-2 text-sm font-semibold tracking-wide text-ink uppercase">
          <MapPin className="size-4 shrink-0 text-rose" aria-hidden />
          <span className="truncate">{address.label || t('account.addresses.untitled')}</span>
        </h3>
        {address.isDefault && <Badge tone="ink">{t('account.addresses.default')}</Badge>}
      </div>
      <AddressLines address={address} className="flex-1 text-sm leading-relaxed text-muted not-italic" />
      {(onEdit || onDelete || onSetDefault) && (
        <div className="-mx-3 mt-4 flex flex-wrap items-center gap-1 border-t border-line pt-3">
          {onEdit && (
            <button type="button" onClick={onEdit} className={cn(actionCls, 'text-ink hover:bg-mist')}>
              <Pencil className="size-3.5" aria-hidden />
              {t('common.edit')}
            </button>
          )}
          {onDelete && (
            <button type="button" onClick={onDelete} className={cn(actionCls, 'text-ink hover:bg-error/5 hover:text-error')}>
              <Trash2 className="size-3.5" aria-hidden />
              {t('common.delete')}
            </button>
          )}
          {onSetDefault && !address.isDefault && (
            <button type="button" onClick={onSetDefault} className={cn(actionCls, 'ms-auto text-rose hover:bg-rose-soft')}>
              <Star className="size-3.5" aria-hidden />
              {t('account.addresses.setDefault')}
            </button>
          )}
        </div>
      )}
    </article>
  )
}
