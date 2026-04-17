import type { Meta, StoryObj } from '@storybook/react'

import { AssetStoryShell } from '../containers/asset-storybook'

import { AssetInspectorPane } from './AssetInspectorPane'
import { getAssetStoryVariantSearch, useAssetStoryWorkspace, type AssetStoryVariant } from './asset-story-fixture'

interface AssetInspectorPaneStoryProps {
  variant?: Extract<AssetStoryVariant, 'character' | 'orphan' | 'warnings-heavy'>
}

function AssetInspectorPaneStory({ variant = 'character' }: AssetInspectorPaneStoryProps) {
  const workspace = useAssetStoryWorkspace(variant)

  if (!workspace) {
    return null
  }

  return <AssetInspectorPane title={workspace.title} inspector={workspace.inspector} />
}

const meta = {
  title: 'Business/AssetInspectorPane',
  component: AssetInspectorPaneStory,
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <AssetStoryShell
      frameClassName="max-w-sm rounded-md border border-line-soft bg-surface-1"
      search={getAssetStoryVariantSearch(args.variant ?? 'character', 'profile')}
    >
      <AssetInspectorPaneStory {...args} />
    </AssetStoryShell>
  ),
  args: {
    variant: 'character',
  },
} satisfies Meta<typeof AssetInspectorPaneStory>

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
