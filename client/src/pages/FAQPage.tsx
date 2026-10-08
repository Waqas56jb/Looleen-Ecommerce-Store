import { useState } from 'react'
import { FaqResults, FaqSearch } from '@/components/static/FaqExplorer'
import { HelpBand } from '@/components/static/HelpBand'
import { PageHero } from '@/components/static/PageHero'
import { useStaticCopy } from '@/components/static/copy'
import { useDocumentMeta } from '@/hooks'

export default function FAQPage() {
  const { c, f } = useStaticCopy()
  const h = c.faq.hero
  useDocumentMeta(f(c.faq.metaTitle), f(c.faq.metaDescription))
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')

  return (
    <>
      <PageHero eyebrow={h.eyebrow} title={h.title} lead={h.lead} crumb={c.faq.metaTitle} align="center">
        <FaqSearch value={query} onChange={setQuery} />
      </PageHero>
      <FaqResults
        query={query}
        category={category}
        onCategory={setCategory}
        onClear={() => {
          setQuery('')
          setCategory('all')
        }}
      />
      <HelpBand />
    </>
  )
}
