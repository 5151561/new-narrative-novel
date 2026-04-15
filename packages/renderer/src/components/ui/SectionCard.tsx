import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { cn } from '@/lib/cn'

interface SectionCardProps extends ComponentPropsWithoutRef<'section'> {
  title?: string
  eyebrow?: string
  actions?: ReactNode
}

export function SectionCard({ title, eyebrow, actions, className, children, ...props }: SectionCardProps) {
  return (
    <section
      className={cn(
        'rounded-md border border-line-soft bg-surface-1 px-4 py-4 shadow-ringwarm',
        className,
      )}
      {...props}
    >
      {title || eyebrow || actions ? (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div className="space-y-1">
            {eyebrow ? <p className="text-[11px] uppercase tracking-[0.05em] text-text-soft">{eyebrow}</p> : null}
            {title ? <h4 className="text-base leading-tight">{title}</h4> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      {children}
    </section>
  )
}
