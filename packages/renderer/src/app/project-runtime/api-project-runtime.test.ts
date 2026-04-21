import { describe, expect, it, vi } from 'vitest'

import type { BuildBookExportArtifactInput } from '@/features/book/api/book-export-artifact-records'
import type { ChapterStructureWorkspaceRecord } from '@/features/chapter/api/chapter-records'
import type { ReviewIssueDecisionRecord } from '@/features/review/api/review-decision-records'
import type { ReviewIssueFixActionRecord } from '@/features/review/api/review-fix-action-records'
import type { SceneExecutionViewModel, ScenePatchPreviewViewModel } from '@/features/scene/types/scene-view-models'

import { createApiProjectRuntime } from './api-project-runtime'

function createTransportMock() {
  return vi.fn(async ({ path, method, body }: { path: string; method: string; body?: unknown }) => {
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
})
