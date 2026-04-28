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
    {
      id: 'continuity-conflict-ledger-public-proof',
      severity: 'blocker',
      source: 'continuity',
      kind: 'continuity_conflict',
      chapterId: 'chapter-signals-in-rain',
      chapterTitle: 'Signals in Rain',
      chapterOrder: 1,
      sceneId: 'scene-midnight-platform',
      sceneTitle: 'Midnight Platform',
      sceneOrder: 1,
      assetId: 'asset-ledger',
      assetTitle: 'Ledger',
      title: 'Ledger visibility conflicts with the public-proof beat',
      detail: 'The current review queue still shows the ledger as private while Midnight Platform prose implies the proof already went public.',
      recommendation: 'Review the continuity conflict in the inbox, then inspect the ledger profile and the scene execution notes before changing any source material.',
      sourceLabel: 'Continuity QA',
      sourceExcerpt: 'Midnight Platform prose treats the ledger proof as public, but the continuity ledger still marks it as withheld.',
      tags: ['Continuity conflict', 'Ledger'],
      handoffs: [
        createHandoff('continuity-conflict-ledger-public-proof::book-review', 'Open book review', {
          scope: 'book',
          lens: 'draft',
          view: 'sequence',
          draftView: 'review',
          selectedChapterId: 'chapter-signals-in-rain',
          reviewIssueId: 'continuity-conflict-ledger-public-proof',
        }),
        createHandoff('continuity-conflict-ledger-public-proof::asset-ledger', 'Open asset ledger', {
          scope: 'asset',
          assetId: 'asset-ledger',
          lens: 'knowledge',
          view: 'context',
        }),
        createHandoff('continuity-conflict-ledger-public-proof::scene-orchestrate', 'Open scene orchestrate', {
          scope: 'scene',
          sceneId: 'scene-midnight-platform',
          lens: 'orchestrate',
          tab: 'execution',
        }),
      ],
    },
    {
      id: 'missing-trace-departure-bell',
      severity: 'warning',
      source: 'traceability',
      kind: 'missing_trace',
      chapterId: 'chapter-open-water-signals',
      chapterTitle: 'Open Water Signals',
      chapterOrder: 2,
      sceneId: 'scene-departure-bell',
      sceneTitle: 'Departure Bell',
      sceneOrder: 4,
      title: 'Departure Bell has no trace references',
      detail: 'Departure Bell currently reads as draft prose, but it carries no scene-level trace references back to canon or proposals.',
      recommendation: 'Open the chapter draft and scene draft to restore the missing trace references before the next review pass.',
      sourceLabel: 'Traceability QA',
      sourceExcerpt: 'Departure Bell prose is readable, yet the trace chain is blank.',
      tags: ['Missing trace', 'Departure Bell'],
      handoffs: [
        createHandoff('missing-trace-departure-bell::chapter-draft', 'Open chapter draft', {
          scope: 'chapter',
          chapterId: 'chapter-open-water-signals',
          lens: 'draft',
          view: 'sequence',
          sceneId: 'scene-departure-bell',
        }),
        createHandoff('missing-trace-departure-bell::scene-draft', 'Open scene draft', {
          scope: 'scene',
          sceneId: 'scene-departure-bell',
          lens: 'draft',
          tab: 'prose',
        }),
      ],
    },
    {
      id: 'stale-prose-after-canon-midnight-platform',
      severity: 'warning',
      source: 'stale-prose',
      kind: 'stale_prose_after_canon_change',
      chapterId: 'chapter-signals-in-rain',
      chapterTitle: 'Signals in Rain',
      chapterOrder: 1,
      sceneId: 'scene-midnight-platform',
      sceneTitle: 'Midnight Platform',
      sceneOrder: 1,
      title: 'Midnight Platform prose is stale after canon changed',
      detail: 'The accepted canon facts moved after the last draft pass, but Midnight Platform prose still reflects the earlier ledger phrasing.',
      recommendation: 'Open the chapter draft and scene draft to refresh prose against the newer canon facts.',
      sourceLabel: 'Stale prose QA',
      sourceExcerpt: 'Current prose still uses the pre-change ledger wording.',
      tags: ['Stale prose', 'Canon drift'],
      handoffs: [
        createHandoff('stale-prose-after-canon-midnight-platform::chapter-draft', 'Open chapter draft', {
          scope: 'chapter',
          chapterId: 'chapter-signals-in-rain',
          lens: 'draft',
          view: 'sequence',
          sceneId: 'scene-midnight-platform',
        }),
        createHandoff('stale-prose-after-canon-midnight-platform::scene-draft', 'Open scene draft', {
          scope: 'scene',
          sceneId: 'scene-midnight-platform',
          lens: 'draft',
          tab: 'prose',
        }),
      ],
    },
    {
      id: 'chapter-gap-open-water-bridge',
      severity: 'warning',
      source: 'manuscript',
      kind: 'chapter_gap',
      chapterId: 'chapter-open-water-signals',
      chapterTitle: 'Open Water Signals',
      chapterOrder: 2,
      title: 'Open Water Signals is missing a readable bridge section',
      detail: 'The chapter still assembles without a readable bridge passage between its current scene drafts.',
      recommendation: 'Open chapter structure to inspect the gap, then review the assembled book draft to confirm the missing bridge is intentional.',
      sourceLabel: 'Manuscript continuity',
      sourceExcerpt: 'The current book draft jumps across Open Water Signals without a readable bridge section.',
      tags: ['Chapter gap', 'Readable manuscript'],
      handoffs: [
        createHandoff('chapter-gap-open-water-bridge::chapter-structure', 'Open chapter structure', {
          scope: 'chapter',
          chapterId: 'chapter-open-water-signals',
          lens: 'structure',
          view: 'sequence',
        }),
        createHandoff('chapter-gap-open-water-bridge::book-read', 'Open book draft read', {
          scope: 'book',
          lens: 'draft',
          view: 'sequence',
          draftView: 'read',
          selectedChapterId: 'chapter-open-water-signals',
          reviewIssueId: 'chapter-gap-open-water-bridge',
        }),
      ],
    },
    {
      id: 'asset-inconsistency-ledger-rule',
      severity: 'warning',
      source: 'asset-consistency',
      kind: 'asset_inconsistency',
      chapterId: 'chapter-signals-in-rain',
      chapterTitle: 'Signals in Rain',
      chapterOrder: 1,
      assetId: 'asset-ledger-rule',
      assetTitle: 'Ledger Rule',
      title: 'Ledger rule conflicts with current asset usage',
      detail: 'The ledger rule still marks the proof path as sealed, but the latest review issue trail references an already-open ledger exchange.',
      recommendation: 'Inspect the asset knowledge view and the current book review issue together before any follow-up fix work.',
      sourceLabel: 'Asset consistency QA',
      sourceExcerpt: 'Ledger rule and current review notes disagree about whether the proof can surface in public.',
      tags: ['Asset inconsistency', 'Ledger rule'],
      handoffs: [
        createHandoff('asset-inconsistency-ledger-rule::asset-knowledge', 'Open asset knowledge', {
          scope: 'asset',
          assetId: 'asset-ledger-rule',
          lens: 'knowledge',
          view: 'profile',
        }),
        createHandoff('asset-inconsistency-ledger-rule::book-review', 'Open book review', {
          scope: 'book',
          lens: 'draft',
          view: 'sequence',
          draftView: 'review',
          selectedChapterId: 'chapter-signals-in-rain',
          reviewIssueId: 'asset-inconsistency-ledger-rule',
        }),
      ],
    },
  ],
}

export function getBookReviewSeeds(bookId: string): BookReviewSeedRecord[] {
  return structuredClone(mockBookReviewSeeds[bookId] ?? [])
}
