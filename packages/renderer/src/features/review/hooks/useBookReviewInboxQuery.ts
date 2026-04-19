import { useMemo } from 'react'

import type { BookExperimentBranchWorkspaceViewModel } from '@/features/book/types/book-branch-view-models'
import type { BookManuscriptCompareWorkspaceViewModel } from '@/features/book/types/book-compare-view-models'
import type { BookDraftWorkspaceViewModel } from '@/features/book/types/book-draft-view-models'
import type { BookExportPreviewWorkspaceViewModel } from '@/features/book/types/book-export-view-models'
import type { BookReviewFilter } from '@/features/workbench/types/workbench-route'

import { getBookReviewSeeds } from '../api/book-review-seeds'
import { buildBookReviewInboxViewModel } from '../lib/book-review-inbox-mappers'
import type { BookReviewInboxViewModel, ReviewOptionalSourceStatus } from '../types/review-view-models'

interface UseBookReviewInboxQueryInput {
  bookId: string
  currentDraftWorkspace: BookDraftWorkspaceViewModel | null | undefined
  compareWorkspace?: BookManuscriptCompareWorkspaceViewModel | null | undefined
  compareStatus?: ReviewOptionalSourceStatus
  exportWorkspace?: BookExportPreviewWorkspaceViewModel | null | undefined
  exportStatus?: ReviewOptionalSourceStatus
  branchWorkspace?: BookExperimentBranchWorkspaceViewModel | null | undefined
  branchStatus?: ReviewOptionalSourceStatus
  reviewFilter?: BookReviewFilter
  reviewIssueId?: string
}

export interface UseBookReviewInboxQueryResult {
  inbox: BookReviewInboxViewModel | null | undefined
  isLoading: boolean
  error: Error | null
  isEmpty: boolean
}

export function useBookReviewInboxQuery({
  bookId,
  currentDraftWorkspace,
  compareWorkspace,
  compareStatus = compareWorkspace === undefined ? 'idle' : 'ready',
  exportWorkspace,
  exportStatus = exportWorkspace === undefined ? 'idle' : 'ready',
  branchWorkspace,
  branchStatus = branchWorkspace === undefined ? 'idle' : 'ready',
  reviewFilter = 'all',
  reviewIssueId,
}: UseBookReviewInboxQueryInput): UseBookReviewInboxQueryResult {
  const reviewSeeds = useMemo(() => getBookReviewSeeds(bookId), [bookId])
  const optionalSourcesLoading =
    compareStatus === 'loading' || exportStatus === 'loading' || branchStatus === 'loading'

  const inbox = useMemo(() => {
    if (currentDraftWorkspace === undefined || optionalSourcesLoading) {
      return undefined
    }

    if (currentDraftWorkspace === null) {
      return null
    }

    return buildBookReviewInboxViewModel({
      bookId,
      currentDraftWorkspace,
      compareWorkspace: compareStatus === 'ready' ? (compareWorkspace ?? null) : undefined,
      exportWorkspace: exportStatus === 'ready' ? (exportWorkspace ?? null) : undefined,
      branchWorkspace: branchStatus === 'ready' ? (branchWorkspace ?? null) : undefined,
      reviewSeeds,
      reviewFilter,
      reviewIssueId,
    })
  }, [
    bookId,
    branchStatus,
    branchWorkspace,
    compareStatus,
    compareWorkspace,
    currentDraftWorkspace,
    exportStatus,
    exportWorkspace,
    optionalSourcesLoading,
    reviewFilter,
    reviewIssueId,
    reviewSeeds,
  ])

  const isLoading = currentDraftWorkspace === undefined || optionalSourcesLoading
  const error = null
  const isEmpty = !isLoading && error === null && inbox !== undefined && inbox !== null && inbox.filteredIssues.length === 0

  return {
    inbox,
    isLoading,
    error,
    isEmpty,
  }
}
