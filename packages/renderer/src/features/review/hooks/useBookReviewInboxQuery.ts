import { useMemo } from 'react'

import type { BookExperimentBranchWorkspaceViewModel } from '@/features/book/types/book-branch-view-models'
import type { BookManuscriptCompareWorkspaceViewModel } from '@/features/book/types/book-compare-view-models'
import type { BookDraftWorkspaceViewModel } from '@/features/book/types/book-draft-view-models'
import type { BookExportPreviewWorkspaceViewModel } from '@/features/book/types/book-export-view-models'
import type { BookReviewFilter, BookReviewStatusFilter } from '@/features/workbench/types/workbench-route'

import { getBookReviewSeeds } from '../api/book-review-seeds'
import { buildBookReviewInboxViewModel } from '../lib/book-review-inbox-mappers'
import { useBookReviewDecisionsQuery } from './useBookReviewDecisionsQuery'
import { useBookReviewFixActionsQuery } from './useBookReviewFixActionsQuery'
import type { BookReviewInboxViewModel, ReviewOptionalSourceStatus } from '../types/review-view-models'
import type { ReviewClient } from '../api/review-client'

interface UseBookReviewInboxQueryInput {
  bookId: string
  currentDraftWorkspace: BookDraftWorkspaceViewModel | null | undefined
  compareWorkspace?: BookManuscriptCompareWorkspaceViewModel | null | undefined
  compareStatus?: ReviewOptionalSourceStatus
  compareError?: Error | null
  exportWorkspace?: BookExportPreviewWorkspaceViewModel | null | undefined
  exportStatus?: ReviewOptionalSourceStatus
  exportError?: Error | null
  branchWorkspace?: BookExperimentBranchWorkspaceViewModel | null | undefined
  branchStatus?: ReviewOptionalSourceStatus
  branchError?: Error | null
  reviewFilter?: BookReviewFilter
  reviewStatusFilter?: BookReviewStatusFilter
  reviewIssueId?: string
}

interface UseBookReviewInboxQueryDeps {
  reviewClient?: Pick<ReviewClient, 'getBookReviewDecisions' | 'getBookReviewFixActions'>
}

export interface UseBookReviewInboxQueryResult {
  inbox: BookReviewInboxViewModel | null | undefined
  isLoading: boolean
  error: Error | null
  decisionError: Error | null
  fixActionError: Error | null
  isEmpty: boolean
}

export function useBookReviewInboxQuery({
  bookId,
  currentDraftWorkspace,
  compareWorkspace,
  compareStatus = compareWorkspace === undefined ? 'idle' : 'ready',
  compareError = null,
  exportWorkspace,
  exportStatus = exportWorkspace === undefined ? 'idle' : 'ready',
  exportError = null,
  branchWorkspace,
  branchStatus = branchWorkspace === undefined ? 'idle' : 'ready',
  branchError = null,
  reviewFilter = 'all',
  reviewStatusFilter = 'open',
  reviewIssueId,
}: UseBookReviewInboxQueryInput, { reviewClient }: UseBookReviewInboxQueryDeps = {}): UseBookReviewInboxQueryResult {
  const reviewSeeds = useMemo(() => getBookReviewSeeds(bookId), [bookId])
  const reviewDecisionsQuery = useBookReviewDecisionsQuery(
    {
      bookId,
      enabled: currentDraftWorkspace !== undefined && currentDraftWorkspace !== null,
    },
    { reviewClient },
  )
  const reviewFixActionsQuery = useBookReviewFixActionsQuery(
    {
      bookId,
      enabled: currentDraftWorkspace !== undefined && currentDraftWorkspace !== null,
    },
    { reviewClient },
  )
  const decisionError =
    currentDraftWorkspace === null ? null : reviewDecisionsQuery.error instanceof Error ? reviewDecisionsQuery.error : null
  const fixActionError =
    currentDraftWorkspace === null ? null : reviewFixActionsQuery.error instanceof Error ? reviewFixActionsQuery.error : null
  const effectiveDecisionRecords = decisionError ? [] : reviewDecisionsQuery.data ?? []
  const effectiveFixActionRecords = fixActionError ? [] : reviewFixActionsQuery.data ?? []
  const optionalSourcesLoading =
    compareStatus === 'loading' || exportStatus === 'loading' || branchStatus === 'loading'

  const inbox = useMemo(() => {
    if (currentDraftWorkspace === null) {
      return null
    }

    if (
      currentDraftWorkspace === undefined ||
      optionalSourcesLoading ||
      reviewDecisionsQuery.isLoading ||
      reviewFixActionsQuery.isLoading
    ) {
      return undefined
    }

    return buildBookReviewInboxViewModel({
      bookId,
      currentDraftWorkspace,
      compareWorkspace: compareStatus === 'ready' && compareError === null ? (compareWorkspace ?? null) : undefined,
      exportWorkspace: exportStatus === 'ready' && exportError === null ? (exportWorkspace ?? null) : undefined,
      branchWorkspace: branchStatus === 'ready' && branchError === null ? (branchWorkspace ?? null) : undefined,
      reviewSeeds,
      reviewFilter,
      reviewStatusFilter,
      reviewIssueId,
      decisionRecords: effectiveDecisionRecords,
      fixActions: effectiveFixActionRecords,
    })
  }, [
    bookId,
    branchStatus,
    branchWorkspace,
    compareStatus,
    compareError,
    compareWorkspace,
    currentDraftWorkspace,
    exportStatus,
    exportError,
    exportWorkspace,
    optionalSourcesLoading,
    branchError,
    reviewFilter,
    reviewStatusFilter,
    reviewIssueId,
    reviewSeeds,
    effectiveDecisionRecords,
    effectiveFixActionRecords,
    reviewDecisionsQuery.isLoading,
    reviewFixActionsQuery.isLoading,
  ])

  const isLoading =
    currentDraftWorkspace === null
      ? false
      : currentDraftWorkspace === undefined ||
        optionalSourcesLoading ||
        reviewDecisionsQuery.isLoading ||
        reviewFixActionsQuery.isLoading
  const error = compareError ?? exportError ?? branchError
  const isEmpty = !isLoading && error === null && inbox !== undefined && inbox !== null && inbox.filteredIssues.length === 0

  return {
    inbox,
    isLoading,
    error,
    decisionError,
    fixActionError,
    isEmpty,
  }
}
