import { Link } from 'react-router-dom'
import { ArrowRight, BadgeCheck, Check, MessageCircleHeart, PackageCheck, ScanSearch, ShieldCheck, Thermometer, Truck } from 'lucide-react'
import { AuthorizedBadge, Breadcrumbs, ButtonLink, OriginalBadge, Reveal, SectionHeading, SmartImage, TrustBar } from '@/components/common'
import { EDITORIAL, LOGO_PHOTO, poolImage } from '@/data/images'
import { useStaticCopy } from './copy'

export function AboutHero() {
  const { c, f } = useStaticCopy()
  const h = c.about.hero
  return (
    <header className="relative overflow-hidden bg-ivory">
      <div className="container-x pt-8 pb-12 sm:pt-10 sm:pb-16 lg:pb-20">
        <Breadcrumbs items={[{ label: h.eyebrow }]} className="mb-10 sm:mb-14" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end lg:gap-16">
          <div className="lg:col-span-8">
            <p className="eyebrow mb-5 animate-fade-up">{h.eyebrow}</p>
            <h1 className="heading-hero text-balance animate-fade-up [animation-delay:60ms]">{h.title}</h1>
          </div>
          <div className="lg:col-span-4">
            <p className="body-lg animate-fade-up [animation-delay:120ms]">{f(h.lead)}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <OriginalBadge size="md" />
              <AuthorizedBadge size="md" />
            </div>
          </div>
        </div>
      </div>
      <figure className="container-x pb-16 sm:pb-20 lg:pb-28">
        <div className="group relative overflow-hidden rounded-xs">
          <SmartImage
            src={LOGO_PHOTO}
            alt={f(h.imageAlt)}
            width={1600}
            height={800}
            priority
            wrapperClassName="aspect-[4/3] sm:aspect-[2/1]"
            className="transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
          />
          <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-transparent" />
        </div>
        <figcaption className="mt-4 flex items-center gap-3 text-xs tracking-wide text-muted">
          <span aria-hidden className="h-px w-10 bg-champagne" />
          {f(h.caption)}
        </figcaption>
      </figure>
    </header>
  )
}

export function AboutStory() {
  const { c, f } = useStaticCopy()
  const s = c.about.story
  return (
    <section className="bg-mist py-16 sm:py-20 lg:py-28" aria-labelledby="about-story">
      <div className="container-x grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-20">
        <Reveal className="relative lg:col-span-5">
          <SmartImage src={EDITORIAL.about} alt={s.imageAlt} width={900} height={1125} wrapperClassName="aspect-[4/5] rounded-xs" />
          <div className="absolute -bottom-6 end-4 hidden w-40 sm:block lg:-end-10 lg:w-48">
            <SmartImage src={poolImage('perfume', 2)} alt="" width={400} height={500} wrapperClassName="aspect-[4/5] rounded-xs border-4 border-mist shadow-lift" />
          </div>
        </Reveal>
        <Reveal className="lg:col-span-7 lg:ps-6" delay={80}>
          <p className="eyebrow mb-4">{s.eyebrow}</p>
          <h2 id="about-story" className="heading-section text-balance">
            {s.title}
          </h2>
          <div className="mt-8 space-y-5">
            {s.paragraphs.map((p, i) => (
              <p key={i} className={i === 0 ? 'font-serif text-xl leading-relaxed text-ink sm:text-2xl' : 'body-lg'}>
                {f(p)}
              </p>
            ))}
          </div>
          <p className="mt-8 font-serif text-lg text-rose italic">— {f(s.signature)}</p>
        </Reveal>
      </div>
    </section>
  )
}

const PILLAR_ICONS = [BadgeCheck, ShieldCheck, Thermometer, MessageCircleHeart]

