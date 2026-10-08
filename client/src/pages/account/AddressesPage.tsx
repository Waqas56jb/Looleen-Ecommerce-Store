import { useState } from 'react'
import { MapPin, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { AccountPageHeader } from '@/components/account/AccountUI'
import { AddressCard } from '@/components/account/AddressCard'
import { AddressForm, type AddressInput } from '@/components/account/AddressForm'
import { Button, EmptyState, Modal } from '@/components/common'
import { useDocumentMeta } from '@/hooks'
import { useT } from '@/i18n'
import { useAccountStore } from '@/store/account'
import type { Address } from '@/types'

export default function AddressesPage() {
  const { t } = useT()
  useDocumentMeta(t('account.addresses.metaTitle'), t('account.addresses.metaDesc'))
  const addresses = useAccountStore((s) => s.addresses)
  const saveAddress = useAccountStore((s) => s.saveAddress)
  const deleteAddress = useAccountStore((s) => s.deleteAddress)
  const setDefaultAddress = useAccountStore((s) => s.setDefaultAddress)

  const [editing, setEditing] = useState<Address | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Address | null>(null)
  const [saving, setSaving] = useState(false)

  const onSubmit = async (v: AddressInput) => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 300))
    const current = editing && editing !== 'new' ? editing : null
    saveAddress({ ...v, id: current?.id, label: v.label?.trim() || t('account.addresses.untitled'), isDefault: !!v.isDefault || !!current?.isDefault })
    setSaving(false)
    setEditing(null)
    toast.success(t('toast.addressSaved'))
  }

  const confirmDelete = () => {
    if (!deleting) return
    deleteAddress(deleting.id)
    setDeleting(null)
    toast(t('toast.addressDeleted'))
  }

  const addBtn = (
    <Button variant="dark" onClick={() => setEditing('new')} icon={<Plus className="size-4" />}>
      {t('account.addresses.add')}
    </Button>
  )

  return (
    <div>
      <AccountPageHeader title={t('account.addresses.title')} description={t('account.addresses.desc')} action={addresses.length > 0 && addBtn} />

      {addresses.length === 0 ? (
        <div className="rounded-xs border border-line bg-white">
          <EmptyState icon={<MapPin />} title={t('empty.addressesTitle')} description={t('empty.addressesDesc')} action={{ label: t('account.addresses.add'), onClick: () => setEditing('new') }} />
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {addresses.map((a) => (
            <li key={a.id}>
              <AddressCard
                address={a}
                onEdit={() => setEditing(a)}
                onDelete={() => setDeleting(a)}
                onSetDefault={() => {
                  setDefaultAddress(a.id)
                  toast.success(t('account.addresses.defaultSet'))
                }}
              />
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setEditing('new')}
              className="flex h-full min-h-48 w-full flex-col items-center justify-center gap-3 rounded-xs border border-dashed border-ink/25 bg-white/50 p-5 text-sm font-medium text-ink transition-colors hover:border-ink hover:bg-white"
            >
              <span className="grid size-11 place-items-center rounded-full bg-blush text-rose">
                <Plus className="size-5" aria-hidden />
              </span>
              {t('account.addresses.add')}
            </button>
          </li>
        </ul>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? t('account.addresses.add') : t('account.addresses.edit')} size="lg">
        {editing !== null && (
          <AddressForm
            key={editing === 'new' ? 'new' : editing.id}
            showMeta
            initial={editing === 'new' ? { isDefault: addresses.length === 0 } : editing}
            onSubmit={onSubmit}
            onCancel={() => setEditing(null)}
            loading={saving}
          />
        )}
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title={t('account.addresses.deleteTitle')} size="sm">
        <p className="text-[15px] leading-relaxed text-muted">{t('account.addresses.deleteBody', { label: deleting?.label ?? '' })}</p>
        <div className="mt-6 flex gap-3">
          <Button variant="dark" onClick={confirmDelete} className="flex-1 bg-error hover:bg-error/90">
            {t('common.delete')}
          </Button>
          <Button variant="ghost" onClick={() => setDeleting(null)}>
            {t('common.cancel')}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
