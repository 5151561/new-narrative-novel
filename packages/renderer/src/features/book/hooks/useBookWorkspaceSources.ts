import { useMemo } from 'react'

import { useQueries, useQuery } from '@tanstack/react-query'

import { useI18n } from '@/app/i18n'
import { resolveProjectRuntimeDependency, useOptionalProjectRuntime } from '@/app/project-runtime'
import { chapterClient, type ChapterClient } from '@/features/chapter/api/chapter-client'
import { chapterQueryKeys } from '@/features/chapter/hooks/chapter-query-keys'
import type { ChapterStructureWorkspaceRecord } from '@/features/chapter/api/chapter-records'
import { sceneClient, type SceneClient } from '@/features/scene/api/scene-client'
import { sceneQueryKeys } from '@/features/scene/hooks/scene-query-keys'
import type { SceneProseViewModel } from '@/features/scene/types/scene-view-models'
import {
  useTraceabilitySceneSources,
  type TraceabilitySceneClient,
} from '@/features/traceability/hooks/useTraceabilitySceneSources'

import { bookClient, type BookClient } from '../api/book-client'
import type { BookStructureRecord } from '../api/book-records'
import { bookQueryKeys } from './book-query-keys'
import type { BookSceneTraceRollup } from '../types/book-view-models'

export interface BookWorkspaceSourcesInput {
  bookId: string
  enabled?: boolean
}

interface BookWorkspaceSourcesDeps {
  bookClient?: Pick<BookClient, 'getBookStructureRecord'>
  chapterClient?: Pick<ChapterClient, 'getChapterStructureWorkspace'>
  sceneClient?: Pick<SceneClient, 'getSceneProse'>
  traceabilitySceneClient?: TraceabilitySceneClient
}

export interface BookSceneProseState {
  prose?: SceneProseViewModel | null
  isLoading: boolean
  error: Error | null
}

interface ApiLikeErrorShape {
  status?: number
  code?: string
  detail?: unknown
}

function asApiLikeError(error: unknown): ApiLikeErrorShape | null {
  if (!error || typeof error !== 'object') {
    return null
  }

  return error as ApiLikeErrorShape
}

function isMissingSceneDetail(detail: unknown, sceneId: string) {
  if (!detail || typeof detail !== 'object' || !('sceneId' in detail)) {
    return false
  }

  return detail.sceneId === sceneId
}

function shouldIgnoreMissingSceneError(sceneId: string, error: unknown) {
  const apiError = asApiLikeError(error)
  if (apiError?.status !== 404) {
    return false
  }

  if (!isMissingSceneDetail(apiError.detail, sceneId)) {
    return false
  }

  return apiError.code === 'SCENE_NOT_FOUND'
}

