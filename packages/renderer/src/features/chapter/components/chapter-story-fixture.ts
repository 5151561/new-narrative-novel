import type { ChapterStructureWorkspaceViewModel } from '../types/chapter-view-models'
import type { ChapterDraftWorkspaceViewModel } from '../types/chapter-draft-view-models'

function buildSelectedSceneBrief(selectedSceneId: string) {
  if (selectedSceneId === 'scene-concourse-delay') {
    return {
      sceneId: selectedSceneId,
      title: 'Concourse Delay',
      summary: 'Hold witness pressure at the edge of the exit.',
      unresolvedCount: 2,
      unresolvedLabel: 'Unresolved 2',
    }
  }

  if (selectedSceneId === 'scene-ticket-window') {
    return {
      sceneId: selectedSceneId,
      title: 'Ticket Window',
      summary: 'Keep the alias offstage while the trade-off tightens.',
      unresolvedCount: 1,
      unresolvedLabel: 'Unresolved 1',
    }
  }

  return {
    sceneId: selectedSceneId,
    title: 'Midnight Platform',
    summary: 'Keep public witness pressure alive at the edge of the scene.',
    unresolvedCount: 3,
    unresolvedLabel: 'Unresolved 3',
  }
}

export function buildChapterStoryWorkspace(selectedSceneId: string): ChapterStructureWorkspaceViewModel {
  return {
    chapterId: 'chapter-signals-in-rain',
    title: 'Signals in Rain',
    summary: 'Keep structure, density, and assembly pressure in the same chapter workbench.',
    sceneCount: 3,
    unresolvedCount: 6,
    selectedSceneId,
    scenes: [
      {
        id: 'scene-midnight-platform',
        order: 1,
        title: 'Midnight Platform',
        summary: 'Keep the bargain public and constrained.',
        purpose: 'Push the bargain into a public stalemate.',
        pov: 'Ren Voss',
        location: 'Eastbound platform',
        conflict: 'Ren needs leverage, Mei needs a higher price.',
        reveal: 'The courier signal stays readable only to Ren.',
        statusLabel: 'Current',
        proseStatusLabel: 'Needs draft',
        runStatusLabel: 'Paused',
        unresolvedCount: 3,
        lastRunLabel: 'Run 07',
      },
      {
        id: 'scene-concourse-delay',
        order: 2,
        title: 'Concourse Delay',
        summary: 'Hold the exit timing back a little longer.',
        purpose: 'Hold pressure for the next scene.',
        pov: 'Mei Arden',
        location: 'Concourse hall',
        conflict: 'The crowd slows everyone down.',
        reveal: 'Witness pressure carries inward.',
        statusLabel: 'Queued',
        proseStatusLabel: 'Queued for draft',
        runStatusLabel: 'Idle',
        unresolvedCount: 2,
        lastRunLabel: 'Not run',
      },
      {
        id: 'scene-ticket-window',
        order: 3,
        title: 'Ticket Window',
        summary: 'Keep the alias offstage.',
        purpose: 'Bring speed and certainty into one beat.',
        pov: 'Ren Voss',
        location: 'Ticket window',
        conflict: 'Ren wants speed, Mei wants commitment first.',
        reveal: 'The alias still has not entered public knowledge.',
        statusLabel: 'Guarded',
        proseStatusLabel: 'Needs draft',
        runStatusLabel: 'Guarded',
        unresolvedCount: 1,
        lastRunLabel: 'Run 03',
      },
    ],
    inspector: {
      selectedSceneBrief: buildSelectedSceneBrief(selectedSceneId),
      chapterNotes: ['Ordering remains structural.'],
      problemsSummary: [
        {
          id: 'bell-timing',
          label: 'Bell timing',
          detail: 'The exit bell still lands too early.',
        },
      ],
      assemblyHints: [
        {
          id: 'carry-pressure',
          label: 'Carry platform pressure',
          detail: 'Carry platform pressure into the concourse.',
        },
      ],
    },
    viewsMeta: {
      availableViews: ['sequence', 'outliner', 'assembly'],
    },
  }
}

export function buildChapterProblemsHeavyStoryWorkspace(selectedSceneId: string): ChapterStructureWorkspaceViewModel {
  const workspace = buildChapterStoryWorkspace(selectedSceneId)

  return {
    ...workspace,
    unresolvedCount: 9,
    inspector: {
      ...workspace.inspector,
      chapterNotes: ['Ordering remains structural.', 'Carry the witness pressure until the exit is truly blocked.'],
      problemsSummary: [
        ...workspace.inspector.problemsSummary,
        {
          id: 'alias-exposure',
          label: 'Alias exposure',
          detail: 'The alias brushes too close to public knowledge in the ticket window handoff.',
        },
        {
          id: 'timing-drift',
          label: 'Timing drift',
          detail: 'The bell beat and crowd delay still do not share the same structural clock.',
        },
      ],
      assemblyHints: [
        ...workspace.inspector.assemblyHints,
        {
          id: 'tighten-handoff',
          label: 'Tighten the handoff',
          detail: 'Let the concourse exit decision arrive one beat earlier before the ticket window locks it.',
        },
        {
          id: 'hold-witness-line',
          label: 'Hold the witness line',
          detail: 'Keep witness pressure visible so the next seam does not feel privately reset.',
        },
      ],
    },
  }
}

