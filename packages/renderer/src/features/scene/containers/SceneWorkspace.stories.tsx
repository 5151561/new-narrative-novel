import type { ReactElement } from 'react'

import type { Meta, StoryObj } from '@storybook/react'

import { AppProviders } from '@/app/providers'

import { SceneWorkspace } from './SceneWorkspace'

const meta = {
  title: 'Mockups/Scene/Workspace',
  component: SceneWorkspace,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story: () => ReactElement) => (
      <AppProviders>
        <div className="min-h-screen bg-app p-6">
          <div className="ring-panel overflow-hidden rounded-md bg-surface-1">
            <Story />
          </div>
        </div>
      </AppProviders>
    ),
  ],
} satisfies Meta<typeof SceneWorkspace>

export default meta

type Story = StoryObj<typeof meta>

export const Final: Story = {
  args: {
    sceneId: 'scene-midnight-platform',
    defaultTab: 'execution',
  },
}

export const Draft: Story = {
  args: {
    sceneId: 'scene-warehouse-bridge',
    defaultTab: 'setup',
  },
}
