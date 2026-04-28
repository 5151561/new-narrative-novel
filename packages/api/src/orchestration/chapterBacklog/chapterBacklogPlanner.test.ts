import { describe, expect, it } from 'vitest'

import { createChapterBacklogProposal } from './chapterBacklogPlanner.js'

describe('createChapterBacklogProposal', () => {
  it('uses chapter goal and constraints while preserving scene order and default backlog status', () => {
    const proposal = createChapterBacklogProposal({
      chapterId: 'chapter-signals-in-rain',
      proposalSequence: 1,
      planning: {
        goal: {
          en: 'Lock the bargain before the witness turns the ledger public.',
          'zh-CN': '在目击者把账本公开之前锁定交易。',
        },
        constraints: [
          {
            id: 'constraint-ledger',
            label: {
              en: 'The ledger must stay shut in public.',
              'zh-CN': '账本必须在公开场合保持关闭。',
            },
            detail: {
              en: '',
              'zh-CN': '',
            },
          },
          {
            id: 'constraint-crowd',
            label: {
              en: 'Keep the witness pressure visible.',
              'zh-CN': '保持目击者压力可见。',
            },
            detail: {
              en: '',
              'zh-CN': '',
            },
          },
        ],
        proposals: [],
      },
      scenes: [
        {
          id: 'scene-b',
          order: 2,
          title: { en: 'Concourse Delay', 'zh-CN': '候车厅延误' },
          summary: { en: 'The crowd slows the exit.', 'zh-CN': '人群拖慢离场。' },
          purpose: { en: 'Keep pressure alive.', 'zh-CN': '维持压力。' },
          pov: { en: 'Mei Arden', 'zh-CN': '美伊·阿登' },
          location: { en: 'Concourse hall', 'zh-CN': '候车大厅' },
          conflict: { en: 'The crowd blocks the exit.', 'zh-CN': '人群堵住出口。' },
          reveal: { en: 'Witness pressure travels inward.', 'zh-CN': '见证压力向内延续。' },
        },
        {
          id: 'scene-a',
          order: 1,
          title: { en: 'Midnight Platform', 'zh-CN': '午夜站台' },
          summary: { en: 'The bargain stays public.', 'zh-CN': '交易暴露在公众视线。' },
          purpose: { en: 'Force a public stalemate.', 'zh-CN': '逼出公开僵局。' },
          pov: { en: 'Ren Voss', 'zh-CN': '任·沃斯' },
          location: { en: 'Eastbound platform', 'zh-CN': '东行月台' },
          conflict: { en: 'Ren needs leverage.', 'zh-CN': '任需要筹码。' },
          reveal: { en: 'The courier signal stays private.', 'zh-CN': '信使暗号仍然私密。' },
        },
      ],
    })

    expect(proposal).toMatchObject({
      proposalId: 'chapter-signals-in-rain-backlog-proposal-001',
      chapterId: 'chapter-signals-in-rain',
      goalSnapshot: {
        en: 'Lock the bargain before the witness turns the ledger public.',
      },
    })
    expect(proposal.constraintSnapshot).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'constraint-ledger',
      }),
    ]))
    expect(proposal.scenes.map((scene) => `${scene.order}:${scene.sceneId}:${scene.backlogStatus}`)).toEqual([
      '1:scene-a:planned',
      '2:scene-b:planned',
    ])
    expect(proposal.scenes[0]).toMatchObject({
      proposalSceneId: 'chapter-signals-in-rain-backlog-proposal-001::scene-a',
      pov: {
        en: 'Ren Voss',
      },
      plannerNotes: {
        en: expect.stringContaining('Lock the bargain before the witness turns the ledger public.'),
        'zh-CN': expect.stringContaining('在目击者把账本公开之前锁定交易。'),
      },
    })
    expect(proposal.scenes[0]?.plannerNotes.en).toContain('The ledger must stay shut in public.')
    expect(proposal.scenes[0]?.plannerNotes.en).toContain('Keep the witness pressure visible.')
  })

  it('is deterministic for the same planning input and scene list', () => {
    const input = {
      chapterId: 'chapter-open-water-signals',
      proposalSequence: 2,
      planning: {
        goal: {
          en: 'Stage the handoff cleanly.',
          'zh-CN': '干净地完成交接。',
        },
        constraints: [],
        proposals: [],
      },
      scenes: [
        {
          id: 'scene-harbor-slip',
          order: 1,
          title: { en: 'Harbor Slip', 'zh-CN': '港口滑道' },
          summary: { en: 'The crew tests the escape route.', 'zh-CN': '船员试探撤离路线。' },
          purpose: { en: 'Establish the fallback lane.', 'zh-CN': '建立退路。' },
          pov: { en: 'Watcher', 'zh-CN': '监视者' },
          location: { en: 'Harbor slip', 'zh-CN': '港口滑道' },
          conflict: { en: 'The route remains exposed.', 'zh-CN': '路线仍然暴露。' },
          reveal: { en: 'The escape route is still provisional.', 'zh-CN': '撤离路线仍未定型。' },
        },
      ],
    }

    expect(createChapterBacklogProposal(input)).toEqual(createChapterBacklogProposal(input))
  })
})
