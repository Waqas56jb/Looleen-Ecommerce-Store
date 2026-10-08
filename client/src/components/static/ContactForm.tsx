import { useRef, useState, type FormEvent } from 'react'
import { CheckCircle2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Input, Select, Textarea } from '@/components/common'
import { isValidEmail, isValidSaudiPhone, normalizeSaudiPhone, uid } from '@/utils'
import { useStaticCopy } from './copy'

const TOPICS = ['order', 'advice', 'salon', 'partnership', 'other'] as const
type Topic = (typeof TOPICS)[number]

interface Values {
  name: string
  email: string
  phone: string
  topic: Topic | ''
  orderNumber: string
  message: string
}

const EMPTY: Values = { name: '', email: '', phone: '', topic: '', orderNumber: '', message: '' }

type Errors = Partial<Record<keyof Values, string>>

export function ContactForm() {
  const { c, f, t } = useStaticCopy()
  const copy = c.contact.form
  const [values, setValues] = useState<Values>(EMPTY)
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState<{ name: string; email: string; ref: string } | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const validate = (v: Values): Errors => {
    const e: Errors = {}
    if (v.name.trim().length < 2) e.name = t('common.required')
    if (!v.email.trim()) e.email = t('common.required')
    else if (!isValidEmail(v.email)) e.email = t('common.invalidEmail')
    if (v.phone.trim() && !isValidSaudiPhone(v.phone)) e.phone = t('common.invalidPhone')
    if (!v.topic) e.topic = copy.chooseTopic
    if (!v.message.trim()) e.message = t('common.required')
    else if (v.message.trim().length < 10) e.message = copy.messageShort
    return e
  }

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const found = validate(values)
    setErrors(found)
    const firstKey = Object.keys(found)[0]
    if (firstKey) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstKey}"]`)?.focus()
      return
    }
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 700))
    setSubmitting(false)
    setSent({ name: values.name.trim().split(/\s+/)[0], email: values.email.trim(), ref: uid('MSG').toUpperCase() })
    toast.success(t('toast.messageSent'))
  }

  const reset = () => {
    setValues(EMPTY)
    setErrors({})
    setSent(null)
  }

  if (sent) {
    return (
      <div className="animate-scale-in flex flex-col items-center rounded-xs border border-line bg-white px-6 py-14 text-center sm:px-10" role="status" aria-live="polite">
        <span className="grid size-16 place-items-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="size-8" strokeWidth={1.5} aria-hidden />
        </span>
        <h3 className="heading-card mt-6">{f(copy.successTitle, { name: sent.name })}</h3>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">{f(copy.successText, { email: sent.email })}</p>
        <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-mist px-4 py-2 text-xs text-muted">
          {copy.reference}
          <span className="font-semibold tracking-wider text-ink" dir="ltr">
            {sent.ref}
          </span>
        </p>
        <Button variant="outline" className="mt-8" onClick={reset}>
          {copy.sendAnother}
        </Button>
      </div>
    )
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="rounded-xs border border-line bg-white p-6 sm:p-8 lg:p-10">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          name="name"
          label={copy.name}
          placeholder={copy.namePlaceholder}
          autoComplete="name"
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          error={errors.name}
          required
        />
        <Input
          name="email"
          type="email"
          label={copy.email}
          placeholder="name@example.com"
          autoComplete="email"
          dir="ltr"
          value={values.email}
          onChange={(e) => set('email', e.target.value)}
          error={errors.email}
          required
        />
        <Input
          name="phone"
          type="tel"
          inputMode="tel"
          label={copy.phone}
          optional
          optionalLabel={t('common.optional')}
          placeholder="+966 5X XXX XXXX"
          autoComplete="tel"
          dir="ltr"
          className="text-start"
          value={values.phone}
          onChange={(e) => set('phone', e.target.value)}
          onBlur={() => values.phone && isValidSaudiPhone(values.phone) && set('phone', normalizeSaudiPhone(values.phone))}
          error={errors.phone}
          hint={copy.phoneHint}
        />
        <Select
          name="topic"
          label={copy.topic}
          placeholder={copy.topicPlaceholder}
          value={values.topic}
          onChange={(e) => set('topic', e.target.value as Topic)}
          options={TOPICS.map((id) => ({ value: id, label: copy.topics[id] }))}
          error={errors.topic}
          required
        />
        <Input
          name="orderNumber"
          label={copy.orderNumber}
          optional
          optionalLabel={t('common.optional')}
          placeholder="LK-100245"
          dir="ltr"
          className="text-start uppercase"
          wrapperClassName="sm:col-span-2"
          value={values.orderNumber}
          onChange={(e) => set('orderNumber', e.target.value)}
          hint={copy.orderHint}
        />
        <div className="sm:col-span-2">
          <Textarea
            name="message"
            label={copy.message}
            placeholder={copy.messagePlaceholder}
            rows={6}
            maxLength={2000}
            value={values.message}
            onChange={(e) => set('message', e.target.value)}
            error={errors.message}
            required
          />
        </div>
      </div>
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-sm text-xs leading-relaxed text-muted">{copy.privacy}</p>
        <Button type="submit" size="lg" loading={submitting} icon={!submitting && <Send className="size-4 rtl:-scale-x-100" aria-hidden />}>
          {copy.submit}
        </Button>
      </div>
    </form>
  )
}
