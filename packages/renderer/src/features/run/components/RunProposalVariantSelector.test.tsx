import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '@/app/i18n'

import type { ProposalVariantRecord } from '../api/run-artifact-records'

import { RunProposalVariantSelector } from './RunProposalVariantSelector'

const variants: ProposalVariantRecord[] = [
  {
    id: 'variant-balanced',
    label: { en: 'Balanced arrival', 'zh-CN': '平衡入场' },
    summary: { en: 'Keep the arrival beat steady.', 'zh-CN': '保持入场节拍稳定。' },
    rationale: { en: 'Keeps canon easy to trace.', 'zh-CN': '保持 canon 易于追溯。' },
    tradeoffLabel: { en: 'Slower reveal pressure', 'zh-CN': '揭示压力较慢' },
    riskLabel: { en: 'Low continuity risk', 'zh-CN': '低连续性风险' },
    relatedAssets: [
      {
        assetId: 'asset-lead',
        kind: 'character',
        label: { en: 'Platform lead', 'zh-CN': '站台主角' },
      },
    ],
  },
  {
    id: 'variant-conflict',
    label: { en: 'Higher conflict', 'zh-CN': '提高冲突' },
    summary: { en: 'Raise the scene pressure immediately.', 'zh-CN': '立刻抬高场景压力。' },
    rationale: { en: 'Gives review a sharper alternative.', 'zh-CN': '提供更锐利的候选版本。' },
    tradeoffLabel: { en: 'Sharper transition cost', 'zh-CN': '转场更陡' },
    riskLabel: { en: 'Medium assembly risk', 'zh-CN': '中等拼接风险' },
  },
]

afterEach(() => {
  window.localStorage.removeItem('narrative-novel.locale')
})

function renderSelector(overrides: Partial<React.ComponentProps<typeof RunProposalVariantSelector>> = {}) {
  const onSelectVariant = vi.fn()

  render(
    <I18nProvider>
      <RunProposalVariantSelector
        proposalId="proposal-1"
        variants={variants}
        defaultVariantId="variant-balanced"
        onSelectVariant={onSelectVariant}
        {...overrides}
      />
    </I18nProvider>,
  )

  return { onSelectVariant }
}

describe('RunProposalVariantSelector', () => {
  it('renders variant label, summary, rationale, risk, tradeoff, and related assets', () => {
    renderSelector()

    expect(screen.getByRole('radiogroup', { name: 'Proposal variants' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Balanced arrival/ })).toBeInTheDocument()
    expect(screen.getByText('Keep the arrival beat steady.')).toBeInTheDocument()
    expect(screen.getByText('Keeps canon easy to trace.')).toBeInTheDocument()
    expect(screen.getByText('Slower reveal pressure')).toBeInTheDocument()
    expect(screen.getByText('Low continuity risk')).toBeInTheDocument()
    expect(screen.getByText('Platform lead')).toBeInTheDocument()
  })

  it('marks selectedVariantId over the default variant', () => {
    renderSelector({ selectedVariantId: 'variant-conflict' })

    expect(screen.getByRole('radio', { name: /Higher conflict/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: /Balanced arrival/ })).not.toBeChecked()
  })

  it('uses defaultVariantId when selectedVariantId is not provided', () => {
    renderSelector()

    expect(screen.getByRole('radio', { name: /Balanced arrival/ })).toBeChecked()
  })

  it('calls onSelectVariant with proposal and variant ids when clicked', async () => {
    const user = userEvent.setup()
    const { onSelectVariant } = renderSelector()

    await user.click(screen.getByRole('radio', { name: /Higher conflict/ }))

    expect(onSelectVariant).toHaveBeenCalledWith('proposal-1', 'variant-conflict')
  })

  it('supports native radio keyboard selection', async () => {
    const user = userEvent.setup()
    const { onSelectVariant } = renderSelector()

    await user.tab()
    expect(screen.getByRole('radio', { name: /Balanced arrival/ })).toHaveFocus()

    await user.keyboard('{ArrowDown}')

    expect(onSelectVariant).toHaveBeenCalledWith('proposal-1', 'variant-conflict')
  })

  it('renders read-only variants as disabled radios when no selection handler exists', async () => {
    const user = userEvent.setup()
    renderSelector({ onSelectVariant: undefined })

    const balanced = screen.getByRole('radio', { name: /Balanced arrival/ })
    const conflict = screen.getByRole('radio', { name: /Higher conflict/ })

    expect(balanced).toBeDisabled()
    expect(conflict).toBeDisabled()

    await user.click(conflict)
    expect(conflict).not.toBeChecked()
    expect(balanced).toBeChecked()
  })

  it('uses a localized group label in zh-CN', () => {
    window.localStorage.setItem('narrative-novel.locale', 'zh-CN')
    renderSelector()

    expect(screen.getByRole('radiogroup', { name: '提案候选版本' })).toBeInTheDocument()
  })

  it('returns null when there are no variants', () => {
    const { container } = render(
      <I18nProvider>
        <RunProposalVariantSelector proposalId="proposal-1" variants={[]} />
      </I18nProvider>,
    )

    expect(container).toBeEmptyDOMElement()
  })
})
