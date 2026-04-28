import type { ReactNode } from 'react'

import { LocaleToggle } from './LocaleToggle'

interface WorkbenchStatusTopBarProps {
  title: string
  subtitle?: string
  children?: ReactNode
  testId?: string
}

export function WorkbenchStatusTopBar({
  title,
  subtitle,
  children,
  testId,
}: WorkbenchStatusTopBarProps) {
  return (
    <div
      className="flex h-full min-w-0 flex-wrap items-center justify-end gap-2"
      data-testid={testId}
    >
      <div className="sr-only">
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {children ? (
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
          {children}
        </div>
      ) : null}
      <LocaleToggle />
    </div>
  )
}
