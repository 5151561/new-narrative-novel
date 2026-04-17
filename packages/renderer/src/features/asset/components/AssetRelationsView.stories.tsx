import type { Meta, StoryObj } from '@storybook/react'

import { AssetStoryShell } from '../containers/asset-storybook'

import { AssetRelationsView } from './AssetRelationsView'
import { getAssetStoryVariantSearch, useAssetStoryWorkspace, type AssetStoryVariant } from './asset-story-fixture'

interface AssetRelationsViewStoryProps {
  variant?: Extract<AssetStoryVariant, 'character' | 'rule'>
}

function AssetRelationsViewStory({ variant = 'character' }: AssetRelationsViewStoryProps) {
  const workspace = useAssetStoryWorkspace(variant, 'relations')

  if (!workspace) {
    return null
  }

  return <AssetRelationsView relations={workspace.relations} onSelectAsset={() => undefined} />
}

const meta = {
  title: 'Business/AssetRelationsView',
  component: AssetRelationsViewStory,
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <AssetStoryShell
      frameClassName="max-w-4xl rounded-md border border-line-soft bg-surface-1"
      search={getAssetStoryVariantSearch(args.variant ?? 'character', 'relations')}
    >
      <AssetRelationsViewStory {...args} />
    </AssetStoryShell>
  ),
  args: {
    variant: 'character',
  },
} satisfies Meta<typeof AssetRelationsViewStory>

export default meta

type Story = StoryObj<typeof meta>

export const Character: Story = {}

export const Rule: Story = {
  args: {
    variant: 'rule',
  },
}
