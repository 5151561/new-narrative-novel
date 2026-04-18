import { useMemo } from 'react'

import { useQueries, useQuery } from '@tanstack/react-query'

import { useI18n } from '@/app/i18n'
import { chapterClient, type ChapterClient } from '@/features/chapter/api/chapter-client'
import { chapterQueryKeys } from '@/features/chapter/hooks/chapter-query-keys'
import { sceneClient, type SceneClient } from '@/features/scene/api/scene-client'
import { sceneQueryKeys } from '@/features/scene/hooks/scene-query-keys'
import {
  useTraceabilitySceneSources,
  type TraceabilitySceneClient,
} from '@/features/traceability/hooks/useTraceabilitySceneSources'

import { bookClient, type BookClient } from '../api/book-client'
import { buildBookStructureWorkspaceViewModel } from '../lib/book-workspace-mappers'
import type { BookSceneTraceRollup } from '../types/book-view-models'
import { bookQueryKeys } from './book-query-keys'

interface UseBookStructureWorkspaceQueryInput {
  bookId: string
  selectedChapterId?: string | null
}

interface BookStructureWorkspaceQueryDeps {
  bookClient?: Pick<BookClient, 'getBookStructureRecord'>
  chapterClient?: Pick<ChapterClient, 'getChapterStructureWorkspace'>
  sceneClient?: Pick<SceneClient, 'getSceneProse'>
  traceabilitySceneClient?: TraceabilitySceneClient
}

function buildTraceRollup(sceneId: string, trace: ReturnType<typeof useTraceabilitySceneSources>['traceBySceneId'][string]): BookSceneTraceRollup | null {
  if (!trace) {
    return null
  }

  return {
    sceneId,
    acceptedFactCount: trace.acceptedFacts.length,
    relatedAssetCount: trace.relatedAssets.length,
    sourceProposalCount: trace.sourceProposals.length,
    missingLinks: trace.missingLinks,
  }
}

export function useBookStructureWorkspaceQuery(
  { bookId, selectedChapterId }: UseBookStructureWorkspaceQueryInput,
  {
    bookClient: customBookClient = bookClient,
    chapterClient: customChapterClient = chapterClient,
    sceneClient: customSceneClient = sceneClient,
    traceabilitySceneClient = sceneClient,
  }: BookStructureWorkspaceQueryDeps = {},
) {
  const { locale } = useI18n()
  const bookRecordQuery = useQuery({
    queryKey: bookQueryKeys.workspace(bookId, locale),
    queryFn: () => customBookClient.getBookStructureRecord({ bookId }),
  })

  const chapterIds = bookRecordQuery.data?.chapterIds ?? []
  const chapterQueries = useQueries({
    queries: chapterIds.map((chapterId) => ({
      queryKey: chapterQueryKeys.workspace(chapterId),
      queryFn: () => customChapterClient.getChapterStructureWorkspace({ chapterId }),
    })),
  })

  const missingChapterWorkspaceIds = useMemo(
    () =>
      chapterIds.filter((_, index) => {
        const query = chapterQueries[index]
        return query?.status === 'success' && query.data === null
      }),
    [chapterIds, chapterQueries],
  )

  const missingChapterWorkspaceError = useMemo(() => {
    if (missingChapterWorkspaceIds.length === 0) {
      return null
    }

    return new Error(
      `Book "${bookId}" references missing chapter workspace(s): ${missingChapterWorkspaceIds.join(', ')}`,
    )
  }, [bookId, missingChapterWorkspaceIds])

  const orderedSceneIds = useMemo(
    () =>
      chapterIds.flatMap((_, index) => {
        const chapter = chapterQueries[index]?.data
        if (!chapter) {
          return []
        }

        return [...chapter.scenes].sort((left, right) => left.order - right.order).map((scene) => scene.id)
      }),
    [chapterIds, chapterQueries],
  )

  const proseQueries = useQueries({
    queries: orderedSceneIds.map((sceneId) => ({
      queryKey: sceneQueryKeys.prose(sceneId, locale),
      queryFn: () => customSceneClient.getSceneProse(sceneId),
    })),
  })

  const proseStateBySceneId = useMemo(
    () =>
      Object.fromEntries(
        orderedSceneIds.map((sceneId, index) => {
          const query = proseQueries[index]

          return [
            sceneId,
            {
              proseState: {
                prose: query?.data ?? undefined,
                isLoading: query?.isLoading ?? false,
                error: query?.error instanceof Error ? query.error : null,
              },
            },
          ]
        }),
      ),
    [orderedSceneIds, proseQueries],
  )

  const traceability = useTraceabilitySceneSources(orderedSceneIds, traceabilitySceneClient, {
    sceneSourceSeedsBySceneId: proseStateBySceneId,
  })

  const error =
    (bookRecordQuery.error as Error | null | undefined) ??
    missingChapterWorkspaceError ??
    chapterQueries.find((query) => query.error instanceof Error)?.error ??
    proseQueries.find((query) => query.error instanceof Error)?.error ??
    traceability.error ??
    null

  const chapterWorkspacesById = useMemo(
    () =>
      Object.fromEntries(
        chapterIds.map((chapterId, index) => [chapterId, chapterQueries[index]?.data]),
      ),
    [chapterIds, chapterQueries],
  )

  const sceneProseBySceneId = useMemo(
    () =>
      Object.fromEntries(
        orderedSceneIds.map((sceneId, index) => [sceneId, proseQueries[index]?.data]),
      ),
    [orderedSceneIds, proseQueries],
  )

  const traceRollupsBySceneId = useMemo(
    () =>
      Object.fromEntries(
        orderedSceneIds.map((sceneId) => [sceneId, buildTraceRollup(sceneId, traceability.traceBySceneId[sceneId])]),
      ),
    [orderedSceneIds, traceability.traceBySceneId],
  )

  const chaptersReady = chapterIds.every((_, index) => chapterQueries[index]?.status === 'success')
  const proseReady = orderedSceneIds.every((_, index) => proseQueries[index]?.status === 'success')
  const isLoading =
    bookRecordQuery.isLoading ||
    (bookRecordQuery.data !== null &&
      bookRecordQuery.data !== undefined &&
      error === null &&
      (!chaptersReady || !proseReady || traceability.isLoading))

  const workspace = useMemo(() => {
    if (bookRecordQuery.data === undefined || !chaptersReady || !proseReady || traceability.isLoading || error) {
      return undefined
    }

    if (bookRecordQuery.data === null) {
      return null
    }

    return buildBookStructureWorkspaceViewModel({
      record: bookRecordQuery.data,
      locale,
      selectedChapterId,
      chapterWorkspacesById,
      sceneProseBySceneId,
      traceRollupsBySceneId,
    })
  }, [
    bookRecordQuery.data,
    chapterWorkspacesById,
    chaptersReady,
    error,
    locale,
    proseReady,
    sceneProseBySceneId,
    selectedChapterId,
    traceRollupsBySceneId,
    traceability.isLoading,
  ])

  return {
    workspace,
    isLoading,
    error,
    refetch: async () => {
      await Promise.all([
        bookRecordQuery.refetch(),
        ...chapterQueries.map((query) => query.refetch()),
        ...proseQueries.map((query) => query.refetch()),
        traceability.refetch(),
      ])
    },
  }
}
