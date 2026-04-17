import { APP_LOCALE_STORAGE_KEY, resolveAppLocale } from '@/app/i18n'
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  window.localStorage.clear()
  document.documentElement.removeAttribute('lang')
  vi.resetModules()
  vi.unstubAllGlobals()
})

describe('storybook locale helpers', () => {
  it('normalizes globals and falls back to the app resolver when globals are missing', async () => {
    vi.stubGlobal('navigator', { language: 'zh-CN' })

    const { getStorybookLocale } = await import('./storybook-locale')

    expect(getStorybookLocale('zh-CN')).toBe('zh-CN')
    expect(getStorybookLocale('zh')).toBe('zh-CN')
    expect(getStorybookLocale('en')).toBe('en')
    expect(getStorybookLocale('fr-FR')).toBe('en')
    expect(getStorybookLocale(undefined)).toBe('zh-CN')
  })

  it('derives the initial storybook locale from the same resolver as the app', async () => {
    vi.stubGlobal('navigator', { language: 'en-US' })

    const { STORYBOOK_DEFAULT_LOCALE } = await import('./storybook-locale')

    expect(STORYBOOK_DEFAULT_LOCALE).toBe('en')
  })

  it('writes the selected locale into app storage before AppProviders resolves it', async () => {
    const { applyStorybookLocale } = await import('./storybook-locale')

    applyStorybookLocale('zh-CN')

    expect(window.localStorage.getItem(APP_LOCALE_STORAGE_KEY)).toBe('zh-CN')
    expect(document.documentElement.lang).toBe('zh-CN')
    expect(resolveAppLocale()).toBe('zh-CN')
  })
})
