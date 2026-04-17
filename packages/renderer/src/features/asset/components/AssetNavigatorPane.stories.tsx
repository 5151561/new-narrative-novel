import type { Meta, StoryObj } from '@storybook/react'

import { AssetStoryShell } from '../containers/asset-storybook'

import { AssetNavigatorPane } from './AssetNavigatorPane'
import { getAssetStoryVariantSearch, useAssetStoryWorkspace, type AssetStoryVariant } from './asset-story-fixture'

interface AssetNavigatorPaneStoryProps {
  variant?: AssetStoryVariant
}

function AssetNavigatorPaneStory({ variant = 'character' }: AssetNavigatorPaneStoryProps) {
  const workspace = useAssetStoryWorkspace(variant)

  if (!workspace) {
    return null
  }

  return (
    <AssetNavigatorPane
      groups={workspace.navigator}
      activeAssetId={workspace.assetId}
      onSelectAsset={() => undefined}
    />
  )
}

const meta = {
  title: 'Business/AssetNavigatorPane',
  component: AssetNavigatorPaneStory,
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <AssetStoryShell
      frameClassName="max-w-sm rounded-md border border-line-soft bg-surface-1"
      search={getAssetStoryVariantSearch(args.variant ?? 'character', 'profile')}
    >
      <AssetNavigatorPaneStory {...args} />
    </AssetStoryShell>
  ),
  args: {
    variant: 'character',
  },
} satisfies Meta<typeof AssetNavigatorPaneStory>

export default meta

type Story = StoryObj<typeof meta>

export const Character: Story = {}

export const OrphanAsset: Story = {
  args: {
    variant: 'orphan',
  },
}

export const WarningsHeavy: Story = {
  args: {
    variant: 'warnings-heavy',
  },
}