function buildDraftScenes() {
  return [
    {
      sceneId: 'scene-midnight-platform',
      order: 1,
      title: 'Midnight Platform',
      summary: 'Keep the bargain public and constrained.',
      proseDraft: 'Rain held the platform in place while Ren refused to blink first.',
      draftWordCount: 11,
      proseStatusLabel: 'Ready for revision pass',
      sceneStatusLabel: 'Current',
      latestDiffSummary: 'No prose revision requested yet.',
      revisionQueueCount: 0,
      warningsCount: 0,
      isMissingDraft: false,
    },
    {
      sceneId: 'scene-concourse-delay',
      order: 2,
      title: 'Concourse Delay',
      summary: 'Hold the crowd bottleneck long enough to keep platform pressure alive.',
      proseDraft: 'The concourse tightened by inches instead of steps, forcing every glance to travel through strangers before it reached the gate.',
      draftWordCount: 18,
      proseStatusLabel: 'Draft handoff ready',
      sceneStatusLabel: 'Queued',
      latestDiffSummary: 'Carry the witness pressure forward without resolving courier ownership.',
      revisionQueueCount: 1,
      warningsCount: 1,
      isMissingDraft: false,
    },
    {
      sceneId: 'scene-ticket-window',
      order: 3,
      title: 'Ticket Window',
      summary: 'Put speed and certainty in the same beat without surfacing the alias.',
      proseDraft: 'The clerk slid the ticket halfway out, and even that small motion felt like a question Mei wanted answered before Ren could touch it.',
      draftWordCount: 24,
      proseStatusLabel: 'Ready for prose pass',
      sceneStatusLabel: 'Guarded',
      latestDiffSummary: 'Tighten the visible cost before the clerk notices too much.',
      revisionQueueCount: 0,
      warningsCount: 1,
      isMissingDraft: false,
    },
  ]
}

function buildDraftWorkspace(selectedSceneId: string, overrides?: Partial<ChapterDraftWorkspaceViewModel>): ChapterDraftWorkspaceViewModel {
  const scenes = buildDraftScenes()
  const selectedScene = scenes.find((scene) => scene.sceneId === selectedSceneId) ?? scenes[0]!
  const draftedSceneCount = scenes.filter((scene) => !scene.isMissingDraft).length
  const missingDraftCount = scenes.filter((scene) => scene.isMissingDraft).length
  const assembledWordCount = scenes.reduce((total, scene) => total + (scene.draftWordCount ?? 0), 0)
  const warningsCount = scenes.reduce((total, scene) => total + scene.warningsCount, 0)
  const queuedRevisionCount = scenes.reduce((total, scene) => total + (scene.revisionQueueCount ?? 0), 0)

  return {
    chapterId: 'chapter-signals-in-rain',
    title: 'Signals in Rain',
    summary: 'Read the chapter as one continuous draft surface while route.sceneId keeps the focus stable.',
    selectedSceneId: selectedScene.sceneId,
    scenes,
    assembledWordCount,
    draftedSceneCount,
    missingDraftCount,
    selectedScene,
    inspector: {
      selectedScene: {
        sceneId: selectedScene.sceneId,
        title: selectedScene.title,
        summary: selectedScene.summary,
        proseStatusLabel: selectedScene.proseStatusLabel,
        draftWordCount: selectedScene.draftWordCount,
        revisionQueueCount: selectedScene.revisionQueueCount,
        warningsCount: selectedScene.warningsCount,
        latestDiffSummary: selectedScene.latestDiffSummary,
      },
      chapterReadiness: {
        draftedSceneCount,
        missingDraftCount,
        assembledWordCount,
        warningsCount,
        queuedRevisionCount,
      },
    },
    dockSummary: {
      missingDraftCount,
      warningsCount,
      queuedRevisionCount,
      missingDraftScenes: [],
      warningScenes: scenes
        .filter((scene) => scene.warningsCount > 0)
        .map((scene) => ({ sceneId: scene.sceneId, title: scene.title, detail: scene.latestDiffSummary ?? scene.summary })),
      queuedRevisionScenes: scenes
        .filter((scene) => (scene.revisionQueueCount ?? 0) > 0)
        .map((scene) => ({ sceneId: scene.sceneId, title: scene.title, detail: `${scene.revisionQueueCount} queued revision` })),
    },
    ...overrides,
  }
}

export function buildChapterDraftStoryWorkspace(selectedSceneId: string): ChapterDraftWorkspaceViewModel {
  return buildDraftWorkspace(selectedSceneId)
}

