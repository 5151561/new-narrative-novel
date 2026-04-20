import { useQuery } from '@tanstack/react-query'

import { useI18n } from '@/app/i18n'
import { resolveProjectRuntimeDependency, useOptionalProjectRuntime } from '@/app/project-runtime'
import type { SceneClient } from '@/features/scene/api/scene-client'

import { sceneQueryKeys } from './scene-query-keys'

export function useSceneExecutionQuery(sceneId: string, client?: SceneClient) {
  const runtime = useOptionalProjectRuntime()
  const { locale } = useI18n()
  const effectiveClient = resolveProjectRuntimeDependency(
    client,
    runtime?.sceneClient,
    'useSceneExecutionQuery',
    'client',
  )
  const query = useQuery({
    queryKey: sceneQueryKeys.execution(sceneId, locale),
    queryFn: () => effectiveClient.getSceneExecution(sceneId),
  })

  return {
    objective: query.data?.objective ?? {
      goal: '',
      warningsCount: 0,
      unresolvedCount: 0,
      cast: [],
      constraintSummary: [],
    },
    beats: query.data?.beats ?? [],
    proposals: query.data?.proposals ?? [],
    acceptedSummary: query.data?.acceptedSummary ?? {
      sceneSummary: '',
      acceptedFacts: [],
      readiness: 'not-ready' as const,
      pendingProposalCount: 0,
      warningCount: 0,
      patchCandidateCount: 0,
    },
    runtimeSummary: query.data?.runtimeSummary ?? {
      runHealth: 'stable' as const,
      latencyLabel: '',
      tokenLabel: '',
      costLabel: '',
    },
    latestConsistency: query.data?.consistencySummary,
    canContinueRun: query.data?.canContinueRun ?? false,
    canOpenProse: query.data?.canOpenProse ?? false,
    isLoading: query.isLoading,
    error: query.error,
  }
}
