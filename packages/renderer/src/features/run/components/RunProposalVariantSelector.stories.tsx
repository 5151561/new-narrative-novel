import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'

import type { ProposalVariantRecord } from '../api/run-artifact-records'

import { RunProposalVariantSelector } from './RunProposalVariantSelector'

const variants: ProposalVariantRecord[] = [
  {
    id: 'variant-midnight-platform-default',
    label: { en: 'Balanced arrival', 'zh-CN': '平衡入场' },
    summary: {
      en: 'Keep the arrival beat steady and let the reveal wait until the setting is established.',
      'zh-CN': '保持入场节拍稳定，等场景建立后再让揭示出现。',
    },
    rationale: {
      en: 'This keeps the accepted canon easy to trace without forcing a high-tension rewrite.',
      'zh-CN': '这能保持已接受 canon 易于追溯，同时不强行推高冲突。',
    },
    tradeoffLabel: { en: 'Slower reveal pressure', 'zh-CN': '揭示压力较慢' },
    riskLabel: { en: 'Low continuity risk', 'zh-CN': '低连续性风险' },
    relatedAssets: [
      {
        assetId: 'asset-scene-midnight-platform-lead',
        kind: 'character',
        label: { en: 'midnight platform lead', 'zh-CN': '午夜站台主角' },
      },
    ],
  },
  {
    id: 'variant-midnight-platform-raise-conflict',
    label: { en: 'Higher conflict', 'zh-CN': '提高冲突' },
    summary: {
      en: 'Let the lead confront the platform signal immediately and raise the scene pressure.',
      'zh-CN': '让主角立刻面对站台信号，抬高场景压力。',
    },
    rationale: {
      en: 'This gives review a sharper alternative while keeping the source proposal unchanged.',
      'zh-CN': '这为审阅提供更锐利的候选版本，同时保持源 proposal 不变。',
    },
    tradeoffLabel: { en: 'Sharper transition cost', 'zh-CN': '转场更陡' },
    riskLabel: { en: 'Medium assembly risk', 'zh-CN': '中等拼接风险' },
  },
]

const meta = {
  title: 'Business/Run/Proposal Variant Selector',
  component: RunProposalVariantSelector,
  parameters: {
    layout: 'centered',
  },
  render: (args) => {
    const [selectedVariantId, setSelectedVariantId] = useState(args.selectedVariantId ?? args.defaultVariantId ?? null)

    return (
      <div className="w-[680px] rounded-md border border-line-soft bg-surface-1 p-4">
        <RunProposalVariantSelector
          {...args}
          selectedVariantId={selectedVariantId}
          onSelectVariant={(_proposalId, variantId) => setSelectedVariantId(variantId)}
        />
      </div>
    )
  },
  args: {
    proposalId: 'proposal-set-scene-midnight-platform-run-001-proposal-001',
    variants,
    defaultVariantId: 'variant-midnight-platform-default',
  },
} satisfies Meta<typeof RunProposalVariantSelector>

export default meta

type Story = StoryObj<typeof meta>

export const QuietDefaultVariant: Story = {}

export const HighRiskVariant: Story = {
  args: {
    selectedVariantId: 'variant-midnight-platform-raise-conflict',
  },
}
