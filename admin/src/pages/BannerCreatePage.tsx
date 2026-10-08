import { useSearchParams } from 'react-router-dom'
import { PageHeader, PageSkeleton } from '@/components/ui'
import { BannerForm } from '@/components/content/BannerForm'
import { PLACEMENTS } from '@/components/content/bannerMeta'
import { useAsync, useDocumentTitle } from '@/hooks'
import { useT } from '@/i18n'
import { getBanners } from '@/services/marketingService'
import type { BannerPlacement } from '@/types'

export default function BannerCreatePage() {
  const { t } = useT()
  useDocumentTitle(t('marketing.bannerForm.createTitle'))
  const [params] = useSearchParams()
  const p = params.get('placement') as BannerPlacement | null
  const placement = p && PLACEMENTS.includes(p) ? p : 'homepage_hero'
  // Next free slot in the chosen placement
  const existing = useAsync(() => getBanners({ pageSize: 1000, filters: { placement } }), [placement])
  const nextOrder = existing.data ? Math.max(0, ...existing.data.items.map((b) => b.sortOrder)) + 1 : undefined

  return (
    <>
      <PageHeader
        title={t('marketing.bannerForm.createTitle')}
        description={t('marketing.bannerForm.createDesc')}
        breadcrumbs={[{ label: t('nav.content') }, { label: t('nav.banners'), to: '/banners' }, { label: t('marketing.bannerForm.createTitle') }]}
      />
      {nextOrder === undefined && !existing.error ? <PageSkeleton stats={0} rows={6} /> : <BannerForm defaultSortOrder={nextOrder ?? 1} defaultPlacement={placement} />}
    </>
  )
}
