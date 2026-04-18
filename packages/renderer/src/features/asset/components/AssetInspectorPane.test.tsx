import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { I18nProvider } from '@/app/i18n'

import { AssetInspectorPane } from './AssetInspectorPane'

describe('AssetInspectorPane', () => {
  it('renders summary and consistency sections for the selected asset', () => {
    const inspector = {
      kindLabel: 'Character',
      summary: 'Courier-side negotiator who keeps the ledger closed while trying to buy time in public.',
      mentionCount: 3,
      relationCount: 3,
      warnings: ['Public witness pressure can flip Ren’s leverage into liability if the ledger slips open.'],
      notes: ['Keep Ren’s refusal legible before any exit bell cue lands.'],
      isOrphan: false,
      missingFields: ['Implications'],
      canonBackedMentionCount: 1,
      draftContextMentionCount: 1,
      unlinkedMentionCount: 1,
    } as unknown as Parameters<typeof AssetInspectorPane>[0]['inspector']

    render(
      <I18nProvider>
        <AssetInspectorPane title="Ren Voss" inspector={inspector} />
      </I18nProvider>,
    )

    const summarySection = screen.getByRole('heading', { name: 'Summary' }).closest('section')
    const consistencySection = screen.getByRole('heading', { name: 'Consistency' }).closest('section')

    expect(summarySection).not.toBeNull()
    expect(consistencySection).not.toBeNull()
    expect(within(summarySection!).getByText('Ren Voss')).toBeInTheDocument()
    expect(within(summarySection!).getAllByText('Character').length).toBeGreaterThan(0)
    expect(within(consistencySection!).getByText('Public witness pressure can flip Ren’s leverage into liability if the ledger slips open.')).toBeInTheDocument()
    expect(within(consistencySection!).getByText('Canon-backed mentions')).toBeInTheDocument()
    expect(within(consistencySection!).getByText('Draft-context mentions')).toBeInTheDocument()
    expect(within(consistencySection!).getByText('Unlinked mentions')).toBeInTheDocument()
    expect(within(within(consistencySection!).getByText('Canon-backed mentions').closest('div')!).getByText('1')).toBeInTheDocument()
    expect(within(within(consistencySection!).getByText('Draft-context mentions').closest('div')!).getByText('1')).toBeInTheDocument()
    expect(within(within(consistencySection!).getByText('Unlinked mentions').closest('div')!).getByText('1')).toBeInTheDocument()
  })

  it('shows traceability unavailable state instead of pretending trace-derived counts are zero', () => {
    render(
      <I18nProvider>
        <AssetInspectorPane
          title="Ren Voss"
          inspector={{
            kindLabel: 'Character',
            summary: 'Courier-side negotiator who keeps the ledger closed while trying to buy time in public.',
            mentionCount: 3,
            relationCount: 3,
            warnings: [],
            notes: ['Keep Ren’s refusal legible before any exit bell cue lands.'],
            isOrphan: false,
            missingFields: ['Implications'],
            traceabilityStatus: {
              state: 'unavailable',
              title: 'Traceability unavailable',
              message: 'Scene traceability sources failed to load.',
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
  })
})
