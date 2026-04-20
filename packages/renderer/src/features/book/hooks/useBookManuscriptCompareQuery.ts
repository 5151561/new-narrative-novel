import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'

import { useI18n } from '@/app/i18n'
import { resolveProjectRuntimeDependency, useOptionalProjectRuntime } from '@/app/project-runtime'

import { DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID } from '../api/book-manuscript-checkpoints'
import { bookClient, type BookClient } from '../api/book-client'
import {
  buildCurrentManuscriptSnapshotFromBookDraft,
  compareBookManuscriptSnapshots,
  normalizeBookManuscriptCheckpoint,
} from '../lib/book-manuscript-compare-mappers'
import type { BookDraftWorkspaceViewModel } from '../types/book-draft-view-models'
import type {
  BookManuscriptCheckpointSummaryViewModel,
  BookManuscriptCheckpointViewModel,
  BookManuscriptCompareWorkspaceViewModel,
} from '../types/book-compare-view-models'
import { bookQueryKeys } from './book-query-keys'

interface UseBookManuscriptCompareQueryInput {
  bookId: string
  currentDraftWorkspace: BookDraftWorkspaceViewModel | null | undefined
  checkpointId?: string | null
}

interface UseBookManuscriptCompareQueryDeps {
  bookClient?: Pick<BookClient, 'getBookManuscriptCheckpoints' | 'getBookManuscriptCheckpoint'>
}

export interface UseBookManuscriptCompareQueryResult {
  compareWorkspace: BookManuscriptCompareWorkspaceViewModel | null | undefined
  checkpoints: BookManuscriptCheckpointSummaryViewModel[] | undefined
  selectedCheckpoint: BookManuscriptCheckpointViewModel | null | undefined
  isLoading: boolean
  error: Error | null
}

export function useBookManuscriptCompareQuery(
  { bookId, currentDraftWorkspace, checkpointId }: UseBookManuscriptCompareQueryInput,
  { bookClient: customBookClient }: UseBookManuscriptCompareQueryDeps = {},
): UseBookManuscriptCompareQueryResult {
  const runtime = useOptionalProjectRuntime()
  const { locale } = useI18n()
  const effectiveCheckpointId = checkpointId ?? DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID
  const compareEnabled = currentDraftWorkspace !== undefined && currentDraftWorkspace !== null
  const effectiveBookClient = resolveProjectRuntimeDependency(
    customBookClient,
    runtime?.bookClient,
    'useBookManuscriptCompareQuery',
    'deps.bookClient',
  )

  const checkpointsQuery = useQuery({
    queryKey: bookQueryKeys.checkpoints(bookId, locale),
    queryFn: () => effectiveBookClient.getBookManuscriptCheckpoints({ bookId }),
    enabled: compareEnabled,
  })

  const selectedCheckpointQuery = useQuery({
    queryKey: bookQueryKeys.checkpoint(bookId, effectiveCheckpointId, locale),
    queryFn: () => effectiveBookClient.getBookManuscriptCheckpoint({ bookId, checkpointId: effectiveCheckpointId }),
    enabled: compareEnabled,
  })

  const checkpoints = useMemo(
    () =>
      !compareEnabled
        ? undefined
        : checkpointsQuery.data?.map((record) => {
            const normalized = normalizeBookManuscriptCheckpoint(record, locale)
            return {
              checkpointId: normalized.checkpointId,
              bookId: normalized.bookId,
              title: normalized.title,
              createdAtLabel: normalized.createdAtLabel,
              summary: normalized.summary,
            } satisfies BookManuscriptCheckpointSummaryViewModel
          }),
    [compareEnabled, checkpointsQuery.data, locale],
  )

  const selectedCheckpoint = useMemo(
    () =>
      !compareEnabled
        ? undefined
        : selectedCheckpointQuery.data === undefined
          ? undefined
          : selectedCheckpointQuery.data === null
            ? null
            : normalizeBookManuscriptCheckpoint(selectedCheckpointQuery.data, locale),
    [compareEnabled, locale, selectedCheckpointQuery.data],
  )

  const compareWorkspace = useMemo(() => {
    if (currentDraftWorkspace === undefined || selectedCheckpoint === undefined) {
      return undefined
    }

    if (currentDraftWorkspace === null || selectedCheckpoint === null) {
      return null
    }

    return compareBookManuscriptSnapshots({
      current: buildCurrentManuscriptSnapshotFromBookDraft(currentDraftWorkspace),
      checkpoint: selectedCheckpoint,
      selectedChapterId: currentDraftWorkspace.selectedChapterId,
    })
  }, [currentDraftWorkspace, selectedCheckpoint])

  const missingCheckpointError =
    compareEnabled && !selectedCheckpointQuery.isLoading && selectedCheckpointQuery.data === null
      ? new Error(`Book manuscript checkpoint "${effectiveCheckpointId}" could not be found for "${bookId}".`)
      : null

  const error =
    !compareEnabled
      ? null
      : (checkpointsQuery.error instanceof Error ? checkpointsQuery.error : null) ??
        (selectedCheckpointQuery.error instanceof Error ? selectedCheckpointQuery.error : null) ??
        missingCheckpointError

  return {
    compareWorkspace,
    checkpoints,
    selectedCheckpoint,
    isLoading: currentDraftWorkspace === undefined || (compareEnabled && (checkpointsQuery.isLoading || selectedCheckpointQuery.isLoading)),
    error,
  }
}
