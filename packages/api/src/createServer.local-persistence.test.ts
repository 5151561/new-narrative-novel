import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { createTestServer } from './test/support/test-server.js'

describe('fixture API server local project-state persistence', () => {
  const tempDirectories = [] as string[]

  afterEach(async () => {
    await Promise.all(
      tempDirectories.splice(0).map((directory) => rm(directory, {
        recursive: true,
        force: true,
      })),
    )
  })

  async function createSharedStateFilePath() {
    const directory = await mkdtemp(path.join(tmpdir(), 'narrative-api-local-persistence-'))
    tempDirectories.push(directory)
    return path.join(directory, 'prototype-state.json')
  }

  it('persists the prototype chain across fresh API servers with the project-state file contract', async () => {
    const projectStateFilePath = await createSharedStateFilePath()
    const firstServer = createTestServer({ projectStateFilePath })

    let runId = ''

    try {
      const startResponse = await firstServer.app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-warehouse-bridge/runs',
        payload: {
          mode: 'rewrite',
          note: 'Persist the accepted warehouse bridge draft.',
        },
      })
      expect(startResponse.statusCode).toBe(200)
      runId = startResponse.json().id

      const reviewResponse = await firstServer.app.inject({
        method: 'POST',
        url: `/api/projects/book-signal-arc/runs/${runId}/review-decisions`,
        payload: {
          reviewId: startResponse.json().pendingReviewId,
          decision: 'accept',
        },
      })
      expect(reviewResponse.statusCode).toBe(200)

      const decisionResponse = await firstServer.app.inject({
        method: 'PUT',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/review-decisions/compare-delta-scene-midnight-platform',
        payload: {
          bookId: 'book-signal-arc',
          issueId: 'compare-delta-scene-midnight-platform',
          issueSignature: 'compare-delta-scene-midnight-platform::compare_delta',
          status: 'reviewed',
          note: 'Persisted review decision note.',
        },
      })
      expect(decisionResponse.statusCode).toBe(200)

      const fixActionResponse = await firstServer.app.inject({
        method: 'PUT',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/review-fix-actions/compare-delta-scene-midnight-platform',
        payload: {
          bookId: 'book-signal-arc',
          issueId: 'compare-delta-scene-midnight-platform',
          issueSignature: 'compare-delta-scene-midnight-platform::compare_delta',
          sourceHandoffId: 'handoff-review-persisted',
          sourceHandoffLabel: 'Persisted fix action',
          targetScope: 'scene',
          status: 'checked',
          note: 'Persisted review fix action note.',
        },
      })
      expect(fixActionResponse.statusCode).toBe(200)

      const artifactResponse = await firstServer.app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/export-artifacts',
        payload: {
          bookId: 'book-signal-arc',
          exportProfileId: 'export-review-packet',
          checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
          format: 'markdown',
          filename: 'persisted-export.md',
          mimeType: 'text/markdown',
          title: 'Persisted export artifact',
          summary: 'Created before server restart.',
          content: '# Persisted export',
          sourceSignature: 'persisted-export',
          chapterCount: 2,
          sceneCount: 5,
          wordCount: 256,
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
        },
      })
      expect(artifactResponse.statusCode).toBe(200)

      const patchResponse = await firstServer.app.inject({
        method: 'PATCH',
        url: '/api/projects/book-signal-arc/chapters/chapter-signals-in-rain/scenes/scene-midnight-platform/structure',
        payload: {
          locale: 'en',
          patch: {
            summary: 'Persisted structure summary.',
          },
        },
      })
      expect(patchResponse.statusCode).toBe(200)

      const setupResponse = await firstServer.app.inject({
        method: 'PATCH',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/setup',
        payload: {
          sceneId: 'scene-midnight-platform',
          identity: {
            title: 'Midnight Platform Persisted',
            chapterLabel: 'Signals in Rain',
            locationLabel: 'Eastbound platform',
            povCharacterId: 'asset-ren-voss',
            timeboxLabel: 'Near midnight, one train window left',
            summary: 'Persisted setup summary.',
          },
          objective: {
            externalGoal: 'Close the bargain without opening the ledger.',
            emotionalGoal: 'Keep Ren visibly controlled under witness pressure.',
            successSignal: 'The witness sees a bargain, but not the ledger contents.',
            failureCost: 'The courier signal becomes public leverage.',
          },
          cast: [],
          constraints: [],
          knowledgeBoundaries: [],
          runtimePreset: {
            selectedPresetId: 'preset-tight-stakes',
            presetOptions: [],
          },
        },
      })
      expect(setupResponse.statusCode).toBe(204)
    } finally {
      await firstServer.app.close()
    }

    const secondServer = createTestServer({ projectStateFilePath })

    try {
      const [assemblyResponse, decisionListResponse, fixActionListResponse, artifactListResponse, chapterResponse, sceneResponse, runResponse] = await Promise.all([
        secondServer.app.inject({
          method: 'GET',
          url: '/api/projects/book-signal-arc/books/book-signal-arc/draft-assembly',
        }),
        secondServer.app.inject({
          method: 'GET',
          url: '/api/projects/book-signal-arc/books/book-signal-arc/review-decisions',
        }),
        secondServer.app.inject({
          method: 'GET',
          url: '/api/projects/book-signal-arc/books/book-signal-arc/review-fix-actions',
        }),
        secondServer.app.inject({
          method: 'GET',
          url: '/api/projects/book-signal-arc/books/book-signal-arc/export-artifacts',
        }),
        secondServer.app.inject({
          method: 'GET',
          url: '/api/projects/book-signal-arc/chapters/chapter-signals-in-rain/structure',
        }),
        secondServer.app.inject({
          method: 'GET',
          url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/workspace',
        }),
        secondServer.app.inject({
          method: 'GET',
          url: `/api/projects/book-signal-arc/runs/${runId}`,
        }),
      ])

      expect(assemblyResponse.statusCode).toBe(200)
      expect(assemblyResponse.json()).toMatchObject({
        draftedSceneCount: 2,
        missingDraftSceneCount: 3,
      })
      expect(
        assemblyResponse
          .json()
          .chapters
          .flatMap((chapter: { scenes: Array<{ sceneId: string; kind: string }> }) => chapter.scenes)
          .find((scene: { sceneId: string }) => scene.sceneId === 'scene-warehouse-bridge'),
      ).toMatchObject({
        kind: 'draft',
        sceneId: 'scene-warehouse-bridge',
      })

      expect(decisionListResponse.statusCode).toBe(200)
      expect(decisionListResponse.json()).toEqual(expect.arrayContaining([
        expect.objectContaining({
          issueId: 'compare-delta-scene-midnight-platform',
          status: 'reviewed',
          note: 'Persisted review decision note.',
        }),
      ]))

      expect(fixActionListResponse.statusCode).toBe(200)
      expect(fixActionListResponse.json()).toEqual(expect.arrayContaining([
        expect.objectContaining({
          issueId: 'compare-delta-scene-midnight-platform',
          status: 'checked',
          note: 'Persisted review fix action note.',
        }),
      ]))

      expect(artifactListResponse.statusCode).toBe(200)
      expect(artifactListResponse.json()).toEqual(expect.arrayContaining([
        expect.objectContaining({
          id: 'artifact-export-review-packet-002',
          filename: 'persisted-export.md',
        }),
      ]))

      expect(chapterResponse.statusCode).toBe(200)
      expect(chapterResponse.json().scenes.find((scene: { id: string }) => scene.id === 'scene-midnight-platform')).toMatchObject({
        summary: {
          en: 'Persisted structure summary.',
        },
      })

      expect(sceneResponse.statusCode).toBe(200)
      expect(sceneResponse.json()).toMatchObject({
        title: 'Midnight Platform Persisted',
      })

      expect(runResponse.statusCode).toBe(200)
      expect(runResponse.json()).toMatchObject({
        id: runId,
        status: 'completed',
      })
    } finally {
      await secondServer.app.close()
    }
  })

  it('resets one project back to canonical seed and clears its persisted overlay', async () => {
    const projectStateFilePath = await createSharedStateFilePath()
    const firstServer = createTestServer({ projectStateFilePath })

    let runId = ''

    try {
      const startResponse = await firstServer.app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-warehouse-bridge/runs',
        payload: {
          mode: 'rewrite',
          note: 'Reset this project back to the canonical seed.',
        },
      })
      expect(startResponse.statusCode).toBe(200)
      runId = startResponse.json().id

      const reviewResponse = await firstServer.app.inject({
        method: 'POST',
        url: `/api/projects/book-signal-arc/runs/${runId}/review-decisions`,
        payload: {
          reviewId: startResponse.json().pendingReviewId,
          decision: 'accept',
        },
      })
      expect(reviewResponse.statusCode).toBe(200)

      const decisionResponse = await firstServer.app.inject({
        method: 'PUT',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/review-decisions/compare-delta-scene-midnight-platform',
        payload: {
          bookId: 'book-signal-arc',
          issueId: 'compare-delta-scene-midnight-platform',
          issueSignature: 'compare-delta-scene-midnight-platform::compare_delta',
          status: 'reviewed',
          note: 'This note should disappear after reset.',
        },
      })
      expect(decisionResponse.statusCode).toBe(200)

      const resetResponse = await firstServer.app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/runtime/reset',
      })
      expect(resetResponse.statusCode).toBe(204)

      const [decisionListResponse, assemblyResponse, runResponse, runtimeInfoResponse, healthResponse] = await Promise.all([
        firstServer.app.inject({
          method: 'GET',
          url: '/api/projects/book-signal-arc/books/book-signal-arc/review-decisions',
        }),
        firstServer.app.inject({
          method: 'GET',
          url: '/api/projects/book-signal-arc/books/book-signal-arc/draft-assembly',
        }),
        firstServer.app.inject({
          method: 'GET',
          url: `/api/projects/book-signal-arc/runs/${runId}`,
        }),
        firstServer.app.inject({
          method: 'GET',
          url: '/api/projects/book-signal-arc/runtime-info',
        }),
        firstServer.app.inject({
          method: 'GET',
          url: '/api/health',
        }),
      ])

      expect(decisionListResponse.statusCode).toBe(200)
      expect(decisionListResponse.json()).toEqual([
        expect.objectContaining({
          issueId: 'compare-delta-scene-midnight-platform',
          status: 'deferred',
          note: 'Hold until the fixture-backed review routes land.',
        }),
      ])

      expect(assemblyResponse.statusCode).toBe(200)
      expect(assemblyResponse.json()).toMatchObject({
        draftedSceneCount: 1,
        missingDraftSceneCount: 4,
      })
      expect(
        assemblyResponse
          .json()
          .chapters
          .flatMap((chapter: { scenes: Array<{ sceneId: string; kind: string }> }) => chapter.scenes)
          .find((scene: { sceneId: string }) => scene.sceneId === 'scene-warehouse-bridge'),
      ).toMatchObject({
        kind: 'gap',
        sceneId: 'scene-warehouse-bridge',
      })

      expect(runResponse.statusCode).toBe(200)
      expect(runResponse.json()).toBeNull()
      expect(runtimeInfoResponse.statusCode).toBe(200)
      expect(runtimeInfoResponse.json()).toMatchObject({
        projectId: 'book-signal-arc',
        status: 'healthy',
      })
      expect(healthResponse.statusCode).toBe(200)
      expect(healthResponse.json()).toEqual({
        ok: true,
        runtime: 'api',
      })
    } finally {
      await firstServer.app.close()
    }

    const secondServer = createTestServer({ projectStateFilePath })

    try {
      const [decisionListResponse, assemblyResponse, runResponse, streamResponse] = await Promise.all([
        secondServer.app.inject({
          method: 'GET',
          url: '/api/projects/book-signal-arc/books/book-signal-arc/review-decisions',
        }),
        secondServer.app.inject({
          method: 'GET',
          url: '/api/projects/book-signal-arc/books/book-signal-arc/draft-assembly',
        }),
        secondServer.app.inject({
          method: 'GET',
          url: `/api/projects/book-signal-arc/runs/${runId}`,
        }),
        secondServer.app.inject({
          method: 'GET',
          url: '/api/projects/book-signal-arc/runs/run-scene-midnight-platform-001/events/stream',
        }),
      ])

      expect(decisionListResponse.statusCode).toBe(200)
      expect(decisionListResponse.json()).toEqual([
        expect.objectContaining({
          issueId: 'compare-delta-scene-midnight-platform',
          status: 'deferred',
        }),
      ])

      expect(assemblyResponse.statusCode).toBe(200)
      expect(assemblyResponse.json()).toMatchObject({
        draftedSceneCount: 1,
        missingDraftSceneCount: 4,
      })

      expect(runResponse.statusCode).toBe(200)
      expect(runResponse.json()).toBeNull()
      expect(streamResponse.statusCode).toBe(501)
      expect(streamResponse.json()).toMatchObject({
        code: 'RUN_EVENT_STREAM_UNIMPLEMENTED',
      })
    } finally {
      await secondServer.app.close()
    }
  })
})
