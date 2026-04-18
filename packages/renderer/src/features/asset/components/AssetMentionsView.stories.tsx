import type { Meta, StoryObj } from '@storybook/react'

import { useI18n } from '@/app/i18n'
import { AssetStoryShell } from '../containers/asset-storybook'
import { useAssetTraceabilitySummaryQuery } from '@/features/traceability/hooks/useAssetTraceabilitySummaryQuery'

import { AssetMentionsView } from './AssetMentionsView'
import { mergeAssetTraceabilityIntoWorkspace } from '../lib/mergeAssetTraceabilityIntoWorkspace'
import {
  getAssetStoryVariantAssetId,
  getAssetStoryVariantSearch,
  useAssetStoryWorkspace,
  type AssetStoryVariant,
} from './asset-story-fixture'

interface AssetMentionsViewStoryProps {
  variant?: Extract<AssetStoryVariant, 'character' | 'location'>
}

function AssetMentionsViewStory({ variant = 'character' }: AssetMentionsViewStoryProps) {
  const workspace = useAssetStoryWorkspace(variant, 'mentions')
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
    <AssetMentionsView
      mentions={mergedWorkspace.mentions}
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

export const TraceAwareCharacter: Story = {
  args: {
    variant: 'character',
  },
}
