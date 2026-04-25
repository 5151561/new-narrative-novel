import type { Preview } from '@storybook/react'

import '../src/styles/globals.css'
import { STORYBOOK_DEFAULT_LOCALE, withStorybookLocale } from './storybook-locale'

const preview: Preview = {
  tags: ['autodocs'],
  decorators: [withStorybookLocale],
  initialGlobals: {
    locale: STORYBOOK_DEFAULT_LOCALE,
  },
  globalTypes: {
    locale: {
      name: 'Locale',
      description: 'App locale for Storybook previews',
      toolbar: {
        icon: 'globe',
        items: [
          { value: 'zh-CN', title: '中文' },
          { value: 'en', title: 'English' },
        ],
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    layout: 'fullscreen',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'parchment',
      values: [{ name: 'parchment', value: '#f5f4ed' }],
    },
  },
}

export default preview
