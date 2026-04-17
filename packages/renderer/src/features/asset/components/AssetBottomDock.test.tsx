import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { I18nProvider } from '@/app/i18n'
import type { AssetDockActivityItem, AssetDockSummaryViewModel } from '../types/asset-view-models'

import { AssetBottomDock } from './AssetBottomDock'

const summary: AssetDockSummaryViewModel = {
  problemItems: [
    {
      id: 'warning-0',
      label: 'Warning',
      detail: 'Public witness pressure can flip Ren’s leverage into liability if the ledger slips open.',
    },
    {
      id: 'missing-0',
      label: 'Missing profile section',
      detail: 'Implications',
    },
  ],
  warningCount: 1,
  missingFieldCount: 1,
  relationCount: 3,
  mentionCount: 3,
  isOrphan: false,
}

const activity: AssetDockActivityItem[] = [
  {
    id: 'view',
    kind: 'view',
    title: 'Switched to Mentions',
    detail: 'The dock records recent knowledge-workspace context without owning route state.',
    tone: 'accent',
  },
  {
    id: 'asset',
    kind: 'asset',
    title: 'Focused Ren Voss',
    detail: 'Courier-side negotiator who keeps the ledger closed while trying to buy time in public.',
    tone: 'neutral',
  },
]

describe('AssetBottomDock', () => {
  it('renders problems and activity content for the asset workspace', () => {
    render(
      <I18nProvider>
        <AssetBottomDock summary={summary} activity={activity} />
      </I18nProvider>,
    )

    const problemsSection = screen.getByRole('heading', { name: 'Problems' }).closest('section')
    const activitySection = screen.getByRole('heading', { name: 'Activity' }).closest('section')

    expect(problemsSection).not.toBeNull()
    expect(activitySection).not.toBeNull()
    expect(within(problemsSection!).getByText('Warning')).toBeInTheDocument()
    expect(within(problemsSection!).getByText('Missing profile section')).toBeInTheDocument()
    expect(within(activitySection!).getByText('Switched to Mentions')).toBeInTheDocument()
    expect(within(activitySection!).getByText('Focused Ren Voss')).toBeInTheDocument()
  })
})
