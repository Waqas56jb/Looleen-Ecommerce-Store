import { AboutCta, AboutHero, AboutNumbers, AboutPro, AboutProcess, AboutPromise, AboutStory } from '@/components/static/AboutSections'
import { useStaticCopy } from '@/components/static/copy'
import { useDocumentMeta } from '@/hooks'

export default function AboutPage() {
  const { c, f } = useStaticCopy()
  useDocumentMeta(f(c.about.metaTitle), f(c.about.metaDescription))
  return (
    <>
      <AboutHero />
      <AboutStory />
      <AboutPromise />
      <AboutProcess />
      <AboutNumbers />
      <AboutPro />
      <AboutCta />
    </>
  )
}
