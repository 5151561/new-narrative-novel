import { useI18n, type Locale } from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { PaneHeader } from '@/components/ui/PaneHeader'
import { TimelineList, type TimelineItem } from '@/components/ui/TimelineList'

import type { RunEventRecord } from '../api/run-records'

interface RunEventStreamPanelProps {
  events: RunEventRecord[]
  isLoading: boolean
  error: Error | null
}

const severityTone = {
  info: 'neutral',
  warning: 'warn',
  error: 'danger',
} as const

const severityLabels: Record<Locale, Record<keyof typeof severityTone, string>> = {
  en: {
    info: 'Info',
    warning: 'Warning',
    error: 'Error',
  },
  'zh-CN': {
    info: '提示',
    warning: '警告',
    error: '错误',
  },
}

function formatRefLabel(ref: NonNullable<RunEventRecord['refs']>[number]) {
  return ref.kind
}

function getErrorMessage(locale: Locale) {
  return locale === 'zh-CN'
    ? '当前运行时间线暂时不可用。'
    : 'The active run timeline is temporarily unavailable.'
}

export function RunEventStreamPanel({ events, isLoading, error }: RunEventStreamPanelProps) {
  const { locale } = useI18n()

  const items: TimelineItem[] = events.map((event) => {
    const severity = event.severity ?? 'info'

    return {
      id: event.id,
      title: event.label,
      detail: event.summary,
      meta: event.createdAtLabel,
      tone: severityTone[severity],
      trailing:
        event.refs?.length || severity ? (
          <div className="flex max-w-[180px] flex-wrap justify-end gap-1">
            <Badge tone={severityTone[severity]}>{severityLabels[locale][severity]}</Badge>
            {event.refs?.map((ref) => (
              <Badge key={`${event.id}-${ref.kind}-${ref.id}`} title={ref.label ?? ref.id}>
                {formatRefLabel(ref)}
              </Badge>
            ))}
          </div>
        ) : null,
    }
  })

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-md border border-line-soft bg-surface-1 shadow-ringwarm">
      <PaneHeader
        title={locale === 'zh-CN' ? '运行时间线' : 'Run Timeline'}
        description={
          locale === 'zh-CN'
            ? '只展示产品级运行里程碑，而不是底层调试日志。'
            : 'Product-level run milestones for the active scene session.'
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <EmptyState
            title={locale === 'zh-CN' ? '正在加载运行时间线' : 'Loading run timeline'}
            message={
              locale === 'zh-CN'
                ? '正在拉取该场景最近一次运行的结构化事件。'
                : 'Fetching the latest structured run events for this scene.'
            }
          />
        ) : error ? (
          <EmptyState
            title={locale === 'zh-CN' ? '运行时间线不可用' : 'Run timeline unavailable'}
            message={getErrorMessage(locale)}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title={locale === 'zh-CN' ? '暂无运行事件' : 'No run events yet'}
            message={
              locale === 'zh-CN'
                ? '当活动运行记录到产品级里程碑后，这里会显示结构化事件。'
                : 'Structured run events will appear here once the active run records product-level milestones.'
            }
          />
        ) : (
          <TimelineList items={items} />
        )}
      </div>
    </section>
  )
}
