import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ProjectPersistedSnapshotV1 } from './project-persistence'
import { createLocalStorageProjectPersistence } from './local-storage-project-persistence'

const projectId = 'book-signal-arc'
const storageKey = `narrative-novel.project.${projectId}.v1`

function createSnapshot(): ProjectPersistedSnapshotV1 {
  return {
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
          note: 'Resolved',
          updatedAtLabel: '2026-04-20 12:00',
          updatedByLabel: 'Editor',
        },
      ],
    },
    reviewFixActionsByBookId: {
      [projectId]: [
        {
          id: `${projectId}::issue-1`,
          bookId: projectId,
          issueId: 'issue-1',
          issueSignature: 'signature-1',
          sourceHandoffId: 'handoff-1',
          sourceHandoffLabel: 'Open chapter draft',
          targetScope: 'chapter',
          status: 'checked',
          note: 'Verified',
          startedAtLabel: '2026-04-20 11:30',
          updatedAtLabel: '2026-04-20 12:00',
          updatedByLabel: 'Editor',
        },
      ],
    },
    bookExportArtifactsByBookId: {
      [projectId]: [
        {
          id: 'artifact-1',
          bookId: projectId,
          exportProfileId: 'profile-editorial-md',
          format: 'markdown',
          status: 'ready',
          filename: 'signal-arc.md',
          mimeType: 'text/markdown',
          title: 'Signal Arc',
          summary: 'Ready artifact',
          content: '# Signal Arc',
          sourceSignature: 'source-1',
          chapterCount: 1,
          sceneCount: 2,
          wordCount: 200,
          readinessSnapshot: {
            status: 'ready',
            blockerCount: 0,
            warningCount: 0,
            infoCount: 0,
          },
          reviewGateSnapshot: {
            openBlockerCount: 0,
            checkedFixCount: 1,
            blockedFixCount: 0,
            staleFixCount: 0,
          },
          createdAtLabel: '2026-04-20 12:00',
          createdByLabel: 'Editor',
        },
      ],
    },
    chapterRecordsById: {
      'chapter-signals-in-rain': {
        chapterId: 'chapter-signals-in-rain',
        title: {
          en: 'Signals in Rain',
          'zh-CN': '雨中信号',
        },
        summary: {
          en: 'Opening summary',
          'zh-CN': '开篇摘要',
        },
        scenes: [],
        inspector: {
          chapterNotes: [],
          problemsSummary: [],
          assemblyHints: [],
        },
      },
    },
  }
}

describe('localStorage project persistence', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    window.localStorage.clear()
  })

  it('saves loads and clears persisted snapshots with the project-scoped storage key', async () => {
    const persistence = createLocalStorageProjectPersistence()
    const snapshot = createSnapshot()

    await persistence.saveProjectSnapshot(projectId, snapshot)

    expect(window.localStorage.getItem(storageKey)).toBeTruthy()
    await expect(persistence.loadProjectSnapshot(projectId)).resolves.toEqual(snapshot)

    await persistence.clearProjectSnapshot(projectId)

    expect(window.localStorage.getItem(storageKey)).toBeNull()
    await expect(persistence.loadProjectSnapshot(projectId)).resolves.toBeNull()
  })

  it('returns null instead of crashing when stored JSON is invalid', async () => {
    const persistence = createLocalStorageProjectPersistence()
    window.localStorage.setItem(storageKey, '{broken json')

    await expect(persistence.loadProjectSnapshot(projectId)).resolves.toBeNull()
  })

  it('returns null when the stored snapshot schemaVersion is unsupported', async () => {
    const persistence = createLocalStorageProjectPersistence()
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        ...createSnapshot(),
        schemaVersion: 2,
      }),
    )

    await expect(persistence.loadProjectSnapshot(projectId)).resolves.toBeNull()
  })

  it('returns null when a schemaVersion 1 payload is missing required maps', async () => {
    const persistence = createLocalStorageProjectPersistence()
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        schemaVersion: 1,
        projectId,
        updatedAt: '2026-04-20T12:00:00.000Z',
      }),
    )

    await expect(persistence.loadProjectSnapshot(projectId)).resolves.toBeNull()
  })

  it('falls back to in-memory persistence when window is unavailable', async () => {
    vi.stubGlobal('window', undefined)
    const persistence = createLocalStorageProjectPersistence()
    const snapshot = createSnapshot()

    await persistence.saveProjectSnapshot(projectId, snapshot)
    await expect(persistence.loadProjectSnapshot(projectId)).resolves.toEqual(snapshot)

    await persistence.clearProjectSnapshot(projectId)
    await expect(persistence.loadProjectSnapshot(projectId)).resolves.toBeNull()
  })

  it('wraps save failures with project context instead of silently swallowing them', async () => {
    const persistence = createLocalStorageProjectPersistence()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded')
    })

    await expect(persistence.saveProjectSnapshot(projectId, createSnapshot())).rejects.toThrow(
      `Failed to save project snapshot for "${projectId}"`,
    )
  })

  it('returns null when storage reads fail', async () => {
    const persistence = createLocalStorageProjectPersistence()
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable')
    })

    await expect(persistence.loadProjectSnapshot(projectId)).resolves.toBeNull()
  })

  it('does not throw when storage remove fails', async () => {
    const persistence = createLocalStorageProjectPersistence()
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('storage unavailable')
    })

    await expect(persistence.clearProjectSnapshot(projectId)).resolves.toBeUndefined()
  })
})
