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

interface LightweightSceneSeed {
  sceneId: string
  title: string
  chapterId: string
  chapterTitle: string
  status: SceneWorkspaceViewModel['status']
  runStatus: SceneWorkspaceViewModel['runStatus']
  objective: string
  chapterLabel: string
  locationId: string
  locationLabel: string
  povCharacterId: string
  timeboxLabel: string
  setupSummary: string
  cast: SceneSetupViewModel['cast']
  externalGoal: string
  emotionalGoal: string
  successSignal: string
  failureCost: string
  constraints: SceneSetupViewModel['constraints']
  knowledgeBoundaries: SceneSetupViewModel['knowledgeBoundaries']
  executionGoal: string
  tensionLabel: string
  pacingLabel: string
  beatId: string
  beatTitle: string
  beatSummary: string
  proposalId: string
  proposalTitle: string
  proposalSummary: string
  acceptedFactLabel: string
  acceptedFactValue: string
  proseDraft: string
  proseStatusLabel: string
  dockEventTitle: string
  dockEventDetail: string
  problemTitle: string
  problemRecommendation: string
  latestRunId?: string
  runId?: string
  currentVersionLabel?: string
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

function createLightweightSceneRecord(seed: LightweightSceneSeed): SceneRecord {
  const selectedCast = seed.cast.filter((member) => member.selected)
  const acceptedFacts = [{ id: `fact-${seed.sceneId}`, label: seed.acceptedFactLabel, value: seed.acceptedFactValue }]
  const guardedBoundaries = seed.knowledgeBoundaries.filter((boundary) => boundary.status !== 'known')

  return {
    workspace: {
      id: seed.sceneId,
      title: seed.title,
      chapterId: seed.chapterId,
      chapterTitle: seed.chapterTitle,
      status: seed.status,
      runStatus: seed.runStatus,
      objective: seed.objective,
      castIds: selectedCast.map((member) => member.id),
      locationId: seed.locationId,
      latestRunId: seed.latestRunId,
      pendingProposalCount: 1,
      warningCount: 1,
      currentVersionLabel: seed.currentVersionLabel,
      activeThreadId: 'thread-main',
      availableThreads: [{ id: 'thread-main', label: 'Mainline' }],
    },
    setup: {
      sceneId: seed.sceneId,
      identity: {
        title: seed.title,
        chapterLabel: seed.chapterLabel,
        locationLabel: seed.locationLabel,
        povCharacterId: seed.povCharacterId,
        timeboxLabel: seed.timeboxLabel,
        summary: seed.setupSummary,
      },
      objective: {
        externalGoal: seed.externalGoal,
        emotionalGoal: seed.emotionalGoal,
        successSignal: seed.successSignal,
        failureCost: seed.failureCost,
      },
      cast: seed.cast,
      constraints: seed.constraints,
      knowledgeBoundaries: seed.knowledgeBoundaries,
      runtimePreset: {
        selectedPresetId: 'runtime-measured-pressure',
        presetOptions: midnightPlatform.setup.runtimePreset.presetOptions,
      },
    },
    execution: {
      runId: seed.runId,
      objective: {
        goal: seed.executionGoal,
        tensionLabel: seed.tensionLabel,
        pacingLabel: seed.pacingLabel,
        cast: selectedCast.map((member) => ({ id: member.id, name: member.name, role: member.role })),
        location: { id: seed.locationId, name: seed.locationLabel },
        warningsCount: 1,
        unresolvedCount: seed.knowledgeBoundaries.length,
        constraintSummary: seed.constraints.map((constraint) => constraint.summary),
      },
      beats: [
        {
          id: seed.beatId,
          index: 1,
          title: seed.beatTitle,
          status: 'review',
          proposalCount: 1,
          warningCount: 1,
          summary: seed.beatSummary,
        },
      ],
      proposals: [
        {
          id: seed.proposalId,
          beatId: seed.beatId,
          actor: { id: 'scene-manager', name: 'Scene Manager', type: 'scene-manager' },
          kind: 'state-change',
          title: seed.proposalTitle,
          summary: seed.proposalSummary,
          status: 'pending',
          impactTags: ['handoff', 'continuity'],
          affects: [
            {
              path: 'scene.accepted-summary',
              label: 'Accepted pressure',
              deltaSummary: seed.proposalSummary,
            },
          ],
          risks: [{ severity: 'warn', message: seed.problemTitle }],
          evidencePeek: [seed.acceptedFactValue],
          sourceTraceId: `trace-${seed.sceneId}`,
        },
      ],
      acceptedSummary: {
        sceneSummary: `Accepted state already keeps ${seed.acceptedFactLabel.toLowerCase()} in play while the next handoff stays reviewable.`,
        acceptedFacts,
        readiness: 'draftable',
        pendingProposalCount: 1,
        warningCount: 1,
        patchCandidateCount: 0,
      },
      runtimeSummary: {
        runHealth: 'attention',
        latencyLabel: seed.runId ? '1.2s avg step' : 'Awaiting run',
        tokenLabel: seed.runId ? '2.4k tokens' : '0 tokens',
        costLabel: seed.runId ? '$0.06 est.' : '$0.00',
        latestFailureSummary: seed.problemTitle,
      },
      consistencySummary: {
        warningsCount: 1,
        topIssues: [seed.problemTitle],
      },
      canContinueRun: false,
      canOpenProse: true,
    },
    prose: {
      sceneId: seed.sceneId,
      proseDraft: seed.proseDraft,
      revisionModes: ['rewrite', 'compress', 'expand', 'tone_adjust', 'continuity_fix'],
      latestDiffSummary: 'No prose revision requested yet.',
      warningsCount: 1,
      focusModeAvailable: true,
      revisionQueueCount: 0,
      draftWordCount: seed.proseDraft.trim().split(/\s+/).length,
      statusLabel: seed.proseStatusLabel,
    },
    inspector: {
      context: {
        acceptedFacts,
        privateInfoGuard: {
          summary:
            guardedBoundaries.length > 0
              ? `Protect ${guardedBoundaries.length} guarded reveal point${guardedBoundaries.length === 1 ? '' : 's'} while review stays open.`
              : 'No guarded reveal points remain.',
          items: guardedBoundaries.map((boundary) => ({
            id: `guard-${boundary.id}`,
            label: boundary.label,
            summary: boundary.summary,
            status: boundary.status === 'guarded' ? 'guarded' : 'watching',
          })),
        },
        actorKnowledgeBoundaries: selectedCast.map((member) => ({
          actor: { id: member.id, name: member.name, role: member.role },
          boundaries: seed.knowledgeBoundaries.map((boundary) => ({
            ...boundary,
          })),
        })),
        localState: [
          { id: 'state-1', label: 'Active beat', value: seed.beatTitle },
          { id: 'state-2', label: 'Selected runtime preset', value: 'Measured Pressure' },
          { id: 'state-3', label: 'Accepted patch candidates', value: '0 semantic candidates' },
        ],
        overrides: [
          {
            id: `override-${seed.sceneId}`,
            label: 'Chapter handoff',
            summary: seed.problemRecommendation,
            status: 'active',
          },
        ],
      },
      versions: {
        checkpoints: [
          {
            id: `checkpoint-${seed.sceneId}`,
            label: seed.currentVersionLabel ?? 'Scaffold checkpoint',
            summary: `Fixture parity for ${seed.title} is available in scene scope.`,
            status: 'review',
          },
        ],
        acceptanceTimeline: [
          {
            id: `timeline-${seed.sceneId}`,
            title: seed.dockEventTitle,
            detail: seed.dockEventDetail,
            meta: 'Review',
            tone: 'accent',
          },
        ],
        patchCandidates: [],
      },
      runtime: {
        profile: {
          label: 'Measured Pressure',
          summary: `Keep ${seed.title} light enough for parity coverage while preserving scene-shape integrity.`,
        },
        runHealth: 'attention',
        metrics: {
          latencyLabel: seed.runId ? '1.2s avg step' : 'Awaiting run',
          tokenLabel: seed.runId ? '2.4k tokens' : '0 tokens',
          costLabel: seed.runId ? '$0.06 est.' : '$0.00',
        },
        latestFailure: seed.problemTitle,
      },
    },
    dock: {
      events: [
        {
          id: `event-${seed.sceneId}`,
          title: seed.dockEventTitle,
          detail: seed.dockEventDetail,
          meta: 'Event',
          tone: 'accent',
        },
      ],
      trace: [
        {
          id: `trace-${seed.sceneId}`,
          title: `Trace / ${seed.title}`,
          detail: seed.proposalSummary,
          meta: 'Trace',
          tone: 'neutral',
        },
      ],
      consistency: {
        summary: `One continuity checkpoint remains open for ${seed.title}.`,
        checks: [
          {
            id: `consistency-${seed.sceneId}`,
            label: seed.problemTitle,
            status: 'warn',
            detail: seed.problemRecommendation,
          },
        ],
      },
      problems: {
        summary: `Keep the remaining risk visible without expanding the scene scaffold.`,
        items: [
          {
            id: `problem-${seed.sceneId}`,
            title: seed.problemTitle,
            severity: 'warn',
            recommendation: seed.problemRecommendation,
          },
        ],
      },
      cost: {
        currentWindowLabel: seed.runId ? '$0.06 estimated' : '$0.00 estimated',
        trendLabel: 'Lightweight parity fixture.',
        breakdown: [{ id: `cost-${seed.sceneId}`, label: 'Fixture status', value: 'Parity scaffold' }],
      },
    },
  }
}

const concourseDelay = createLightweightSceneRecord({
  sceneId: 'scene-concourse-delay',
  title: 'Concourse Delay',
  chapterId: 'chapter-signals-in-rain',
  chapterTitle: 'Signals in Rain',
  status: 'draft',
  runStatus: 'idle',
  objective: 'Hold the crowd bottleneck long enough to keep platform pressure alive.',
  chapterLabel: 'Signals in Rain / Scene 5',
  locationId: 'concourse-hall',
  locationLabel: 'Crowded concourse hall',
  povCharacterId: 'mei',
  timeboxLabel: '03:18-03:22',
  setupSummary: 'A crowd-bound transition scene that delays the exit without resolving who controls the courier line.',
  cast: [
    { id: 'mei', name: 'Mei Arden', role: 'POV', agenda: 'Hold the crowd between Ren and the gate.', selected: true },
    { id: 'ren', name: 'Ren Voss', role: 'Counterforce', agenda: 'Slip through before the delay hardens.', selected: true },
    { id: 'ushers', name: 'Platform ushers', role: 'Ambient pressure', agenda: 'Keep bodies moving, not answers.', selected: false },
  ],
  externalGoal: 'Delay the exit without giving up the courier advantage.',
  emotionalGoal: 'Let Mei keep control without showing panic.',
  successSignal: 'The crowd slows the move and the witness pressure survives.',
  failureCost: 'The handoff escapes the chapter before the pressure lands.',
  constraints: [{ id: 'constraint-concourse-1', label: 'Do not settle courier ownership', kind: 'canon', summary: 'No one proves who controls the courier line here.' }],
  knowledgeBoundaries: [{ id: 'boundary-concourse-1', label: 'Courier-line owner', summary: 'The crowd delay should not confirm who actually commands the courier path.', status: 'guarded' }],
  executionGoal: 'Use the bottleneck to delay motion without turning the chapter private.',
  tensionLabel: 'Held',
  pacingLabel: 'Crowded',
  beatId: 'beat-concourse-delay',
  beatTitle: 'Crowd bottleneck',
  beatSummary: 'Bodies compress the exit while Mei tries to keep the witness pressure public.',
  proposalId: 'proposal-concourse-delay',
  proposalTitle: 'Keep the delay visible from both sides of the crowd',
  proposalSummary: 'Let the bottleneck slow everyone down while the witness pressure carries inward from the platform.',
  acceptedFactLabel: 'Crowd delay established',
  acceptedFactValue: 'The concourse bottleneck slows motion without resolving courier ownership.',
  proseDraft: 'The concourse tightened by inches instead of steps, forcing every glance to travel through strangers before it reached the gate.',
  proseStatusLabel: 'Draft handoff ready',
  dockEventTitle: 'Concourse delay preserved',
  dockEventDetail: 'The scene scaffold keeps crowd pressure active without settling the courier line.',
  problemTitle: 'Crowd pressure still needs a clean exit path',
  problemRecommendation: 'Keep the witness line visible while the crowd delay hands the chapter forward.',
})

const ticketWindow = createLightweightSceneRecord({
  sceneId: 'scene-ticket-window',
  title: 'Ticket Window',
  chapterId: 'chapter-signals-in-rain',
  chapterTitle: 'Signals in Rain',
  status: 'review',
  runStatus: 'paused',
  objective: 'Put speed and certainty in the same beat without letting Ren’s alias surface.',
  chapterLabel: 'Signals in Rain / Scene 6',
  locationId: 'ticket-window',
  locationLabel: 'Station ticket window',
  povCharacterId: 'ren',
  timeboxLabel: '03:22-03:25',
  setupSummary: 'A narrow transaction scene where speed is useful only if the alias stays out of public reach.',
  cast: [
    { id: 'ren', name: 'Ren Voss', role: 'POV', agenda: 'Buy speed without naming the alias.', selected: true },
    { id: 'mei', name: 'Mei Arden', role: 'Counterforce', agenda: 'Force commitment before motion resumes.', selected: true },
    { id: 'clerk', name: 'Ticket clerk', role: 'Witness', agenda: 'Notice urgency, not the hidden identity.', selected: true },
  ],
  externalGoal: 'Secure the next move before the gate closes.',
  emotionalGoal: 'Keep Ren contained while Mei sharpens the trade-off.',
  successSignal: 'The trade-off tightens and the alias remains private.',
  failureCost: 'The chapter exposes the alias before the handoff earns it.',
  constraints: [{ id: 'constraint-ticket-1', label: 'Alias stays offstage', kind: 'canon', summary: 'No public alias reveal is allowed at the ticket window.' }],
  knowledgeBoundaries: [{ id: 'boundary-ticket-1', label: 'Alias exposure', summary: 'The alias remains withheld from the clerk and the crowd.', status: 'guarded' }],
  executionGoal: 'Turn urgency into a visible trade-off instead of an explanation dump.',
  tensionLabel: 'Tight',
  pacingLabel: 'Controlled',
  beatId: 'beat-ticket-window',
  beatTitle: 'Window bargain',
  beatSummary: 'Ren reaches for speed while Mei keeps the cost public enough to matter.',
  proposalId: 'proposal-ticket-window',
  proposalTitle: 'Force the trade-off into one visible exchange',
  proposalSummary: 'Let the clerk witness urgency without learning the alias that gives the urgency its edge.',
  acceptedFactLabel: 'Alias still offstage',
  acceptedFactValue: 'The ticket-window exchange keeps the alias outside public knowledge.',
  proseDraft: 'The clerk slid the ticket halfway out, and even that small motion felt like a question Mei wanted answered before Ren could touch it.',
  proseStatusLabel: 'Ready for prose pass',
  dockEventTitle: 'Ticket-window trade-off held',
  dockEventDetail: 'The scene remains usable in scene scope without exposing the alias.',
  problemTitle: 'Alias pressure needs tighter public cover',
  problemRecommendation: 'Keep the clerk focused on urgency so the alias never enters the room.',
  latestRunId: 'run-03',
  runId: 'run-03',
  currentVersionLabel: 'Run 03',
})

const departureBell = createLightweightSceneRecord({
  sceneId: 'scene-departure-bell',
  title: 'Departure Bell',
  chapterId: 'chapter-signals-in-rain',
  chapterTitle: 'Signals in Rain',
  status: 'draft',
  runStatus: 'idle',
  objective: 'Place the bell without collapsing witness pressure before the chapter closes.',
  chapterLabel: 'Signals in Rain / Scene 7',
  locationId: 'departure-gate',
  locationLabel: 'Departure gate',
  povCharacterId: 'conductor',
  timeboxLabel: '03:25-03:27',
  setupSummary: 'A final timing scene still testing where motion begins and scrutiny stops.',
  cast: [
    { id: 'conductor', name: 'Station Conductor', role: 'POV', agenda: 'Keep the platform moving on schedule.', selected: true },
    { id: 'ren', name: 'Ren Voss', role: 'Pressure point', agenda: 'Leave before the bell turns him into a public fact.', selected: true },
    { id: 'mei', name: 'Mei Arden', role: 'Counterforce', agenda: 'Make the bell land on her terms.', selected: true },
  ],
  externalGoal: 'Choose a bell cue that preserves confrontation pressure to the end.',
  emotionalGoal: 'Let the conductor read the tension without explaining it.',
  successSignal: 'The bell lands and the witness pressure still matters.',
  failureCost: 'Motion starts too early and drains the confrontation.',
  constraints: [{ id: 'constraint-bell-1', label: 'Bell cannot pre-resolve the chapter', kind: 'timing', summary: 'The bell must not end the pressure before the final beat lands.' }],
  knowledgeBoundaries: [{ id: 'boundary-bell-1', label: 'Final exit trigger', summary: 'The exact trigger for motion stays provisional until the chapter handoff is stable.', status: 'open-question' }],
  executionGoal: 'Hold the final cue long enough for the chapter to keep its witness line.',
  tensionLabel: 'Edge',
  pacingLabel: 'Measured',
  beatId: 'beat-departure-bell',
  beatTitle: 'Bell placement review',
  beatSummary: 'The conductor measures when the bell becomes motion instead of pressure.',
  proposalId: 'proposal-departure-bell',
  proposalTitle: 'Tie the bell to the last visible concession',
  proposalSummary: 'Keep the bell attached to a visible choice so the chapter does not drift into abstract timing.',
  acceptedFactLabel: 'Bell timing still provisional',
  acceptedFactValue: 'The chapter still needs one safe bell placement before motion begins.',
  proseDraft: 'The bell rope waited above the conductor’s hand like a verdict not yet earned by the people beneath it.',
  proseStatusLabel: 'Awaiting first prose pass',
  dockEventTitle: 'Bell timing still under review',
  dockEventDetail: 'The exit cue is scaffolded for scene scope, but the final placement still needs chapter alignment.',
  problemTitle: 'Bell cue can still drain pressure too early',
  problemRecommendation: 'Anchor the bell to the last visible concession, not to a blank timing gap.',
})

const canalWatch = createLightweightSceneRecord({
  sceneId: 'scene-canal-watch',
  title: 'Canal Watch',
  chapterId: 'chapter-open-water-signals',
  chapterTitle: 'Open Water Signals',
  status: 'draft',
  runStatus: 'idle',
  objective: 'Tighten trust pressure without proving who owns the package.',
  chapterLabel: 'Open Water Signals / Scene 3',
  locationId: 'canal-watchpoint',
  locationLabel: 'Canal watchpoint',
  povCharacterId: 'leya',
  timeboxLabel: 'Early tide',
  setupSummary: 'A watchpoint scene that carries hesitation forward while keeping ownership unresolved.',
  cast: [
    { id: 'leya', name: 'Leya Marr', role: 'POV', agenda: 'Read the watch without naming the owner.', selected: true },
    { id: 'merek', name: 'Merek Dain', role: 'Counterforce', agenda: 'Pressure trust before the route opens.', selected: true },
    { id: 'watcher', name: 'Canal watcher', role: 'Witness', agenda: 'See enough movement to matter later.', selected: true },
  ],
  externalGoal: 'Carry warehouse hesitation into the canal without inventing a new reveal.',
  emotionalGoal: 'Keep trust pressure active while everyone stays guarded.',
  successSignal: 'The watchpoint tightens tension and ownership stays unresolved.',
  failureCost: 'The chapter names the receiver before the handoff earns it.',
  constraints: [{ id: 'constraint-canal-1', label: 'Package owner stays unresolved', kind: 'canon', summary: 'No scene beat can prove who the package belongs to.' }],
  knowledgeBoundaries: [{ id: 'boundary-canal-1', label: 'Real receiver', summary: 'The real receiver remains hidden at the canal watchpoint.', status: 'guarded' }],
  executionGoal: 'Convert caution into trust pressure without collapsing the mystery.',
  tensionLabel: 'Suspended',
  pacingLabel: 'Watchful',
  beatId: 'beat-canal-watch',
  beatTitle: 'Watchpoint check',
  beatSummary: 'The canal watch narrows trust while the owner remains unspoken.',
  proposalId: 'proposal-canal-watch',
  proposalTitle: 'Let the watchpoint tighten the trust line',
  proposalSummary: 'Carry the warehouse hesitation forward instead of replacing it with a new suspense beat.',
  acceptedFactLabel: 'Receiver still hidden',
  acceptedFactValue: 'The canal watch keeps the true receiver offstage.',
  proseDraft: 'The canal lay still enough to look honest, which was exactly why nobody at the rail trusted it.',
  proseStatusLabel: 'Draft handoff ready',
  dockEventTitle: 'Canal watchpoint preserved',
  dockEventDetail: 'The canal watch remains available in scene scope without resolving package ownership.',
  problemTitle: 'Trust pressure still needs a stronger carry-through',
  problemRecommendation: 'Let warehouse hesitation flow straight into the watchpoint exchange.',
})

const dawnSlip = createLightweightSceneRecord({
  sceneId: 'scene-dawn-slip',
  title: 'Dawn Slip',
  chapterId: 'chapter-open-water-signals',
  chapterTitle: 'Open Water Signals',
  status: 'draft',
  runStatus: 'idle',
  objective: 'Complete the turn from suspicion into motion without skipping the handoff.',
  chapterLabel: 'Open Water Signals / Scene 4',
  locationId: 'slipway-exit',
  locationLabel: 'Slipway exit',
  povCharacterId: 'watcher',
  timeboxLabel: 'Dawn release',
  setupSummary: 'An exit scene still looking for the cleanest bridge between suspicion and movement.',
  cast: [
    { id: 'watcher', name: 'Slip watcher', role: 'POV', agenda: 'See the turn before it disappears into motion.', selected: true },
    { id: 'leya', name: 'Leya Marr', role: 'Pressure point', agenda: 'Move only when the line is stable.', selected: true },
    { id: 'merek', name: 'Merek Dain', role: 'Counterforce', agenda: 'Force the turn before certainty arrives.', selected: true },
  ],
  externalGoal: 'Hand the chapter from caution into movement cleanly.',
  emotionalGoal: 'Keep suspicion visible even as the exit starts to move.',
  successSignal: 'The exit feels earned and the handoff remains credible.',
  failureCost: 'Motion arrives too early and erases the earlier caution.',
  constraints: [{ id: 'constraint-dawn-1', label: 'Do not skip the handoff', kind: 'staging', summary: 'The exit path still needs a visible bridge between suspicion and motion.' }],
  knowledgeBoundaries: [{ id: 'boundary-dawn-1', label: 'Exit trigger', summary: 'The exact trigger into motion is still under review.', status: 'open-question' }],
  executionGoal: 'Make the final slipway move read like consequence, not a jump cut.',
  tensionLabel: 'Unsettled',
  pacingLabel: 'Rising',
  beatId: 'beat-dawn-slip',
  beatTitle: 'Slipway release',
  beatSummary: 'The exit starts to move while the last doubts stay visible on the rail.',
  proposalId: 'proposal-dawn-slip',
  proposalTitle: 'Bridge suspicion into motion with one visible handoff',
  proposalSummary: 'Let the exit begin on a visible transfer so the earlier caution still pays off.',
  acceptedFactLabel: 'Exit bridge still missing',
  acceptedFactValue: 'The slipway still needs one credible bridge into motion.',
  proseDraft: 'Dawn thinned the dark along the slipway, but it did nothing to shorten the distance between doubt and movement.',
  proseStatusLabel: 'Awaiting first prose pass',
  dockEventTitle: 'Slipway handoff remains provisional',
  dockEventDetail: 'The dawn exit is openable in scene scope, but the bridge into motion still needs review.',
  problemTitle: 'Exit motion still outruns its handoff',
  problemRecommendation: 'Start motion on a visible transfer so the suspicion line stays intact.',
})

const baseDatabase: SceneMockDatabase = {
  scenes: {
    'scene-midnight-platform': midnightPlatform,
    'scene-concourse-delay': concourseDelay,
    'scene-ticket-window': ticketWindow,
    'scene-departure-bell': departureBell,
    'scene-warehouse-bridge': warehouseBridge,
    'scene-canal-watch': canalWatch,
    'scene-dawn-slip': dawnSlip,
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

export function getSceneFixtureChapterId(sceneId: string) {
  return baseDatabase.scenes[sceneId]?.workspace.chapterId ?? null
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
