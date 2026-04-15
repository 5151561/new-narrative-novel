import { cn } from '@/lib/cn'

interface StatusDotProps {
  tone?: 'neutral' | 'success' | 'warn' | 'danger' | 'accent'
  className?: string
}

const dotTone: Record<NonNullable<StatusDotProps['tone']>, string> = {
  neutral: 'bg-text-soft',
  success: 'bg-success',
  warn: 'bg-warn',
  danger: 'bg-danger',
  accent: 'bg-accent',
}

export function StatusDot({ tone = 'neutral', className }: StatusDotProps) {
  return <span className={cn('inline-flex size-2 rounded-full', dotTone[tone], className)} />
}
