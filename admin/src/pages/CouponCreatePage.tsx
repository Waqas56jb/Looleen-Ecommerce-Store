import { PageHeader } from '@/components/ui'
import { CouponForm } from '@/components/coupons/CouponForm'
import { useDocumentTitle } from '@/hooks'
import { useT } from '@/i18n'

export default function CouponCreatePage() {
  const { t } = useT()
  useDocumentTitle(t('marketing.couponForm.createTitle'))
  return (
    <>
      <PageHeader
        title={t('marketing.couponForm.createTitle')}
        description={t('marketing.couponForm.createDesc')}
        breadcrumbs={[{ label: t('nav.marketing') }, { label: t('nav.coupons'), to: '/coupons' }, { label: t('marketing.couponForm.createTitle') }]}
      />
      <CouponForm />
    </>
  )
}
