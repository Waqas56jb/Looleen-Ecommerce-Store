import { Reveal } from '@/components/common'
import { ContactForm } from '@/components/static/ContactForm'
import { BusinessInfo, ContactCards, MapBlock } from '@/components/static/ContactSections'
import { PageHero } from '@/components/static/PageHero'
import { useStaticCopy } from '@/components/static/copy'
import { useDocumentMeta } from '@/hooks'

export default function ContactPage() {
  const { c, f } = useStaticCopy()
  const k = c.contact
  useDocumentMeta(f(k.metaTitle), f(k.metaDescription))

  return (
    <>
      <PageHero eyebrow={k.hero.eyebrow} title={k.hero.title} lead={f(k.hero.lead)} crumb={k.metaTitle} />

      <section className="container-x -mt-px py-12 sm:py-16" aria-label={k.metaTitle}>
        <ContactCards />
      </section>

      <section className="container-x pb-16 sm:pb-20 lg:pb-28" aria-labelledby="contact-form-title">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
          <Reveal className="lg:col-span-7">
            <p className="eyebrow mb-3">{k.form.eyebrow}</p>
            <h2 id="contact-form-title" className="heading-section">
              {k.form.title}
            </h2>
            <p className="body-lg mt-3 mb-8">{k.form.intro}</p>
            <ContactForm />
          </Reveal>
          <Reveal className="flex flex-col gap-4 lg:col-span-5" delay={80}>
            <MapBlock />
            <BusinessInfo />
          </Reveal>
        </div>
      </section>
    </>
  )
}
