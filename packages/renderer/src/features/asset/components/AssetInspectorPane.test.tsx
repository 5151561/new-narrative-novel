import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { I18nProvider } from '@/app/i18n'

import { AssetInspectorPane } from './AssetInspectorPane'

describe('AssetInspectorPane', () => {
  it('renders summary and consistency sections for the selected asset', () => {
    render(
      <I18nProvider>
        <AssetInspectorPane
          title="Ren Voss"
          inspector={{
            kindLabel: 'Character',
            summary: 'Courier-side negotiator who keeps the ledger closed while trying to buy time in public.',
            mentionCount: 3,
            relationCount: 3,
            warnings: ['Public witness pressure can flip Ren’s leverage into liability if the ledger slips open.'],
            notes: ['Keep Ren’s refusal legible before any exit bell cue lands.'],
            isOrphan: false,
            missingFields: [],
          }}
        />
      </I18nProvider>,
    )

    const summarySection = screen.getByRole('heading', { name: 'Summary' }).closest('section')
    const consistencySection = screen.getByRole('heading', { name: 'Consistency' }).closest('section')

    expect(summarySection).not.toBeNull()
    expect(consistencySection).not.toBeNull()
    expect(within(summarySection!).getByText('Ren Voss')).toBeInTheDocument()
    expect(within(summarySection!).getAllByText('Character').length).toBeGreaterThan(0)
    expect(within(consistencySection!).getByText('Public witness pressure can flip Ren’s leverage into liability if the ledger slips open.')).toBeInTheDocument()
  })
})
