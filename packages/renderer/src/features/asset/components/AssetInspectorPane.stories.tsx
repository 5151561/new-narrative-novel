import type { Meta, StoryObj } from '@storybook/react'

import { useI18n } from '@/app/i18n'
import { AssetStoryShell } from '../containers/asset-storybook'
import { useAssetTraceabilitySummaryQuery } from '@/features/traceability/hooks/useAssetTraceabilitySummaryQuery'

import { AssetInspectorPane } from './AssetInspectorPane'
import { mergeAssetTraceabilityIntoWorkspace } from '../lib/mergeAssetTraceabilityIntoWorkspace'
import {
  getAssetStoryVariantAssetId,
  getAssetStoryVariantSearch,
  useAssetStoryWorkspace,
  type AssetStoryVariant,
} from './asset-story-fixture'

interface AssetInspectorPaneStoryProps {
  variant?: Extract<AssetStoryVariant, 'character' | 'orphan' | 'warnings-heavy'>
}

function AssetInspectorPaneStory({ variant = 'character' }: AssetInspectorPaneStoryProps) {
  const workspace = useAssetStoryWorkspace(variant)
  const traceability = useAssetTraceabilitySummaryQuery(getAssetStoryVariantAssetId(variant))
  const { locale } = useI18n()

  if (!workspace) {
    return null
  }
  const mergedWorkspace = mergeAssetTraceabilityIntoWorkspace({
    workspace,
    traceability: {
      summary: traceability.summary,
      isLoading: traceability.isLoading,
      error: traceability.error,
    },
    locale,
  })

  return <AssetInspectorPane title={mergedWorkspace.title} inspector={mergedWorkspace.inspector} />
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
