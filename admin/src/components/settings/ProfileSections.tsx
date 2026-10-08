import { useMemo, useState, type FormEvent } from 'react'
import { Check, KeyRound, Minus, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { PasswordInput, PasswordStrengthMeter, passwordStrength } from '@/components/auth/PasswordInput'
import { Avatar, Badge, Button, Card, DataTable, Input, StatusBadge, type Column } from '@/components/ui'
import { useAsync } from '@/hooks'
import { useT } from '@/i18n'
import { AuthError, changePassword, updateProfile } from '@/services/authService'
import { getAdmins } from '@/services/systemService'
import { useAuthStore } from '@/store/authStore'
import type { AdminRole, AdminUser, Permission } from '@/types'
import { cn, formatDateTime, isValidEmail, isValidSaudiPhone, isValidUrl, timeAgo } from '@/utils'
import { permissionsOf, ROLE_PERMISSIONS } from '@/utils/permissions'

export const ALL_ROLES: AdminRole[] = ['super_admin', 'store_manager', 'product_manager', 'order_manager', 'customer_support', 'content_manager', 'inventory_manager']
export const ALL_PERMISSIONS: Permission[] = ['dashboard', 'products', 'categories', 'brands', 'inventory', 'orders', 'returns', 'customers', 'reviews', 'marketing', 'content', 'reports', 'settings', 'activity']

/* ============================== Edit profile ============================== */

export function ProfileForm({ admin }: { admin: AdminUser }) {
  const { t } = useT()
  const initial = { name: admin.name, email: admin.email, phone: admin.phone, avatar: admin.avatar ?? '' }
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const dirty = JSON.stringify(form) !== JSON.stringify(initial)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = t('common.fieldRequired')
    if (!form.email.trim()) e.email = t('common.fieldRequired')
    else if (!isValidEmail(form.email)) e.email = t('common.invalidEmail')
    if (form.phone.trim() && !isValidSaudiPhone(form.phone)) e.phone = t('common.invalidPhone')
    if (form.avatar.trim() && !isValidUrl(form.avatar)) e.avatar = t('common.invalidUrl')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (ev: FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      await updateProfile({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), avatar: form.avatar.trim() || undefined })
      toast.success(t('system.profile.saved'))
      setAvatarOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card title={t('system.profile.details')} description={t('system.profile.detailsDesc')}>
      <form onSubmit={submit} noValidate className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar name={form.name || admin.name} src={form.avatar || undefined} size="xl" className="ring-4 ring-mist" />
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-ink">{form.name || admin.name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge tone="dark" icon={<ShieldCheck className="size-3" />}>
                {t(`roles.${admin.role}`)}
              </Badge>
              {admin.lastLoginAt && <span className="text-xs text-muted">{t('system.profile.lastLogin', { time: formatDateTime(admin.lastLoginAt) })}</span>}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="xs" variant="outline" onClick={() => setAvatarOpen((o) => !o)} aria-expanded={avatarOpen}>
                {t('system.profile.changeAvatar')}
              </Button>
              {form.avatar && (
                <Button size="xs" variant="ghost" onClick={() => setForm((f) => ({ ...f, avatar: '' }))}>
                  {t('system.profile.useInitials')}
                </Button>
              )}
            </div>
          </div>
        </div>
        {avatarOpen && (
          <Input
            label={t('system.profile.avatarUrl')}
            dir="ltr"
            className="text-start"
            placeholder="https://…"
            value={form.avatar}
            onChange={(e) => setForm((f) => ({ ...f, avatar: e.target.value }))}
            error={errors.avatar}
            hint={t('system.profile.avatarHint')}
            autoFocus
          />
        )}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input label={t('common.name')} required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} error={errors.name} autoComplete="name" />
          <Input label={t('common.email')} required type="email" dir="ltr" className="text-start" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} error={errors.email} autoComplete="email" />
          <Input label={t('common.phone')} type="tel" dir="ltr" className="text-start" placeholder="+966 5X XXX XXXX" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} error={errors.phone} autoComplete="tel" />
          <Input label={t('system.profile.role')} value={t(`roles.${admin.role}`)} readOnly disabled hint={t('system.profile.roleHint')} />
        </div>
        <div className="flex justify-end gap-2 border-t border-line-soft pt-4">
          <Button
            variant="outline"
            disabled={!dirty || saving}
            onClick={() => {
              setForm(initial)
              setErrors({})
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={saving} disabled={!dirty}>
            {t('common.saveChanges')}
          </Button>
        </div>
      </form>
    </Card>
  )
}

