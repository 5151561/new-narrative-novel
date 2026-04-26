import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { APP_LOCALE_STORAGE_KEY, I18nProvider } from '@/app/i18n'

import { LocaleToggle } from './LocaleToggle'

describe('LocaleToggle', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.localStorage.setItem(APP_LOCALE_STORAGE_KEY, 'en')
  })

  it('acts as a locale switch action without a pressed state', async () => {
    const user = userEvent.setup()

    render(
      <I18nProvider>
        <LocaleToggle />
      </I18nProvider>,
    )

    const switchToChinese = screen.getByRole('button', { name: 'Language: 中文' })
    expect(switchToChinese).not.toHaveAttribute('aria-pressed')

    await user.click(switchToChinese)

    await waitFor(() => {
      const switchToEnglish = screen.getByRole('button', { name: '语言: EN' })
      expect(switchToEnglish).not.toHaveAttribute('aria-pressed')
    })
  })
})
