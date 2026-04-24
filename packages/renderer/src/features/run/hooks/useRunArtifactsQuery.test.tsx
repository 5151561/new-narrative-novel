import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { ApiRequestError } from '@/app/project-runtime'
import type { RunArtifactListResponse } from '@/features/run/api/run-artifact-records'

import { runQueryKeys } from './run-query-keys'
import { useRunArtifactsQuery } from './useRunArtifactsQuery'

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

function createArtifactsResponse(): RunArtifactListResponse {
  return {
    runId: 'run-scene-midnight-platform-001',
    artifacts: [
      {
        id: 'ctx-scene-midnight-platform-run-001',
        runId: 'run-scene-midnight-platform-001',
        kind: 'context-packet',
        title: { en: 'Scene context packet', 'zh-CN': 'Scene context packet' },
        summary: { en: 'Packed context.', 'zh-CN': 'Packed context.' },
        statusLabel: { en: 'Built', 'zh-CN': 'Built' },
        createdAtLabel: { en: '2026-04-21 10:03', 'zh-CN': '2026-04-21 10:03' },
        sourceEventIds: ['run-event-scene-midnight-platform-001-003'],
      },
    ],
  }
}

describe('useRunArtifactsQuery', () => {
  it('does not request when runId is empty', async () => {
    const queryClient = createQueryClient()
    const client = {
      listRunArtifacts: vi.fn(async () => createArtifactsResponse()),
    }

    const hook = renderHook(
      () =>
        useRunArtifactsQuery('', {
          client,
          projectId: 'project-1',
        }),
      {
        wrapper: createWrapper(queryClient),
      },
    )

    expect(hook.result.current.artifacts).toEqual([])
    expect(client.listRunArtifacts).not.toHaveBeenCalled()
    expect(queryClient.getQueryData(runQueryKeys.artifacts('project-1', '__missing__'))).toBeUndefined()
  })

  it('reads artifacts and stores them under projectId and runId', async () => {
    const queryClient = createQueryClient()
    const response = createArtifactsResponse()
    const client = {
      listRunArtifacts: vi.fn(async () => response),
    }

    const hook = renderHook(
      () =>
        useRunArtifactsQuery('run-scene-midnight-platform-001', {
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

    expect(client.listRunArtifacts).toHaveBeenCalledWith({ runId: 'run-scene-midnight-platform-001' })
    expect(hook.result.current.artifacts).toEqual(response.artifacts)
    expect(queryClient.getQueryData(runQueryKeys.artifacts('project-1', 'run-scene-midnight-platform-001'))).toEqual(response)
  })

  it('surfaces 404 and 500 read failures as query errors', async () => {
    const queryClient = createQueryClient()
    const notFound = new ApiRequestError({
      status: 404,
      message: 'Run not found',
      code: 'run-not-found',
    })
    const serverError = new ApiRequestError({
      status: 500,
      message: 'Artifacts unavailable',
      code: 'run-artifacts-unavailable',
    })
    const client = {
      listRunArtifacts: vi.fn()
        .mockRejectedValueOnce(notFound)
        .mockRejectedValueOnce(serverError),
    }

    const notFoundHook = renderHook(
      () =>
        useRunArtifactsQuery('run-missing', {
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
    expect(notFoundHook.result.current.artifacts).toEqual([])

    const serverErrorHook = renderHook(
      () =>
        useRunArtifactsQuery('run-broken', {
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
    expect(serverErrorHook.result.current.artifacts).toEqual([])
  })
})
