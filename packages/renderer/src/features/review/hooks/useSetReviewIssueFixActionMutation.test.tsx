import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { ProjectRuntimeProvider, createMockProjectRuntime } from '@/app/project-runtime'
import { reviewQueryKeys } from './review-query-keys'
import { useSetReviewIssueFixActionMutation } from './useSetReviewIssueFixActionMutation'

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

describe('useSetReviewIssueFixActionMutation', () => {
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

  it('optimistically updates the fix action cache and invalidates the review fix action query on settle', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    queryClient.setQueryData(reviewQueryKeys.fixActions('book-signal-arc'), [])

    const hook = renderHook(
      () =>
        useSetReviewIssueFixActionMutation({
          bookId: 'book-signal-arc',
          client: {
            setReviewIssueFixAction: vi.fn(async (input: any) => ({
              id: 'fix-action-1',
              startedAtLabel: '2026-04-19 17:00',
              updatedAtLabel: '2026-04-19 17:00',
              updatedByLabel: 'Editor',
              ...input,
              note: input.note?.trim() ? input.note.trim() : undefined,
            })),
          } as any,
        }),
      { wrapper: createWrapper(queryClient) },
    )

    let mutationPromise: Promise<unknown> | undefined
    await act(async () => {
      mutationPromise = hook.result.current.mutateAsync({
        issueId: 'issue-1',
        issueSignature: 'signature-1',
        sourceHandoffId: 'handoff-1',
        sourceHandoffLabel: 'Open chapter draft',
        targetScope: 'chapter',
        status: 'started',
        note: '  Started now  ',
      })
    })

    expect(queryClient.getQueryData(reviewQueryKeys.fixActions('book-signal-arc'))).toEqual([
      expect.objectContaining({
        issueId: 'issue-1',
        issueSignature: 'signature-1',
        sourceHandoffId: 'handoff-1',
        sourceHandoffLabel: 'Open chapter draft',
        targetScope: 'chapter',
        status: 'started',
        note: 'Started now',
      }),
    ])

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

  it('rolls back the optimistic fix action cache when the mutation fails', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const existingRecord = {
      id: 'fix-existing',
      bookId: 'book-signal-arc',
      issueId: 'issue-1',
      issueSignature: 'signature-old',
      sourceHandoffId: 'handoff-old',
      sourceHandoffLabel: 'Open compare review',
      targetScope: 'book',
      status: 'checked',
      startedAtLabel: '2026-04-19 16:00',
      updatedAtLabel: '2026-04-19 16:00',
      updatedByLabel: 'Editor',
    }
    queryClient.setQueryData(reviewQueryKeys.fixActions('book-signal-arc'), [existingRecord])

    const hook = renderHook(
      () =>
        useSetReviewIssueFixActionMutation({
          bookId: 'book-signal-arc',
          client: {
            setReviewIssueFixAction: vi.fn().mockRejectedValue(new Error('set failed')),
          } as any,
        }),
      { wrapper: createWrapper(queryClient) },
    )

    await expect(
      act(async () =>
        hook.result.current.mutateAsync({
          issueId: 'issue-1',
          issueSignature: 'signature-new',
          sourceHandoffId: 'handoff-new',
          sourceHandoffLabel: 'Open chapter draft',
          targetScope: 'chapter',
          status: 'started',
        }),
      ),
    ).rejects.toThrow('set failed')

    expect(queryClient.getQueryData(reviewQueryKeys.fixActions('book-signal-arc'))).toEqual([existingRecord])
  })

  it('does not let an earlier failed set rollback a later update for the same issue', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    queryClient.setQueryData(reviewQueryKeys.fixActions('book-signal-arc'), [])

    const deferredSet = createDeferredPromise<any>()
    const hook = renderHook(
      () =>
        useSetReviewIssueFixActionMutation({
          bookId: 'book-signal-arc',
          client: {
            setReviewIssueFixAction: vi.fn(async (input: any) => {
              if (input.status === 'started') {
                return deferredSet.promise
              }

              return {
                id: 'fix-action-later',
                startedAtLabel: '2026-04-19 17:40',
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
        issueSignature: 'signature-started',
        sourceHandoffId: 'handoff-started',
        sourceHandoffLabel: 'Open chapter draft',
        targetScope: 'chapter',
        status: 'started',
      })
    })

    await act(async () => {
      await hook.result.current.mutateAsync({
        issueId: 'issue-1',
        issueSignature: 'signature-checked',
        sourceHandoffId: 'handoff-checked',
        sourceHandoffLabel: 'Open compare review',
        targetScope: 'book',
        status: 'checked',
      })
    })

    deferredSet.reject(new Error('set failed'))

    await expect(firstPromise).rejects.toThrow('set failed')

    expect(queryClient.getQueryData(reviewQueryKeys.fixActions('book-signal-arc'))).toEqual([
      expect.objectContaining({
        issueId: 'issue-1',
        issueSignature: 'signature-checked',
        sourceHandoffId: 'handoff-checked',
        status: 'checked',
      }),
    ])
  })

  it('does not let an earlier successful set overwrite a later update for the same issue', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    queryClient.setQueryData(reviewQueryKeys.fixActions('book-signal-arc'), [])

    const deferredSet = createDeferredPromise<any>()
    const hook = renderHook(
      () =>
        useSetReviewIssueFixActionMutation({
          bookId: 'book-signal-arc',
          client: {
            setReviewIssueFixAction: vi.fn(async (input: any) => {
              if (input.status === 'started') {
                return deferredSet.promise
              }

              return {
                id: 'fix-action-later',
                startedAtLabel: '2026-04-19 17:40',
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
        issueSignature: 'signature-started',
        sourceHandoffId: 'handoff-started',
        sourceHandoffLabel: 'Open chapter draft',
        targetScope: 'chapter',
        status: 'started',
      })
    })

    await act(async () => {
      await hook.result.current.mutateAsync({
        issueId: 'issue-1',
        issueSignature: 'signature-checked',
        sourceHandoffId: 'handoff-checked',
        sourceHandoffLabel: 'Open compare review',
        targetScope: 'book',
        status: 'checked',
      })
    })

    deferredSet.resolve({
      id: 'fix-action-earlier',
      bookId: 'book-signal-arc',
      issueId: 'issue-1',
      issueSignature: 'signature-started',
      sourceHandoffId: 'handoff-started',
      sourceHandoffLabel: 'Open chapter draft',
      targetScope: 'chapter',
      status: 'started',
      startedAtLabel: '2026-04-19 17:50',
      updatedAtLabel: '2026-04-19 17:50',
      updatedByLabel: 'Editor',
    })

    await firstPromise

    expect(queryClient.getQueryData(reviewQueryKeys.fixActions('book-signal-arc'))).toEqual([
      expect.objectContaining({
        issueId: 'issue-1',
        issueSignature: 'signature-checked',
        sourceHandoffId: 'handoff-checked',
        status: 'checked',
      }),
    ])
  })

  it('replaces a stale fix action with a fresh active record when the user starts again on the current signature', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    queryClient.setQueryData(reviewQueryKeys.fixActions('book-signal-arc'), [
      {
        id: 'fix-stale',
        bookId: 'book-signal-arc',
        issueId: 'issue-1',
        issueSignature: 'stale-signature',
        sourceHandoffId: 'handoff-stale',
        sourceHandoffLabel: 'Open chapter draft',
        targetScope: 'chapter',
        status: 'started',
        note: 'Old stale fix.',
        startedAtLabel: '2026-04-19 17:00',
        updatedAtLabel: '2026-04-19 17:00',
        updatedByLabel: 'Editor',
      },
    ])

    const hook = renderHook(
      () =>
        useSetReviewIssueFixActionMutation({
          bookId: 'book-signal-arc',
          client: {
            setReviewIssueFixAction: vi.fn(async (input: any) => ({
              id: 'fix-fresh',
              startedAtLabel: '2026-04-19 18:00',
              updatedAtLabel: '2026-04-19 18:00',
              updatedByLabel: 'Editor',
              ...input,
            })),
          } as any,
        }),
      { wrapper: createWrapper(queryClient) },
    )

    await act(async () => {
      await hook.result.current.mutateAsync({
        issueId: 'issue-1',
        issueSignature: 'current-signature',
        sourceHandoffId: 'handoff-fresh',
        sourceHandoffLabel: 'Open scene draft',
        targetScope: 'scene',
        status: 'started',
        note: 'Fresh fix.',
      })
    })

    expect(queryClient.getQueryData(reviewQueryKeys.fixActions('book-signal-arc'))).toEqual([
      expect.objectContaining({
        issueId: 'issue-1',
        issueSignature: 'current-signature',
        sourceHandoffId: 'handoff-fresh',
        targetScope: 'scene',
        status: 'started',
        note: 'Fresh fix.',
      }),
    ])
  })
})
