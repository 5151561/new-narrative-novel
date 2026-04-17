import { APP_LOCALE_STORAGE_KEY, resolveAppLocale } from '@/app/i18n'
import { afterEach, describe, expect, it } from 'vitest'

import { applyStorybookLocale, getStorybookLocale } from './storybook-locale'

afterEach(() => {
  window.localStorage.clear()
  document.documentElement.removeAttribute('lang')
})

describe('storybook locale helpers', () => {
  it('normalizes globals and falls back to en for unsupported values', () => {
    expect(getStorybookLocale('zh-CN')).toBe('zh-CN')
    expect(getStorybookLocale('zh')).toBe('zh-CN')
    expect(getStorybookLocale('en')).toBe('en')
    expect(getStorybookLocale('fr-FR')).toBe('en')
  })

  it('writes the selected locale into app storage before AppProviders resolves it', () => {
    applyStorybookLocale('zh-CN')

    expect(window.localStorage.getItem(APP_LOCALE_STORAGE_KEY)).toBe('zh-CN')
    expect(document.documentElement.lang).toBe('zh-CN')
    expect(resolveAppLocale()).toBe('zh-CN')
  })
})
