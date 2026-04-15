import type { Meta, StoryObj } from '@storybook/react'

import { getSceneFixture } from '@/mock/scene-fixtures'

import { SceneObjectiveStrip } from './SceneObjectiveStrip'

const scene = getSceneFixture('scene-midnight-platform')

const meta = {
  title: 'Business/SceneObjectiveStrip',
  component: SceneObjectiveStrip,
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <div className="min-h-[360px] bg-app p-6">
      <SceneObjectiveStrip {...args} />
    </div>
  ),
  args: {
    objective: scene.execution.objective,
  },
} satisfies Meta<typeof SceneObjectiveStrip>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
