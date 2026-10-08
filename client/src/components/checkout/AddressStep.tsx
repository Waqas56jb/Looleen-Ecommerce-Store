import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Plus, UserRound } from 'lucide-react'
import { AddressForm, AddressLines, type AddressInput } from '@/components/account/AddressForm'
import { Badge, Button, RadioCard } from '@/components/common'
import { useT } from '@/i18n'
import { useAccountStore } from '@/store/account'
import { useAuthStore } from '@/store/auth'
import { useCheckoutStore, type CheckoutAddress } from '@/store/checkout'
import type { Address } from '@/types'
import { StepHeading } from './StepHeading'

const toCheckoutAddress = (a: Address | AddressInput): CheckoutAddress => ({
  id: 'id' in a ? a.id : undefined,
  fullName: a.fullName,
  phone: a.phone,
  city: a.city,
  district: a.district,
  street: a.street,
  building: a.building,
  apartment: a.apartment,
  postalCode: a.postalCode,
})

export function AddressStep({ onDone }: { onDone: () => void }) {
  const { t } = useT()
  const user = useAuthStore((s) => s.user)
  const saved = useAccountStore((s) => s.addresses)
  const current = useCheckoutStore((s) => s.address)
  const setAddress = useCheckoutStore((s) => s.setAddress)
  const addresses = user ? saved : []

  const [selected, setSelected] = useState<string>(() => {
    if (current?.id && addresses.some((a) => a.id === current.id)) return current.id
    if (current && !current.id) return 'new'
    return addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? 'new'
  })

  const continueWithSaved = () => {
    const a = addresses.find((x) => x.id === selected)
    if (!a) return
    setAddress(toCheckoutAddress(a))
    onDone()
  }

  const submitNew = (v: AddressInput) => {
    setAddress({ ...toCheckoutAddress(v), id: undefined })
    onDone()
  }

  return (
    <section aria-labelledby="step-address">
      <StepHeading id="step-address" title={t('checkout.address.title')} subtitle={t('checkout.address.subtitle')} />

      {!user && (
        <p className="mb-6 flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-xs bg-blush/50 px-4 py-3 text-sm text-ink">
          <UserRound className="me-1 size-4 text-rose" aria-hidden />
          {t('checkout.address.haveAccount')}
          <Link to="/login?redirect=/checkout" className="font-semibold underline underline-offset-4 hover:text-rose">
            {t('checkout.address.signIn')}
          </Link>
          <span className="text-muted">{t('checkout.address.signInBenefit')}</span>
        </p>
      )}

      {addresses.length > 0 && (
        <fieldset className="mb-6">
          <legend className="mb-3 text-[13px] font-medium text-ink">{t('checkout.address.saved')}</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {addresses.map((a) => (
              <RadioCard key={a.id} name="address" value={a.id} checked={selected === a.id} onChange={() => setSelected(a.id)} className="items-start">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="text-xs font-semibold tracking-[0.12em] text-ink uppercase">{a.label}</span>
                  {a.isDefault && <Badge tone="muted">{t('checkout.address.default')}</Badge>}
                </div>
                <AddressLines address={a} />
              </RadioCard>
            ))}
            <RadioCard name="address" value="new" checked={selected === 'new'} onChange={() => setSelected('new')} className="items-start">
              <span className="flex items-center gap-2 text-sm font-medium text-ink">
                <Plus className="size-4" aria-hidden />
                {t('checkout.address.useNew')}
              </span>
              <span className="mt-1 block text-xs text-muted">{t('checkout.address.useNewDesc')}</span>
            </RadioCard>
          </div>
        </fieldset>
      )}

      {selected === 'new' ? (
        <div className="animate-fade-in rounded-xs border border-line bg-white p-5 sm:p-7">
          <AddressForm initial={current && !current.id ? current : undefined} onSubmit={submitNew} submitLabel={t('checkout.address.saveContinue')} />
        </div>
      ) : (
        <Button variant="dark" size="lg" onClick={continueWithSaved} className="w-full sm:w-auto">
          {t('checkout.address.saveContinue')}
          <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden />
        </Button>
      )}
    </section>
  )
}
