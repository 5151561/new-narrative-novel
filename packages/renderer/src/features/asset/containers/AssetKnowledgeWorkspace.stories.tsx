import type { Meta, StoryObj } from '@storybook/react'

import { AssetKnowledgeWorkspace } from './AssetKnowledgeWorkspace'
import { withAssetStoryShell } from './asset-storybook'
import { getAssetStorySearch } from '../components/asset-story-fixture'

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

export const CharacterProfile: Story = {
  parameters: {
    assetStory: {
      search: getAssetStorySearch('character', 'profile'),
    },
  },
}

export const LocationMentions: Story = {
  parameters: {
    assetStory: {
      search: getAssetStorySearch('location', 'mentions'),
    },
  },
}

export const RuleRelations: Story = {
  parameters: {
    assetStory: {
      search: getAssetStorySearch('rule', 'relations'),
    },
  },
}
