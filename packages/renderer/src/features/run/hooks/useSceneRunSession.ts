import { useEffect, useRef, useState } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import { sceneQueryKeys } from '@/features/scene/hooks/scene-query-keys'

import type { RunRecord, RunStatus, StartSceneRunInput, SubmitRunReviewDecisionInput } from '../api/run-records'

import { useRunQuery } from './useRunQuery'
import { useRunEventTimelineQuery } from './useRunEventTimelineQuery'
import { useStartSceneRunMutation } from './useStartSceneRunMutation'
import { useSubmitRunReviewDecisionMutation } from './useSubmitRunReviewDecisionMutation'

const ACTIVE_RUN_STATUSES: RunStatus[] = ['queued', 'running', 'waiting_review']
const SCENE_RUN_POLL_INTERVAL_MS = 5000

interface UseSceneRunSessionInput {
  sceneId: string
  runId?: string | null
  latestRunId?: string | null
}

type StartSceneRunOptions = Omit<StartSceneRunInput, 'sceneId'>
type SubmitSceneRunDecisionOptions = Omit<SubmitRunReviewDecisionInput, 'runId' | 'reviewId'>

interface SceneSessionStartedRun {
  sceneId: string
  run: RunRecord
}

async function invalidateSceneRunQueryFamilies(queryClient: ReturnType<typeof useQueryClient>, sceneId: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: sceneQueryKeys.workspace(sceneId) }),
    queryClient.invalidateQueries({ queryKey: sceneQueryKeys.execution(sceneId) }),
    queryClient.invalidateQueries({ queryKey: sceneQueryKeys.prose(sceneId) }),
    queryClient.invalidateQueries({ queryKey: sceneQueryKeys.inspector(sceneId) }),
    queryClient.invalidateQueries({ queryKey: sceneQueryKeys.dock(sceneId) }),
    queryClient.invalidateQueries({ queryKey: sceneQueryKeys.patchPreview(sceneId) }),
  ])
}

export function useSceneRunSession({ sceneId, runId, latestRunId }: UseSceneRunSessionInput) {
  const queryClient = useQueryClient()
  const startSceneRun = useStartSceneRunMutation()
  const submitRunReviewDecision = useSubmitRunReviewDecisionMutation()
  const [sessionStartedRun, setSessionStartedRun] = useState<SceneSessionStartedRun | null>(null)

  useEffect(() => {
    setSessionStartedRun((current) => (current?.sceneId === sceneId ? current : null))
  }, [sceneId])

  const sceneSessionStartedRun = sessionStartedRun?.sceneId === sceneId ? sessionStartedRun.run : null
  const activeRunId = runId ?? latestRunId ?? sceneSessionStartedRun?.id ?? null
  const runQuery = useRunQuery(activeRunId)
  const timelineQuery = useRunEventTimelineQuery(activeRunId)
  const refetchRunRef = useRef(runQuery.refetch)
  const refetchTimelineRef = useRef(timelineQuery.refetch)

  useEffect(() => {
    refetchRunRef.current = runQuery.refetch
    refetchTimelineRef.current = timelineQuery.refetch
  }, [runQuery.refetch, timelineQuery.refetch])

  const run =
    runQuery.run?.id === activeRunId
      ? runQuery.run
      : sceneSessionStartedRun?.id === activeRunId
        ? sceneSessionStartedRun
        : null
  const isPolling = Boolean(activeRunId && run && ACTIVE_RUN_STATUSES.includes(run.status))
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
      startSceneRun.isPending || submitRunReviewDecision.isPending || (Boolean(activeRunId) && (runQuery.isLoading || timelineQuery.isLoading)),
    error: startSceneRun.error ?? submitRunReviewDecision.error ?? runQuery.error ?? timelineQuery.error,
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
      setSessionStartedRun({
        sceneId,
        run: startedRun,
      })
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
      await invalidateSceneRunQueryFamilies(queryClient, sceneId)
      return updatedRun
    },
    isSubmittingDecision: submitRunReviewDecision.isPending,
  }
}
