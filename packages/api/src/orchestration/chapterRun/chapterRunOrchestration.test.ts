import { describe, expect, it } from 'vitest'

import type { ChapterStructureWorkspaceRecord } from '../../contracts/api-records.js'
import {
  CHAPTER_RUN_ACCEPTED_BACKLOG_REQUIRED,
  CHAPTER_RUN_ALL_SCENES_DRAFTED,
  CHAPTER_RUN_REVIEW_GATE_BLOCKED,
  resolveNextChapterRunScene,
  updateChapterRunSceneBacklogStatus,
} from './chapterRunOrchestration.js'

function text(en: string) {
  return { en, 'zh-CN': en }
}

function createChapter(
  statuses: Array<'planned' | 'running' | 'needs_review' | 'drafted' | 'revised'>,
): ChapterStructureWorkspaceRecord {
  const proposalId = 'chapter-a-backlog-proposal-001'
  const scenes = statuses.map((backlogStatus, index) => ({
    id: `scene-${index + 1}`,
    order: index + 1,
    title: text(`Scene ${index + 1}`),
    summary: text(`Summary ${index + 1}`),
    purpose: text(`Purpose ${index + 1}`),
    pov: text('POV'),
    location: text('Location'),
    conflict: text('Conflict'),
    reveal: text('Reveal'),
    backlogStatus,
    statusLabel: text('Status'),
    proseStatusLabel: text('Needs draft'),
    runStatusLabel: text('Idle'),
    unresolvedCount: 0,
    lastRunLabel: text('Not run'),
  }))

  return {
    chapterId: 'chapter-a',
    title: text('Chapter A'),
    summary: text('Chapter summary'),
    planning: {
      goal: text('Goal'),
      constraints: [],
      acceptedProposalId: proposalId,
      proposals: [
        {
          proposalId,
          chapterId: 'chapter-a',
          goalSnapshot: text('Goal'),
          constraintSnapshot: [],
          status: 'accepted',
          scenes: scenes.map((scene) => ({
            proposalSceneId: `${proposalId}::${scene.id}`,
            sceneId: scene.id,
            order: scene.order,
            title: scene.title,
            summary: scene.summary,
            purpose: scene.purpose,
            pov: scene.pov,
            location: scene.location,
            conflict: scene.conflict,
            reveal: scene.reveal,
            backlogStatus: scene.backlogStatus,
            plannerNotes: text('Planner notes'),
          })),
        },
      ],
    },
    scenes,
    inspector: {
      chapterNotes: [],
      problemsSummary: [],
      assemblyHints: [],
    },
  }
}

describe('resolveNextChapterRunScene', () => {
  it('selects the first planned scene from the accepted backlog order', () => {
    const result = resolveNextChapterRunScene(createChapter(['drafted', 'planned', 'planned']))
    expect(result).toEqual({
      ok: true,
      scene: expect.objectContaining({
        sceneId: 'scene-2',
        order: 2,
        backlogStatus: 'planned',
      }),
    })
  })

  it('blocks when an earlier accepted scene is waiting for review', () => {
    const result = resolveNextChapterRunScene(createChapter(['needs_review', 'planned']))
    expect(result).toEqual({
      ok: false,
      code: CHAPTER_RUN_REVIEW_GATE_BLOCKED,
      blockingSceneId: 'scene-1',
    })
  })

  it('blocks when the chapter has no accepted backlog proposal', () => {
    const chapter = createChapter(['planned'])
    chapter.planning.acceptedProposalId = undefined
    const result = resolveNextChapterRunScene(chapter)
    expect(result).toEqual({
      ok: false,
      code: CHAPTER_RUN_ACCEPTED_BACKLOG_REQUIRED,
    })
  })

  it('reports completion when all accepted scenes are drafted or revised', () => {
    const result = resolveNextChapterRunScene(createChapter(['drafted', 'revised']))
    expect(result).toEqual({
      ok: false,
      code: CHAPTER_RUN_ALL_SCENES_DRAFTED,
    })
  })
})

describe('updateChapterRunSceneBacklogStatus', () => {
  it('updates canonical scene and accepted proposal scene status together', () => {
    const updated = updateChapterRunSceneBacklogStatus(createChapter(['planned']), {
      sceneId: 'scene-1',
      backlogStatus: 'needs_review',
    })
    expect(updated.scenes[0]?.backlogStatus).toBe('needs_review')
    expect(updated.planning.proposals[0]?.scenes[0]?.backlogStatus).toBe('needs_review')
  })

  it('leaves non-accepted proposal history untouched', () => {
    const chapter = createChapter(['planned'])
    chapter.planning.proposals.push({
      proposalId: 'chapter-a-backlog-proposal-002',
      chapterId: 'chapter-a',
      goalSnapshot: text('Older goal'),
      constraintSnapshot: [],
      status: 'draft',
      scenes: [
        {
          proposalSceneId: 'chapter-a-backlog-proposal-002::scene-1',
          sceneId: 'scene-1',
          order: 1,
          title: text('Older Scene 1'),
          summary: text('Older Summary 1'),
          purpose: text('Older Purpose 1'),
          pov: text('Older POV'),
          location: text('Older Location'),
          conflict: text('Older Conflict'),
          reveal: text('Older Reveal'),
          backlogStatus: 'planned',
          plannerNotes: text('Older planner notes'),
        },
      ],
    })

    const updated = updateChapterRunSceneBacklogStatus(chapter, {
      sceneId: 'scene-1',
      backlogStatus: 'needs_review',
    })

    expect(updated.planning.proposals[0]?.scenes[0]?.backlogStatus).toBe('needs_review')
    expect(updated.planning.proposals[1]?.scenes[0]?.backlogStatus).toBe('planned')
  })
})
