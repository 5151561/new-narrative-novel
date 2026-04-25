import { describe, expect, it, vi } from 'vitest'

import type { BuildBookExportArtifactInput } from '@/features/book/api/book-export-artifact-records'
import type { ChapterStructureWorkspaceRecord } from '@/features/chapter/api/chapter-records'
import type { ReviewIssueDecisionRecord } from '@/features/review/api/review-decision-records'
import type { ReviewIssueFixActionRecord } from '@/features/review/api/review-fix-action-records'
import type { RunArtifactDetailResponse, RunArtifactListResponse } from '@/features/run/api/run-artifact-records'
import type { RunEventsPageRecord, RunRecord } from '@/features/run/api/run-records'
import type { RunTraceResponse } from '@/features/run/api/run-trace-records'
import { sceneRuntimeCapabilities, type SceneRuntimeInfo } from '@/features/scene/api/scene-runtime'
import type { SceneExecutionViewModel, ScenePatchPreviewViewModel } from '@/features/scene/types/scene-view-models'
import type { ProjectRuntimeInfoRecord } from './project-runtime-info'

import { createApiProjectRuntime } from './api-project-runtime'
import { ApiRequestError } from './api-transport'

function createTransportMock() {
  return vi.fn(async ({ path, method, body }: { path: string; method: string; body?: unknown }) => {
    if (method === 'GET' && path === '/api/projects/project-1/runtime-info') {
      return {
        projectId: 'project-1',
        projectTitle: 'Signal Arc',
        source: 'api',
        status: 'healthy',
        summary: 'Connected to runtime gateway.',
        checkedAtLabel: '2026-04-21 09:30',
        apiBaseUrl: 'https://runtime.example.test',
        versionLabel: 'runtime-v24',
        capabilities: {
          read: true,
          write: true,
          runEvents: true,
          runEventPolling: true,
          runEventStream: true,
          reviewDecisions: true,
          contextPacketRefs: true,
          proposalSetRefs: true,
        },
      } satisfies ProjectRuntimeInfoRecord
    }

    if (method === 'GET' && path === '/api/projects/project-1/books/book-1/structure') {
      return { bookId: 'book-1', title: { en: 'Signal Arc', 'zh-CN': '信号弧' }, chapterIds: [] }
    }

    if (method === 'POST' && path === '/api/projects/project-1/books/book-1/export-artifacts') {
      return { id: 'artifact-1', createdAtLabel: '2026-04-20 12:00', createdByLabel: 'Editor' }
    }

    if (method === 'POST' && path === '/api/projects/project-1/chapters/chapter-1/scenes/scene-2/reorder') {
      return { chapterId: 'chapter-1', scenes: [] }
    }

    if (method === 'PATCH' && path === '/api/projects/project-1/chapters/chapter-1/scenes/scene-2/structure') {
      return {
        chapterId: 'chapter-1',
        title: { en: 'Chapter One', 'zh-CN': '第一章' },
        summary: { en: 'Summary', 'zh-CN': '摘要' },
        scenes: [
          {
            id: 'scene-2',
            order: 1,
            summary: {
              en: 'Updated summary',
              'zh-CN':
                body && typeof body === 'object' && body !== null && 'patch' in body
                  ? (body as { patch: { summary?: string } }).patch.summary ?? ''
                  : '',
            },
            purpose: { en: '', 'zh-CN': '' },
            pov: { en: '', 'zh-CN': '' },
            location: { en: '', 'zh-CN': '' },
            conflict: { en: '', 'zh-CN': '' },
            reveal: { en: '', 'zh-CN': '' },
            status: 'draft',
          },
        ],
        inspector: {
          chapterNotes: [],
          problemsSummary: [],
          assemblyHints: [],
        },
      }
    }

    if (method === 'GET' && path === '/api/projects/project-1/assets/asset-1/knowledge') {
      return { assetId: 'asset-1', runtime: { profile: { label: '', summary: '' }, runHealth: 'stable', metrics: { latencyLabel: '', tokenLabel: '', costLabel: '' } } }
    }

    if (method === 'PUT' && path === '/api/projects/project-1/books/book-1/review-decisions/issue-1') {
      return {
        id: 'book-1::issue-1',
        bookId: 'book-1',
        issueId: 'issue-1',
        issueSignature: 'sig-1',
        status: 'reviewed',
        updatedAtLabel: '2026-04-20 12:00',
        updatedByLabel: 'Editor',
      }
    }

    if (method === 'PUT' && path === '/api/projects/project-1/books/book-1/review-fix-actions/issue-2') {
      return {
        id: 'book-1::issue-2',
        bookId: 'book-1',
        issueId: 'issue-2',
        issueSignature: 'sig-2',
        sourceHandoffId: 'handoff-2',
        sourceHandoffLabel: 'Source handoff',
        targetScope: 'scene',
        status: 'checked',
        note: 'Validated in source scene.',
        startedAtLabel: '2026-04-20 12:00',
        updatedAtLabel: '2026-04-20 12:05',
        updatedByLabel: 'Editor',
      }
    }

    if (method === 'GET' && path === '/api/projects/project-1/scenes/scene-1/execution') {
      return { sceneId: 'scene-1', runtime: { profile: { label: '', summary: '' }, runHealth: 'stable', metrics: { latencyLabel: '', tokenLabel: '', costLabel: '' } } }
    }

    if (method === 'GET' && path === '/api/projects/project-1/scenes/scene-1/patch-preview') {
      return { patchId: 'patch-1' }
    }

    return null
  })
}

