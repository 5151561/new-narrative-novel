import { renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { AppProviders } from '@/app/providers'

import type { ProjectRuntime } from './project-runtime'
import { ProjectRuntimeProvider, useProjectRuntime } from './ProjectRuntimeProvider'
import { createMockProjectRuntime } from './mock-project-runtime'

describe('ProjectRuntimeProvider', () => {
  it('throws a clear error when the project runtime hook is used outside the provider', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => renderHook(() => useProjectRuntime())).toThrow('useProjectRuntime must be used within ProjectRuntimeProvider')

    consoleErrorSpy.mockRestore()
  })

  it('returns the injected runtime for tests and stories', () => {
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

  it('makes the default project runtime available through AppProviders', () => {
    const hook = renderHook(() => useProjectRuntime(), {
      wrapper: AppProviders,
    })

    expect(hook.result.current.projectId).toBe('book-signal-arc')
    expect(hook.result.current.bookClient).toBeDefined()
    expect(hook.result.current.chapterClient).toBeDefined()
    expect(hook.result.current.reviewClient).toBeDefined()
    expect(hook.result.current.sceneClient).toBeDefined()
    expect(hook.result.current.traceabilitySceneClient).toBeDefined()
    expect(hook.result.current.persistence).toBeDefined()
  })
})
