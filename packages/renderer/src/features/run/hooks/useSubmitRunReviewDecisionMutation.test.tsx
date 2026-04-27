import { QueryClient } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { createProjectRuntimeTestWrapper, createTestProjectRuntime } from '@/app/project-runtime'
import { bookQueryKeys } from '@/features/book/hooks/book-query-keys'
import { chapterQueryKeys } from '@/features/chapter/hooks/chapter-query-keys'
import type { RunClient } from '@/features/run/api/run-client'
import type { RunRecord, SubmitRunReviewDecisionInput } from '@/features/run/api/run-records'
import { sceneQueryKeys } from '@/features/scene/hooks/scene-query-keys'

import { runQueryKeys } from './run-query-keys'
import { useSubmitRunReviewDecisionMutation } from './useSubmitRunReviewDecisionMutation'

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function createRun(overrides: Partial<RunRecord> = {}): RunRecord {
  return {
    id: 'run-scene-midnight-platform-001',
    scope: 'scene',
    scopeId: 'scene-midnight-platform',
    status: 'waiting_review',
    title: 'Scene run',
    summary: 'Waiting for review.',
    startedAtLabel: '2026-04-21 10:00',
    completedAtLabel: undefined,
    pendingReviewId: 'review-scene-midnight-platform-001',
    latestEventId: 'run-event-001',
    eventCount: 1,
    ...overrides,
  }
}

function createRunClient(overrides: Partial<Pick<RunClient, 'submitRunReviewDecision'>> = {}) {
  return {
    submitRunReviewDecision: vi.fn(async (_input: SubmitRunReviewDecisionInput) =>
      createRun({
        status: 'completed',
        summary: 'Accepted and applied.',
        pendingReviewId: undefined,
        completedAtLabel: '2026-04-21 10:20',
        latestEventId: 'run-event-004',
        eventCount: 4,
      }),
    ),
    ...overrides,
  }
}

describe('useSubmitRunReviewDecisionMutation', () => {
  it('posts selected variants to the active run review decision endpoint and refreshes downstream reads', async () => {
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const previousRun = createRun()
    const selectedVariants = [
      {
        proposalId: 'proposal-set-scene-midnight-platform-run-001-proposal-001',
        variantId: 'variant-midnight-platform-raise-conflict',
      },
    ]
    const runClient = createRunClient()
    const wrapper = createProjectRuntimeTestWrapper({
      runtime: {
        ...createTestProjectRuntime(),
        projectId: 'book-signal-arc',
        runClient: runClient as RunClient,
      },
      queryClient,
    })

    queryClient.setQueryData(runQueryKeys.detail('book-signal-arc', previousRun.id), previousRun)

    const hook = renderHook(() => useSubmitRunReviewDecisionMutation(), { wrapper })

    await act(async () => {
      await hook.result.current.mutateAsync({
        runId: previousRun.id,
        reviewId: 'review-scene-midnight-platform-001',
        decision: 'accept-with-edit',
        note: 'Keep the pressure but smooth the transition.',
        patchId: 'patch-scene-midnight-platform-001',
        selectedVariants,
      })
    })

    expect(runClient.submitRunReviewDecision).toHaveBeenCalledWith({
      runId: previousRun.id,
      reviewId: 'review-scene-midnight-platform-001',
      decision: 'accept-with-edit',
      note: 'Keep the pressure but smooth the transition.',
      patchId: 'patch-scene-midnight-platform-001',
      selectedVariants,
    })
    expect(queryClient.getQueryData(runQueryKeys.detail('book-signal-arc', previousRun.id))).toMatchObject({
      id: previousRun.id,
      status: 'completed',
      pendingReviewId: undefined,
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: runQueryKeys.detail('book-signal-arc', previousRun.id),
      refetchType: 'active',
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: runQueryKeys.events('book-signal-arc', previousRun.id),
      refetchType: 'active',
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: runQueryKeys.artifacts('book-signal-arc', previousRun.id),
      refetchType: 'active',
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: runQueryKeys.trace('book-signal-arc', previousRun.id),
      refetchType: 'active',
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: sceneQueryKeys.workspace(previousRun.scopeId),
      refetchType: 'active',
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: sceneQueryKeys.execution(previousRun.scopeId),
      refetchType: 'active',
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: sceneQueryKeys.prose(previousRun.scopeId),
      refetchType: 'active',
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: sceneQueryKeys.inspector(previousRun.scopeId),
      refetchType: 'active',
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: sceneQueryKeys.dock(previousRun.scopeId),
      refetchType: 'active',
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: sceneQueryKeys.patchPreview(previousRun.scopeId),
      refetchType: 'active',
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: chapterQueryKeys.all,
      refetchType: 'active',
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: bookQueryKeys.all,
      refetchType: 'active',
    })
  })
})
