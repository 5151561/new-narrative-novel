import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { ApiRequestError } from './api-transport'
import type { AssetClient } from '@/features/asset/api/asset-client'
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
import { resetMockRunDb } from '@/features/run/api/mock-run-db'

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
  resetMockRunDb()
}

describe('mock project runtime', () => {
  beforeEach(() => {
    resetMockState()
    window.localStorage.clear()
  })

  afterEach(() => {
    resetMockState()
    window.localStorage.clear()
  })

  it('starts snapshot hydration as soon as the runtime is created', () => {
    const persistence = createMemoryPersistence()

    createMockProjectRuntime({ projectId, persistence })

    expect(persistence.loadCalls).toEqual([projectId])
  })

  it('exposes an injected asset client without changing mock persistence behavior', async () => {
    const assetWorkspace = { assetId: 'asset-lantern', asset: { id: 'asset-lantern' } } as Awaited<
      ReturnType<AssetClient['getAssetKnowledgeWorkspace']>
    >
    const assetClient: AssetClient = {
      async getAssetKnowledgeWorkspace() {
        return assetWorkspace
      },
    }
    const persistence = createMemoryPersistence()

    const runtime = createMockProjectRuntime({ projectId, assetClient, persistence })

    await expect(runtime.assetClient.getAssetKnowledgeWorkspace({ assetId: 'asset-lantern' })).resolves.toEqual(assetWorkspace)
    expect(runtime.persistence).toBe(persistence)
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
      runStatesByProjectId: {},
      runSceneSequencesByProjectId: {},
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

  it('exposes runClient and the seeded run uses context-packet and proposal-set refs', async () => {
    const runtime = createMockProjectRuntime({ projectId })

    expect(runtime.runClient).toBeDefined()

    const seededRun = await runtime.runClient.getRun({ runId: 'run-scene-midnight-platform-001' })
    const firstPage = await runtime.runClient.getRunEvents({
      runId: 'run-scene-midnight-platform-001',
      cursor: undefined,
    })
    const secondPage = await runtime.runClient.getRunEvents({
      runId: 'run-scene-midnight-platform-001',
      cursor: firstPage.nextCursor,
    })

    expect(seededRun).toMatchObject({
      id: 'run-scene-midnight-platform-001',
      status: 'waiting_review',
      pendingReviewId: 'review-scene-midnight-platform-001',
    })
    expect(firstPage.events.map((event) => event.kind)).toEqual([
      'run_created',
      'run_started',
      'context_packet_built',
      'agent_invocation_started',
    ])
    expect(firstPage.events[2]).toMatchObject({
      refs: [
        {
          kind: 'context-packet',
          id: 'ctx-scene-midnight-platform-run-001',
        },
      ],
    })
    expect(secondPage.events.some((event) => event.kind === 'proposal_created')).toBe(true)
    expect(secondPage.events.find((event) => event.kind === 'proposal_created')).toMatchObject({
      refs: [
        {
          kind: 'proposal-set',
          id: 'proposal-set-scene-midnight-platform-run-001',
        },
      ],
    })
  })

  it('returns deterministic event pages and cursor progression for run events', async () => {
    const runtime = createMockProjectRuntime({ projectId })

    const firstPage = await runtime.runClient.getRunEvents({
      runId: 'run-scene-midnight-platform-001',
      cursor: undefined,
    })
    const secondPage = await runtime.runClient.getRunEvents({
      runId: 'run-scene-midnight-platform-001',
      cursor: firstPage.nextCursor,
    })
    const thirdPage = await runtime.runClient.getRunEvents({
      runId: 'run-scene-midnight-platform-001',
      cursor: secondPage.nextCursor,
    })

    expect(firstPage.nextCursor).toBe('run-event-scene-midnight-platform-001-004')
    expect(secondPage.nextCursor).toBe('run-event-scene-midnight-platform-001-008')
    expect(thirdPage.nextCursor).toBeUndefined()
    expect(thirdPage.events.map((event) => event.kind)).toEqual(['review_requested'])
    expect(thirdPage.events[0]).toMatchObject({
      order: 9,
    })
  })

  it('startSceneRun creates a deterministic waiting-review run with deterministic events', async () => {
    const runtime = createMockProjectRuntime({ projectId, persistence: createMemoryPersistence() })

    const createdRun = await runtime.runClient.startSceneRun({
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
      note: 'Tighten the final beat.',
    })
    const createdEvents = await runtime.runClient.getRunEvents({
      runId: createdRun.id,
      cursor: undefined,
    })

    expect(createdRun).toMatchObject({
      id: 'run-scene-midnight-platform-002',
      scope: 'scene',
      scopeId: 'scene-midnight-platform',
      status: 'waiting_review',
      pendingReviewId: 'review-scene-midnight-platform-002',
      latestEventId: 'run-event-scene-midnight-platform-002-005',
      eventCount: 5,
    })
    expect(createdEvents.events.map((event) => event.kind)).toEqual([
      'run_created',
      'run_started',
      'context_packet_built',
      'proposal_created',
    ])
    expect(createdEvents.events[0]).toMatchObject({
      id: 'run-event-scene-midnight-platform-002-001',
      summary: 'Scene run was created in rewrite mode.',
    })
    expect(createdEvents.events[2]).toMatchObject({
      refs: [
        {
          kind: 'context-packet',
          id: 'ctx-scene-midnight-platform-run-002',
        },
      ],
    })
  })

  it('submitRunReviewDecision updates the run status and appends deterministic events', async () => {
    const runtime = createMockProjectRuntime({ projectId, persistence: createMemoryPersistence() })

    const completedRun = await runtime.runClient.submitRunReviewDecision({
      runId: 'run-scene-midnight-platform-001',
      reviewId: 'review-scene-midnight-platform-001',
      decision: 'accept-with-edit',
      note: 'Tighten the final beat.',
      patchId: 'patch-midnight-platform-001',
    })
    const refreshedRun = await runtime.runClient.getRun({ runId: 'run-scene-midnight-platform-001' })
    const finalPage = await runtime.runClient.getRunEvents({
      runId: 'run-scene-midnight-platform-001',
      cursor: 'run-event-scene-midnight-platform-001-008',
    })
    const completionPage = await runtime.runClient.getRunEvents({
      runId: 'run-scene-midnight-platform-001',
      cursor: finalPage.nextCursor,
    })

    expect(completedRun).toMatchObject({
      status: 'completed',
      pendingReviewId: undefined,
      latestEventId: 'run-event-scene-midnight-platform-001-013',
      eventCount: 13,
    })
    expect(refreshedRun).toEqual(completedRun)
    expect(finalPage.events.map((event) => event.kind)).toEqual([
      'review_requested',
      'review_decision_submitted',
      'canon_patch_applied',
      'prose_generated',
    ])
    expect(completionPage.events.map((event) => event.kind)).toEqual(['run_completed'])
  })

  it('returns a not-found style error when submitting a review decision for a missing run', async () => {
    const runtime = createMockProjectRuntime({ projectId })

    await expect(
      runtime.runClient.submitRunReviewDecision({
        runId: 'run-missing',
        reviewId: 'review-missing',
        decision: 'accept',
      }),
    ).rejects.toMatchObject<ApiRequestError>({
      status: 404,
      code: 'run-not-found',
    })
  })

  it('returns a conflict style error when the reviewId does not match the pending review', async () => {
    const runtime = createMockProjectRuntime({ projectId })

    await expect(
      runtime.runClient.submitRunReviewDecision({
        runId: 'run-scene-midnight-platform-001',
        reviewId: 'review-wrong',
        decision: 'accept',
      }),
    ).rejects.toMatchObject<ApiRequestError>({
      status: 409,
      code: 'run-review-conflict',
    })
  })

  it('request-rewrite clears pending review, keeps the run open, and appends only the decision event', async () => {
    const runtime = createMockProjectRuntime({ projectId, persistence: createMemoryPersistence() })

    const run = await runtime.runClient.submitRunReviewDecision({
      runId: 'run-scene-midnight-platform-001',
      reviewId: 'review-scene-midnight-platform-001',
      decision: 'request-rewrite',
      note: 'Revise the ending turn.',
    })
    const followupPage = await runtime.runClient.getRunEvents({
      runId: 'run-scene-midnight-platform-001',
      cursor: 'run-event-scene-midnight-platform-001-009',
    })

    expect(run).toMatchObject({
      status: 'running',
      pendingReviewId: undefined,
      completedAtLabel: undefined,
      latestEventId: 'run-event-scene-midnight-platform-001-010',
      eventCount: 10,
    })
    expect(followupPage.events.map((event) => event.kind)).toEqual(['review_decision_submitted'])
  })

  it('reject closes the run and appends review decision plus completion events', async () => {
    const runtime = createMockProjectRuntime({ projectId, persistence: createMemoryPersistence() })

    const run = await runtime.runClient.submitRunReviewDecision({
      runId: 'run-scene-midnight-platform-001',
      reviewId: 'review-scene-midnight-platform-001',
      decision: 'reject',
      note: 'Discard this proposal set.',
    })
    const followupPage = await runtime.runClient.getRunEvents({
      runId: 'run-scene-midnight-platform-001',
      cursor: 'run-event-scene-midnight-platform-001-009',
    })

    expect(run).toMatchObject({
      status: 'completed',
      pendingReviewId: undefined,
      latestEventId: 'run-event-scene-midnight-platform-001-011',
      eventCount: 11,
    })
    expect(followupPage.events.map((event) => event.kind)).toEqual([
      'review_decision_submitted',
      'run_completed',
    ])
  })

  it('persists run mutations and reloads them into a fresh runtime with the same persistence', async () => {
    const persistence = createMemoryPersistence()
    const runtime = createMockProjectRuntime({ projectId, persistence })

    const createdRun = await runtime.runClient.startSceneRun({
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
      note: 'Persist this run.',
    })
    await runtime.runClient.submitRunReviewDecision({
      runId: createdRun.id,
      reviewId: 'review-scene-midnight-platform-002',
      decision: 'accept',
      patchId: 'patch-midnight-platform-002',
    })

    resetMockState()

    const reloadedRuntime = createMockProjectRuntime({ projectId, persistence })
    const reloadedRun = await reloadedRuntime.runClient.getRun({
      runId: createdRun.id,
    })
    const reloadedEvents = await reloadedRuntime.runClient.getRunEvents({
      runId: createdRun.id,
      cursor: 'run-event-scene-midnight-platform-002-005',
    })

    expect(reloadedRun).toMatchObject({
      id: 'run-scene-midnight-platform-002',
      status: 'completed',
      pendingReviewId: undefined,
      latestEventId: 'run-event-scene-midnight-platform-002-009',
      eventCount: 9,
    })
    expect(reloadedEvents.events.map((event) => event.kind)).toEqual([
      'review_decision_submitted',
      'canon_patch_applied',
      'prose_generated',
      'run_completed',
    ])
  })

  it('resetMockRunDb prevents run state pollution between mock runtimes', async () => {
    const firstRuntime = createMockProjectRuntime({ projectId, persistence: createMemoryPersistence() })

    await firstRuntime.runClient.startSceneRun({
      sceneId: 'scene-lantern-alley',
      mode: 'from-scratch',
    })

    resetMockRunDb()

    const secondRuntime = createMockProjectRuntime({ projectId, persistence: createMemoryPersistence() })
    const missingStartedRun = await secondRuntime.runClient.getRun({
      runId: 'run-scene-lantern-alley-001',
    })
    const seededRun = await secondRuntime.runClient.getRun({
      runId: 'run-scene-midnight-platform-001',
    })

    expect(missingStartedRun).toBeNull()
    expect(seededRun).toMatchObject({
      id: 'run-scene-midnight-platform-001',
      eventCount: 9,
    })
  })
})
