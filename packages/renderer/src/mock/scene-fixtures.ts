import type { Locale } from '@/app/i18n'
import { getSceneFixtureCopy, localizeSceneMockDatabase } from './scene-fixtures.locale'
import type {
  ProposalActionInput,
  ProposalCardModel,
  ProposalStatus,
  SceneDockTabId,
  SceneDockViewModel,
  SceneExecutionViewModel,
  SceneInspectorViewModel,
  ScenePatchPreviewViewModel,
  SceneProseViewModel,
  SceneSetupViewModel,
  SceneWorkspaceViewModel,
} from '@/features/scene/types/scene-view-models'

interface SceneRecord {
  workspace: SceneWorkspaceViewModel
  setup: SceneSetupViewModel
  execution: SceneExecutionViewModel
  prose: SceneProseViewModel
  inspector: SceneInspectorViewModel
  dock: SceneDockViewModel
}

export interface SceneMockDatabase {
  locale?: Locale
  scenes: Record<string, SceneRecord>
}

const midnightPlatform: SceneRecord = {
  workspace: {
    id: 'scene-midnight-platform',
    title: 'Midnight Platform',
    chapterId: 'chapter-signals-in-rain',
    chapterTitle: 'Signals in Rain',
    status: 'review',
    runStatus: 'paused',
    objective: 'Force Ren to bargain for the ledger before the train departs.',
    castIds: ['ren', 'mei', 'conductor'],
    locationId: 'glass-platform',
    latestRunId: 'run-07',
    pendingProposalCount: 3,
    warningCount: 2,
    currentVersionLabel: 'Run 07',
    activeThreadId: 'thread-main',
    availableThreads: [
      { id: 'thread-main', label: 'Mainline' },
      { id: 'thread-branch-a', label: 'Alt Beat' },
    ],
  },
  setup: {
    sceneId: 'scene-midnight-platform',
    identity: {
      title: 'Midnight Platform',
      chapterLabel: 'Signals in Rain / Scene 4',
      locationLabel: 'Rain-soaked eastbound platform',
      povCharacterId: 'ren',
      timeboxLabel: '03:11-03:18',
      summary: 'A wet, public bargain where every concession must survive witness scrutiny.',
    },
    objective: {
      externalGoal: 'Force Mei to hand over the ledger before the eastbound train departs.',
      emotionalGoal: 'Keep Ren composed long enough to hide how badly he needs the ledger.',
      successSignal: 'Mei yields leverage without the ledger being opened onstage.',
      failureCost: 'Ren loses the ledger and exposes his alias in front of the conductor.',
    },
    cast: [
      { id: 'ren', name: 'Ren Voss', role: 'POV', agenda: 'Keep leverage without showing panic.', selected: true },
      { id: 'mei', name: 'Mei Arden', role: 'Counterforce', agenda: 'Set a price that binds Ren later.', selected: true },
      { id: 'conductor', name: 'Station Conductor', role: 'Witness', agenda: 'Notice enough to matter later.', selected: true },
      { id: 'courier', name: 'Missing Courier', role: 'Offstage pressure', agenda: 'Stay implied, never appear.', selected: false },
    ],
    constraints: [
      { id: 'constraint-1', label: 'Ledger stays shut', kind: 'canon', summary: 'No one opens or reads the ledger during the scene.' },
      { id: 'constraint-2', label: 'Alias remains private', kind: 'tone', summary: 'Ren cannot publicly admit the dockside alias.' },
      { id: 'constraint-3', label: 'Bell timing fixed', kind: 'timing', summary: 'Departure bell lands at the exit beat, not earlier.' },
    ],
    knowledgeBoundaries: [
      {
        id: 'boundary-1',
        label: 'Ledger contents',
        summary: 'Readers know the ledger matters, not what is written inside.',
        status: 'guarded',
      },
      {
        id: 'boundary-2',
        label: 'Harbor fire culprit',
        summary: 'Past guilt can be implied but the culprit remains unresolved.',
        status: 'open-question',
      },
      {
        id: 'boundary-3',
        label: 'Courier signal meaning',
        summary: 'Ren can read the signal; the witness cannot.',
        status: 'known',
      },
    ],
    runtimePreset: {
      selectedPresetId: 'runtime-measured-pressure',
      presetOptions: [
        {
          id: 'runtime-measured-pressure',
          label: 'Measured Pressure',
          focus: 'Controlled escalation',
          intensity: 'Medium',
          summary: 'Keep the scene deliberate so each acceptance survives canon review.',
        },
        {
          id: 'runtime-pressure-cooker',
          label: 'Pressure Cooker',
          focus: 'Tighter beat turns',
          intensity: 'High',
          summary: 'Compress beats and push harder against the departure bell constraint.',
        },
        {
          id: 'runtime-witness-heavy',
          label: 'Witness Heavy',
          focus: 'Public scrutiny',
          intensity: 'Medium',
          summary: 'Bias toward observable actions and reduce private exposition.',
        },
      ],
    },
  },
  execution: {
    runId: 'run-07',
    objective: {
      goal: 'Corner Mei into revealing whether the ledger is bait or leverage.',
      tensionLabel: 'Escalating',
      pacingLabel: 'Measured',
      cast: [
        { id: 'ren', name: 'Ren Voss', role: 'POV' },
        { id: 'mei', name: 'Mei Arden', role: 'Counterforce' },
        { id: 'conductor', name: 'Station Conductor', role: 'Witness' },
      ],
      location: { id: 'glass-platform', name: 'Rain-soaked eastbound platform' },
      warningsCount: 2,
      unresolvedCount: 3,
      constraintSummary: [
        'Keep the ledger unopened onstage.',
        'No public reveal of Ren’s alias.',
        'Exit beat must align with train departure bell.',
      ],
    },
    beats: [
      {
        id: 'beat-arrival',
        index: 1,
        title: 'Arrival under the station lamps',
        status: 'accepted',
        proposalCount: 1,
        warningCount: 0,
        summary: 'Ren closes distance and spots the hidden courier signal.',
      },
      {
        id: 'beat-bargain',
        index: 2,
        title: 'Bargain over the ledger',
        status: 'review',
        proposalCount: 2,
        warningCount: 1,
        summary: 'Mei offers terms while testing Ren’s patience.',
      },
      {
        id: 'beat-departure',
        index: 3,
        title: 'Departure bell',
        status: 'todo',
        proposalCount: 1,
        warningCount: 1,
        summary: 'The platform compresses into a final choice.',
      },
    ],
    proposals: [
      {
        id: 'proposal-1',
        beatId: 'beat-bargain',
        actor: { id: 'scene-manager', name: 'Scene Manager', type: 'scene-manager' },
        kind: 'conflict',
        title: 'Force the bargain into a visible stalemate',
        summary: 'Ren refuses Mei’s first price and exposes the missing courier as leverage.',
        detail: 'This keeps the ledger closed while sharpening the power shift before the bell.',
        status: 'pending',
        impactTags: ['stakes', 'power-shift'],
        affects: [
          {
            path: 'scene.summary.conflict',
            label: 'Conflict temperature',
            deltaSummary: 'Escalates from negotiation to brinkmanship.',
          },
        ],
        risks: [{ severity: 'warn', message: 'May crowd the conductor’s witness beat.' }],
        evidencePeek: ['Beat 2 already seeded Ren’s suspicion.', 'Preserves no-open-ledger rule.'],
        sourceTraceId: 'trace-41',
      },
      {
        id: 'proposal-2',
        beatId: 'beat-bargain',
        actor: { id: 'mei', name: 'Mei Arden', type: 'character' },
        kind: 'dialogue',
        title: 'Let Mei name the cost in private terms',
        summary: 'Mei asks for Ren’s silence about the harbor fire in exchange for the ledger.',
        status: 'pending',
        impactTags: ['subtext', 'history'],
        affects: [
          {
            path: 'scene.accepted-facts.harbor-fire',
            label: 'Harbor fire tie-in',
            deltaSummary: 'Pulls an older secret into this scene without revealing the culprit.',
          },
        ],
        risks: [{ severity: 'info', message: 'Need to avoid over-explaining the shared history.' }],
        evidencePeek: ['Extends chapter-level guilt thread.'],
        sourceTraceId: 'trace-42',
      },
      {
        id: 'proposal-3',
        beatId: 'beat-departure',
        actor: { id: 'system', name: 'Consistency Watch', type: 'system' },
        kind: 'state-change',
        title: 'Hold the train bell until Ren commits to a choice',
        summary: 'Delay the departure bell by one exchange so the decision lands on an explicit action.',
        status: 'rewrite-requested',
        impactTags: ['timing', 'continuity'],
        affects: [
          {
            path: 'chapter.timeline.departure-bell',
            label: 'Departure timing',
            deltaSummary: 'Shifts the bell cue later than the chapter outline currently allows.',
          },
        ],
        risks: [{ severity: 'high', message: 'Conflicts with chapter timing checkpoint.' }],
        evidencePeek: ['Chapter outline marks the bell immediately after Mei’s final offer.'],
        sourceTraceId: 'trace-43',
      },
    ],
    acceptedSummary: {
      sceneSummary:
        'Accepted beats establish the rain-heavy platform, Ren’s leverage, and a pending bargain that still needs one canon-ready turn.',
      acceptedFacts: [
        { id: 'fact-1', label: 'Courier signal spotted', value: 'Ren catches the station-lamp pattern.' },
        { id: 'fact-2', label: 'Ledger remains shut', value: 'No character opens or reads the ledger.' },
      ],
      readiness: 'draftable',
      pendingProposalCount: 3,
      warningCount: 2,
      patchCandidateCount: 1,
    },
    runtimeSummary: {
      runHealth: 'attention',
      latencyLabel: '1.6s avg step',
      tokenLabel: '8.2k tokens',
      costLabel: '$0.19 est.',
      latestFailureSummary: 'One continuity warning remains unresolved for the departure beat.',
    },
    consistencySummary: {
      warningsCount: 2,
      topIssues: ['Departure bell timing mismatch', 'Witness beat could be crowded by extra dialogue'],
    },
    canContinueRun: true,
    canOpenProse: true,
  },
  prose: {
    sceneId: 'scene-midnight-platform',
    proseDraft:
      'Rain struck the glass roof in soft volleys while Ren let Mei name a price she had no right to set. The ledger stayed between them like a shut eye, watching both of them refuse to blink first.',
    revisionModes: ['rewrite', 'compress', 'expand', 'tone_adjust', 'continuity_fix'],
    latestDiffSummary: 'No prose revision requested yet.',
    warningsCount: 1,
    focusModeAvailable: true,
    revisionQueueCount: 0,
    draftWordCount: 35,
    statusLabel: 'Ready for revision pass',
  },
  inspector: {
    context: {
      acceptedFacts: [
        { id: 'fact-1', label: 'Courier signal spotted', value: 'Ren catches the station-lamp pattern.' },
        { id: 'fact-2', label: 'Ledger remains shut', value: 'No character opens or reads the ledger.' },
      ],
      privateInfoGuard: {
        summary: 'Keep the ledger contents, Ren’s alias, and the harbor-fire culprit guarded while review decides what becomes public.',
        items: [
          {
            id: 'guard-ledger',
            label: 'Ledger contents',
            summary: 'Readers and cast know the ledger matters, but no one sees what is written inside.',
            status: 'guarded',
          },
          {
            id: 'guard-harbor-fire',
            label: 'Harbor fire culprit',
            summary: 'The scene can pressure that history without resolving who caused the fire.',
            status: 'watching',
          },
        ],
      },
      actorKnowledgeBoundaries: [
        {
          actor: { id: 'ren', name: 'Ren Voss', role: 'POV' },
          boundaries: [
            {
              id: 'boundary-1',
              label: 'Ledger contents',
              summary: 'Ren knows the ledger is leverage, not what Mei has changed inside it.',
              status: 'guarded',
            },
            {
              id: 'boundary-2',
              label: 'Harbor fire culprit',
              summary: 'Ren can carry guilt around the fire without confirming who caused it.',
              status: 'open-question',
            },
            {
              id: 'boundary-3',
              label: 'Courier signal meaning',
              summary: 'Ren can interpret the station-lamp signal without explaining it aloud.',
              status: 'known',
            },
          ],
        },
        {
          actor: { id: 'mei', name: 'Mei Arden', role: 'Counterforce' },
          boundaries: [
            {
              id: 'boundary-1-mei',
              label: 'Ledger contents',
              summary: 'Mei can imply what the ledger costs without exposing the text inside it.',
              status: 'guarded',
            },
            {
              id: 'boundary-2-mei',
              label: 'Harbor fire culprit',
              summary: 'Mei can weaponize the history while the culprit remains unresolved.',
              status: 'open-question',
            },
            {
              id: 'boundary-3-mei',
              label: 'Courier signal meaning',
              summary: 'Mei sees Ren react to the signal, but does not decode the pattern onstage.',
              status: 'guarded',
            },
          ],
        },
        {
          actor: { id: 'conductor', name: 'Station Conductor', role: 'Witness' },
          boundaries: [
            {
              id: 'boundary-1-conductor',
              label: 'Ledger contents',
              summary: 'The conductor clocks the ledger’s importance without ever learning its contents.',
              status: 'guarded',
            },
            {
              id: 'boundary-2-conductor',
              label: 'Harbor fire culprit',
              summary: 'The conductor notices tension around the fire but never hears a culprit named.',
              status: 'open-question',
            },
            {
              id: 'boundary-3-conductor',
              label: 'Courier signal meaning',
              summary: 'The conductor sees the lamp pattern but never decodes what it means.',
              status: 'guarded',
            },
          ],
        },
      ],
      localState: [
        { id: 'state-1', label: 'Active beat', value: 'Bargain over the ledger' },
        { id: 'state-2', label: 'Selected runtime preset', value: 'Measured Pressure' },
        { id: 'state-3', label: 'Accepted patch candidates', value: '1 semantic candidate' },
      ],
      overrides: [
        {
          id: 'override-1',
          label: 'Witness emphasis',
          summary: 'Keep observer visibility high so accepted facts remain public-facing.',
          status: 'active',
        },
        {
          id: 'override-2',
          label: 'Departure bell guardrail',
          summary: 'Do not advance the bell before the final decision beat.',
          status: 'watching',
        },
      ],
    },
    versions: {
      checkpoints: [
        {
          id: 'checkpoint-1',
          label: 'Run 07 / Beat 1 accepted',
          summary: 'Arrival beat cleared with no further changes required.',
          status: 'accepted',
        },
        {
          id: 'checkpoint-2',
          label: 'Run 07 / Beat 2 under review',
          summary: 'Bargain beat still carries two pending proposals.',
          status: 'review',
        },
      ],
      acceptanceTimeline: [
        {
          id: 'timeline-1',
          title: 'Arrival cue accepted',
          detail: 'Courier signal remains canon-safe and visible to Ren only.',
          meta: 'Accepted',
          tone: 'success',
        },
        {
          id: 'timeline-2',
          title: 'Departure timing flagged',
          detail: 'One proposed bell shift conflicts with chapter timing.',
          meta: 'Watch',
          tone: 'warn',
        },
      ],
      patchCandidates: [
        {
          id: 'patch-1',
          label: 'Visible stalemate summary',
          summary: 'Semantic patch ready if the bargain stalemate is accepted into canon.',
          status: 'ready_for_commit',
        },
        {
          id: 'patch-2',
          label: 'Departure bell delay',
          summary: 'Still blocked by timing review; not commit-ready.',
          status: 'needs_review',
        },
      ],
    },
    runtime: {
      profile: {
        label: 'Measured Pressure',
        summary: 'Moderate turn speed with high continuity scrutiny and witness-safe staging.',
      },
      runHealth: 'attention',
      metrics: {
        latencyLabel: '1.6s avg step',
        tokenLabel: '8.2k tokens',
        costLabel: '$0.19 est.',
      },
      latestFailure: 'Departure bell timing warning still blocks a clean finish.',
    },
  },
  dock: {
    events: [
      {
        id: 'event-1',
        title: 'Run paused at bargain beat',
        detail: 'Execution review is holding on two pending proposals and one rewrite request.',
        meta: 'Events',
        tone: 'accent',
      },
      {
        id: 'event-2',
        title: 'Accepted state updated without commit',
        detail: 'One semantic candidate is ready for later patch flow, but commit stays separate.',
        meta: 'Patch',
        tone: 'warn',
      },
    ],
    trace: [
      {
        id: 'trace-1',
        title: 'Trace 41 / leverage escalation',
        detail: 'Conflict proposal cites accepted suspicion seed and the no-open-ledger rule.',
        meta: 'Trace',
        tone: 'neutral',
      },
      {
        id: 'trace-2',
        title: 'Trace 43 / timing collision',
        detail: 'Bell-delay candidate conflicts with chapter timeline checkpoint.',
        meta: 'Trace',
        tone: 'warn',
      },
    ],
    consistency: {
      summary: 'Two review checks still need attention before prose can be treated as stable.',
      checks: [
        {
          id: 'consistency-1',
          label: 'Departure bell timing',
          status: 'blocked',
          detail: 'Current rewrite request still pushes the bell later than outline canon allows.',
        },
        {
          id: 'consistency-2',
          label: 'Witness visibility',
          status: 'warn',
          detail: 'Extra dialogue risks obscuring what the conductor actually notices.',
        },
        {
          id: 'consistency-3',
          label: 'Ledger containment',
          status: 'pass',
          detail: 'All accepted candidates preserve the closed-ledger rule.',
        },
      ],
    },
    problems: {
      summary: 'Problems stay summarized here so the stage remains focused on scene work.',
      items: [
        {
          id: 'problem-1',
          title: 'Departure bell conflicts with chapter outline',
          severity: 'high',
          recommendation: 'Keep the bell at the exit cue and resolve the choice in one tighter exchange.',
        },
        {
          id: 'problem-2',
          title: 'Witness beat may be crowded',
          severity: 'warn',
          recommendation: 'Trim one explanation pass so the conductor remains legible as observer.',
        },
      ],
    },
    cost: {
      currentWindowLabel: '$0.19 estimated for Run 07',
      trendLabel: 'Down 8% from prior branch because proposals stayed structured.',
      breakdown: [
        { id: 'cost-1', label: 'Prompt tokens', value: '5.1k' },
        { id: 'cost-2', label: 'Completion tokens', value: '3.1k' },
        { id: 'cost-3', label: 'Continuity passes', value: '2 checks' },
      ],
    },
  },
}

