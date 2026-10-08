import type { ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { Award, CalendarDays, Mail, MapPin, MessageCircle, Pencil, Phone, Receipt, ShoppingBag, UserCheck, UserX, Wallet } from 'lucide-react'
import { Avatar, Badge, Button, EmptyState, ErrorState, Money, PageHeader, PageSkeleton, StatCard, StatusBadge, buttonClass } from '@/components/ui'
import { useCustomerActions } from '@/components/customers/CustomerActions'
import { AddressesCard, BusinessCard, CustomerActivityCard, CustomerReviewsCard, RecentOrdersCard, TicketsCard, WishlistCard } from '@/components/customers/CustomerDetailSections'
import { CustomerTypeBadge, whatsappLink } from '@/components/customers/shared'
import { useAsync, useDocumentTitle } from '@/hooks'
import { useT } from '@/i18n'
import { getCustomer } from '@/services/customerService'
import { cityName, formatDate, formatNumber, timeAgo } from '@/utils'

export default function CustomerDetailPage() {
  const { id = '' } = useParams()
  const { t, lang } = useT()
  const { data: customer, loading, error, reload } = useAsync(() => getCustomer(id), [id])
  const actions = useCustomerActions(reload)
  useDocumentTitle(customer?.name ?? t('nav.customers'))

  const crumbs = [{ label: t('nav.customers'), to: '/customers' }]

  if (loading && !customer) return <PageSkeleton stats={4} rows={4} />
  if (error) return <ErrorState onRetry={reload} />
  if (!customer)
    return (
      <>
        <PageHeader title={t('customers.detail.notFoundTitle')} breadcrumbs={crumbs} />
        <div className="card">
          <EmptyState title={t('customers.detail.notFoundTitle')} description={t('customers.detail.notFoundDesc')} action={{ label: t('customers.detail.backToList'), to: '/customers' }} />
        </div>
      </>
    )

  const c = customer
  const isPro = c.customerType === 'professional'
  const active = c.status === 'active'
  const avg = c.ordersCount ? Math.round(c.totalSpent / c.ordersCount) : 0

  return (
    <>
      <PageHeader
        title={c.name}
        breadcrumbs={[...crumbs, { label: c.name }]}
        meta={
          <>
            <CustomerTypeBadge type={c.customerType} />
            <StatusBadge status={c.status} />
          </>
        }
        description={t('customers.detail.customerSince', { date: formatDate(c.registeredAt, lang) })}
        actions={
          <>
            <a href={whatsappLink(c.phone)} target="_blank" rel="noreferrer" className={buttonClass('outline', 'md')}>
              <MessageCircle className="size-4" />
              {t('customers.actions.whatsapp')}
            </a>
            <a href={`mailto:${c.email}`} className={buttonClass('outline', 'md')}>
              <Mail className="size-4" />
              {t('customers.actions.email')}
            </a>
            <Button variant="outline" icon={active ? <UserX className="size-4" /> : <UserCheck className="size-4" />} onClick={() => actions.toggleStatus(c)}>
              {active ? t('customers.actions.deactivate') : t('customers.actions.activate')}
            </Button>
            <Button icon={<Pencil className="size-4" />} onClick={() => actions.edit(c)}>
              {t('common.edit')}
            </Button>
          </>
        }
      />

      {/* Profile */}
      <section className="card mb-6 flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
        <Avatar name={c.name} size="xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-ink">{c.name}</h2>
            {isPro && c.businessName && <Badge tone="champagne">{c.businessName}</Badge>}
          </div>
          <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-[13px] sm:grid-cols-2 xl:grid-cols-4">
            <ProfileItem icon={<Mail />} label={t('common.email')}>
              <a href={`mailto:${c.email}`} dir="ltr" className="truncate hover:text-rose-dark hover:underline">
                {c.email}
              </a>
            </ProfileItem>
            <ProfileItem icon={<Phone />} label={t('common.phone')}>
              <a href={`tel:${c.phone.replace(/\s/g, '')}`} dir="ltr" className="tabular-nums hover:text-rose-dark hover:underline">
                {c.phone}
              </a>
            </ProfileItem>
            <ProfileItem icon={<MapPin />} label={t('common.city')}>
              {cityName(c.city, lang)}
            </ProfileItem>
            <ProfileItem icon={<CalendarDays />} label={t('customers.detail.registered')}>
              {formatDate(c.registeredAt, lang)}
            </ProfileItem>
          </dl>
          {c.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {c.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t('customers.detail.orders')} value={formatNumber(c.ordersCount)} icon={<ShoppingBag />} period={c.lastOrderAt ? t('customers.detail.lastOrder', { time: timeAgo(c.lastOrderAt, lang) }) : t('customers.noOrdersYet')} />
        <StatCard label={t('customers.detail.totalSpent')} value={<Money value={c.totalSpent} />} icon={<Wallet />} />
        <StatCard label={t('customers.detail.averageOrder')} value={<Money value={avg} />} icon={<Receipt />} />
        <StatCard label={t('customers.detail.loyaltyPoints')} value={formatNumber(c.loyaltyPoints)} icon={<Award />} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
          <RecentOrdersCard customer={c} />
          <WishlistCard customer={c} />
          <CustomerReviewsCard customer={c} />
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          {isPro && <BusinessCard customer={c} />}
          <AddressesCard customer={c} />
          <TicketsCard customer={c} />
          <CustomerActivityCard customer={c} refreshKey={c} />
        </div>
      </div>
      {actions.dialogs}
    </>
  )
}

function ProfileItem({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-2 text-ink">
      <span className="text-subtle [&>svg]:size-4" aria-hidden>
        {icon}
      </span>
      <dt className="sr-only">{label}</dt>
      <dd className="min-w-0 truncate">{children}</dd>
    </div>
  )
}
