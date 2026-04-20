import { act, render, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { useEffect } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { QueryClient } from '@tanstack/react-query'

import { bookQueryKeys } from '@/features/book/hooks/book-query-keys'

import { useI18n } from './i18n'
import { createTestProjectRuntime, useProjectRuntime } from './project-runtime'
import { AppProviders } from './providers'

describe('AppProviders', () => {
  it('uses an injected project runtime instead of creating the default localStorage runtime', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    const runtime = createTestProjectRuntime()

    function Wrapper({ children }: PropsWithChildren) {
      return <AppProviders runtime={runtime}>{children}</AppProviders>
    }

    const hook = renderHook(() => useProjectRuntime(), {
      wrapper: Wrapper,
    })

    expect(hook.result.current).toBe(runtime)

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
})
