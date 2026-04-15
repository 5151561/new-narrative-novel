import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '@/lib/cn'

export function Toolbar({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-md border border-line-soft bg-surface-2 px-3 py-2',
        className,
      )}
      {...props}
    />
  )
}
