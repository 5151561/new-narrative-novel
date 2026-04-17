import { Badge } from '@/components/ui/Badge'
import { FactList } from '@/components/ui/FactList'
import { PaneHeader } from '@/components/ui/PaneHeader'
import { SectionCard } from '@/components/ui/SectionCard'
import { useI18n } from '@/app/i18n'

import type { ChapterDraftInspectorViewModel } from '../types/chapter-draft-view-models'

interface ChapterDraftInspectorPaneProps {
  chapterTitle: string
  chapterSummary: string
  inspector: ChapterDraftInspectorViewModel
}

function formatMetric(locale: 'en' | 'zh-CN', label: string, value?: number) {
  if (value === undefined) {
    return locale === 'zh-CN' ? `${label}：无` : `${label}: n/a`
  }

  return locale === 'zh-CN' ? `${label}：${value}` : `${label}: ${value}`
}

export function ChapterDraftInspectorPane({
  chapterTitle,
  chapterSummary,
  inspector,
}: ChapterDraftInspectorPaneProps) {
  const { locale, dictionary } = useI18n()
  const selectedScene = inspector.selectedScene

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <PaneHeader title={selectedScene?.title ?? chapterTitle} description={chapterSummary} />
      <div className="min-h-0 flex-1 space-y-3 overflow-auto p-4">
        <SectionCard title={dictionary.app.selectedScene} eyebrow={locale === 'zh-CN' ? '当前焦点' : 'Current Focus'}>
          {selectedScene ? (
            <div className="space-y-4">
              <div className="rounded-md border border-line-soft bg-surface-2 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-text-main">{selectedScene.title}</p>
                    <p className="mt-2 text-sm leading-6 text-text-muted">{selectedScene.summary}</p>
                  </div>
                  <Badge tone={selectedScene.warningsCount > 0 ? 'warn' : 'success'}>{selectedScene.proseStatusLabel}</Badge>
                </div>
              </div>
              <FactList
                items={[
                  {
                    id: 'draft-word-count',
                    label: locale === 'zh-CN' ? '字数' : 'Draft words',
                    value: formatMetric(locale, locale === 'zh-CN' ? '章节稿' : 'Draft', selectedScene.draftWordCount),
                  },
                  {
                    id: 'queued-revisions',
                    label: locale === 'zh-CN' ? '待处理修订' : 'Queued revisions',
                    value: `${selectedScene.revisionQueueCount ?? 0}`,
                  },
                  {
                    id: 'warnings',
                    label: locale === 'zh-CN' ? '警告' : 'Warnings',
                    value: `${selectedScene.warningsCount}`,
                  },
                  {
                    id: 'prose-status',
                    label: locale === 'zh-CN' ? '正文状态' : 'Prose status',
                    value: selectedScene.proseStatusLabel,
                  },
                ]}
              />
              {selectedScene.latestDiffSummary ? (
                <div className="rounded-md border border-line-soft bg-surface-2 p-3">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{locale === 'zh-CN' ? '最近差异' : 'Latest diff'}</p>
                  <p className="mt-2 text-sm leading-6 text-text-muted">{selectedScene.latestDiffSummary}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </SectionCard>
        <SectionCard title={dictionary.app.chapterReadiness} eyebrow={locale === 'zh-CN' ? '阅读支持' : 'Reading Support'}>
          <FactList
            items={[
              {
                id: 'drafted-scenes',
                label: locale === 'zh-CN' ? '已起草场景' : 'Drafted scenes',
                value: `${inspector.chapterReadiness.draftedSceneCount}`,
              },
              {
                id: 'missing-drafts',
                label: locale === 'zh-CN' ? '缺稿场景' : 'Missing drafts',
                value: `${inspector.chapterReadiness.missingDraftCount}`,
              },
              {
                id: 'assembled-word-count',
                label: locale === 'zh-CN' ? '合计字数' : 'Assembled words',
                value: `${inspector.chapterReadiness.assembledWordCount}`,
              },
              {
                id: 'warnings-attention',
                label: locale === 'zh-CN' ? '警告 / 修订' : 'Warnings / Queue',
                value: `${inspector.chapterReadiness.warningsCount} / ${inspector.chapterReadiness.queuedRevisionCount}`,
              },
            ]}
          />
        </SectionCard>
      </div>
    </div>
  )
}
