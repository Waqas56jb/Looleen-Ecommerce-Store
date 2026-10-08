import { Mail, MessageCircle, Phone, type LucideIcon } from 'lucide-react'
import { AccountPageHeader, Panel, PanelSkeleton } from '@/components/account/AccountUI'
import { SupportForm } from '@/components/account/SupportForm'
import { Accordion, ArrowLink, Badge, ErrorState } from '@/components/common'
import { STORE_CONFIG } from '@/config/store'
import { useAsync, useDocumentMeta } from '@/hooks'
import { useT } from '@/i18n'
import { getOrders } from '@/services/orderService'
import { useAccountStore } from '@/store/account'
import type { SupportTicket } from '@/types'
import { formatDate, whatsappLink } from '@/utils'

const TICKET_TONE: Record<SupportTicket['status'], 'warning' | 'success' | 'muted'> = { open: 'warning', answered: 'success', closed: 'muted' }

export default function SupportPage() {
  const { t, lang } = useT()
  useDocumentMeta(t('account.support.metaTitle'), t('account.support.metaDesc'))
  const tickets = useAccountStore((s) => s.tickets)
  const orders = useAsync(() => getOrders(), [])

  const channels: { icon: LucideIcon; title: string; desc: string; value: string; href: string; external?: boolean; accent?: boolean }[] = [
    { icon: MessageCircle, title: t('account.support.whatsapp'), desc: t('account.support.whatsappDesc'), value: t('account.support.whatsappCta'), href: whatsappLink(), external: true, accent: true },
    { icon: Phone, title: t('account.support.call'), desc: t('account.support.callDesc'), value: STORE_CONFIG.supportPhone, href: `tel:${STORE_CONFIG.supportPhone.replace(/\s/g, '')}` },
    { icon: Mail, title: t('account.support.email'), desc: t('account.support.emailDesc'), value: STORE_CONFIG.supportEmail, href: `mailto:${STORE_CONFIG.supportEmail}` },
  ]

  const faq = [1, 2, 3, 4].map((n) => ({ title: t(`account.support.q${n}`), content: t(`account.support.a${n}`) }))

  return (
    <div className="space-y-8">
      <AccountPageHeader title={t('account.support.title')} description={t('account.support.desc', { hours: STORE_CONFIG.workingHours })} />

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {channels.map(({ icon: Icon, title, desc, value, href, external, accent }) => (
          <li key={title}>
            <a
              href={href}
              target={external ? '_blank' : undefined}
              rel={external ? 'noreferrer' : undefined}
              className={
                accent
                  ? 'group flex h-full flex-col rounded-xs bg-ink p-5 text-ivory transition-colors hover:bg-ink-soft sm:p-6'
                  : 'group flex h-full flex-col rounded-xs border border-line bg-white p-5 transition-shadow hover:shadow-soft sm:p-6'
              }
            >
              <span className={accent ? 'grid size-11 place-items-center rounded-full bg-[#25d366] text-white' : 'grid size-11 place-items-center rounded-full bg-blush text-rose'}>
                <Icon className="size-5" strokeWidth={1.6} aria-hidden />
              </span>
              <span className="mt-4 font-serif text-xl font-medium">{title}</span>
              <span className={accent ? 'mt-1 flex-1 text-sm text-ivory/70' : 'mt-1 flex-1 text-sm text-muted'}>{desc}</span>
              <span className={accent ? 'mt-4 text-sm font-semibold text-champagne' : 'mt-4 text-sm font-semibold text-ink group-hover:text-rose'} dir={external ? undefined : 'ltr'}>
                {value}
              </span>
            </a>
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Panel title={t('account.support.newRequest')}>
          {orders.loading ? <PanelSkeleton bare rows={2} /> : orders.error ? <ErrorState onRetry={orders.reload} /> : <SupportForm orders={orders.data ?? []} />}
        </Panel>

        <Panel title={t('account.support.tickets')} bodyClassName="p-0">
          {tickets.length === 0 ? (
            <p className="p-5 text-sm text-muted sm:p-6">{t('account.support.noTickets')}</p>
          ) : (
            <ul className="divide-y divide-line">
              {tickets.map((tk) => (
                <li key={tk.id} className="px-5 py-4 sm:px-6">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 text-sm font-semibold text-ink">{tk.subject}</p>
                    <Badge tone={TICKET_TONE[tk.status]}>{t(`status.${tk.status}`)}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{tk.message}</p>
                  <p className="mt-1.5 text-xs text-muted">
                    <span dir="ltr">#{tk.id.toUpperCase()}</span> · {formatDate(tk.createdAt, lang)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <section aria-labelledby="support-faq" className="rounded-xs border border-line bg-white p-5 sm:p-6">
        <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
          <h2 id="support-faq" className="font-serif text-xl font-medium tracking-[-0.015em] sm:text-2xl">
            {t('account.support.faqTitle')}
          </h2>
          <ArrowLink to="/faq">{t('account.support.faqLink')}</ArrowLink>
        </div>
        <Accordion items={faq} className="mt-4" />
      </section>
    </div>
  )
}
