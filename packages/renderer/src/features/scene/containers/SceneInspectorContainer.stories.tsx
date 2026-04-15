import type { ReactElement } from 'react'

import type { Meta, StoryObj } from '@storybook/react'

import { AppProviders } from '@/app/providers'

import { SceneInspectorContainer } from './SceneInspectorContainer'

const meta = {
  title: 'Mockups/Scene/Inspector',
  component: SceneInspectorContainer,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story: () => ReactElement) => (
      <AppProviders>
        <div className="min-h-screen bg-app p-6">
          <div className="ring-panel flex min-h-[760px] w-[360px] overflow-hidden rounded-md bg-surface-1">
            <Story />
          </div>
        </div>
      </AppProviders>
    ),
  ],
} satisfies Meta<typeof SceneInspectorContainer>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    sceneId: 'scene-midnight-platform',
  },
}
