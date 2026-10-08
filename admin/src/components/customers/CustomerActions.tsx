import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, MoreHorizontal, Pencil, UserCheck, UserX } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog, Dropdown, IconButton } from '@/components/ui'
import { useT } from '@/i18n'
import { updateCustomer } from '@/services/customerService'
import type { AdminCustomer } from '@/types'
import { CustomerEditModal } from './CustomerEditModal'

/**
 * Edit modal + activate/deactivate confirm, shared by the list and detail pages.
 *   const actions = useCustomerActions(reload)
 *   actions.edit(c) · actions.toggleStatus(c) · {actions.dialogs}
 */
export function useCustomerActions(onChanged: () => void) {
  const { t } = useT()
  const [editing, setEditing] = useState<AdminCustomer | null>(null)
  const [toggling, setToggling] = useState<AdminCustomer | null>(null)

  const deactivate = toggling?.status === 'active'
  const confirmToggle = async () => {
    if (!toggling) return
    try {
      const next = deactivate ? 'inactive' : 'active'
      const updated = await updateCustomer(toggling.id, { status: next })
      toast.success(t(deactivate ? 'customers.status.deactivated' : 'customers.status.activated', { name: updated.name }))
      onChanged()
    } catch {
      toast.error(t('customers.edit.failed'))
    }
  }

  const dialogs = (
    <>
      {editing && <CustomerEditModal key={editing.id} customer={editing} onClose={() => setEditing(null)} onSaved={onChanged} />}
      <ConfirmDialog
        open={!!toggling}
        onClose={() => setToggling(null)}
        onConfirm={confirmToggle}
        tone={deactivate ? 'danger' : 'default'}
        title={toggling ? t(deactivate ? 'customers.status.deactivateTitle' : 'customers.status.activateTitle', { name: toggling.name }) : ''}
        description={t(deactivate ? 'customers.status.deactivateDesc' : 'customers.status.activateDesc')}
        confirmLabel={t(deactivate ? 'customers.actions.deactivate' : 'customers.actions.activate')}
      />
    </>
  )

  return { edit: setEditing, toggleStatus: setToggling, dialogs }
}

/** Row "⋯" menu for customer tables. */
export function CustomerRowMenu({ customer, onEdit, onToggle }: { customer: AdminCustomer; onEdit: () => void; onToggle: () => void }) {
  const { t } = useT()
  const navigate = useNavigate()
  const active = customer.status === 'active'
  return (
    <Dropdown
      trigger={({ toggle }) => (
        <IconButton label={t('customers.actions.more', { name: customer.name })} size="sm" onClick={toggle}>
          <MoreHorizontal />
        </IconButton>
      )}
      items={[
        { label: t('customers.actions.view'), icon: <Eye />, onClick: () => navigate(`/customers/${customer.id}`) },
        { label: t('customers.actions.edit'), icon: <Pencil />, onClick: onEdit },
        { divider: true, label: '' },
        active
          ? { label: t('customers.actions.deactivate'), icon: <UserX />, onClick: onToggle, danger: true }
          : { label: t('customers.actions.activate'), icon: <UserCheck />, onClick: onToggle },
      ]}
    />
  )
}
