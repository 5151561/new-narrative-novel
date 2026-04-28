import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'

import { useI18n } from '@/app/i18n'
import { resolveProjectRuntimeDependency, useOptionalProjectRuntime } from '@/app/project-runtime'
import type { BookBranchBaseline } from '@/features/workbench/types/workbench-route'

import { DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID } from '../api/book-manuscript-checkpoints'
import { bookClient, type BookClient } from '../api/book-client'
import {
  buildBookExperimentBranchWorkspace,
  normalizeBookExperimentBranch,
} from '../lib/book-experiment-branch-mappers'
import type { BookExperimentBranchWorkspaceViewModel, BookExperimentBranchSummaryViewModel } from '../types/book-branch-view-models'
import type { BookDraftWorkspaceViewModel } from '../types/book-draft-view-models'
import { bookQueryKeys } from './book-query-keys'

const DEFAULT_BOOK_EXPERIMENT_BRANCH_ID = 'branch-book-signal-arc-quiet-ending'

interface UseBookExperimentBranchQueryInput {
  bookId: string
  currentDraftWorkspace: BookDraftWorkspaceViewModel | null | undefined
  branchId?: string | null
  branchBaseline: BookBranchBaseline
  checkpointId?: string | null
}

interface UseBookExperimentBranchQueryDeps {
  bookClient?: Pick<BookClient, 'getBookExperimentBranches' | 'getBookExperimentBranch' | 'getBookManuscriptCheckpoint'>
}

export interface UseBookExperimentBranchQueryResult {
  branchWorkspace: BookExperimentBranchWorkspaceViewModel | null | undefined
  branches: BookExperimentBranchSummaryViewModel[] | undefined
  selectedBranch: BookExperimentBranchSummaryViewModel | null | undefined
  isLoading: boolean
  error: Error | null
}

export function useBookExperimentBranchQuery(
  { bookId, currentDraftWorkspace, branchId, branchBaseline, checkpointId }: UseBookExperimentBranchQueryInput,
  { bookClient: customBookClient }: UseBookExperimentBranchQueryDeps = {},
): UseBookExperimentBranchQueryResult {
  const runtime = useOptionalProjectRuntime()
  const { locale } = useI18n()
  const effectiveBranchId = branchId ?? DEFAULT_BOOK_EXPERIMENT_BRANCH_ID
  const effectiveCheckpointId = checkpointId ?? DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID
  const checkpointEnabled = branchBaseline === 'checkpoint'
  const branchQueriesEnabled =
    currentDraftWorkspace !== undefined && currentDraftWorkspace !== null
  const branchesQueryKey = bookQueryKeys.branches(bookId, locale)
  const selectedBranchQueryKey = bookQueryKeys.branch(bookId, effectiveBranchId, locale)
  const selectedCheckpointQueryKey = bookQueryKeys.checkpoint(bookId, effectiveCheckpointId, locale)
  const effectiveBookClient = resolveProjectRuntimeDependency(
    customBookClient,
    runtime?.bookClient,
    'useBookExperimentBranchQuery',
    'deps.bookClient',
  )

  const branchesQuery = useQuery({
    queryKey: branchesQueryKey,
    queryFn: () => effectiveBookClient.getBookExperimentBranches({ bookId }),
    enabled: branchQueriesEnabled,
  })

  const selectedBranchQuery = useQuery({
    queryKey: selectedBranchQueryKey,
    queryFn: () => effectiveBookClient.getBookExperimentBranch({ bookId, branchId: effectiveBranchId }),
    enabled: branchQueriesEnabled,
  })

  const selectedCheckpointQuery = useQuery({
    queryKey: selectedCheckpointQueryKey,
    queryFn: () => effectiveBookClient.getBookManuscriptCheckpoint({ bookId, checkpointId: effectiveCheckpointId }),
    enabled: branchQueriesEnabled && checkpointEnabled,
  })

  const branches = useMemo(
    () =>
      !branchQueriesEnabled
        ? undefined
        : branchesQuery.data?.map((record) => normalizeBookExperimentBranch(record, locale) satisfies BookExperimentBranchSummaryViewModel),
    [branchQueriesEnabled, branchesQuery.data, locale],
  )

  const selectedBranch = useMemo(
    () =>
      !branchQueriesEnabled
        ? undefined
        : selectedBranchQuery.data === undefined
          ? undefined
          : selectedBranchQuery.data === null
            ? null
            : normalizeBookExperimentBranch(selectedBranchQuery.data, locale),
    [branchQueriesEnabled, locale, selectedBranchQuery.data],
  )

  const branchWorkspace = useMemo(() => {
    if (!branchQueriesEnabled) {
      return undefined
    }

    if (currentDraftWorkspace === undefined || branchesQuery.data === undefined || selectedBranchQuery.data === undefined) {
      return undefined
    }

    if (checkpointEnabled && selectedCheckpointQuery.data === undefined) {
      return undefined
    }

    if (branchesQuery.error) {
      return undefined
    }

    if (currentDraftWorkspace === null || selectedBranchQuery.data === null) {
      return null
    }

    if (checkpointEnabled && selectedCheckpointQuery.data === null) {
      return null
    }

    return buildBookExperimentBranchWorkspace({
      currentDraftWorkspace,
      branch: selectedBranchQuery.data,
      branches: branchesQuery.data,
      checkpoint: checkpointEnabled ? (selectedCheckpointQuery.data ?? null) : null,
      branchBaseline,
      locale,
    })
  }, [
    branchBaseline,
    branchesQuery.data,
    checkpointEnabled,
    currentDraftWorkspace,
    locale,
    selectedBranchQuery.data,
    selectedCheckpointQuery.data,
  ])

  const missingBranchError =
    branchQueriesEnabled && !selectedBranchQuery.isLoading && selectedBranchQuery.data === null
      ? new Error(`Book experiment branch "${effectiveBranchId}" could not be found for "${bookId}".`)
      : null
  const missingCheckpointError =
    branchQueriesEnabled && checkpointEnabled && !selectedCheckpointQuery.isLoading && selectedCheckpointQuery.data === null
      ? new Error(`Book manuscript checkpoint "${effectiveCheckpointId}" could not be found for "${bookId}".`)
      : null

  const error =
    !branchQueriesEnabled
      ? null
      : (branchesQuery.error instanceof Error ? branchesQuery.error : null) ??
        (selectedBranchQuery.error instanceof Error ? selectedBranchQuery.error : null) ??
        (selectedCheckpointQuery.error instanceof Error ? selectedCheckpointQuery.error : null) ??
        missingBranchError ??
        missingCheckpointError

  return {
    branchWorkspace,
    branches,
    selectedBranch,
    isLoading:
      currentDraftWorkspace === undefined ||
      (branchQueriesEnabled &&
        (branchesQuery.isLoading ||
          selectedBranchQuery.isLoading ||
          (checkpointEnabled && selectedCheckpointQuery.isLoading))),
    error,
  }
}
