import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '@/lib/cn'

export function StickyFooter({ className, ...props }: ComponentPropsWithoutRef<'footer'>) {
  return (
    <footer
      className={cn(
        'sticky bottom-0 z-10 border-t border-line-soft bg-[rgba(250,249,245,0.94)] px-4 py-3 backdrop-blur',
        className,
      )}
      {...props}
    />
  )
}
