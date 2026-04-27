import { renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AppProviders } from '@/app/providers'

import type { ProjectRuntime } from './project-runtime'
import { ProjectRuntimeProvider, useProjectRuntime } from './ProjectRuntimeProvider'
import { createMockProjectRuntime } from './mock-project-runtime'

const runtimeEnv = import.meta.env as Record<string, string | undefined>
const originalApiBaseUrl = runtimeEnv.VITE_NARRATIVE_API_BASE_URL
const originalProjectId = runtimeEnv.VITE_NARRATIVE_PROJECT_ID

afterEach(() => {
  if (originalApiBaseUrl === undefined) {
    delete runtimeEnv.VITE_NARRATIVE_API_BASE_URL
  } else {
    runtimeEnv.VITE_NARRATIVE_API_BASE_URL = originalApiBaseUrl
  }

  if (originalProjectId === undefined) {
    delete runtimeEnv.VITE_NARRATIVE_PROJECT_ID
  } else {
    runtimeEnv.VITE_NARRATIVE_PROJECT_ID = originalProjectId
  }

  Reflect.deleteProperty(window, 'narrativeDesktop')
  vi.restoreAllMocks()
})

describe('ProjectRuntimeProvider', () => {
  it('throws a clear error when the project runtime hook is used outside the provider', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => renderHook(() => useProjectRuntime())).toThrow('useProjectRuntime must be used within ProjectRuntimeProvider')

    consoleErrorSpy.mockRestore()
  })

  it('returns the injected runtime for tests and stories', () => {
    runtimeEnv.VITE_NARRATIVE_API_BASE_URL = 'https://api.example.test'
    runtimeEnv.VITE_NARRATIVE_PROJECT_ID = 'project-from-env'
    const injectedRuntime = createMockProjectRuntime({
      projectId: 'project-injected-for-test',
    }) satisfies ProjectRuntime

    function Wrapper({ children }: PropsWithChildren) {
      return <ProjectRuntimeProvider runtime={injectedRuntime}>{children}</ProjectRuntimeProvider>
    }

    const hook = renderHook(() => useProjectRuntime(), {
      wrapper: Wrapper,
    })

    expect(hook.result.current).toBe(injectedRuntime)
  })

  it('creates an API runtime by default when the API env is present', () => {
    runtimeEnv.VITE_NARRATIVE_API_BASE_URL = 'https://api.example.test'
    runtimeEnv.VITE_NARRATIVE_PROJECT_ID = 'project-from-env'

    const hook = renderHook(() => useProjectRuntime(), {
      wrapper: AppProviders,
    })

    expect(hook.result.current.projectId).toBe('project-from-env')
    expect(hook.result.current.bookClient).toBeDefined()
    expect(hook.result.current.chapterClient).toBeDefined()
    expect(hook.result.current.assetClient).toBeDefined()
    expect(hook.result.current.reviewClient).toBeDefined()
    expect(hook.result.current.sceneClient).toBeDefined()
    expect(hook.result.current.traceabilitySceneClient).toBeDefined()
    expect(hook.result.current.persistence).toBeUndefined()
  })

  it('keeps generic web runtime on the mock fallback when the API env is absent', () => {
    delete runtimeEnv.VITE_NARRATIVE_API_BASE_URL
    delete runtimeEnv.VITE_NARRATIVE_PROJECT_ID

    function Wrapper({ children }: PropsWithChildren) {
      return (
        <ProjectRuntimeProvider
          runtimeConfig={{
            apiBaseUrl: 'http://127.0.0.1:4888/api',
            runtimeMode: 'web',
          }}
        >
          {children}
        </ProjectRuntimeProvider>
      )
    }

    const hook = renderHook(() => useProjectRuntime(), {
      wrapper: Wrapper,
    })

    expect(hook.result.current.projectId).toBe('book-signal-arc')
    expect(hook.result.current.persistence).toBeDefined()
  })

  it('creates an API runtime from desktop-local runtime config using the current project identity instead of env defaults', async () => {
    delete runtimeEnv.VITE_NARRATIVE_API_BASE_URL
    runtimeEnv.VITE_NARRATIVE_PROJECT_ID = 'project-from-env'
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          capabilities: {
            read: true,
            runEvents: true,
            write: true,
          },
          projectId: 'desktop-project-signal-arc',
          projectTitle: 'Signal Arc Desktop',
          source: 'api',
          status: 'healthy',
        }),
        {
          headers: {
            'Content-Type': 'application/json',
          },
          status: 200,
        },
      ),
    )

    function Wrapper({ children }: PropsWithChildren) {
      return (
        <ProjectRuntimeProvider
          runtimeConfig={{
            apiBaseUrl: 'http://127.0.0.1:4888/api',
            projectId: 'desktop-project-signal-arc',
            projectTitle: 'Signal Arc Desktop',
            runtimeMode: 'desktop-local',
          }}
        >
          {children}
        </ProjectRuntimeProvider>
      )
    }

    const hook = renderHook(() => useProjectRuntime(), {
      wrapper: Wrapper,
    })

    expect(hook.result.current.persistence).toBeUndefined()

    await hook.result.current.runtimeInfoClient.getProjectRuntimeInfo()

    expect(hook.result.current.projectId).toBe('desktop-project-signal-arc')
    expect(fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:4888/api/projects/desktop-project-signal-arc/runtime-info',
      expect.any(Object),
    )
  })
})