const warehouseBridge: SceneRecord = {
  workspace: {
    id: 'scene-warehouse-bridge',
    title: 'Warehouse Bridge',
    chapterId: 'chapter-open-water-signals',
    chapterTitle: 'Open Water Signals',
    status: 'draft',
    runStatus: 'idle',
    objective: 'Stage the first handoff without committing to a final betrayal beat.',
    castIds: ['tala', 'oren'],
    locationId: 'bridge-catwalk',
    latestRunId: undefined,
    pendingProposalCount: 0,
    warningCount: 0,
    currentVersionLabel: 'Draft',
    activeThreadId: 'thread-main',
    availableThreads: [{ id: 'thread-main', label: 'Mainline' }],
  },
  setup: {
    sceneId: 'scene-warehouse-bridge',
    identity: {
      title: 'Warehouse Bridge',
      chapterLabel: 'Open Water Signals / Scene 2',
      locationLabel: 'Salt-air catwalk over the warehouse canal',
      povCharacterId: 'tala',
      timeboxLabel: 'Dawn watch',
      summary: 'An unfinished handoff scene still deciding who controls the tempo.',
    },
    objective: {
      externalGoal: 'Get the package across the bridge without proving who arranged the exchange.',
      emotionalGoal: 'Let Tala stay guarded while Oren tests the edges of trust.',
      successSignal: 'The handoff lands and the betrayal beat remains deferred.',
      failureCost: 'The scene resolves too early and burns future chapter tension.',
    },
    cast: [
      { id: 'tala', name: 'Tala Soren', role: 'POV', agenda: 'Control the exchange.', selected: true },
      { id: 'oren', name: 'Oren Vale', role: 'Counterforce', agenda: 'Measure Tala before committing.', selected: true },
      { id: 'dockers', name: 'Dock Workers', role: 'Ambient pressure', agenda: 'Stay background only.', selected: false },
    ],
    constraints: [
      { id: 'constraint-draft-1', label: 'No betrayal reveal yet', kind: 'canon', summary: 'Do not resolve the traitor question in this scene.' },
    ],
    knowledgeBoundaries: [
      {
        id: 'boundary-draft-1',
        label: 'Package contents',
        summary: 'The package matters, but no one opens it in this draft.',
        status: 'guarded',
      },
    ],
    runtimePreset: {
      selectedPresetId: 'runtime-measured-pressure',
      presetOptions: midnightPlatform.setup.runtimePreset.presetOptions,
    },
  },
  execution: {
    runId: undefined,
    objective: {
      goal: 'Draft still in setup; execution has not been started.',
      tensionLabel: 'Dormant',
      pacingLabel: 'Held',
      cast: [
        { id: 'tala', name: 'Tala Soren', role: 'POV' },
        { id: 'oren', name: 'Oren Vale', role: 'Counterforce' },
      ],
      location: { id: 'bridge-catwalk', name: 'Warehouse bridge catwalk' },
      warningsCount: 0,
      unresolvedCount: 2,
      constraintSummary: ['No betrayal reveal yet.'],
    },
    beats: [
      {
        id: 'beat-draft-1',
        index: 1,
        title: 'Handoff not started',
        status: 'todo',
        proposalCount: 0,
        warningCount: 0,
        summary: 'Setup is waiting for a first execution pass.',
      },
    ],
    proposals: [],
    acceptedSummary: {
      sceneSummary: 'No accepted execution state yet; setup still owns the next move.',
      acceptedFacts: [],
      readiness: 'not-ready',
      pendingProposalCount: 0,
      warningCount: 0,
      patchCandidateCount: 0,
    },
    runtimeSummary: {
      runHealth: 'stable',
      latencyLabel: 'Not started',
      tokenLabel: '0 tokens',
      costLabel: '$0.00',
      latestFailureSummary: undefined,
    },
    consistencySummary: {
      warningsCount: 0,
      topIssues: [],
    },
    canContinueRun: false,
    canOpenProse: false,
  },
  prose: {
    sceneId: 'scene-warehouse-bridge',
    proseDraft: undefined,
    revisionModes: ['rewrite', 'compress', 'expand', 'tone_adjust', 'continuity_fix'],
    latestDiffSummary: 'No prose draft yet.',
    warningsCount: 0,
    focusModeAvailable: false,
    revisionQueueCount: 0,
    draftWordCount: 0,
    statusLabel: 'Setup draft only',
  },
  inspector: {
    context: {
      acceptedFacts: [],
      privateInfoGuard: {
        summary: 'Keep the package contents guarded until execution establishes what the bridge handoff makes public.',
        items: [
          {
            id: 'guard-package',
            label: 'Package contents',
            summary: 'Setup can establish importance without opening or explaining the package.',
            status: 'guarded',
          },
        ],
      },
      actorKnowledgeBoundaries: [
        {
          actor: { id: 'tala', name: 'Tala Soren', role: 'POV' },
          boundaries: [
            {
              id: 'boundary-draft-1-tala',
              label: 'Package contents',
              summary: 'Tala knows the package matters but the scene should not reveal what it contains.',
              status: 'guarded',
            },
          ],
        },
        {
          actor: { id: 'oren', name: 'Oren Vale', role: 'Counterforce' },
          boundaries: [
            {
              id: 'boundary-draft-1-oren',
              label: 'Package contents',
              summary: 'Oren can test Tala’s resolve without proving what is inside the package.',
              status: 'guarded',
            },
          ],
        },
      ],
      localState: [{ id: 'draft-state-1', label: 'Execution status', value: 'Not started' }],
      overrides: [],
    },
    versions: {
      checkpoints: [],
      acceptanceTimeline: [],
      patchCandidates: [],
    },
    runtime: {
      profile: {
        label: 'Measured Pressure',
        summary: 'Preset chosen, but runtime has not started.',
      },
      runHealth: 'stable',
      metrics: {
        latencyLabel: 'Not started',
        tokenLabel: '0 tokens',
        costLabel: '$0.00',
      },
      latestFailure: undefined,
    },
  },
  dock: {
    events: [],
    trace: [],
    consistency: {
      summary: 'No runtime checks yet.',
      checks: [],
    },
    problems: {
      summary: 'No problems recorded yet.',
      items: [],
    },
    cost: {
      currentWindowLabel: '$0.00 estimated',
      trendLabel: 'No execution yet.',
      breakdown: [],
    },
  },
}