function createBuildInput(): BuildBookExportArtifactInput {
  return {
    bookId: 'book-1',
    exportProfileId: 'profile-1',
    format: 'markdown',
    filename: 'signal-arc.md',
    mimeType: 'text/markdown',
    title: 'Signal Arc',
    summary: 'Summary',
    content: '# Signal Arc',
    sourceSignature: 'signature-1',
    chapterCount: 1,
    sceneCount: 2,
    wordCount: 300,
    readinessSnapshot: {
      status: 'ready',
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

describe('api project runtime', () => {
  it('uses the project runtime info endpoint and preserves runClient exposure', async () => {
    const transport = createTransportMock()
    const runtime = createApiProjectRuntime({ projectId: 'project-1', transport: { requestJson: transport } })

    await expect(runtime.runtimeInfoClient.getProjectRuntimeInfo()).resolves.toEqual<ProjectRuntimeInfoRecord>({
      projectId: 'project-1',
      projectTitle: 'Signal Arc',
      source: 'api',
      status: 'healthy',
      summary: 'Connected to runtime gateway.',
      checkedAtLabel: '2026-04-21 09:30',
      apiBaseUrl: 'https://runtime.example.test',
      versionLabel: 'runtime-v24',
      capabilities: {
        read: true,
        write: true,
        runEvents: true,
        runEventPolling: true,
        runEventStream: true,
        reviewDecisions: true,
        contextPacketRefs: true,
        proposalSetRefs: true,
      },
    })
    expect(runtime.runClient).toBeDefined()
    expect(transport).toHaveBeenCalledWith({
      method: 'GET',
      path: '/api/projects/project-1/runtime-info',
    })
  })

  it('adapts project runtime info into the legacy scene runtime info contract', async () => {
    const transport = createTransportMock()
    const runtime = createApiProjectRuntime({ projectId: 'project-1', transport: { requestJson: transport } })

    await expect(runtime.sceneClient.getRuntimeInfo()).resolves.toEqual<SceneRuntimeInfo>({
      source: 'preload-bridge',
      label: 'runtime-v24',
      capabilities: Object.fromEntries(sceneRuntimeCapabilities.map((capability) => [capability, true])) as SceneRuntimeInfo['capabilities'],
    })
    expect(transport).toHaveBeenCalledWith({
      method: 'GET',
      path: '/api/projects/project-1/runtime-info',
    })
  })

  it('uses the book structure endpoint', async () => {
    const transport = createTransportMock()
    const runtime = createApiProjectRuntime({ projectId: 'project-1', transport: { requestJson: transport } })

    await expect(runtime.bookClient.getBookStructureRecord({ bookId: 'book-1' })).resolves.toMatchObject({
      bookId: 'book-1',
    })
    expect(transport).toHaveBeenCalledWith({
      method: 'GET',
      path: '/api/projects/project-1/books/book-1/structure',
    })
  })

  it('uses POST to build a book export artifact', async () => {
    const transport = createTransportMock()
    const runtime = createApiProjectRuntime({ projectId: 'project-1', transport: { requestJson: transport } })
    const input = createBuildInput()

    await runtime.bookClient.buildBookExportArtifact(input)

    expect(transport).toHaveBeenCalledWith({
      method: 'POST',
      path: '/api/projects/project-1/books/book-1/export-artifacts',
      body: input,
    })
  })

  it('uses POST to reorder a chapter scene', async () => {
    const transport = createTransportMock()
    const runtime = createApiProjectRuntime({ projectId: 'project-1', transport: { requestJson: transport } })

    await runtime.chapterClient.reorderChapterScene({
      chapterId: 'chapter-1',
      sceneId: 'scene-2',
      targetIndex: 3,
    })

    expect(transport).toHaveBeenCalledWith({
      method: 'POST',
      path: '/api/projects/project-1/chapters/chapter-1/scenes/scene-2/reorder',
      body: { targetIndex: 3 },
    })
  })

  it('uses PATCH to update chapter scene structure', async () => {
    const transport = createTransportMock()
    const runtime = createApiProjectRuntime({ projectId: 'project-1', transport: { requestJson: transport } })

    await expect(runtime.chapterClient.updateChapterSceneStructure({
      chapterId: 'chapter-1',
      sceneId: 'scene-2',
      locale: 'zh-CN',
      patch: { summary: 'Updated summary' },
    })).resolves.toMatchObject<Partial<ChapterStructureWorkspaceRecord>>({
      chapterId: 'chapter-1',
      scenes: [
        expect.objectContaining({
          id: 'scene-2',
          summary: expect.objectContaining({
            'zh-CN': 'Updated summary',
          }),
        }),
      ],
    })

    expect(transport).toHaveBeenCalledWith({
      method: 'PATCH',
      path: '/api/projects/project-1/chapters/chapter-1/scenes/scene-2/structure',
      body: {
        locale: 'zh-CN',
        patch: { summary: 'Updated summary' },
      },
    })
  })

  it('provides asset knowledge through the runtime and does not expose persistence', async () => {
    const transport = createTransportMock()
    const runtime = createApiProjectRuntime({ projectId: 'project-1', transport: { requestJson: transport } })

    await expect(runtime.assetClient.getAssetKnowledgeWorkspace({ assetId: 'asset-1' })).resolves.toMatchObject({
      assetId: 'asset-1',
    })
    expect(runtime.persistence).toBeUndefined()
  })

  it('uses PUT and DELETE for review issue decisions', async () => {
    const transport = createTransportMock()
    const runtime = createApiProjectRuntime({ projectId: 'project-1', transport: { requestJson: transport } })

    await expect(
      runtime.reviewClient.setReviewIssueDecision({
        bookId: 'book-1',
        issueId: 'issue-1',
        issueSignature: 'sig-1',
        status: 'reviewed',
      }),
    ).resolves.toMatchObject<Partial<ReviewIssueDecisionRecord>>({
      issueId: 'issue-1',
    })

    await runtime.reviewClient.clearReviewIssueDecision({
      bookId: 'book-1',
      issueId: 'issue-1',
    })

    expect(transport).toHaveBeenNthCalledWith(1, {
      method: 'PUT',
      path: '/api/projects/project-1/books/book-1/review-decisions/issue-1',
      body: {
        bookId: 'book-1',
        issueId: 'issue-1',
        issueSignature: 'sig-1',
        status: 'reviewed',
      },
    })
    expect(transport).toHaveBeenNthCalledWith(2, {
      method: 'DELETE',
      path: '/api/projects/project-1/books/book-1/review-decisions/issue-1',
    })
  })

  it('uses PUT and DELETE for review issue fix actions', async () => {
    const transport = createTransportMock()
    const runtime = createApiProjectRuntime({ projectId: 'project-1', transport: { requestJson: transport } })

    await expect(
      runtime.reviewClient.setReviewIssueFixAction({
        bookId: 'book-1',
        issueId: 'issue-2',
        issueSignature: 'sig-2',
        sourceHandoffId: 'handoff-2',
        sourceHandoffLabel: 'Source handoff',
        targetScope: 'scene',
        status: 'checked',
        note: 'Validated in source scene.',
      }),
    ).resolves.toMatchObject<Partial<ReviewIssueFixActionRecord>>({
      issueId: 'issue-2',
      status: 'checked',
    })

    await runtime.reviewClient.clearReviewIssueFixAction({
      bookId: 'book-1',
      issueId: 'issue-2',
    })

    expect(transport).toHaveBeenNthCalledWith(1, {
      method: 'PUT',
      path: '/api/projects/project-1/books/book-1/review-fix-actions/issue-2',
      body: {
        bookId: 'book-1',
        issueId: 'issue-2',
        issueSignature: 'sig-2',
        sourceHandoffId: 'handoff-2',
        sourceHandoffLabel: 'Source handoff',
        targetScope: 'scene',
        status: 'checked',
        note: 'Validated in source scene.',
      },
    })
    expect(transport).toHaveBeenNthCalledWith(2, {
      method: 'DELETE',
      path: '/api/projects/project-1/books/book-1/review-fix-actions/issue-2',
    })
  })

  it('reuses the scene trace endpoints for the traceability scene client', async () => {
    const transport = createTransportMock()
    const runtime = createApiProjectRuntime({ projectId: 'project-1', transport: { requestJson: transport } })

    await expect(runtime.sceneClient.getSceneExecution('scene-1')).resolves.toMatchObject<Partial<SceneExecutionViewModel>>({
      sceneId: 'scene-1',
    })
    await expect(runtime.traceabilitySceneClient.getSceneExecution('scene-1')).resolves.toMatchObject<
      Partial<SceneExecutionViewModel>
    >({
      sceneId: 'scene-1',
    })
    await expect(runtime.traceabilitySceneClient.previewAcceptedPatch('scene-1')).resolves.toMatchObject<
      Partial<ScenePatchPreviewViewModel>
    >({
      patchId: 'patch-1',
    })

    expect(transport).toHaveBeenNthCalledWith(1, {
      method: 'GET',
      path: '/api/projects/project-1/scenes/scene-1/execution',
    })
    expect(transport).toHaveBeenNthCalledWith(2, {
      method: 'GET',
      path: '/api/projects/project-1/scenes/scene-1/execution',
    })
    expect(transport).toHaveBeenNthCalledWith(3, {
      method: 'GET',
      path: '/api/projects/project-1/scenes/scene-1/patch-preview',
    })
  })

  it('posts scene prose revision requests with the selected revision mode', async () => {
    const transport = createTransportMock()
    const runtime = createApiProjectRuntime({ projectId: 'project-1', transport: { requestJson: transport } })

    await runtime.sceneClient.reviseSceneProse('scene-1', 'compress')

    expect(transport).toHaveBeenCalledWith({
      method: 'POST',
      path: '/api/projects/project-1/scenes/scene-1/prose/revision',
      body: {
        revisionMode: 'compress',
      },
    })
  })

  it('uses the run contract transport routes and omits duplicated ids from write bodies', async () => {
    const transport = vi.fn(async ({ method, path }: { method: string; path: string }) => {
      if (method === 'POST' && path === '/api/projects/project-1/scenes/scene-midnight-platform/runs') {
        return {
          id: 'run-scene-midnight-platform-002',
          scope: 'scene',
          scopeId: 'scene-midnight-platform',
          status: 'waiting_review',
          title: 'Midnight Platform run',
          summary: 'Waiting for review.',
          pendingReviewId: 'review-scene-midnight-platform-002',
          latestEventId: 'run-event-scene-midnight-platform-002-005',
          eventCount: 5,
        } satisfies RunRecord
      }

      if (method === 'GET' && path === '/api/projects/project-1/runs/run-scene-midnight-platform-002') {
        return {
          id: 'run-scene-midnight-platform-002',
          scope: 'scene',
          scopeId: 'scene-midnight-platform',
          status: 'waiting_review',
          title: 'Midnight Platform run',
          summary: 'Waiting for review.',
          pendingReviewId: 'review-scene-midnight-platform-002',
          latestEventId: 'run-event-scene-midnight-platform-002-005',
          eventCount: 5,
        } satisfies RunRecord
      }

      if (method === 'GET' && path === '/api/projects/project-1/runs/run-scene-midnight-platform-002/events') {
        return {
          runId: 'run-scene-midnight-platform-002',
          events: [],
          nextCursor: 'run-event-scene-midnight-platform-002-005',
        } satisfies RunEventsPageRecord
      }

      if (method === 'POST' && path === '/api/projects/project-1/runs/run-scene-midnight-platform-002/review-decisions') {
        return {
          id: 'run-scene-midnight-platform-002',
          scope: 'scene',
          scopeId: 'scene-midnight-platform',
          status: 'completed',
          title: 'Midnight Platform run',
          summary: 'Accepted and applied.',
          latestEventId: 'run-event-scene-midnight-platform-002-009',
          eventCount: 9,
        } satisfies RunRecord
      }

      if (method === 'GET' && path === '/api/projects/project-1/runs/run-scene-midnight-platform-002/artifacts') {
        return {
          runId: 'run-scene-midnight-platform-002',
          artifacts: [
            {
              id: 'ctx-scene-midnight-platform-run-002',
              runId: 'run-scene-midnight-platform-002',
              kind: 'context-packet',
              title: { en: 'Scene context packet', 'zh-CN': 'Scene context packet' },
              summary: { en: 'Packed context.', 'zh-CN': 'Packed context.' },
              statusLabel: { en: 'Built', 'zh-CN': 'Built' },
              createdAtLabel: { en: '2026-04-21 10:03', 'zh-CN': '2026-04-21 10:03' },
              sourceEventIds: ['run-event-scene-midnight-platform-002-003'],
            },
          ],
        } satisfies RunArtifactListResponse
      }

      if (
        method === 'GET'
        && path === '/api/projects/project-1/runs/run-scene-midnight-platform-002/artifacts/ctx-scene-midnight-platform-run-002'
      ) {
        return {
          artifact: {
            id: 'ctx-scene-midnight-platform-run-002',
            runId: 'run-scene-midnight-platform-002',
            kind: 'context-packet',
            title: { en: 'Scene context packet', 'zh-CN': 'Scene context packet' },
            summary: { en: 'Packed context.', 'zh-CN': 'Packed context.' },
            statusLabel: { en: 'Built', 'zh-CN': 'Built' },
            createdAtLabel: { en: '2026-04-21 10:03', 'zh-CN': '2026-04-21 10:03' },
            sourceEventIds: ['run-event-scene-midnight-platform-002-003'],
            sceneId: 'scene-midnight-platform',
            sections: [],
            includedCanonFacts: [],
            includedAssets: [],
            excludedPrivateFacts: [],
            outputSchemaLabel: { en: 'Schema', 'zh-CN': 'Schema' },
            tokenBudgetLabel: { en: '1500 tokens', 'zh-CN': '1500 tokens' },
          },
        } satisfies RunArtifactDetailResponse
      }

      if (method === 'GET' && path === '/api/projects/project-1/runs/run-scene-midnight-platform-002/trace') {
        return {
          runId: 'run-scene-midnight-platform-002',
          nodes: [
            {
              id: 'ctx-scene-midnight-platform-run-002',
              kind: 'context-packet',
              label: { en: 'Scene context packet', 'zh-CN': 'Scene context packet' },
            },
          ],
          links: [],
          summary: {
            proposalSetCount: 0,
            canonPatchCount: 0,
            proseDraftCount: 0,
            missingTraceCount: 0,
          },
        } satisfies RunTraceResponse
      }

      return null
    })
    const runtime = createApiProjectRuntime({ projectId: 'project-1', transport: { requestJson: transport } })

    await expect(
      runtime.runClient.startSceneRun({
        sceneId: 'scene-midnight-platform',
        mode: 'rewrite',
        note: 'Push the stakes harder.',
      }),
    ).resolves.toMatchObject<Partial<RunRecord>>({
      id: 'run-scene-midnight-platform-002',
    })
    await expect(runtime.runClient.getRun({ runId: 'run-scene-midnight-platform-002' })).resolves.toMatchObject<Partial<RunRecord>>({
      id: 'run-scene-midnight-platform-002',
    })
    await expect(
      runtime.runClient.getRunEvents({
        runId: 'run-scene-midnight-platform-002',
        cursor: 'run-event-scene-midnight-platform-002-004',
      }),
    ).resolves.toMatchObject<Partial<RunEventsPageRecord>>({
      runId: 'run-scene-midnight-platform-002',
      nextCursor: 'run-event-scene-midnight-platform-002-005',
    })
    await expect(
      runtime.runClient.submitRunReviewDecision({
        runId: 'run-scene-midnight-platform-002',
        reviewId: 'review-scene-midnight-platform-002',
        decision: 'accept',
        note: 'Accept this draft.',
        patchId: 'patch-1',
        selectedVariants: [
          {
            proposalId: 'proposal-set-scene-midnight-platform-run-002-proposal-001',
            variantId: 'variant-midnight-platform-raise-conflict',
          },
        ],
      }),
    ).resolves.toMatchObject<Partial<RunRecord>>({
      status: 'completed',
    })
    await expect(runtime.runClient.listRunArtifacts({ runId: 'run-scene-midnight-platform-002' })).resolves.toMatchObject({
      runId: 'run-scene-midnight-platform-002',
      artifacts: [
        expect.objectContaining({
          id: 'ctx-scene-midnight-platform-run-002',
          kind: 'context-packet',
        }),
      ],
    })
    await expect(
      runtime.runClient.getRunArtifact({
        runId: 'run-scene-midnight-platform-002',
        artifactId: 'ctx-scene-midnight-platform-run-002',
      }),
    ).resolves.toMatchObject({
      artifact: {
        id: 'ctx-scene-midnight-platform-run-002',
        kind: 'context-packet',
      },
    })
    await expect(runtime.runClient.getRunTrace({ runId: 'run-scene-midnight-platform-002' })).resolves.toMatchObject({
      runId: 'run-scene-midnight-platform-002',
      nodes: [
        expect.objectContaining({
          id: 'ctx-scene-midnight-platform-run-002',
          kind: 'context-packet',
        }),
      ],
    })

    expect(transport).toHaveBeenNthCalledWith(1, {
      method: 'POST',
      path: '/api/projects/project-1/scenes/scene-midnight-platform/runs',
      body: {
        mode: 'rewrite',
        note: 'Push the stakes harder.',
      },
    })
    expect(transport).toHaveBeenNthCalledWith(2, {
      method: 'GET',
      path: '/api/projects/project-1/runs/run-scene-midnight-platform-002',
    })
    expect(transport).toHaveBeenNthCalledWith(3, {
      method: 'GET',
      path: '/api/projects/project-1/runs/run-scene-midnight-platform-002/events',
      query: {
        cursor: 'run-event-scene-midnight-platform-002-004',
      },
    })
    expect(transport).toHaveBeenNthCalledWith(4, {
      method: 'POST',
      path: '/api/projects/project-1/runs/run-scene-midnight-platform-002/review-decisions',
      body: {
        reviewId: 'review-scene-midnight-platform-002',
        decision: 'accept',
        note: 'Accept this draft.',
        patchId: 'patch-1',
        selectedVariants: [
          {
            proposalId: 'proposal-set-scene-midnight-platform-run-002-proposal-001',
            variantId: 'variant-midnight-platform-raise-conflict',
          },
        ],
      },
    })
    expect(transport).toHaveBeenNthCalledWith(5, {
      method: 'GET',
      path: '/api/projects/project-1/runs/run-scene-midnight-platform-002/artifacts',
    })
    expect(transport).toHaveBeenNthCalledWith(6, {
      method: 'GET',
      path: '/api/projects/project-1/runs/run-scene-midnight-platform-002/artifacts/ctx-scene-midnight-platform-run-002',
    })
    expect(transport).toHaveBeenNthCalledWith(7, {
      method: 'GET',
      path: '/api/projects/project-1/runs/run-scene-midnight-platform-002/trace',
    })
  })

  it('passes through run query cursors, including undefined, and does not swallow ApiRequestError', async () => {
    const requestError = new ApiRequestError({
      status: 409,
      message: 'Run review conflict',
      code: 'run-review-conflict',
    })
    const transport = vi.fn(async ({ method, path, query }: { method: string; path: string; query?: unknown }) => {
      if (method === 'GET' && path === '/api/projects/project-1/runs/run-scene-midnight-platform-002/events') {
        expect(query).toEqual({ cursor: undefined })
        return {
          runId: 'run-scene-midnight-platform-002',
          events: [],
        } satisfies RunEventsPageRecord
      }

      if (method === 'POST' && path === '/api/projects/project-1/runs/run-scene-midnight-platform-002/review-decisions') {
        throw requestError
      }

      return null
    })
    const runtime = createApiProjectRuntime({ projectId: 'project-1', transport: { requestJson: transport } })

    await runtime.runClient.getRunEvents({
      runId: 'run-scene-midnight-platform-002',
      cursor: undefined,
    })

    await expect(
      runtime.runClient.submitRunReviewDecision({
        runId: 'run-scene-midnight-platform-002',
        reviewId: 'review-scene-midnight-platform-002',
        decision: 'accept',
      }),
    ).rejects.toBe(requestError)
  })

  it('does not swallow run artifact and trace read failures', async () => {
    const artifactsError = new ApiRequestError({
      status: 500,
      message: 'Artifacts unavailable',
      code: 'run-artifacts-unavailable',
    })
    const artifactError = new ApiRequestError({
      status: 404,
      message: 'Run artifact missing',
      code: 'run-artifact-not-found',
    })
    const traceError = new ApiRequestError({
      status: 500,
      message: 'Trace unavailable',
      code: 'run-trace-unavailable',
    })
    const transport = vi.fn(async ({ method, path }: { method: string; path: string }) => {
      if (method === 'GET' && path === '/api/projects/project-1/runs/run-scene-midnight-platform-002/artifacts') {
        throw artifactsError
      }

      if (
        method === 'GET'
        && path === '/api/projects/project-1/runs/run-scene-midnight-platform-002/artifacts/artifact-missing'
      ) {
        throw artifactError
      }

      if (method === 'GET' && path === '/api/projects/project-1/runs/run-scene-midnight-platform-002/trace') {
        throw traceError
      }

      return null
    })
    const runtime = createApiProjectRuntime({ projectId: 'project-1', transport: { requestJson: transport } })

    await expect(runtime.runClient.listRunArtifacts({ runId: 'run-scene-midnight-platform-002' })).rejects.toBe(artifactsError)
    await expect(
      runtime.runClient.getRunArtifact({
        runId: 'run-scene-midnight-platform-002',
        artifactId: 'artifact-missing',
      }),
    ).rejects.toBe(artifactError)
    await expect(runtime.runClient.getRunTrace({ runId: 'run-scene-midnight-platform-002' })).rejects.toBe(traceError)
  })
})