/* ============================== Change password ============================== */

export function ChangePasswordCard() {
  const { t } = useT()
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const submit = async (ev: FormEvent) => {
    ev.preventDefault()
    const e: Record<string, string> = {}
    if (!form.current) e.current = t('common.fieldRequired')
    if (!form.next) e.next = t('common.fieldRequired')
    else if (form.next.length < 8) e.next = t('auth.rules.length')
    else if (passwordStrength(form.next) < 2) e.next = t('system.password.tooWeak')
    else if (form.next === form.current) e.next = t('system.password.same')
    if (!form.confirm) e.confirm = t('common.fieldRequired')
    else if (form.confirm !== form.next) e.confirm = t('system.password.mismatch')
    setErrors(e)
    if (Object.keys(e).length) return
    setSaving(true)
    try {
      await changePassword(form.current, form.next)
      toast.success(t('system.password.changed'))
      setForm({ current: '', next: '', confirm: '' })
    } catch (err) {
      if (err instanceof AuthError && err.message === 'wrong_password') setErrors({ current: t('system.password.wrongCurrent') })
      else if (err instanceof AuthError && err.message === 'weak_password') setErrors({ next: t('system.password.tooWeak') })
      else toast.error(t('auth.errors.generic'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card title={t('system.password.title')} description={t('system.password.desc')} actions={<KeyRound className="size-4 text-subtle" aria-hidden />}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <PasswordInput label={t('system.password.current')} required autoComplete="current-password" value={form.current} onChange={(e) => setForm((f) => ({ ...f, current: e.target.value }))} error={errors.current} />
        <PasswordInput label={t('system.password.new')} required autoComplete="new-password" value={form.next} onChange={(e) => setForm((f) => ({ ...f, next: e.target.value }))} error={errors.next} />
        {form.next && <PasswordStrengthMeter password={form.next} />}
        <PasswordInput label={t('system.password.confirm')} required autoComplete="new-password" value={form.confirm} onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))} error={errors.confirm} />
        <Button type="submit" loading={saving} fullWidth>
          {t('system.password.submit')}
        </Button>
      </form>
    </Card>
  )
}

/* ============================== Permissions ============================== */

