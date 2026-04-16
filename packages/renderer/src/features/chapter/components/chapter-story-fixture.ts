import type { ChapterStructureWorkspaceViewModel } from '../types/chapter-view-models'

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
