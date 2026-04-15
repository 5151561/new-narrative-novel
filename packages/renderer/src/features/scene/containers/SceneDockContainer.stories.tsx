import type { ReactElement } from 'react'

import type { Meta, StoryObj } from '@storybook/react'

import { AppProviders } from '@/app/providers'

import { SceneDockContainer } from './SceneDockContainer'

const meta = {
  title: 'Mockups/Scene/Bottom Dock',
  component: SceneDockContainer,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story: () => ReactElement) => (
      <AppProviders>
        <div className="min-h-screen bg-app p-6">
          <div className="ring-panel flex min-h-[420px] flex-col overflow-hidden rounded-md bg-surface-1">
            <Story />
          </div>
        </div>
      </AppProviders>
    ),
  ],
} satisfies Meta<typeof SceneDockContainer>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    sceneId: 'scene-midnight-platform',
  },
}
