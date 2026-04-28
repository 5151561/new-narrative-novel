import { describe, expect, it, vi } from 'vitest'

import { resetMockBookExperimentBranchStore } from './book-experiment-branches'
import { resetMockBookManuscriptCheckpointStore } from './book-manuscript-checkpoints'
import {
  buildMockBookExportArtifact,
  exportMockBookExportArtifactSnapshot,
  getMockBookExportArtifacts,
  importMockBookExportArtifactSnapshot,
  resetMockBookExportArtifactDb,
} from './mock-book-export-artifact-db'
import { createBookClient } from './book-client'
import type { BookDraftAssemblyRecord } from './book-draft-assembly-records'

function createBuildInput(format: 'markdown' | 'plain_text' = 'markdown') {
  return {
    bookId: 'book-signal-arc',
    exportProfileId: 'profile-editorial-md',
    format,
    filename: format === 'markdown' ? 'signal-arc.md' : 'signal-arc.txt',
    mimeType: format === 'markdown' ? 'text/markdown' : 'text/plain',
    title: 'Signal Arc',
    summary: 'Artifact summary',
    content: format === 'markdown' ? '# Signal Arc' : 'Signal Arc',
    sourceSignature: `source-${format}`,
    chapterCount: 1,
    sceneCount: 1,
    wordCount: 88,
    readinessSnapshot: {
      status: 'ready' as const,
      blockerCount: 0,
      warningCount: 0,
      infoCount: 0,
    },
    reviewGateSnapshot: {
      openBlockerCount: 0,
      checkedFixCount: 0,
      blockedFixCount: 0,
      staleFixCount: 0,
    },
  }
}

function createDraftAssembly(): BookDraftAssemblyRecord {
  return {
    bookId: 'book-signal-arc',
    title: { en: 'Signal Arc', 'zh-CN': '信号弧线' },
    summary: { en: 'Current draft workspace', 'zh-CN': '当前正文工作区' },
    chapterCount: 1,
    sceneCount: 1,
    draftedSceneCount: 1,
    missingDraftSceneCount: 0,
    assembledWordCount: 12,
    chapters: [
      {
        chapterId: 'chapter-open-water-signals',
        order: 1,
        title: { en: 'Open Water Signals', 'zh-CN': '开阔水域信号' },
        summary: { en: 'Draft chapter', 'zh-CN': '草稿章节' },
        sceneCount: 1,
        draftedSceneCount: 1,
        missingDraftCount: 0,
        assembledWordCount: 12,
        warningsCount: 0,
        queuedRevisionCount: 0,
        tracedSceneCount: 1,
        missingTraceSceneCount: 0,
        scenes: [
          {
            kind: 'draft',
            sceneId: 'scene-dawn-slip',
            order: 1,
            title: { en: 'Dawn Slip', 'zh-CN': '拂晓撤离' },
            summary: { en: 'Current draft scene', 'zh-CN': '当前草稿场景' },
            proseStatusLabel: { en: 'Draft ready', 'zh-CN': '草稿就绪' },
            warningsCount: 0,
            draftWordCount: 12,
            traceReady: true,
            traceRollup: {
              acceptedFactCount: 0,
              relatedAssetCount: 0,
              sourceProposalCount: 1,
              missingLinks: [],
            },
            proseDraft: 'Current draft prose',
            sourceProposals: [],
            acceptedFactIds: [],
            relatedAssets: [],
          },
        ],
      },
    ],
    readableManuscript: {
      formatVersion: 'book-manuscript-assembly-v1',
      markdown: '# Signal Arc',
      plainText: 'Signal Arc',
      sections: [],
      sourceManifest: [],
    },
  }
}

