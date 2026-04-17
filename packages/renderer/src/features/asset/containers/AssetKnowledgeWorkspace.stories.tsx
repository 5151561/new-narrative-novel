import type { Meta, StoryObj } from '@storybook/react'

import { AssetKnowledgeWorkspace } from './AssetKnowledgeWorkspace'
import { withAssetStoryShell } from './asset-storybook'

const meta = {
  title: 'Mockups/Asset/Knowledge Workspace',
  component: AssetKnowledgeWorkspace,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [withAssetStoryShell('ring-panel overflow-hidden rounded-md bg-surface-1')],
} satisfies Meta<typeof AssetKnowledgeWorkspace>

export default meta

type Story = StoryObj<typeof meta>

export const Profile: Story = {
  parameters: {
    assetStory: {
      search: '?scope=asset&id=asset-ren-voss&lens=knowledge&view=profile',
    },
  },
}

export const Mentions: Story = {
  parameters: {
    assetStory: {
      search: '?scope=asset&id=asset-ren-voss&lens=knowledge&view=mentions',
    },
  },
}

export const Relations: Story = {
  parameters: {
    assetStory: {
      search: '?scope=asset&id=asset-ren-voss&lens=knowledge&view=relations',
    },
  },
}
