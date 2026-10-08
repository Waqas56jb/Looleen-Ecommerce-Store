import { PolicyLayout } from '@/components/static/PolicyLayout'
import { useStaticCopy } from '@/components/static/copy'

export default function TermsPage() {
  const { c } = useStaticCopy()
  return <PolicyLayout copy={c.terms} />
}