export function buildChapterDraftMissingStoryWorkspace(selectedSceneId: string): ChapterDraftWorkspaceViewModel {
  const workspace = buildDraftWorkspace(selectedSceneId)
  const scenes = workspace.scenes.map((scene) =>
    scene.sceneId === 'scene-concourse-delay'
      ? {
          ...scene,
          proseDraft: undefined,
          draftWordCount: undefined,
          proseStatusLabel: 'Missing draft',
          latestDiffSummary: 'First prose pass still missing.',
          warningsCount: 2,
          revisionQueueCount: 1,
          isMissingDraft: true,
        }
      : scene,
  )
  const selectedScene = scenes.find((scene) => scene.sceneId === selectedSceneId) ?? scenes[0]!
  const draftedSceneCount = scenes.filter((scene) => !scene.isMissingDraft).length
  const missingDraftCount = scenes.filter((scene) => scene.isMissingDraft).length
  const assembledWordCount = scenes.reduce((total, scene) => total + (scene.draftWordCount ?? 0), 0)
  const warningsCount = scenes.reduce((total, scene) => total + scene.warningsCount, 0)
  const queuedRevisionCount = scenes.reduce((total, scene) => total + (scene.revisionQueueCount ?? 0), 0)

  return {
    ...workspace,
    selectedSceneId: selectedScene.sceneId,
    scenes,
    draftedSceneCount,
    missingDraftCount,
    assembledWordCount,
    selectedScene,
    inspector: {
      selectedScene: {
        sceneId: selectedScene.sceneId,
        title: selectedScene.title,
        summary: selectedScene.summary,
        proseStatusLabel: selectedScene.proseStatusLabel,
        draftWordCount: selectedScene.draftWordCount,
        revisionQueueCount: selectedScene.revisionQueueCount,
        warningsCount: selectedScene.warningsCount,
        latestDiffSummary: selectedScene.latestDiffSummary,
      },
      chapterReadiness: {
        draftedSceneCount,
        missingDraftCount,
        assembledWordCount,
        warningsCount,
        queuedRevisionCount,
      },
    },
    dockSummary: {
      missingDraftCount,
      warningsCount,
      queuedRevisionCount,
      missingDraftScenes: [
        {
          sceneId: 'scene-concourse-delay',
          title: 'Concourse Delay',
          detail: 'First prose pass still missing.',
        },
      ],
      warningScenes: scenes
        .filter((scene) => scene.warningsCount > 0)
        .map((scene) => ({ sceneId: scene.sceneId, title: scene.title, detail: scene.latestDiffSummary ?? scene.summary })),
      queuedRevisionScenes: scenes
        .filter((scene) => (scene.revisionQueueCount ?? 0) > 0)
        .map((scene) => ({ sceneId: scene.sceneId, title: scene.title, detail: `${scene.revisionQueueCount} queued revision` })),
    },
  }
}

export function buildQuietChapterDraftStoryWorkspace(selectedSceneId: string): ChapterDraftWorkspaceViewModel {
  const scenes = [
    {
      sceneId: 'scene-warehouse-bridge',
      order: 1,
      title: 'Warehouse Bridge',
      summary: 'Keep the first handoff tentative enough for later betrayal pressure.',
      proseDraft: 'The bridge kept both hands visible and every promise reversible.',
      draftWordCount: 10,
      proseStatusLabel: 'Setup draft only',
      sceneStatusLabel: 'Current',
      latestDiffSummary: 'No pending prose revisions.',
      revisionQueueCount: 0,
      warningsCount: 0,
      isMissingDraft: false,
    },
  ]
  const selectedScene = scenes[0]!

  return {
    chapterId: 'chapter-open-water-signals',
    title: 'Open Water Signals',
    summary: 'A quieter chapter draft with one stable handoff scene.',
    selectedSceneId: selectedSceneId,
    scenes,
    assembledWordCount: 10,
    draftedSceneCount: 1,
    missingDraftCount: 0,
    selectedScene,
    inspector: {
      selectedScene: {
        sceneId: selectedScene.sceneId,
        title: selectedScene.title,
        summary: selectedScene.summary,
        proseStatusLabel: selectedScene.proseStatusLabel,
        draftWordCount: selectedScene.draftWordCount,
        revisionQueueCount: 0,
        warningsCount: 0,
        latestDiffSummary: selectedScene.latestDiffSummary,
      },
      chapterReadiness: {
        draftedSceneCount: 1,
        missingDraftCount: 0,
        assembledWordCount: 10,
        warningsCount: 0,
        queuedRevisionCount: 0,
      },
    },
    dockSummary: {
      missingDraftCount: 0,
      warningsCount: 0,
      queuedRevisionCount: 0,
      missingDraftScenes: [],
      warningScenes: [],
      queuedRevisionScenes: [],
    },
  }
}
