import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '@/app/i18n'

import type { RunContextAssetActivationRecord } from '../api/run-artifact-records'

import { RunContextAssetActivationList } from './RunContextAssetActivationList'

const activations: RunContextAssetActivationRecord[] = [
  {
    id: 'activation-ren-voss',
    assetId: 'asset-ren-voss',
    assetTitle: { en: 'Ren Voss', 'zh-CN': 'Ren Voss' },
    assetKind: 'character',
    decision: 'included',
    reasonKind: 'scene-cast',
    reasonLabel: { en: 'Cast member', 'zh-CN': '登场角色' },
    visibility: 'character-known',
    budget: 'selected-facts',
    targetAgents: ['scene-manager', 'character-agent', 'prose-agent'],
    sourceRefs: [{ kind: 'context-packet', id: 'ctx-001', label: 'Context packet source' }],
  },
  {
    id: 'activation-ledger',
    assetId: 'asset-ledger-stays-shut',
    assetTitle: { en: 'Ledger Stays Shut', 'zh-CN': 'Ledger Stays Shut' },
    assetKind: 'lore',
    decision: 'excluded',
    reasonKind: 'rule-dependency',
    reasonLabel: { en: 'Rule dependency', 'zh-CN': '规则依赖' },
    visibility: 'spoiler',
    budget: 'summary-only',
    targetAgents: ['continuity-reviewer'],
  },
  {
    id: 'activation-bell',
    assetId: 'asset-departure-bell-timing',
    assetTitle: { en: 'Departure Bell Timing', 'zh-CN': 'Departure Bell Timing' },
    assetKind: 'lore',
    decision: 'redacted',
    reasonKind: 'review-issue',
    reasonLabel: { en: 'Editor timing guardrail', 'zh-CN': '编辑时序护栏' },
    visibility: 'editor-only',
    budget: 'summary-only',
    targetAgents: ['continuity-reviewer'],
    note: { en: 'Exact editor-only timing remained redacted.', 'zh-CN': '精确编辑时序保持遮蔽。' },
  },
]

function renderActivationList(props: Partial<React.ComponentProps<typeof RunContextAssetActivationList>> = {}) {
  return render(
    <I18nProvider>
      <RunContextAssetActivationList activations={activations} {...props} />
    </I18nProvider>,
  )
}

describe('RunContextAssetActivationList', () => {
  it('renders activation summary and included, excluded, and redacted decision sections', () => {
    renderActivationList({
      summary: {
        includedAssetCount: 1,
        excludedAssetCount: 1,
        redactedAssetCount: 1,
        targetAgentCount: 4,
        warningCount: 1,
      },
    })

    expect(screen.getByRole('heading', { name: 'Activation Summary' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Included Assets' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Excluded Assets' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Redacted Assets' })).toBeInTheDocument()
    expect(screen.getByText('Ren Voss')).toBeInTheDocument()
    expect(screen.getByText('Ledger Stays Shut')).toBeInTheDocument()
    expect(screen.getByText('Departure Bell Timing')).toBeInTheDocument()
    expect(screen.getByText('included')).toBeInTheDocument()
    expect(screen.getByText('excluded')).toBeInTheDocument()
    expect(screen.getByText('redacted')).toBeInTheDocument()
  })

  it('renders reason, visibility, budget, target agents, source refs, and notes', () => {
    renderActivationList()

    const renCard = screen.getByText('Ren Voss').closest('article')
    expect(renCard).not.toBeNull()
    expect(within(renCard!).getAllByText('Cast member').length).toBeGreaterThan(0)
    expect(within(renCard!).getByText('Character-known')).toBeInTheDocument()
    expect(within(renCard!).getByText('Selected facts')).toBeInTheDocument()
    expect(within(renCard!).getByText('Scene manager, Character agent, Prose agent')).toBeInTheDocument()
    expect(within(renCard!).getByText('Context packet source')).toBeInTheDocument()

    expect(screen.getByText('Exact editor-only timing remained redacted.')).toBeInTheDocument()
  })

  it('opens an asset context from the row action', async () => {
    const user = userEvent.setup()
    const onOpenAssetContext = vi.fn()
    renderActivationList({ onOpenAssetContext })

    expect(screen.getByRole('button', { name: 'Open asset context for Ren Voss' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open asset context for Ledger Stays Shut' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open asset context for Departure Bell Timing' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Open asset context for Ren Voss' }))

    expect(onOpenAssetContext).toHaveBeenCalledWith('asset-ren-voss')
  })

  it('renders a low-noise empty state when activation data is absent', () => {
    render(
      <I18nProvider>
        <RunContextAssetActivationList activations={[]} />
      </I18nProvider>,
    )

    expect(screen.getByText('No context activation data')).toBeInTheDocument()
    expect(screen.getByText('This context packet has no asset-level activation decisions.')).toBeInTheDocument()
  })
})
