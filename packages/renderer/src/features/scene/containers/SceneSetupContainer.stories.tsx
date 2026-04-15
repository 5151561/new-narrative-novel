import type { ReactElement } from 'react'

import type { Meta, StoryObj } from '@storybook/react'

import { AppProviders } from '@/app/providers'

import { SceneSetupContainer } from './SceneSetupContainer'

const meta = {
  title: 'Mockups/Scene/Setup',
  component: SceneSetupContainer,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story: () => ReactElement) => (
      <AppProviders>
        <div className="min-h-screen bg-app p-6">
          <div className="ring-panel flex min-h-[840px] overflow-hidden rounded-md bg-surface-1">
            <Story />
          </div>
        </div>
      </AppProviders>
    ),
  ],
} satisfies Meta<typeof SceneSetupContainer>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    sceneId: 'scene-midnight-platform',
  },
}

export const DraftSetup: Story = {
  args: {
    sceneId: 'scene-warehouse-bridge',
  },
}
