import { describe, expect, it } from 'vitest'

import type { ChapterDraftAssemblyRecord } from '@/features/chapter/api/chapter-draft-assembly-records'
import type { ChapterStructureWorkspaceRecord } from '@/features/chapter/api/chapter-records'
import type { SceneProseViewModel } from '@/features/scene/types/scene-view-models'

import {
  mapChapterDraftAssemblyRecord,
  mapLegacyChapterDraftWorkspace,
} from './chapter-draft-assembly-mappers'

function createAssemblyRecord(): ChapterDraftAssemblyRecord {
  return {
    chapterId: 'chapter-signals-in-rain',
    title: { en: 'Signals in Rain', 'zh-CN': '雨中信号' },
    summary: { en: 'Current live chapter assembly', 'zh-CN': '当前实时章节装配' },
    sceneCount: 3,
    draftedSceneCount: 1,
    missingDraftCount: 2,
    assembledWordCount: 9,
    warningsCount: 2,
    queuedRevisionCount: 1,
    tracedSceneCount: 1,
    missingTraceSceneCount: 2,
    scenes: [
      {
        kind: 'scene-draft',
        sceneId: 'scene-midnight-platform',
        order: 1,
        title: { en: 'Midnight Platform', 'zh-CN': '午夜站台' },
        summary: { en: 'Drafted opener', 'zh-CN': '已成稿开场' },
        backlogStatus: 'drafted',
        proseStatusLabel: { en: 'Generated', 'zh-CN': '已生成' },
        proseDraft: 'Accepted platform draft.',
        warningsCount: 0,
        revisionQueueCount: 0,
        draftWordCount: 3,
        traceReady: true,
        traceRollup: {
          acceptedFactCount: 2,
          relatedAssetCount: 1,
          sourceProposalCount: 1,
          missingLinks: [],
        },
        sourcePatchId: 'patch-1',
        sourceProposals: [{ proposalId: 'proposal-1', sourceTraceId: 'trace-1' }],
        acceptedFactIds: ['fact-1', 'fact-2'],
        relatedAssets: [{ assetId: 'asset-ren-voss', title: 'Ren Voss', kind: 'character' }],
      },
      {
        kind: 'scene-gap',
        sceneId: 'scene-concourse-delay',
        order: 2,
        title: { en: 'Concourse Delay', 'zh-CN': '大厅延误' },
        summary: { en: 'Gap scene', 'zh-CN': '缺稿场景' },
        backlogStatus: 'needs_review',
        proseStatusLabel: { en: 'Waiting for prose artifact', 'zh-CN': '等待正文产物' },
        warningsCount: 1,
        revisionQueueCount: 1,
        traceReady: false,
        traceRollup: {
          acceptedFactCount: 0,
          relatedAssetCount: 0,
          sourceProposalCount: 0,
          missingLinks: ['trace'],
        },
        gapReason: { en: 'No prose draft has been materialized yet.', 'zh-CN': '尚未生成正文草稿。' },
      },
      {
        kind: 'scene-gap',
        sceneId: 'scene-ticket-window',
        order: 3,
        title: { en: 'Ticket Window', 'zh-CN': '售票窗' },
        summary: { en: 'Another gap', 'zh-CN': '另一处缺稿' },
        backlogStatus: 'planned',
        proseStatusLabel: { en: 'Missing draft', 'zh-CN': '缺少草稿' },
        warningsCount: 1,
        traceReady: false,
        traceRollup: {
          acceptedFactCount: 0,
          relatedAssetCount: 0,
          sourceProposalCount: 0,
          missingLinks: ['trace'],
        },
        gapReason: { en: 'Gap is explicit.', 'zh-CN': '缺口保持显式。' },
      },
    ],
    sections: [
      {
        kind: 'scene-draft',
        sceneId: 'scene-midnight-platform',
        order: 1,
        title: { en: 'Midnight Platform', 'zh-CN': '午夜站台' },
        summary: { en: 'Drafted opener', 'zh-CN': '已成稿开场' },
        backlogStatus: 'drafted',
        proseStatusLabel: { en: 'Generated', 'zh-CN': '已生成' },
        proseDraft: 'Accepted platform draft.',
        warningsCount: 0,
        revisionQueueCount: 0,
        draftWordCount: 3,
        traceReady: true,
        traceRollup: {
          acceptedFactCount: 2,
          relatedAssetCount: 1,
          sourceProposalCount: 1,
          missingLinks: [],
        },
        sourcePatchId: 'patch-1',
        sourceProposals: [{ proposalId: 'proposal-1', sourceTraceId: 'trace-1' }],
        acceptedFactIds: ['fact-1', 'fact-2'],
        relatedAssets: [{ assetId: 'asset-ren-voss', title: 'Ren Voss', kind: 'character' }],
      },
      {
        kind: 'transition-gap',
        fromSceneId: 'scene-midnight-platform',
        toSceneId: 'scene-concourse-delay',
        fromSceneTitle: { en: 'Midnight Platform', 'zh-CN': '午夜站台' },
        toSceneTitle: { en: 'Concourse Delay', 'zh-CN': '大厅延误' },
        gapReason: { en: 'No artifact-backed transition draft.', 'zh-CN': '没有带产物引用的过渡草稿。' },
      },
      {
        kind: 'scene-gap',
        sceneId: 'scene-concourse-delay',
        order: 2,
        title: { en: 'Concourse Delay', 'zh-CN': '大厅延误' },
        summary: { en: 'Gap scene', 'zh-CN': '缺稿场景' },
        backlogStatus: 'needs_review',
        proseStatusLabel: { en: 'Waiting for prose artifact', 'zh-CN': '等待正文产物' },
        warningsCount: 1,
        revisionQueueCount: 1,
        traceReady: false,
        traceRollup: {
          acceptedFactCount: 0,
          relatedAssetCount: 0,
          sourceProposalCount: 0,
          missingLinks: ['trace'],
        },
        gapReason: { en: 'No prose draft has been materialized yet.', 'zh-CN': '尚未生成正文草稿。' },
      },
      {
        kind: 'transition-draft',
        fromSceneId: 'scene-concourse-delay',
        toSceneId: 'scene-ticket-window',
        fromSceneTitle: { en: 'Concourse Delay', 'zh-CN': '大厅延误' },
        toSceneTitle: { en: 'Ticket Window', 'zh-CN': '售票窗' },
        transitionProse: 'Artifact-backed handoff.',
        artifactRef: {
          kind: 'prose-draft',
          id: 'transition-artifact-1',
        },
      },
      {
        kind: 'scene-gap',
        sceneId: 'scene-ticket-window',
        order: 3,
        title: { en: 'Ticket Window', 'zh-CN': '售票窗' },
        summary: { en: 'Another gap', 'zh-CN': '另一处缺稿' },
        backlogStatus: 'planned',
        proseStatusLabel: { en: 'Missing draft', 'zh-CN': '缺少草稿' },
        warningsCount: 1,
        traceReady: false,
        traceRollup: {
          acceptedFactCount: 0,
          relatedAssetCount: 0,
          sourceProposalCount: 0,
          missingLinks: ['trace'],
        },
        gapReason: { en: 'Gap is explicit.', 'zh-CN': '缺口保持显式。' },
      },
    ],
  }
}

