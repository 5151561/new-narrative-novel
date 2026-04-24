import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { ApiRequestError } from '@/app/project-runtime'
import type { RunTraceResponse } from '@/features/run/api/run-trace-records'

import { runQueryKeys } from './run-query-keys'
import { useRunTraceQuery } from './useRunTraceQuery'

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

function createTraceResponse(): RunTraceResponse {
  return {
    runId: 'run-scene-midnight-platform-001',
    nodes: [
      {
        id: 'ctx-scene-midnight-platform-run-001',
        kind: 'context-packet',
        label: { en: 'Scene context packet', 'zh-CN': 'Scene context packet' },
      },
    ],
    links: [],
    summary: {
      proposalSetCount: 0,
      canonPatchCount: 0,
      proseDraftCount: 0,
      missingTraceCount: 0,
    },
  }
}

describe('useRunTraceQuery', () => {
  it('does not request when runId is empty', () => {
    const queryClient = createQueryClient()
    const client = {
      getRunTrace: vi.fn(async () => createTraceResponse()),
    }

    const hook = renderHook(
      () =>
        useRunTraceQuery('', {
          client,
          projectId: 'project-1',
        }),
      {
        wrapper: createWrapper(queryClient),
      },
    )

    expect(hook.result.current.trace).toBeNull()
    expect(client.getRunTrace).not.toHaveBeenCalled()
    expect(queryClient.getQueryData(runQueryKeys.trace('project-1', '__missing__'))).toBeUndefined()
  })

  it('reads trace and stores it under projectId and runId', async () => {
    const queryClient = createQueryClient()
    const response = createTraceResponse()
    const client = {
      getRunTrace: vi.fn(async () => response),
    }

    const hook = renderHook(
      () =>
        useRunTraceQuery('run-scene-midnight-platform-001', {
          client,
          projectId: 'project-1',
        }),
      {
        wrapper: createWrapper(queryClient),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(client.getRunTrace).toHaveBeenCalledWith({ runId: 'run-scene-midnight-platform-001' })
    expect(hook.result.current.trace).toEqual(response)
    expect(queryClient.getQueryData(runQueryKeys.trace('project-1', 'run-scene-midnight-platform-001'))).toEqual(response)
  })

  it('surfaces 404 and 500 trace read failures as query errors', async () => {
    const queryClient = createQueryClient()
    const notFound = new ApiRequestError({
      status: 404,
      message: 'Run not found',
      code: 'run-not-found',
    })
    const serverError = new ApiRequestError({
      status: 500,
      message: 'Trace unavailable',
      code: 'run-trace-unavailable',
    })
    const client = {
      getRunTrace: vi.fn()
        .mockRejectedValueOnce(notFound)
        .mockRejectedValueOnce(serverError),
    }

    const notFoundHook = renderHook(
      () =>
        useRunTraceQuery('run-missing', {
          client,
          projectId: 'project-1',
        }),
      {
        wrapper: createWrapper(queryClient),
      },
    )

    await waitFor(() => {
      expect(notFoundHook.result.current.error).toBe(notFound)
    })
    expect(notFoundHook.result.current.trace).toBeNull()

    const serverErrorHook = renderHook(
      () =>
        useRunTraceQuery('run-broken', {
          client,
          projectId: 'project-1',
        }),
      {
        wrapper: createWrapper(queryClient),
      },
    )

    await waitFor(() => {
      expect(serverErrorHook.result.current.error).toBe(serverError)
    })
    expect(serverErrorHook.result.current.trace).toBeNull()
  })
})
