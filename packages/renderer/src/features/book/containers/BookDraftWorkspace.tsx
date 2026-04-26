import { useCallback, useEffect, useState } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { WorkbenchShell } from '@/features/workbench/components/WorkbenchShell'
import { useWorkbenchRouteState } from '@/features/workbench/hooks/useWorkbenchRouteState'
import type { BookDraftView, BookReviewFilter, BookReviewStatusFilter } from '@/features/workbench/types/workbench-route'

import { getWorkbenchLensLabel, useI18n } from '@/app/i18n'
import { LocaleToggle } from '@/features/workbench/components/LocaleToggle'
import { useClearReviewIssueDecisionMutation } from '@/features/review/hooks/useClearReviewIssueDecisionMutation'
import { useClearReviewIssueFixActionMutation } from '@/features/review/hooks/useClearReviewIssueFixActionMutation'
import { useBookReviewInboxQuery } from '@/features/review/hooks/useBookReviewInboxQuery'
import { useSetReviewIssueDecisionMutation } from '@/features/review/hooks/useSetReviewIssueDecisionMutation'
import { useSetReviewIssueFixActionMutation } from '@/features/review/hooks/useSetReviewIssueFixActionMutation'
import type { ReviewSourceHandoffViewModel } from '@/features/review/types/review-view-models'
import { BookDraftBinderPane } from '../components/BookDraftBinderPane'
import { BookDraftInspectorPane } from '../components/BookDraftInspectorPane'
import { BookDraftStage } from '../components/BookDraftStage'
import { BookModeRail } from '../components/BookModeRail'
import type { BookExportArtifactFormat, BookExportArtifactRecord } from '../api/book-export-artifact-records'
import type { BookExportArtifactSummaryViewModel } from '../types/book-export-artifact-view-models'
import { useBookExportArtifactWorkspaceQuery } from '../hooks/useBookExportArtifactWorkspaceQuery'
import { bookQueryKeys } from '../hooks/book-query-keys'
import { useBookDraftWorkspaceQuery } from '../hooks/useBookDraftWorkspaceQuery'
import { useBuildBookExportArtifactMutation } from '../hooks/useBuildBookExportArtifactMutation'
import { useBookExperimentBranchQuery } from '../hooks/useBookExperimentBranchQuery'
import { useBookExportPreviewQuery } from '../hooks/useBookExportPreviewQuery'
import { useBookManuscriptCompareQuery } from '../hooks/useBookManuscriptCompareQuery'
import {
  rememberBookWorkbenchExportArtifact,
  rememberBookWorkbenchHandoff,
  rememberBookWorkbenchReviewDecision,
  rememberBookWorkbenchReviewFixAction,
  rememberBookWorkbenchReviewSourceOpen,
} from '../hooks/useBookWorkbenchActivity'
import { BookDraftDockContainer } from './BookDraftDockContainer'
import { DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID } from '../api/book-manuscript-checkpoints'
import { DEFAULT_BOOK_EXPORT_PROFILE_ID } from '../api/book-export-profiles'

let rememberedBookDraftHandoffSequence = 0
let rememberedBookReviewDecisionSequence = 0
let rememberedBookReviewFixActionSequence = 0
let rememberedBookExportArtifactSequence = 0
const DEFAULT_BOOK_EXPERIMENT_BRANCH_ID = 'branch-book-signal-arc-quiet-ending'

function DraftPaneState({ title, message }: { title: string; message: string }) {
  return (
    <div className="p-4">
      <EmptyState title={title} message={message} />
    </div>
  )
}

function BookDraftTopBar({
  bookTitle,
  selectedChapterTitle,
  assembledWordCount,
  missingDraftChapterCount,
}: {
  bookTitle?: string
  summary?: string
  selectedChapterTitle?: string
  assembledWordCount?: number
  missingDraftChapterCount?: number
}) {
  const { locale } = useI18n()

  return (
    <div className="flex h-full flex-wrap items-center justify-end gap-2">
      <div className="sr-only">
        <h1>{locale === 'zh-CN' ? '书籍手稿' : 'Book manuscript'}</h1>
        <p>
          {bookTitle ?? (locale === 'zh-CN' ? '书籍' : 'Book')} / {getWorkbenchLensLabel(locale, 'draft')}
          {selectedChapterTitle ? ` / ${selectedChapterTitle}` : ''}
        </p>
      </div>
      <LocaleToggle />
      {assembledWordCount !== undefined ? (
        <Badge tone="neutral">{locale === 'zh-CN' ? `合计 ${assembledWordCount} 词` : `${assembledWordCount} words`}</Badge>
      ) : null}
      {missingDraftChapterCount !== undefined ? (
        <Badge tone={missingDraftChapterCount > 0 ? 'warn' : 'success'}>
          {locale === 'zh-CN' ? `缺稿 ${missingDraftChapterCount}` : `Missing ${missingDraftChapterCount}`}
        </Badge>
      ) : null}
    </div>
  )
}