function buildTraceRollup(
  sceneId: string,
  trace: ReturnType<typeof useTraceabilitySceneSources>['traceBySceneId'][string],
): BookSceneTraceRollup | null {
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

export function useBookWorkspaceSources(
  { bookId, enabled = true }: BookWorkspaceSourcesInput,
  {
    bookClient: customBookClient,
    chapterClient: customChapterClient,
    sceneClient: customSceneClient,
    traceabilitySceneClient: customTraceabilitySceneClient,
  }: BookWorkspaceSourcesDeps = {},
) {
  const runtime = useOptionalProjectRuntime()
  const { locale } = useI18n()
  const effectiveBookClient = enabled
    ? resolveProjectRuntimeDependency(
        customBookClient,
        runtime?.bookClient,
        'useBookWorkspaceSources',
        'deps.bookClient',
      )
    : (customBookClient ?? runtime?.bookClient ?? bookClient)
  const effectiveChapterClient = enabled
    ? resolveProjectRuntimeDependency(
        customChapterClient,
        runtime?.chapterClient,
        'useBookWorkspaceSources',
        'deps.chapterClient',
      )
    : (customChapterClient ?? runtime?.chapterClient ?? chapterClient)
  const effectiveSceneClient = enabled
    ? resolveProjectRuntimeDependency(
        customSceneClient,
        runtime?.sceneClient,
        'useBookWorkspaceSources',
        'deps.sceneClient',
      )
    : (customSceneClient ?? runtime?.sceneClient ?? sceneClient)
  const effectiveTraceabilitySceneClient = enabled
    ? resolveProjectRuntimeDependency(
        customTraceabilitySceneClient,
        runtime?.traceabilitySceneClient,
        'useBookWorkspaceSources',
        'deps.traceabilitySceneClient',
      )
    : (customTraceabilitySceneClient ?? runtime?.traceabilitySceneClient ?? sceneClient)
  const bookRecordQuery = useQuery({
    queryKey: bookQueryKeys.workspace(bookId, locale),
    queryFn: () => effectiveBookClient.getBookStructureRecord({ bookId }),
    enabled,
  })

  const orderedChapterIds = enabled ? bookRecordQuery.data?.chapterIds ?? [] : []
  const chapterQueries = useQueries({
    queries: orderedChapterIds.map((chapterId) => ({
      queryKey: chapterQueryKeys.workspace(chapterId),
      queryFn: () => effectiveChapterClient.getChapterStructureWorkspace({ chapterId }),
      enabled,
    })),
  })

  const missingChapterWorkspaceIds = useMemo(
    () =>
      orderedChapterIds.filter((_, index) => {
        const query = chapterQueries[index]
        return query?.status === 'success' && query.data === null
      }),
    [chapterQueries, orderedChapterIds],
  )

  const missingChapterWorkspaceError = useMemo(() => {
    if (missingChapterWorkspaceIds.length === 0) {
      return null
    }

    return new Error(
      `Book "${bookId}" references missing chapter workspace(s): ${missingChapterWorkspaceIds.join(', ')}`,
    )
  }, [bookId, missingChapterWorkspaceIds])

  const chapterWorkspacesById = useMemo(
    () =>
      Object.fromEntries(
        orderedChapterIds.map((chapterId, index) => [chapterId, chapterQueries[index]?.data]),
      ) as Record<string, ChapterStructureWorkspaceRecord | null | undefined>,
    [chapterQueries, orderedChapterIds],
  )

  const orderedSceneIds = useMemo(
    () =>
      orderedChapterIds.flatMap((chapterId) => {
        const chapter = chapterWorkspacesById[chapterId]
        if (!chapter) {
          return []
        }

        return [...chapter.scenes]
          .sort((left, right) => left.order - right.order)
          .map((scene) => scene.id)
      }),
    [chapterWorkspacesById, orderedChapterIds],
  )

  const proseQueries = useQueries({
    queries: orderedSceneIds.map((sceneId) => ({
      queryKey: sceneQueryKeys.prose(sceneId, locale),
      queryFn: () => effectiveSceneClient.getSceneProse(sceneId),
      enabled,
    })),
  })

  const sceneProseStateBySceneId = useMemo(
    () =>
      Object.fromEntries(
        orderedSceneIds.map((sceneId, index) => {
          const query = proseQueries[index]
          const rawError = query?.error instanceof Error ? query.error : null
          const error = rawError && shouldIgnoreMissingSceneError(sceneId, rawError) ? null : rawError

          return [
            sceneId,
            {
              prose: query?.data ?? undefined,
              isLoading: query?.isLoading ?? false,
              error,
            } satisfies BookSceneProseState,
          ]
        }),
      ) as Record<string, BookSceneProseState>,
    [orderedSceneIds, proseQueries],
  )

  const sceneProseBySceneId = useMemo(
    () =>
      Object.fromEntries(
        orderedSceneIds.map((sceneId) => [sceneId, sceneProseStateBySceneId[sceneId]?.prose]),
      ) as Record<string, SceneProseViewModel | null | undefined>,
    [orderedSceneIds, sceneProseStateBySceneId],
  )

  const traceability = useTraceabilitySceneSources(enabled ? orderedSceneIds : [], effectiveTraceabilitySceneClient, {
    sceneSourceSeedsBySceneId: Object.fromEntries(
      orderedSceneIds.map((sceneId) => [
        sceneId,
        {
          proseState: sceneProseStateBySceneId[sceneId],
        },
      ]),
    ),
  })

  const traceRollupsBySceneId = useMemo(
    () =>
      Object.fromEntries(
        orderedSceneIds.map((sceneId) => [sceneId, buildTraceRollup(sceneId, traceability.traceBySceneId[sceneId])]),
      ) as Record<string, BookSceneTraceRollup | null | undefined>,
    [orderedSceneIds, traceability.traceBySceneId],
  )

  const chaptersReady = orderedChapterIds.every((_, index) => chapterQueries[index]?.status === 'success')
  const proseReady = orderedSceneIds.every((sceneId) => {
    const state = sceneProseStateBySceneId[sceneId]
    return Boolean(state && !state.isLoading)
  })
  const traceReady = orderedSceneIds.every((sceneId) => {
    const trace = traceability.sceneStateBySceneId[sceneId]
    return Boolean(trace && (trace.isComplete || trace.error))
  })
  const traceError =
    orderedSceneIds
      .map((sceneId) => {
        const sceneError = traceability.sceneStateBySceneId[sceneId]?.error
        if (!sceneError || shouldIgnoreMissingSceneError(sceneId, sceneError)) {
          return null
        }

        return sceneError
      })
      .find((sceneError): sceneError is Error => sceneError instanceof Error) ?? null

  const error =
    !enabled
      ? null
      : (bookRecordQuery.error as Error | null | undefined) ??
        missingChapterWorkspaceError ??
        chapterQueries.find((query) => query.error instanceof Error)?.error ??
        orderedSceneIds
          .map((sceneId) => sceneProseStateBySceneId[sceneId]?.error)
          .find((sceneError): sceneError is Error => sceneError instanceof Error) ??
        traceError ??
        null

  const isLoading =
    enabled &&
    (bookRecordQuery.isLoading ||
      (bookRecordQuery.data !== null &&
        bookRecordQuery.data !== undefined &&
        error === null &&
        (!chaptersReady || !proseReady || !traceReady)))

  return {
    bookRecord: enabled ? (bookRecordQuery.data as BookStructureRecord | null | undefined) : undefined,
    orderedChapterIds,
    orderedSceneIds,
    chapterWorkspacesById,
    sceneProseBySceneId,
    sceneProseStateBySceneId,
    traceRollupsBySceneId,
    chaptersReady,
    proseReady,
    traceReady,
    isLoading,
    error,
    refetch: async () => {
      if (!enabled) {
        return
      }
      await Promise.all([
        bookRecordQuery.refetch(),
        ...chapterQueries.map((query) => query.refetch()),
        ...proseQueries.map((query) => query.refetch()),
        traceability.refetch(),
      ])
    },
  }
}
