import { PolicyLayout } from '@/components/static/PolicyLayout'
import { useStaticCopy } from '@/components/static/copy'

export default function ReturnPolicyPage() {
  const { c } = useStaticCopy()
  return <PolicyLayout copy={c.returns} />
}
