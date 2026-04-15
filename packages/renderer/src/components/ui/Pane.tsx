import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '@/lib/cn'

interface PaneProps extends ComponentPropsWithoutRef<'section'> {
  muted?: boolean
}

export function Pane({ className, muted = false, ...props }: PaneProps) {
  return (
    <section
      className={cn(
        'panel-surface ring-panel flex min-h-0 flex-col overflow-hidden rounded-md',
        muted && 'panel-surface-muted shadow-ringwarm',
        className,
      )}
      {...props}
    />
  )
}
