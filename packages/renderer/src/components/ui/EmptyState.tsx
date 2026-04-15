import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

interface EmptyStateProps {
  title: string
  message: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, message, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-40 flex-col items-start justify-center gap-3 rounded-md border border-dashed border-line-strong bg-surface-2 px-4 py-5',
        className,
      )}
    >
      <div className="space-y-1">
        <h4 className="text-base">{title}</h4>
        <p className="max-w-prose text-sm leading-6 text-text-muted">{message}</p>
      </div>
      {action}
    </div>
  )
}
