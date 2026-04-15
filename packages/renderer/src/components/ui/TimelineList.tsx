import type { ReactNode } from 'react'

import { Badge } from './Badge'
import { StatusDot } from './StatusDot'

export interface TimelineItem {
  id: string
  title: string
  detail?: string
  meta?: string
  tone?: 'neutral' | 'accent' | 'success' | 'warn' | 'danger'
  trailing?: ReactNode
}

interface TimelineListProps {
  items: TimelineItem[]
}

const toneMap = {
  neutral: 'neutral',
  accent: 'accent',
  success: 'success',
  warn: 'warn',
  danger: 'danger',
} as const

export function TimelineList({ items }: TimelineListProps) {
  return (
    <ol className="flex flex-col">
      {items.map((item, index) => (
        <li
          key={item.id}
          className="flex gap-3 border-b border-line-soft px-4 py-3 last:border-b-0"
        >
          <div className="flex flex-col items-center">
            <StatusDot tone={item.tone ?? 'neutral'} className="mt-1" />
            {index < items.length - 1 ? <span className="mt-2 h-full w-px bg-line-soft" /> : null}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-text-main">{item.title}</p>
              {item.meta ? <Badge tone={toneMap[item.tone ?? 'neutral']}>{item.meta}</Badge> : null}
            </div>
            {item.detail ? <p className="text-sm leading-6 text-text-muted">{item.detail}</p> : null}
          </div>
          {item.trailing ? <div className="flex items-start">{item.trailing}</div> : null}
        </li>
      ))}
    </ol>
  )
}
