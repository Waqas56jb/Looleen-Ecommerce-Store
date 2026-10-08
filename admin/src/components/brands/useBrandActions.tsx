import { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ui'
import { useT } from '@/i18n'
import { deleteBrand, updateBrand, type BrandRow } from '@/services/catalogService'
import { formatNumber } from '@/utils'

/** Toggle featured / status and confirm-delete for a brand, with toasts */
export function useBrandActions({ onChanged, onDeleted }: { onChanged: () => void; onDeleted?: () => void }) {
  const { t } = useT()
  const [toDelete, setToDelete] = useState<BrandRow | null>(null)

  const toggleFeatured = async (b: BrandRow) => {
    try {
      await updateBrand(b.id, { featured: !b.featured })
      toast.success(t(b.featured ? 'catalog.brands.unfeaturedToast' : 'catalog.brands.featuredToast', { name: b.name }))
      onChanged()
    } catch {
      toast.error(t('common.errorDesc'))
    }
  }

  const toggleStatus = async (b: BrandRow) => {
    const next = b.status === 'active' ? 'inactive' : 'active'
    try {
      await updateBrand(b.id, { status: next })
      toast.success(t(next === 'active' ? 'catalog.brands.activatedToast' : 'catalog.brands.deactivatedToast', { name: b.name }))
      onChanged()
    } catch {
      toast.error(t('common.errorDesc'))
    }
  }

  const confirm = async () => {
    if (!toDelete) return
    const ok = await deleteBrand(toDelete.id)
    if (!ok) {
      toast.error(t('catalog.brands.deleteBlocked', { name: toDelete.name, count: formatNumber(toDelete.productCount) }))
      return
    }
    toast.success(t('catalog.brands.deleted', { name: toDelete.name }))
    onChanged()
    onDeleted?.()
  }

  const dialog = (
    <ConfirmDialog
      open={!!toDelete}
      onClose={() => setToDelete(null)}
      onConfirm={confirm}
      title={toDelete ? t('catalog.brands.deleteTitle', { name: toDelete.name }) : ''}
      description={t('catalog.brands.deleteDesc')}
      confirmLabel={t('common.delete')}
    />
  )

  return { toggleFeatured, toggleStatus, requestDelete: setToDelete, dialog }
}