const baseDatabase: SceneMockDatabase = {
  scenes: {
    'scene-midnight-platform': midnightPlatform,
    'scene-warehouse-bridge': warehouseBridge,
  },
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function getDatabaseLocale(database: SceneMockDatabase): Locale {
  return database.locale ?? 'en'
}

function updateProposalStatus(
  proposals: ProposalCardModel[],
  proposalId: string,
  status: ProposalStatus,
  input?: ProposalActionInput,
) {
  return proposals.map((proposal) => {
    if (proposal.id !== proposalId) {
      return proposal
    }

    return {
      ...proposal,
      status,
      summary: input?.editedSummary ?? proposal.summary,
      detail:
        status === 'rewrite-requested' && input?.note
          ? `${proposal.detail ?? ''}\nRewrite note: ${input.note}`.trim()
          : proposal.detail,
    }
  })
}

function ensureLocalStateItem(scene: SceneRecord, id: string, label: string, value: string) {
  const existing = scene.inspector.context.localState.find((item) => item.id === id)

  if (existing) {
    scene.inspector.context.localState = scene.inspector.context.localState.map((item) =>
      item.id === id ? { ...item, label, value } : item,
    )
    return
  }

  scene.inspector.context.localState = [
    ...scene.inspector.context.localState,
    { id, label, value },
  ]
}

function syncPatchCandidateCount(scene: SceneRecord, locale: Locale) {
  const copy = getSceneFixtureCopy(locale)
  scene.execution.acceptedSummary.patchCandidateCount = scene.inspector.versions.patchCandidates.filter(
    (candidate) => candidate.status === 'ready_for_commit',
  ).length
  ensureLocalStateItem(
    scene,
    'state-3',
    copy.localState.acceptedPatchCandidatesLabel,
    copy.localState.semanticCandidates(scene.execution.acceptedSummary.patchCandidateCount ?? 0),
  )
}

function syncAcceptedFacts(scene: SceneRecord) {
  scene.inspector.context.acceptedFacts = clone(scene.execution.acceptedSummary.acceptedFacts)
}

function buildPrivateInfoGuard(
  knowledgeBoundaries: SceneSetupViewModel['knowledgeBoundaries'],
  locale: Locale,
): SceneInspectorViewModel['context']['privateInfoGuard'] {
  const copy = getSceneFixtureCopy(locale)
  const guardedItems = knowledgeBoundaries.filter((boundary) => boundary.status !== 'known')

  if (guardedItems.length === 0) {
    return {
      summary: copy.privateInfoGuard.none,
      items: [] as SceneInspectorViewModel['context']['privateInfoGuard']['items'],
    }
  }

  return {
    summary: copy.privateInfoGuard.protect(guardedItems.length),
    items: guardedItems.map((boundary) => {
      const status: SceneInspectorViewModel['context']['privateInfoGuard']['items'][number]['status'] =
        boundary.status === 'guarded' ? 'guarded' : 'watching'

      return {
        id: `guard-${boundary.id}`,
        label: boundary.label,
        summary: boundary.summary,
        status,
      }
    }),
  }
}

function buildActorKnowledgeBoundaries(setup: SceneSetupViewModel, locale: Locale) {
  const copy = getSceneFixtureCopy(locale)
  return setup.cast
    .filter((member) => member.selected)
    .map((member) => ({
      actor: { id: member.id, name: member.name, role: member.role },
      boundaries: setup.knowledgeBoundaries.map((boundary) => ({
        ...boundary,
        summary:
          member.id === setup.identity.povCharacterId
            ? boundary.summary
            : boundary.status === 'known'
              ? copy.actorKnowledge.known(member.name, boundary.summary)
              : copy.actorKnowledge.guarded(member.name, boundary.summary),
      })),
    }))
}

function buildAcceptedPatchCandidate(proposal: ProposalCardModel) {
  return {
    id: `patch-${proposal.id}`,
    label: proposal.title,
    summary: proposal.summary,
    status: 'ready_for_commit' as const,
  }
}

function buildDockSummary(dock: SceneDockViewModel): SceneDockViewModel {
  return {
    events: clone(dock.events),
    trace: [],
    consistency: {
      summary: dock.consistency.summary,
      checks: [],
    },
    problems: {
      summary: dock.problems.summary,
      items: [],
    },
    cost: {
      currentWindowLabel: dock.cost.currentWindowLabel,
      trendLabel: dock.cost.trendLabel,
      breakdown: [],
    },
  }
}

function addDockEvent(
  scene: SceneRecord,
  title: string,
  detail: string,
  meta: string,
  tone: SceneDockViewModel['events'][number]['tone'],
) {
  scene.dock.events = [
    {
      id: `${meta.toLowerCase()}-${scene.dock.events.length + 1}`,
      title,
      detail,
      meta,
      tone,
    },
    ...scene.dock.events,
  ]
}

export function createSceneMockDatabase(locale: Locale = 'en'): SceneMockDatabase {
  return localizeSceneMockDatabase(locale, clone(baseDatabase)) as SceneMockDatabase
}

export function getSceneFixture(sceneId: string, locale: Locale = 'en') {
  const database = createSceneMockDatabase(locale)
  const scene = database.scenes[sceneId]
  if (!scene) {
    throw new Error(`Unknown scene "${sceneId}"`)
  }

  return scene
}

export function saveSceneSetup(database: SceneMockDatabase, sceneId: string, setup: SceneSetupViewModel) {
  const scene = database.scenes[sceneId]
  if (!scene) {
    throw new Error(`Unknown scene "${sceneId}"`)
  }

  const copy = getSceneFixtureCopy(getDatabaseLocale(database))

  scene.setup = clone(setup)
  scene.workspace.title = setup.identity.title
  scene.workspace.objective = setup.objective.externalGoal
  scene.workspace.locationId = setup.identity.locationLabel
  scene.workspace.castIds = setup.cast.filter((member) => member.selected).map((member) => member.id)

  scene.execution.objective.goal = setup.objective.externalGoal
  scene.execution.objective.location = {
    id: scene.execution.objective.location?.id ?? 'scene-location',
    name: setup.identity.locationLabel,
  }
  scene.execution.objective.cast = setup.cast
    .filter((member) => member.selected)
    .map((member) => ({ id: member.id, name: member.name, role: member.role }))
  scene.execution.objective.constraintSummary = setup.constraints.map((constraint) => constraint.summary)
  scene.inspector.context.privateInfoGuard = buildPrivateInfoGuard(setup.knowledgeBoundaries, getDatabaseLocale(database))
  scene.inspector.context.actorKnowledgeBoundaries = buildActorKnowledgeBoundaries(setup, getDatabaseLocale(database))
  scene.inspector.context.localState = [
    {
      id: 'state-1',
      label: getSceneFixtureCopy(getDatabaseLocale(database)).localState.activeBeatLabel,
      value: scene.inspector.context.localState[0]?.value ?? (getDatabaseLocale(database) === 'zh-CN' ? '围绕账本的讨价还价' : 'Bargain over the ledger'),
    },
    {
      id: 'state-2',
      label: copy.localState.selectedRuntimePresetLabel,
      value:
        setup.runtimePreset.presetOptions.find((preset) => preset.id === setup.runtimePreset.selectedPresetId)?.label ??
        copy.localState.unassigned,
    },
    {
      id: 'state-3',
      label: copy.localState.acceptedPatchCandidatesLabel,
      value: copy.localState.semanticCandidates(1),
    },
  ]
  scene.inspector.runtime.profile = {
    label:
      setup.runtimePreset.presetOptions.find((preset) => preset.id === setup.runtimePreset.selectedPresetId)?.label ??
      copy.localState.defaultRuntimePreset,
    summary:
      setup.runtimePreset.presetOptions.find((preset) => preset.id === setup.runtimePreset.selectedPresetId)?.summary ??
      scene.inspector.runtime.profile.summary,
  }
  syncPatchCandidateCount(scene, getDatabaseLocale(database))
}

export function applyProseRevision(
  database: SceneMockDatabase,
  sceneId: string,
  revisionMode: SceneProseViewModel['revisionModes'][number],
) {
  const scene = database.scenes[sceneId]
  if (!scene) {
    throw new Error(`Unknown scene "${sceneId}"`)
  }

  const copy = getSceneFixtureCopy(getDatabaseLocale(database))
  const modeLabels = copy.proseRevision.modeLabels

  scene.prose.latestDiffSummary = copy.proseRevision.latestRevision(modeLabels[revisionMode])
  scene.prose.revisionQueueCount = 1
  scene.prose.statusLabel = copy.proseRevision.revisionQueued
  scene.prose.warningsCount = revisionMode === 'continuity_fix' ? 0 : 1
}

export function continueSceneRun(database: SceneMockDatabase, sceneId: string) {
  const scene = database.scenes[sceneId]
  if (!scene) {
    throw new Error(`Unknown scene "${sceneId}"`)
  }

  scene.workspace.runStatus = 'running'
  scene.workspace.status = 'running'
  scene.workspace.latestRunId = 'run-08'
  scene.workspace.currentVersionLabel = getSceneFixtureCopy(getDatabaseLocale(database)).continueRun.versionLabel
  scene.execution.runId = 'run-08'
  scene.execution.canContinueRun = false
  scene.execution.runtimeSummary.runHealth = 'stable'
  scene.execution.runtimeSummary.latestFailureSummary = undefined
  scene.execution.acceptedSummary.sceneSummary = getSceneFixtureCopy(getDatabaseLocale(database)).continueRun.summary
  scene.inspector.runtime.runHealth = 'stable'
  scene.inspector.runtime.latestFailure = undefined
  addDockEvent(
    scene,
    getSceneFixtureCopy(getDatabaseLocale(database)).continueRun.dockTitle,
    getSceneFixtureCopy(getDatabaseLocale(database)).continueRun.dockDetail,
    getDatabaseLocale(database) === 'zh-CN' ? '运行' : 'Run',
    'accent',
  )
}

export function switchSceneThread(database: SceneMockDatabase, sceneId: string, threadId: string) {
  const scene = database.scenes[sceneId]
  if (!scene) {
    throw new Error(`Unknown scene "${sceneId}"`)
  }

  if (!scene.workspace.availableThreads.some((thread) => thread.id === threadId)) {
    throw new Error(`Unknown thread "${threadId}" for scene "${sceneId}"`)
  }

  scene.workspace.activeThreadId = threadId

  if (threadId === 'thread-branch-a') {
    const copy = getSceneFixtureCopy(getDatabaseLocale(database)).switchThread
    scene.workspace.objective = copy.altObjective
    scene.execution.objective.goal = copy.altGoal
    scene.prose.statusLabel = copy.altStatus
    scene.inspector.context.localState = scene.inspector.context.localState.map((item) =>
      item.id === 'state-1' ? { ...item, value: copy.altLocalState } : item,
    )
    addDockEvent(
      scene,
      copy.altDockTitle,
      copy.altDockDetail,
      getDatabaseLocale(database) === 'zh-CN' ? '线程' : 'Thread',
      'accent',
    )
    return
  }

  const copy = getSceneFixtureCopy(getDatabaseLocale(database)).switchThread
  scene.workspace.objective = copy.mainObjective
  scene.execution.objective.goal = copy.mainGoal
  scene.prose.statusLabel = copy.mainStatus
  scene.inspector.context.localState = scene.inspector.context.localState.map((item) =>
    item.id === 'state-1' ? { ...item, value: copy.mainLocalState } : item,
  )
  addDockEvent(
    scene,
    copy.mainDockTitle,
    copy.mainDockDetail,
    getDatabaseLocale(database) === 'zh-CN' ? '线程' : 'Thread',
    'neutral',
  )
}

export function applyProposalAction(
  database: SceneMockDatabase,
  sceneId: string,
  action: 'accept' | 'editAccept' | 'requestRewrite' | 'reject',
  input: ProposalActionInput,
) {
  const scene = database.scenes[sceneId]
  if (!scene) {
    throw new Error(`Unknown scene "${sceneId}"`)
  }

  const nextStatus: ProposalStatus =
    action === 'accept' || action === 'editAccept'
      ? 'accepted'
      : action === 'requestRewrite'
        ? 'rewrite-requested'
        : 'rejected'

  scene.execution.proposals = updateProposalStatus(scene.execution.proposals, input.proposalId, nextStatus, input)

  const pendingCount = scene.execution.proposals.filter((proposal) => proposal.status === 'pending').length
  const selectedProposal = scene.execution.proposals.find((proposal) => proposal.id === input.proposalId)

  scene.execution.acceptedSummary.pendingProposalCount = pendingCount
  scene.workspace.pendingProposalCount = pendingCount

  if (nextStatus === 'accepted' && selectedProposal) {
    const copy = getSceneFixtureCopy(getDatabaseLocale(database)).proposalAction
    scene.execution.acceptedSummary.sceneSummary = copy.acceptedSceneSummary(selectedProposal.title)
    scene.execution.acceptedSummary.acceptedFacts = [
      {
        id: `fact-${scene.execution.acceptedSummary.acceptedFacts.length + 1}`,
        label: selectedProposal.title,
        value: input.editedSummary ?? selectedProposal.summary,
      },
      ...scene.execution.acceptedSummary.acceptedFacts,
    ].slice(0, 4)
    scene.inspector.versions.patchCandidates = [
      buildAcceptedPatchCandidate(selectedProposal),
      ...scene.inspector.versions.patchCandidates.filter((candidate) => candidate.id !== `patch-${selectedProposal.id}`),
    ]
    scene.inspector.versions.acceptanceTimeline = [
      {
        id: `timeline-${selectedProposal.id}`,
        title: copy.acceptedTimelineTitle,
        detail: copy.acceptedTimelineDetail(selectedProposal.title),
        meta: getDatabaseLocale(database) === 'zh-CN' ? '已采纳' : 'Accepted',
        tone: 'success',
      },
      ...scene.inspector.versions.acceptanceTimeline,
    ]
    addDockEvent(
      scene,
      copy.acceptedDockTitle,
      copy.acceptedDockDetail(selectedProposal.title),
      getDatabaseLocale(database) === 'zh-CN' ? '补丁' : 'Patch',
      'success',
    )
  }

  if (nextStatus === 'rewrite-requested') {
    const copy = getSceneFixtureCopy(getDatabaseLocale(database)).proposalAction
    scene.execution.acceptedSummary.sceneSummary = copy.rewriteSceneSummary
    addDockEvent(
      scene,
      copy.rewriteDockTitle,
      copy.rewriteDockDetail(selectedProposal?.title),
      getDatabaseLocale(database) === 'zh-CN' ? '评审' : 'Review',
      'warn',
    )
  }

  if (nextStatus === 'rejected') {
    const copy = getSceneFixtureCopy(getDatabaseLocale(database)).proposalAction
    scene.execution.acceptedSummary.sceneSummary = copy.rejectedSceneSummary
    addDockEvent(
      scene,
      copy.rejectedDockTitle,
      copy.rejectedDockDetail(selectedProposal?.title),
      getDatabaseLocale(database) === 'zh-CN' ? '评审' : 'Review',
      'danger',
    )
  }

  syncAcceptedFacts(scene)
  syncPatchCandidateCount(scene, getDatabaseLocale(database))
}

export function getSceneDockSummary(database: SceneMockDatabase, sceneId: string) {
  const scene = database.scenes[sceneId]
  if (!scene) {
    throw new Error(`Unknown scene "${sceneId}"`)
  }

  return buildDockSummary(scene.dock)
}

export function getSceneDockTab(database: SceneMockDatabase, sceneId: string, tab: SceneDockTabId) {
  const scene = database.scenes[sceneId]
  if (!scene) {
    throw new Error(`Unknown scene "${sceneId}"`)
  }

  if (tab === 'events') {
    return {
      events: clone(scene.dock.events),
    }
  }

  if (tab === 'trace') {
    return {
      trace: clone(scene.dock.trace),
    }
  }

  if (tab === 'consistency') {
    return {
      consistency: clone(scene.dock.consistency),
    }
  }

  if (tab === 'problems') {
    return {
      problems: clone(scene.dock.problems),
    }
  }

  return {
    cost: clone(scene.dock.cost),
  }
}

export function previewAcceptedPatch(database: SceneMockDatabase, sceneId: string): ScenePatchPreviewViewModel | null {
  const scene = database.scenes[sceneId]
  if (!scene) {
    throw new Error(`Unknown scene "${sceneId}"`)
  }

  const patchCandidate = scene.inspector.versions.patchCandidates.find((candidate) => candidate.status === 'ready_for_commit')
  if (!patchCandidate) {
    return null
  }

  return {
    patchId: patchCandidate.id,
    label: patchCandidate.label,
    summary: patchCandidate.summary,
    status: patchCandidate.status,
    sceneSummary: scene.execution.acceptedSummary.sceneSummary,
    acceptedFacts: clone(scene.execution.acceptedSummary.acceptedFacts),
    changes: scene.execution.acceptedSummary.acceptedFacts.slice(0, 4).map((fact) => ({
      id: `change-${fact.id}`,
      label: fact.label,
      detail: fact.value,
    })),
  }
}

export function commitAcceptedPatch(database: SceneMockDatabase, sceneId: string, patchId: string) {
  const scene = database.scenes[sceneId]
  if (!scene) {
    throw new Error(`Unknown scene "${sceneId}"`)
  }

  const patchCandidate = scene.inspector.versions.patchCandidates.find((candidate) => candidate.id === patchId)
  if (!patchCandidate) {
    throw new Error(`Unknown patch "${patchId}" for scene "${sceneId}"`)
  }

  scene.inspector.versions.patchCandidates = scene.inspector.versions.patchCandidates.filter((candidate) => candidate.id !== patchId)
  scene.workspace.status = 'committed'
  scene.workspace.runStatus = 'completed'
  const copy = getSceneFixtureCopy(getDatabaseLocale(database)).commitPatch
  scene.workspace.currentVersionLabel = copy.versionLabel(patchCandidate.label)
  scene.execution.acceptedSummary.readiness = 'ready'
  scene.execution.acceptedSummary.sceneSummary = copy.sceneSummary(patchCandidate.label)
  scene.execution.canContinueRun = false
  scene.prose.statusLabel = copy.proseStatus
  scene.prose.latestDiffSummary = copy.proseDiff(patchCandidate.label)
  scene.inspector.versions.checkpoints = [
    {
      id: `checkpoint-${patchId}`,
      label: copy.checkpointLabel(patchCandidate.label),
      summary: copy.checkpointSummary(patchCandidate.label),
      status: 'accepted',
    },
    ...scene.inspector.versions.checkpoints,
  ]
  scene.inspector.versions.acceptanceTimeline = [
    {
      id: `timeline-commit-${patchId}`,
      title: copy.timelineTitle,
      detail: copy.timelineDetail(patchCandidate.label),
      meta: getDatabaseLocale(database) === 'zh-CN' ? '提交' : 'Commit',
      tone: 'success',
    },
    ...scene.inspector.versions.acceptanceTimeline,
  ]
  addDockEvent(
    scene,
    copy.dockTitle,
    copy.dockDetail(patchCandidate.label),
    getDatabaseLocale(database) === 'zh-CN' ? '提交' : 'Commit',
    'success',
  )
  syncAcceptedFacts(scene)
  syncPatchCandidateCount(scene, getDatabaseLocale(database))
}