function createLegacyWorkspaceRecord(): ChapterStructureWorkspaceRecord {
  return {
    chapterId: 'chapter-signals-in-rain',
    title: { en: 'Signals in Rain', 'zh-CN': '雨中信号' },
    summary: { en: 'Legacy structure workspace', 'zh-CN': '旧结构工作区' },
    planning: {
      goal: { en: 'Goal', 'zh-CN': '目标' },
      constraints: [],
      proposals: [],
    },
    scenes: [
      {
        id: 'scene-concourse-delay',
        order: 2,
        title: { en: 'Concourse Delay', 'zh-CN': '大厅延误' },
        summary: { en: 'Gap scene', 'zh-CN': '缺稿场景' },
        purpose: { en: 'Purpose', 'zh-CN': '目的' },
        pov: { en: 'POV', 'zh-CN': '视角' },
        location: { en: 'Location', 'zh-CN': '地点' },
        conflict: { en: 'Conflict', 'zh-CN': '冲突' },
        reveal: { en: 'Reveal', 'zh-CN': '揭示' },
        backlogStatus: 'planned',
        statusLabel: { en: 'Queued', 'zh-CN': '排队中' },
        proseStatusLabel: { en: 'Missing draft', 'zh-CN': '缺少草稿' },
        runStatusLabel: { en: 'Idle', 'zh-CN': '未开始' },
        unresolvedCount: 1,
        lastRunLabel: { en: 'Never', 'zh-CN': '从未' },
      },
      {
        id: 'scene-midnight-platform',
        order: 1,
        title: { en: 'Midnight Platform', 'zh-CN': '午夜站台' },
        summary: { en: 'Drafted opener', 'zh-CN': '已成稿开场' },
        purpose: { en: 'Purpose', 'zh-CN': '目的' },
        pov: { en: 'POV', 'zh-CN': '视角' },
        location: { en: 'Location', 'zh-CN': '地点' },
        conflict: { en: 'Conflict', 'zh-CN': '冲突' },
        reveal: { en: 'Reveal', 'zh-CN': '揭示' },
        backlogStatus: 'drafted',
        statusLabel: { en: 'Current', 'zh-CN': '当前' },
        proseStatusLabel: { en: 'Generated', 'zh-CN': '已生成' },
        runStatusLabel: { en: 'Run completed', 'zh-CN': '运行完成' },
        unresolvedCount: 0,
        lastRunLabel: { en: 'Run 1', 'zh-CN': '运行 1' },
      },
    ],
    inspector: {
      chapterNotes: [],
      problemsSummary: [],
      assemblyHints: [],
    },
  }
}

