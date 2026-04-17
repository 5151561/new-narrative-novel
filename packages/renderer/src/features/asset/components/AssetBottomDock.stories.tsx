import type { Meta, StoryObj } from '@storybook/react'

import { AssetStoryShell } from '../containers/asset-storybook'

import { AssetBottomDock } from './AssetBottomDock'
import { getAssetStoryVariantSearch, useAssetStoryWorkspace, type AssetStoryVariant } from './asset-story-fixture'

interface AssetBottomDockStoryProps {
  variant?: Extract<AssetStoryVariant, 'character' | 'warnings-heavy'>
}

function AssetBottomDockStory({ variant = 'character' }: AssetBottomDockStoryProps) {
  const workspace = useAssetStoryWorkspace(variant, variant === 'warnings-heavy' ? 'relations' : 'mentions')

  if (!workspace) {
    return null
  }

  return <AssetBottomDock summary={workspace.dockSummary} activity={workspace.dockActivity} />
}

const meta = {
  title: 'Business/AssetBottomDock',
  component: AssetBottomDockStory,
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <AssetStoryShell
      frameClassName="max-w-5xl rounded-md border border-line-soft bg-surface-1"
      search={getAssetStoryVariantSearch(
        args.variant ?? 'character',
        (args.variant ?? 'character') === 'warnings-heavy' ? 'relations' : 'mentions',
      )}
    >
      <AssetBottomDockStory {...args} />
    </AssetStoryShell>
  ),
  args: {
    variant: 'character',
  },
} satisfies Meta<typeof AssetBottomDockStory>

export default meta

type Story = StoryObj<typeof meta>

export const Character: Story = {}

export const WarningsHeavy: Story = {
  args: {
    variant: 'warnings-heavy',
  },
}
