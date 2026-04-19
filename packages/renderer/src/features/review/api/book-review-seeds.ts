import type { ReviewIssueSeverity } from '../types/review-view-models'

export type BookReviewSeedSource = 'scene-proposal' | 'chapter-draft' | 'traceability'
export type BookReviewSeedKind = 'scene_proposal' | 'chapter_annotation' | 'trace_gap'
export interface BookReviewSeedHandoff {
  label: string
  draftView: 'read'
  reviewIssueId?: string
}

export interface BookReviewSeedRecord {
  id: string
  severity: ReviewIssueSeverity
  source: BookReviewSeedSource
  kind: BookReviewSeedKind
  title: string
  detail: string
  chapterId?: string
  chapterTitle?: string
  chapterOrder?: number
  sceneId?: string
  sceneTitle?: string
  sceneOrder?: number
  assetId?: string
  assetTitle?: string
  handoff: BookReviewSeedHandoff
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
      handoff: {
        label: 'Open draft workspace',
        draftView: 'read',
      },
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
      handoff: {
        label: 'Open draft workspace',
        draftView: 'read',
      },
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
      handoff: {
        label: 'Open draft workspace',
        draftView: 'read',
      },
    },
  ],
}

export function getBookReviewSeeds(bookId: string): BookReviewSeedRecord[] {
  return structuredClone(mockBookReviewSeeds[bookId] ?? [])
}
