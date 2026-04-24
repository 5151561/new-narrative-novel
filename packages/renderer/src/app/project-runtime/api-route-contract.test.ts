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

  it('builds the chapter structure write route', () => {
    expect(
      apiRouteContract.chapterSceneStructure({
        projectId: 'project-1',
        chapterId: 'chapter-1',
        sceneId: 'scene-2',
      }),
    ).toBe('/api/projects/project-1/chapters/chapter-1/scenes/scene-2/structure')
  })

  it('builds the book export artifact write route', () => {
    expect(apiRouteContract.bookExportArtifacts({ projectId: 'project-1', bookId: 'book-1' })).toBe(
      '/api/projects/project-1/books/book-1/export-artifacts',
    )
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
    expect(apiRouteContract.projectRuntimeInfo({ projectId: 'project-1' })).toBe('/api/projects/project-1/runtime-info')
    expect(apiRouteContract.sceneRuntimeInfo({ projectId: 'project-1' })).toBe('/api/projects/project-1/runtime-info')
  })

  it('builds the run contract routes', () => {
    expect(apiRouteContract.sceneRuns({ projectId: 'project-1', sceneId: 'scene-3' })).toBe(
      '/api/projects/project-1/scenes/scene-3/runs',
    )
    expect(apiRouteContract.run({ projectId: 'project-1', runId: 'run-7' })).toBe(
      '/api/projects/project-1/runs/run-7',
    )
    expect(apiRouteContract.runEvents({ projectId: 'project-1', runId: 'run-7' })).toBe(
      '/api/projects/project-1/runs/run-7/events',
    )
    expect(apiRouteContract.runArtifacts({ projectId: 'project-1', runId: 'run-7' })).toBe(
      '/api/projects/project-1/runs/run-7/artifacts',
    )
    expect(apiRouteContract.runArtifact({ projectId: 'project-1', runId: 'run-7', artifactId: 'artifact-9' })).toBe(
      '/api/projects/project-1/runs/run-7/artifacts/artifact-9',
    )
    expect(apiRouteContract.runTrace({ projectId: 'project-1', runId: 'run-7' })).toBe(
      '/api/projects/project-1/runs/run-7/trace',
    )
    expect(apiRouteContract.runEventsStream({ projectId: 'project-1', runId: 'run-7' })).toBe(
      '/api/projects/project-1/runs/run-7/events/stream',
    )
    expect(apiRouteContract.runReviewDecisions({ projectId: 'project-1', runId: 'run-7' })).toBe(
      '/api/projects/project-1/runs/run-7/review-decisions',
    )
  })

  it('escapes run contract path segments', () => {
    expect(
      apiRouteContract.sceneRuns({
        projectId: 'project / one',
        sceneId: 'scene / midnight platform',
      }),
    ).toBe('/api/projects/project%20%2F%20one/scenes/scene%20%2F%20midnight%20platform/runs')

    expect(
      apiRouteContract.runEvents({
        projectId: 'project / one',
        runId: 'run / review 1',
      }),
    ).toBe('/api/projects/project%20%2F%20one/runs/run%20%2F%20review%201/events')
    expect(
      apiRouteContract.runArtifact({
        projectId: 'project / one',
        runId: 'run / review 1',
        artifactId: 'ctx / 1',
      }),
    ).toBe('/api/projects/project%20%2F%20one/runs/run%20%2F%20review%201/artifacts/ctx%20%2F%201')
  })

  it('escapes the project runtime info project id and preserves the scene alias path', () => {
    expect(apiRouteContract.projectRuntimeInfo({ projectId: 'project / one' })).toBe(
      '/api/projects/project%20%2F%20one/runtime-info',
    )
    expect(apiRouteContract.sceneRuntimeInfo({ projectId: 'project / one' })).toBe(
      '/api/projects/project%20%2F%20one/runtime-info',
    )
  })
})
