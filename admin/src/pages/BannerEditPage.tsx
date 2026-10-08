import { useParams } from 'react-router-dom'
import { Image as ImageIcon } from 'lucide-react'
import { Card, EmptyState, ErrorState, PageHeader, PageSkeleton, StatusBadge } from '@/components/ui'
import { BannerForm } from '@/components/content/BannerForm'
import { useAsync, useDocumentTitle } from '@/hooks'
import { useT } from '@/i18n'
import { getBanner } from '@/services/marketingService'

export default function BannerEditPage() {
  const { t, lang } = useT()
  const { id = '' } = useParams()
  const { data, loading, error, reload } = useAsync(() => getBanner(id), [id])
  useDocumentTitle(data ? `${data.title} · ${t('marketing.bannerForm.editTitle')}` : t('marketing.bannerForm.editTitle'))
  const crumbs = [{ label: t('nav.content') }, { label: t('nav.banners'), to: '/banners' }]

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
        <PageHeader title={t('marketing.bannerForm.notFound')} breadcrumbs={crumbs} />
        <Card>
          <EmptyState icon={<ImageIcon />} title={t('marketing.bannerForm.notFound')} description={t('marketing.bannerForm.notFoundDesc')} action={{ label: t('marketing.bannerForm.backToList'), to: '/banners' }} />
        </Card>
      </>
    )
  const name = lang === 'ar' ? data.titleAr : data.title
  return (
    <>
      <PageHeader
        title={t('marketing.bannerForm.editTitle')}
        description={t('marketing.bannerForm.editDesc')}
        breadcrumbs={[...crumbs, { label: name }]}
        meta={<StatusBadge status={data.status} />}
      />
      <BannerForm key={data.id} banner={data} />
    </>
  )
}
