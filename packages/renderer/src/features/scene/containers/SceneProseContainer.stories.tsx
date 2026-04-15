import type { ReactElement } from 'react'

import type { Meta, StoryObj } from '@storybook/react'

import { AppProviders } from '@/app/providers'

import { SceneProseContainer } from './SceneProseContainer'

const meta = {
  title: 'Mockups/Scene/Prose',
  component: SceneProseContainer,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story: () => ReactElement) => (
      <AppProviders>
        <div className="min-h-screen bg-app p-6">
          <div className="ring-panel flex min-h-[720px] overflow-hidden rounded-md bg-surface-1">
            <Story />
          </div>
        </div>
      </AppProviders>
    ),
  ],
} satisfies Meta<typeof SceneProseContainer>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    sceneId: 'scene-midnight-platform',
  },
}

export const EmptyDraft: Story = {
  args: {
    sceneId: 'scene-warehouse-bridge',
  },
}
