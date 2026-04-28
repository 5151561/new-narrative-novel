import { describe, expect, it } from 'vitest'

import {
  buildChapterDraftStoryWorkspace,
  buildChapterDraftWaitingReviewStoryWorkspace,
  buildChapterStoryWorkspace,
} from './chapter-story-fixture'

describe('chapter story fixture localization', () => {
  it('builds localized chapter structure fixture content for zh-CN', () => {
    const workspace = buildChapterStoryWorkspace('scene-midnight-platform', 'zh-CN')

    expect(workspace.title).toBe('雨中信号')
    expect(workspace.summary).toContain('章节工作台')
    expect(workspace.scenes[0]?.title).toBe('午夜站台')
    expect(workspace.scenes[0]?.statusLabel).toBe('当前')
    expect(workspace.planning.constraints[0]?.label).toBe('让账本在公共场域保持关闭。')
    expect(workspace.inspector.selectedSceneBrief?.unresolvedLabel).toBe('未决 3')
  })

  it('builds localized chapter draft fixture content for zh-CN', () => {
    const workspace = buildChapterDraftStoryWorkspace('scene-concourse-delay', 'zh-CN')

    expect(workspace.title).toBe('雨中信号')
    expect(workspace.selectedScene.title).toBe('候车厅延误')
    expect(workspace.selectedScene.proseStatusLabel).toBe('草稿交接已就绪')
    expect(workspace.selectedScene.latestDiffSummary).toContain('见证压力')
    expect(workspace.dockSummary.queuedRevisionScenes[0]?.detail).toBe('1 个待处理修订')
    expect(workspace.selectedScene.backlogStatus).toBe('needs_review')
    expect(workspace.dockSummary.waitingReviewCount).toBe(1)
  })

  it('builds a waiting-review draft fixture with a runnable follow-up scene', () => {
    const workspace = buildChapterDraftWaitingReviewStoryWorkspace('scene-concourse-delay', 'en')

    expect(workspace.dockSummary.waitingReviewCount).toBe(1)
    expect(workspace.dockSummary.runnableScene?.sceneId).toBe('scene-ticket-window')
    expect(workspace.dockSummary.waitingReviewScenes[0]?.detail).toBe('Run waiting for review')
  })
})
