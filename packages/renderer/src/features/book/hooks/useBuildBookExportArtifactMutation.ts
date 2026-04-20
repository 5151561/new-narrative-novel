import { useMutation, useQueryClient } from '@tanstack/react-query'

import { resolveProjectRuntimeDependency, useOptionalProjectRuntime } from '@/app/project-runtime'
import { bookClient, type BookClient } from '../api/book-client'
import type { BookExportArtifactFormat, BookExportArtifactRecord } from '../api/book-export-artifact-records'
import {
  buildBookExportArtifactGate,
  buildBookExportArtifactInput,
} from '../lib/book-export-artifact-mappers'
import type { BookExportPreviewWorkspaceViewModel } from '../types/book-export-view-models'
import type { BookReviewInboxViewModel } from '@/features/review/types/review-view-models'
import { bookQueryKeys } from './book-query-keys'

interface UseBuildBookExportArtifactMutationOptions {
  checkpointId?: string | null
  bookClient?: Pick<BookClient, 'buildBookExportArtifact'>
}

interface BuildBookExportArtifactMutationInput {
  exportPreview: BookExportPreviewWorkspaceViewModel
  reviewInbox: BookReviewInboxViewModel | null
  format: BookExportArtifactFormat
}

export function useBuildBookExportArtifactMutation({
  checkpointId,
  bookClient: customBookClient,
}: UseBuildBookExportArtifactMutationOptions = {}) {
  const runtime = useOptionalProjectRuntime()
  const queryClient = useQueryClient()
  const effectiveBookClient = resolveProjectRuntimeDependency(
    customBookClient,
    runtime?.bookClient,
    'useBuildBookExportArtifactMutation',
    'options.bookClient',
  )

  return useMutation<BookExportArtifactRecord, Error, BuildBookExportArtifactMutationInput>({
    mutationFn: async ({ exportPreview, reviewInbox, format }) => {
      const gate = buildBookExportArtifactGate({ exportPreview, reviewInbox })
      if (!gate.canBuild) {
        throw new Error('Book export artifact build is blocked by export readiness or review blockers.')
      }

      return effectiveBookClient.buildBookExportArtifact(
        buildBookExportArtifactInput({
          exportPreview,
          reviewInbox,
          format,
          checkpointId,
        }),
      )
    },
    onSuccess: async (artifact, { exportPreview }) => {
      const queryKey = bookQueryKeys.exportArtifacts(exportPreview.bookId, exportPreview.profile.exportProfileId, checkpointId)

      queryClient.setQueryData<BookExportArtifactRecord[]>(queryKey, (current) => [
        artifact,
        ...(current?.filter((item) => item.id !== artifact.id) ?? []),
      ])
      await queryClient.invalidateQueries({ queryKey })
    },
  })
}
