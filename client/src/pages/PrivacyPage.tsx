import { PolicyLayout } from '@/components/static/PolicyLayout'
import { useStaticCopy } from '@/components/static/copy'

export default function PrivacyPage() {
  const { c } = useStaticCopy()
  return <PolicyLayout copy={c.privacy} />
}
