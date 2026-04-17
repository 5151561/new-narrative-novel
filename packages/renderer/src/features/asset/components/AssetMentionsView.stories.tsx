import type { Meta, StoryObj } from '@storybook/react'

import { AssetStoryShell } from '../containers/asset-storybook'

import { AssetMentionsView } from './AssetMentionsView'
import { getAssetStoryVariantSearch, useAssetStoryWorkspace, type AssetStoryVariant } from './asset-story-fixture'

interface AssetMentionsViewStoryProps {
  variant?: Extract<AssetStoryVariant, 'character' | 'location'>
}

function AssetMentionsViewStory({ variant = 'character' }: AssetMentionsViewStoryProps) {
  const workspace = useAssetStoryWorkspace(variant, 'mentions')

  if (!workspace) {
    return null
  }

  return (
    <AssetMentionsView
      mentions={workspace.mentions}
      onOpenScene={() => undefined}
      onOpenChapter={() => undefined}
    />
  )
}

const meta = {
  title: 'Business/AssetMentionsView',
  component: AssetMentionsViewStory,
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <AssetStoryShell
      frameClassName="max-w-4xl rounded-md border border-line-soft bg-surface-1"
      search={getAssetStoryVariantSearch(args.variant ?? 'character', 'mentions')}
    >
      <AssetMentionsViewStory {...args} />
    </AssetStoryShell>
  ),
  args: {
    variant: 'character',
  },
} satisfies Meta<typeof AssetMentionsViewStory>

export default meta

type Story = StoryObj<typeof meta>

export const Character: Story = {}

export const Location: Story = {
  args: {
    variant: 'location',
  },
}
