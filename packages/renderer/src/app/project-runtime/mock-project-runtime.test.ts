import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  buildMockBookExportArtifact,
  getMockBookExportArtifacts,
  resetMockBookExportArtifactDb,
} from '@/features/book/api/mock-book-export-artifact-db'
import {
  getMockChapterRecordById,
  importMockChapterSnapshot,
  resetMockChapterDb,
} from '@/features/chapter/api/mock-chapter-db'
import {
  getMockBookReviewDecisions,
  resetMockReviewDecisionDb,
  setMockReviewIssueDecision,
} from '@/features/review/api/mock-review-decision-db'
import { resetMockReviewFixActionDb } from '@/features/review/api/mock-review-fix-action-db'

import { createMockProjectRuntime } from './mock-project-runtime'
import type { ProjectPersistedSnapshotV1, ProjectPersistencePort } from './project-persistence'

const projectId = 'book-signal-arc'

function createBuildInput(format: 'markdown' | 'plain_text' = 'markdown') {
  return {
    bookId: projectId,
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

function createMemoryPersistence(
  initialSnapshot: ProjectPersistedSnapshotV1 | null = null,
): ProjectPersistencePort & {
  loadCalls: string[]
  saves: ProjectPersistedSnapshotV1[]
} {
  let storedSnapshot = initialSnapshot ? structuredClone(initialSnapshot) : null
  const saves: ProjectPersistedSnapshotV1[] = []
  const loadCalls: string[] = []

  return {
    loadCalls,
    saves,
    async loadProjectSnapshot(requestedProjectId) {
      loadCalls.push(requestedProjectId)
      return storedSnapshot?.projectId === requestedProjectId ? structuredClone(storedSnapshot) : null
    },
    async saveProjectSnapshot(_requestedProjectId, snapshot) {
      const clonedSnapshot = structuredClone(snapshot)
      storedSnapshot = clonedSnapshot
      saves.push(clonedSnapshot)
    },
    async clearProjectSnapshot(requestedProjectId) {
      if (storedSnapshot?.projectId === requestedProjectId) {
        storedSnapshot = null
      }
    },
  }
}

function resetMockState() {
  resetMockReviewDecisionDb()
  resetMockReviewFixActionDb()
  resetMockBookExportArtifactDb()
  resetMockChapterDb()
}

describe('mock project runtime', () => {
  beforeEach(() => {
    resetMockState()
  })

  afterEach(() => {
    resetMockState()
  })

  it('starts snapshot hydration as soon as the runtime is created', () => {
    const persistence = createMemoryPersistence()

    createMockProjectRuntime({ projectId, persistence })

    expect(persistence.loadCalls).toEqual([projectId])
  })

  it('hydrates persisted snapshot data before reads in a fresh runtime', async () => {
    const persistence = createMemoryPersistence({
      schemaVersion: 1,
      projectId,
      updatedAt: '2026-04-20T12:00:00.000Z',
      reviewDecisionsByBookId: {
        [projectId]: [
          {
            id: `${projectId}::issue-1`,
            bookId: projectId,
            issueId: 'issue-1',
            issueSignature: 'signature-1',
            status: 'reviewed',
            note: 'Loaded from persistence',
            updatedAtLabel: '2026-04-20 12:00',
            updatedByLabel: 'Editor',
          },
        ],
      },
      reviewFixActionsByBookId: {},
      bookExportArtifactsByBookId: {
        [projectId]: [
          {
            id: 'book-export-artifact-book-signal-arc-profile-editorial-md-markdown-7',
            ...createBuildInput('markdown'),
            status: 'ready',
            createdAtLabel: '2026-04-20 12:00',
            createdByLabel: 'Editor',
          },
        ],
      },
      chapterRecordsById: {
        'chapter-signals-in-rain': {
          chapterId: 'chapter-signals-in-rain',
          title: {
            en: 'Hydrated chapter',
            'zh-CN': '已加载章节',
          },
          summary: {
            en: 'Hydrated summary',
            'zh-CN': '已加载摘要',
          },
          scenes: [],
          inspector: {
            chapterNotes: [],
            problemsSummary: [],
            assemblyHints: [],
          },
        },
      },
    })

    const runtime = createMockProjectRuntime({ projectId, persistence })

    await expect(runtime.reviewClient.getBookReviewDecisions({ bookId: projectId })).resolves.toEqual([
      expect.objectContaining({
        issueId: 'issue-1',
        note: 'Loaded from persistence',
      }),
    ])
    await expect(runtime.bookClient.getBookExportArtifacts({ bookId: projectId })).resolves.toEqual([
      expect.objectContaining({
        id: 'book-export-artifact-book-signal-arc-profile-editorial-md-markdown-7',
      }),
    ])
    await expect(runtime.chapterClient.getChapterStructureWorkspace({ chapterId: 'chapter-signals-in-rain' })).resolves.toMatchObject(
      {
        title: {
          en: 'Hydrated chapter',
        },
      },
    )
  })

  it('persists wrapped mock mutations and reloads them into a fresh runtime', async () => {
    const persistence = createMemoryPersistence()
    const runtime = createMockProjectRuntime({ projectId, persistence })

    await runtime.reviewClient.setReviewIssueDecision({
      bookId: projectId,
      issueId: 'issue-1',
      issueSignature: 'signature-1',
      status: 'reviewed',
      note: 'Persist this decision',
    })
    await runtime.reviewClient.clearReviewIssueDecision({
      bookId: projectId,
      issueId: 'issue-1',
    })
    await runtime.reviewClient.setReviewIssueFixAction({
      bookId: projectId,
      issueId: 'issue-2',
      issueSignature: 'signature-2',
      sourceHandoffId: 'handoff-2',
      sourceHandoffLabel: 'Open chapter draft',
      targetScope: 'chapter',
      status: 'started',
      note: 'Persist this fix action',
    })
    await runtime.reviewClient.clearReviewIssueFixAction({
      bookId: projectId,
      issueId: 'issue-2',
    })
    await runtime.bookClient.buildBookExportArtifact(createBuildInput('markdown'))
    await runtime.chapterClient.reorderChapterScene({
      chapterId: 'chapter-signals-in-rain',
      sceneId: 'scene-ticket-window',
      targetIndex: 0,
    })
    await runtime.chapterClient.updateChapterSceneStructure({
      chapterId: 'chapter-signals-in-rain',
      sceneId: 'scene-ticket-window',
      locale: 'en',
      patch: {
        summary: 'Persisted scene summary',
      },
    })

    expect(persistence.saves).toHaveLength(7)
    const savedSnapshot = persistence.saves.at(-1)
    expect(savedSnapshot?.reviewDecisionsByBookId).toEqual({})
    expect(savedSnapshot?.reviewFixActionsByBookId).toEqual({})
    expect(savedSnapshot?.bookExportArtifactsByBookId[projectId]).toEqual([
      expect.objectContaining({
        id: 'book-export-artifact-book-signal-arc-profile-editorial-md-markdown-1',
      }),
    ])
    expect(savedSnapshot?.chapterRecordsById['chapter-signals-in-rain']?.scenes.find((scene) => scene.id === 'scene-ticket-window')).toMatchObject({
      id: 'scene-ticket-window',
      order: 1,
      summary: {
        en: 'Persisted scene summary',
      },
    })

    resetMockState()

    const reloadedRuntime = createMockProjectRuntime({ projectId, persistence })

    await expect(reloadedRuntime.reviewClient.getBookReviewDecisions({ bookId: projectId })).resolves.toEqual([])
    await expect(reloadedRuntime.reviewClient.getBookReviewFixActions({ bookId: projectId })).resolves.toEqual([])
    await expect(reloadedRuntime.bookClient.getBookExportArtifacts({ bookId: projectId })).resolves.toEqual([
      expect.objectContaining({
        id: 'book-export-artifact-book-signal-arc-profile-editorial-md-markdown-1',
      }),
    ])
    const reloadedChapter = await reloadedRuntime.chapterClient.getChapterStructureWorkspace({
      chapterId: 'chapter-signals-in-rain',
    })
    expect(reloadedChapter?.scenes.find((scene) => scene.id === 'scene-ticket-window')).toMatchObject({
      id: 'scene-ticket-window',
      order: 1,
      summary: {
        en: 'Persisted scene summary',
      },
    })
  })

  it('saves only the current project bucket and chapter records', async () => {
    const persistence = createMemoryPersistence()

    setMockReviewIssueDecision({
      bookId: 'book-unrelated',
      issueId: 'issue-unrelated',
      issueSignature: 'signature-unrelated',
      status: 'dismissed',
      note: 'Should not persist into this project snapshot',
    })
    buildMockBookExportArtifact({
      ...createBuildInput('plain_text'),
      bookId: 'book-unrelated',
      exportProfileId: 'profile-unrelated',
      sourceSignature: 'source-unrelated',
    })
    importMockChapterSnapshot({
      'chapter-unrelated': {
        chapterId: 'chapter-unrelated',
        title: {
          en: 'Unrelated chapter',
          'zh-CN': '无关章节',
        },
        summary: {
          en: 'Unrelated summary',
          'zh-CN': '无关摘要',
        },
        scenes: [],
        inspector: {
          chapterNotes: [],
          problemsSummary: [],
          assemblyHints: [],
        },
      },
    })

    const runtime = createMockProjectRuntime({ projectId, persistence })

    await runtime.reviewClient.setReviewIssueDecision({
      bookId: projectId,
      issueId: 'issue-current',
      issueSignature: 'signature-current',
      status: 'reviewed',
      note: 'Current project only',
    })

    const savedSnapshot = persistence.saves.at(-1)
    expect(savedSnapshot?.reviewDecisionsByBookId).toEqual({
      [projectId]: [
        expect.objectContaining({
          issueId: 'issue-current',
        }),
      ],
    })
    expect(savedSnapshot?.reviewDecisionsByBookId).not.toHaveProperty('book-unrelated')
    expect(savedSnapshot?.bookExportArtifactsByBookId).not.toHaveProperty('book-unrelated')
    expect(savedSnapshot?.chapterRecordsById).not.toHaveProperty('chapter-unrelated')
    expect(Object.keys(savedSnapshot?.chapterRecordsById ?? {}).sort()).toEqual([
      'chapter-open-water-signals',
      'chapter-signals-in-rain',
    ])
  })

  it('rolls back current project mutations when persistence save fails', async () => {
    setMockReviewIssueDecision({
      bookId: projectId,
      issueId: 'issue-existing',
      issueSignature: 'signature-existing',
      status: 'deferred',
      note: 'Existing decision',
    })
    buildMockBookExportArtifact(createBuildInput('markdown'))
    importMockChapterSnapshot({
      'chapter-signals-in-rain': {
        ...getMockChapterRecordById('chapter-signals-in-rain')!,
        scenes: getMockChapterRecordById('chapter-signals-in-rain')!.scenes.map((scene) =>
          scene.id === 'scene-ticket-window'
            ? {
                ...scene,
                summary: {
                  ...scene.summary,
                  en: 'Existing chapter summary',
                },
              }
            : scene,
        ),
      },
    })

    const persistence: ProjectPersistencePort = {
      async loadProjectSnapshot() {
        return null
      },
      async saveProjectSnapshot() {
        throw new Error('save failed')
      },
      async clearProjectSnapshot() {},
    }

    const runtime = createMockProjectRuntime({ projectId, persistence })

    await expect(
      runtime.reviewClient.setReviewIssueDecision({
        bookId: projectId,
        issueId: 'issue-new',
        issueSignature: 'signature-new',
        status: 'reviewed',
        note: 'Should roll back',
      }),
    ).rejects.toThrow('save failed')
    expect(getMockBookReviewDecisions(projectId)).toEqual([
      expect.objectContaining({
        issueId: 'issue-existing',
        note: 'Existing decision',
      }),
    ])

    await expect(runtime.bookClient.buildBookExportArtifact(createBuildInput('plain_text'))).rejects.toThrow('save failed')
    expect(getMockBookExportArtifacts({ bookId: projectId }).map((artifact) => artifact.format)).toEqual(['markdown'])

    await expect(
      runtime.chapterClient.updateChapterSceneStructure({
        chapterId: 'chapter-signals-in-rain',
        sceneId: 'scene-ticket-window',
        locale: 'en',
        patch: {
          summary: 'Should roll back chapter mutation',
        },
      }),
    ).rejects.toThrow('save failed')
    expect(
      getMockChapterRecordById('chapter-signals-in-rain')?.scenes.find((scene) => scene.id === 'scene-ticket-window')?.summary.en,
    ).toBe('Existing chapter summary')
  })
})
