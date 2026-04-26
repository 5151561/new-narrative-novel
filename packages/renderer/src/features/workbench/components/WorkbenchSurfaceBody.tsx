import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { cn } from '@/lib/cn'

interface WorkbenchSurfaceBodyProps extends ComponentPropsWithoutRef<'div'> {
  scroll?: 'auto' | 'hidden'
  padded?: boolean
  children: ReactNode
}

export function WorkbenchSurfaceBody({
  scroll = 'auto',
  padded = false,
  className,
  children,
  ...props
}: WorkbenchSurfaceBodyProps) {
  return (
    <div
      className={cn(
        'min-h-0 min-w-0 flex-1',
        scroll === 'auto' ? 'overflow-auto' : 'overflow-hidden',
        padded ? 'p-4' : null,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
