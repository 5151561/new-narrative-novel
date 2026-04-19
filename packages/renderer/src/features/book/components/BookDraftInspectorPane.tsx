import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { FactList } from '@/components/ui/FactList'
import { PaneHeader } from '@/components/ui/PaneHeader'

import { useI18n } from '@/app/i18n'
import type { BookDraftView } from '@/features/workbench/types/workbench-route'
import type { BookReviewInboxViewModel, ReviewIssueSeverity, ReviewSourceHandoffViewModel } from '@/features/review/types/review-view-models'

import { buildCompareReviewAttention } from '../lib/book-draft-compare-presentation'
import type { BookExperimentBranchWorkspaceViewModel } from '../types/book-branch-view-models'
import type { BookManuscriptCompareWorkspaceViewModel } from '../types/book-compare-view-models'
import type { BookDraftInspectorViewModel } from '../types/book-draft-view-models'
import type { BookExportPreviewWorkspaceViewModel } from '../types/book-export-view-models'

interface BookDraftInspectorPaneProps {
  bookTitle: string
  inspector: BookDraftInspectorViewModel
  activeDraftView?: BookDraftView
  compare?: BookManuscriptCompareWorkspaceViewModel | null
  branch?: BookExperimentBranchWorkspaceViewModel | null
  exportPreview?: BookExportPreviewWorkspaceViewModel | null
  exportError?: Error | null
  reviewInbox?: BookReviewInboxViewModel | null
  onOpenReviewSource?: (handoff: ReviewSourceHandoffViewModel) => void
  checkpointMeta?: {
    title: string
    createdAtLabel: string
    summary: string
  } | null
}