describe('chapter draft assembly mappers', () => {
  it('maps the live chapter draft assembly record into a scene-first workspace while preserving transition metadata', () => {
    const workspace = mapChapterDraftAssemblyRecord(createAssemblyRecord(), 'scene-concourse-delay', 'en')

    expect(workspace).toMatchObject({
      chapterId: 'chapter-signals-in-rain',
      selectedSceneId: 'scene-concourse-delay',
      draftedSceneCount: 1,
      missingDraftCount: 2,
      assembledWordCount: 9,
      selectedScene: {
        sceneId: 'scene-concourse-delay',
        proseStatusLabel: 'Waiting for prose artifact',
        isMissingDraft: true,
        latestDiffSummary: 'No prose draft has been materialized yet.',
      },
      inspector: {
        chapterReadiness: {
          draftedSceneCount: 1,
          missingDraftCount: 2,
          queuedRevisionCount: 1,
        },
      },
      dockSummary: {
        missingDraftCount: 2,
        transitionGapCount: 1,
        transitionReadyCount: 1,
      },
    })
    expect(workspace.scenes.map((scene) => scene.sceneId)).toEqual([
      'scene-midnight-platform',
      'scene-concourse-delay',
      'scene-ticket-window',
    ])
    expect(workspace.scenes[0]).toMatchObject({
      sceneId: 'scene-midnight-platform',
      traceSummary: {
        sourceFactCount: 2,
        relatedAssetCount: 1,
        status: 'ready',
      },
    })
    const transitionReadySection = workspace.sections?.find((section) => section.kind === 'transition' && section.status === 'ready')
    expect(transitionReadySection).toBeTruthy()
    expect(transitionReadySection).toMatchObject({
      proseDraft: 'Artifact-backed handoff.',
    })
    expect(transitionReadySection?.detail).not.toBe('Artifact-backed handoff.')
  })

  it('falls back to structure plus scene prose records when live assembly is unavailable', () => {
    const proseBySceneId: Record<string, SceneProseViewModel> = {
      'scene-midnight-platform': {
        sceneId: 'scene-midnight-platform',
        proseDraft: 'Accepted platform prose stays readable.',
        revisionModes: ['rewrite'],
        latestDiffSummary: 'Accepted review decision already propagated.',
        warningsCount: 0,
        focusModeAvailable: true,
        revisionQueueCount: 0,
        draftWordCount: 5,
        statusLabel: 'Accepted manuscript draft',
        traceSummary: {
          acceptedFactIds: ['fact-1'],
          relatedAssets: [{ assetId: 'asset-ren-voss', title: 'Ren Voss', kind: 'character' }],
        },
      },
      'scene-concourse-delay': {
        sceneId: 'scene-concourse-delay',
        revisionModes: ['rewrite'],
        warningsCount: 1,
        focusModeAvailable: true,
        revisionQueueCount: 1,
        statusLabel: 'Waiting for prose artifact',
      },
    }

    const workspace = mapLegacyChapterDraftWorkspace(createLegacyWorkspaceRecord(), proseBySceneId, null, 'en')

    expect(workspace).toMatchObject({
      chapterId: 'chapter-signals-in-rain',
      selectedSceneId: 'scene-midnight-platform',
      draftedSceneCount: 1,
      missingDraftCount: 1,
      assembledWordCount: 5,
      selectedScene: {
        sceneId: 'scene-midnight-platform',
        proseStatusLabel: 'Accepted manuscript draft',
      },
      dockSummary: {
        transitionGapCount: 1,
        transitionReadyCount: 0,
      },
    })
    expect(workspace.scenes[1]).toMatchObject({
      sceneId: 'scene-concourse-delay',
      isMissingDraft: true,
      latestDiffSummary: 'No chapter manuscript draft has been assembled for this scene yet.',
    })
  })
})
