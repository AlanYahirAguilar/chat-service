import { cn } from '../utils'

export function Avatar({
  initials,
  hue,
  className,
}: {
  initials: string
  hue: number
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium text-[oklch(0.28_0_0)] select-none',
        className,
      )}
      style={{ backgroundColor: `oklch(0.9 0.06 ${hue})` }}
      aria-hidden="true"
    >
      {initials}
    </span>
  )
}
