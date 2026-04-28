import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

import { I18nProvider } from '@/app/i18n'

import type { RunEventRecord, RunRecord } from '@/features/run/api/run-records'

import { SceneExecutionTab } from './SceneExecutionTab'
import type {
  BeatRailItemModel,
  ProposalCardModel,
  SceneAcceptedSummaryModel,
  SceneObjectiveModel,
} from '../types/scene-view-models'

const objective: SceneObjectiveModel = {
  goal: 'Keep the ledger closed while forcing Mei to show her leverage.',
  tensionLabel: 'Escalating',
  pacingLabel: 'Measured',
  cast: [
    { id: 'ren', name: 'Ren Voss', role: 'POV' },
    { id: 'mei', name: 'Mei Arden', role: 'Counterforce' },
  ],
  location: { id: 'platform', name: 'Rain-soaked platform' },
  warningsCount: 2,
  unresolvedCount: 3,
  constraintSummary: ['Ledger stays shut.', 'Alias stays private.'],
}

const beats: BeatRailItemModel[] = [
  {
    id: 'beat-bargain',
    index: 2,
    title: 'Bargain over the ledger',
    status: 'review',
    proposalCount: 2,
    warningCount: 1,
    summary: 'The bargaining beat is carrying the review load.',
  },
]

const proposals: ProposalCardModel[] = [
  {
    id: 'proposal-1',
    beatId: 'beat-bargain',
    actor: { id: 'scene-manager', name: 'Scene Manager', type: 'scene-manager' },
    kind: 'conflict',
    title: 'Force the bargain into a stalemate',
    summary: 'Ren refuses the first price and drags the courier into view as leverage.',
    status: 'pending',
    impactTags: ['stakes'],
    affects: [
      {
        path: 'scene.summary.conflict',
        label: 'Conflict temperature',
        deltaSummary: 'Escalates toward brinkmanship.',
      },
    ],
  },
]

const acceptedSummary: SceneAcceptedSummaryModel = {
  sceneSummary: 'Ren has accepted one leverage move but the bell beat is still pending.',
  acceptedFacts: [{ id: 'fact-1', label: 'Ledger', value: 'Still closed.' }],
  readiness: 'draftable',
  pendingProposalCount: 1,
  warningCount: 1,
  patchCandidateCount: 1,
}

const run: RunRecord = {
  id: 'run-scene-midnight-platform-001',
  scope: 'scene',
  scopeId: 'scene-midnight-platform',
  status: 'waiting_review',
  title: 'Midnight platform scene run',
  summary: 'Planner and writer output are ready for editorial review.',
  startedAtLabel: '2026-04-21 10:00',
  pendingReviewId: 'review-scene-midnight-platform-001',
  latestEventId: 'run-event-002',
  eventCount: 2,
}

const runEvents: RunEventRecord[] = [
  {
    id: 'run-event-001',
    runId: run.id,
    order: 1,
    kind: 'proposal_created',
    label: 'Proposal set created',
    summary: 'A proposal set is ready for editorial review.',
    createdAtLabel: '2026-04-21 10:08',
    severity: 'info',
    refs: [{ kind: 'proposal-set', id: 'proposal-set-scene-midnight-platform-001' }],
  },
  {
    id: 'run-event-002',
    runId: run.id,
    order: 2,
    kind: 'review_requested',
    label: 'Review requested',
    summary: 'Editorial review is waiting on the proposal set.',
    createdAtLabel: '2026-04-21 10:09',
    severity: 'warning',
    refs: [{ kind: 'review', id: run.pendingReviewId! }],
  },
]

