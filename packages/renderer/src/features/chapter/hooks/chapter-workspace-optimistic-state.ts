import type { QueryClient } from '@tanstack/react-query'

import type { ChapterStructureWorkspaceRecord } from '../api/chapter-records'

type ChapterWorkspaceRecordValue = ChapterStructureWorkspaceRecord | null | undefined
type ChapterWorkspaceOptimisticApplier = (record: ChapterWorkspaceRecordValue) => ChapterWorkspaceRecordValue

interface ChapterWorkspaceOptimisticLayer {
  mutationId: number
  apply: ChapterWorkspaceOptimisticApplier
}

interface ChapterWorkspaceOptimisticState {
  baseRecord: ChapterWorkspaceRecordValue
  layers: ChapterWorkspaceOptimisticLayer[]
  pendingInvalidation: boolean
}

const chapterWorkspaceOptimisticStates = new WeakMap<QueryClient, Map<string, ChapterWorkspaceOptimisticState>>()
let nextMutationId = 1

function getStateMap(queryClient: QueryClient) {
  const existingStateMap = chapterWorkspaceOptimisticStates.get(queryClient)
  if (existingStateMap) {
    return existingStateMap
  }

  const nextStateMap = new Map<string, ChapterWorkspaceOptimisticState>()
  chapterWorkspaceOptimisticStates.set(queryClient, nextStateMap)
  return nextStateMap
}

function getQueryKeyId(queryKey: readonly unknown[]) {
  return JSON.stringify(queryKey)
}

function recomputeRecord(state: ChapterWorkspaceOptimisticState) {
  return state.layers.reduce<ChapterWorkspaceRecordValue>((record, layer) => layer.apply(record), state.baseRecord)
}

function cleanupState(queryClient: QueryClient, queryKeyId: string, state: ChapterWorkspaceOptimisticState) {
  if (state.layers.length > 0 || state.pendingInvalidation) {
    return
  }

  const stateMap = getStateMap(queryClient)
  stateMap.delete(queryKeyId)
  if (stateMap.size === 0) {
    chapterWorkspaceOptimisticStates.delete(queryClient)
  }
}

export interface ChapterWorkspaceOptimisticMutationContext {
  mutationId: number
}

export function hasPendingChapterWorkspaceOptimisticUpdates(queryClient: QueryClient, queryKey: readonly unknown[]) {
  const state = getStateMap(queryClient).get(getQueryKeyId(queryKey))
  return Boolean(state && state.layers.length > 0)
}

export async function invalidateChapterWorkspaceQueryOnSettled(queryClient: QueryClient, queryKey: readonly unknown[]) {
  const queryKeyId = getQueryKeyId(queryKey)
  const state = getStateMap(queryClient).get(queryKeyId)

  if (state && state.layers.length > 0) {
    state.pendingInvalidation = true
    return
  }

  if (state) {
    state.pendingInvalidation = false
  }

  await queryClient.invalidateQueries({
    queryKey,
    refetchType: 'active',
  })

  if (state) {
    cleanupState(queryClient, queryKeyId, state)
  }
}

export function applyChapterWorkspaceOptimisticUpdate(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  apply: ChapterWorkspaceOptimisticApplier,
): ChapterWorkspaceOptimisticMutationContext {
  const queryKeyId = getQueryKeyId(queryKey)
  const stateMap = getStateMap(queryClient)
  const state = stateMap.get(queryKeyId) ?? {
    baseRecord: queryClient.getQueryData<ChapterWorkspaceRecordValue>(queryKey),
    layers: [],
    pendingInvalidation: false,
  }

  stateMap.set(queryKeyId, state)

  const mutationId = nextMutationId++
  state.layers.push({
    mutationId,
    apply,
  })

  queryClient.setQueryData(queryKey, recomputeRecord(state))

  return { mutationId }
}

export function rollbackChapterWorkspaceOptimisticUpdate(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  context: ChapterWorkspaceOptimisticMutationContext | undefined,
) {
  if (!context) {
    return
  }

  const queryKeyId = getQueryKeyId(queryKey)
  const state = getStateMap(queryClient).get(queryKeyId)
  if (!state) {
    return
  }

  state.layers = state.layers.filter((layer) => layer.mutationId !== context.mutationId)
  queryClient.setQueryData(queryKey, recomputeRecord(state))
  cleanupState(queryClient, queryKeyId, state)
}

export function commitChapterWorkspaceOptimisticUpdate(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  context: ChapterWorkspaceOptimisticMutationContext | undefined,
  committedRecord: ChapterWorkspaceRecordValue,
) {
  if (!context) {
    if (committedRecord !== undefined) {
      queryClient.setQueryData(queryKey, committedRecord)
    }
    return
  }

  const queryKeyId = getQueryKeyId(queryKey)
  const state = getStateMap(queryClient).get(queryKeyId)
  if (!state) {
    if (committedRecord !== undefined) {
      queryClient.setQueryData(queryKey, committedRecord)
    }
    return
  }

  const layer = state.layers.find((candidate) => candidate.mutationId === context.mutationId)
  if (committedRecord !== undefined) {
    state.baseRecord = committedRecord
  } else if (layer) {
    state.baseRecord = layer.apply(state.baseRecord)
  }

  state.layers = state.layers.filter((candidate) => candidate.mutationId !== context.mutationId)
  queryClient.setQueryData(queryKey, recomputeRecord(state))
  cleanupState(queryClient, queryKeyId, state)
}
