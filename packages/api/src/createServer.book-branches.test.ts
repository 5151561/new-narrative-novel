import { describe, expect, it } from 'vitest'

import type { FixtureRepositoryProjectStatePersistence } from './repositories/fixtureRepository.js'
import { createTestServer } from './test/support/test-server.js'
import { withTestServer } from './test/support/test-server.js'

describe('book checkpoint and branch routes', () => {
  it('creates manuscript checkpoints and experiment branches, then persists follow-up reads', async () => {
    await withTestServer(async ({ app }) => {
      const checkpointResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/manuscript-checkpoints',
        payload: {
          bookId: 'book-signal-arc',
          title: 'Bundle C1 checkpoint',
          summary: 'Created from the current draft workspace during route coverage.',
          sourceSignature: 'draft-assembly:book-signal-arc:selected:chapter-open-water-signals',
          selectedChapterId: 'chapter-open-water-signals',
        },
      })

      expect(checkpointResponse.statusCode).toBe(200)
      expect(checkpointResponse.json()).toMatchObject({
        checkpointId: expect.any(String),
        bookId: 'book-signal-arc',
        title: {
          en: 'Bundle C1 checkpoint',
        },
        summary: {
          en: 'Created from the current draft workspace during route coverage.',
        },
        sourceSignature: 'draft-assembly:book-signal-arc:selected:chapter-open-water-signals',
        selectedChapterId: 'chapter-open-water-signals',
        chapters: expect.arrayContaining([
          expect.objectContaining({
            chapterId: 'chapter-signals-in-rain',
            scenes: expect.arrayContaining([
              expect.objectContaining({
                sceneId: 'scene-concourse-delay',
              }),
            ]),
          }),
        ]),
      })

      const checkpointListResponse = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/manuscript-checkpoints',
      })

      expect(checkpointListResponse.statusCode).toBe(200)
      expect(checkpointListResponse.json()).toContainEqual(
        expect.objectContaining({
          title: expect.objectContaining({
            en: 'Bundle C1 checkpoint',
          }),
        }),
      )

      const branchResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/experiment-branches',
        payload: {
          bookId: 'book-signal-arc',
          title: 'Checkpoint-based branch',
          summary: 'Created from the baseline checkpoint.',
          rationale: 'Keep the old river ledger beat available for review.',
          basedOnCheckpointId: 'checkpoint-book-signal-arc-pr11-baseline',
          selectedChapterId: 'chapter-open-water-signals',
        },
      })

      expect(branchResponse.statusCode).toBe(200)
      expect(branchResponse.json()).toMatchObject({
        branchId: expect.any(String),
        bookId: 'book-signal-arc',
        title: {
          en: 'Checkpoint-based branch',
        },
        sourceSignature: 'checkpoint:checkpoint-book-signal-arc-pr11-baseline',
        basedOnCheckpointId: 'checkpoint-book-signal-arc-pr11-baseline',
        selectedChapterId: 'chapter-open-water-signals',
        chapterSnapshots: expect.arrayContaining([
          expect.objectContaining({
            chapterId: 'chapter-signals-in-rain',
            sceneSnapshots: expect.arrayContaining([
              expect.objectContaining({
                sceneId: 'scene-midnight-platform',
              }),
            ]),
          }),
        ]),
      })
      expect(
        branchResponse
          .json()
          .chapterSnapshots
          .flatMap((chapter: { sceneSnapshots: Array<{ sceneId: string }> }) => chapter.sceneSnapshots.map((scene) => scene.sceneId)),
      ).not.toContain('scene-concourse-delay')

      const currentBranchResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/experiment-branches',
        payload: {
          bookId: 'book-signal-arc',
          title: 'Current draft branch',
          summary: 'Created from the current draft workspace.',
          rationale: 'Keep the latest dawn withdrawal instead of the checkpoint-only legacy scene.',
          selectedChapterId: 'chapter-signals-in-rain',
        },
      })

      expect(currentBranchResponse.statusCode).toBe(200)
      expect(currentBranchResponse.json()).toMatchObject({
        sourceSignature: 'draft-assembly:book-signal-arc:selected:chapter-signals-in-rain',
        chapterSnapshots: expect.arrayContaining([
          expect.objectContaining({
            chapterId: 'chapter-signals-in-rain',
            sceneSnapshots: expect.arrayContaining([
              expect.objectContaining({
                sceneId: 'scene-concourse-delay',
              }),
            ]),
          }),
        ]),
      })
      const archivedBranchResponse = await app.inject({
        method: 'POST',
        url: `/api/projects/book-signal-arc/books/book-signal-arc/experiment-branches/${branchResponse.json().branchId}/archive`,
        payload: {
          bookId: 'book-signal-arc',
          branchId: branchResponse.json().branchId,
          archiveNote: 'Merged into the review plan.',
        },
      })

      expect(archivedBranchResponse.statusCode).toBe(200)
      expect(archivedBranchResponse.json()).toMatchObject({
        branchId: branchResponse.json().branchId,
        status: 'archived',
        archiveNote: {
          en: 'Merged into the review plan.',
        },
        archivedAtLabel: {
          en: expect.any(String),
        },
      })

      const archivedBranchGetResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/books/book-signal-arc/experiment-branches/${branchResponse.json().branchId}`,
      })

      expect(archivedBranchGetResponse.statusCode).toBe(200)
      expect(archivedBranchGetResponse.json()).toMatchObject({
        status: 'archived',
      })
    })
  })

  it('rejects book id mismatches on checkpoint, branch, and archive writes', async () => {
    await withTestServer(async ({ app }) => {
      const checkpointResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/manuscript-checkpoints',
        payload: {
          bookId: 'wrong-book',
          title: 'Invalid checkpoint',
          summary: 'Should fail.',
          sourceSignature: 'invalid',
          selectedChapterId: 'chapter-open-water-signals',
        },
      })

      expect(checkpointResponse.statusCode).toBe(400)
      expect(checkpointResponse.json()).toMatchObject({
        code: 'BOOK_ID_MISMATCH',
      })

      const branchResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/experiment-branches',
        payload: {
          bookId: 'wrong-book',
          title: 'Invalid branch',
          summary: 'Should fail.',
          rationale: 'Should fail.',
          selectedChapterId: 'chapter-open-water-signals',
        },
      })

      expect(branchResponse.statusCode).toBe(400)
      expect(branchResponse.json()).toMatchObject({
        code: 'BOOK_ID_MISMATCH',
      })

      const archiveResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/experiment-branches/branch-book-signal-arc-quiet-ending/archive',
        payload: {
          bookId: 'wrong-book',
          branchId: 'branch-book-signal-arc-quiet-ending',
          archiveNote: 'Should fail.',
        },
      })

      expect(archiveResponse.statusCode).toBe(400)
      expect(archiveResponse.json()).toMatchObject({
        code: 'BOOK_ID_MISMATCH',
      })
    })
  })

  it('records adopted and blocked branch adoptions without mutating manuscript data', async () => {
    await withTestServer(async ({ app }) => {
      const branchResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/experiment-branches',
        payload: {
          bookId: 'book-signal-arc',
          title: 'Adoption validation branch',
          summary: 'Created for branch adoption validation coverage.',
          rationale: 'Exercise adopted and blocked branch adoptions.',
          selectedChapterId: 'chapter-signals-in-rain',
        },
      })

      expect(branchResponse.statusCode).toBe(200)
      const branchId = branchResponse.json().branchId as string

      const adoptedResponse = await app.inject({
        method: 'POST',
        url: `/api/projects/book-signal-arc/books/book-signal-arc/experiment-branches/${branchId}/adoptions`,
        payload: {
          bookId: 'book-signal-arc',
          branchId,
          chapterId: 'chapter-signals-in-rain',
          sceneId: 'scene-midnight-platform',
          kind: 'canon_patch',
          summary: 'Adopt the current canon patch for the platform bargain.',
          sourceSignature: `branch:${branchId}:scene-midnight-platform:canon-patch`,
        },
      })

      expect(adoptedResponse.statusCode).toBe(200)
      expect(adoptedResponse.json()).toMatchObject({
        adoptionId: expect.any(String),
        branchId,
        bookId: 'book-signal-arc',
        chapterId: 'chapter-signals-in-rain',
        sceneId: 'scene-midnight-platform',
        kind: 'canon_patch',
        status: 'adopted',
        summary: {
          en: 'Adopt the current canon patch for the platform bargain.',
        },
        sourceSignature: `branch:${branchId}:scene-midnight-platform:canon-patch`,
      })

      const blockedResponse = await app.inject({
        method: 'POST',
        url: `/api/projects/book-signal-arc/books/book-signal-arc/experiment-branches/${branchId}/adoptions`,
        payload: {
          bookId: 'book-signal-arc',
          branchId,
          chapterId: 'chapter-signals-in-rain',
          sceneId: 'scene-concourse-delay',
          kind: 'canon_patch',
          summary: 'This scene has no source proposal support.',
          sourceSignature: `branch:${branchId}:scene-concourse-delay:canon-patch`,
        },
      })

      expect(blockedResponse.statusCode).toBe(200)
      expect(blockedResponse.json()).toMatchObject({
        branchId,
        sceneId: 'scene-concourse-delay',
        kind: 'canon_patch',
        status: 'blocked',
      })

      const branchReadResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/books/book-signal-arc/experiment-branches/${branchId}`,
      })

      expect(branchReadResponse.statusCode).toBe(200)
      expect(branchReadResponse.json()).toMatchObject({
        branchId,
        adoptions: [
          expect.objectContaining({
            sceneId: 'scene-midnight-platform',
            kind: 'canon_patch',
            status: 'adopted',
          }),
          expect.objectContaining({
            sceneId: 'scene-concourse-delay',
            kind: 'canon_patch',
            status: 'blocked',
          }),
        ],
      })
      expect(
        branchReadResponse
          .json()
          .chapterSnapshots.find((chapter: { chapterId: string }) => chapter.chapterId === 'chapter-signals-in-rain')
          .sceneSnapshots.find((scene: { sceneId: string }) => scene.sceneId === 'scene-midnight-platform').proseDraft.en,
      ).toContain('Ren lets the rain hide the count')
    })
  })

  it('returns blocked adoption records for missing prose scenes and archived branches', async () => {
    await withTestServer(async ({ app }) => {
      const branchResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/experiment-branches',
        payload: {
          bookId: 'book-signal-arc',
          title: 'Archived adoption branch',
          summary: 'Created for archived branch adoption validation coverage.',
          rationale: 'Exercise archived branch adoption blocking.',
          selectedChapterId: 'chapter-signals-in-rain',
        },
      })

      expect(branchResponse.statusCode).toBe(200)
      const branchId = branchResponse.json().branchId as string

      const missingDraftResponse = await app.inject({
        method: 'POST',
        url: `/api/projects/book-signal-arc/books/book-signal-arc/experiment-branches/${branchId}/adoptions`,
        payload: {
          bookId: 'book-signal-arc',
          branchId,
          chapterId: 'chapter-signals-in-rain',
          sceneId: 'scene-concourse-delay',
          kind: 'prose_draft',
          summary: 'Should block because the branch prose draft is empty.',
          sourceSignature: `branch:${branchId}:scene-concourse-delay:prose-draft`,
        },
      })

      expect(missingDraftResponse.statusCode).toBe(200)
      expect(missingDraftResponse.json()).toMatchObject({
        sceneId: 'scene-concourse-delay',
        kind: 'prose_draft',
        status: 'blocked',
      })

      const archivedResponse = await app.inject({
        method: 'POST',
        url: `/api/projects/book-signal-arc/books/book-signal-arc/experiment-branches/${branchId}/archive`,
        payload: {
          bookId: 'book-signal-arc',
          branchId,
          archiveNote: 'Archive before adoption validation.',
        },
      })

      expect(archivedResponse.statusCode).toBe(200)

      const archivedAdoptionResponse = await app.inject({
        method: 'POST',
        url: `/api/projects/book-signal-arc/books/book-signal-arc/experiment-branches/${branchId}/adoptions`,
        payload: {
          bookId: 'book-signal-arc',
          branchId,
          chapterId: 'chapter-signals-in-rain',
          sceneId: 'scene-midnight-platform',
          kind: 'prose_draft',
          summary: 'Should block because the branch is archived.',
          sourceSignature: `branch:${branchId}:scene-midnight-platform:prose-draft`,
        },
      })

      expect(archivedAdoptionResponse.statusCode).toBe(200)
      expect(archivedAdoptionResponse.json()).toMatchObject({
        kind: 'prose_draft',
        status: 'blocked',
      })
    })
  })

  it('rejects invalid adoption kinds before persistence', async () => {
    await withTestServer(async ({ app }) => {
      const branchResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/experiment-branches',
        payload: {
          bookId: 'book-signal-arc',
          title: 'Invalid adoption kind branch',
          summary: 'Created for invalid kind validation coverage.',
          rationale: 'Exercise runtime validation for adoption kind.',
          selectedChapterId: 'chapter-signals-in-rain',
        },
      })

      expect(branchResponse.statusCode).toBe(200)
      const branchId = branchResponse.json().branchId as string

      const invalidKindResponse = await app.inject({
        method: 'POST',
        url: `/api/projects/book-signal-arc/books/book-signal-arc/experiment-branches/${branchId}/adoptions`,
        payload: {
          bookId: 'book-signal-arc',
          branchId,
          chapterId: 'chapter-signals-in-rain',
          sceneId: 'scene-midnight-platform',
          kind: 'invalid',
          summary: 'Should never persist.',
          sourceSignature: `branch:${branchId}:scene-midnight-platform:invalid`,
        },
      })

      expect(invalidKindResponse.statusCode).toBe(400)
      expect(invalidKindResponse.json()).toMatchObject({
        code: 'BOOK_EXPERIMENT_BRANCH_ADOPTION_KIND_INVALID',
      })

      const branchReadResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/books/book-signal-arc/experiment-branches/${branchId}`,
      })

      expect(branchReadResponse.statusCode).toBe(200)
      expect(branchReadResponse.json().adoptions ?? []).toEqual([])
    })
  })

  it('persists checkpoint and branch overlays across repository reloads', async () => {
    type OverlayEnvelope = Awaited<ReturnType<FixtureRepositoryProjectStatePersistence['load']>>
    type OverlayRecord = OverlayEnvelope['projects'][string]

    const persistenceEnvelope: OverlayEnvelope = {
      schemaVersion: 1,
      seedVersion: 'bundle-c1-test',
      projects: {},
    }
    const persistence: FixtureRepositoryProjectStatePersistence = {
      async load() {
        return structuredClone(persistenceEnvelope)
      },
      async saveProjectOverlay(projectId: string, overlay: OverlayRecord) {
        persistenceEnvelope.projects[projectId] = structuredClone(overlay)
      },
      async clearProjectOverlay(projectId: string) {
        delete persistenceEnvelope.projects[projectId]
      },
    }
    const firstServer = createTestServer({
      projectStatePersistence: persistence,
    })

    let createdCheckpointId = ''
    let createdBranchId = ''

    try {
      const checkpointResponse = await firstServer.app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/manuscript-checkpoints',
        payload: {
          bookId: 'book-signal-arc',
          title: 'Persisted checkpoint',
          summary: 'Should survive overlay reload.',
          sourceSignature: 'draft-assembly:book-signal-arc:selected:chapter-open-water-signals',
          selectedChapterId: 'chapter-open-water-signals',
        },
      })
      expect(checkpointResponse.statusCode).toBe(200)
      createdCheckpointId = checkpointResponse.json().checkpointId

      const branchResponse = await firstServer.app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/experiment-branches',
        payload: {
          bookId: 'book-signal-arc',
          title: 'Persisted branch',
          summary: 'Should survive overlay reload.',
          rationale: 'Exercise repository overlay persistence.',
          basedOnCheckpointId: createdCheckpointId,
          selectedChapterId: 'chapter-open-water-signals',
        },
      })
      expect(branchResponse.statusCode).toBe(200)
      createdBranchId = branchResponse.json().branchId

      const archiveResponse = await firstServer.app.inject({
        method: 'POST',
        url: `/api/projects/book-signal-arc/books/book-signal-arc/experiment-branches/${createdBranchId}/archive`,
        payload: {
          bookId: 'book-signal-arc',
          branchId: createdBranchId,
          archiveNote: 'Persist this archive metadata.',
        },
      })
      expect(archiveResponse.statusCode).toBe(200)
      expect(persistenceEnvelope.projects['book-signal-arc']).toMatchObject({
        manuscriptCheckpoints: expect.any(Object),
        experimentBranches: expect.any(Object),
      })
    } finally {
      await firstServer.app.close()
      await firstServer.cleanupProjectStateFile()
    }

    const secondServer = createTestServer({
      projectStatePersistence: persistence,
    })

    try {
      const [checkpointListResponse, archivedBranchResponse] = await Promise.all([
        secondServer.app.inject({
          method: 'GET',
          url: '/api/projects/book-signal-arc/books/book-signal-arc/manuscript-checkpoints',
        }),
        secondServer.app.inject({
          method: 'GET',
          url: `/api/projects/book-signal-arc/books/book-signal-arc/experiment-branches/${createdBranchId}`,
        }),
      ])

      expect(checkpointListResponse.statusCode).toBe(200)
      expect(checkpointListResponse.json()).toContainEqual(
        expect.objectContaining({
          checkpointId: createdCheckpointId,
          sourceSignature: 'draft-assembly:book-signal-arc:selected:chapter-open-water-signals',
          selectedChapterId: 'chapter-open-water-signals',
        }),
      )

      expect(archivedBranchResponse.statusCode).toBe(200)
      expect(archivedBranchResponse.json()).toMatchObject({
        branchId: createdBranchId,
        basedOnCheckpointId: createdCheckpointId,
        status: 'archived',
        archivedAtLabel: {
          en: '2026-04-28 10:12',
        },
        archiveNote: {
          en: 'Persist this archive metadata.',
        },
      })
    } finally {
      await secondServer.app.close()
      await secondServer.cleanupProjectStateFile()
    }
  })
})