export function BookDraftWorkspace() {
  const { route, replaceRoute, patchBookRoute } = useWorkbenchRouteState()
  const { locale } = useI18n()
  const queryClient = useQueryClient()
  const [selectedArtifactFormat, setSelectedArtifactFormat] = useState<BookExportArtifactFormat>('markdown')
  const [artifactActivityRevision, setArtifactActivityRevision] = useState(0)

  if (route.scope !== 'book') {
    return null
  }

  const { workspace, isLoading, error } = useBookDraftWorkspaceQuery({
    bookId: route.bookId,
    selectedChapterId: route.selectedChapterId ?? null,
  })
  const activeDraftView = route.draftView ?? 'read'
  const effectiveCheckpointId = route.checkpointId ?? DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID
  const effectiveExportProfileId = route.exportProfileId ?? DEFAULT_BOOK_EXPORT_PROFILE_ID
  const effectiveBranchId = route.branchId ?? DEFAULT_BOOK_EXPERIMENT_BRANCH_ID
  const effectiveBranchBaseline = route.branchBaseline ?? 'current'
  const selectedReviewFilter = route.reviewFilter ?? 'all'
  const selectedReviewStatusFilter = route.reviewStatusFilter ?? 'open'
  const selectedReviewIssueId = route.reviewIssueId ?? null
  const {
    compareWorkspace,
    checkpoints,
    selectedCheckpoint,
    isLoading: isCompareLoading,
    error: compareError,
  } = useBookManuscriptCompareQuery({
    bookId: route.bookId,
    currentDraftWorkspace: workspace,
    checkpointId: effectiveCheckpointId,
  })
  const {
    exportWorkspace,
    exportProfiles,
    selectedExportProfile,
    isLoading: isExportLoading,
    error: exportError,
  } = useBookExportPreviewQuery({
    bookId: route.bookId,
    currentDraftWorkspace: workspace,
    compareWorkspace,
    exportProfileId: effectiveExportProfileId,
    enabled: activeDraftView === 'export' || activeDraftView === 'review',
  })
  const {
    branchWorkspace,
    branches,
    selectedBranch,
    isLoading: isBranchLoading,
    error: branchError,
  } = useBookExperimentBranchQuery({
    bookId: route.bookId,
    currentDraftWorkspace: workspace,
    branchId: effectiveBranchId,
    branchBaseline: effectiveBranchBaseline,
    checkpointId: effectiveCheckpointId,
  })
  const exportBaselineError = activeDraftView === 'export' ? compareError : null
  const effectiveExportError = exportBaselineError ?? exportError
  const effectiveExportPreview = exportBaselineError ? null : (exportWorkspace ?? null)
  const reviewExportError = compareError ?? exportError
  const reviewExportPreview = compareError ? null : (exportWorkspace ?? null)
  const {
    inbox: reviewInbox,
    isLoading: isReviewLoading,
    error: reviewError,
    decisionError: reviewDecisionError,
    fixActionError: reviewFixActionError,
  } = useBookReviewInboxQuery({
    bookId: route.bookId,
    currentDraftWorkspace: workspace,
    compareWorkspace,
    compareStatus: isCompareLoading ? 'loading' : 'ready',
    compareError,
    exportWorkspace: activeDraftView === 'review' ? reviewExportPreview : effectiveExportPreview,
    exportStatus: activeDraftView === 'review' || activeDraftView === 'export' ? (isExportLoading ? 'loading' : 'ready') : 'idle',
    exportError: activeDraftView === 'review' ? reviewExportError : null,
    branchWorkspace,
    branchStatus: isBranchLoading ? 'loading' : 'ready',
    branchError,
    reviewFilter: selectedReviewFilter,
    reviewStatusFilter: selectedReviewStatusFilter,
    reviewIssueId: selectedReviewIssueId ?? undefined,
  })
  const {
    artifactWorkspace,
    isLoading: isArtifactLoading,
    error: artifactError,
  } = useBookExportArtifactWorkspaceQuery({
    bookId: route.bookId,
    exportPreview: effectiveExportPreview,
    reviewInbox,
    exportProfileId: effectiveExportProfileId,
    checkpointId: effectiveCheckpointId,
    enabled: (activeDraftView === 'export' || activeDraftView === 'review') && reviewInbox !== undefined,
  })
  const buildArtifactMutation = useBuildBookExportArtifactMutation({
    checkpointId: effectiveCheckpointId,
  })
  const setReviewIssueDecisionMutation = useSetReviewIssueDecisionMutation({
    bookId: route.bookId,
  })
  const clearReviewIssueDecisionMutation = useClearReviewIssueDecisionMutation({
    bookId: route.bookId,
  })
  const setReviewIssueFixActionMutation = useSetReviewIssueFixActionMutation({
    bookId: route.bookId,
  })
  const clearReviewIssueFixActionMutation = useClearReviewIssueFixActionMutation({
    bookId: route.bookId,
  })

  useEffect(() => {
    if (isLoading || error || workspace === undefined || workspace === null) {
      return
    }

    if (route.selectedChapterId !== workspace.selectedChapterId) {
      patchBookRoute({ selectedChapterId: workspace.selectedChapterId ?? undefined }, { replace: true })
    }
  }, [error, isLoading, patchBookRoute, route.selectedChapterId, workspace])

  useEffect(() => {
    if (activeDraftView !== 'review' || isReviewLoading || reviewInbox === undefined || reviewInbox === null) {
      return
    }

    const nextReviewIssueId = reviewInbox.selectedIssueId ?? undefined
    const nextSelectedChapterId =
      reviewInbox.selectedIssue?.chapterId &&
      workspace?.chapters.some((chapter) => chapter.chapterId === reviewInbox.selectedIssue?.chapterId)
        ? reviewInbox.selectedIssue.chapterId
        : undefined
    const reviewFilterChanged = route.reviewFilter !== reviewInbox.activeFilter
    const reviewStatusFilterChanged = route.reviewStatusFilter !== reviewInbox.activeStatusFilter
    const reviewIssueChanged = route.reviewIssueId !== nextReviewIssueId
    const selectedChapterChanged = !!nextSelectedChapterId && route.selectedChapterId !== nextSelectedChapterId

    if (!reviewFilterChanged && !reviewStatusFilterChanged && !reviewIssueChanged && !selectedChapterChanged) {
      return
    }

    patchBookRoute(
      {
        reviewFilter: reviewInbox.activeFilter,
        reviewStatusFilter: reviewInbox.activeStatusFilter,
        reviewIssueId: nextReviewIssueId,
        selectedChapterId: nextSelectedChapterId ?? route.selectedChapterId,
      },
      { replace: true },
    )
  }, [
    activeDraftView,
    isReviewLoading,
    patchBookRoute,
    reviewInbox,
    route.reviewFilter,
    route.reviewStatusFilter,
    route.reviewIssueId,
    route.selectedChapterId,
    workspace,
  ])

  useEffect(() => {
    if (activeDraftView !== 'review') {
      return
    }

    const needsCanonicalCheckpoint = route.checkpointId === undefined
    const needsCanonicalExportProfile = route.exportProfileId === undefined
    const needsCanonicalBranchId = route.branchId === undefined
    const needsCanonicalBranchBaseline = route.branchBaseline === undefined

    if (!needsCanonicalCheckpoint && !needsCanonicalExportProfile && !needsCanonicalBranchId && !needsCanonicalBranchBaseline) {
      return
    }

    patchBookRoute(
      {
        checkpointId: route.checkpointId ?? effectiveCheckpointId,
        exportProfileId: route.exportProfileId ?? effectiveExportProfileId,
        branchId: route.branchId ?? effectiveBranchId,
        branchBaseline: route.branchBaseline ?? effectiveBranchBaseline,
      },
      { replace: true },
    )
  }, [
    activeDraftView,
    effectiveBranchBaseline,
    effectiveBranchId,
    effectiveCheckpointId,
    effectiveExportProfileId,
    patchBookRoute,
    route.branchBaseline,
    route.branchId,
    route.checkpointId,
    route.exportProfileId,
  ])

  const openChapterFromBook = useCallback(
    (chapterId: string, lens: 'structure' | 'draft') => {
      const chapterTitle = workspace?.chapters.find((chapter) => chapter.chapterId === chapterId)?.title ?? chapterId

      rememberBookWorkbenchHandoff({
        id: `handoff-${route.bookId}-${chapterId}-${lens}-${rememberedBookDraftHandoffSequence++}`,
        bookId: route.bookId,
        chapterTitle,
        lens,
      })

      if (lens === 'structure') {
        replaceRoute({
          scope: 'chapter',
          chapterId,
          lens: 'structure',
          view: 'sequence',
          sceneId: undefined,
        })
        return
      }

      replaceRoute({
        scope: 'chapter',
        chapterId,
        lens: 'draft',
        sceneId: undefined,
      })
    },
    [replaceRoute, route.bookId, workspace],
  )

  const onSelectChapter = useCallback(
    (chapterId: string) => {
      if (route.selectedChapterId === chapterId) {
        return
      }

      patchBookRoute({ selectedChapterId: chapterId })
    },
    [patchBookRoute, route.selectedChapterId],
  )
  const onSelectDraftView = useCallback(
    (draftView: BookDraftView) => {
      patchBookRoute({
        draftView,
        checkpointId: draftView === 'compare' ? effectiveCheckpointId : route.checkpointId ?? effectiveCheckpointId,
        exportProfileId: draftView === 'export' ? effectiveExportProfileId : route.exportProfileId ?? effectiveExportProfileId,
        branchId: draftView === 'branch' ? effectiveBranchId : route.branchId ?? effectiveBranchId,
        branchBaseline: draftView === 'branch' ? effectiveBranchBaseline : route.branchBaseline ?? effectiveBranchBaseline,
      })
    },
    [
      effectiveBranchBaseline,
      effectiveBranchId,
      effectiveCheckpointId,
      effectiveExportProfileId,
      patchBookRoute,
      route.branchBaseline,
      route.branchId,
      route.checkpointId,
      route.exportProfileId,
    ],
  )
  const onSelectCheckpoint = useCallback(
    (checkpointId: string) => {
      if (checkpointId === effectiveCheckpointId && activeDraftView === 'compare') {
        return
      }

      patchBookRoute({
        draftView: 'compare',
        checkpointId,
      })
    },
    [activeDraftView, effectiveCheckpointId, patchBookRoute],
  )
  const onSelectExportProfile = useCallback(
    (exportProfileId: string) => {
      patchBookRoute({
        draftView: 'export',
        exportProfileId,
      })
    },
    [patchBookRoute],
  )
  const onSelectBranch = useCallback(
    (branchId: string) => {
      patchBookRoute({
        draftView: 'branch',
        branchId,
      })
    },
    [patchBookRoute],
  )
  const onSelectBranchBaseline = useCallback(
    (branchBaseline: 'current' | 'checkpoint') => {
      patchBookRoute({
        draftView: 'branch',
        branchBaseline,
        checkpointId: route.checkpointId ?? effectiveCheckpointId,
      })
    },
    [effectiveCheckpointId, patchBookRoute, route.checkpointId],
  )
  const onSelectReviewFilter = useCallback(
    (reviewFilter: BookReviewFilter) => {
      patchBookRoute({
        draftView: 'review',
        reviewFilter,
      })
    },
    [patchBookRoute],
  )
  const onSelectReviewStatusFilter = useCallback(
    (reviewStatusFilter: BookReviewStatusFilter) => {
      patchBookRoute({
        draftView: 'review',
        reviewStatusFilter,
      })
    },
    [patchBookRoute],
  )
  const onSelectReviewIssue = useCallback(
    (reviewIssueId: string) => {
      const issue = reviewInbox?.issues.find((item) => item.id === reviewIssueId)
      const nextSelectedChapterId =
        issue?.chapterId && workspace?.chapters.some((chapter) => chapter.chapterId === issue.chapterId)
          ? issue.chapterId
          : route.selectedChapterId

      patchBookRoute({
        draftView: 'review',
        reviewIssueId,
        selectedChapterId: nextSelectedChapterId,
      })
    },
    [patchBookRoute, reviewInbox, route.selectedChapterId, workspace],
  )
  const onSetReviewDecision = useCallback(
    (input: {
      issueId: string
      issueSignature: string
      status: 'reviewed' | 'deferred' | 'dismissed'
      note?: string
    }) => {
      const issue = reviewInbox?.issues.find((item) => item.id === input.issueId)
      const issueTitle = issue?.title

      void setReviewIssueDecisionMutation
        .mutateAsync(input)
        .then(() => {
          if (!issueTitle) {
            return
          }

          rememberBookWorkbenchReviewDecision({
            id: `review-decision-${route.bookId}-${rememberedBookReviewDecisionSequence++}`,
            bookId: route.bookId,
            issueTitle,
            status: input.status,
            note: input.note,
          })
        })
        .catch(() => undefined)
    },
    [reviewInbox, route.bookId, setReviewIssueDecisionMutation],
  )
  const onClearReviewDecision = useCallback(
    (issueId: string) => {
      const issue = reviewInbox?.issues.find((item) => item.id === issueId)
      const issueTitle = issue?.title

      void clearReviewIssueDecisionMutation
        .mutateAsync({ issueId })
        .then(() => {
          if (!issueTitle) {
            return
          }

          rememberBookWorkbenchReviewDecision({
            id: `review-decision-${route.bookId}-${rememberedBookReviewDecisionSequence++}`,
            bookId: route.bookId,
            issueTitle,
            status: 'reopened',
          })
        })
        .catch(() => undefined)
    },
    [clearReviewIssueDecisionMutation, reviewInbox, route.bookId],
  )
  const onOpenReviewSource = useCallback(
    (handoff: ReviewSourceHandoffViewModel) => {
      const sourceIssue = reviewInbox?.issues.find((issue) => issue.handoffs.some((item) => item.id === handoff.id))

      if (sourceIssue) {
        rememberBookWorkbenchReviewSourceOpen({
          id: `review-source-${route.bookId}-${handoff.id}`,
          bookId: route.bookId,
          issueTitle: sourceIssue.title,
          sourceActionLabel: handoff.label,
        })
      }

      const { target } = handoff

      if (target.scope === 'book') {
        replaceRoute({
          scope: 'book',
          lens: 'draft',
          view: route.view,
          draftView: target.draftView,
          selectedChapterId: target.selectedChapterId ?? route.selectedChapterId,
          checkpointId: target.checkpointId,
          exportProfileId: target.exportProfileId,
          branchId: target.branchId,
          branchBaseline: target.branchBaseline,
          reviewIssueId: target.reviewIssueId,
        })
        return
      }

      if (target.scope === 'chapter') {
        replaceRoute({
          scope: 'chapter',
          chapterId: target.chapterId,
          lens: target.lens,
          view: target.view,
          sceneId: target.sceneId,
        })
        return
      }

      if (target.scope === 'scene') {
        replaceRoute({
          scope: 'scene',
          sceneId: target.sceneId,
          lens: target.lens,
          tab: target.tab,
        })
        return
      }

      replaceRoute({
        scope: 'asset',
        assetId: target.assetId,
        lens: 'knowledge',
        view: target.view,
      })
    },
    [replaceRoute, reviewInbox, route.bookId, route.selectedChapterId, route.view],
  )
  const onStartReviewFix = useCallback(
    (input: {
      issueId: string
      issueSignature: string
      handoff: ReviewSourceHandoffViewModel
      note?: string
    }) => {
      const issue = reviewInbox?.issues.find((item) => item.id === input.issueId)

      void setReviewIssueFixActionMutation
        .mutateAsync({
          issueId: input.issueId,
          issueSignature: input.issueSignature,
          sourceHandoffId: input.handoff.id,
          sourceHandoffLabel: input.handoff.label,
          targetScope: input.handoff.target.scope,
          status: 'started',
          note: input.note,
        })
        .then(() => {
          if (issue?.title) {
            rememberBookWorkbenchReviewFixAction({
              id: `review-fix-action-${route.bookId}-${rememberedBookReviewFixActionSequence++}`,
              bookId: route.bookId,
              issueTitle: issue.title,
              action: 'started',
              sourceActionLabel: input.handoff.label,
              note: input.note,
            })
          }

          onOpenReviewSource(input.handoff)
        })
        .catch(() => undefined)
    },
    [onOpenReviewSource, reviewInbox, route.bookId, setReviewIssueFixActionMutation],
  )
  const onSetReviewFixStatus = useCallback(
    (input: {
      issueId: string
      issueSignature: string
      status: 'checked' | 'blocked'
      handoff: ReviewSourceHandoffViewModel
      note?: string
    }) => {
      const issue = reviewInbox?.issues.find((item) => item.id === input.issueId)

      void setReviewIssueFixActionMutation
        .mutateAsync({
          issueId: input.issueId,
          issueSignature: input.issueSignature,
          sourceHandoffId: input.handoff.id,
          sourceHandoffLabel: input.handoff.label,
          targetScope: input.handoff.target.scope,
          status: input.status,
          note: input.note,
        })
        .then(() => {
          if (!issue?.title) {
            return
          }

          rememberBookWorkbenchReviewFixAction({
            id: `review-fix-action-${route.bookId}-${rememberedBookReviewFixActionSequence++}`,
            bookId: route.bookId,
            issueTitle: issue.title,
            action: input.status,
            sourceActionLabel: input.handoff.label,
            note: input.note,
          })
        })
        .catch(() => undefined)
    },
    [reviewInbox, route.bookId, setReviewIssueFixActionMutation],
  )
  const onClearReviewFix = useCallback(
    (issueId: string) => {
      const issue = reviewInbox?.issues.find((item) => item.id === issueId)

      void clearReviewIssueFixActionMutation
        .mutateAsync({ issueId })
        .then(() => {
          if (!issue?.title) {
            return
          }

          rememberBookWorkbenchReviewFixAction({
            id: `review-fix-action-${route.bookId}-${rememberedBookReviewFixActionSequence++}`,
            bookId: route.bookId,
            issueTitle: issue.title,
            action: 'cleared',
            sourceActionLabel: issue.primaryFixHandoff?.label,
          })
        })
        .catch(() => undefined)
    },
    [clearReviewIssueFixActionMutation, reviewInbox, route.bookId],
  )
  const onBuildArtifact = useCallback(() => {
    if (!effectiveExportPreview) {
      return
    }

    void buildArtifactMutation
      .mutateAsync({
        exportPreview: effectiveExportPreview,
        reviewInbox: reviewInbox ?? null,
        format: selectedArtifactFormat,
      })
      .then((artifact) => {
        queryClient.setQueryData(
          bookQueryKeys.exportArtifacts(route.bookId, effectiveExportProfileId, effectiveCheckpointId),
          (current: BookExportArtifactRecord[] | undefined) => [
            artifact,
            ...(current?.filter((item) => item.id !== artifact.id) ?? []),
          ],
        )
        rememberBookWorkbenchExportArtifact({
          id: `export-artifact-${route.bookId}-${rememberedBookExportArtifactSequence++}`,
          bookId: route.bookId,
          action: 'built',
          filename: artifact.filename,
          format: artifact.format,
        })
        setArtifactActivityRevision((value) => value + 1)
      })
      .catch(() => undefined)
  }, [
    buildArtifactMutation,
    effectiveCheckpointId,
    effectiveExportPreview,
    effectiveExportProfileId,
    queryClient,
    reviewInbox,
    route.bookId,
    selectedArtifactFormat,
  ])
  const onCopyArtifact = useCallback(
    (artifact: BookExportArtifactSummaryViewModel) => {
      const writeText = navigator.clipboard?.writeText
      if (!writeText) {
        return
      }

      void writeText
        .call(navigator.clipboard, artifact.content)
        .then(() => {
          rememberBookWorkbenchExportArtifact({
            id: `export-artifact-${route.bookId}-${rememberedBookExportArtifactSequence++}`,
            bookId: route.bookId,
            action: 'copied',
            filename: artifact.filename,
            format: artifact.format,
          })
          setArtifactActivityRevision((value) => value + 1)
        })
        .catch(() => undefined)
    },
    [route.bookId],
  )
  const onDownloadArtifact = useCallback(
    (artifact: BookExportArtifactSummaryViewModel) => {
      const blob = new Blob([artifact.content], { type: artifact.mimeType })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')

      anchor.href = url
      anchor.download = artifact.filename
      anchor.style.display = 'none'
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)

      rememberBookWorkbenchExportArtifact({
        id: `export-artifact-${route.bookId}-${rememberedBookExportArtifactSequence++}`,
        bookId: route.bookId,
        action: 'downloaded',
        filename: artifact.filename,
        format: artifact.format,
      })
      setArtifactActivityRevision((value) => value + 1)
    },
    [route.bookId],
  )

  const modeRail = (
    <BookModeRail
      activeScope="book"
      activeLens="draft"
      onSelectScope={(scope) => {
        if (scope === 'book') {
          return
        }

        if (scope === 'chapter') {
          const chapterId = workspace?.selectedChapterId ?? route.selectedChapterId
          if (chapterId) {
            openChapterFromBook(chapterId, 'draft')
          }
          return
        }

        replaceRoute({ scope })
      }}
      onSelectLens={(lens) => {
        if (lens !== route.lens) {
          patchBookRoute({ lens })
        }
      }}
    />
  )

  if (error) {
    return (
      <WorkbenchShell
        topBar={<BookDraftTopBar bookTitle={route.bookId} />}
        modeRail={modeRail}
        navigator={<DraftPaneState title={locale === 'zh-CN' ? '书籍不可用' : 'Book unavailable'} message={error.message} />}
        mainStage={<DraftPaneState title={locale === 'zh-CN' ? '手稿不可用' : 'Manuscript unavailable'} message={error.message} />}
        inspector={<DraftPaneState title={locale === 'zh-CN' ? '检查器不可用' : 'Inspector unavailable'} message={error.message} />}
        bottomDock={<DraftPaneState title={locale === 'zh-CN' ? '底部面板不可用' : 'Bottom dock unavailable'} message={error.message} />}
      />
    )
  }

  if (
    isLoading ||
    workspace === undefined ||
    (activeDraftView === 'compare' && (isCompareLoading || compareWorkspace === undefined)) ||
    (activeDraftView === 'export' && (isExportLoading || exportWorkspace === undefined)) ||
    (activeDraftView === 'branch' && (isBranchLoading || (branchWorkspace === undefined && branchError === null))) ||
    (activeDraftView === 'review' && (isReviewLoading || reviewInbox === undefined))
  ) {
    const message =
      locale === 'zh-CN'
        ? '正在按书籍顺序装配章节手稿，并同步检查器与底部面板摘要。'
        : 'Assembling chapter manuscript blocks in book order and syncing the inspector and dock summary.'

    return (
      <WorkbenchShell
        topBar={<BookDraftTopBar bookTitle={route.bookId} />}
        modeRail={modeRail}
        navigator={<DraftPaneState title={locale === 'zh-CN' ? '正在加载导航' : 'Loading navigator'} message={message} />}
        mainStage={<DraftPaneState title={locale === 'zh-CN' ? '正在加载手稿' : 'Loading manuscript'} message={message} />}
        inspector={<DraftPaneState title={locale === 'zh-CN' ? '正在加载检查器' : 'Loading inspector'} message={message} />}
        bottomDock={<DraftPaneState title={locale === 'zh-CN' ? '正在加载底部面板' : 'Loading bottom dock'} message={message} />}
      />
    )
  }

  if (workspace === null) {
    const message = locale === 'zh-CN' ? `未找到书籍 ${route.bookId}。` : `Book ${route.bookId} could not be found.`

    return (
      <WorkbenchShell
        topBar={<BookDraftTopBar bookTitle={route.bookId} />}
        modeRail={modeRail}
        navigator={<DraftPaneState title={locale === 'zh-CN' ? '书籍不存在' : 'Book not found'} message={message} />}
        mainStage={<DraftPaneState title={locale === 'zh-CN' ? '书籍不存在' : 'Book not found'} message={message} />}
        inspector={<DraftPaneState title={locale === 'zh-CN' ? '书籍不存在' : 'Book not found'} message={message} />}
        bottomDock={<DraftPaneState title={locale === 'zh-CN' ? '书籍不存在' : 'Book not found'} message={message} />}
      />
    )
  }

  return (
    <WorkbenchShell
      topBar={
        <BookDraftTopBar
          bookTitle={workspace.title}
          summary={workspace.summary}
          selectedChapterTitle={workspace.selectedChapter?.title}
          assembledWordCount={workspace.assembledWordCount}
          missingDraftChapterCount={workspace.missingDraftChapterCount}
        />
      }
      modeRail={modeRail}
      navigator={
        <BookDraftBinderPane
          workspace={workspace}
          onSelectChapter={onSelectChapter}
          onOpenChapter={openChapterFromBook}
        />
      }
      mainStage={
        <BookDraftStage
          draftView={activeDraftView}
          workspace={workspace}
          compare={compareWorkspace ?? null}
          compareError={compareError}
          branchWorkspace={branchWorkspace ?? null}
          branchError={branchError}
          branches={branches ?? []}
          selectedBranchId={selectedBranch?.branchId ?? effectiveBranchId}
          branchBaseline={effectiveBranchBaseline}
          exportPreview={effectiveExportPreview}
          exportProfiles={exportProfiles ?? []}
          selectedExportProfileId={selectedExportProfile?.exportProfileId ?? effectiveExportProfileId}
          exportError={effectiveExportError}
          artifactWorkspace={artifactWorkspace ?? null}
          selectedArtifactFormat={selectedArtifactFormat}
          isBuildingArtifact={buildArtifactMutation.isPending || isArtifactLoading}
          artifactBuildErrorMessage={buildArtifactMutation.error?.message ?? artifactError?.message ?? null}
          reviewInbox={reviewInbox ?? null}
          reviewError={reviewError}
          reviewDecisionError={reviewDecisionError}
          reviewFixActionError={reviewFixActionError}
          checkpoints={checkpoints ?? []}
          selectedCheckpointId={selectedCheckpoint?.checkpointId ?? effectiveCheckpointId}
          onSelectDraftView={onSelectDraftView}
          onSelectChapter={onSelectChapter}
          onOpenChapter={openChapterFromBook}
          onSelectCheckpoint={onSelectCheckpoint}
          onSelectBranch={onSelectBranch}
          onSelectBranchBaseline={onSelectBranchBaseline}
          onSelectExportProfile={onSelectExportProfile}
          onSelectArtifactFormat={setSelectedArtifactFormat}
          onBuildArtifact={onBuildArtifact}
          onCopyArtifact={onCopyArtifact}
          onDownloadArtifact={onDownloadArtifact}
          onSelectReviewFilter={onSelectReviewFilter}
          onSelectReviewStatusFilter={onSelectReviewStatusFilter}
          onSelectReviewIssue={onSelectReviewIssue}
          onSetReviewDecision={onSetReviewDecision}
          onClearReviewDecision={onClearReviewDecision}
          isReviewDecisionSaving={setReviewIssueDecisionMutation.isPending || clearReviewIssueDecisionMutation.isPending}
          onStartReviewFix={onStartReviewFix}
          onSetReviewFixStatus={onSetReviewFixStatus}
          onClearReviewFix={onClearReviewFix}
          isReviewFixActionSaving={setReviewIssueFixActionMutation.isPending || clearReviewIssueFixActionMutation.isPending}
          onOpenReviewSource={onOpenReviewSource}
        />
      }
      inspector={
        <BookDraftInspectorPane
          bookTitle={workspace.title}
          inspector={workspace.inspector}
          activeDraftView={activeDraftView}
          compare={compareWorkspace ?? null}
          branch={branchWorkspace ?? null}
          exportPreview={effectiveExportPreview}
          artifactWorkspace={artifactWorkspace ?? null}
          exportError={effectiveExportError}
          reviewInbox={reviewInbox ?? null}
          onOpenReviewSource={onOpenReviewSource}
          checkpointMeta={selectedCheckpoint ?? null}
        />
      }
      bottomDock={
        <BookDraftDockContainer
          workspace={workspace}
          activeDraftView={activeDraftView}
          compare={compareWorkspace ?? null}
          branch={branchWorkspace ?? null}
          exportPreview={effectiveExportPreview}
          artifactWorkspace={artifactWorkspace ?? null}
          reviewInbox={reviewInbox ?? null}
          exportError={effectiveExportError}
          activityRevision={artifactActivityRevision}
        />
      }
    />
  )
}
