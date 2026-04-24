import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { ApiRequestError } from '@/app/project-runtime'
import type { RunArtifactDetailResponse } from '@/features/run/api/run-artifact-records'

import { runQueryKeys } from './run-query-keys'
import { useRunArtifactDetailQuery } from './useRunArtifactDetailQuery'

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

function createArtifactResponse(): RunArtifactDetailResponse {
  return {
    artifact: {
      id: 'ctx-scene-midnight-platform-run-001',
      runId: 'run-scene-midnight-platform-001',
      kind: 'context-packet',
      title: { en: 'Scene context packet', 'zh-CN': 'Scene context packet' },
      summary: { en: 'Packed context.', 'zh-CN': 'Packed context.' },
      statusLabel: { en: 'Built', 'zh-CN': 'Built' },
      createdAtLabel: { en: '2026-04-21 10:03', 'zh-CN': '2026-04-21 10:03' },
      sourceEventIds: ['run-event-scene-midnight-platform-001-003'],
      sceneId: 'scene-midnight-platform',
      sections: [],
      includedCanonFacts: [],
      includedAssets: [],
      excludedPrivateFacts: [],
      outputSchemaLabel: { en: 'Schema', 'zh-CN': 'Schema' },
      tokenBudgetLabel: { en: '1500 tokens', 'zh-CN': '1500 tokens' },
    },
  }
}

describe('useRunArtifactDetailQuery', () => {
  it('does not request when runId or artifactId is empty', () => {
    const queryClient = createQueryClient()
    const client = {
      getRunArtifact: vi.fn(async () => createArtifactResponse()),
    }

    const hook = renderHook(
      () =>
        useRunArtifactDetailQuery(
          {
            runId: 'run-scene-midnight-platform-001',
            artifactId: '',
          },
          {
            client,
            projectId: 'project-1',
          },
        ),
      {
        wrapper: createWrapper(queryClient),
      },
    )

    expect(hook.result.current.artifact).toBeNull()
    expect(client.getRunArtifact).not.toHaveBeenCalled()
    expect(queryClient.getQueryData(runQueryKeys.artifact('project-1', 'run-scene-midnight-platform-001', '__missing__'))).toBeUndefined()

    renderHook(
      () =>
        useRunArtifactDetailQuery(
          {
            runId: '',
            artifactId: 'ctx-scene-midnight-platform-run-001',
          },
          {
            client,
            projectId: 'project-1',
          },
        ),
      {
        wrapper: createWrapper(queryClient),
      },
    )

    expect(client.getRunArtifact).not.toHaveBeenCalled()
    expect(queryClient.getQueryData(runQueryKeys.artifact('project-1', '__missing__', 'ctx-scene-midnight-platform-run-001'))).toBeUndefined()
  })

  it('reads artifact detail and stores it under projectId, runId, and artifactId', async () => {
    const queryClient = createQueryClient()
    const response = createArtifactResponse()
    const client = {
      getRunArtifact: vi.fn(async () => response),
    }

    const hook = renderHook(
      () =>
        useRunArtifactDetailQuery(
          {
            runId: 'run-scene-midnight-platform-001',
            artifactId: 'ctx-scene-midnight-platform-run-001',
          },
          {
            client,
            projectId: 'project-1',
          },
        ),
      {
        wrapper: createWrapper(queryClient),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(client.getRunArtifact).toHaveBeenCalledWith({
      runId: 'run-scene-midnight-platform-001',
      artifactId: 'ctx-scene-midnight-platform-run-001',
    })
    expect(hook.result.current.artifact).toEqual(response.artifact)
    expect(
      queryClient.getQueryData(
        runQueryKeys.artifact('project-1', 'run-scene-midnight-platform-001', 'ctx-scene-midnight-platform-run-001'),
      ),
    ).toEqual(response)
  })

  it('surfaces 404 and 500 failures as query errors', async () => {
    const queryClient = createQueryClient()
    const notFound = new ApiRequestError({
      status: 404,
      message: 'Run artifact missing',
      code: 'run-artifact-not-found',
    })
    const serverError = new ApiRequestError({
      status: 500,
      message: 'Artifact detail unavailable',
      code: 'run-artifact-unavailable',
    })
    const client = {
      getRunArtifact: vi.fn()
        .mockRejectedValueOnce(notFound)
        .mockRejectedValueOnce(serverError),
    }

    const firstHook = renderHook(
      () =>
        useRunArtifactDetailQuery(
          {
            runId: 'run-scene-midnight-platform-001',
            artifactId: 'artifact-missing',
          },
          {
            client,
            projectId: 'project-1',
          },
        ),
      {
        wrapper: createWrapper(queryClient),
      },
    )

    await waitFor(() => {
      expect(firstHook.result.current.error).toBe(notFound)
    })

    const secondHook = renderHook(
      () =>
        useRunArtifactDetailQuery(
          {
            runId: 'run-scene-midnight-platform-001',
            artifactId: 'artifact-broken',
          },
          {
            client,
            projectId: 'project-1',
          },
        ),
      {
        wrapper: createWrapper(queryClient),
      },
    )

    await waitFor(() => {
      expect(secondHook.result.current.error).toBe(serverError)
    })
  })
})
