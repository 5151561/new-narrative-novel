import { useEffect, useRef, useState } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import { resolveProjectRuntimeDependency, useOptionalProjectRuntime } from '@/app/project-runtime'
import { sceneQueryKeys } from '@/features/scene/hooks/scene-query-keys'
import type { SceneExecutionViewModel, SceneWorkspaceViewModel } from '@/features/scene/types/scene-view-models'

import type { RunClient } from '../api/run-client'
import type {
  CancelRunInput,
  ResumeRunInput,
  RetryRunInput,
  RunRecord,
  RunStatus,
  StartSceneRunInput,
  SubmitRunReviewDecisionInput,
} from '../api/run-records'

import { useRunQuery } from './useRunQuery'
import { useRunEventTimelineQuery } from './useRunEventTimelineQuery'
import { useStartSceneRunMutation } from './useStartSceneRunMutation'
import { useSubmitRunReviewDecisionMutation } from './useSubmitRunReviewDecisionMutation'
import { runQueryKeys } from './run-query-keys'

const ACTIVE_RUN_STATUSES: RunStatus[] = ['queued', 'running', 'waiting_review']
const SCENE_RUN_POLL_INTERVAL_MS = 5000

interface UseSceneRunSessionInput {
  sceneId: string
  runId?: string | null
  latestRunId?: string | null
}

type StartSceneRunOptions = Omit<StartSceneRunInput, 'sceneId'>
type SubmitSceneRunDecisionOptions = Omit<SubmitRunReviewDecisionInput, 'runId' | 'reviewId'>
type RetrySceneRunOptions = Omit<RetryRunInput, 'runId'>
type CancelSceneRunOptions = Omit<CancelRunInput, 'runId'>
type ResumeSceneRunOptions = Omit<ResumeRunInput, 'runId'>

interface SceneSessionStartedRun {
  sceneId: string
  run: RunRecord
}

function syncSceneRunViewCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  sceneId: string,
  run: RunRecord,
) {
  queryClient.setQueriesData<SceneWorkspaceViewModel | undefined>(
    { queryKey: sceneQueryKeys.workspace(sceneId) },
    (current) =>
      current
        ? {
            ...current,
            runStatus:
              run.status === 'completed'
                ? 'completed'
                : run.status === 'failed'
                  ? 'failed'
                  : run.status === 'cancelled'
                    ? 'idle'
                    : 'running',
            latestRunId: run.id,
          }
        : current,
  )

  queryClient.setQueriesData<SceneExecutionViewModel | undefined>(
    { queryKey: sceneQueryKeys.execution(sceneId) },
    (current) =>
      current
        ? {
            ...current,
            runId: run.id,
            canContinueRun: false,
          }
        : current,
  )
}

async function refreshSceneRunCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  projectId: string,
  run: RunRecord,
) {
  queryClient.setQueryData(runQueryKeys.detail(projectId, run.id), run)
  syncSceneRunViewCaches(queryClient, run.scopeId, run)
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: runQueryKeys.detail(projectId, run.id),
      refetchType: 'active',
    }),
    queryClient.invalidateQueries({
      queryKey: runQueryKeys.events(projectId, run.id),
      refetchType: 'active',
    }),
    queryClient.invalidateQueries({
      queryKey: sceneQueryKeys.workspace(run.scopeId),
      refetchType: 'active',
    }),
    queryClient.invalidateQueries({
      queryKey: sceneQueryKeys.execution(run.scopeId),
      refetchType: 'active',
    }),
  ])
}

async function refreshRunReadCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  projectId: string,
  client: Pick<RunClient, 'getRun' | 'getRunEvents'>,
  runId: string,
) {
  const run = await client.getRun({ runId })
  if (run) {
    queryClient.setQueryData(runQueryKeys.detail(projectId, runId), run)
  }

  const events = [] as Awaited<ReturnType<RunClient['getRunEvents']>>['events']
  const seenCursors = new Set<string | undefined>()
  let cursor: string | undefined

  while (!seenCursors.has(cursor)) {
    seenCursors.add(cursor)
    const page = await client.getRunEvents({ runId, cursor })
    events.push(...page.events)
    if (!page.nextCursor) {
      break
    }

    cursor = page.nextCursor
  }

  queryClient.setQueryData(runQueryKeys.events(projectId, runId), events)
}