export function YourPermissionsCard({ role }: { role: AdminRole }) {
  const { t } = useT()
  const perms = permissionsOf(role)
  return (
    <Card title={t('system.permissions.yours')} description={t('system.permissions.yoursDesc', { role: t(`roles.${role}`) })}>
      <ul className="flex flex-wrap gap-1.5">
        {ALL_PERMISSIONS.map((p) => {
          const has = perms.includes(p)
          return (
            <li key={p}>
              <span className={cn('inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs font-medium', has ? 'border-success/20 bg-success-soft text-success' : 'border-line bg-mist text-subtle line-through decoration-subtle/50')}>
                {has ? <Check className="size-3" aria-hidden /> : <Minus className="size-3" aria-hidden />}
                {t(`system.permissions.names.${p}`)}
              </span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

export function RolesMatrix({ currentRole }: { currentRole: AdminRole }) {
  const { t } = useT()
  const has = (r: AdminRole, p: Permission) => {
    const v = ROLE_PERMISSIONS[r]
    return v === 'all' || v.includes(p)
  }
  return (
    <Card title={t('system.permissions.matrix')} description={t('system.permissions.matrixDesc')} padded={false}>
      <div className="thin-scrollbar overflow-x-auto border-t border-line-soft">
        <table className="w-full min-w-[860px] border-collapse text-[12.5px]">
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="sticky start-0 z-10 bg-surface px-4 py-2.5 text-start text-[11px] font-semibold tracking-wide text-muted uppercase">
                {t('system.permissions.role')}
              </th>
              {ALL_PERMISSIONS.map((p) => (
                <th key={p} scope="col" className="px-1.5 py-2.5 text-center text-[11px] font-semibold whitespace-nowrap text-muted">
                  {t(`system.permissions.names.${p}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL_ROLES.map((r) => (
              <tr key={r} className={cn('border-b border-line-soft last:border-0', r === currentRole && 'bg-rose-soft/40')}>
                <th scope="row" className={cn('sticky start-0 z-10 px-4 py-2.5 text-start font-medium whitespace-nowrap text-ink', r === currentRole ? 'bg-rose-soft' : 'bg-surface')}>
                  {t(`roles.${r}`)}
                  {r === currentRole && <span className="ms-2 text-[10.5px] font-semibold text-rose-dark">{t('system.permissions.you')}</span>}
                </th>
                {ALL_PERMISSIONS.map((p) => (
                  <td key={p} className="px-1.5 py-2.5 text-center">
                    {has(r, p) ? (
                      <Check className="mx-auto size-4 text-success" aria-label={t('common.yes')} />
                    ) : (
                      <span className="text-line" aria-label={t('common.no')}>
                        —
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

/* ============================== Team ============================== */

export function TeamCard() {
  const { t, lang } = useT()
  const me = useAuthStore((s) => s.admin)
  const { data, loading, error, reload } = useAsync(getAdmins, [])
  // Keep the signed-in admin's row live after a profile edit
  const rows = useMemo(() => data?.map((a) => (me && a.id === me.id ? { ...a, ...me } : a)), [data, me])

  const columns: Column<AdminUser>[] = [
    {
      id: 'name',
      header: t('common.name'),
      mobile: 'title',
      cell: (a) => (
        <span className="flex items-center gap-2.5">
          <Avatar name={a.name} src={a.avatar} size="sm" />
          <span className="min-w-0">
            <span className="block truncate font-medium text-ink">
              {a.name}
              {me?.id === a.id && <span className="ms-1.5 text-[11px] font-medium text-rose-dark">({t('system.permissions.you')})</span>}
            </span>
            <span dir="ltr" className="block truncate text-xs text-muted md:hidden">
              {a.email}
            </span>
          </span>
        </span>
      ),
    },
    {
      id: 'email',
      header: t('common.email'),
      mobile: 'hidden',
      cell: (a) => (
        <span dir="ltr" className="text-muted">
          {a.email}
        </span>
      ),
    },
    { id: 'role', header: t('system.profile.role'), mobile: 'meta', cell: (a) => <Badge tone={a.role === 'super_admin' ? 'dark' : 'neutral'}>{t(`roles.${a.role}`)}</Badge> },
    { id: 'status', header: t('common.status'), mobile: 'end', cell: (a) => <StatusBadge status={a.status} /> },
    {
      id: 'lastLogin',
      header: t('system.team.lastLogin'),
      mobile: 'meta',
      cell: (a) => (a.lastLoginAt ? <span title={formatDateTime(a.lastLoginAt, lang)}>{timeAgo(a.lastLoginAt, lang)}</span> : <span className="text-subtle">{t('system.team.never')}</span>),
    },
  ]

  return (
    <section>
      <div className="mb-3">
        <h2 className="text-[15px] font-semibold text-ink">{t('system.team.title')}</h2>
        <p className="text-[13px] text-muted">{t('system.team.desc', { count: rows?.length ?? 0 })}</p>
      </div>
      <DataTable columns={columns} rows={rows} rowKey={(a) => a.id} loading={loading} error={error} onRetry={reload} />
    </section>
  )
}
