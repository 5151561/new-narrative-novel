import type { Meta, StoryObj } from '@storybook/react'

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

const failedRun: RunRecord = {
  id: 'run-scene-midnight-platform-001',
  scope: 'scene',
  scopeId: 'scene-midnight-platform',
  status: 'failed',
  title: 'Midnight platform scene run',
  summary: 'Scene run failed while generating accepted prose after review.',
  startedAtLabel: '2026-04-21 10:00',
  latestEventId: 'run-event-002',
  eventCount: 2,
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

const failedRunEvents: RunEventRecord[] = [
  {
    id: 'run-event-002',
    runId: failedRun.id,
    order: 2,
    kind: 'run_failed',
    label: 'Run failed',
    summary: 'OpenAI provider request failed.',
    createdAtLabel: '2026-04-21 10:10',
    severity: 'error',
  },
]

const meta = {
  title: 'Mockups/Scene/ExecutionTab',
  component: SceneExecutionTab,
  decorators: [
    (Story) => (
      <I18nProvider>
        <div className="min-h-screen bg-app p-6">
          <Story />
        </div>
      </I18nProvider>
    ),
  ],
  args: {
    objective,
    beats,
    proposals,
    actorOptions: [{ id: 'scene-manager', label: 'Scene Manager' }],
    filters: { beatId: 'beat-bargain' },
    acceptedSummary,
    canContinueRun: false,
    canOpenProse: false,
    onContinueRun: () => {},
    onOpenSetup: () => {},
    onOpenPatchPreview: () => {},
    onOpenProse: () => {},
    onSelectBeat: () => {},
    onSelectProposal: () => {},
    onAccept: () => {},
    onEditAccept: () => {},
    onRequestRewrite: () => {},
    onReject: () => {},
    onChangeFilters: () => {},
    onClearFilters: () => {},
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof SceneExecutionTab>

export default meta

type Story = StoryObj<typeof meta>

export const RunStartGuard: Story = {
  args: {
    runSession: {
      run: null,
      events: [],
      pendingReviewId: null,
      isReviewPending: false,
      selectedVariantsForSubmit: [],
      isLoading: false,
      error: null,
      isStartingRun: false,
      isSubmittingDecision: false,
      onStartRun: () => {},
      onRetryRun: () => {},
      onSubmitDecision: async () => {},
    },
    runStartGuard: {
      ctaLabel: 'Model Settings',
      message: 'Planner or prose writer settings are incomplete for this real project.',
      onRepair: () => {},
    },
  },
}

export const FailedRunRetry: Story = {
  args: {
    runSession: {
      run: failedRun,
      events: failedRunEvents,
      pendingReviewId: null,
      isReviewPending: false,
      selectedVariantsForSubmit: [],
      isLoading: false,
      error: null,
      isStartingRun: false,
      isSubmittingDecision: false,
      onStartRun: () => {},
      onRetryRun: () => {},
      onSubmitDecision: async () => {},
    },
  },
}
