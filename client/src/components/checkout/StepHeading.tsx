import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/common'
import { useT } from '@/i18n'

export function StepHeading({ id, title, subtitle }: { id: string; title: ReactNode; subtitle?: ReactNode }) {
  return (
    <header className="mb-6 sm:mb-8">
      <h2 id={id} className="heading-card sm:text-[28px]">
        {title}
      </h2>
      {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
    </header>
  )
}

/** Back / Continue footer used by steps 2–4 */
export function StepNav({ onBack, onNext, nextLabel, loading, nextIcon }: { onBack: () => void; onNext: () => void; nextLabel?: ReactNode; loading?: boolean; nextIcon?: ReactNode }) {
  const { t } = useT()
  return (
    <div className="mt-8 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
      <Button variant="ghost" onClick={onBack} disabled={loading} className="self-start">
        <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden />
        {t('common.back')}
      </Button>
      <Button variant="dark" size="lg" onClick={onNext} loading={loading} icon={nextIcon} className="w-full sm:w-auto">
        {nextLabel ?? t('common.continue')}
        {!loading && !nextIcon && <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden />}
      </Button>
    </div>
  )
}
