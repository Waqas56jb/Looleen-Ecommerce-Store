import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ui'
import { useT } from '@/i18n'
import { bulkUpdateProducts, deleteProduct, duplicateProduct, updateProduct } from '@/services/productService'
import type { AdminProduct } from '@/types'

type Target = Pick<AdminProduct, 'id' | 'name' | 'status' | 'flags'>
type ConfirmKind = 'delete' | 'archive' | 'activate'

/**
 * Single-product mutations shared by the list and detail pages.
 * Destructive actions are confirmed; render `dialog` once in the page.
 */
export function useProductActions({ onChanged, onDeleted }: { onChanged?: () => void; onDeleted?: () => void } = {}) {
  const { t } = useT()
  const navigate = useNavigate()
  const [pending, setPending] = useState<{ kind: ConfirmKind; product: Target } | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const fail = () => toast.error(t('products.toast.failed'))

  const duplicate = async (p: Target) => {
    setBusyId(p.id)
    try {
      const copy = await duplicateProduct(p.id)
      toast.success(t('products.toast.duplicated'), { description: copy.name })
      navigate(`/products/${copy.id}/edit`)
    } catch {
      fail()
    } finally {
      setBusyId(null)
    }
  }

  const toggleFeatured = async (p: Target) => {
    setBusyId(p.id)
    try {
      const on = !p.flags.featured
      await bulkUpdateProducts([p.id], on ? 'feature' : 'unfeature')
      toast.success(t(on ? 'products.toast.featuredOn' : 'products.toast.featuredOff', { name: p.name }))
      onChanged?.()
    } catch {
      fail()
    } finally {
      setBusyId(null)
    }
  }

  const run = async () => {
    if (!pending) return
    const { kind, product } = pending
    try {
      if (kind === 'delete') {
        await deleteProduct(product.id)
        toast.success(t('products.toast.deleted', { name: product.name }))
        if (onDeleted) onDeleted()
        else onChanged?.()
        return
      }
      await updateProduct(product.id, { status: kind === 'archive' ? 'archived' : 'active' })
      toast.success(t(kind === 'archive' ? 'products.toast.archived' : 'products.toast.activated', { name: product.name }))
      onChanged?.()
    } catch {
      fail()
    }
  }

  const copy = pending
    ? {
        delete: { title: t('products.confirm.deleteTitle'), desc: t('products.confirm.deleteDesc', { name: pending.product.name }), label: t('products.actions.delete'), tone: 'danger' as const },
        archive: { title: t('products.confirm.archiveTitle'), desc: t('products.confirm.archiveDesc', { name: pending.product.name }), label: t('products.actions.archive'), tone: 'danger' as const },
        activate: { title: t('products.confirm.activateTitle'), desc: t('products.confirm.activateDesc', { name: pending.product.name }), label: t('products.actions.activate'), tone: 'default' as const },
      }[pending.kind]
    : null

  const dialog = (
    <ConfirmDialog
      open={!!pending}
      onClose={() => setPending(null)}
      onConfirm={run}
      title={copy?.title ?? ''}
      description={copy?.desc}
      confirmLabel={copy?.label}
      tone={copy?.tone ?? 'danger'}
    />
  )

  return {
    busyId,
    duplicate,
    toggleFeatured,
    confirmDelete: (p: Target) => setPending({ kind: 'delete', product: p }),
    confirmArchive: (p: Target) => setPending({ kind: 'archive', product: p }),
    confirmActivate: (p: Target) => setPending({ kind: 'activate', product: p }),
    dialog,
  }
}
