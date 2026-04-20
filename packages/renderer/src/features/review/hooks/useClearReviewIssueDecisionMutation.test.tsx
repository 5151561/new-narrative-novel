import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { ProjectRuntimeProvider, createMockProjectRuntime } from '@/app/project-runtime'
import { useClearReviewIssueDecisionMutation } from './useClearReviewIssueDecisionMutation'
import { reviewQueryKeys } from './review-query-keys'

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

describe('useClearReviewIssueDecisionMutation', () => {
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

  it('optimistically removes the decision cache entry and invalidates the review decision query on settle', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    queryClient.setQueryData(reviewQueryKeys.decisions('book-signal-arc'), [
      {
        id: 'decision-1',
        bookId: 'book-signal-arc',
        issueId: 'issue-1',
        issueSignature: 'signature-1',
        status: 'reviewed',
        updatedAtLabel: '2026-04-19 17:00',
        updatedByLabel: 'Editor',
      },
    ])

    const hook = renderHook(
      () =>
        useClearReviewIssueDecisionMutation({
          bookId: 'book-signal-arc',
          client: {
            clearReviewIssueDecision: vi.fn().mockResolvedValue(undefined),
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

    expect(queryClient.getQueryData(reviewQueryKeys.decisions('book-signal-arc'))).toEqual([])

    await act(async () => {
      await mutationPromise
    })

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: reviewQueryKeys.decisions('book-signal-arc'),
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
      id: 'decision-1',
      bookId: 'book-signal-arc',
      issueId: 'issue-1',
      issueSignature: 'signature-1',
      status: 'dismissed',
      updatedAtLabel: '2026-04-19 17:00',
      updatedByLabel: 'Editor',
    }
    queryClient.setQueryData(reviewQueryKeys.decisions('book-signal-arc'), [existingRecord])

    const hook = renderHook(
      () =>
        useClearReviewIssueDecisionMutation({
          bookId: 'book-signal-arc',
          client: {
            clearReviewIssueDecision: vi.fn().mockRejectedValue(new Error('clear failed')),
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

    expect(queryClient.getQueryData(reviewQueryKeys.decisions('book-signal-arc'))).toEqual([existingRecord])
  })

  it('restores only the failed issue when overlapping clears affect different issues', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const deferredClear = createDeferredPromise()
    queryClient.setQueryData(reviewQueryKeys.decisions('book-signal-arc'), [
      {
        id: 'decision-1',
        bookId: 'book-signal-arc',
        issueId: 'issue-1',
        issueSignature: 'signature-1',
        status: 'reviewed',
        updatedAtLabel: '2026-04-19 17:00',
        updatedByLabel: 'Editor',
      },
      {
        id: 'decision-2',
        bookId: 'book-signal-arc',
        issueId: 'issue-2',
        issueSignature: 'signature-2',
        status: 'dismissed',
        updatedAtLabel: '2026-04-19 17:10',
        updatedByLabel: 'Editor',
      },
    ])

    const hook = renderHook(
      () =>
        useClearReviewIssueDecisionMutation({
          bookId: 'book-signal-arc',
          client: {
            clearReviewIssueDecision: vi.fn(async ({ issueId }: any) => {
              if (issueId === 'issue-1') {
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
        issueId: 'issue-2',
      })
    })

    deferredClear.reject(new Error('clear failed'))

    await expect(firstPromise).rejects.toThrow('clear failed')

    expect(queryClient.getQueryData(reviewQueryKeys.decisions('book-signal-arc'))).toEqual([
      expect.objectContaining({
        issueId: 'issue-1',
        issueSignature: 'signature-1',
        status: 'reviewed',
      }),
    ])
  })

  it('does not restore a cleared issue when an earlier failed clear loses the race to a later clear on the same issue', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const deferredClear = createDeferredPromise()
    let firstCall = true
    queryClient.setQueryData(reviewQueryKeys.decisions('book-signal-arc'), [
      {
        id: 'decision-1',
        bookId: 'book-signal-arc',
        issueId: 'issue-1',
        issueSignature: 'signature-1',
        status: 'reviewed',
        updatedAtLabel: '2026-04-19 17:00',
        updatedByLabel: 'Editor',
      },
    ])

    const hook = renderHook(
      () =>
        useClearReviewIssueDecisionMutation({
          bookId: 'book-signal-arc',
          client: {
            clearReviewIssueDecision: vi.fn(async ({ issueId }: any) => {
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

    deferredClear.reject(new Error('clear failed'))

    await expect(firstPromise).rejects.toThrow('clear failed')

    expect(queryClient.getQueryData(reviewQueryKeys.decisions('book-signal-arc'))).toEqual([])
  })
})
