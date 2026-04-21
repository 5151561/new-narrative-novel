import { describe, expect, it, vi } from 'vitest'

import type { BookClient } from '@/features/book/api/book-client'
import type { BookExportArtifactRecord, BuildBookExportArtifactInput } from '@/features/book/api/book-export-artifact-records'
import type { ChapterClient, ReorderChapterSceneInput, UpdateChapterSceneStructureInput } from '@/features/chapter/api/chapter-client'
import type { ChapterStructureWorkspaceRecord } from '@/features/chapter/api/chapter-records'
import type { ReviewClient } from '@/features/review/api/review-client'
import type { ReviewIssueDecisionRecord } from '@/features/review/api/review-decision-records'
import type { ReviewIssueFixActionRecord, SetReviewIssueFixActionInput } from '@/features/review/api/review-fix-action-records'

import { ApiRequestError } from './api-transport'
import { createFakeApiRuntime } from './fake-api-runtime.test-utils'

function createChapterWorkspaceRecord(): ChapterStructureWorkspaceRecord {
  return {
    chapterId: 'chapter-1',
    title: { en: 'Chapter One', 'zh-CN': '第一章' },
    summary: { en: 'Summary', 'zh-CN': '摘要' },
    scenes: [],
    inspector: {
      chapterNotes: [],
      problemsSummary: [],
      assemblyHints: [],
    },
  }
}

function createExportArtifactRecord(input: BuildBookExportArtifactInput): BookExportArtifactRecord {
  return {
    id: 'artifact-1',
    bookId: input.bookId,
    exportProfileId: input.exportProfileId,
    checkpointId: input.checkpointId,
    format: input.format,
    status: 'ready',
    filename: input.filename,
    mimeType: input.mimeType,
    title: input.title,
    summary: input.summary,
    content: input.content,
    sourceSignature: input.sourceSignature,
    chapterCount: input.chapterCount,
    sceneCount: input.sceneCount,
    wordCount: input.wordCount,
    readinessSnapshot: input.readinessSnapshot,
    reviewGateSnapshot: input.reviewGateSnapshot,
    createdAtLabel: '2026-04-21 09:00',
    createdByLabel: 'Editor',
  }
}

function createReviewFixActionRecord(input: SetReviewIssueFixActionInput): ReviewIssueFixActionRecord {
  return {
    id: `${input.bookId}::${input.issueId}`,
    bookId: input.bookId,
    issueId: input.issueId,
    issueSignature: input.issueSignature,
    sourceHandoffId: input.sourceHandoffId,
    sourceHandoffLabel: input.sourceHandoffLabel,
    targetScope: input.targetScope,
    status: input.status,
    note: input.note,
    startedAtLabel: '2026-04-21 09:00',
    updatedAtLabel: '2026-04-21 09:00',
    updatedByLabel: 'Editor',
  }
}

function createReviewDecisionRecord(): ReviewIssueDecisionRecord {
  return {
    id: 'book-1::issue-4',
    bookId: 'book-1',
    issueId: 'issue-4',
    issueSignature: 'sig-4',
    status: 'reviewed',
    updatedAtLabel: '2026-04-21 09:00',
    updatedByLabel: 'Editor',
  }
}

