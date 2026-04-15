import type { Meta, StoryObj } from '@storybook/react'

import { Pane } from './Pane'
import { PaneHeader } from './PaneHeader'

const meta = {
  title: 'UI/Pane',
  component: Pane,
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <div className="min-h-[320px] bg-app p-6">
      <Pane {...args} className="max-w-xl">
        <PaneHeader title="Navigator Pane" description="A warm, ring-shadowed container for workbench regions." />
        <div className="space-y-3 p-4 text-sm leading-6 text-text-muted">
          <p>Use pane surfaces for major layout regions so the shell stays visually coherent.</p>
          <p>This story is static and reviewable without any application data source.</p>
        </div>
      </Pane>
    </div>
  ),
  args: {
    muted: false,
  },
} satisfies Meta<typeof Pane>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Muted: Story = {
  args: {
    muted: true,
  },
}