export function BookDraftInspectorPane({
  bookTitle,
  inspector,
  activeDraftView = 'read',
  compare = null,
  branch = null,
  exportPreview = null,
  exportError = null,
  reviewInbox = null,
  onOpenReviewSource,
  checkpointMeta = null,
}: BookDraftInspectorPaneProps) {
  const { locale } = useI18n()
  const selectedChapter = inspector.selectedChapter
  const compareSelectedChapter = compare?.selectedChapter ?? null
  const compareAttention = buildCompareReviewAttention(compareSelectedChapter)
  const branchSelectedChapter = branch?.selectedChapter ?? null
  const branchBlockers = branch?.readiness.issues.filter((issue) => issue.severity === 'blocker') ?? []
  const branchWarnings = branch?.readiness.issues.filter((issue) => issue.severity === 'warning') ?? []
  const reviewSelectedIssue = reviewInbox?.selectedIssue ?? null

  const getReviewSeverityBadge = (severity: ReviewIssueSeverity) => {
    if (severity === 'blocker') {
      return { tone: 'danger' as const, label: locale === 'zh-CN' ? '阻塞项' : 'Blocker' }
    }

    if (severity === 'warning') {
      return { tone: 'warn' as const, label: locale === 'zh-CN' ? '警告' : 'Warning' }
    }

    return { tone: 'neutral' as const, label: locale === 'zh-CN' ? '信息' : 'Info' }
  }

  const getBranchStatusLabel = (status: NonNullable<BookExperimentBranchWorkspaceViewModel['branch']>['status']) => {
    if (locale === 'zh-CN') {
      return status === 'active' ? '进行中' : status === 'review' ? '审阅中' : '已归档'
    }

    return status === 'active' ? 'Active' : status === 'review' ? 'In Review' : 'Archived'
  }

  const getFixActionBadge = (status: NonNullable<typeof reviewSelectedIssue>['fixAction']['status']) => {
    if (status === 'checked') {
      return { tone: 'success' as const, label: locale === 'zh-CN' ? 'Checked' : 'Checked' }
    }
    if (status === 'blocked') {
      return { tone: 'danger' as const, label: locale === 'zh-CN' ? 'Blocked' : 'Blocked' }
    }
    if (status === 'stale') {
      return { tone: 'warn' as const, label: locale === 'zh-CN' ? 'Fix stale' : 'Fix stale' }
    }
    if (status === 'started') {
      return { tone: 'accent' as const, label: locale === 'zh-CN' ? 'Fix started' : 'Fix started' }
    }

    return { tone: 'neutral' as const, label: locale === 'zh-CN' ? 'Not started' : 'Not started' }
  }

  const getFixTargetLabel = () => {
    if (!reviewSelectedIssue?.primaryFixHandoff) {
      return locale === 'zh-CN' ? 'No recommended source target' : 'No recommended source target'
    }

    return `${reviewSelectedIssue.primaryFixHandoff.label} · ${reviewSelectedIssue.primaryFixHandoff.target.scope}`
  }

  const formatSignedValue = (value: number) => `${value > 0 ? '+' : ''}${value}`

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <PaneHeader title={selectedChapter?.title ?? bookTitle} description={bookTitle} />
      <div className="min-h-0 flex-1 space-y-3 overflow-auto p-4">
        {activeDraftView === 'export' && exportError && !exportPreview ? (
          <section className="rounded-md border border-line-soft bg-surface-2 p-4">
            <h4 className="text-base text-text-main">{locale === 'zh-CN' ? '导出基线不可用' : 'Export baseline unavailable'}</h4>
            <div className="mt-4">
              <EmptyState
                title={locale === 'zh-CN' ? '无法检查导出准备度' : 'Export readiness unavailable'}
                message={exportError.message}
              />
            </div>
          </section>
        ) : (
          <>
        <section className="rounded-md border border-line-soft bg-surface-2 p-4">
          <h4 className="text-base text-text-main">{locale === 'zh-CN' ? '选中章节' : 'Selected Chapter'}</h4>
          <div className="mt-3 space-y-3">
            <div className="rounded-md border border-line-soft bg-surface-1 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-text-main">{selectedChapter?.title ?? bookTitle}</p>
                {selectedChapter ? (
                  <Badge tone={selectedChapter.missingDraftCount > 0 || selectedChapter.missingTraceSceneCount > 0 ? 'warn' : 'success'}>
                    {selectedChapter.missingDraftCount > 0 || selectedChapter.missingTraceSceneCount > 0
                      ? locale === 'zh-CN'
                        ? '需关注'
                        : 'Attention'
                      : locale === 'zh-CN'
                        ? '已就绪'
                        : 'Ready'}
                  </Badge>
                ) : null}
              </div>
              <p className="mt-2 text-sm leading-6 text-text-muted">
                {selectedChapter?.summary ??
                  (locale === 'zh-CN' ? '当前还没有选中章节。' : 'No chapter is selected yet.')}
              </p>
              {selectedChapter?.topLatestDiffSummary ? (
                <p className="mt-2 text-sm text-text-main">{selectedChapter.topLatestDiffSummary}</p>
              ) : null}
            </div>
            {selectedChapter ? (
              <FactList
                items={[
                  { id: 'drafted-scenes', label: locale === 'zh-CN' ? '已起草场景' : 'Drafted scenes', value: `${selectedChapter.draftedSceneCount}` },
                  { id: 'missing-scenes', label: locale === 'zh-CN' ? '缺稿场景' : 'Missing drafts', value: `${selectedChapter.missingDraftCount}` },
                  { id: 'trace-scenes', label: locale === 'zh-CN' ? '缺溯源场景' : 'Missing trace', value: `${selectedChapter.missingTraceSceneCount}` },
                  { id: 'words', label: locale === 'zh-CN' ? '装配字数' : 'Assembled words', value: `${selectedChapter.assembledWordCount}` },
                ]}
              />
            ) : null}
          </div>
        </section>
        {activeDraftView === 'compare' && compareSelectedChapter ? (
          <>
            <section className="rounded-md border border-line-soft bg-surface-2 p-4">
              <h4 className="text-base text-text-main">{locale === 'zh-CN' ? '选中章节 Compare 摘要' : 'Selected chapter compare summary'}</h4>
              <div className="mt-3">
                <FactList
                  items={[
                    { id: 'compare-changed-scenes', label: locale === 'zh-CN' ? '变更场景' : 'Changed scenes', value: `${compareSelectedChapter.totals.changedCount}` },
                    { id: 'compare-added-scenes', label: locale === 'zh-CN' ? '新增场景' : 'Added scenes', value: `${compareSelectedChapter.totals.addedCount}` },
                    { id: 'compare-missing-scenes', label: locale === 'zh-CN' ? '缺失场景' : 'Missing scenes', value: `${compareSelectedChapter.totals.missingCount}` },
                    { id: 'compare-word-delta', label: locale === 'zh-CN' ? '字数变化' : 'Word delta', value: `${compareSelectedChapter.wordDelta > 0 ? '+' : ''}${compareSelectedChapter.wordDelta}` },
                    { id: 'compare-trace-regression', label: locale === 'zh-CN' ? '溯源回退' : 'Trace regressions', value: `${compareSelectedChapter.traceRegressionCount}` },
                    { id: 'compare-warnings-delta', label: locale === 'zh-CN' ? '警告变化' : 'Warnings delta', value: `${compareSelectedChapter.warningsDelta > 0 ? '+' : ''}${compareSelectedChapter.warningsDelta}` },
                  ]}
                />
              </div>
            </section>
            <section className="rounded-md border border-line-soft bg-surface-2 p-4">
              <h4 className="text-base text-text-main">{locale === 'zh-CN' ? 'Checkpoint' : 'Checkpoint'}</h4>
              <div className="mt-3 rounded-md border border-line-soft bg-surface-1 p-3">
                <p className="text-sm font-medium text-text-main">{checkpointMeta?.title ?? compare.checkpoint.title}</p>
                <p className="mt-2 text-sm text-text-muted">{checkpointMeta?.createdAtLabel ?? compare.checkpoint.createdAtLabel}</p>
                <p className="mt-2 text-sm leading-6 text-text-muted">{checkpointMeta?.summary ?? compare.checkpoint.summary}</p>
              </div>
            </section>
            <section className="rounded-md border border-line-soft bg-surface-2 p-4">
              <h4 className="text-base text-text-main">{locale === 'zh-CN' ? '复核关注点' : 'Review attention'}</h4>
              <div className="mt-3 space-y-3">
                <div className="rounded-md border border-line-soft bg-surface-1 p-3">
                  <p className="text-sm font-medium text-text-main">{locale === 'zh-CN' ? '主要变化场景' : 'Top changed scenes'}</p>
                  <p className="mt-2 text-sm leading-6 text-text-muted">
                    {compareAttention.topChangedScenes.length
                      ? compareAttention.topChangedScenes.join(locale === 'zh-CN' ? '、' : ', ')
                      : locale === 'zh-CN'
                        ? '当前没有突出变化场景。'
                        : 'No standout changed scenes are visible right now.'}
                  </p>
                </div>
                <div className="rounded-md border border-line-soft bg-surface-1 p-3">
                  <p className="text-sm font-medium text-text-main">{locale === 'zh-CN' ? '缺稿 / 缺失场景' : 'Missing draft scenes'}</p>
                  <p className="mt-2 text-sm leading-6 text-text-muted">
                    {compareAttention.missingScenes.length
                      ? compareAttention.missingScenes.join(locale === 'zh-CN' ? '、' : ', ')
                      : locale === 'zh-CN'
                        ? '当前没有缺稿或缺失场景。'
                        : 'No missing or draft-missing scenes are visible right now.'}
                  </p>
                </div>
                <div className="rounded-md border border-line-soft bg-surface-1 p-3">
                  <p className="text-sm font-medium text-text-main">{locale === 'zh-CN' ? '溯源回退提示' : 'Trace regression hints'}</p>
                  <p className="mt-2 text-sm leading-6 text-text-muted">
                    {compareAttention.traceRegressionHints.length
                      ? compareAttention.traceRegressionHints.join(locale === 'zh-CN' ? '、' : ', ')
                      : locale === 'zh-CN'
                        ? '当前没有溯源回退提示。'
                        : 'No trace regressions are currently visible.'}
                  </p>
                </div>
              </div>
            </section>
          </>
        ) : null}
        {activeDraftView === 'branch' && branch ? (
          <>
            <section className="rounded-md border border-line-soft bg-surface-2 p-4">
              <h4 className="text-base text-text-main">{locale === 'zh-CN' ? '选中实验稿' : 'Selected branch'}</h4>
              <div className="mt-3 space-y-3">
                <div className="rounded-md border border-line-soft bg-surface-1 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-text-main">{branch.branch?.title ?? bookTitle}</p>
                    {branch.branch ? <Badge tone="accent">{getBranchStatusLabel(branch.branch.status)}</Badge> : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-text-muted">
                    {branch.branch?.rationale ??
                      branch.branch?.summary ??
                      (locale === 'zh-CN'
                        ? '当前实验稿还没有附加说明。'
                        : 'The selected branch does not currently include extra rationale.')}
                  </p>
                </div>
                <FactList
                  items={[
                    {
                      id: 'branch-baseline-label',
                      label: locale === 'zh-CN' ? '基线' : 'Baseline',
                      value: branch.baseline.label,
                    },
                    {
                      id: 'branch-status',
                      label: locale === 'zh-CN' ? '状态' : 'Status',
                      value: branch.branch ? getBranchStatusLabel(branch.branch.status) : '—',
                    },
                  ]}
                />
              </div>
            </section>
            <section className="rounded-md border border-line-soft bg-surface-2 p-4">
              <h4 className="text-base text-text-main">{locale === 'zh-CN' ? '选中章节实验稿摘要' : 'Selected chapter branch summary'}</h4>
              {branchSelectedChapter ? (
                <div className="mt-3 space-y-3">
                  <div className="rounded-md border border-line-soft bg-surface-1 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-text-main">{branchSelectedChapter.title}</p>
                      <Badge tone={branchSelectedChapter.readinessStatus === 'blocked' ? 'danger' : branchSelectedChapter.readinessStatus === 'attention' ? 'warn' : 'success'}>
                        {branchSelectedChapter.readinessStatus === 'blocked'
                          ? locale === 'zh-CN'
                            ? '阻塞'
                            : 'Blocked'
                          : branchSelectedChapter.readinessStatus === 'attention'
                            ? locale === 'zh-CN'
                              ? '需关注'
                              : 'Attention'
                            : locale === 'zh-CN'
                              ? '已就绪'
                              : 'Ready'}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-text-muted">{branchSelectedChapter.summary}</p>
                  </div>
                  <FactList
                    items={[
                      { id: 'branch-changed-scenes', label: locale === 'zh-CN' ? '变更场景' : 'Changed scenes', value: `${branchSelectedChapter.changedSceneCount}` },
                      { id: 'branch-added-scenes', label: locale === 'zh-CN' ? '新增场景' : 'Added scenes', value: `${branchSelectedChapter.addedSceneCount}` },
                      { id: 'branch-missing-scenes', label: locale === 'zh-CN' ? '缺失场景' : 'Missing scenes', value: `${branchSelectedChapter.missingSceneCount}` },
                      { id: 'branch-draft-missing-scenes', label: locale === 'zh-CN' ? '缺稿场景' : 'Draft missing', value: `${branchSelectedChapter.draftMissingSceneCount}` },
                      { id: 'branch-word-delta', label: locale === 'zh-CN' ? '字数变化' : 'Word delta', value: formatSignedValue(branchSelectedChapter.wordDelta) },
                      { id: 'branch-trace-regressions', label: locale === 'zh-CN' ? '溯源回退' : 'Trace regressions', value: `${branchSelectedChapter.traceRegressionCount}` },
                      { id: 'branch-trace-improvements', label: locale === 'zh-CN' ? '溯源改善' : 'Trace improvements', value: `${branchSelectedChapter.traceImprovementCount}` },
                      { id: 'branch-warnings-delta', label: locale === 'zh-CN' ? '警告变化' : 'Warnings delta', value: formatSignedValue(branchSelectedChapter.warningsDelta) },
                    ]}
                  />
                </div>
              ) : (
                <div className="mt-3">
                  <EmptyState
                    title={locale === 'zh-CN' ? '还没有章节焦点' : 'No chapter selected'}
                    message={
                      locale === 'zh-CN'
                        ? '请先从左侧章节列表里选择一个章节。'
                        : 'Choose a chapter from the binder to inspect the branch summary.'
                    }
                  />
                </div>
              )}
            </section>
            <section className="rounded-md border border-line-soft bg-surface-2 p-4">
              <h4 className="text-base text-text-main">{locale === 'zh-CN' ? '实验稿准备度' : 'Branch readiness'}</h4>
              <div className="mt-3 space-y-3">
                <div className="rounded-md border border-line-soft bg-surface-1 p-3">
                  <p className="text-sm font-medium text-text-main">{branch.readiness.label}</p>
                  <p className="mt-2 text-sm leading-6 text-text-muted">
                    {branchBlockers.length > 0
                      ? branchBlockers.slice(0, 2).map((issue) => issue.title).join(locale === 'zh-CN' ? '、' : ', ')
                      : branchWarnings.length > 0
                        ? branchWarnings.slice(0, 2).map((issue) => issue.title).join(locale === 'zh-CN' ? '、' : ', ')
                        : locale === 'zh-CN'
                          ? '当前没有额外阻塞或警告。'
                          : 'No extra blockers or warnings are visible right now.'}
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-md border border-line-soft bg-surface-1 p-3">
                    <p className="text-sm font-medium text-text-main">{locale === 'zh-CN' ? '主要阻塞' : 'Top blockers'}</p>
                    <p className="mt-2 text-sm leading-6 text-text-muted">
                      {branchBlockers.length > 0
                        ? branchBlockers.slice(0, 3).map((issue) => issue.title).join(locale === 'zh-CN' ? '、' : ', ')
                        : locale === 'zh-CN'
                          ? '当前没有阻塞项。'
                          : 'No blockers are currently visible.'}
                    </p>
                  </div>
                  <div className="rounded-md border border-line-soft bg-surface-1 p-3">
                    <p className="text-sm font-medium text-text-main">{locale === 'zh-CN' ? '主要警告' : 'Top warnings'}</p>
                    <p className="mt-2 text-sm leading-6 text-text-muted">
                      {branchWarnings.length > 0
                        ? branchWarnings.slice(0, 3).map((issue) => issue.title).join(locale === 'zh-CN' ? '、' : ', ')
                        : locale === 'zh-CN'
                          ? '当前没有警告。'
                          : 'No warnings are currently visible.'}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : null}
        {activeDraftView === 'export' && exportPreview ? (
          <>
            <section className="rounded-md border border-line-soft bg-surface-2 p-4">
              <h4 className="text-base text-text-main">{locale === 'zh-CN' ? '导出配置' : 'Export Profile'}</h4>
              <div className="mt-3 rounded-md border border-line-soft bg-surface-1 p-3">
                <p className="text-sm font-medium text-text-main">{exportPreview.profile.title}</p>
                <p className="mt-2 text-sm text-text-muted">{exportPreview.profile.kind}</p>
                <p className="mt-2 text-sm leading-6 text-text-muted">{exportPreview.packageSummary.includedSections.join(', ')}</p>
              </div>
            </section>
            <section className="rounded-md border border-line-soft bg-surface-2 p-4">
              <h4 className="text-base text-text-main">{locale === 'zh-CN' ? '准备度' : 'Readiness'}</h4>
              <div className="mt-3 space-y-3">
                <div className="rounded-md border border-line-soft bg-surface-1 p-3">
                  <p className="text-sm font-medium text-text-main">{exportPreview.readiness.label}</p>
                  <p className="mt-2 text-sm leading-6 text-text-muted">
                    {exportPreview.readiness.issues.slice(0, 3).map((issue) => issue.title).join(locale === 'zh-CN' ? '、' : ', ') || (locale === 'zh-CN' ? '当前没有额外准备度问题。' : 'No extra readiness issues are visible right now.')}
                  </p>
                </div>
                <FactList
                  items={[
                    { id: 'export-blockers', label: locale === 'zh-CN' ? '阻塞项' : 'Blockers', value: `${exportPreview.readiness.blockerCount}` },
                    { id: 'export-warnings', label: locale === 'zh-CN' ? '警告' : 'Warnings', value: `${exportPreview.readiness.warningCount}` },
                    { id: 'export-package-size', label: locale === 'zh-CN' ? '包估算' : 'Package estimate', value: exportPreview.packageSummary.estimatedPackageLabel },
                    { id: 'export-changed-scenes', label: locale === 'zh-CN' ? 'Compare 变更场景' : 'Compare changed scenes', value: `${exportPreview.totals.compareChangedSceneCount}` },
                  ]}
                />
              </div>
            </section>
            <section className="rounded-md border border-line-soft bg-surface-2 p-4">
              <h4 className="text-base text-text-main">{locale === 'zh-CN' ? '选中章节导出' : 'Selected chapter export'}</h4>
              <div className="mt-3">
                <FactList
                  items={[
                    {
                      id: 'selected-export-status',
                      label: locale === 'zh-CN' ? '状态' : 'Status',
                      value:
                        exportPreview.selectedChapter?.readinessStatus === 'blocked'
                          ? locale === 'zh-CN'
                            ? '阻塞'
                            : 'Blocked'
                          : exportPreview.selectedChapter?.readinessStatus === 'attention'
                            ? locale === 'zh-CN'
                              ? '需关注'
                              : 'Attention'
                            : locale === 'zh-CN'
                              ? '已就绪'
                              : 'Ready',
                    },
                    {
                      id: 'selected-export-scenes',
                      label: locale === 'zh-CN' ? '纳入场景' : 'Included scenes',
                      value: `${exportPreview.selectedChapter?.scenes.filter((scene) => scene.isIncluded).length ?? 0}`,
                    },
                    {
                      id: 'selected-export-missing-drafts',
                      label: locale === 'zh-CN' ? '缺稿场景' : 'Missing drafts',
                      value: `${exportPreview.selectedChapter?.missingDraftCount ?? 0}`,
                    },
                    {
                      id: 'selected-export-trace-gaps',
                      label: locale === 'zh-CN' ? '缺溯源场景' : 'Trace gaps',
                      value: `${exportPreview.selectedChapter?.missingTraceCount ?? 0}`,
                    },
                  ]}
                />
              </div>
            </section>
          </>
        ) : null}
        {activeDraftView === 'review' && reviewInbox ? (
          <>
            <section className="rounded-md border border-line-soft bg-surface-2 p-4">
              <h4 className="text-base text-text-main">{locale === 'zh-CN' ? '选中审阅问题' : 'Selected review issue'}</h4>
              <div className="mt-3 space-y-3">
                {reviewSelectedIssue ? (
                  <>
                    <div className="rounded-md border border-line-soft bg-surface-1 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={getReviewSeverityBadge(reviewSelectedIssue.severity).tone}>
                          {getReviewSeverityBadge(reviewSelectedIssue.severity).label}
                        </Badge>
                        <Badge tone="neutral">{reviewSelectedIssue.sourceLabel}</Badge>
                      </div>
                      <p className="mt-3 text-sm font-medium text-text-main">{reviewSelectedIssue.title}</p>
                      <p className="mt-2 text-sm leading-6 text-text-muted">{reviewSelectedIssue.detail}</p>
                    </div>
                    <FactList
                      items={[
                        {
                          id: 'review-source',
                          label: locale === 'zh-CN' ? '来源' : 'Source',
                          value: reviewSelectedIssue.sourceLabel,
                        },
                        {
                          id: 'review-decision-status',
                          label: locale === 'zh-CN' ? 'Decision status' : 'Decision status',
                          value:
                            reviewSelectedIssue.decision.status === 'reviewed'
                              ? locale === 'zh-CN'
                                ? 'Reviewed'
                                : 'Reviewed'
                              : reviewSelectedIssue.decision.status === 'deferred'
                                ? locale === 'zh-CN'
                                  ? 'Deferred'
                                  : 'Deferred'
                                : reviewSelectedIssue.decision.status === 'dismissed'
                                  ? locale === 'zh-CN'
                                    ? 'Dismissed'
                                    : 'Dismissed'
                                  : reviewSelectedIssue.decision.status === 'stale'
                                    ? locale === 'zh-CN'
                                      ? 'Decision stale'
                                      : 'Decision stale'
                                    : locale === 'zh-CN'
                                      ? 'Open'
                                      : 'Open',
                        },
                        {
                          id: 'review-anchor',
                          label: locale === 'zh-CN' ? '章节 / 场景' : 'Chapter / Scene',
                          value: [reviewSelectedIssue.chapterTitle, reviewSelectedIssue.sceneTitle].filter(Boolean).join(' / ') || '—',
                        },
                        {
                          id: 'review-recommendation',
                          label: locale === 'zh-CN' ? '建议动作' : 'Recommendation',
                          value: reviewSelectedIssue.recommendation,
                        },
                        {
                          id: 'review-decision-note',
                          label: locale === 'zh-CN' ? 'Decision note' : 'Decision note',
                          value: reviewSelectedIssue.decision.note ?? '—',
                        },
                      ]}
                    />
                    {reviewSelectedIssue.decision.isStale ? (
                      <div className="rounded-md border border-[rgba(162,78,69,0.24)] bg-[rgba(162,78,69,0.08)] p-3">
                        <p className="text-sm font-medium text-text-main">{locale === 'zh-CN' ? 'Decision stale' : 'Decision stale'}</p>
                        <p className="mt-2 text-sm leading-6 text-text-muted">
                          {locale === 'zh-CN'
                            ? '源内容已变化，这条审阅决策需要重新确认。'
                            : 'The source content changed, so this review decision needs another pass.'}
                        </p>
                      </div>
                    ) : null}
                    <section className="rounded-md border border-line-soft bg-surface-1 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-text-main">
                          {locale === 'zh-CN' ? 'Selected issue fix action' : 'Selected issue fix action'}
                        </p>
                        <Badge tone={getFixActionBadge(reviewSelectedIssue.fixAction.status).tone}>
                          {getFixActionBadge(reviewSelectedIssue.fixAction.status).label}
                        </Badge>
                      </div>
                      <div className="mt-3">
                        <FactList
                          items={[
                            {
                              id: 'review-fix-status',
                              label: locale === 'zh-CN' ? 'Fix status' : 'Fix status',
                              value: getFixActionBadge(reviewSelectedIssue.fixAction.status).label,
                            },
                            {
                              id: 'review-fix-primary-target',
                              label: locale === 'zh-CN' ? 'Primary source fix target' : 'Primary source fix target',
                              value: reviewSelectedIssue.fixAction.sourceHandoffLabel
                                ? `${reviewSelectedIssue.fixAction.sourceHandoffLabel} · ${reviewSelectedIssue.fixAction.targetScope ?? reviewSelectedIssue.primaryFixHandoff?.target.scope ?? '—'}`
                                : getFixTargetLabel(),
                            },
                            {
                              id: 'review-fix-note',
                              label: locale === 'zh-CN' ? 'Fix note' : 'Fix note',
                              value: reviewSelectedIssue.fixAction.note ?? '—',
                            },
                            {
                              id: 'review-fix-next-action',
                              label: locale === 'zh-CN' ? 'Next recommended source action' : 'Next recommended source action',
                              value: reviewSelectedIssue.primaryFixHandoff?.label ?? reviewSelectedIssue.recommendation,
                            },
                          ]}
                        />
                      </div>
                      {reviewSelectedIssue.fixAction.isStale || reviewSelectedIssue.fixAction.status === 'stale' ? (
                        <div className="mt-3 rounded-md border border-[rgba(156,122,58,0.28)] bg-[rgba(156,122,58,0.08)] p-3">
                          <p className="text-sm font-medium text-text-main">{locale === 'zh-CN' ? 'Fix stale' : 'Fix stale'}</p>
                          <p className="mt-2 text-sm leading-6 text-text-muted">
                            {locale === 'zh-CN'
                              ? 'This source fix is stale because the review issue changed after the fix action was recorded.'
                              : 'This source fix is stale because the review issue changed after the fix action was recorded.'}
                          </p>
                        </div>
                      ) : null}
                    </section>
                  </>
                ) : (
                  <EmptyState
                    title={locale === 'zh-CN' ? '还没有选中问题' : 'No issue selected'}
                    message={
                      locale === 'zh-CN'
                        ? '从 Review 队列中选择一个问题后，这里会显示摘要与跳转建议。'
                        : 'Choose an issue from the review queue to inspect its summary and handoff guidance.'
                    }
                  />
                )}
              </div>
            </section>
            <section className="rounded-md border border-line-soft bg-surface-2 p-4">
              <h4 className="text-base text-text-main">{locale === 'zh-CN' ? '审阅队列摘要' : 'Review queue summary'}</h4>
              <div className="mt-3">
                <FactList
                  items={[
                    { id: 'review-blockers', label: locale === 'zh-CN' ? '阻塞项' : 'Blockers', value: `${reviewInbox.counts.blockers}` },
                    { id: 'review-warnings', label: locale === 'zh-CN' ? '警告' : 'Warnings', value: `${reviewInbox.counts.warnings}` },
                    { id: 'review-trace-gaps', label: locale === 'zh-CN' ? '溯源缺口' : 'Trace gaps', value: `${reviewInbox.counts.traceGaps}` },
                    { id: 'review-export-readiness', label: locale === 'zh-CN' ? '导出准备度' : 'Export readiness', value: `${reviewInbox.counts.exportReadiness}` },
                    { id: 'review-branch-readiness', label: locale === 'zh-CN' ? '实验稿准备度' : 'Branch readiness', value: `${reviewInbox.counts.branchReadiness}` },
                  ]}
                />
              </div>
            </section>
            <section className="rounded-md border border-line-soft bg-surface-2 p-4">
              <h4 className="text-base text-text-main">{locale === 'zh-CN' ? '来源交接' : 'Source handoff'}</h4>
              <div className="mt-3 space-y-3">
                <div className="rounded-md border border-line-soft bg-surface-1 p-3">
                  <p className="text-sm font-medium text-text-main">{locale === 'zh-CN' ? '推荐来源动作' : 'Recommended source action'}</p>
                  <p className="mt-2 text-sm leading-6 text-text-muted">
                    {reviewSelectedIssue?.recommendation ??
                      (locale === 'zh-CN'
                        ? '当前没有额外来源动作建议。'
                        : 'No source handoff guidance is visible right now.')}
                  </p>
                </div>
                <div className="space-y-2">
                  {reviewSelectedIssue?.handoffs.map((handoff) => (
                    <button
                      key={handoff.id}
                      type="button"
                      aria-label={
                        locale === 'zh-CN' ? `检查器来源动作 ${handoff.label}` : `Inspector source action ${handoff.label}`
                      }
                      onClick={() => onOpenReviewSource?.(handoff)}
                      className="w-full rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-left hover:bg-surface-2"
                    >
                      <p className="text-sm text-text-main">{handoff.label}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.05em] text-text-soft">{handoff.target.scope}</p>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </>
        ) : null}
        <section className="rounded-md border border-line-soft bg-surface-2 p-4">
          <h4 className="text-base text-text-main">{locale === 'zh-CN' ? '手稿准备度' : 'Manuscript Readiness'}</h4>
          <div className="mt-3">
            <FactList
              items={[
                { id: 'drafted-chapters', label: locale === 'zh-CN' ? '已起草章节' : 'Drafted chapters', value: `${inspector.readiness.draftedChapterCount}` },
                { id: 'missing-draft-chapters', label: locale === 'zh-CN' ? '缺稿章节' : 'Missing draft chapters', value: `${inspector.readiness.missingDraftChapterCount}` },
                { id: 'warnings', label: locale === 'zh-CN' ? '警告章节' : 'Warning-heavy chapters', value: `${inspector.readiness.warningHeavyChapterCount}` },
                { id: 'words-total', label: locale === 'zh-CN' ? '总字数' : 'Total words', value: `${inspector.readiness.assembledWordCount}` },
              ]}
            />
          </div>
        </section>
        <section className="rounded-md border border-line-soft bg-surface-2 p-4">
          <h4 className="text-base text-text-main">{locale === 'zh-CN' ? '章节信号' : 'Chapter Signals'}</h4>
          <div className="mt-3 space-y-3">
            <div className="rounded-md border border-line-soft bg-surface-1 p-3">
              <p className="text-sm font-medium text-text-main">{locale === 'zh-CN' ? '缺口' : 'Gaps'}</p>
              <p className="mt-2 text-sm leading-6 text-text-muted">
                {inspector.signals.topMissingScenes.length > 0
                  ? inspector.signals.topMissingScenes.join(locale === 'zh-CN' ? '、' : ', ')
                  : locale === 'zh-CN'
                    ? '当前选中章节没有显式缺口。'
                    : 'No explicit chapter gaps are visible right now.'}
              </p>
            </div>
            <div className="rounded-md border border-line-soft bg-surface-1 p-3">
              <p className="text-sm font-medium text-text-main">{locale === 'zh-CN' ? '最近差异' : 'Latest diffs'}</p>
              <ul className="mt-2 space-y-2">
                {inspector.signals.latestDiffSummaries.length > 0 ? (
                  inspector.signals.latestDiffSummaries.map((summary, index) => (
                    <li key={`${index}-${summary}`} className="text-sm leading-6 text-text-muted">
                      {summary}
                    </li>
                  ))
                ) : (
                  <li className="text-sm leading-6 text-text-muted">
                    {locale === 'zh-CN' ? '当前没有额外差异摘要。' : 'No extra diff summaries are visible.'}
                  </li>
                )}
              </ul>
            </div>
            <div className="rounded-md border border-line-soft bg-surface-1 p-3">
              <p className="text-sm font-medium text-text-main">{locale === 'zh-CN' ? '溯源说明' : 'Trace note'}</p>
              <p className="mt-2 text-sm leading-6 text-text-muted">{inspector.signals.traceCoverageNote}</p>
            </div>
          </div>
        </section>
          </>
        )}
      </div>
    </div>
  )
}
