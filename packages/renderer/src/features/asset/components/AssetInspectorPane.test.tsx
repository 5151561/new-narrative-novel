import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { I18nProvider } from '@/app/i18n'

import { AssetInspectorPane } from './AssetInspectorPane'

describe('AssetInspectorPane', () => {
  it('renders summary and consistency sections for the selected asset', () => {
    const inspector = {
      kindLabel: 'Character',
      summary: 'Courier-side negotiator who keeps the ledger closed while trying to buy time in public.',
      visibilityLabel: 'Character-known',
      mentionCount: 3,
      relationCount: 3,
      canonFactCount: 2,
      privateFactCount: 1,
      timelineEntryCount: 2,
      warnings: ['Public witness pressure can flip Ren’s leverage into liability if the ledger slips open.'],
      notes: ['Keep Ren’s refusal legible before any exit bell cue lands.'],
      isOrphan: false,
      missingFields: ['Implications'],
      canonBackedMentionCount: 1,
      draftContextMentionCount: 1,
      unlinkedMentionCount: 1,
      contextPolicy: {
        hasContextPolicy: true,
        statusLabel: 'Active',
        defaultVisibilityLabel: 'Character-known',
        defaultBudgetLabel: 'Selected facts',
        activationRuleCount: 2,
        warningCount: 1,
      },
    } as unknown as Parameters<typeof AssetInspectorPane>[0]['inspector']

    render(
      <I18nProvider>
        <AssetInspectorPane title="Ren Voss" inspector={inspector} />
      </I18nProvider>,
    )

    const summarySection = screen.getByRole('heading', { name: 'Summary' }).closest('section')
    const consistencySection = screen.getByRole('heading', { name: 'Consistency' }).closest('section')
    const contextPolicySection = screen.getByRole('heading', { name: 'Context Policy' }).closest('section')

    expect(summarySection).not.toBeNull()
    expect(consistencySection).not.toBeNull()
    expect(within(summarySection!).getByText('Ren Voss')).toBeInTheDocument()
    expect(within(summarySection!).getAllByText('Character').length).toBeGreaterThan(0)
    expect(within(summarySection!).getByText('Character-known')).toBeInTheDocument()
    expect(within(consistencySection!).getByText('Public witness pressure can flip Ren’s leverage into liability if the ledger slips open.')).toBeInTheDocument()
    expect(within(consistencySection!).getByText('Canon-backed mentions')).toBeInTheDocument()
    expect(within(consistencySection!).getByText('Draft-context mentions')).toBeInTheDocument()
    expect(within(consistencySection!).getByText('Unlinked mentions')).toBeInTheDocument()
    expect(within(within(consistencySection!).getByText('Canon-backed mentions').closest('div')!).getByText('1')).toBeInTheDocument()
    expect(within(within(consistencySection!).getByText('Draft-context mentions').closest('div')!).getByText('1')).toBeInTheDocument()
    expect(within(within(consistencySection!).getByText('Unlinked mentions').closest('div')!).getByText('1')).toBeInTheDocument()
    expect(contextPolicySection).not.toBeNull()
    expect(within(contextPolicySection!).getByText('Active')).toBeInTheDocument()
    expect(within(contextPolicySection!).getByText('Character-known')).toBeInTheDocument()
    expect(within(contextPolicySection!).getByText('Selected facts')).toBeInTheDocument()
  })

  it('shows traceability unavailable state instead of pretending trace-derived counts are zero', () => {
    render(
      <I18nProvider>
        <AssetInspectorPane
          title="Ren Voss"
          inspector={{
            kindLabel: 'Character',
            summary: 'Courier-side negotiator who keeps the ledger closed while trying to buy time in public.',
            visibilityLabel: 'Character-known',
            mentionCount: 3,
            relationCount: 3,
            canonFactCount: 1,
            privateFactCount: 0,
            timelineEntryCount: 1,
            warnings: [],
            notes: ['Keep Ren’s refusal legible before any exit bell cue lands.'],
            isOrphan: false,
            missingFields: ['Implications'],
            traceabilityStatus: {
              state: 'unavailable',
              title: 'Traceability unavailable',
              message: 'Scene traceability sources failed to load.',
            },
            contextPolicy: {
              hasContextPolicy: false,
              statusLabel: 'Not configured',
              defaultVisibilityLabel: 'None',
              defaultBudgetLabel: 'None',
              activationRuleCount: 0,
              warningCount: 0,
            },
          }}
        />
      </I18nProvider>,
    )

    const consistencySection = screen.getByRole('heading', { name: 'Consistency' }).closest('section')

    expect(consistencySection).not.toBeNull()
    expect(within(consistencySection!).getByText('Traceability unavailable')).toBeInTheDocument()
    expect(within(consistencySection!).getByText('Scene traceability sources failed to load.')).toBeInTheDocument()
    expect(within(consistencySection!).queryByText('Canon-backed mentions')).not.toBeInTheDocument()
    expect(within(consistencySection!).queryByText('Draft-context mentions')).not.toBeInTheDocument()
    expect(within(consistencySection!).queryByText('Unlinked mentions')).not.toBeInTheDocument()
    expect(screen.getByText('No context policy yet')).toBeInTheDocument()
  })
})
