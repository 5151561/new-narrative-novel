import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { ProjectRuntimeProvider, createMockProjectRuntime } from '@/app/project-runtime'
import { reviewQueryKeys } from './review-query-keys'
import { useClearReviewIssueFixActionMutation } from './useClearReviewIssueFixActionMutation'

function createWrapper(
  queryClient: QueryClient,
  runtime = createMockProjectRuntime({
    persistence: {
      async loadProjectSnapshot() {
        return null
      },
      async saveProjectSnapshot() {},
      async clearProjectSnapshot() {},
    },
  }),
) {
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        <ProjectRuntimeProvider runtime={runtime}>{children}</ProjectRuntimeProvider>
      </QueryClientProvider>
    )
  }
}

describe('useClearReviewIssueFixActionMutation', () => {
  function createDeferredPromise() {
    let resolve: (() => void) | undefined
    let reject: ((error: Error) => void) | undefined
    const promise = new Promise<void>((nextResolve, nextReject) => {
      resolve = nextResolve
      reject = nextReject
    })

    return {
      promise,
      resolve: () => resolve?.(),
      reject: (error: Error) => reject?.(error),
    }
  }

  it('optimistically removes the fix action cache entry and invalidates the review fix action query on settle', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    queryClient.setQueryData(reviewQueryKeys.fixActions('book-signal-arc'), [
      {
        id: 'fix-action-1',
        bookId: 'book-signal-arc',
        issueId: 'issue-1',
        issueSignature: 'signature-1',
        sourceHandoffId: 'handoff-1',
        sourceHandoffLabel: 'Open chapter draft',
        targetScope: 'chapter',
        status: 'started',
        startedAtLabel: '2026-04-19 17:00',
        updatedAtLabel: '2026-04-19 17:00',
        updatedByLabel: 'Editor',
      },
    ])

    const hook = renderHook(
      () =>
        useClearReviewIssueFixActionMutation({
          bookId: 'book-signal-arc',
          client: {
            clearReviewIssueFixAction: vi.fn().mockResolvedValue(undefined),
          } as any,
        }),
      { wrapper: createWrapper(queryClient) },
    )

    let mutationPromise: Promise<unknown> | undefined
    await act(async () => {
      mutationPromise = hook.result.current.mutateAsync({
        issueId: 'issue-1',
      })
    })

    expect(queryClient.getQueryData(reviewQueryKeys.fixActions('book-signal-arc'))).toEqual([])

    await act(async () => {
      await mutationPromise
    })

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: reviewQueryKeys.fixActions('book-signal-arc'),
        refetchType: 'active',
      })
    })
  })

  it('rolls back the optimistic removal when the clear mutation fails', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const existingRecord = {
      id: 'fix-action-1',
      bookId: 'book-signal-arc',
      issueId: 'issue-1',
      issueSignature: 'signature-1',
      sourceHandoffId: 'handoff-1',
      sourceHandoffLabel: 'Open chapter draft',
      targetScope: 'chapter',
      status: 'blocked',
      startedAtLabel: '2026-04-19 17:00',
      updatedAtLabel: '2026-04-19 17:10',
      updatedByLabel: 'Editor',
    }
    queryClient.setQueryData(reviewQueryKeys.fixActions('book-signal-arc'), [existingRecord])

    const hook = renderHook(
      () =>
        useClearReviewIssueFixActionMutation({
          bookId: 'book-signal-arc',
          client: {
            clearReviewIssueFixAction: vi.fn().mockRejectedValue(new Error('clear failed')),
          } as any,
        }),
      { wrapper: createWrapper(queryClient) },
    )

    await expect(
      act(async () =>
        hook.result.current.mutateAsync({
          issueId: 'issue-1',
        }),
      ),
    ).rejects.toThrow('clear failed')

    expect(queryClient.getQueryData(reviewQueryKeys.fixActions('book-signal-arc'))).toEqual([existingRecord])
  })

  it('does not restore a cleared issue or invalidate again when an earlier failed clear loses to a later clear on the same issue', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const deferredClear = createDeferredPromise()
    let firstCall = true
    queryClient.setQueryData(reviewQueryKeys.fixActions('book-signal-arc'), [
      {
        id: 'fix-action-1',
        bookId: 'book-signal-arc',
        issueId: 'issue-1',
        issueSignature: 'signature-1',
        sourceHandoffId: 'handoff-1',
        sourceHandoffLabel: 'Open chapter draft',
        targetScope: 'chapter',
        status: 'started',
        startedAtLabel: '2026-04-19 17:00',
        updatedAtLabel: '2026-04-19 17:00',
        updatedByLabel: 'Editor',
      },
    ])

    const hook = renderHook(
      () =>
        useClearReviewIssueFixActionMutation({
          bookId: 'book-signal-arc',
          client: {
            clearReviewIssueFixAction: vi.fn(async ({ issueId }: any) => {
              if (issueId === 'issue-1' && firstCall) {
                firstCall = false
                return deferredClear.promise
              }

              return undefined
            }),
          } as any,
        }),
      { wrapper: createWrapper(queryClient) },
    )

    let firstPromise: Promise<unknown> | undefined
    await act(async () => {
      firstPromise = hook.result.current.mutateAsync({
        issueId: 'issue-1',
      })
    })

    await act(async () => {
      await hook.result.current.mutateAsync({
        issueId: 'issue-1',
      })
    })

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledTimes(1)
    })

    deferredClear.reject(new Error('clear failed'))

    await expect(firstPromise).rejects.toThrow('clear failed')

    expect(queryClient.getQueryData(reviewQueryKeys.fixActions('book-signal-arc'))).toEqual([])
    expect(invalidateSpy).toHaveBeenCalledTimes(1)
  })
})
