import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
    {
      id: 'mentions-without-canon-backing',
      label: 'Mentions without canon backing',
      detail: '2 mentions still rely on draft context or remain unlinked.',
    },
    {
      id: 'mentions-with-missing-scene-trace',
      label: 'Mentions with missing scene trace',
      detail: '1 mention is still missing stable scene trace metadata.',
    },
    {
      id: 'relations-without-narrative-backing',
      label: 'Relations present but no narrative backing',
      detail: '1 relation does not yet appear in the current narrative backing.',
    },
    {
      id: 'context-policy-caution',
      label: 'Private/spoiler policy requires caution',
      detail: 'At least one context policy path uses private or spoiler visibility and needs guardrails before run context.',
    },
  ],
  warningCount: 1,
  missingFieldCount: 1,
  relationCount: 3,
  mentionCount: 3,
  isOrphan: false,
  mentionsWithoutCanonBackingCount: 2,
  mentionsWithMissingSceneTraceCount: 1,
  relationsWithoutNarrativeBackingCount: 1,
  contextPolicy: {
    hasContextPolicy: true,
    statusLabel: 'Active',
    defaultVisibilityLabel: 'Character-known',
    defaultBudgetLabel: 'Selected facts',
    activationRuleCount: 2,
    warningCount: 1,
  },
} as AssetDockSummaryViewModel

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
  it('renders problems and activity content for the asset workspace', async () => {
    const user = userEvent.setup()

    render(
      <I18nProvider>
        <AssetBottomDock summary={summary} activity={activity} />
      </I18nProvider>,
    )

    expect(screen.getByTestId('workbench-bottom-dock-frame')).toBeInTheDocument()
    const problemsSection = screen.getByRole('heading', { name: 'Problems' }).closest('section')

    expect(problemsSection).not.toBeNull()
    expect(within(problemsSection!).getByText('Warning')).toBeInTheDocument()
    expect(within(problemsSection!).getByText('Missing profile section')).toBeInTheDocument()
    expect(within(problemsSection!).getByText('Mentions without canon backing')).toBeInTheDocument()
    expect(within(problemsSection!).getByText('Mentions with missing scene trace')).toBeInTheDocument()
    expect(within(problemsSection!).getByText('Relations present but no narrative backing')).toBeInTheDocument()
    expect(within(problemsSection!).getByText('Private/spoiler policy requires caution')).toBeInTheDocument()
    expect(within(problemsSection!).getByText('Context policy')).toBeInTheDocument()
    expect(within(problemsSection!).getByText('Policy rules')).toBeInTheDocument()
    expect(within(problemsSection!).getByText('Policy warnings')).toBeInTheDocument()
    expect(within(problemsSection!).getByText('Without canon backing')).toBeInTheDocument()
    expect(within(problemsSection!).getByText('Missing scene trace')).toBeInTheDocument()
    expect(within(problemsSection!).getByText('Narrative backing gaps')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: /Activity/i }))
    const activitySection = screen.getByRole('heading', { name: 'Activity' }).closest('section')

    expect(activitySection).not.toBeNull()
    expect(within(activitySection!).getByText('Switched to Mentions')).toBeInTheDocument()
    expect(within(activitySection!).getByText('Focused Ren Voss')).toBeInTheDocument()
  })

  it('keeps stable dock problems visible while showing trace loading state without fake trace counts', () => {
    render(
      <I18nProvider>
        <AssetBottomDock
          summary={{
            ...summary,
            problemItems: summary.problemItems.slice(0, 2),
            mentionsWithoutCanonBackingCount: undefined,
            mentionsWithMissingSceneTraceCount: undefined,
            relationsWithoutNarrativeBackingCount: undefined,
            traceabilityStatus: {
              state: 'loading',
              title: 'Loading traceability',
              message: 'Trace-derived dock judgments will appear once scene sources finish loading.',
            },
          }}
          activity={activity}
        />
      </I18nProvider>,
    )

    const problemsSection = screen.getByRole('heading', { name: 'Problems' }).closest('section')

    expect(problemsSection).not.toBeNull()
    expect(within(problemsSection!).getByText('Loading traceability')).toBeInTheDocument()
    expect(within(problemsSection!).getByText('Trace-derived dock judgments will appear once scene sources finish loading.')).toBeInTheDocument()
    expect(within(problemsSection!).getByText('Warning')).toBeInTheDocument()
    expect(within(problemsSection!).getByText('Missing profile section')).toBeInTheDocument()
    expect(within(problemsSection!).queryByText('Without canon backing')).not.toBeInTheDocument()
    expect(within(problemsSection!).queryByText('Missing scene trace')).not.toBeInTheDocument()
    expect(within(problemsSection!).queryByText('Narrative backing gaps')).not.toBeInTheDocument()
    expect(within(problemsSection!).queryByText('Mentions without canon backing')).not.toBeInTheDocument()
  })
})
