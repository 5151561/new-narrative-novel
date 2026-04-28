import { describe, expect, it } from 'vitest'

import { withTestServer } from './test/support/test-server.js'

describe('fixture API server read surfaces', () => {
  it('serves seeded book, chapter, asset, review, and scene workspace records', async () => {
    await withTestServer(async ({ app }) => {
      const [book, chapter, asset, review, scene] = await Promise.all([
        app.inject({
          method: 'GET',
          url: '/api/projects/book-signal-arc/books/book-signal-arc/structure',
        }),
        app.inject({
          method: 'GET',
          url: '/api/projects/book-signal-arc/chapters/chapter-signals-in-rain/structure',
        }),
        app.inject({
          method: 'GET',
          url: '/api/projects/book-signal-arc/assets/asset-ren-voss/knowledge',
        }),
        app.inject({
          method: 'GET',
          url: '/api/projects/book-signal-arc/books/book-signal-arc/review-decisions',
        }),
        app.inject({
          method: 'GET',
          url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/workspace',
        }),
      ])

      expect(book.statusCode).toBe(200)
      expect(book.json()).toMatchObject({
        bookId: 'book-signal-arc',
        chapterIds: ['chapter-signals-in-rain', 'chapter-open-water-signals'],
        viewsMeta: {
          availableViews: ['sequence', 'outliner', 'signals'],
        },
      })

      expect(chapter.statusCode).toBe(200)
      expect(chapter.json()).toMatchObject({
        chapterId: 'chapter-signals-in-rain',
        inspector: {
          chapterNotes: expect.any(Array),
          problemsSummary: expect.any(Array),
          assemblyHints: expect.any(Array),
        },
      })
      expect(chapter.json().scenes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'scene-midnight-platform',
            order: 1,
          }),
        ]),
      )

      expect(asset.statusCode).toBe(200)
      expect(asset.json()).toMatchObject({
        assetId: 'asset-ren-voss',
        viewsMeta: {
          availableViews: ['profile', 'mentions', 'relations', 'context'],
        },
      })
      expect(asset.json().viewsMeta.availableViews).toContain('context')
      expect(asset.json().assets).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'asset-ren-voss',
            kind: 'character',
            contextPolicy: expect.objectContaining({
              assetId: 'asset-ren-voss',
              status: 'active',
              defaultVisibility: 'character-known',
              defaultBudget: 'selected-facts',
              activationRules: expect.arrayContaining([
                expect.objectContaining({
                  id: 'ren-scene-cast',
                  reasonKind: 'scene-cast',
                  visibility: 'character-known',
                  budget: 'selected-facts',
                  targetAgents: expect.arrayContaining(['scene-manager', 'character-agent', 'prose-agent']),
                }),
                expect.objectContaining({
                  id: 'ren-proposal-link',
                  reasonKind: 'proposal-variant',
                  visibility: 'private',
                  budget: 'summary-only',
                }),
              ]),
              exclusions: expect.arrayContaining([
                expect.objectContaining({
                  id: 'ren-private-signal',
                }),
              ]),
            }),
          }),
          expect.objectContaining({
            id: 'asset-midnight-platform',
            kind: 'location',
            contextPolicy: expect.objectContaining({
              defaultBudget: 'mentions-excerpts',
            }),
          }),
          expect.objectContaining({
            id: 'asset-ledger-stays-shut',
            kind: 'lore',
            contextPolicy: expect.objectContaining({
              defaultVisibility: 'spoiler',
            }),
          }),
        ]),
      )

      expect(review.statusCode).toBe(200)
      expect(review.json()).toEqual([
        expect.objectContaining({
          issueId: 'compare-delta-scene-midnight-platform',
          status: 'deferred',
        }),
      ])

      expect(scene.statusCode).toBe(200)
      expect(scene.json()).toMatchObject({
        id: 'scene-midnight-platform',
        chapterId: 'chapter-signals-in-rain',
        latestRunId: 'run-scene-midnight-platform-001',
      })
      expect(scene.json().availableThreads).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'thread-platform-01',
          }),
        ]),
      )

      const chapterSceneIds = chapter.json().scenes.map((sceneRecord: { id: string }) => sceneRecord.id)
      const chapterSceneWorkspaces = await Promise.all(
        chapterSceneIds.map(async (sceneId: string) => ({
          sceneId,
          response: await app.inject({
            method: 'GET',
            url: `/api/projects/book-signal-arc/scenes/${sceneId}/workspace`,
          }),
        })),
      )

      expect(chapterSceneWorkspaces).toEqual(
        expect.arrayContaining(
          chapterSceneIds.map((sceneId: string) => ({
            sceneId,
            response: expect.objectContaining({
              statusCode: 200,
            }),
          })),
        ),
      )
    })
  })

  it('serves missing-policy assets as an explicit empty-state contract without crashing', async () => {
    await withTestServer(async ({ app }) => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/assets/asset-ticket-window/knowledge',
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchObject({
        assetId: 'asset-ticket-window',
        viewsMeta: {
          availableViews: ['profile', 'mentions', 'relations', 'context'],
        },
      })
      expect(response.json().viewsMeta.availableViews).toContain('context')
      const ticketWindow = response.json().assets.find((asset: { id: string }) => asset.id === 'asset-ticket-window')
      expect(ticketWindow).toMatchObject({
        id: 'asset-ticket-window',
        kind: 'location',
      })
      expect(ticketWindow).not.toHaveProperty('contextPolicy')
    })
  })

  it('serves scene execution, prose, inspector, dock, and patch preview read surfaces', async () => {
    await withTestServer(async ({ app }) => {
      const [execution, prose, inspector, dockSummary, dockTab, patchPreview] = await Promise.all([
        app.inject({
          method: 'GET',
          url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/execution',
        }),
        app.inject({
          method: 'GET',
          url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/prose',
        }),
        app.inject({
          method: 'GET',
          url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/inspector',
        }),
        app.inject({
          method: 'GET',
          url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/dock-summary',
        }),
        app.inject({
          method: 'GET',
          url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/dock-tabs/events',
        }),
        app.inject({
          method: 'GET',
          url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/patch-preview',
        }),
      ])

      expect(execution.statusCode).toBe(200)
      expect(execution.json()).toMatchObject({
        runId: 'run-scene-midnight-platform-001',
        runtimeSummary: {
          runHealth: 'attention',
        },
        canContinueRun: true,
      })

      expect(prose.statusCode).toBe(200)
      expect(prose.json()).toMatchObject({
        sceneId: 'scene-midnight-platform',
        statusLabel: 'Draft ready for review',
        traceSummary: {
          sourcePatchId: 'patch-midnight-platform-001',
        },
      })

      expect(inspector.statusCode).toBe(200)
      expect(inspector.json()).toMatchObject({
        runtime: {
          runHealth: 'attention',
        },
        versions: {
          patchCandidates: [
            expect.objectContaining({
              id: 'patch-midnight-platform-001',
            }),
          ],
        },
      })

      expect(dockSummary.statusCode).toBe(200)
      expect(dockSummary.json()).toMatchObject({
        events: expect.any(Array),
        trace: expect.any(Array),
        consistency: expect.any(Object),
        problems: expect.any(Object),
        cost: expect.any(Object),
      })

      expect(dockTab.statusCode).toBe(200)
      expect(dockTab.json()).toMatchObject({
        events: expect.any(Array),
      })

      expect(patchPreview.statusCode).toBe(200)
      expect(patchPreview.json()).toMatchObject({
        patchId: 'patch-midnight-platform-001',
        status: 'ready_for_commit',
        changes: expect.any(Array),
      })
    })
  })

  it('serves revision candidate state on the prose and dock read surfaces without replacing current prose until accept', async () => {
    await withTestServer(async ({ app }) => {
      const startResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs',
        payload: {
          mode: 'rewrite',
          note: 'Prepare revision-candidate read surfaces.',
        },
      })
      expect(startResponse.statusCode).toBe(200)

      const reviewResponse = await app.inject({
        method: 'POST',
        url: `/api/projects/book-signal-arc/runs/${startResponse.json().id}/review-decisions`,
        payload: {
          reviewId: startResponse.json().pendingReviewId,
          decision: 'accept',
        },
      })
      expect(reviewResponse.statusCode).toBe(200)

      const revisionResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/prose/revision',
        payload: {
          revisionMode: 'tone_adjust',
          instruction: 'Dial the bargaining tone down without softening the witness pressure.',
        },
      })
      expect(revisionResponse.statusCode).toBe(204)

      const [proseResponse, dockTraceResponse] = await Promise.all([
        app.inject({
          method: 'GET',
          url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/prose',
        }),
        app.inject({
          method: 'GET',
          url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/dock-tabs/trace',
        }),
      ])

      expect(proseResponse.statusCode).toBe(200)
      expect(proseResponse.json()).toMatchObject({
        sceneId: 'scene-midnight-platform',
        statusLabel: 'Revision candidate ready',
        revisionCandidate: {
          revisionMode: 'tone_adjust',
          instruction: 'Dial the bargaining tone down without softening the witness pressure.',
          sourceProseDraftId: 'prose-draft-scene-midnight-platform-002',
          sourceCanonPatchId: 'canon-patch-scene-midnight-platform-002',
          contextPacketId: 'ctx-scene-midnight-platform-run-002',
        },
      })

      expect(dockTraceResponse.statusCode).toBe(200)
      expect(dockTraceResponse.json()).toMatchObject({
        trace: expect.arrayContaining([
          expect.objectContaining({
            id: 'prose-revision-trace-scene-midnight-platform',
            title: 'Revision candidate trace',
          }),
        ]),
      })
    })
  })

  it('serves canonical read-surface object ids from the selected local project store', async () => {
    await withTestServer(async ({ app }) => {
      const [book, chapter, asset, scene] = await Promise.all([
        app.inject({
          method: 'GET',
          url: '/api/projects/local-project-alpha/books/book-signal-arc/structure',
        }),
        app.inject({
          method: 'GET',
          url: '/api/projects/local-project-alpha/chapters/chapter-signals-in-rain/structure',
        }),
        app.inject({
          method: 'GET',
          url: '/api/projects/local-project-alpha/assets/asset-ren-voss/knowledge',
        }),
        app.inject({
          method: 'GET',
          url: '/api/projects/local-project-alpha/scenes/scene-midnight-platform/workspace',
        }),
      ])

      expect(book.statusCode).toBe(200)
      expect(book.json()).toMatchObject({
        bookId: 'book-signal-arc',
        chapterIds: ['chapter-signals-in-rain', 'chapter-open-water-signals'],
      })

      expect(chapter.statusCode).toBe(200)
      expect(chapter.json().scenes).toEqual(expect.arrayContaining([
        expect.objectContaining({
          id: 'scene-midnight-platform',
          order: 1,
        }),
      ]))

      expect(asset.statusCode).toBe(200)
      expect(asset.json()).toMatchObject({
        assetId: 'asset-ren-voss',
      })

      expect(scene.statusCode).toBe(200)
      expect(scene.json()).toMatchObject({
        id: 'scene-midnight-platform',
        chapterId: 'chapter-signals-in-rain',
      })
    }, {
      configOverrides: {
        currentProject: {
          projectId: 'local-project-alpha',
          projectMode: 'real-project',
          projectRoot: '/tmp/local-project-alpha',
          projectTitle: 'Local Project Alpha',
        },
      },
    })
  })
})
