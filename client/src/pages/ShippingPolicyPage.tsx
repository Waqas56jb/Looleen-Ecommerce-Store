import { PolicyLayout } from '@/components/static/PolicyLayout'
import { useStaticCopy } from '@/components/static/copy'

export default function ShippingPolicyPage() {
  const { c } = useStaticCopy()
  return <PolicyLayout copy={c.shipping} />
}
