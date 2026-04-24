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
          availableViews: ['profile', 'mentions', 'relations'],
        },
      })
      expect(asset.json().viewsMeta.availableViews).not.toContain('context')
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
            kind: 'rule',
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
          availableViews: ['profile', 'mentions', 'relations'],
        },
      })
      expect(response.json().viewsMeta.availableViews).not.toContain('context')
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
})
