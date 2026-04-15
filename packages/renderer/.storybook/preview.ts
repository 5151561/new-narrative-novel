import type { Preview } from '@storybook/react'

import '../src/styles/globals.css'

const preview: Preview = {
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
