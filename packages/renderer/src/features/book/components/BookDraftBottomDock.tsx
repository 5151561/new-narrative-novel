import { EmptyState } from '@/components/ui/EmptyState'
import { FactList } from '@/components/ui/FactList'
import { PaneHeader } from '@/components/ui/PaneHeader'
import { SectionCard } from '@/components/ui/SectionCard'
import { TimelineList } from '@/components/ui/TimelineList'

import { useI18n } from '@/app/i18n'
import type { BookDraftView } from '@/features/workbench/types/workbench-route'

import type { BookWorkbenchActivityItem } from '../hooks/useBookWorkbenchActivity'
import type { BookDraftCompareProblems } from '../lib/book-draft-compare-presentation'
import type { BookDraftDockSummaryItem, BookDraftDockSummaryViewModel } from '../types/book-draft-view-models'

export interface BookDraftExportProblems {
  blockerCount: number
  warningCount: number
  traceGapCount: number
  missingDraftCount: number
  compareRegressionCount: number
  artifactReadinessBlockerCount?: number
  artifactReviewBlockerCount?: number
  artifactWarningCount?: number
  staleArtifactCount?: number
  blockers: BookDraftDockSummaryItem[]
  warnings: BookDraftDockSummaryItem[]
  traceGaps: BookDraftDockSummaryItem[]
  missingDrafts: BookDraftDockSummaryItem[]
  compareRegressions: BookDraftDockSummaryItem[]
  artifactGateProblems?: BookDraftDockSummaryItem[]
}

export interface BookDraftBranchProblems {
  blockerCount: number
  warningCount: number
  draftMissingSceneCount: number
  traceRegressionCount: number
  warningIncreaseCount: number
  addedWithoutSourceCount: number
  blockers: BookDraftDockSummaryItem[]
  warnings: BookDraftDockSummaryItem[]
  draftMissingScenes: BookDraftDockSummaryItem[]
  traceRegressions: BookDraftDockSummaryItem[]
  warningIncreases: BookDraftDockSummaryItem[]
  addedWithoutSource: BookDraftDockSummaryItem[]
}

export interface BookDraftReviewProblems {
  blockerCount: number
  traceGapCount: number
  missingDraftCount: number
  exportBlockerCount: number
  branchBlockerCount: number
  openCount: number
  actionedCount: number
  staleCount: number
  openWithoutFixStartedCount: number
  blockedFixCount: number
  staleFixCount: number
  checkedStillOpenCount: number
  blockers: BookDraftDockSummaryItem[]
  traceGaps: BookDraftDockSummaryItem[]
  missingDrafts: BookDraftDockSummaryItem[]
  exportBlockers: BookDraftDockSummaryItem[]
  branchBlockers: BookDraftDockSummaryItem[]
}

interface BookDraftBottomDockProps {
  summary: BookDraftDockSummaryViewModel
  activity: BookWorkbenchActivityItem[]
  activeDraftView?: BookDraftView
  compareProblems?: BookDraftCompareProblems | null
  branchProblems?: BookDraftBranchProblems | null
  exportProblems?: BookDraftExportProblems | null
  reviewProblems?: BookDraftReviewProblems | null
  exportError?: Error | null
}

function SupportList({
  title,
  items,
  emptyTitle,
  emptyMessage,
}: {
  title: string
  items: BookDraftDockSummaryItem[]
  emptyTitle: string
  emptyMessage: string
}) {
  if (items.length === 0) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{title}</p>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.chapterId} className="rounded-md border border-line-soft bg-surface-2 p-3">
            <p className="font-medium text-text-main">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-text-muted">{item.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

function getActivityMeta(locale: 'en' | 'zh-CN', item: BookWorkbenchActivityItem) {
  if (item.kind === 'lens') {
    return 'Lens'
  }

  if (item.kind === 'chapter') {
    return locale === 'zh-CN' ? '章节' : 'Chapter'
  }

  if (item.kind === 'draft-view') {
    return 'Draft'
  }

  if (item.kind === 'checkpoint') {
    return 'Checkpoint'
  }

  if (item.kind === 'branch') {
    return locale === 'zh-CN' ? '实验稿' : 'Branch'
  }

  if (item.kind === 'branch-baseline') {
    return locale === 'zh-CN' ? '基线' : 'Baseline'
  }

  if (item.kind === 'export-profile') {
    return locale === 'zh-CN' ? '导出配置' : 'Profile'
  }

  if (
    item.kind === 'review-filter' ||
    item.kind === 'review-issue' ||
    item.kind === 'review-decision' ||
    item.kind === 'review-fix-action' ||
    item.kind === 'review-source'
  ) {
    return locale === 'zh-CN' ? '审阅' : 'Review'
  }

  if (item.kind === 'export-artifact') {
    return locale === 'zh-CN' ? 'Artifact' : 'Artifact'
  }

  return locale === 'zh-CN' ? '跳转' : 'Handoff'
}

