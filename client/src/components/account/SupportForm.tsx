import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button, Input, Select, Textarea } from '@/components/common'
import { useT } from '@/i18n'
import { useAccountStore } from '@/store/account'
import type { Order } from '@/types'
import { formatDate } from '@/utils'

export function SupportForm({ orders }: { orders: Order[] }) {
  const { t, lang } = useT()
  const addTicket = useAccountStore((s) => s.addTicket)
  const [subject, setSubject] = useState('')
  const [order, setOrder] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<{ subject?: string; message?: string }>({})
  const [loading, setLoading] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (subject.trim().length < 3) next.subject = t('common.required')
    if (message.trim().length < 10) next.message = t('account.support.messageMin')
    setErrors(next)
    if (Object.keys(next).length) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 400))
    addTicket({ subject: order ? `${subject.trim()} · ${order}` : subject.trim(), message: message.trim() })
    setLoading(false)
    setSubject('')
    setOrder('')
    setMessage('')
    toast.success(t('toast.messageSent'))
  }

  return (
    <form noValidate onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Input
        label={t('account.support.subject')}
        placeholder={t('account.support.subjectPh')}
        value={subject}
        maxLength={100}
        onChange={(e) => {
          setSubject(e.target.value)
          if (errors.subject) setErrors((x) => ({ ...x, subject: undefined }))
        }}
        error={errors.subject}
      />
      <Select
        label={
          <>
            {t('account.support.order')} <span className="text-xs font-normal text-muted">({t('common.optional')})</span>
          </>
        }
        value={order}
        onChange={(e) => setOrder(e.target.value)}
        options={[{ value: '', label: t('account.support.orderNone') }, ...orders.map((o) => ({ value: o.number, label: `${o.number} · ${formatDate(o.createdAt, lang)}` }))]}
      />
      <div className="sm:col-span-2">
        <Textarea
          label={t('account.support.message')}
          placeholder={t('account.support.messagePh')}
          value={message}
          rows={5}
          maxLength={1500}
          onChange={(e) => {
            setMessage(e.target.value)
            if (errors.message) setErrors((x) => ({ ...x, message: undefined }))
          }}
          error={errors.message}
        />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" variant="dark" size="lg" loading={loading} className="w-full sm:w-auto">
          {t('account.support.submit')}
        </Button>
      </div>
    </form>
  )
}
