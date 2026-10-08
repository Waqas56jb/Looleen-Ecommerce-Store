import { useState } from 'react'
import { StickyNote } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, Button, Card, Textarea } from '@/components/ui'
import { useT } from '@/i18n'
import { addOrderNote } from '@/services/orderService'
import type { AdminOrder } from '@/types'
import { formatDateTime } from '@/utils'

export function OrderNotesCard({ order, onAdded }: { order: AdminOrder; onAdded: () => void }) {
  const { t, lang } = useT()
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return setError(t('orders.detail.noteRequired'))
    setBusy(true)
    try {
      await addOrderNote(order.id, text.trim())
      toast.success(t('orders.toast.noteAdded', { number: order.number }))
      setText('')
      onAdded()
    } catch {
      toast.error(t('orders.toast.error'))
    } finally {
      setBusy(false)
    }
  }

  const notes = [...order.notes].sort((a, b) => b.date.localeCompare(a.date))
  return (
    <Card title={t('orders.detail.notes')} description={t('orders.detail.notesDesc')}>
      <form onSubmit={submit} className="space-y-2">
        <Textarea
          aria-label={t('orders.detail.notes')}
          rows={2}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setError('')
          }}
          placeholder={t('orders.detail.notePlaceholder')}
          error={error}
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" loading={busy}>
            {t('orders.detail.addNote')}
          </Button>
        </div>
      </form>
      {notes.length === 0 ? (
        <p className="mt-4 flex items-center gap-2 text-[13px] text-muted">
          <StickyNote className="size-4 text-subtle" aria-hidden /> {t('orders.detail.noNotes')}
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {notes.map((n) => (
            <li key={n.id} className="flex gap-3 rounded-md border border-line-soft bg-mist/60 p-3">
              <Avatar name={n.by} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-baseline gap-x-2 text-xs">
                  <span className="font-medium text-ink">{n.by}</span>
                  <span className="text-subtle">{formatDateTime(n.date, lang)}</span>
                </p>
                <p className="mt-1 text-[13px] leading-relaxed whitespace-pre-line text-ink">{n.text}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
