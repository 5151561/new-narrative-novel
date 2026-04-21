import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'

import { createApiProjectRuntime } from './api-project-runtime'
import { ApiRequestError } from './api-transport'
import { createFakeApiRuntime } from './fake-api-runtime.test-utils'
import { createProjectRuntimeTestWrapper, createTestProjectRuntime } from './project-runtime-test-utils'
import { useProjectRuntimeHealthQuery } from './useProjectRuntimeHealthQuery'

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

function createDeferredPromise<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve
    reject = innerReject
  })

  return {
    promise,
    resolve,
    reject,
  }
}

describe('useProjectRuntimeHealthQuery', () => {
  it('returns healthy runtime info for the mock runtime', async () => {
    const wrapper = createProjectRuntimeTestWrapper({
      runtime: createTestProjectRuntime({
        projectId: 'project-mock',
      }),
    })

    const hook = renderHook(() => useProjectRuntimeHealthQuery(), { wrapper })

    expect(hook.result.current.info).toMatchObject({
      projectId: 'project-mock',
      source: 'mock',
      status: 'checking',
    })
    expect(hook.result.current.isChecking).toBe(true)
    expect(hook.result.current.error).toBeNull()

    await waitFor(() => {
      expect(hook.result.current.info.status).toBe('healthy')
    })

    expect(hook.result.current.info).toEqual({
      projectId: 'project-mock',
      projectTitle: 'project-mock',
      source: 'mock',
      status: 'healthy',
      summary: 'Using in-memory mock project runtime.',
      checkedAtLabel: 'Static mock runtime',
      capabilities: {
        read: true,
        write: true,
        runEvents: true,
        runEventPolling: true,
        runEventStream: false,
        reviewDecisions: true,
        contextPacketRefs: true,
        proposalSetRefs: true,
      },
    })
    expect(hook.result.current.isChecking).toBe(false)
    expect(hook.result.current.error).toBeNull()
  })

  it.each([
    { status: 401, expectedStatus: 'unauthorized' },
    { status: 403, expectedStatus: 'forbidden' },
  ] as const)('classifies API %s responses into %s', async ({ status, expectedStatus }) => {
    const apiError = new ApiRequestError({
      status,
      message: `runtime-${status}`,
    })
    const { runtime } = createFakeApiRuntime({
      projectId: 'project-auth',
      overrides: [
        {
          method: 'GET',
          path: '/api/projects/project-auth/runtime-info',
          error: apiError,
        },
      ],
    })
    const wrapper = createProjectRuntimeTestWrapper({ runtime })

    const hook = renderHook(() => useProjectRuntimeHealthQuery(), { wrapper })

    await waitFor(() => {
      expect(hook.result.current.isChecking).toBe(false)
    })

    expect(hook.result.current.info).toMatchObject({
      projectId: 'project-auth',
      source: 'api',
      status: expectedStatus,
    })
    expect(hook.result.current.error).toBe(apiError)
  })

  it('classifies API 404 responses into not_found', async () => {
    const apiError = new ApiRequestError({
      status: 404,
      message: 'runtime-404',
    })
    const { runtime } = createFakeApiRuntime({
      projectId: 'project-missing',
      overrides: [
        {
          method: 'GET',
          path: '/api/projects/project-missing/runtime-info',
          error: apiError,
        },
      ],
    })
    const wrapper = createProjectRuntimeTestWrapper({ runtime })

    const hook = renderHook(() => useProjectRuntimeHealthQuery(), { wrapper })

    await waitFor(() => {
      expect(hook.result.current.isChecking).toBe(false)
    })

    expect(hook.result.current.info).toMatchObject({
      projectId: 'project-missing',
      source: 'api',
      status: 'not_found',
    })
    expect(hook.result.current.error).toBe(apiError)
  })

  it.each([
    new ApiRequestError({
      status: 503,
      message: 'runtime-unavailable',
    }),
    new Error('fetch failed'),
    new ApiRequestError({
      status: 200,
      message: 'Malformed JSON response',
      detail: '<html>gateway error</html>',
    }),
  ])('classifies unavailable runtime-info failures for %s', async (error) => {
    const { runtime } = createFakeApiRuntime({
      projectId: 'project-down',
      overrides: [
        {
          method: 'GET',
          path: '/api/projects/project-down/runtime-info',
          error,
        },
      ],
    })
    const wrapper = createProjectRuntimeTestWrapper({ runtime })

    const hook = renderHook(() => useProjectRuntimeHealthQuery(), { wrapper })

    await waitFor(() => {
      expect(hook.result.current.isChecking).toBe(false)
    })

    expect(hook.result.current.info).toMatchObject({
      projectId: 'project-down',
      source: 'api',
      status: 'unavailable',
    })
    expect(hook.result.current.error).toBe(error)
  })

  it('classifies unknown runtime-info failures when the API status falls through', async () => {
    const apiError = new ApiRequestError({
      status: 418,
      message: 'teapot-runtime',
    })
    const { runtime } = createFakeApiRuntime({
      projectId: 'project-unknown',
      overrides: [
        {
          method: 'GET',
          path: '/api/projects/project-unknown/runtime-info',
          error: apiError,
        },
      ],
    })
    const wrapper = createProjectRuntimeTestWrapper({ runtime })

    const hook = renderHook(() => useProjectRuntimeHealthQuery(), { wrapper })

    await waitFor(() => {
      expect(hook.result.current.isChecking).toBe(false)
    })

    expect(hook.result.current.info).toMatchObject({
      projectId: 'project-unknown',
      source: 'api',
      status: 'unknown',
    })
    expect(hook.result.current.error).toBe(apiError)
  })

  it('allows refetch to reload runtime info', async () => {
    const getProjectRuntimeInfo = vi
      .fn()
      .mockResolvedValueOnce({
        projectId: 'project-refetch',
        projectTitle: 'Signal Arc',
        source: 'api',
        status: 'healthy',
        summary: 'Initial runtime info.',
        checkedAtLabel: '2026-04-21 09:00',
        capabilities: {
          read: true,
          write: true,
          runEvents: true,
          runEventPolling: true,
          runEventStream: false,
          reviewDecisions: true,
          contextPacketRefs: true,
          proposalSetRefs: true,
        },
      })
      .mockResolvedValueOnce({
        projectId: 'project-refetch',
        projectTitle: 'Signal Arc',
        source: 'api',
        status: 'healthy',
        summary: 'Refetched runtime info.',
        checkedAtLabel: '2026-04-21 09:05',
        capabilities: {
          read: true,
          write: true,
          runEvents: true,
          runEventPolling: true,
          runEventStream: true,
          reviewDecisions: true,
          contextPacketRefs: true,
          proposalSetRefs: true,
        },
      })
    const runtime = createApiProjectRuntime({
      projectId: 'project-refetch',
      transport: {
        requestJson: vi.fn(async ({ path, method }) => {
          if (method === 'GET' && path === '/api/projects/project-refetch/runtime-info') {
            return getProjectRuntimeInfo()
          }

          throw new Error(`Unexpected transport request: ${method} ${path}`)
        }),
      },
    })
    const wrapper = createProjectRuntimeTestWrapper({ runtime })
    const hook = renderHook(() => useProjectRuntimeHealthQuery(), { wrapper })

    await waitFor(() => {
      expect(hook.result.current.info.summary).toBe('Initial runtime info.')
    })

    await act(async () => {
      await hook.result.current.refetch()
    })

    await waitFor(() => {
      expect(hook.result.current.info.summary).toBe('Refetched runtime info.')
    })
    expect(getProjectRuntimeInfo).toHaveBeenCalledTimes(2)
  })

  it('keeps the health query key independent from route-like scope, lens, and selected-object props', async () => {
    const deferred = createDeferredPromise<{
      projectId: string
      projectTitle: string
      source: 'api'
      status: 'healthy'
      summary: string
      checkedAtLabel: string
      capabilities: {
        read: boolean
        write: boolean
        runEvents: boolean
        runEventPolling: boolean
        runEventStream: boolean
        reviewDecisions: boolean
        contextPacketRefs: boolean
        proposalSetRefs: boolean
      }
    }>()
    const requestJson = vi.fn(async ({ path, method }: { path: string; method: string }) => {
      if (method === 'GET' && path === '/api/projects/project-query-key/runtime-info') {
        return deferred.promise
      }

      throw new Error(`Unexpected transport request: ${method} ${path}`)
    })
    const runtime = createApiProjectRuntime({
      projectId: 'project-query-key',
      transport: {
        requestJson,
      },
    })
    const queryClient = createQueryClient()
    const wrapper = createProjectRuntimeTestWrapper({ runtime, queryClient })
    const hook = renderHook(
      ({ scope, lens, selected }) => {
        void scope
        void lens
        void selected
        return useProjectRuntimeHealthQuery()
      },
      {
        initialProps: {
          scope: 'scene',
          lens: 'editorial',
          selected: { id: 'scene-1' },
        },
        wrapper,
      },
    )

    expect(queryClient.getQueryCache().getAll()).toHaveLength(1)
    expect(queryClient.getQueryCache().getAll()[0]?.queryKey).toEqual([
      'project-runtime',
      'project-query-key',
      'health',
    ])

    hook.rerender({
      scope: 'book',
      lens: 'source',
      selected: { id: 'book-1', branchId: 'branch-2' },
    })

    expect(queryClient.getQueryCache().getAll()).toHaveLength(1)
    expect(requestJson).toHaveBeenCalledTimes(1)

    deferred.resolve({
      projectId: 'project-query-key',
      projectTitle: 'Signal Arc',
      source: 'api',
      status: 'healthy',
      summary: 'Connected to runtime gateway.',
      checkedAtLabel: '2026-04-21 09:30',
      capabilities: {
        read: true,
        write: true,
        runEvents: true,
        runEventPolling: true,
        runEventStream: false,
        reviewDecisions: true,
        contextPacketRefs: true,
        proposalSetRefs: true,
      },
    })

    await waitFor(() => {
      expect(hook.result.current.info.status).toBe('healthy')
    })
  })
})
