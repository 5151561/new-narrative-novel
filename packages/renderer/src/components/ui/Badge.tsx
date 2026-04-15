import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '@/lib/cn'

interface BadgeProps extends ComponentPropsWithoutRef<'span'> {
  tone?: 'neutral' | 'accent' | 'success' | 'warn' | 'danger'
}

const toneClasses: Record<NonNullable<BadgeProps['tone']>, string> = {
  neutral: 'bg-surface-2 text-text-muted ring-1 ring-inset ring-line-soft',
  accent: 'bg-accent-muted text-accent-strong ring-1 ring-inset ring-[rgba(201,100,66,0.16)]',
  success: 'bg-[rgba(76,106,78,0.12)] text-success ring-1 ring-inset ring-[rgba(76,106,78,0.18)]',
  warn: 'bg-[rgba(156,122,58,0.12)] text-warn ring-1 ring-inset ring-[rgba(156,122,58,0.18)]',
  danger: 'bg-[rgba(162,78,69,0.12)] text-danger ring-1 ring-inset ring-[rgba(162,78,69,0.18)]',
}

export function Badge({ className, tone = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium uppercase tracking-[0.04em]',
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  )
}
