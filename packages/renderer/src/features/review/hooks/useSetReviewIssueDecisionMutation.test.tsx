import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { useSetReviewIssueDecisionMutation } from './useSetReviewIssueDecisionMutation'
import { reviewQueryKeys } from './review-query-keys'

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useSetReviewIssueDecisionMutation', () => {
  function createDeferredPromise<T>() {
    let resolve: ((value: T) => void) | undefined
    let reject: ((error: Error) => void) | undefined
    const promise = new Promise<T>((nextResolve, nextReject) => {
      resolve = nextResolve
      reject = nextReject
    })

    return {
      promise,
      resolve: (value: T) => resolve?.(value),
      reject: (error: Error) => reject?.(error),
    }
  }

  it('optimistically updates the decision cache and invalidates the review decision query on settle', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    queryClient.setQueryData(reviewQueryKeys.decisions('book-signal-arc'), [])

    const client = {
      setReviewIssueDecision: vi.fn(async (input: any) => ({
        id: 'decision-1',
        updatedAtLabel: '2026-04-19 17:00',
        updatedByLabel: 'Editor',
        ...input,
      })),
    }

    const hook = renderHook(
      () =>
        useSetReviewIssueDecisionMutation({
          bookId: 'book-signal-arc',
          client: client as any,
        }),
      { wrapper: createWrapper(queryClient) },
    )

    let mutationPromise: Promise<unknown> | undefined
    await act(async () => {
      mutationPromise = hook.result.current.mutateAsync({
        issueId: 'issue-1',
        issueSignature: 'signature-1',
        status: 'reviewed',
        note: 'Reviewed now',
      })
    })

    expect(queryClient.getQueryData(reviewQueryKeys.decisions('book-signal-arc'))).toEqual([
      expect.objectContaining({
        issueId: 'issue-1',
        issueSignature: 'signature-1',
        status: 'reviewed',
        note: 'Reviewed now',
      }),
    ])

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

  it('rolls back the optimistic decision cache when the mutation fails', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const existingRecord = {
      id: 'decision-existing',
      bookId: 'book-signal-arc',
      issueId: 'issue-1',
      issueSignature: 'signature-old',
      status: 'deferred',
      updatedAtLabel: '2026-04-19 16:00',
      updatedByLabel: 'Editor',
    }
    queryClient.setQueryData(reviewQueryKeys.decisions('book-signal-arc'), [existingRecord])

    const hook = renderHook(
      () =>
        useSetReviewIssueDecisionMutation({
          bookId: 'book-signal-arc',
          client: {
            setReviewIssueDecision: vi.fn().mockRejectedValue(new Error('set failed')),
          } as any,
        }),
      { wrapper: createWrapper(queryClient) },
    )

    await expect(
      act(async () =>
        hook.result.current.mutateAsync({
          issueId: 'issue-1',
          issueSignature: 'signature-new',
          status: 'reviewed',
          note: 'Should rollback',
        }),
      ),
    ).rejects.toThrow('set failed')

    expect(queryClient.getQueryData(reviewQueryKeys.decisions('book-signal-arc'))).toEqual([existingRecord])
  })

  it('rolls back only the failed issue when overlapping optimistic updates touch different issues', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    queryClient.setQueryData(reviewQueryKeys.decisions('book-signal-arc'), [])

    const deferredSet = createDeferredPromise<any>()
    const hook = renderHook(
      () =>
        useSetReviewIssueDecisionMutation({
          bookId: 'book-signal-arc',
          client: {
            setReviewIssueDecision: vi.fn(async (input: any) => {
              if (input.issueId === 'issue-1') {
                return deferredSet.promise
              }

              return {
                id: 'decision-2',
                updatedAtLabel: '2026-04-19 17:30',
                updatedByLabel: 'Editor',
                ...input,
              }
            }),
          } as any,
        }),
      { wrapper: createWrapper(queryClient) },
    )

    let firstPromise: Promise<unknown> | undefined
    await act(async () => {
      firstPromise = hook.result.current.mutateAsync({
        issueId: 'issue-1',
        issueSignature: 'signature-1',
        status: 'reviewed',
      })
    })

    await act(async () => {
      await hook.result.current.mutateAsync({
        issueId: 'issue-2',
        issueSignature: 'signature-2',
        status: 'deferred',
      })
    })

    deferredSet.reject(new Error('set failed'))

    await expect(firstPromise).rejects.toThrow('set failed')

    expect(queryClient.getQueryData(reviewQueryKeys.decisions('book-signal-arc'))).toEqual([
      expect.objectContaining({
        issueId: 'issue-2',
        issueSignature: 'signature-2',
        status: 'deferred',
      }),
    ])
  })

  it('does not let an earlier failed mutation overwrite a later update for the same issue', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    queryClient.setQueryData(reviewQueryKeys.decisions('book-signal-arc'), [])

    const deferredSet = createDeferredPromise<any>()
    const hook = renderHook(
      () =>
        useSetReviewIssueDecisionMutation({
          bookId: 'book-signal-arc',
          client: {
            setReviewIssueDecision: vi.fn(async (input: any) => {
              if (input.status === 'reviewed') {
                return deferredSet.promise
              }

              return {
                id: 'decision-later',
                updatedAtLabel: '2026-04-19 17:40',
                updatedByLabel: 'Editor',
                ...input,
              }
            }),
          } as any,
        }),
      { wrapper: createWrapper(queryClient) },
    )

    let firstPromise: Promise<unknown> | undefined
    await act(async () => {
      firstPromise = hook.result.current.mutateAsync({
        issueId: 'issue-1',
        issueSignature: 'signature-reviewed',
        status: 'reviewed',
      })
    })

    await act(async () => {
      await hook.result.current.mutateAsync({
        issueId: 'issue-1',
        issueSignature: 'signature-deferred',
        status: 'deferred',
      })
    })

    deferredSet.reject(new Error('set failed'))

    await expect(firstPromise).rejects.toThrow('set failed')

    expect(queryClient.getQueryData(reviewQueryKeys.decisions('book-signal-arc'))).toEqual([
      expect.objectContaining({
        issueId: 'issue-1',
        issueSignature: 'signature-deferred',
        status: 'deferred',
      }),
    ])
  })

  it('does not let an earlier success overwrite a later update for the same issue', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    queryClient.setQueryData(reviewQueryKeys.decisions('book-signal-arc'), [])

    const deferredSet = createDeferredPromise<any>()
    const hook = renderHook(
      () =>
        useSetReviewIssueDecisionMutation({
          bookId: 'book-signal-arc',
          client: {
            setReviewIssueDecision: vi.fn(async (input: any) => {
              if (input.status === 'reviewed') {
                return deferredSet.promise
              }

              return {
                id: 'decision-later',
                updatedAtLabel: '2026-04-19 17:40',
                updatedByLabel: 'Editor',
                ...input,
              }
            }),
          } as any,
        }),
      { wrapper: createWrapper(queryClient) },
    )

    let firstPromise: Promise<unknown> | undefined
    await act(async () => {
      firstPromise = hook.result.current.mutateAsync({
        issueId: 'issue-1',
        issueSignature: 'signature-reviewed',
        status: 'reviewed',
      })
    })

    await act(async () => {
      await hook.result.current.mutateAsync({
        issueId: 'issue-1',
        issueSignature: 'signature-deferred',
        status: 'deferred',
      })
    })

    deferredSet.resolve({
      id: 'decision-earlier',
      bookId: 'book-signal-arc',
      issueId: 'issue-1',
      issueSignature: 'signature-reviewed',
      status: 'reviewed',
      updatedAtLabel: '2026-04-19 17:50',
      updatedByLabel: 'Editor',
    })

    await firstPromise

    expect(queryClient.getQueryData(reviewQueryKeys.decisions('book-signal-arc'))).toEqual([
      expect.objectContaining({
        issueId: 'issue-1',
        issueSignature: 'signature-deferred',
        status: 'deferred',
      }),
    ])
  })
})
