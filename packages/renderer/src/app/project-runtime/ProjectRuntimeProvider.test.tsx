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
})
