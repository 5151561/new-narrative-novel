import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'

import { resolveProjectRuntimeDependency, useOptionalProjectRuntime } from '@/app/project-runtime'
import { bookClient, type BookClient } from '../api/book-client'
import { buildBookExportArtifactWorkspace } from '../lib/book-export-artifact-mappers'
import type { BookExportArtifactWorkspaceViewModel } from '../types/book-export-artifact-view-models'
import type { BookExportPreviewWorkspaceViewModel } from '../types/book-export-view-models'
import type { BookReviewInboxViewModel } from '@/features/review/types/review-view-models'
import { bookQueryKeys } from './book-query-keys'

interface UseBookExportArtifactWorkspaceQueryInput {
  bookId: string
  exportPreview: BookExportPreviewWorkspaceViewModel | null | undefined
  reviewInbox: BookReviewInboxViewModel | null | undefined
  exportProfileId?: string | null
  checkpointId?: string | null
  enabled?: boolean
}

interface UseBookExportArtifactWorkspaceQueryDeps {
  bookClient?: Pick<BookClient, 'getBookExportArtifacts'>
}

export interface UseBookExportArtifactWorkspaceQueryResult {
  artifactWorkspace: BookExportArtifactWorkspaceViewModel | null | undefined
  isLoading: boolean
  error: Error | null
}

export function useBookExportArtifactWorkspaceQuery(
  {
    bookId,
    exportPreview,
    reviewInbox,
    exportProfileId,
    checkpointId,
    enabled = true,
  }: UseBookExportArtifactWorkspaceQueryInput,
  { bookClient: customBookClient }: UseBookExportArtifactWorkspaceQueryDeps = {},
): UseBookExportArtifactWorkspaceQueryResult {
  const runtime = useOptionalProjectRuntime()
  const artifactsEnabled = enabled && exportPreview !== undefined && exportPreview !== null
  const effectiveExportProfileId = exportProfileId ?? exportPreview?.profile.exportProfileId
  const effectiveBookClient = resolveProjectRuntimeDependency(
    customBookClient,
    runtime?.bookClient,
    'useBookExportArtifactWorkspaceQuery',
    'deps.bookClient',
  )
  const artifactsQuery = useQuery({
    queryKey: bookQueryKeys.exportArtifacts(bookId, effectiveExportProfileId, checkpointId),
    queryFn: () =>
      effectiveBookClient.getBookExportArtifacts({
        bookId,
        exportProfileId: effectiveExportProfileId,
        checkpointId,
      }),
    enabled: artifactsEnabled,
  })

  const artifactWorkspace = useMemo(() => {
    if (!enabled || exportPreview === undefined) {
      return undefined
    }

    if (exportPreview === null) {
      return null
    }

    if (artifactsQuery.data === undefined) {
      return undefined
    }

    return buildBookExportArtifactWorkspace({
      exportPreview,
      reviewInbox,
      artifactRecords: artifactsQuery.data,
      checkpointId,
    })
  }, [artifactsQuery.data, checkpointId, enabled, exportPreview, reviewInbox])

  return {
    artifactWorkspace,
    isLoading: artifactsEnabled && artifactsQuery.isLoading,
    error: artifactsQuery.error instanceof Error ? artifactsQuery.error : null,
  }
}
