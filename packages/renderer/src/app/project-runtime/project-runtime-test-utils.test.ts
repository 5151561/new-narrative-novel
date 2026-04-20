import { describe, expect, it } from 'vitest'

import { createStoryProjectRuntimeEnvironment } from './project-runtime-test-utils'

function createBuildInput() {
  return {
    bookId: 'book-signal-arc',
    exportProfileId: 'profile-editorial-md',
    format: 'markdown' as const,
    filename: 'signal-arc.md',
    mimeType: 'text/markdown',
    title: 'Signal Arc',
    summary: 'Artifact summary',
    content: '# Signal Arc',
    sourceSignature: 'story-runtime-source',
    chapterCount: 1,
    sceneCount: 1,
    wordCount: 88,
    readinessSnapshot: {
      status: 'ready' as const,
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

describe('project runtime story helpers', () => {
  it('creates an isolated story environment with a fresh query client and reset mock state', async () => {
    const first = createStoryProjectRuntimeEnvironment()

    first.queryClient.setQueryData(['story-test'], 'stale-cache')
    await first.runtime.reviewClient.setReviewIssueDecision({
      bookId: 'book-signal-arc',
      issueId: 'issue-story',
      issueSignature: 'issue-story::signature',
      status: 'reviewed',
    })
    await first.runtime.bookClient.buildBookExportArtifact(createBuildInput())
    await first.runtime.chapterClient.reorderChapterScene({
      chapterId: 'chapter-signals-in-rain',
      sceneId: 'scene-ticket-window',
      targetIndex: 0,
    })

    const second = createStoryProjectRuntimeEnvironment()

    expect(second.queryClient).not.toBe(first.queryClient)
    expect(second.queryClient.getQueryData(['story-test'])).toBeUndefined()
    await expect(second.runtime.reviewClient.getBookReviewDecisions({ bookId: 'book-signal-arc' })).resolves.toEqual([])
    await expect(second.runtime.bookClient.getBookExportArtifacts({ bookId: 'book-signal-arc' })).resolves.toEqual([])

    const chapterWorkspace = await second.runtime.chapterClient.getChapterStructureWorkspace({
      chapterId: 'chapter-signals-in-rain',
    })
    expect(chapterWorkspace?.scenes[0]).toMatchObject({ id: 'scene-midnight-platform', order: 1 })
  })
})
