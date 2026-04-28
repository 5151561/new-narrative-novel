import { act, render, renderHook, screen, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { useEffect } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { QueryClient } from '@tanstack/react-query'

import { bookQueryKeys } from '@/features/book/hooks/book-query-keys'

import { useI18n } from './i18n'
import { createTestProjectRuntime, useProjectRuntime } from './project-runtime'
import { AppProviders } from './providers'

const runtimeEnv = import.meta.env as Record<string, string | undefined>
const originalApiBaseUrl = runtimeEnv.VITE_NARRATIVE_API_BASE_URL
const originalProjectId = runtimeEnv.VITE_NARRATIVE_PROJECT_ID

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })

  return {
    promise,
    reject,
    resolve,
  }
}

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
})

describe('AppProviders', () => {
  it('defaults to the mock runtime when the API env is absent', () => {
    delete runtimeEnv.VITE_NARRATIVE_API_BASE_URL
    delete runtimeEnv.VITE_NARRATIVE_PROJECT_ID

    const hook = renderHook(() => useProjectRuntime(), {
      wrapper: AppProviders,
    })

    expect(hook.result.current.projectId).toBe('book-signal-arc')
    expect(hook.result.current.persistence).toBeDefined()
    expect(hook.result.current.assetClient).toBeDefined()
  })

  it('uses an injected project runtime instead of creating the default env-driven runtime', async () => {
    runtimeEnv.VITE_NARRATIVE_API_BASE_URL = 'https://api.example.test'
    runtimeEnv.VITE_NARRATIVE_PROJECT_ID = 'project-from-env'
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    const runtime = createTestProjectRuntime()

    function Wrapper({ children }: PropsWithChildren) {
      return <AppProviders runtime={runtime}>{children}</AppProviders>
    }

    const hook = renderHook(() => useProjectRuntime(), {
      wrapper: Wrapper,
    })

    expect(hook.result.current).toBe(runtime)
    expect(hook.result.current.projectId).not.toBe('project-from-env')

    await act(async () => {
      await hook.result.current.reviewClient.setReviewIssueDecision({
        bookId: 'book-signal-arc',
        issueId: 'issue-1',
        issueSignature: 'signature-1',
        status: 'reviewed',
      })
    })

    expect(setItemSpy).not.toHaveBeenCalled()
  })

  it('invalidates book queries when the locale changes', async () => {
    let setLocaleRef: ReturnType<typeof useI18n>['setLocale'] | undefined
    const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries')

    function LocaleControl() {
      const { setLocale } = useI18n()

      useEffect(() => {
        setLocaleRef = setLocale
      }, [setLocale])

      return null
    }

    render(
      <AppProviders>
        <LocaleControl />
      </AppProviders>,
    )

    invalidateSpy.mockClear()

    act(() => {
      setLocaleRef?.('zh-CN')
    })

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: bookQueryKeys.all })
    })
  })

  it('does not render children with the mock runtime while desktop runtime config is pending', async () => {
    delete runtimeEnv.VITE_NARRATIVE_API_BASE_URL
    delete runtimeEnv.VITE_NARRATIVE_PROJECT_ID
    const desktopConfig = deferred<{
      apiBaseUrl: string
      projectId: string
      projectTitle?: string
      runtimeMode: 'desktop-local'
    }>()
    Object.defineProperty(window, 'narrativeDesktop', {
      configurable: true,
      value: {
        getRuntimeConfig: vi.fn(() => desktopConfig.promise),
      },
    })

    function RuntimeSourceProbe() {
      const runtime = useProjectRuntime()

      return <div data-testid="runtime-source">{runtime.persistence ? 'mock' : 'api'}</div>
    }

    render(
      <AppProviders>
        <RuntimeSourceProbe />
      </AppProviders>,
    )

    expect(screen.queryByTestId('runtime-source')).toBeNull()

    desktopConfig.resolve({
      apiBaseUrl: 'http://127.0.0.1:4888/api',
      projectId: 'desktop-project-signal-arc',
      projectMode: 'real-project',
      runtimeKind: 'real-local-project',
      projectTitle: 'Signal Arc Desktop',
      runtimeMode: 'desktop-local',
    })

    await waitFor(() => {
      expect(screen.getByTestId('runtime-source')).toHaveTextContent('api')
    })
  })
})