export function AboutPromise() {
  const { c } = useStaticCopy()
  const p = c.about.promise
  return (
    <section className="py-16 sm:py-20 lg:py-28" aria-labelledby="about-promise">
      <div className="container-x">
        <SectionHeading eyebrow={p.eyebrow} title={<span id="about-promise">{p.title}</span>} align="center" />
        <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-xs border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {p.pillars.map((pillar, i) => {
            const Icon = PILLAR_ICONS[i % PILLAR_ICONS.length]
            return (
              <Reveal as="li" key={pillar.title} delay={i * 70} className="group bg-ivory p-7 transition-colors duration-300 hover:bg-white lg:p-9">
                <span className="grid size-12 place-items-center rounded-full bg-blush text-rose transition-colors duration-300 group-hover:bg-rose group-hover:text-white">
                  <Icon className="size-5" strokeWidth={1.6} aria-hidden />
                </span>
                <h3 className="heading-card mt-6">{pillar.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">{pillar.text}</p>
              </Reveal>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

const STEP_ICONS = [ShieldCheck, ScanSearch, Thermometer, PackageCheck]

export function AboutProcess() {
  const { c } = useStaticCopy()
  const p = c.about.process
  return (
    <section className="bg-blush/60 py-16 sm:py-20 lg:py-28" aria-labelledby="about-process">
      <div className="container-x grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-32">
            <p className="eyebrow mb-4">{p.eyebrow}</p>
            <h2 id="about-process" className="heading-section text-balance">
              {p.title}
            </h2>
            <p className="body-lg mt-5">{p.intro}</p>
          </div>
        </div>
        <ol className="relative space-y-4 lg:col-span-8">
          {p.steps.map((step, i) => {
            const Icon = STEP_ICONS[i]
            return (
              <Reveal as="li" key={step.title} delay={i * 80} className="relative flex gap-5 rounded-xs border border-line bg-ivory p-6 sm:gap-8 sm:p-8">
                <span className="font-serif text-5xl leading-none font-medium text-rose/80 tabular-nums sm:text-6xl">{String(i + 1).padStart(2, '0')}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <Icon className="size-5 shrink-0 text-champagne" strokeWidth={1.6} aria-hidden />
                    <h3 className="heading-card">{step.title}</h3>
                  </div>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted">{step.text}</p>
                </div>
                {i < p.steps.length - 1 && (
                  <ArrowRight aria-hidden className="absolute -bottom-3.5 start-12 z-10 hidden size-7 rotate-90 rounded-full border border-line bg-ivory p-1.5 text-rose sm:block" />
                )}
              </Reveal>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

export function AboutNumbers() {
  const { c, f } = useStaticCopy()
  const n = c.about.numbers
  return (
    <section className="relative overflow-hidden bg-ink py-16 text-ivory sm:py-20 lg:py-24" aria-labelledby="about-numbers">
      <span aria-hidden className="pointer-events-none absolute -start-32 top-1/2 size-96 -translate-y-1/2 rounded-full border border-champagne/15" />
      <div className="container-x relative">
        <SectionHeading eyebrow={f(n.eyebrow)} title={<span id="about-numbers">{n.title}</span>} tone="light" align="center" />
        <dl className="grid grid-cols-2 gap-y-10 lg:grid-cols-4">
          {n.stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 80} className="border-ivory/15 px-4 text-center sm:px-6 lg:border-s lg:first:border-s-0">
              <dt className="sr-only">{s.label}</dt>
              <dd>
                <span className="block font-serif text-5xl leading-none font-medium text-champagne sm:text-6xl lg:text-7xl" dir="ltr">
                  {s.value}
                </span>
                <span className="mt-4 block text-sm leading-snug text-ivory/70" aria-hidden>
                  {s.label}
                </span>
              </dd>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  )
}

export function AboutPro() {
  const { c } = useStaticCopy()
  const p = c.about.pro
  return (
    <section className="py-16 sm:py-20 lg:py-28" aria-labelledby="about-pro">
      <div className="container-x grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <Reveal className="order-2 lg:order-1">
          <p className="eyebrow mb-4">{p.eyebrow}</p>
          <h2 id="about-pro" className="heading-section text-balance">
            {p.title}
          </h2>
          <p className="body-lg mt-5">{p.text}</p>
          <ul className="mt-8 space-y-3">
            {p.bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-[15px] text-ink">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-rose text-white">
                  <Check className="size-3" strokeWidth={2.5} aria-hidden />
                </span>
                {b}
              </li>
            ))}
          </ul>
          <ButtonLink to="/contact" variant="dark" size="lg" className="mt-10">
            {p.cta}
            <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden />
          </ButtonLink>
        </Reveal>
        <Reveal className="order-1 grid grid-cols-5 gap-3 lg:order-2" delay={80}>
          <SmartImage src={EDITORIAL.professional} alt={p.imageAlt} width={800} height={1000} wrapperClassName="col-span-3 aspect-[3/4] rounded-xs" />
          <div className="col-span-2 flex flex-col gap-3 pt-10">
            <SmartImage src={poolImage('tools', 0)} alt="" width={500} height={500} wrapperClassName="aspect-square rounded-xs" />
            <SmartImage src={poolImage('nailsalon', 1)} alt="" width={500} height={650} wrapperClassName="aspect-[4/5] rounded-xs" />
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export function AboutCta() {
  const { c } = useStaticCopy()
  const a = c.about.cta
  return (
    <section className="pb-16 sm:pb-20 lg:pb-28" aria-labelledby="about-cta">
      <div className="container-x">
        <TrustBar className="mb-16 sm:mb-20" />
        <div className="relative overflow-hidden rounded-xs">
          <SmartImage src={EDITORIAL.newsletter} alt="" width={1600} height={700} wrapperClassName="absolute inset-0" />
          <span aria-hidden className="absolute inset-0 bg-ink/55" />
          <div className="relative mx-auto max-w-2xl px-6 py-16 text-center sm:py-24">
            <Truck className="mx-auto mb-5 size-6 text-champagne" strokeWidth={1.5} aria-hidden />
            <h2 id="about-cta" className="heading-section text-ivory">
              {a.title}
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-ivory/80 sm:text-base">{a.text}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink to="/new-arrivals" size="lg">
                {a.shop}
              </ButtonLink>
              <Link to="/brands" className="inline-flex h-13 items-center justify-center rounded-full border border-ivory/70 px-8 text-[15px] font-medium tracking-wide text-ivory transition-colors duration-300 hover:bg-ivory hover:text-ink">
                {a.brands}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
