import type { Locale } from '@/app/i18n'
import type { ChapterStructureWorkspaceData } from '@/features/chapter/types/chapter-view-models'

import { localizeChapterMockDatabase } from './chapter-fixtures.locale'

export interface ChapterMockDatabase {
  locale?: Locale
  chapters: Record<string, ChapterStructureWorkspaceData>
}

const baseDatabase: ChapterMockDatabase = {
  chapters: {
    'chapter-signals-in-rain': {
      chapterId: 'chapter-signals-in-rain',
      title: 'Signals in Rain',
      summary: 'Re-cut the same chapter through order, density, and assembly pressure without leaving the workbench.',
      sceneCount: 4,
      unresolvedCount: 8,
      scenes: [
        {
          id: 'scene-midnight-platform',
          order: 1,
          title: 'Midnight Platform',
          summary: 'Ren has to lock the bargain before the platform witness turns the ledger into public leverage.',
          purpose: 'Push the ledger bargain into a public stalemate without opening the ledger.',
          pov: 'Ren Voss',
          location: 'Eastbound platform',
          conflict: 'Ren needs leverage, Mei needs a higher price, and the witness keeps both of them public.',
          reveal: 'The courier signal stays legible only to Ren.',
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
          summary: 'A crowd bottleneck should slow the exit without resolving who controls the courier line.',
          purpose: 'Hold the exit timing back so the chapter can keep pressure for one more scene.',
          pov: 'Mei Arden',
          location: 'Concourse hall',
          conflict: 'The crowd slows everyone down, but Ren still cannot afford to lose initiative.',
          reveal: 'Witness pressure carries inward from the platform.',
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
          summary: 'The alias stays offstage while Mei tests whether Ren will trade certainty for speed.',
          purpose: 'Bring speed and certainty into the same beat without letting the alias surface.',
          pov: 'Ren Voss',
          location: 'Ticket window',
          conflict: 'Ren wants speed, Mei wants commitment first.',
          reveal: 'The alias still has not crossed into public knowledge.',
          statusLabel: 'Guarded',
          proseStatusLabel: 'Needs draft',
          runStatusLabel: 'Guarded',
          unresolvedCount: 1,
          lastRunLabel: 'Run 03',
        },
        {
          id: 'scene-departure-bell',
          order: 4,
          title: 'Departure Bell',
          summary: 'The chapter still needs a final bell placement that does not collapse the witness pressure too early.',
          purpose: 'Find an exit bell cue that preserves witness pressure to the final beat.',
          pov: 'Station Conductor',
          location: 'Departure gate',
          conflict: 'If the bell lands too early, the chapter’s confrontation loses pressure.',
          reveal: 'The ending still lacks a safe transition into motion.',
          statusLabel: 'Pending',
          proseStatusLabel: 'Queued for draft',
          runStatusLabel: 'Idle',
          unresolvedCount: 2,
          lastRunLabel: 'Not run',
        },
      ],
      inspector: {
        chapterNotes: [
          'Witness scrutiny belongs in the auxiliary context, not the stage copy.',
          'Ordering remains structural; no prose merge is implied here.',
        ],
        problemsSummary:
          'Open risks cluster around departure bell timing, courier-line ownership, and how long the alias can stay offstage.',
        assemblyHints: [
          'Carry platform witness pressure into the concourse instead of resolving it on the platform.',
          'Let Ticket Window sharpen the trade-off, not settle the ledger ownership question.',
        ],
      },
    },
    'chapter-open-water-signals': {
      chapterId: 'chapter-open-water-signals',
      title: 'Open Water Signals',
      summary: 'Stress-test the same chapter dataset across quieter handoff scenes and broader spatial transitions.',
      sceneCount: 3,
      unresolvedCount: 4,
      scenes: [
        {
          id: 'scene-warehouse-bridge',
          order: 1,
          title: 'Warehouse Bridge',
          summary: 'The first handoff stays tentative so the betrayal beat can remain deferred.',
          purpose: 'Keep the first handoff reversible so later betrayal pressure survives.',
          pov: 'Leya Marr',
          location: 'Warehouse bridge',
          conflict: 'Every move risks exposing the package owner too early.',
          reveal: 'The betrayal line still lives in gesture, not explicit dialogue.',
          statusLabel: 'Current',
          proseStatusLabel: 'Queued for draft',
          runStatusLabel: 'Running',
          unresolvedCount: 2,
          lastRunLabel: 'Run 04',
        },
        {
          id: 'scene-canal-watch',
          order: 2,
          title: 'Canal Watch',
          summary: 'A watchpoint scene should tighten trust pressure without proving the package owner.',
          purpose: 'Raise trust pressure while keeping ownership unresolved.',
          pov: 'Leya Marr',
          location: 'Canal watchpoint',
          conflict: 'Everyone knows the package matters, but nobody can admit who it belongs to first.',
          reveal: 'The real receiver remains hidden.',
          statusLabel: 'Queued',
          proseStatusLabel: 'Queued for draft',
          runStatusLabel: 'Idle',
          unresolvedCount: 1,
          lastRunLabel: 'Not run',
        },
        {
          id: 'scene-dawn-slip',
          order: 3,
          title: 'Dawn Slip',
          summary: 'The slipway exit still needs a cleaner transition between suspicion and motion.',
          purpose: 'Complete the turn from suspicion into motion.',
          pov: 'Watcher',
          location: 'Slipway exit',
          conflict: 'If motion arrives too early, the earlier caution stops mattering.',
          reveal: 'The exit path still lacks a convincing handoff.',
          statusLabel: 'Pending',
          proseStatusLabel: 'Queued for draft',
          runStatusLabel: 'Idle',
          unresolvedCount: 1,
          lastRunLabel: 'Not run',
        },
      ],
      inspector: {
        chapterNotes: [
          'Keep alternate views pointed at the same chapter identity.',
          'No dock runtime is introduced in this scaffold.',
        ],
        problemsSummary: 'Main risk: the transition from the warehouse handoff to the exit sequence is still too abrupt.',
        assemblyHints: ['Let Warehouse Bridge hesitation flow straight into Canal Watch instead of inventing a new suspense thread.'],
      },
    },
  },
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

export function createChapterMockDatabase(locale: Locale = 'en'): ChapterMockDatabase {
  return localizeChapterMockDatabase(locale, clone(baseDatabase)) as ChapterMockDatabase
}
