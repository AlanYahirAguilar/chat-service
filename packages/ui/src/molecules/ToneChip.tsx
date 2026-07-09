import { cn } from '../utils'
import { TONES } from '../constants'
import type { ToneId } from '../types'

export function ToneChip({
  tone,
  className,
}: {
  tone: ToneId
  className?: string
}) {
  const t = TONES[tone]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground',
        className,
      )}
    >
      <span className={cn('size-2 rounded-full', t.dot)} aria-hidden="true" />
      {t.label}
    </span>
  )
}
