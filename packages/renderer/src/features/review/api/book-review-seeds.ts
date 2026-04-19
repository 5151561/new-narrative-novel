import type {
  ReviewIssueKind,
  ReviewIssueSeverity,
  ReviewIssueSource,
  ReviewSourceHandoffViewModel,
} from '../types/review-view-models'

export interface BookReviewSeedRecord {
  id: string
  severity: ReviewIssueSeverity
  source: ReviewIssueSource
  kind: ReviewIssueKind
  title: string
  detail: string
  recommendation: string
  chapterId?: string
  chapterTitle?: string
  chapterOrder?: number
  sceneId?: string
  sceneTitle?: string
  sceneOrder?: number
  assetId?: string
  assetTitle?: string
  sourceLabel: string
  sourceExcerpt?: string
  tags: string[]
  handoffs: ReviewSourceHandoffViewModel[]
}

function createHandoff(id: string, label: string, target: ReviewSourceHandoffViewModel['target']): ReviewSourceHandoffViewModel {
  return { id, label, target }
}

export const mockBookReviewSeeds: Record<string, BookReviewSeedRecord[]> = {
  'book-signal-arc': [
    {
      id: 'scene-proposal-seed-scene-5',
      severity: 'warning',
      source: 'scene-proposal',
      kind: 'scene_proposal',
      chapterId: 'chapter-2',
      chapterTitle: 'Chapter Two',
      chapterOrder: 2,
      sceneId: 'scene-5',
      sceneTitle: 'Scene Five',
      sceneOrder: 3,
      title: 'Scene proposal needs review',
      detail: 'Scene Five is still waiting for proposal review before it can settle into the draft.',
      recommendation: 'Review the scene proposal execution notes before settling it into the manuscript draft.',
      sourceLabel: 'Scene proposal',
      sourceExcerpt: 'Scene Five still carries an execution proposal that has not been folded back into the manuscript.',
      tags: ['Scene proposal', 'Execution'],
      handoffs: [
        createHandoff('scene-proposal-seed-scene-5::scene', 'Open scene proposal', {
          scope: 'scene',
          sceneId: 'scene-5',
          lens: 'orchestrate',
          tab: 'execution',
        }),
        createHandoff('scene-proposal-seed-scene-5::chapter', 'Open chapter draft', {
          scope: 'chapter',
          chapterId: 'chapter-2',
          lens: 'draft',
          view: 'sequence',
          sceneId: 'scene-5',
        }),
      ],
    },
    {
      id: 'chapter-annotation-seed-chapter-1',
      severity: 'warning',
      source: 'chapter-draft',
      kind: 'chapter_annotation',
      chapterId: 'chapter-1',
      chapterTitle: 'Chapter One',
      chapterOrder: 1,
      title: 'Chapter annotation needs follow-up',
      detail: 'Chapter One still carries a draft annotation that needs editorial follow-up.',
      recommendation: 'Open the chapter draft and resolve the outstanding annotation before the next review pass.',
      sourceLabel: 'Chapter draft annotation',
      sourceExcerpt: 'Editorial note: confirm whether the opening pressure beat should stay in Chapter One or move downstream.',
      tags: ['Annotation', 'Chapter draft'],
      handoffs: [
        createHandoff('chapter-annotation-seed-chapter-1::chapter-draft', 'Open chapter draft', {
          scope: 'chapter',
          chapterId: 'chapter-1',
          lens: 'draft',
          view: 'sequence',
        }),
        createHandoff('chapter-annotation-seed-chapter-1::chapter-structure', 'Open chapter structure', {
          scope: 'chapter',
          chapterId: 'chapter-1',
          lens: 'structure',
          view: 'sequence',
        }),
      ],
    },
    {
      id: 'trace-gap-seed-asset-ledger',
      severity: 'warning',
      source: 'traceability',
      kind: 'trace_gap',
      assetId: 'asset-ledger',
      assetTitle: 'Ledger',
      chapterId: 'chapter-1',
      chapterTitle: 'Chapter One',
      chapterOrder: 1,
      sceneId: 'scene-2',
      sceneTitle: 'Scene Two',
      sceneOrder: 2,
      title: 'Asset trace gap noted',
      detail: 'The Ledger reference still needs a traceability note in Scene Two.',
      recommendation: 'Review the asset profile and patch the missing trace coverage in the related draft scene.',
      sourceLabel: 'Asset trace note',
      sourceExcerpt: 'Ledger appears in Scene Two, but the current manuscript still lacks a matching traceability note.',
      tags: ['Trace gap', 'Asset'],
      handoffs: [
        createHandoff('trace-gap-seed-asset-ledger::asset', 'Open asset profile', {
          scope: 'asset',
          assetId: 'asset-ledger',
          lens: 'knowledge',
          view: 'profile',
        }),
        createHandoff('trace-gap-seed-asset-ledger::chapter', 'Open chapter draft', {
          scope: 'chapter',
          chapterId: 'chapter-1',
          lens: 'draft',
          view: 'sequence',
          sceneId: 'scene-2',
        }),
      ],
    },
  ],
}

export function getBookReviewSeeds(bookId: string): BookReviewSeedRecord[] {
  return structuredClone(mockBookReviewSeeds[bookId] ?? [])
}
