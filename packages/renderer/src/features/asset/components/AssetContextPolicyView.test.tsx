import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { I18nProvider } from '@/app/i18n'
import type { AssetContextPolicyViewModel } from '../types/asset-view-models'

import { AssetContextPolicyView } from './AssetContextPolicyView'

const activePolicy: AssetContextPolicyViewModel = {
  hasContextPolicy: true,
  statusLabel: 'Active',
  summary: 'Ren may enter run context when he is in cast or explicitly linked to a proposal.',
  defaultVisibilityLabel: 'Character-known',
  defaultBudgetLabel: 'Selected facts',
  activationRules: [
    {
      id: 'ren-scene-cast',
      label: 'Cast member',
      summary: 'Include selected Ren facts when he is active in the scene cast.',
      reasonKindLabel: 'Scene cast',
      visibilityLabel: 'Character-known',
      budgetLabel: 'Selected facts',
      targetAgentLabels: ['Scene manager', 'Character agent', 'Prose agent'],
      priorityLabel: 'Primary POV context',
    },
    {
      id: 'ren-proposal-link',
      label: 'Proposal variant link',
      summary: 'Attach only the facts needed to evaluate a Ren-facing variant.',
      reasonKindLabel: 'Proposal variant',
      visibilityLabel: 'Private',
      budgetLabel: 'Summary only',
      targetAgentLabels: ['Scene manager', 'Continuity reviewer'],
      guardrailLabel: 'Do not expose private courier signal notes.',
    },
  ],
  exclusions: [
    {
      id: 'ren-private-signal',
      label: 'Courier signal private key',
      summary: 'Private decoding material stays outside shared scene context.',
    },
  ],
  warnings: ['Exact bell placement remains unresolved.'],
}

describe('AssetContextPolicyView', () => {
  it('renders summary, activation rules, visibility, budget, and target agents', () => {
    render(
      <I18nProvider>
        <AssetContextPolicyView policy={activePolicy} />
      </I18nProvider>,
    )

    const summary = screen.getByRole('heading', { name: 'Summary' }).closest('section')
    const rules = screen.getByRole('heading', { name: 'Activation Rules' }).closest('section')
    const visibility = screen.getByRole('heading', { name: 'Visibility & Budget' }).closest('section')

    expect(summary).not.toBeNull()
    expect(rules).not.toBeNull()
    expect(visibility).not.toBeNull()
    expect(within(summary!).getByText('Active')).toBeInTheDocument()
    expect(within(summary!).getByText('Character-known')).toBeInTheDocument()
    expect(within(summary!).getByText('Selected facts')).toBeInTheDocument()
    expect(within(rules!).getByText('Cast member')).toBeInTheDocument()
    expect(within(rules!).getByText('Scene cast')).toBeInTheDocument()
    expect(within(rules!).getByText('Scene manager, Character agent, Prose agent')).toBeInTheDocument()
    expect(within(rules!).getByText('Primary POV context')).toBeInTheDocument()
    expect(within(rules!).getByText('Do not expose private courier signal notes.')).toBeInTheDocument()
  })

  it('renders exclusions and warnings', () => {
    render(
      <I18nProvider>
        <AssetContextPolicyView policy={activePolicy} />
      </I18nProvider>,
    )

    const exclusions = screen.getByRole('heading', { name: 'Guardrails / Exclusions' }).closest('section')
    const warnings = screen.getByRole('heading', { name: 'Warnings' }).closest('section')

    expect(exclusions).not.toBeNull()
    expect(warnings).not.toBeNull()
    expect(within(exclusions!).getByText('Courier signal private key')).toBeInTheDocument()
    expect(within(exclusions!).getByText('Private decoding material stays outside shared scene context.')).toBeInTheDocument()
    expect(within(warnings!).getByText('Exact bell placement remains unresolved.')).toBeInTheDocument()
  })

  it('renders a quiet no-policy empty state', () => {
    render(
      <I18nProvider>
        <AssetContextPolicyView
          policy={{
            hasContextPolicy: false,
            statusLabel: 'Not configured',
            summary: 'This asset does not have a context policy yet.',
            defaultVisibilityLabel: 'None',
            defaultBudgetLabel: 'None',
            activationRules: [],
            exclusions: [],
            warnings: [],
          }}
        />
      </I18nProvider>,
    )

    expect(screen.getByText('No context policy yet')).toBeInTheDocument()
    expect(screen.getByText('This asset does not have a context policy yet.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Activation Rules' })).not.toBeInTheDocument()
  })
})
