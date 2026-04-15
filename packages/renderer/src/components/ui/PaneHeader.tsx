import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { cn } from '@/lib/cn'

interface PaneHeaderProps extends ComponentPropsWithoutRef<'div'> {
  title: string
  description?: string
  actions?: ReactNode
}

export function PaneHeader({ title, description, actions, className, ...props }: PaneHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 border-b border-line-soft px-4 py-3',
        className,
      )}
      {...props}
    >
      <div className="space-y-1">
        <h3 className="text-lg leading-tight">{title}</h3>
        {description ? <p className="text-sm text-text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  )
}
