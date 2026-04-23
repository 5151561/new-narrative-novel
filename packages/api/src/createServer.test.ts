import { afterEach, describe, expect, it } from 'vitest'

import { createServer } from './createServer.js'

function createTestServer() {
  return createServer({
    config: {
      host: '127.0.0.1',
      port: 4174,
      apiBasePath: '/api',
      apiBaseUrl: 'http://127.0.0.1:4174/api',
      corsOrigin: true,
    },
  })
}

describe('createServer', () => {
  const servers: Array<ReturnType<typeof createServer>> = []

  afterEach(async () => {
    while (servers.length > 0) {
      const server = servers.pop()
      if (server) {
        await server.app.close()
      }
    }
  })

  it('serves /healthz', async () => {
    const server = createTestServer()
    servers.push(server)

    const response = await server.app.inject({
      method: 'GET',
      url: '/healthz',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ ok: true })
  })

  it('returns project runtime info from the fixture repository', async () => {
    const server = createTestServer()
    servers.push(server)

    const response = await server.app.inject({
      method: 'GET',
      url: '/api/projects/book-signal-arc/runtime-info',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      projectId: 'book-signal-arc',
      source: 'api',
      status: 'healthy',
      capabilities: {
        read: true,
        write: true,
        runEvents: true,
      },
    })
  })

  it('serves the Bundle B read route groups with complete fixture objects', async () => {
    const server = createTestServer()
    servers.push(server)

    const [book, chapter, asset, review, scene] = await Promise.all([
      server.app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/structure',
      }),
      server.app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/chapters/chapter-signals-in-rain/structure',
      }),
      server.app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/assets/asset-ren-voss/knowledge',
      }),
      server.app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/review-decisions',
      }),
      server.app.inject({
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
    expect(asset.json().assets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'asset-ren-voss',
          kind: 'character',
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

  it('serves the additional scene read surfaces introduced in Bundle B', async () => {
    const server = createTestServer()
    servers.push(server)

    const [execution, prose, inspector, dockSummary, dockTab, patchPreview] = await Promise.all([
      server.app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/execution',
      }),
      server.app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/prose',
      }),
      server.app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/inspector',
      }),
      server.app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/dock-summary',
      }),
      server.app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/dock-tabs/events',
      }),
      server.app.inject({
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

  it('supports Bundle B write surfaces for chapter mutation, review mutation, export artifact creation, and scene placeholders', async () => {
    const server = createTestServer()
    servers.push(server)

    const reorderResponse = await server.app.inject({
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
    ])

    const patchResponse = await server.app.inject({
      method: 'PATCH',
      url: '/api/projects/book-signal-arc/chapters/chapter-signals-in-rain/scenes/scene-midnight-platform/structure',
      payload: {
        locale: 'en',
        patch: {
          summary: 'Updated from Bundle B patch route.',
        },
      },
    })
    expect(patchResponse.statusCode).toBe(200)
    expect(patchResponse.json().scenes.find((scene: { id: string }) => scene.id === 'scene-midnight-platform')).toMatchObject({
      summary: {
        en: 'Updated from Bundle B patch route.',
      },
    })

    const decisionResponse = await server.app.inject({
      method: 'PUT',
      url: '/api/projects/book-signal-arc/books/book-signal-arc/review-decisions/compare-delta-scene-midnight-platform',
      payload: {
        bookId: 'book-signal-arc',
        issueId: 'compare-delta-scene-midnight-platform',
        issueSignature: 'compare-delta-scene-midnight-platform::compare_delta',
        status: 'reviewed',
        note: 'Bundle B decision route',
      },
    })
    expect(decisionResponse.statusCode).toBe(200)
    expect(decisionResponse.json()).toMatchObject({
      status: 'reviewed',
      note: 'Bundle B decision route',
    })

    const artifactResponse = await server.app.inject({
      method: 'POST',
      url: '/api/projects/book-signal-arc/books/book-signal-arc/export-artifacts',
      payload: {
        bookId: 'book-signal-arc',
        exportProfileId: 'export-review-packet',
        checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
        format: 'markdown',
        filename: 'bundle-b-export.md',
        mimeType: 'text/markdown',
        title: 'Bundle B export artifact',
        summary: 'Created during the Bundle B route test.',
        content: '# Bundle B',
        sourceSignature: 'bundle-b-test',
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
      filename: 'bundle-b-export.md',
    })

    const setupResponse = await server.app.inject({
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

    const switchThreadResponse = await server.app.inject({
      method: 'POST',
      url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/execution/thread',
      payload: {
        threadId: 'thread-platform-02',
      },
    })
    expect(switchThreadResponse.statusCode).toBe(204)

    const sceneResponse = await server.app.inject({
      method: 'GET',
      url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/workspace',
    })
    expect(sceneResponse.statusCode).toBe(200)
    expect(sceneResponse.json()).toMatchObject({
      title: 'Midnight Platform Revised',
      activeThreadId: 'thread-platform-02',
    })
  })

  it('supports review fix action PUT and DELETE within Bundle B scope', async () => {
    const server = createTestServer()
    servers.push(server)

    const putResponse = await server.app.inject({
      method: 'PUT',
      url: '/api/projects/book-signal-arc/books/book-signal-arc/review-fix-actions/compare-delta-scene-midnight-platform',
      payload: {
        bookId: 'book-signal-arc',
        issueId: 'compare-delta-scene-midnight-platform',
        issueSignature: 'compare-delta-scene-midnight-platform::compare_delta',
        sourceHandoffId: 'handoff-review-002',
        sourceHandoffLabel: 'Bundle B fix action test',
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

    const listAfterPut = await server.app.inject({
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

    const deleteResponse = await server.app.inject({
      method: 'DELETE',
      url: '/api/projects/book-signal-arc/books/book-signal-arc/review-fix-actions/compare-delta-scene-midnight-platform',
    })
    expect(deleteResponse.statusCode).toBe(204)

    const listAfterDelete = await server.app.inject({
      method: 'GET',
      url: '/api/projects/book-signal-arc/books/book-signal-arc/review-fix-actions',
    })
    expect(listAfterDelete.statusCode).toBe(200)
    expect(listAfterDelete.json()).toEqual([])
  })

  it('rejects invalid write payload enums and malformed optional notes without persisting state', async () => {
    const server = createTestServer()
    servers.push(server)

    const invalidRunModeResponse = await server.app.inject({
      method: 'POST',
      url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs',
      payload: {
        mode: 'loop-forever',
      },
    })
    expect(invalidRunModeResponse.statusCode).toBe(400)
    expect(invalidRunModeResponse.json()).toEqual({
      status: 400,
      message: 'Unsupported mode "loop-forever".',
      code: 'INVALID_RUN_MODE',
      detail: {
        body: {
          mode: 'loop-forever',
        },
        allowedModes: ['continue', 'rewrite', 'from-scratch'],
      },
    })

    const malformedRunNoteResponse = await server.app.inject({
      method: 'POST',
      url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs',
      payload: {
        note: {
          invalid: true,
        },
      },
    })
    expect(malformedRunNoteResponse.statusCode).toBe(400)
    expect(malformedRunNoteResponse.json()).toEqual({
      status: 400,
      message: 'note must be a string when provided.',
      code: 'INVALID_RUN_NOTE',
      detail: {
        body: {
          note: {
            invalid: true,
          },
        },
      },
    })

    const firstValidStartResponse = await server.app.inject({
      method: 'POST',
      url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs',
      payload: {
        mode: 'rewrite',
      },
    })
    expect(firstValidStartResponse.statusCode).toBe(200)
    expect(firstValidStartResponse.json()).toMatchObject({
      id: 'run-scene-midnight-platform-002',
    })

    const invalidRunReviewNoteResponse = await server.app.inject({
      method: 'POST',
      url: '/api/projects/book-signal-arc/runs/run-scene-midnight-platform-002/review-decisions',
      payload: {
        reviewId: 'review-scene-midnight-platform-002',
        decision: 'accept',
        note: {
          invalid: true,
        },
      },
    })
    expect(invalidRunReviewNoteResponse.statusCode).toBe(400)
    expect(invalidRunReviewNoteResponse.json()).toEqual({
      status: 400,
      message: 'note must be a string when provided.',
      code: 'INVALID_RUN_REVIEW_NOTE',
      detail: {
        body: {
          reviewId: 'review-scene-midnight-platform-002',
          decision: 'accept',
          note: {
            invalid: true,
          },
        },
      },
    })

    const invalidRunReviewPatchIdResponse = await server.app.inject({
      method: 'POST',
      url: '/api/projects/book-signal-arc/runs/run-scene-midnight-platform-002/review-decisions',
      payload: {
        reviewId: 'review-scene-midnight-platform-002',
        decision: 'accept-with-edit',
        patchId: '',
      },
    })
    expect(invalidRunReviewPatchIdResponse.statusCode).toBe(400)
    expect(invalidRunReviewPatchIdResponse.json()).toEqual({
      status: 400,
      message: 'patchId must not be empty when provided.',
      code: 'INVALID_RUN_REVIEW_PATCH_ID',
      detail: {
        body: {
          reviewId: 'review-scene-midnight-platform-002',
          decision: 'accept-with-edit',
          patchId: '',
        },
      },
    })

    const runAfterInvalidReviewNote = await server.app.inject({
      method: 'GET',
      url: '/api/projects/book-signal-arc/runs/run-scene-midnight-platform-002',
    })
    expect(runAfterInvalidReviewNote.statusCode).toBe(200)
    expect(runAfterInvalidReviewNote.json()).toMatchObject({
      status: 'waiting_review',
      eventCount: 9,
      pendingReviewId: 'review-scene-midnight-platform-002',
    })

    const runEventsAfterInvalidPatchId = await server.app.inject({
      method: 'GET',
      url: '/api/projects/book-signal-arc/runs/run-scene-midnight-platform-002/events?cursor=run-event-scene-midnight-platform-002-009',
    })
    expect(runEventsAfterInvalidPatchId.statusCode).toBe(200)
    expect(runEventsAfterInvalidPatchId.json().events).toEqual([])

    const invalidReviewDecisionStatusResponse = await server.app.inject({
      method: 'PUT',
      url: '/api/projects/book-signal-arc/books/book-signal-arc/review-decisions/compare-delta-scene-midnight-platform',
      payload: {
        bookId: 'book-signal-arc',
        issueId: 'compare-delta-scene-midnight-platform',
        issueSignature: 'compare-delta-scene-midnight-platform::compare_delta',
        status: 'approved',
      },
    })
    expect(invalidReviewDecisionStatusResponse.statusCode).toBe(400)
    expect(invalidReviewDecisionStatusResponse.json()).toEqual({
      status: 400,
      message: 'Unsupported review decision status "approved".',
      code: 'INVALID_REVIEW_DECISION',
      detail: {
        body: {
          bookId: 'book-signal-arc',
          issueId: 'compare-delta-scene-midnight-platform',
          issueSignature: 'compare-delta-scene-midnight-platform::compare_delta',
          status: 'approved',
        },
        allowedStatuses: ['reviewed', 'deferred', 'dismissed'],
      },
    })

    const invalidReviewDecisionNoteResponse = await server.app.inject({
      method: 'PUT',
      url: '/api/projects/book-signal-arc/books/book-signal-arc/review-decisions/compare-delta-scene-midnight-platform',
      payload: {
        bookId: 'book-signal-arc',
        issueId: 'compare-delta-scene-midnight-platform',
        issueSignature: 'compare-delta-scene-midnight-platform::compare_delta',
        status: 'reviewed',
        note: {
          invalid: true,
        },
      },
    })
    expect(invalidReviewDecisionNoteResponse.statusCode).toBe(400)
    expect(invalidReviewDecisionNoteResponse.json()).toEqual({
      status: 400,
      message: 'note must be a string when provided.',
      code: 'INVALID_REVIEW_DECISION_NOTE',
      detail: {
        body: {
          bookId: 'book-signal-arc',
          issueId: 'compare-delta-scene-midnight-platform',
          issueSignature: 'compare-delta-scene-midnight-platform::compare_delta',
          status: 'reviewed',
          note: {
            invalid: true,
          },
        },
      },
    })

    const reviewDecisionsAfterInvalidWrites = await server.app.inject({
      method: 'GET',
      url: '/api/projects/book-signal-arc/books/book-signal-arc/review-decisions',
    })
    expect(reviewDecisionsAfterInvalidWrites.statusCode).toBe(200)
    expect(reviewDecisionsAfterInvalidWrites.json()).toEqual([
      expect.objectContaining({
        issueId: 'compare-delta-scene-midnight-platform',
        status: 'deferred',
      }),
    ])

    const invalidReviewFixActionStatusResponse = await server.app.inject({
      method: 'PUT',
      url: '/api/projects/book-signal-arc/books/book-signal-arc/review-fix-actions/compare-delta-scene-midnight-platform',
      payload: {
        bookId: 'book-signal-arc',
        issueId: 'compare-delta-scene-midnight-platform',
        issueSignature: 'compare-delta-scene-midnight-platform::compare_delta',
        sourceHandoffId: 'handoff-review-002',
        sourceHandoffLabel: 'Bundle B fix action test',
        targetScope: 'scene',
        status: 'verifying',
      },
    })
    expect(invalidReviewFixActionStatusResponse.statusCode).toBe(400)
    expect(invalidReviewFixActionStatusResponse.json()).toEqual({
      status: 400,
      message: 'Unsupported review fix action status "verifying".',
      code: 'INVALID_REVIEW_FIX_ACTION',
      detail: {
        body: {
          bookId: 'book-signal-arc',
          issueId: 'compare-delta-scene-midnight-platform',
          issueSignature: 'compare-delta-scene-midnight-platform::compare_delta',
          sourceHandoffId: 'handoff-review-002',
          sourceHandoffLabel: 'Bundle B fix action test',
          targetScope: 'scene',
          status: 'verifying',
        },
        allowedStatuses: ['started', 'checked', 'blocked'],
      },
    })

    const invalidReviewFixActionTargetScopeResponse = await server.app.inject({
      method: 'PUT',
      url: '/api/projects/book-signal-arc/books/book-signal-arc/review-fix-actions/compare-delta-scene-midnight-platform',
      payload: {
        bookId: 'book-signal-arc',
        issueId: 'compare-delta-scene-midnight-platform',
        issueSignature: 'compare-delta-scene-midnight-platform::compare_delta',
        sourceHandoffId: 'handoff-review-002',
        sourceHandoffLabel: 'Bundle B fix action test',
        targetScope: 'run',
        status: 'checked',
      },
    })
    expect(invalidReviewFixActionTargetScopeResponse.statusCode).toBe(400)
    expect(invalidReviewFixActionTargetScopeResponse.json()).toEqual({
      status: 400,
      message: 'Unsupported targetScope "run".',
      code: 'INVALID_REVIEW_FIX_ACTION',
      detail: {
        body: {
          bookId: 'book-signal-arc',
          issueId: 'compare-delta-scene-midnight-platform',
          issueSignature: 'compare-delta-scene-midnight-platform::compare_delta',
          sourceHandoffId: 'handoff-review-002',
          sourceHandoffLabel: 'Bundle B fix action test',
          targetScope: 'run',
          status: 'checked',
        },
        allowedTargetScopes: ['book', 'chapter', 'scene', 'asset'],
      },
    })

    const invalidReviewFixActionNoteResponse = await server.app.inject({
      method: 'PUT',
      url: '/api/projects/book-signal-arc/books/book-signal-arc/review-fix-actions/compare-delta-scene-midnight-platform',
      payload: {
        bookId: 'book-signal-arc',
        issueId: 'compare-delta-scene-midnight-platform',
        issueSignature: 'compare-delta-scene-midnight-platform::compare_delta',
        sourceHandoffId: 'handoff-review-002',
        sourceHandoffLabel: 'Bundle B fix action test',
        targetScope: 'scene',
        status: 'checked',
        note: {
          invalid: true,
        },
      },
    })
    expect(invalidReviewFixActionNoteResponse.statusCode).toBe(400)
    expect(invalidReviewFixActionNoteResponse.json()).toEqual({
      status: 400,
      message: 'note must be a string when provided.',
      code: 'INVALID_REVIEW_FIX_ACTION_NOTE',
      detail: {
        body: {
          bookId: 'book-signal-arc',
          issueId: 'compare-delta-scene-midnight-platform',
          issueSignature: 'compare-delta-scene-midnight-platform::compare_delta',
          sourceHandoffId: 'handoff-review-002',
          sourceHandoffLabel: 'Bundle B fix action test',
          targetScope: 'scene',
          status: 'checked',
          note: {
            invalid: true,
          },
        },
      },
    })

    const reviewFixActionsAfterInvalidWrites = await server.app.inject({
      method: 'GET',
      url: '/api/projects/book-signal-arc/books/book-signal-arc/review-fix-actions',
    })
    expect(reviewFixActionsAfterInvalidWrites.statusCode).toBe(200)
    expect(reviewFixActionsAfterInvalidWrites.json()).toEqual([
      expect.objectContaining({
        issueId: 'compare-delta-scene-midnight-platform',
        status: 'started',
        targetScope: 'scene',
      }),
    ])

    const invalidRevisionModeResponse = await server.app.inject({
      method: 'POST',
      url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/prose/revision',
      payload: {
        revisionMode: 'polish',
      },
    })
    expect(invalidRevisionModeResponse.statusCode).toBe(400)
    expect(invalidRevisionModeResponse.json()).toEqual({
      status: 400,
      message: 'Unsupported revisionMode "polish".',
      code: 'INVALID_REVISION_MODE',
      detail: {
        body: {
          revisionMode: 'polish',
        },
        allowedRevisionModes: ['rewrite', 'compress', 'expand', 'tone_adjust', 'continuity_fix'],
      },
    })
  })

  it('supports Bundle B run routes, cursor semantics, and unified errors', async () => {
    const server = createTestServer()
    servers.push(server)

    const unknownSceneResponse = await server.app.inject({
      method: 'POST',
      url: '/api/projects/book-signal-arc/scenes/scene-does-not-exist/runs',
      payload: {
        mode: 'rewrite',
      },
    })
    expect(unknownSceneResponse.statusCode).toBe(404)
    expect(unknownSceneResponse.json()).toEqual({
      status: 404,
      message: 'Scene scene-does-not-exist was not found.',
      code: 'SCENE_NOT_FOUND',
      detail: {
        projectId: 'book-signal-arc',
        sceneId: 'scene-does-not-exist',
      },
    })

    const startResponse = await server.app.inject({
      method: 'POST',
      url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs',
      payload: {
        mode: 'rewrite',
        note: 'Tighten the ending beat.',
      },
    })
    expect(startResponse.statusCode).toBe(200)
    expect(startResponse.json()).toMatchObject({
      id: 'run-scene-midnight-platform-002',
      status: 'waiting_review',
      pendingReviewId: 'review-scene-midnight-platform-002',
    })

    const detailResponse = await server.app.inject({
      method: 'GET',
      url: '/api/projects/book-signal-arc/runs/run-scene-midnight-platform-002',
    })
    expect(detailResponse.statusCode).toBe(200)
    expect(detailResponse.json()).toMatchObject({
      id: 'run-scene-midnight-platform-002',
      latestEventId: 'run-event-scene-midnight-platform-002-009',
      eventCount: 9,
    })

    const sceneAfterStart = await server.app.inject({
      method: 'GET',
      url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/workspace',
    })
    expect(sceneAfterStart.statusCode).toBe(200)
    expect(sceneAfterStart.json()).toMatchObject({
      latestRunId: 'run-scene-midnight-platform-002',
      runStatus: 'paused',
      status: 'review',
    })

    const executionAfterStart = await server.app.inject({
      method: 'GET',
      url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/execution',
    })
    expect(executionAfterStart.statusCode).toBe(200)
    expect(executionAfterStart.json()).toMatchObject({
      runId: 'run-scene-midnight-platform-002',
      runtimeSummary: {
        runHealth: 'attention',
      },
      canContinueRun: false,
      canOpenProse: false,
    })

    const firstEventsResponse = await server.app.inject({
      method: 'GET',
      url: '/api/projects/book-signal-arc/runs/run-scene-midnight-platform-002/events',
    })
    expect(firstEventsResponse.statusCode).toBe(200)
    expect(firstEventsResponse.json()).toMatchObject({
      runId: 'run-scene-midnight-platform-002',
      nextCursor: 'run-event-scene-midnight-platform-002-004',
    })
    expect(firstEventsResponse.json().events.map((event: { kind: string }) => event.kind)).toEqual([
      'run_created',
      'run_started',
      'context_packet_built',
      'agent_invocation_started',
    ])

    const nextEventsResponse = await server.app.inject({
      method: 'GET',
      url: '/api/projects/book-signal-arc/runs/run-scene-midnight-platform-002/events?cursor=run-event-scene-midnight-platform-002-004',
    })
    expect(nextEventsResponse.statusCode).toBe(200)
    expect(nextEventsResponse.json()).toMatchObject({
      runId: 'run-scene-midnight-platform-002',
      nextCursor: 'run-event-scene-midnight-platform-002-008',
    })
    expect(nextEventsResponse.json().events.map((event: { kind: string }) => event.kind)).toEqual([
      'agent_invocation_completed',
      'agent_invocation_started',
      'agent_invocation_completed',
      'proposal_created',
    ])

    const finalPreReviewEventsResponse = await server.app.inject({
      method: 'GET',
      url: '/api/projects/book-signal-arc/runs/run-scene-midnight-platform-002/events?cursor=run-event-scene-midnight-platform-002-008',
    })
    expect(finalPreReviewEventsResponse.statusCode).toBe(200)
    expect(finalPreReviewEventsResponse.json()).not.toHaveProperty('nextCursor')
    expect(finalPreReviewEventsResponse.json().events.map((event: { kind: string }) => event.kind)).toEqual(['review_requested'])

    const invalidCursorResponse = await server.app.inject({
      method: 'GET',
      url: '/api/projects/book-signal-arc/runs/run-scene-midnight-platform-002/events?cursor=run-event-does-not-exist',
    })
    expect(invalidCursorResponse.statusCode).toBe(409)
    expect(invalidCursorResponse.json()).toEqual({
      status: 409,
      message: 'Run cursor run-event-does-not-exist does not exist for run-scene-midnight-platform-002.',
      code: 'RUN_EVENTS_CURSOR_CONFLICT',
      detail: {
        projectId: 'book-signal-arc',
        runId: 'run-scene-midnight-platform-002',
        cursor: 'run-event-does-not-exist',
      },
    })

    const invalidDecisionResponse = await server.app.inject({
      method: 'POST',
      url: '/api/projects/book-signal-arc/runs/run-scene-midnight-platform-002/review-decisions',
      payload: {
        reviewId: 'review-scene-midnight-platform-002',
        decision: 'ship-it',
      },
    })
    expect(invalidDecisionResponse.statusCode).toBe(400)
    expect(invalidDecisionResponse.json()).toEqual({
      status: 400,
      message: 'Unsupported run review decision "ship-it".',
      code: 'INVALID_RUN_REVIEW_DECISION',
      detail: {
        body: {
          reviewId: 'review-scene-midnight-platform-002',
          decision: 'ship-it',
        },
        allowedDecisions: ['accept', 'accept-with-edit', 'request-rewrite', 'reject'],
      },
    })

    const detailAfterInvalidDecision = await server.app.inject({
      method: 'GET',
      url: '/api/projects/book-signal-arc/runs/run-scene-midnight-platform-002',
    })
    expect(detailAfterInvalidDecision.statusCode).toBe(200)
    expect(detailAfterInvalidDecision.json()).toMatchObject({
      status: 'waiting_review',
      pendingReviewId: 'review-scene-midnight-platform-002',
      eventCount: 9,
    })

    const reviewResponse = await server.app.inject({
      method: 'POST',
      url: '/api/projects/book-signal-arc/runs/run-scene-midnight-platform-002/review-decisions',
      payload: {
        reviewId: 'review-scene-midnight-platform-002',
        decision: 'accept',
        note: 'Ship it.',
      },
    })
    expect(reviewResponse.statusCode).toBe(200)
    expect(reviewResponse.json()).toMatchObject({
      id: 'run-scene-midnight-platform-002',
      status: 'completed',
      summary: 'Proposal set accepted and applied to canon and prose.',
    })
    expect(reviewResponse.json()).not.toHaveProperty('pendingReviewId')

    const sceneAfterReview = await server.app.inject({
      method: 'GET',
      url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/workspace',
    })
    expect(sceneAfterReview.statusCode).toBe(200)
    expect(sceneAfterReview.json()).toMatchObject({
      latestRunId: 'run-scene-midnight-platform-002',
      runStatus: 'completed',
      status: 'ready',
    })

    const proseAfterReview = await server.app.inject({
      method: 'GET',
      url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/prose',
    })
    expect(proseAfterReview.statusCode).toBe(200)
    expect(proseAfterReview.json()).toMatchObject({
      statusLabel: 'Run completed',
      latestDiffSummary: 'Proposal set accepted and applied to canon and prose.',
    })

    const dockAfterReview = await server.app.inject({
      method: 'GET',
      url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/dock-tabs/events',
    })
    expect(dockAfterReview.statusCode).toBe(200)
    expect(dockAfterReview.json().events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          meta: 'run-scene-midnight-platform-002',
        }),
      ]),
    )

    const postReviewEventsResponse = await server.app.inject({
      method: 'GET',
      url: '/api/projects/book-signal-arc/runs/run-scene-midnight-platform-002/events?cursor=run-event-scene-midnight-platform-002-009',
    })
    expect(postReviewEventsResponse.statusCode).toBe(200)
    expect(postReviewEventsResponse.json().events.map((event: { kind: string }) => event.kind)).toEqual([
      'review_decision_submitted',
      'canon_patch_applied',
      'prose_generated',
      'run_completed',
    ])

    const streamResponse = await server.app.inject({
      method: 'GET',
      url: '/api/projects/book-signal-arc/runs/run-scene-midnight-platform-002/events/stream',
    })
    expect(streamResponse.statusCode).toBe(501)
    expect(streamResponse.json()).toMatchObject({
      code: 'RUN_EVENT_STREAM_UNIMPLEMENTED',
    })
  })

  it('returns unified JSON errors for missing projects', async () => {
    const server = createTestServer()
    servers.push(server)

    const response = await server.app.inject({
      method: 'GET',
      url: '/api/projects/project-missing/runtime-info',
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({
      status: 404,
      message: 'Project project-missing was not found.',
      code: 'PROJECT_NOT_FOUND',
      detail: {
        projectId: 'project-missing',
      },
    })
  })

  it('returns the unified JSON 404 body for unmatched routes', async () => {
    const server = createTestServer()
    servers.push(server)

    const response = await server.app.inject({
      method: 'GET',
      url: '/api/unknown',
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({
      status: 404,
      message: 'Route GET /api/unknown was not found.',
      code: 'ROUTE_NOT_FOUND',
      detail: {
        method: 'GET',
        url: '/api/unknown',
      },
    })
  })

  it('resets mutable fixture state back to the seeded snapshot', async () => {
    const server = createTestServer()
    servers.push(server)

    const original = server.repository.exportSnapshot()
    original.projects['book-signal-arc'].runtimeInfo.summary = 'mutated outside the repository'

    await server.app.inject({
      method: 'POST',
      url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs',
      payload: {
        mode: 'rewrite',
      },
    })
    server.repository.reset()

    expect(server.repository.exportSnapshot()).toMatchObject({
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

    const runAfterReset = await server.app.inject({
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