describe('book export artifact data layer', () => {
  it('builds deterministic artifact ids and returns latest artifacts first', () => {
    resetMockBookExportArtifactDb()

    const first = buildMockBookExportArtifact(createBuildInput('markdown'))
    const second = buildMockBookExportArtifact(createBuildInput('plain_text'))

    expect(first.id).toBe('book-export-artifact-book-signal-arc-profile-editorial-md-markdown-1')
    expect(second.id).toBe('book-export-artifact-book-signal-arc-profile-editorial-md-plain_text-2')
    expect(getMockBookExportArtifacts({ bookId: 'book-signal-arc' }).map((artifact) => artifact.id)).toEqual([
      second.id,
      first.id,
    ])
  })

  it('resets artifact records and deterministic sequence', () => {
    resetMockBookExportArtifactDb()
    buildMockBookExportArtifact(createBuildInput('markdown'))

    resetMockBookExportArtifactDb()
    const rebuilt = buildMockBookExportArtifact(createBuildInput('markdown'))

    expect(rebuilt.id).toBe('book-export-artifact-book-signal-arc-profile-editorial-md-markdown-1')
    expect(getMockBookExportArtifacts({ bookId: 'missing-book' })).toEqual([])
  })

  it('clones inputs and outputs so callers cannot mutate the mock db', () => {
    resetMockBookExportArtifactDb()
    const input = createBuildInput('markdown')
    const artifact = buildMockBookExportArtifact(input)

    input.content = 'Mutated input'
    artifact.content = 'Mutated output'

    expect(getMockBookExportArtifacts({ bookId: 'book-signal-arc' })[0]).toMatchObject({
      content: '# Signal Arc',
    })
  })

  it('filters artifacts by export profile and checkpoint', () => {
    resetMockBookExportArtifactDb()
    buildMockBookExportArtifact(createBuildInput('markdown'))
    buildMockBookExportArtifact({
      ...createBuildInput('plain_text'),
      exportProfileId: 'profile-copyedit-text',
      checkpointId: 'checkpoint-1',
    })

    expect(
      getMockBookExportArtifacts({
        bookId: 'book-signal-arc',
        exportProfileId: 'profile-copyedit-text',
        checkpointId: 'checkpoint-1',
      }).map((artifact) => artifact.exportProfileId),
    ).toEqual(['profile-copyedit-text'])
    expect(getMockBookExportArtifacts({ bookId: 'book-signal-arc', checkpointId: 'checkpoint-1' })).toHaveLength(1)
    expect(getMockBookExportArtifacts({ bookId: 'book-signal-arc' })).toHaveLength(1)
  })

  it('exposes cloned artifact reads and build writes through the book client', async () => {
    resetMockBookExportArtifactDb()
    const client = createBookClient()

    await client.buildBookExportArtifact(createBuildInput('markdown'))
    const firstRead = await client.getBookExportArtifacts({ bookId: 'book-signal-arc' })
    firstRead[0]!.content = 'Mutated locally'
    const secondRead = await client.getBookExportArtifacts({ bookId: 'book-signal-arc' })

    expect(secondRead[0]).toMatchObject({
      content: '# Signal Arc',
    })
  })

  it('imports exported artifact snapshots and rebuilds the deterministic sequence', () => {
    resetMockBookExportArtifactDb()
    buildMockBookExportArtifact(createBuildInput('markdown'))
    const second = buildMockBookExportArtifact(createBuildInput('plain_text'))

    const snapshot = exportMockBookExportArtifactSnapshot()
    resetMockBookExportArtifactDb()
    importMockBookExportArtifactSnapshot(snapshot)
    snapshot['book-signal-arc']![0]!.title = 'Mutated snapshot'

    const rebuilt = buildMockBookExportArtifact(createBuildInput('markdown'))

    expect(getMockBookExportArtifacts({ bookId: 'book-signal-arc' }).map((artifact) => artifact.id)).toEqual([
      rebuilt.id,
      second.id,
      'book-export-artifact-book-signal-arc-profile-editorial-md-markdown-1',
    ])
    expect(rebuilt.id).toBe('book-export-artifact-book-signal-arc-profile-editorial-md-markdown-3')
    expect(getMockBookExportArtifacts({ bookId: 'book-signal-arc' })[1]?.title).toBe('Signal Arc')
  })

  it('creates manuscript checkpoints through the client and clones the returned record', async () => {
    const createBookManuscriptCheckpointRecord = vi.fn().mockReturnValue({
      checkpointId: 'checkpoint-book-signal-arc-new',
      bookId: 'book-signal-arc',
      title: { en: 'New checkpoint', 'zh-CN': '新 checkpoint' },
      createdAtLabel: { en: '2026-04-28 10:00', 'zh-CN': '2026-04-28 10:00' },
      createdFromRunId: 'run-scene-001',
      sourceSignature: 'draft-assembly:book-signal-arc:selected:chapter-open-water-signals',
      summary: { en: 'Snapshot summary', 'zh-CN': '快照摘要' },
      selectedChapterId: 'chapter-open-water-signals',
      chapters: [],
    })
    const client = createBookClient({
      createBookManuscriptCheckpointRecord,
    })

    const created = await client.createBookManuscriptCheckpoint({
      bookId: 'book-signal-arc',
      title: 'New checkpoint',
      summary: 'Snapshot summary',
      sourceSignature: 'draft-assembly:book-signal-arc:selected:chapter-open-water-signals',
      selectedChapterId: 'chapter-open-water-signals',
    })
    created.title.en = 'Mutated locally'

    expect(createBookManuscriptCheckpointRecord).toHaveBeenCalledWith({
      bookId: 'book-signal-arc',
      title: 'New checkpoint',
      summary: 'Snapshot summary',
      sourceSignature: 'draft-assembly:book-signal-arc:selected:chapter-open-water-signals',
      selectedChapterId: 'chapter-open-water-signals',
    })
    await expect(
      client.createBookManuscriptCheckpoint({
        bookId: 'book-signal-arc',
        title: 'Second checkpoint',
        summary: 'Second snapshot summary',
        sourceSignature: 'draft-assembly:book-signal-arc:selected:chapter-open-water-signals',
        selectedChapterId: 'chapter-open-water-signals',
      }),
    ).resolves.toMatchObject({
      title: { en: 'New checkpoint' },
    })
  })

  it('creates and archives experiment branches through the client without exposing mutable store state', async () => {
    const createBookExperimentBranchRecord = vi.fn().mockReturnValue({
      branchId: 'branch-book-signal-arc-fresh',
      bookId: 'book-signal-arc',
      title: { en: 'Fresh branch', 'zh-CN': '新分支' },
      summary: { en: 'Branch summary', 'zh-CN': '分支摘要' },
      rationale: { en: 'Branch rationale', 'zh-CN': '分支原因' },
      createdAtLabel: { en: '2026-04-28 10:10', 'zh-CN': '2026-04-28 10:10' },
      sourceSignature: 'checkpoint:checkpoint-book-signal-arc-pr11-baseline',
      basedOnCheckpointId: 'checkpoint-book-signal-arc-pr11-baseline',
      selectedChapterId: 'chapter-signals-in-rain',
      status: 'review' as const,
      chapterSnapshots: [],
    })
    const archiveBookExperimentBranchRecord = vi.fn().mockResolvedValue({
      branchId: 'branch-book-signal-arc-fresh',
      bookId: 'book-signal-arc',
      title: { en: 'Fresh branch', 'zh-CN': '新分支' },
      summary: { en: 'Branch summary', 'zh-CN': '分支摘要' },
      rationale: { en: 'Branch rationale', 'zh-CN': '分支原因' },
      createdAtLabel: { en: '2026-04-28 10:10', 'zh-CN': '2026-04-28 10:10' },
      sourceSignature: 'checkpoint:checkpoint-book-signal-arc-pr11-baseline',
      basedOnCheckpointId: 'checkpoint-book-signal-arc-pr11-baseline',
      selectedChapterId: 'chapter-signals-in-rain',
      status: 'archived' as const,
      archivedAtLabel: { en: '2026-04-28 10:12', 'zh-CN': '2026-04-28 10:12' },
      archiveNote: { en: 'Merged into review plan', 'zh-CN': '已并入审阅计划' },
      chapterSnapshots: [],
    })
    const client = createBookClient({
      createBookExperimentBranchRecord,
      archiveBookExperimentBranchRecord,
    })

    const created = await client.createBookExperimentBranch({
      bookId: 'book-signal-arc',
      title: 'Fresh branch',
      summary: 'Branch summary',
      rationale: 'Branch rationale',
      basedOnCheckpointId: 'checkpoint-book-signal-arc-pr11-baseline',
      selectedChapterId: 'chapter-signals-in-rain',
    })
    created.title.en = 'Mutated locally'
    const archived = await client.archiveBookExperimentBranch({
      bookId: 'book-signal-arc',
      branchId: 'branch-book-signal-arc-fresh',
      archiveNote: 'Merged into review plan',
    })

    expect(createBookExperimentBranchRecord).toHaveBeenCalledWith({
      bookId: 'book-signal-arc',
      title: 'Fresh branch',
      summary: 'Branch summary',
      rationale: 'Branch rationale',
      basedOnCheckpointId: 'checkpoint-book-signal-arc-pr11-baseline',
      selectedChapterId: 'chapter-signals-in-rain',
    })
    expect(archiveBookExperimentBranchRecord).toHaveBeenCalledWith({
      bookId: 'book-signal-arc',
      branchId: 'branch-book-signal-arc-fresh',
      archiveNote: 'Merged into review plan',
    })
    expect(archived.status).toBe('archived')
    expect(archived.archiveNote?.en).toBe('Merged into review plan')
  })

  it('provides functional default checkpoint and branch write methods when draft assembly data is available', async () => {
    resetMockBookManuscriptCheckpointStore()
    resetMockBookExperimentBranchStore()
    const client = createBookClient({
      getBookDraftAssemblyByBookId: () => createDraftAssembly(),
    })

    const checkpoint = await client.createBookManuscriptCheckpoint({
      bookId: 'book-signal-arc',
      title: 'Draft checkpoint',
      summary: 'Checkpoint from current draft.',
      sourceSignature: 'draft-assembly:book-signal-arc:selected:chapter-open-water-signals',
      selectedChapterId: 'chapter-open-water-signals',
    })
    const branch = await client.createBookExperimentBranch({
      bookId: 'book-signal-arc',
      title: 'Draft branch',
      summary: 'Branch from current draft.',
      rationale: 'Keep the current draft snapshot.',
      selectedChapterId: 'chapter-open-water-signals',
    })
    const archived = await client.archiveBookExperimentBranch({
      bookId: 'book-signal-arc',
      branchId: branch.branchId,
      archiveNote: 'Archived after review.',
    })

    expect(checkpoint.sourceSignature).toBe('draft-assembly:book-signal-arc:selected:chapter-open-water-signals')
    expect(checkpoint.selectedChapterId).toBe('chapter-open-water-signals')
    expect(branch.sourceSignature).toBe('draft-assembly:book-signal-arc:selected:chapter-open-water-signals')
    expect(branch.selectedChapterId).toBe('chapter-open-water-signals')
    expect(archived.status).toBe('archived')
    expect(archived.archiveNote?.en).toBe('Archived after review.')
  })
})
