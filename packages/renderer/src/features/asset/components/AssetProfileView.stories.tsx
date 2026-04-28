import type { Meta, StoryObj } from '@storybook/react'

import { AssetStoryShell } from '../containers/asset-storybook'

import { AssetProfileView } from './AssetProfileView'
import { getAssetStoryVariantSearch, useAssetStoryWorkspace, type AssetStoryVariant } from './asset-story-fixture'

interface AssetProfileViewStoryProps {
  variant?: Extract<AssetStoryVariant, 'character' | 'location' | 'rule'>
}

function AssetProfileViewStory({ variant = 'character' }: AssetProfileViewStoryProps) {
  const workspace = useAssetStoryWorkspace(variant)

  if (!workspace) {
    return null
  }

  return <AssetProfileView profile={workspace.profile} storyBible={workspace.storyBible} />
}

const meta = {
  title: 'Business/AssetProfileView',
  component: AssetProfileViewStory,
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <AssetStoryShell
      frameClassName="max-w-4xl rounded-md border border-line-soft bg-surface-1"
      search={getAssetStoryVariantSearch(args.variant ?? 'character', 'profile')}
    >
      <AssetProfileViewStory {...args} />
    </AssetStoryShell>
  ),
  args: {
    variant: 'character',
  },
} satisfies Meta<typeof AssetProfileViewStory>

export default meta

type Story = StoryObj<typeof meta>

export const Character: Story = {}

export const Location: Story = {
  args: {
    variant: 'location',
  },
}

export const Rule: Story = {
  args: {
    variant: 'rule',
  },
}
