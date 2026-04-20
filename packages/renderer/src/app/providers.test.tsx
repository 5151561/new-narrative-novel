import { act, render, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { QueryClient } from '@tanstack/react-query'

import { bookQueryKeys } from '@/features/book/hooks/book-query-keys'

import { useI18n } from './i18n'
import { AppProviders } from './providers'

describe('AppProviders', () => {
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
