import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { createProjectRuntimeTestWrapper, createTestProjectRuntime } from '@/app/project-runtime'

import { createReviewClient } from '../api/review-client'
import { useBookReviewDecisionsQuery } from './useBookReviewDecisionsQuery'

function createWrapper(runtime = createTestProjectRuntime()) {
  return createProjectRuntimeTestWrapper({ runtime })
}

describe('useBookReviewDecisionsQuery', () => {
  it('uses the project runtime review client when no override is provided', async () => {
    const baseReviewClient = createReviewClient()
    const reviewClient = {
      ...baseReviewClient,
      getBookReviewDecisions: vi.fn(baseReviewClient.getBookReviewDecisions),
    }
    const runtime = createTestProjectRuntime({
      reviewClient,
    })
    const hook = renderHook(() => useBookReviewDecisionsQuery({ bookId: 'book-signal-arc' }), {
      wrapper: createWrapper(runtime),
    })

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(reviewClient.getBookReviewDecisions).toHaveBeenCalledWith({ bookId: 'book-signal-arc' })
  })

  it('prefers the explicit review client over the project runtime client when both are provided', async () => {
    const runtimeClient = {
      getBookReviewDecisions: vi.fn(createReviewClient().getBookReviewDecisions),
    }
    const customClient = {
      getBookReviewDecisions: vi.fn(async () => [
        {
          id: 'decision-custom',
          bookId: 'book-signal-arc',
          issueId: 'issue-custom',
          issueSignature: 'signature-custom',
          status: 'reviewed' as const,
          updatedAtLabel: '2026-04-20 15:30',
          updatedByLabel: 'Custom client',
        },
      ]),
    }
    const runtime = createTestProjectRuntime({
      reviewClient: {
        ...createReviewClient(),
        getBookReviewDecisions: runtimeClient.getBookReviewDecisions,
      },
    })
    const hook = renderHook(
      () =>
        useBookReviewDecisionsQuery(
          { bookId: 'book-signal-arc' },
          {
            reviewClient: customClient,
          },
        ),
      {
        wrapper: createWrapper(runtime),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.data).toEqual([
        expect.objectContaining({
          id: 'decision-custom',
          issueId: 'issue-custom',
        }),
      ])
    })

    expect(customClient.getBookReviewDecisions).toHaveBeenCalledWith({ bookId: 'book-signal-arc' })
    expect(runtimeClient.getBookReviewDecisions).not.toHaveBeenCalled()
  })
})