export function useSceneRunSession({ sceneId, runId, latestRunId }: UseSceneRunSessionInput) {
  const runtime = useOptionalProjectRuntime()
  const queryClient = useQueryClient()
  const effectiveProjectId = resolveProjectRuntimeDependency(
    undefined,
    runtime?.projectId,
    'useSceneRunSession',
    'runtime.projectId',
  )
  const effectiveRunClient = resolveProjectRuntimeDependency<RunClient>(
    undefined,
    runtime?.runClient,
    'useSceneRunSession',
    'runtime.runClient',
  )
  const startSceneRun = useStartSceneRunMutation()
  const submitRunReviewDecision = useSubmitRunReviewDecisionMutation()
  const [sessionStartedRun, setSessionStartedRun] = useState<SceneSessionStartedRun | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isResuming, setIsResuming] = useState(false)
  const [actionError, setActionError] = useState<Error | null>(null)

  useEffect(() => {
    setSessionStartedRun((current) => (current?.sceneId === sceneId ? current : null))
  }, [sceneId])

  const sceneSessionStartedRun = sessionStartedRun?.sceneId === sceneId ? sessionStartedRun.run : null
  const activeRunId = sceneSessionStartedRun?.id ?? runId ?? latestRunId ?? null
  const runQuery = useRunQuery(activeRunId)
  const timelineQuery = useRunEventTimelineQuery(activeRunId)
  const refetchRunRef = useRef(runQuery.refetch)
  const refetchTimelineRef = useRef(timelineQuery.refetch)

  useEffect(() => {
    refetchRunRef.current = runQuery.refetch
    refetchTimelineRef.current = timelineQuery.refetch
  }, [runQuery.refetch, timelineQuery.refetch])

  const run =
    sceneSessionStartedRun?.id === activeRunId
      ? sceneSessionStartedRun
      : runQuery.run?.id === activeRunId
        ? runQuery.run
        : null
  const isPolling = Boolean(
    activeRunId && run && ACTIVE_RUN_STATUSES.includes(run.status) && timelineQuery.usesPagingFallback,
  )
  const pendingReviewId = run?.pendingReviewId ?? null
  const isReviewPending = run?.status === 'waiting_review' && Boolean(pendingReviewId)
  const canSubmitDecision = Boolean(activeRunId && isReviewPending) && !submitRunReviewDecision.isPending

  useEffect(() => {
    if (!isPolling) {
      return
    }

    const intervalId = globalThis.setInterval(() => {
      void Promise.all([refetchRunRef.current(), refetchTimelineRef.current()])
    }, SCENE_RUN_POLL_INTERVAL_MS)

    return () => {
      globalThis.clearInterval(intervalId)
    }
  }, [isPolling])

  return {
    activeRunId,
    run,
    events: timelineQuery.events,
    pendingReviewId,
    isReviewPending,
    canSubmitDecision,
    isPolling,
    isLoading:
      startSceneRun.isPending
      || submitRunReviewDecision.isPending
      || isRetrying
      || isCancelling
      || isResuming
      || (Boolean(activeRunId) && (runQuery.isLoading || timelineQuery.isLoading)),
    error: actionError ?? startSceneRun.error ?? submitRunReviewDecision.error ?? runQuery.error ?? timelineQuery.error,
    refetch: async () => {
      if (!activeRunId) {
        return
      }

      await Promise.all([runQuery.refetch(), timelineQuery.refetch()])
    },
    startRun: async (input: StartSceneRunOptions = {}) => {
      const startedRun = await startSceneRun.mutateAsync({
        sceneId,
        ...input,
      })
      setActionError(null)
      setSessionStartedRun({
        sceneId,
        run: startedRun,
      })
      syncSceneRunViewCaches(queryClient, sceneId, startedRun)
      return startedRun
    },
    isStartingRun: startSceneRun.isPending,
    submitDecision: async (input: SubmitSceneRunDecisionOptions) => {
      if (!activeRunId || !pendingReviewId) {
        throw new Error('No pending review is available for the active run.')
      }

      const updatedRun = await submitRunReviewDecision.mutateAsync({
        runId: activeRunId,
        reviewId: pendingReviewId,
        ...input,
      })
      setActionError(null)
      return updatedRun
    },
    isSubmittingDecision: submitRunReviewDecision.isPending,
    retry: async (input: RetrySceneRunOptions = {}) => {
      if (!activeRunId) {
        throw new Error('No active run is available to retry.')
      }

      const sourceRunId = activeRunId
      setIsRetrying(true)
      try {
        const nextRun = await effectiveRunClient.retryRun({
          runId: sourceRunId,
          ...input,
        })
        setActionError(null)
        setSessionStartedRun({
          sceneId,
          run: nextRun,
        })
        await Promise.all([
          refreshSceneRunCaches(queryClient, effectiveProjectId, nextRun),
          refreshRunReadCaches(queryClient, effectiveProjectId, effectiveRunClient, sourceRunId),
        ])
        return nextRun
      } catch (error) {
        setActionError(error instanceof Error ? error : new Error('Failed to retry run.'))
        throw error
      } finally {
        setIsRetrying(false)
      }
    },
    cancel: async (input: CancelSceneRunOptions = {}) => {
      if (!activeRunId) {
        throw new Error('No active run is available to cancel.')
      }

      setIsCancelling(true)
      try {
        const updatedRun = await effectiveRunClient.cancelRun({
          runId: activeRunId,
          ...input,
        })
        setActionError(null)
        setSessionStartedRun({
          sceneId,
          run: updatedRun,
        })
        await refreshSceneRunCaches(queryClient, effectiveProjectId, updatedRun)
        return updatedRun
      } catch (error) {
        setActionError(error instanceof Error ? error : new Error('Failed to cancel run.'))
        throw error
      } finally {
        setIsCancelling(false)
      }
    },
    resume: async (_input: ResumeSceneRunOptions = {}) => {
      if (!activeRunId) {
        throw new Error('No active run is available to resume.')
      }

      setIsResuming(true)
      try {
        const nextRun = await effectiveRunClient.resumeRun({
          runId: activeRunId,
        })
        setActionError(null)
        setSessionStartedRun({
          sceneId,
          run: nextRun,
        })
        await refreshSceneRunCaches(queryClient, effectiveProjectId, nextRun)
        return nextRun
      } catch (error) {
        setActionError(error instanceof Error ? error : new Error('Failed to resume run.'))
        throw error
      } finally {
        setIsResuming(false)
      }
    },
    isRetrying,
    isCancelling,
    isResuming,
  }
}
