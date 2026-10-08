import { useParams } from 'react-router-dom'
import { Ticket } from 'lucide-react'
import { Card, EmptyState, ErrorState, PageHeader, PageSkeleton, StatusBadge } from '@/components/ui'
import { CouponForm } from '@/components/coupons/CouponForm'
import { CodePill } from '@/components/marketing/shared'
import { useAsync, useDocumentTitle } from '@/hooks'
import { useT } from '@/i18n'
import { getCoupon } from '@/services/marketingService'

export default function CouponEditPage() {
  const { t } = useT()
  const { id = '' } = useParams()
  const { data, loading, error, reload } = useAsync(() => getCoupon(id), [id])
  useDocumentTitle(data ? `${data.code} · ${t('marketing.couponForm.editTitle')}` : t('marketing.couponForm.editTitle'))
  const crumbs = [{ label: t('nav.marketing') }, { label: t('nav.coupons'), to: '/coupons' }]

  if (loading && !data) return <PageSkeleton stats={0} rows={8} />
  if (error)
    return (
      <Card>
        <ErrorState onRetry={reload} />
      </Card>
    )
  if (!data)
    return (
      <>
        <PageHeader title={t('marketing.couponForm.notFound')} breadcrumbs={crumbs} />
        <Card>
          <EmptyState icon={<Ticket />} title={t('marketing.couponForm.notFound')} description={t('marketing.couponForm.notFoundDesc')} action={{ label: t('marketing.couponForm.backToList'), to: '/coupons' }} />
        </Card>
      </>
    )
  return (
    <>
      <PageHeader
        title={t('marketing.couponForm.editTitle')}
        description={t('marketing.couponForm.editDesc')}
        breadcrumbs={[...crumbs, { label: data.code }]}
        meta={
          <>
            <CodePill code={data.code} />
            <StatusBadge status={data.status} />
          </>
        }
      />
      <CouponForm key={data.id} coupon={data} />
    </>
  )
}
