import { Reveal, TrustBar } from '@/components/common'
import { CategoryMosaic } from '@/components/home/CategoryMosaic'
import { InstagramGallery, NewsletterSection, Testimonials } from '@/components/home/CommunitySections'
import { NewArrivalsSplit, ProfessionalSection, RitualBanner, ShopByConcern } from '@/components/home/EditorialSections'
import { FeaturedBrands } from '@/components/home/FeaturedBrands'
import { HeroSlider } from '@/components/home/HeroSlider'
import { BestSellersRail, FlashDeals, RecentlyViewedRail, TrendingSection } from '@/components/home/HomeRails'
import { useDocumentMeta } from '@/hooks'
import { useT } from '@/i18n'

export default function Home() {
  const { t } = useT()
  useDocumentMeta(t('home.meta.title'), t('home.meta.description'))

  return (
    <>
      <h1 className="sr-only">{t('home.meta.h1')}</h1>
      <HeroSlider />
      <div className="container-x pt-8 sm:pt-10">
        <Reveal>
          <TrustBar />
        </Reveal>
      </div>
      <CategoryMosaic />
      <FeaturedBrands />
      <FlashDeals />
      <BestSellersRail />
      <NewArrivalsSplit />
      <TrendingSection />
      <ShopByConcern />
      <RitualBanner />
      <ProfessionalSection />
      <Testimonials />
      <RecentlyViewedRail />
      <NewsletterSection />
      <InstagramGallery />
    </>
  )
}
