import type { Meta, StoryObj } from '@storybook/react'

import { TimelineList } from '@/components/ui/TimelineList'

import { WorkbenchShell } from './WorkbenchShell'

const meta = {
  title: 'Mockups/Workbench/Shell',
  component: WorkbenchShell,
  parameters: {
    layout: 'fullscreen',
  },
  render: () => (
    <WorkbenchShell
      topBar={
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-text-soft">Narrative Novel</p>
            <h2 className="text-xl">Workbench Shell</h2>
          </div>
          <button type="button" className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white">
            New Scene
          </button>
        </div>
      }
      modeRail={
        <div className="flex h-full flex-col gap-2 p-3">
          {['Book', 'Chapter', 'Scene', 'Prose'].map((item) => (
            <button
              key={item}
              type="button"
              className={`rounded-md px-2 py-3 text-sm ${item === 'Scene' ? 'bg-surface-2 shadow-ringwarm' : 'text-text-muted'}`}
            >
              {item}
            </button>
          ))}
        </div>
      }
      navigator={
        <TimelineList
          items={[
            { id: 'scene-a', title: 'Midnight Platform', detail: 'Execution review active.', meta: 'Scene', tone: 'accent' },
            { id: 'scene-b', title: 'Warehouse Bridge', detail: 'Setup draft waiting.', meta: 'Draft', tone: 'neutral' },
          ]}
        />
      }
      mainStage={
        <div className="flex h-full items-center justify-center p-8 text-center">
          <div className="space-y-3">
            <h2 className="text-3xl">Main Stage</h2>
            <p className="max-w-xl text-sm leading-6 text-text-muted">
              This shell story exists so layout review does not depend on the Scene feature container.
            </p>
          </div>
        </div>
      }
    />
  ),
  args: {
    topBar: <></>,
    modeRail: <></>,
    navigator: <></>,
    mainStage: <></>,
  },
} satisfies Meta<typeof WorkbenchShell>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
