import { describe, expect, it } from 'vitest'

import { createServer } from './createServer.js'
import { withTestServer } from './test/support/test-server.js'

describe('fixture API server write surfaces', () => {
  it('supports chapter mutation, review mutation, export artifact creation, and scene placeholders', async () => {
    await withTestServer(async ({ app }) => {
      const reorderResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/chapters/chapter-signals-in-rain/scenes/scene-concourse-delay/reorder',
        payload: {
          targetIndex: 0,
        },
      })
      expect(reorderResponse.statusCode).toBe(200)
      expect(reorderResponse.json().scenes.map((scene: { id: string; order: number }) => `${scene.order}:${scene.id}`)).toEqual([
        '1:scene-concourse-delay',
        '2:scene-midnight-platform',
        '3:scene-ticket-window',
        '4:scene-departure-bell',
      ])

      const patchResponse = await app.inject({
        method: 'PATCH',
        url: '/api/projects/book-signal-arc/chapters/chapter-signals-in-rain/scenes/scene-midnight-platform/structure',
        payload: {
          locale: 'en',
          patch: {
            summary: 'Updated from Bundle C patch route.',
          },
        },
      })
      expect(patchResponse.statusCode).toBe(200)
      expect(patchResponse.json().scenes.find((scene: { id: string }) => scene.id === 'scene-midnight-platform')).toMatchObject({
        summary: {
          en: 'Updated from Bundle C patch route.',
        },
      })

      const decisionResponse = await app.inject({
        method: 'PUT',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/review-decisions/compare-delta-scene-midnight-platform',
        payload: {
          bookId: 'book-signal-arc',
          issueId: 'compare-delta-scene-midnight-platform',
          issueSignature: 'compare-delta-scene-midnight-platform::compare_delta',
          status: 'reviewed',
          note: 'Bundle C decision route',
        },
      })
      expect(decisionResponse.statusCode).toBe(200)
      expect(decisionResponse.json()).toMatchObject({
        status: 'reviewed',
        note: 'Bundle C decision route',
      })

      const artifactResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/export-artifacts',
        payload: {
          bookId: 'book-signal-arc',
          exportProfileId: 'export-review-packet',
          checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
          format: 'markdown',
          filename: 'bundle-c-export.md',
          mimeType: 'text/markdown',
          title: 'Bundle C export artifact',
          summary: 'Created during the Bundle C route test.',
          content: '# Bundle C',
          sourceSignature: 'bundle-c-test',
          chapterCount: 1,
          sceneCount: 1,
          wordCount: 42,
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
      expect(artifactResponse.json()).toMatchObject({
        id: 'artifact-export-review-packet-002',
        status: 'ready',
        filename: 'bundle-c-export.md',
      })

      const setupResponse = await app.inject({
        method: 'PATCH',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/setup',
        payload: {
          sceneId: 'scene-midnight-platform',
          identity: {
            title: 'Midnight Platform Revised',
            chapterLabel: 'Signals in Rain',
            locationLabel: 'Eastbound platform',
            povCharacterId: 'asset-ren-voss',
            timeboxLabel: 'Near midnight, one train window left',
            summary: 'Updated through the placeholder setup route.',
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

      const switchThreadResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/execution/thread',
        payload: {
          threadId: 'thread-platform-02',
        },
      })
      expect(switchThreadResponse.statusCode).toBe(204)

      const sceneResponse = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/workspace',
      })
      expect(sceneResponse.statusCode).toBe(200)
      expect(sceneResponse.json()).toMatchObject({
        title: 'Midnight Platform Revised',
        activeThreadId: 'thread-platform-02',
      })
    })
  })

  it('supports review fix action PUT and DELETE', async () => {
    await withTestServer(async ({ app }) => {
      const putResponse = await app.inject({
        method: 'PUT',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/review-fix-actions/compare-delta-scene-midnight-platform',
        payload: {
          bookId: 'book-signal-arc',
          issueId: 'compare-delta-scene-midnight-platform',
          issueSignature: 'compare-delta-scene-midnight-platform::compare_delta',
          sourceHandoffId: 'handoff-review-002',
          sourceHandoffLabel: 'Bundle C fix action test',
          targetScope: 'scene',
          status: 'checked',
          note: 'Verified in targeted regression coverage.',
        },
      })

      expect(putResponse.statusCode).toBe(200)
      expect(putResponse.json()).toMatchObject({
        status: 'checked',
        sourceHandoffId: 'handoff-review-002',
        note: 'Verified in targeted regression coverage.',
      })

      const listAfterPut = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/review-fix-actions',
      })
      expect(listAfterPut.statusCode).toBe(200)
      expect(listAfterPut.json()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            issueId: 'compare-delta-scene-midnight-platform',
            status: 'checked',
          }),
        ]),
      )

      const deleteResponse = await app.inject({
        method: 'DELETE',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/review-fix-actions/compare-delta-scene-midnight-platform',
      })
      expect(deleteResponse.statusCode).toBe(204)

      const listAfterDelete = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/review-fix-actions',
      })
      expect(listAfterDelete.statusCode).toBe(200)
      expect(listAfterDelete.json()).toEqual([])
    })
  })

  it('resets mutable fixture state back to the seeded snapshot', async () => {
    await withTestServer(async ({ app, repository }) => {
      const original = repository.exportSnapshot()
      original.projects['book-signal-arc'].runtimeInfo.summary = 'mutated outside the repository'

      await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs',
        payload: {
          mode: 'rewrite',
        },
      })

      repository.reset()

      expect(repository.exportSnapshot()).toMatchObject({
        projects: {
          'book-signal-arc': {
            runtimeInfo: {
              summary: 'Connected to fixture API runtime.',
            },
            books: {
              'book-signal-arc': {
                chapterIds: ['chapter-signals-in-rain', 'chapter-open-water-signals'],
              },
            },
          },
        },
      })

      const runAfterReset = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/runs/run-scene-midnight-platform-001',
      })
      expect(runAfterReset.statusCode).toBe(200)
      expect(runAfterReset.json()).toMatchObject({
        id: 'run-scene-midnight-platform-001',
        status: 'waiting_review',
      })
    })
  })

  it('returns a persistence failure from the mutation that triggered it while later unrelated responses still succeed', async () => {
    let saveAttempts = 0
    const persistence = {
      async load() {
        return {
          schemaVersion: 1 as const,
          seedVersion: 'prototype-fixture-seed-v1' as const,
          projects: {},
        }
      },
      async saveProjectOverlay() {
        saveAttempts += 1
        if (saveAttempts === 1) {
          throw new Error('simulated persistence failure')
        }
      },
      async clearProjectOverlay() {},
    }

    const { app } = createServer({
      config: {
        host: '127.0.0.1',
        port: 4174,
        apiBasePath: '/api',
        apiBaseUrl: 'http://127.0.0.1:4174/api',
        corsOrigin: true,
        projectStateFilePath: '/tmp/narrative-api-test-persistence-recovery.json',
      },
      projectStatePersistence: persistence,
    })

    try {
      const failedMutationResponse = await app.inject({
        method: 'PATCH',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/setup',
        payload: {
          sceneId: 'scene-midnight-platform',
          identity: {
            title: 'Midnight Platform Failed Persist',
            chapterLabel: 'Signals in Rain',
            locationLabel: 'Eastbound platform',
            povCharacterId: 'asset-ren-voss',
            timeboxLabel: 'Near midnight, one train window left',
            summary: 'This mutation should apply but fail persistence.',
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
      expect(failedMutationResponse.statusCode).toBe(500)
      expect(failedMutationResponse.json()).toMatchObject({
        message: 'Internal Server Error',
      })

      const unrelatedReadResponse = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/workspace',
      })
      expect(unrelatedReadResponse.statusCode).toBe(200)
      expect(unrelatedReadResponse.json()).toMatchObject({
        title: 'Midnight Platform Failed Persist',
      })

      const healthResponse = await app.inject({
        method: 'GET',
        url: '/api/health',
      })
      expect(healthResponse.statusCode).toBe(200)
      expect(healthResponse.json()).toEqual({
        ok: true,
        runtime: 'api',
      })

      const recoveryMutationResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/execution/thread',
        payload: {
          threadId: 'thread-platform-02',
        },
      })
      expect(recoveryMutationResponse.statusCode).toBe(204)

      const workspaceAfterRecovery = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/workspace',
      })
      expect(workspaceAfterRecovery.statusCode).toBe(200)
      expect(workspaceAfterRecovery.json()).toMatchObject({
        title: 'Midnight Platform Failed Persist',
        activeThreadId: 'thread-platform-02',
      })
    } finally {
      await app.close()
    }
  })
})
