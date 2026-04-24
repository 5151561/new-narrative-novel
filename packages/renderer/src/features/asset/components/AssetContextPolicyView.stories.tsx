import type { Meta, StoryObj } from '@storybook/react'

import { AssetStoryShell } from '../containers/asset-storybook'
import {
  getAssetStoryVariantSearch,
  useAssetStoryWorkspace,
  type AssetStoryVariant,
} from './asset-story-fixture'
import { AssetContextPolicyView } from './AssetContextPolicyView'

interface AssetContextPolicyViewStoryProps {
  variant?: Extract<AssetStoryVariant, 'character' | 'rule' | 'warnings-heavy' | 'missing-policy'>
}

function AssetContextPolicyViewStory({ variant = 'character' }: AssetContextPolicyViewStoryProps) {
  const workspace = useAssetStoryWorkspace(variant, 'context')

  if (!workspace) {
    return null
  }

  return <AssetContextPolicyView policy={workspace.contextPolicy} />
}

const meta = {
  title: 'Business/AssetContextPolicyView',
  component: AssetContextPolicyViewStory,
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <AssetStoryShell
      frameClassName="max-w-5xl rounded-md border border-line-soft bg-surface-1"
      search={getAssetStoryVariantSearch(args.variant ?? 'character', 'context')}
    >
      <AssetContextPolicyViewStory {...args} />
    </AssetStoryShell>
  ),
  args: {
    variant: 'character',
  },
} satisfies Meta<typeof AssetContextPolicyViewStory>

export default meta

type Story = StoryObj<typeof meta>

export const ActivePolicy: Story = {}

export const BlockedOrCautionHeavyPolicy: Story = {
  args: {
    variant: 'rule',
  },
}

export const MissingPolicy: Story = {
  args: {
    variant: 'missing-policy',
  },
}
