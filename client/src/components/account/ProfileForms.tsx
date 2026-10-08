import { useState, type FormEvent } from 'react'
import { BadgeCheck, Check, Eye, EyeOff, Scissors } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Input, Select } from '@/components/common'
import { useT } from '@/i18n'
import { updateProfile } from '@/services/authService'
import type { User } from '@/types'
import { isValidEmail, isValidSaudiPhone, normalizeSaudiPhone } from '@/utils'
import { Panel } from './AccountUI'

type Details = { name: string; email: string; phone: string; gender: NonNullable<User['gender']>; dateOfBirth: string }

export function ProfileDetailsForm({ user }: { user: User }) {
  const { t } = useT()
  const [v, setV] = useState<Details>({ name: user.name, email: user.email, phone: user.phone, gender: user.gender ?? '', dateOfBirth: user.dateOfBirth ?? '' })
  const [errors, setErrors] = useState<Partial<Record<keyof Details, string>>>({})
  const [loading, setLoading] = useState(false)
  const set = <K extends keyof Details>(k: K, val: Details[K]) => {
    setV((s) => ({ ...s, [k]: val }))
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (v.name.trim().length < 3 || !v.name.trim().includes(' ')) next.name = t('account.profile.nameMin')
    if (!isValidEmail(v.email)) next.email = t('common.invalidEmail')
    if (!isValidSaudiPhone(v.phone)) next.phone = t('common.invalidPhone')
    setErrors(next)
    if (Object.keys(next).length) return
    setLoading(true)
    await updateProfile({ name: v.name.trim(), email: v.email.trim(), phone: normalizeSaudiPhone(v.phone), gender: v.gender, dateOfBirth: v.dateOfBirth || undefined })
    setV((s) => ({ ...s, phone: normalizeSaudiPhone(s.phone) }))
    setLoading(false)
    toast.success(t('toast.profileUpdated'))
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <Panel title={t('account.profile.personal')}>
      <form noValidate onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label={t('account.profile.name')} autoComplete="name" value={v.name} onChange={(e) => set('name', e.target.value)} error={errors.name} wrapperClassName="sm:col-span-2" />
        <Input label={t('account.profile.email')} type="email" autoComplete="email" dir="ltr" value={v.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />
        <Input label={t('account.profile.phone')} type="tel" inputMode="tel" autoComplete="tel" dir="ltr" placeholder="+966 5X XXX XXXX" value={v.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone} />
        <Select
          label={
            <>
              {t('account.profile.gender')} <span className="text-xs font-normal text-muted">({t('common.optional')})</span>
            </>
          }
          value={v.gender}
          onChange={(e) => set('gender', e.target.value as Details['gender'])}
          options={[
            { value: '', label: t('account.profile.genderNone') },
            { value: 'female', label: t('account.profile.genderFemale') },
            { value: 'male', label: t('account.profile.genderMale') },
          ]}
        />
        <Input label={t('account.profile.dob')} optional optionalLabel={t('common.optional')} type="date" max={today} value={v.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} hint={t('account.profile.dobHint')} />
        <div className="mt-2 sm:col-span-2">
          <Button type="submit" variant="dark" size="lg" loading={loading} className="w-full sm:w-auto">
            {t('common.saveChanges')}
          </Button>
        </div>
      </form>
    </Panel>
  )
}

function PasswordInput({ label, value, onChange, error, autoComplete }: { label: string; value: string; onChange: (v: string) => void; error?: string; autoComplete: string }) {
  const { t } = useT()
  const [show, setShow] = useState(false)
  return (
    <Input
      label={label}
      type={show ? 'text' : 'password'}
      autoComplete={autoComplete}
      dir="ltr"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={error}
      trailing={
        <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? t('account.profile.hide') : t('account.profile.show')} className="grid size-9 place-items-center rounded-full text-muted hover:text-ink">
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      }
    />
  )
}

export function PasswordForm() {
  const { t } = useT()
  const [v, setV] = useState({ current: '', next: '', confirm: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof typeof v, string>>>({})
  const [loading, setLoading] = useState(false)
  const set = (k: keyof typeof v) => (val: string) => {
    setV((s) => ({ ...s, [k]: val }))
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!v.current) next.current = t('common.required')
    if (v.next.length < 8 || !/[a-z]/i.test(v.next) || !/\d/.test(v.next)) next.next = t('account.profile.passwordMin')
    else if (v.next === v.current) next.next = t('account.profile.passwordSame')
    if (v.confirm !== v.next) next.confirm = t('account.profile.passwordMismatch')
    setErrors(next)
    if (Object.keys(next).length) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 500))
    setLoading(false)
    setV({ current: '', next: '', confirm: '' })
    toast.success(t('account.profile.passwordUpdated'))
  }

  return (
    <Panel title={t('account.profile.passwordTitle')} description={t('account.profile.passwordDesc')}>
      <form noValidate onSubmit={submit} className="space-y-4">
        <PasswordInput label={t('account.profile.currentPassword')} autoComplete="current-password" value={v.current} onChange={set('current')} error={errors.current} />
        <PasswordInput label={t('account.profile.newPassword')} autoComplete="new-password" value={v.next} onChange={set('next')} error={errors.next} />
        <PasswordInput label={t('account.profile.confirmPassword')} autoComplete="new-password" value={v.confirm} onChange={set('confirm')} error={errors.confirm} />
        <Button type="submit" variant="outline" size="lg" loading={loading} className="mt-2 w-full sm:w-auto">
          {t('account.profile.updatePassword')}
        </Button>
      </form>
    </Panel>
  )
}

export function ProfessionalCard({ user }: { user: User }) {
  const { t } = useT()
  const [loading, setLoading] = useState(false)
  const active = !!user.isProfessional

  const toggle = async () => {
    setLoading(true)
    await updateProfile({ isProfessional: !active })
    setLoading(false)
    toast.success(t(active ? 'account.profile.proDeactivated' : 'account.profile.proActivated'))
  }

  return (
    <section className="relative overflow-hidden rounded-xs border border-champagne/50 bg-champagne-soft/35 p-5 sm:p-6" aria-labelledby="pro-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-[#7a5a2a] shadow-soft">
            <Scissors className="size-5" strokeWidth={1.6} aria-hidden />
          </span>
          <h2 id="pro-title" className="font-serif text-xl font-medium tracking-[-0.015em] sm:text-2xl">
            {t('account.profile.proTitle')}
          </h2>
        </div>
        {active && (
          <Badge tone="champagne" icon={<BadgeCheck className="size-3.5" aria-hidden />}>
            {t('common.professional')}
          </Badge>
        )}
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted">{t('account.profile.proDesc')}</p>
      <ul className="mt-4 space-y-2">
        {['proBenefit1', 'proBenefit2', 'proBenefit3'].map((k) => (
          <li key={k} className="flex gap-2 text-sm text-ink">
            <Check className="mt-0.5 size-4 shrink-0 text-[#7a5a2a]" aria-hidden />
            {t(`account.profile.${k}`)}
          </li>
        ))}
      </ul>
      {active && <p className="mt-5 text-sm font-medium text-success">{t('account.profile.proActive')}</p>}
      <Button variant={active ? 'ghost' : 'dark'} onClick={toggle} loading={loading} className="mt-5 w-full sm:w-auto" aria-pressed={active}>
        {active ? t('account.profile.proDeactivate') : t('account.profile.proActivate')}
      </Button>
    </section>
  )
}
