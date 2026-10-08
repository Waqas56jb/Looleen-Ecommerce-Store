import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ProductForm } from '@/components/products/ProductForm'
import { PageHeader } from '@/components/ui'
import { useDocumentTitle } from '@/hooks'
import { useT } from '@/i18n'

export default function ProductCreatePage() {
  const { t } = useT()
  const [params] = useSearchParams()
  const brand = params.get('brand')
  const defaults = useMemo(() => (brand ? { brandId: brand } : undefined), [brand])
  useDocumentTitle(t('products.newTitle'))
  return (
    <>
      <PageHeader
        title={t('products.newTitle')}
        description={t('products.newDescription')}
        breadcrumbs={[{ label: t('nav.catalog') }, { label: t('products.title'), to: '/products' }, { label: t('products.newTitle') }]}
      />
      <ProductForm defaults={defaults} />
    </>
  )
}