export function BookDraftBottomDock({
  summary,
  activity,
  activeDraftView = 'read',
  compareProblems = null,
  branchProblems = null,
  exportProblems = null,
  reviewProblems = null,
  exportError = null,
}: BookDraftBottomDockProps) {
  const { locale } = useI18n()
  const compareMode = activeDraftView === 'compare' && compareProblems !== null
  const branchMode = activeDraftView === 'branch' && branchProblems !== null
  const exportMode = activeDraftView === 'export' && exportProblems !== null
  const reviewMode = activeDraftView === 'review' && reviewProblems !== null
  const exportErrorMode = activeDraftView === 'export' && exportError !== null && exportProblems === null
  const problemFactItems = compareMode
    ? [
        { id: 'changed-chapters', label: locale === 'zh-CN' ? '变更章节' : 'Changed chapters', value: `${compareProblems.changedChapterCount}` },
        { id: 'draft-missing-scenes', label: locale === 'zh-CN' ? '当前缺稿场景' : 'Draft missing scenes', value: `${compareProblems.draftMissingSceneCount}` },
        { id: 'trace-regressions', label: locale === 'zh-CN' ? '溯源回退' : 'Trace regressions', value: `${compareProblems.traceRegressionCount}` },
        { id: 'warnings-increased', label: locale === 'zh-CN' ? '警告上升章节' : 'Warnings increased chapters', value: `${compareProblems.warningsIncreasedChapterCount}` },
        { id: 'checkpoint-missing', label: locale === 'zh-CN' ? 'Checkpoint 缺失段落' : 'Checkpoint missing sections', value: `${compareProblems.checkpointMissingSectionCount}` },
      ]
    : branchMode
      ? [
          { id: 'branch-blockers', label: locale === 'zh-CN' ? '实验稿阻塞' : 'Branch blockers', value: `${branchProblems.blockerCount}` },
          { id: 'branch-warnings', label: locale === 'zh-CN' ? '实验稿警告' : 'Branch warnings', value: `${branchProblems.warningCount}` },
          { id: 'branch-draft-missing', label: locale === 'zh-CN' ? '缺稿场景' : 'Draft missing scenes', value: `${branchProblems.draftMissingSceneCount}` },
          { id: 'branch-trace-regressions', label: locale === 'zh-CN' ? '溯源回退' : 'Trace regressions', value: `${branchProblems.traceRegressionCount}` },
          { id: 'branch-warning-increases', label: locale === 'zh-CN' ? '警告上升' : 'Warning increases', value: `${branchProblems.warningIncreaseCount}` },
          { id: 'branch-added-without-source', label: locale === 'zh-CN' ? '无来源新增' : 'Added without source', value: `${branchProblems.addedWithoutSourceCount}` },
        ]
      : exportMode
        ? [
            { id: 'export-blockers', label: locale === 'zh-CN' ? '阻塞项' : 'Blockers', value: `${exportProblems.blockerCount}` },
            { id: 'export-warnings', label: locale === 'zh-CN' ? '警告' : 'Warnings', value: `${exportProblems.warningCount}` },
            { id: 'export-trace-gaps', label: locale === 'zh-CN' ? '缺溯源场景' : 'Trace gaps', value: `${exportProblems.traceGapCount}` },
            { id: 'export-missing-drafts', label: locale === 'zh-CN' ? '缺稿场景' : 'Missing drafts', value: `${exportProblems.missingDraftCount}` },
            { id: 'export-compare-regressions', label: locale === 'zh-CN' ? 'Compare 回退' : 'Compare regressions', value: `${exportProblems.compareRegressionCount}` },
            {
              id: 'export-artifact-readiness-blockers',
              label: locale === 'zh-CN' ? 'Artifact readiness blockers' : 'Artifact readiness blockers',
              value: `${exportProblems.artifactReadinessBlockerCount ?? 0}`,
            },
            {
              id: 'export-artifact-review-blockers',
              label: locale === 'zh-CN' ? 'Artifact review blockers' : 'Artifact review blockers',
              value: `${exportProblems.artifactReviewBlockerCount ?? 0}`,
            },
            {
              id: 'export-artifact-warnings',
              label: locale === 'zh-CN' ? 'Artifact gate warnings' : 'Artifact gate warnings',
              value: `${exportProblems.artifactWarningCount ?? 0}`,
            },
            {
              id: 'export-artifact-stale',
              label: locale === 'zh-CN' ? 'Stale artifacts' : 'Stale artifacts',
              value: `${exportProblems.staleArtifactCount ?? 0}`,
            },
          ]
        : reviewMode
          ? [
              { id: 'review-blockers', label: locale === 'zh-CN' ? '阻塞项' : 'Blockers', value: `${reviewProblems.blockerCount}` },
              { id: 'review-trace-gaps', label: locale === 'zh-CN' ? '溯源缺口' : 'Trace gaps', value: `${reviewProblems.traceGapCount}` },
              { id: 'review-missing-drafts', label: locale === 'zh-CN' ? '缺稿' : 'Missing drafts', value: `${reviewProblems.missingDraftCount}` },
              { id: 'review-export-blockers', label: locale === 'zh-CN' ? '导出阻塞' : 'Export blockers', value: `${reviewProblems.exportBlockerCount}` },
              { id: 'review-branch-blockers', label: locale === 'zh-CN' ? '实验稿阻塞' : 'Branch blockers', value: `${reviewProblems.branchBlockerCount}` },
              { id: 'review-open', label: locale === 'zh-CN' ? 'Open' : 'Open', value: `${reviewProblems.openCount}` },
              { id: 'review-actioned', label: locale === 'zh-CN' ? 'Actioned' : 'Actioned', value: `${reviewProblems.actionedCount}` },
              { id: 'review-stale', label: locale === 'zh-CN' ? 'Decision stale' : 'Decision stale', value: `${reviewProblems.staleCount}` },
              {
                id: 'review-open-without-fix',
                label: locale === 'zh-CN' ? 'Open without fix started' : 'Open without fix started',
                value: `${reviewProblems.openWithoutFixStartedCount}`,
              },
              {
                id: 'review-blocked-source-fixes',
                label: locale === 'zh-CN' ? 'Blocked source fixes' : 'Blocked source fixes',
                value: `${reviewProblems.blockedFixCount}`,
              },
              {
                id: 'review-stale-source-fixes',
                label: locale === 'zh-CN' ? 'Stale source fixes' : 'Stale source fixes',
                value: `${reviewProblems.staleFixCount}`,
              },
              {
                id: 'review-checked-still-open',
                label: locale === 'zh-CN' ? 'Checked but still open' : 'Checked but still open',
                value: `${reviewProblems.checkedStillOpenCount}`,
              },
            ]
        : [
            { id: 'missing-draft-count', label: locale === 'zh-CN' ? '缺稿章节' : 'Missing draft chapters', value: `${summary.missingDraftChapterCount}` },
            { id: 'missing-trace-count', label: locale === 'zh-CN' ? '缺溯源章节' : 'Missing trace chapters', value: `${summary.missingTraceChapterCount}` },
            { id: 'warnings-count', label: locale === 'zh-CN' ? '警告章节' : 'Warning chapters', value: `${summary.warningsChapterCount}` },
            { id: 'queued-count', label: locale === 'zh-CN' ? '待处理修订章节' : 'Queued revision chapters', value: `${summary.queuedRevisionChapterCount}` },
          ]

  return (
    <section
      aria-label={locale === 'zh-CN' ? '书籍草稿底部面板' : 'Book draft bottom dock'}
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <PaneHeader
        title={locale === 'zh-CN' ? '问题 / 活动' : 'Problems / Activity'}
        description={
          locale === 'zh-CN'
            ? '底部面板继续只承接书籍级判断支持和会话活动，不复制主阅读区。'
            : 'The dock keeps book-level judgment support and session activity close without duplicating the manuscript reader.'
        }
      />
      <div className="grid min-h-0 flex-1 gap-4 overflow-auto p-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <SectionCard title={locale === 'zh-CN' ? '问题' : 'Problems'} eyebrow={locale === 'zh-CN' ? '阅读支持' : 'Reading Support'}>
          {exportErrorMode ? (
            <EmptyState
              title={locale === 'zh-CN' ? '导出基线不可用' : 'Export baseline unavailable'}
              message={exportError.message}
            />
          ) : (
          <div className="space-y-4">
            <FactList items={problemFactItems} />
            <SupportList
              title={
                compareMode
                  ? locale === 'zh-CN'
                    ? '变更章节'
                    : 'Changed chapters'
                  : branchMode
                    ? locale === 'zh-CN'
                      ? '实验稿阻塞'
                      : 'Branch blockers'
                  : exportMode
                    ? locale === 'zh-CN'
                      ? '阻塞项'
                      : 'Blockers'
                    : reviewMode
                      ? locale === 'zh-CN'
                        ? '阻塞项'
                        : 'Blockers'
                    : locale === 'zh-CN'
                      ? '缺稿'
                      : 'Missing drafts'
              }
              items={compareMode ? compareProblems.changedChapters : branchMode ? branchProblems.blockers : exportMode ? exportProblems.blockers : reviewMode ? reviewProblems.blockers : summary.missingDraftChapters}
              emptyTitle={
                compareMode
                  ? locale === 'zh-CN'
                    ? '当前没有变更章节'
                    : 'No changed chapters'
                  : branchMode
                    ? locale === 'zh-CN'
                      ? '当前没有实验稿阻塞'
                      : 'No branch blockers'
                  : exportMode
                    ? locale === 'zh-CN'
                      ? '当前没有阻塞项'
                      : 'No blockers'
                  : reviewMode
                    ? locale === 'zh-CN'
                      ? '当前没有阻塞项'
                      : 'No blockers'
                  : locale === 'zh-CN'
                    ? '没有缺稿章节'
                    : 'No missing draft chapters'
              }
              emptyMessage={
                compareMode
                  ? locale === 'zh-CN'
                    ? '当前 compare 结果没有章节级变更。'
                    : 'The current compare pass has no chapter-level changes.'
                  : branchMode
                    ? locale === 'zh-CN'
                      ? '当前实验稿相对基线没有阻塞项。'
                      : 'The current branch has no blockers against the selected baseline.'
                  : exportMode
                    ? locale === 'zh-CN'
                      ? '当前导出预览没有阻塞项。'
                      : 'The current export preview has no blockers.'
                  : reviewMode
                    ? locale === 'zh-CN'
                      ? '当前 review 队列里没有阻塞项。'
                      : 'The current review queue has no blockers.'
                  : locale === 'zh-CN'
                    ? '当前每个章节都有可读正文。'
                    : 'Every chapter currently has readable draft prose.'
              }
            />
            <SupportList
              title={
                compareMode
                  ? locale === 'zh-CN'
                    ? '当前缺稿场景'
                    : 'Draft missing scenes'
                  : branchMode
                    ? locale === 'zh-CN'
                      ? '实验稿警告'
                      : 'Branch warnings'
                  : exportMode
                    ? locale === 'zh-CN'
                      ? '警告'
                      : 'Warnings'
                    : reviewMode
                      ? locale === 'zh-CN'
                        ? '溯源缺口'
                        : 'Trace gaps'
                    : locale === 'zh-CN'
                      ? '缺溯源'
                      : 'Missing trace'
              }
              items={compareMode ? compareProblems.missingDraftScenes : branchMode ? branchProblems.warnings : exportMode ? exportProblems.warnings : reviewMode ? reviewProblems.traceGaps : summary.missingTraceChapters}
              emptyTitle={
                compareMode
                  ? locale === 'zh-CN'
                    ? '当前没有缺稿场景'
                    : 'No draft-missing scenes'
                  : branchMode
                    ? locale === 'zh-CN'
                      ? '当前没有实验稿警告'
                      : 'No branch warnings'
                  : exportMode
                    ? locale === 'zh-CN'
                      ? '当前没有警告'
                      : 'No warnings'
                  : reviewMode
                    ? locale === 'zh-CN'
                      ? '当前没有溯源缺口'
                      : 'No trace gaps'
                  : locale === 'zh-CN'
                    ? '没有缺溯源章节'
                    : 'No missing trace chapters'
              }
              emptyMessage={
                compareMode
                  ? locale === 'zh-CN'
                    ? '当前 compare 结果里没有 draft_missing 场景。'
                    : 'No compare rows are currently marked draft_missing.'
                  : branchMode
                    ? locale === 'zh-CN'
                      ? '当前实验稿没有额外警告。'
                      : 'The current branch has no additional warnings against the baseline.'
                  : exportMode
                    ? locale === 'zh-CN'
                      ? '当前导出预览没有额外警告。'
                      : 'The current export preview has no extra warnings.'
                  : reviewMode
                    ? locale === 'zh-CN'
                      ? '当前 review 队列里没有额外溯源缺口。'
                      : 'The current review queue has no extra trace gaps.'
                  : locale === 'zh-CN'
                    ? '当前每个章节都已有 trace rollup。'
                    : 'Every chapter currently has a trace rollup.'
              }
            />
            <SupportList
              title={
                compareMode
                  ? locale === 'zh-CN'
                    ? '溯源回退'
                    : 'Trace regressions'
                  : branchMode
                    ? locale === 'zh-CN'
                      ? '缺稿场景'
                      : 'Draft missing scenes'
                  : exportMode
                    ? locale === 'zh-CN'
                      ? '缺溯源'
                      : 'Trace gaps'
                    : reviewMode
                      ? locale === 'zh-CN'
                        ? '缺稿'
                        : 'Missing drafts'
                    : locale === 'zh-CN'
                      ? '高压章节'
                      : 'Highest pressure'
              }
              items={compareMode ? compareProblems.traceRegressions : branchMode ? branchProblems.draftMissingScenes : exportMode ? exportProblems.traceGaps : reviewMode ? reviewProblems.missingDrafts : summary.highestPressureChapters}
              emptyTitle={
                compareMode
                  ? locale === 'zh-CN'
                    ? '当前没有溯源回退'
                    : 'No trace regressions'
                  : branchMode
                    ? locale === 'zh-CN'
                      ? '当前没有缺稿场景'
                      : 'No draft missing scenes'
                  : exportMode
                    ? locale === 'zh-CN'
                      ? '当前没有溯源缺口'
                      : 'No trace gaps'
                  : reviewMode
                    ? locale === 'zh-CN'
                      ? '当前没有缺稿'
                      : 'No missing drafts'
                  : locale === 'zh-CN'
                    ? '当前没有高压章节'
                    : 'No high-pressure chapters'
              }
              emptyMessage={
                compareMode
                  ? locale === 'zh-CN'
                    ? '当前 compare 结果没有 trace regression。'
                    : 'The current compare pass has no trace regressions.'
                  : branchMode
                    ? locale === 'zh-CN'
                      ? '当前实验稿没有 draft_missing 场景。'
                      : 'The current branch has no draft-missing scenes.'
                  : exportMode
                    ? locale === 'zh-CN'
                      ? '当前导出预览没有额外溯源缺口。'
                      : 'The current export preview has no extra trace gaps.'
                  : reviewMode
                    ? locale === 'zh-CN'
                      ? '当前 review 队列里没有额外缺稿项。'
                      : 'The current review queue has no extra missing drafts.'
                  : locale === 'zh-CN'
                    ? '当前阅读轮次比较平稳。'
                    : 'The current manuscript pass is relatively calm.'
              }
            />
            {compareMode ? (
              <>
                <SupportList
                  title={locale === 'zh-CN' ? '警告上升章节' : 'Warnings increased chapters'}
                  items={compareProblems.warningsIncreasedChapters}
                  emptyTitle={locale === 'zh-CN' ? '当前没有警告上升章节' : 'No warnings increased chapters'}
                  emptyMessage={
                    locale === 'zh-CN'
                      ? '当前 compare 结果没有章节的 warnings 继续上升。'
                      : 'No chapters currently show increased warnings against the checkpoint.'
                  }
                />
                <SupportList
                  title={locale === 'zh-CN' ? 'Checkpoint 缺失段落' : 'Checkpoint missing sections'}
                  items={compareProblems.checkpointMissingSections}
                  emptyTitle={locale === 'zh-CN' ? '当前没有 checkpoint 缺失段落' : 'No checkpoint missing sections'}
                  emptyMessage={
                    locale === 'zh-CN'
                      ? '当前 compare 结果没有只存在于 checkpoint 的段落。'
                      : 'No sections currently exist only in the checkpoint.'
                  }
                />
              </>
            ) : branchMode ? (
              <>
                <SupportList
                  title={locale === 'zh-CN' ? '溯源回退' : 'Trace regressions'}
                  items={branchProblems.traceRegressions}
                  emptyTitle={locale === 'zh-CN' ? '当前没有溯源回退' : 'No trace regressions'}
                  emptyMessage={
                    locale === 'zh-CN'
                      ? '当前实验稿没有相对基线的溯源回退。'
                      : 'The current branch has no trace regressions against the baseline.'
                  }
                />
                <SupportList
                  title={locale === 'zh-CN' ? '警告上升' : 'Warning increases'}
                  items={branchProblems.warningIncreases}
                  emptyTitle={locale === 'zh-CN' ? '当前没有警告上升' : 'No warning increases'}
                  emptyMessage={
                    locale === 'zh-CN'
                      ? '当前实验稿没有额外警告增长。'
                      : 'The current branch does not increase warnings against the baseline.'
                  }
                />
                <SupportList
                  title={locale === 'zh-CN' ? '无来源新增' : 'Added without source'}
                  items={branchProblems.addedWithoutSource}
                  emptyTitle={locale === 'zh-CN' ? '当前没有无来源新增' : 'No added scenes without source'}
                  emptyMessage={
                    locale === 'zh-CN'
                      ? '当前实验稿的新增场景都已经挂上来源提案。'
                      : 'All added branch scenes currently point back to a source proposal.'
                  }
                />
              </>
            ) : exportMode ? (
              <>
                <SupportList
                  title={locale === 'zh-CN' ? 'Artifact gate' : 'Artifact gate'}
                  items={exportProblems.artifactGateProblems ?? []}
                  emptyTitle={locale === 'zh-CN' ? 'Artifact gate 已就绪' : 'Artifact gate ready'}
                  emptyMessage={
                    locale === 'zh-CN'
                      ? '当前 artifact gate 没有额外阻塞或 stale 提示。'
                      : 'The current artifact gate has no extra blockers or stale artifact warnings.'
                  }
                />
                <SupportList
                  title={locale === 'zh-CN' ? '缺稿' : 'Missing drafts'}
                  items={exportProblems.missingDrafts}
                  emptyTitle={locale === 'zh-CN' ? '当前没有缺稿场景' : 'No missing drafts'}
                  emptyMessage={
                    locale === 'zh-CN'
                      ? '当前导出预览没有额外缺稿场景。'
                      : 'The current export preview has no extra missing-draft scenes.'
                  }
                />
                <SupportList
                  title={locale === 'zh-CN' ? 'Compare 回退' : 'Compare regressions'}
                  items={exportProblems.compareRegressions}
                  emptyTitle={locale === 'zh-CN' ? '当前没有 Compare 回退' : 'No compare regressions'}
                  emptyMessage={
                    locale === 'zh-CN'
                      ? '当前导出预览没有额外 compare 回退。'
                      : 'The current export preview has no extra compare regressions.'
                  }
                />
              </>
            ) : reviewMode ? (
              <>
                <SupportList
                  title={locale === 'zh-CN' ? '导出阻塞' : 'Export blockers'}
                  items={reviewProblems.exportBlockers}
                  emptyTitle={locale === 'zh-CN' ? '当前没有导出阻塞' : 'No export blockers'}
                  emptyMessage={
                    locale === 'zh-CN'
                      ? '当前 review 队列里没有导出阻塞项。'
                      : 'The current review queue has no export blockers.'
                  }
                />
                <SupportList
                  title={locale === 'zh-CN' ? '实验稿阻塞' : 'Branch blockers'}
                  items={reviewProblems.branchBlockers}
                  emptyTitle={locale === 'zh-CN' ? '当前没有实验稿阻塞' : 'No branch blockers'}
                  emptyMessage={
                    locale === 'zh-CN'
                      ? '当前 review 队列里没有实验稿阻塞项。'
                      : 'The current review queue has no branch blockers.'
                  }
                />
              </>
            ) : null}
          </div>
          )}
        </SectionCard>
        <SectionCard title={locale === 'zh-CN' ? '活动' : 'Activity'} eyebrow={locale === 'zh-CN' ? '会话日志' : 'Session Log'}>
          {activity.length > 0 ? (
            <TimelineList
              items={activity.map((item) => ({
                id: item.id,
                title: item.title,
                detail: item.detail,
                tone: item.tone,
                meta: getActivityMeta(locale, item),
              }))}
            />
          ) : (
            <EmptyState
              title={locale === 'zh-CN' ? '会话很安静' : 'Quiet session'}
              message={
                locale === 'zh-CN'
                  ? '进入 draft lens、聚焦章节或发起 handoff 后，最近活动会在这里出现。'
                  : 'Recent draft-lens entries, chapter focus changes, and handoffs will appear here.'
              }
            />
          )}
        </SectionCard>
      </div>
    </section>
  )
}