function createBuildInput(): BuildBookExportArtifactInput {
  return {
    bookId: 'book-1',
    exportProfileId: 'profile-1',
    checkpointId: 'checkpoint-1',
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

function expectRecordedRequest(
  requests: Array<{ method: string; path: string; body?: unknown }>,
  expected: { method: string; path: string; body?: unknown },
) {
  expect(requests).toContainEqual(expected)
}

describe('createFakeApiRuntime override matching', () => {
  it('matches override queries regardless of key insertion order', async () => {
    const { runtime } = createFakeApiRuntime({
      overrides: [
        {
          method: 'GET',
          path: '/api/projects/project-smoke/books/book-signal-arc/export-artifacts',
          query: {
            checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
            exportProfileId: 'export-review-packet',
          },
          response: [
            {
              id: 'override-artifact',
            },
          ],
        },
      ],
    })

    await expect(
      runtime.bookClient.getBookExportArtifacts({
        bookId: 'book-signal-arc',
        exportProfileId: 'export-review-packet',
        checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
      }),
    ).resolves.toEqual([
      {
        id: 'override-artifact',
      },
    ])
  })

  it('matches override bodies regardless of key insertion order', async () => {
    const { runtime } = createFakeApiRuntime({
      overrides: [
        {
          method: 'PUT',
          path: '/api/projects/project-smoke/books/book-signal-arc/review-decisions/issue-1',
          body: {
            status: 'deferred',
            issueSignature: 'signature-1',
            issueId: 'issue-1',
            bookId: 'book-signal-arc',
          },
          error: new ApiRequestError({
            status: 409,
            message: 'override-body-match',
          }),
        },
      ],
    })

    await expect(
      runtime.reviewClient.setReviewIssueDecision({
        bookId: 'book-signal-arc',
        issueId: 'issue-1',
        issueSignature: 'signature-1',
        status: 'deferred',
      }),
    ).rejects.toMatchObject({
      message: 'override-body-match',
      status: 409,
    })
  })

  it('treats undefined object entries like JSON transport and matches the same wire payload', async () => {
    const { runtime } = createFakeApiRuntime({
      overrides: [
        {
          method: 'PUT',
          path: '/api/projects/project-smoke/books/book-signal-arc/review-decisions/issue-2',
          body: {
            bookId: 'book-signal-arc',
            issueId: 'issue-2',
            issueSignature: 'signature-2',
            status: 'reviewed',
            note: undefined,
          },
          error: new ApiRequestError({
            status: 409,
            message: 'override-undefined-body-match',
          }),
        },
      ],
    })

    await expect(
      runtime.reviewClient.setReviewIssueDecision({
        bookId: 'book-signal-arc',
        issueId: 'issue-2',
        issueSignature: 'signature-2',
        status: 'reviewed',
      }),
    ).rejects.toMatchObject({
      message: 'override-undefined-body-match',
      status: 409,
    })
  })

  it('records and dispatches all PR22 mutation endpoints through the mock runtime', async () => {
    const reorderChapterScene = vi.fn(async (_input: ReorderChapterSceneInput) => createChapterWorkspaceRecord())
    const updateChapterSceneStructure = vi.fn(async (_input: UpdateChapterSceneStructureInput) => createChapterWorkspaceRecord())
    const buildBookExportArtifact = vi.fn(async (input: BuildBookExportArtifactInput) => createExportArtifactRecord(input))
    const setReviewIssueFixAction = vi.fn(async (input: SetReviewIssueFixActionInput) => createReviewFixActionRecord(input))
    const clearReviewIssueFixAction = vi.fn(async () => {})

    const bookClient: BookClient = {
      async getBookStructureRecord() { return null },
      async getBookManuscriptCheckpoints() { return [] },
      async getBookManuscriptCheckpoint() { return null },
      async getBookExportProfiles() { return [] },
      async getBookExportProfile() { return null },
      async getBookExportArtifacts() { return [] },
      buildBookExportArtifact,
      async getBookExperimentBranches() { return [] },
      async getBookExperimentBranch() { return null },
    }
    const chapterClient: ChapterClient = {
      async getChapterStructureWorkspace() { return null },
      reorderChapterScene,
      updateChapterSceneStructure,
    }
    const reviewClient: ReviewClient = {
      async getBookReviewDecisions() { return [] },
      async setReviewIssueDecision() { return createReviewDecisionRecord() },
      async clearReviewIssueDecision() {},
      async getBookReviewFixActions() { return [] },
      setReviewIssueFixAction,
      clearReviewIssueFixAction,
    }

    const { requests, runtime } = createFakeApiRuntime({
      projectId: 'project-1',
      mockRuntimeOptions: {
        projectId: 'project-1',
        bookClient,
        chapterClient,
        reviewClient,
      },
    })

    const exportInput = createBuildInput()
    const fixActionInput = {
      bookId: 'book-1',
      issueId: 'issue-7',
      issueSignature: 'sig-7',
      sourceHandoffId: 'handoff-7',
      sourceHandoffLabel: 'Chapter handoff',
      targetScope: 'scene' as const,
      status: 'started' as const,
      note: 'Start patching source prose.',
    }

    await runtime.chapterClient.reorderChapterScene({
      chapterId: 'chapter-1',
      sceneId: 'scene-2',
      targetIndex: 3,
    })
    await runtime.chapterClient.updateChapterSceneStructure({
      chapterId: 'chapter-1',
      sceneId: 'scene-2',
      locale: 'zh-CN',
      patch: { summary: 'Updated summary' },
    })
    await runtime.reviewClient.setReviewIssueDecision({
      bookId: 'book-1',
      issueId: 'issue-4',
      issueSignature: 'sig-4',
      status: 'reviewed',
    })
    await runtime.reviewClient.clearReviewIssueDecision({
      bookId: 'book-1',
      issueId: 'issue-4',
    })
    await runtime.reviewClient.setReviewIssueFixAction(fixActionInput)
    await runtime.reviewClient.clearReviewIssueFixAction({
      bookId: 'book-1',
      issueId: 'issue-7',
    })
    await expect(runtime.bookClient.buildBookExportArtifact(exportInput)).resolves.toMatchObject({
      id: 'artifact-1',
      bookId: 'book-1',
    })

    expect(reorderChapterScene).toHaveBeenCalledWith({
      chapterId: 'chapter-1',
      sceneId: 'scene-2',
      targetIndex: 3,
    })
    expect(updateChapterSceneStructure).toHaveBeenCalledWith({
      chapterId: 'chapter-1',
      sceneId: 'scene-2',
      locale: 'zh-CN',
      patch: { summary: 'Updated summary' },
    })
    expect(setReviewIssueFixAction).toHaveBeenCalledWith(fixActionInput)
    expect(clearReviewIssueFixAction).toHaveBeenCalledWith({
      bookId: 'book-1',
      issueId: 'issue-7',
    })
    expect(buildBookExportArtifact).toHaveBeenCalledWith(exportInput)
    expectRecordedRequest(requests, {
      method: 'POST',
      path: '/api/projects/project-1/chapters/chapter-1/scenes/scene-2/reorder',
      body: { targetIndex: 3 },
    })
    expectRecordedRequest(requests, {
      method: 'PATCH',
      path: '/api/projects/project-1/chapters/chapter-1/scenes/scene-2/structure',
      body: {
        locale: 'zh-CN',
        patch: { summary: 'Updated summary' },
      },
    })
    expectRecordedRequest(requests, {
      method: 'PUT',
      path: '/api/projects/project-1/books/book-1/review-decisions/issue-4',
      body: {
        bookId: 'book-1',
        issueId: 'issue-4',
        issueSignature: 'sig-4',
        status: 'reviewed',
      },
    })
    expectRecordedRequest(requests, {
      method: 'DELETE',
      path: '/api/projects/project-1/books/book-1/review-decisions/issue-4',
    })
    expectRecordedRequest(requests, {
      method: 'PUT',
      path: '/api/projects/project-1/books/book-1/review-fix-actions/issue-7',
      body: fixActionInput,
    })
    expectRecordedRequest(requests, {
      method: 'DELETE',
      path: '/api/projects/project-1/books/book-1/review-fix-actions/issue-7',
    })
    expectRecordedRequest(requests, {
      method: 'POST',
      path: '/api/projects/project-1/books/book-1/export-artifacts',
      body: exportInput,
    })
  })

  it('supports stable mutation-body overrides that throw 409, 422, and 500 ApiRequestError values', async () => {
    const exportInput = createBuildInput()
    const { runtime } = createFakeApiRuntime({
      projectId: 'project-1',
      overrides: [
        {
          method: 'POST',
          path: '/api/projects/project-1/chapters/chapter-1/scenes/scene-2/reorder',
          body: { targetIndex: 3 },
          error: new ApiRequestError({
            status: 409,
            message: 'reorder-conflict',
            code: 'SCENE_CONFLICT',
          }),
        },
        {
          method: 'PATCH',
          path: '/api/projects/project-1/chapters/chapter-1/scenes/scene-2/structure',
          body: {
            patch: { summary: 'Updated summary' },
            locale: 'zh-CN',
          },
          error: new ApiRequestError({
            status: 422,
            message: 'structure-invalid',
            code: 'SCENE_VALIDATION',
          }),
        },
        {
          method: 'POST',
          path: '/api/projects/project-1/books/book-1/export-artifacts',
          body: {
            reviewGateSnapshot: exportInput.reviewGateSnapshot,
            readinessSnapshot: exportInput.readinessSnapshot,
            sourceSignature: exportInput.sourceSignature,
            summary: exportInput.summary,
            wordCount: exportInput.wordCount,
            chapterCount: exportInput.chapterCount,
            bookId: exportInput.bookId,
            content: exportInput.content,
            exportProfileId: exportInput.exportProfileId,
            filename: exportInput.filename,
            format: exportInput.format,
            mimeType: exportInput.mimeType,
            sceneCount: exportInput.sceneCount,
            title: exportInput.title,
            checkpointId: exportInput.checkpointId,
          },
          error: new ApiRequestError({
            status: 500,
            message: 'export-unavailable',
            code: 'EXPORT_DOWN',
          }),
        },
      ],
    })

    await expect(
      runtime.chapterClient.reorderChapterScene({
        chapterId: 'chapter-1',
        sceneId: 'scene-2',
        targetIndex: 3,
      }),
    ).rejects.toMatchObject({
      status: 409,
      message: 'reorder-conflict',
      code: 'SCENE_CONFLICT',
    })

    await expect(
      runtime.chapterClient.updateChapterSceneStructure({
        chapterId: 'chapter-1',
        sceneId: 'scene-2',
        locale: 'zh-CN',
        patch: { summary: 'Updated summary' },
      }),
    ).rejects.toMatchObject({
      status: 422,
      message: 'structure-invalid',
      code: 'SCENE_VALIDATION',
    })

    await expect(runtime.bookClient.buildBookExportArtifact(exportInput)).rejects.toMatchObject({
      status: 500,
      message: 'export-unavailable',
      code: 'EXPORT_DOWN',
    })
  })
})
