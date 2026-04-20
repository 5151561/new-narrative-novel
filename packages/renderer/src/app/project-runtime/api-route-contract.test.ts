import { describe, expect, it } from 'vitest'

import { apiRouteContract } from './api-route-contract'

describe('api route contract', () => {
  it('builds the book structure route', () => {
    expect(apiRouteContract.bookStructure({ projectId: 'project-1', bookId: 'book-1' })).toBe(
      '/api/projects/project-1/books/book-1/structure',
    )
  })

  it('builds the chapter reorder route', () => {
    expect(
      apiRouteContract.chapterSceneReorder({
        projectId: 'project-1',
        chapterId: 'chapter-1',
        sceneId: 'scene-2',
      }),
    ).toBe('/api/projects/project-1/chapters/chapter-1/scenes/scene-2/reorder')
  })

  it('builds the corrected asset knowledge route with the /api prefix', () => {
    expect(apiRouteContract.assetKnowledge({ projectId: 'project-1', assetId: 'asset-7' })).toBe(
      '/api/projects/project-1/assets/asset-7/knowledge',
    )
  })

  it('builds the corrected review decision and fix action routes', () => {
    expect(
      apiRouteContract.reviewIssueDecision({
        projectId: 'project-1',
        bookId: 'book-1',
        issueId: 'issue-5',
      }),
    ).toBe('/api/projects/project-1/books/book-1/review-decisions/issue-5')
    expect(
      apiRouteContract.reviewIssueFixAction({
        projectId: 'project-1',
        bookId: 'book-1',
        issueId: 'issue-5',
      }),
    ).toBe('/api/projects/project-1/books/book-1/review-fix-actions/issue-5')
  })

  it('builds the scene prose, execution, patch preview, and runtime-info routes', () => {
    expect(apiRouteContract.sceneProse({ projectId: 'project-1', sceneId: 'scene-3' })).toBe(
      '/api/projects/project-1/scenes/scene-3/prose',
    )
    expect(apiRouteContract.sceneExecution({ projectId: 'project-1', sceneId: 'scene-3' })).toBe(
      '/api/projects/project-1/scenes/scene-3/execution',
    )
    expect(apiRouteContract.scenePatchPreview({ projectId: 'project-1', sceneId: 'scene-3' })).toBe(
      '/api/projects/project-1/scenes/scene-3/patch-preview',
    )
    expect(apiRouteContract.sceneRuntimeInfo({ projectId: 'project-1' })).toBe('/api/projects/project-1/runtime-info')
  })
})
