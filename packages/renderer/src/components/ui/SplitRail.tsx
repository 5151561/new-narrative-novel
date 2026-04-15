import { cn } from '@/lib/cn'

interface SplitRailProps {
  label?: string
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

export function SplitRail({ label, orientation = 'horizontal', className }: SplitRailProps) {
  if (orientation === 'vertical') {
    return (
      <div className={cn('flex min-h-0 items-stretch gap-2', className)}>
        <span className="w-px flex-1 bg-line-soft" />
        {label ? (
          <span className="-rotate-180 text-[11px] uppercase tracking-[0.06em] text-text-soft [writing-mode:vertical-rl]">
            {label}
          </span>
        ) : null}
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="h-px flex-1 bg-line-soft" />
      {label ? <span className="text-[11px] uppercase tracking-[0.06em] text-text-soft">{label}</span> : null}
      <span className="h-px flex-1 bg-line-soft" />
    </div>
  )
}
