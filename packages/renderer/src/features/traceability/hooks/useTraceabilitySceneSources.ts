import { useMemo } from 'react'

import { useQueries } from '@tanstack/react-query'

import { useI18n } from '@/app/i18n'
import { resolveProjectRuntimeDependency, useOptionalProjectRuntime } from '@/app/project-runtime'
import type { ChapterDraftSceneProseState } from '@/features/chapter/hooks/useChapterDraftWorkspaceQuery'
import type { SceneClient } from '@/features/scene/api/scene-client'
import { sceneQueryKeys } from '@/features/scene/hooks/scene-query-keys'

import { buildSceneTraceabilityViewModel } from '../lib/traceability-mappers'

export type TraceabilitySceneClient = Pick<
  SceneClient,
  'getSceneExecution' | 'getSceneProse' | 'getSceneInspector' | 'previewAcceptedPatch'
>

interface TraceabilitySceneSourceSeed {
  proseState?: ChapterDraftSceneProseState
}

interface UseTraceabilitySceneSourcesOptions {
  sceneSourceSeedsBySceneId?: Record<string, TraceabilitySceneSourceSeed | undefined>
}

type TraceabilityQueryKind = 'execution' | 'prose' | 'inspector' | 'patchPreview'

interface TraceabilityQueryDescriptor {
  sceneId: string
  kind: TraceabilityQueryKind
  query: {
    queryKey: readonly unknown[]
    queryFn: () => Promise<unknown>
  }
}

function isSeededProseReady(seed: TraceabilitySceneSourceSeed | undefined) {
  if (!seed?.proseState) {
    return false
  }

  return Boolean(seed.proseState.prose) || seed.proseState.error !== null || !seed.proseState.isLoading
}

function getSeededProseError(seed: TraceabilitySceneSourceSeed | undefined) {
  return seed?.proseState?.error ?? null
}

export function useTraceabilitySceneSources(
  sceneIds: string[],
  client?: TraceabilitySceneClient,
  { sceneSourceSeedsBySceneId = {} }: UseTraceabilitySceneSourcesOptions = {},
) {
  const runtime = useOptionalProjectRuntime()
  const { locale } = useI18n()
  const effectiveClient = resolveProjectRuntimeDependency(
    client,
    runtime?.traceabilitySceneClient,
    'useTraceabilitySceneSources',
    'client',
  )
  const queryPlan = useMemo(() => {
    const descriptors: TraceabilityQueryDescriptor[] = []

    for (const sceneId of sceneIds) {
      descriptors.push({
        sceneId,
        kind: 'execution',
        query: {
          queryKey: sceneQueryKeys.execution(sceneId, locale),
          queryFn: () => effectiveClient.getSceneExecution(sceneId),
        },
      })

      if (!sceneSourceSeedsBySceneId[sceneId]?.proseState) {
        descriptors.push({
          sceneId,
          kind: 'prose',
          query: {
            queryKey: sceneQueryKeys.prose(sceneId, locale),
            queryFn: () => effectiveClient.getSceneProse(sceneId),
          },
        })
      }

      descriptors.push({
        sceneId,
        kind: 'inspector',
        query: {
          queryKey: sceneQueryKeys.inspector(sceneId, locale),
          queryFn: () => effectiveClient.getSceneInspector(sceneId),
        },
      })

      descriptors.push({
        sceneId,
        kind: 'patchPreview',
        query: {
          queryKey: sceneQueryKeys.patchPreview(sceneId, locale),
          queryFn: () => effectiveClient.previewAcceptedPatch(sceneId),
        },
      })
    }

    return descriptors
  }, [effectiveClient, locale, sceneIds, sceneSourceSeedsBySceneId])
  const queries = useQueries({
    queries: queryPlan.map((descriptor) => descriptor.query),
  })
  const queryRefsBySceneId = useMemo(() => {
    const refsBySceneId: Record<
      string,
      Partial<Record<TraceabilityQueryKind, (typeof queries)[number]>>
    > = {}

    queryPlan.forEach((descriptor, index) => {
      refsBySceneId[descriptor.sceneId] ??= {}
      refsBySceneId[descriptor.sceneId]![descriptor.kind] = queries[index]
    })

    return refsBySceneId
  }, [queries, queryPlan])

  const sceneStateBySceneId = useMemo(
    () =>
      Object.fromEntries(
        sceneIds.map((sceneId) => {
          const queryRefs = queryRefsBySceneId[sceneId] ?? {}
          const executionQuery = queryRefs.execution
          const proseQuery = queryRefs.prose
          const inspectorQuery = queryRefs.inspector
          const patchPreviewQuery = queryRefs.patchPreview
          const proseSeed = sceneSourceSeedsBySceneId[sceneId]
          const executionReady = executionQuery?.status === 'success'
          const proseReady = proseSeed ? isSeededProseReady(proseSeed) : proseQuery?.status === 'success'
          const inspectorReady = inspectorQuery?.status === 'success'
          const patchPreviewReady = patchPreviewQuery?.status === 'success'
          const isComplete = Boolean(executionReady && proseReady && inspectorReady && patchPreviewReady)
          const error =
            (executionQuery?.error as Error | null | undefined) ??
            getSeededProseError(proseSeed) ??
            (proseQuery?.error as Error | null | undefined) ??
            (inspectorQuery?.error as Error | null | undefined) ??
            (patchPreviewQuery?.error as Error | null | undefined) ??
            null

          return [
            sceneId,
            {
              isComplete,
              data: isComplete
                ? buildSceneTraceabilityViewModel({
                    sceneId,
                    execution: executionQuery?.data,
                    prose: proseSeed?.proseState?.prose ?? proseQuery?.data,
                    inspector: inspectorQuery?.data,
                    patchPreview: patchPreviewQuery?.data,
                  })
                : null,
              error,
            },
          ]
        }),
      ) as Record<
        string,
        {
          isComplete: boolean
          data: ReturnType<typeof buildSceneTraceabilityViewModel> | null
          error: Error | null
        }
      >,
    [queryRefsBySceneId, sceneIds, sceneSourceSeedsBySceneId],
  )

  const traceBySceneId = useMemo(
    () =>
      Object.fromEntries(
        sceneIds.map((sceneId, index) => {
          const sceneState = sceneStateBySceneId[sceneId]
          return [sceneId, sceneState?.data ?? null]
        }),
      ) as Record<string, ReturnType<typeof buildSceneTraceabilityViewModel> | null>,
    [sceneIds, sceneStateBySceneId],
  )

  return {
    sceneStateBySceneId,
    traceBySceneId,
    isComplete: sceneIds.every((sceneId) => sceneStateBySceneId[sceneId]?.isComplete ?? false),
    isLoading:
      sceneIds.some((sceneId) => {
        const sceneState = sceneStateBySceneId[sceneId]
        if (!sceneState) {
          return true
        }

        return !sceneState.isComplete && sceneState.error === null
      }),
    error: sceneIds.map((sceneId) => sceneStateBySceneId[sceneId]?.error).find((error) => error instanceof Error) ?? null,
    refetch: async () => {
      await Promise.all(queries.map((query) => query.refetch()))
    },
  }
}