describe('SceneExecutionTab', () => {
  it('keeps proposal review primary while surfacing run summary, timeline, and review gate affordances', () => {
    render(
      <I18nProvider>
        <SceneExecutionTab
          objective={objective}
          beats={beats}
          proposals={proposals}
          actorOptions={[{ id: 'scene-manager', label: 'Scene Manager' }]}
          filters={{ beatId: 'beat-bargain' }}
          acceptedSummary={acceptedSummary}
          runSession={{
            run,
            events: runEvents,
            pendingReviewId: run.pendingReviewId ?? null,
            isReviewPending: true,
            selectedVariantsForSubmit: [
              {
                proposalId: 'proposal-set-scene-midnight-platform-run-001-proposal-001',
                variantId: 'variant-midnight-platform-raise-conflict',
              },
            ],
            variantSelectionSummary: '1 proposal variant prepared as draft context for this Main Stage review decision.',
            isLoading: false,
            error: null,
            isStartingRun: false,
            isSubmittingDecision: false,
            onStartRun: vi.fn(),
            onSubmitDecision: vi.fn(async () => {}),
          }}
          canContinueRun
          canOpenProse
          onContinueRun={vi.fn()}
          onOpenPatchPreview={vi.fn()}
          onOpenProse={vi.fn()}
          onSelectBeat={vi.fn()}
          onSelectProposal={vi.fn()}
          onAccept={vi.fn()}
          onEditAccept={vi.fn()}
          onRequestRewrite={vi.fn()}
          onReject={vi.fn()}
          onChangeFilters={vi.fn()}
          onClearFilters={vi.fn()}
        />
      </I18nProvider>,
    )

    expect(screen.getByText('Directing Brief')).toBeInTheDocument()
    expect(screen.getByText('Review Cockpit')).toBeInTheDocument()
    expect(screen.getByText('Ready for Prose')).toBeInTheDocument()
    expect(screen.getAllByText('Midnight platform scene run').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Review requested').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Pending review').length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: 'Accept With Edit' }).length).toBeGreaterThan(0)
    expect(screen.getAllByText('1 proposal variant prepared as draft context for this Main Stage review decision.').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Variant choices still require this review decision and do not write canon on their own.').length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: 'Run Scene' })[0]).toHaveClass('bg-accent', 'text-white')
    expect(screen.getAllByRole('button', { name: 'Run Scene' })[0]).toBeDisabled()
    expect(screen.getAllByRole('button', { name: 'Rewrite Run' })[0]).toBeDisabled()
    expect(screen.getAllByRole('button', { name: 'Run From Scratch' })[0]).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Open Prose' })).not.toHaveClass('bg-accent', 'text-white')
    expect(screen.queryByText('run-scene-midnight-platform-001')).not.toBeInTheDocument()
    expect(screen.queryByText('review-scene-midnight-platform-001')).not.toBeInTheDocument()
  })

  it('routes the primary Run Scene CTA and secondary run controls through prepared run-session handlers on the non-review-pending path', async () => {
    const user = userEvent.setup()
    const onStartRun = vi.fn()
    const runnableRun: RunRecord = {
      ...run,
      status: 'running',
      pendingReviewId: undefined,
    }

    render(
      <I18nProvider>
        <SceneExecutionTab
          objective={objective}
          beats={beats}
          proposals={proposals}
          actorOptions={[{ id: 'scene-manager', label: 'Scene Manager' }]}
          filters={{ beatId: 'beat-bargain' }}
          acceptedSummary={acceptedSummary}
          runSession={{
            run: runnableRun,
            events: runEvents,
            pendingReviewId: null,
            isReviewPending: false,
            selectedVariantsForSubmit: [],
            isLoading: false,
            error: null,
            isStartingRun: false,
            isSubmittingDecision: false,
            onStartRun,
            onSubmitDecision: vi.fn(async () => {}),
          }}
          canContinueRun
          canOpenProse
          onContinueRun={vi.fn()}
          onOpenPatchPreview={vi.fn()}
          onOpenProse={vi.fn()}
          onSelectBeat={vi.fn()}
          onSelectProposal={vi.fn()}
          onAccept={vi.fn()}
          onEditAccept={vi.fn()}
          onRequestRewrite={vi.fn()}
          onReject={vi.fn()}
          onChangeFilters={vi.fn()}
          onClearFilters={vi.fn()}
        />
      </I18nProvider>,
    )

    expect(screen.queryByRole('button', { name: 'Continue Active Run' })).not.toBeInTheDocument()

    const runSceneButtons = screen.getAllByRole('button', { name: 'Run Scene' })
    await user.click(runSceneButtons[0]!)
    await user.click(screen.getAllByRole('button', { name: 'Rewrite Run' })[0]!)
    await user.click(screen.getAllByRole('button', { name: 'Run From Scratch' })[0]!)

    expect(onStartRun).toHaveBeenNthCalledWith(1, 'continue')
    expect(onStartRun).toHaveBeenNthCalledWith(2, 'rewrite')
    expect(onStartRun).toHaveBeenNthCalledWith(3, 'from-scratch')
  })

  it('replaces the happy-path run controls with a repair CTA when real-model settings are unusable', async () => {
    const user = userEvent.setup()
    const onRepair = vi.fn()

    render(
      <I18nProvider>
        <SceneExecutionTab
          objective={objective}
          beats={beats}
          proposals={proposals}
          actorOptions={[{ id: 'scene-manager', label: 'Scene Manager' }]}
          filters={{ beatId: 'beat-bargain' }}
          acceptedSummary={acceptedSummary}
          runSession={{
            run: null,
            events: [],
            pendingReviewId: null,
            isReviewPending: false,
            selectedVariantsForSubmit: [],
            isLoading: false,
            error: null,
            isStartingRun: false,
            isSubmittingDecision: false,
            onStartRun: vi.fn(),
            onRetryRun: vi.fn(),
            onSubmitDecision: vi.fn(async () => {}),
          }}
          runStartGuard={{
            ctaLabel: 'Model Settings',
            message: 'Planner or prose writer settings are incomplete for this real project.',
            onRepair,
          }}
          canContinueRun={false}
          canOpenProse={false}
          onContinueRun={vi.fn()}
          onOpenPatchPreview={vi.fn()}
          onOpenProse={vi.fn()}
          onSelectBeat={vi.fn()}
          onSelectProposal={vi.fn()}
          onAccept={vi.fn()}
          onEditAccept={vi.fn()}
          onRequestRewrite={vi.fn()}
          onReject={vi.fn()}
          onChangeFilters={vi.fn()}
          onClearFilters={vi.fn()}
        />
      </I18nProvider>,
    )

    expect(screen.getAllByText('Planner or prose writer settings are incomplete for this real project.').length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: 'Run Scene' })).not.toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'Model Settings' })[0]!)
    expect(onRepair).toHaveBeenCalledTimes(1)
  })

  it('keeps pre-run start failures visible even when no active run record exists yet', async () => {
    const user = userEvent.setup()
    const onOpenSetup = vi.fn()

    render(
      <I18nProvider>
        <SceneExecutionTab
          objective={objective}
          beats={beats}
          proposals={proposals}
          actorOptions={[{ id: 'scene-manager', label: 'Scene Manager' }]}
          filters={{ beatId: 'beat-bargain' }}
          acceptedSummary={acceptedSummary}
          runSession={{
            run: null,
            events: [],
            pendingReviewId: null,
            isReviewPending: false,
            selectedVariantsForSubmit: [],
            isLoading: false,
            error: new Error('Selected real-model planner binding is missing required OpenAI settings.'),
            isStartingRun: false,
            isSubmittingDecision: false,
            onStartRun: vi.fn(),
            onRetryRun: vi.fn(),
            onSubmitDecision: vi.fn(async () => {}),
          }}
          canContinueRun={false}
          canOpenProse={false}
          onContinueRun={vi.fn()}
          onOpenSetup={onOpenSetup}
          onOpenPatchPreview={vi.fn()}
          onOpenProse={vi.fn()}
          onSelectBeat={vi.fn()}
          onSelectProposal={vi.fn()}
          onAccept={vi.fn()}
          onEditAccept={vi.fn()}
          onRequestRewrite={vi.fn()}
          onReject={vi.fn()}
          onChangeFilters={vi.fn()}
          onClearFilters={vi.fn()}
        />
      </I18nProvider>,
    )

    expect(screen.getAllByText('Run start failed').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Selected real-model planner binding is missing required OpenAI settings.').length).toBeGreaterThan(0)
    await user.click(screen.getAllByRole('button', { name: 'Model Settings' })[0]!)
    expect(onOpenSetup).toHaveBeenCalledTimes(1)
  })

  it('submits waiting-review decisions from the Main Stage with prepared proposal variants', async () => {
    const user = userEvent.setup()
    const onSubmitDecision = vi.fn(async () => {})
    const selectedVariantsForSubmit = [
      {
        proposalId: 'proposal-set-scene-midnight-platform-run-001-proposal-001',
        variantId: 'variant-midnight-platform-raise-conflict',
      },
    ]

    render(
      <I18nProvider>
        <SceneExecutionTab
          objective={objective}
          beats={beats}
          proposals={proposals}
          actorOptions={[{ id: 'scene-manager', label: 'Scene Manager' }]}
          filters={{ beatId: 'beat-bargain' }}
          acceptedSummary={acceptedSummary}
          runSession={{
            run,
            events: runEvents,
            pendingReviewId: run.pendingReviewId ?? null,
            isReviewPending: true,
            selectedVariantsForSubmit,
            variantSelectionSummary: '1 proposal variant prepared as draft context for this Main Stage review decision.',
            isLoading: false,
            error: null,
            isStartingRun: false,
            isSubmittingDecision: false,
            onStartRun: vi.fn(),
            onSubmitDecision,
          }}
          canContinueRun
          canOpenProse
          onContinueRun={vi.fn()}
          onOpenPatchPreview={vi.fn()}
          onOpenProse={vi.fn()}
          onSelectBeat={vi.fn()}
          onSelectProposal={vi.fn()}
          onAccept={vi.fn()}
          onEditAccept={vi.fn()}
          onRequestRewrite={vi.fn()}
          onReject={vi.fn()}
          onChangeFilters={vi.fn()}
          onClearFilters={vi.fn()}
        />
      </I18nProvider>,
    )

    const reviewGate = screen.getAllByRole('heading', { name: 'Midnight platform scene run' }).at(-1)?.closest('section')
    expect(reviewGate).not.toBeNull()
    await user.click(within(reviewGate!).getByRole('button', { name: 'Accept' }))

    expect(onSubmitDecision).toHaveBeenCalledWith({
      decision: 'accept',
      selectedVariants: selectedVariantsForSubmit,
    })
  })

  it('surfaces rewrite-requested runs as closed and requiring an explicit new run from the Main Stage', () => {
    const rewriteRequestedRun: RunRecord = {
      ...run,
      status: 'completed',
      summary: 'Rewrite requested. Start a new run to continue.',
      pendingReviewId: undefined,
      completedAtLabel: '2026-04-21 10:10',
      latestEventId: 'run-event-003',
      eventCount: 3,
    }
    const rewriteRequestedEvents: RunEventRecord[] = [
      ...runEvents,
      {
        id: 'run-event-003',
        runId: run.id,
        order: 3,
        kind: 'review_decision_submitted',
        label: 'Review decision submitted',
        summary: 'Rewrite requested. Start a new run to continue.',
        createdAtLabel: '2026-04-21 10:10',
        severity: 'warning',
        refs: [{ kind: 'review', id: 'review-scene-midnight-platform-001' }],
      },
    ]

    render(
      <I18nProvider>
        <SceneExecutionTab
          objective={objective}
          beats={beats}
          proposals={proposals}
          actorOptions={[{ id: 'scene-manager', label: 'Scene Manager' }]}
          filters={{ beatId: 'beat-bargain' }}
          acceptedSummary={acceptedSummary}
          runSession={{
            run: rewriteRequestedRun,
            events: rewriteRequestedEvents,
            pendingReviewId: null,
            isReviewPending: false,
            selectedVariantsForSubmit: [],
            isLoading: false,
            error: null,
            isStartingRun: false,
            isSubmittingDecision: false,
            onStartRun: vi.fn(),
            onSubmitDecision: vi.fn(async () => {}),
          }}
          canContinueRun={false}
          canOpenProse={false}
          onContinueRun={vi.fn()}
          onOpenPatchPreview={vi.fn()}
          onOpenProse={vi.fn()}
          onSelectBeat={vi.fn()}
          onSelectProposal={vi.fn()}
          onAccept={vi.fn()}
          onEditAccept={vi.fn()}
          onRequestRewrite={vi.fn()}
          onReject={vi.fn()}
          onChangeFilters={vi.fn()}
          onClearFilters={vi.fn()}
        />
      </I18nProvider>,
    )

    expect(screen.getAllByText('Rewrite requested. Start a new run to continue.').length).toBeGreaterThan(0)
    expect(screen.getAllByText('This run is closed. Start a new run explicitly to continue from the rewrite brief.').length).toBeGreaterThan(0)
    expect(screen.queryByText('Pending review')).not.toBeInTheDocument()
    expect(screen.queryByText('Run Review Gate')).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Run Scene' })[0]).toBeEnabled()
    expect(screen.getAllByRole('button', { name: 'Rewrite Run' })[0]).toBeEnabled()
    expect(screen.getAllByRole('button', { name: 'Run From Scratch' })[0]).toBeEnabled()
  })

  it('surfaces failed real-model runs as retry-first instead of looking like fixture success', async () => {
    const user = userEvent.setup()
    const onRetryRun = vi.fn()
    const failedRun: RunRecord = {
      ...run,
      status: 'failed',
      summary: 'Scene run failed before review because the planner model request failed.',
      pendingReviewId: undefined,
      failureClass: 'provider_error',
      failureMessage: 'OpenAI provider request failed.',
      runtimeSummary: {
        health: 'failed',
        tokenLabel: '0 tokens',
        costLabel: '$0.0000 est.',
        failureClassLabel: 'Provider error',
        nextActionLabel: 'Repair model settings or retry the run after the runtime issue is resolved.',
      },
    }

    render(
      <I18nProvider>
        <SceneExecutionTab
          objective={objective}
          beats={beats}
          proposals={proposals}
          actorOptions={[{ id: 'scene-manager', label: 'Scene Manager' }]}
          filters={{ beatId: 'beat-bargain' }}
          acceptedSummary={acceptedSummary}
          runSession={{
            run: failedRun,
            events: [],
            pendingReviewId: null,
            isReviewPending: false,
            selectedVariantsForSubmit: [],
            isLoading: false,
            error: null,
            isStartingRun: false,
            isSubmittingDecision: false,
            onStartRun: vi.fn(),
            onRetryRun,
            onSubmitDecision: vi.fn(async () => {}),
          }}
          canContinueRun={false}
          canOpenProse={false}
          onContinueRun={vi.fn()}
          onOpenPatchPreview={vi.fn()}
          onOpenProse={vi.fn()}
          onSelectBeat={vi.fn()}
          onSelectProposal={vi.fn()}
          onAccept={vi.fn()}
          onEditAccept={vi.fn()}
          onRequestRewrite={vi.fn()}
          onReject={vi.fn()}
          onChangeFilters={vi.fn()}
          onClearFilters={vi.fn()}
        />
      </I18nProvider>,
    )

    expect(screen.getAllByText('Scene run failed before review because the planner model request failed.').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Repair model settings or retry the run after the runtime issue is resolved.').length).toBeGreaterThan(0)
    await user.click(screen.getAllByRole('button', { name: 'Retry Run' })[0]!)
    expect(onRetryRun).toHaveBeenCalledTimes(1)
  })
})
