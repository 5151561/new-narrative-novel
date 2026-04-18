import type { Meta, StoryObj } from '@storybook/react'

import { useI18n } from '@/app/i18n'
import { AssetStoryShell } from '../containers/asset-storybook'
import { useAssetTraceabilitySummaryQuery } from '@/features/traceability/hooks/useAssetTraceabilitySummaryQuery'

import { AssetBottomDock } from './AssetBottomDock'
import { mergeAssetTraceabilityIntoWorkspace } from '../lib/mergeAssetTraceabilityIntoWorkspace'
import {
  getAssetStoryVariantAssetId,
  getAssetStoryVariantSearch,
  useAssetStoryWorkspace,
  type AssetStoryVariant,
} from './asset-story-fixture'

interface AssetBottomDockStoryProps {
  variant?: Extract<AssetStoryVariant, 'character' | 'warnings-heavy'>
}

function AssetBottomDockStory({ variant = 'character' }: AssetBottomDockStoryProps) {
  const workspace = useAssetStoryWorkspace(variant, variant === 'warnings-heavy' ? 'relations' : 'mentions')
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

  return (
    <AssetBottomDock summary={mergedWorkspace.dockSummary} activity={mergedWorkspace.dockActivity} />
  )
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
