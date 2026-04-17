import { createChapterClient } from './chapter-client'
import { resetMockChapterDb } from './mock-chapter-db'

describe('chapterClient', () => {
  beforeEach(() => {
    resetMockChapterDb()
  })

  it('returns raw chapter records through the feature-local chapter boundary', async () => {
    const client = createChapterClient()

    await expect(client.getChapterStructureWorkspace({ chapterId: 'chapter-signals-in-rain' })).resolves.toMatchObject({
      chapterId: 'chapter-signals-in-rain',
      title: {
        en: 'Signals in Rain',
        'zh-CN': '雨中信号',
      },
      viewsMeta: {
        availableViews: ['sequence', 'outliner', 'assembly'],
      },
      scenes: expect.arrayContaining([
        expect.objectContaining({
          id: 'scene-ticket-window',
          order: 3,
          title: {
            en: 'Ticket Window',
            'zh-CN': '售票窗',
          },
        }),
      ]),
      inspector: expect.objectContaining({
        chapterNotes: expect.arrayContaining([
          {
            en: 'Ordering remains structural; no prose merge is implied here.',
            'zh-CN': '排序属于结构层，这里不引入正文合并。',
          },
        ]),
      }),
    })
  })

  it('returns cloned raw chapter data without mutating the backing mock database', async () => {
    const client = createChapterClient()

    const firstRead = await client.getChapterStructureWorkspace({ chapterId: 'chapter-signals-in-rain' })
    expect(firstRead).not.toBeNull()
    if (!firstRead) {
      return
    }

    firstRead.title.en = 'Mutated title'
    firstRead.scenes[0]!.title.en = 'Mutated scene'
    firstRead.inspector.chapterNotes[0]!.en = 'Mutated note'

    const secondRead = await client.getChapterStructureWorkspace({ chapterId: 'chapter-signals-in-rain' })
    expect(secondRead).not.toBeNull()
    if (!secondRead) {
      return
    }

    expect(secondRead.title.en).toBe('Signals in Rain')
    expect(secondRead.scenes[0]?.title.en).toBe('Midnight Platform')
    expect(secondRead.inspector.chapterNotes[0]?.en).toBe(
      'Witness scrutiny belongs in the auxiliary context, not the stage copy.',
    )
  })

  it('returns null for unknown chapter ids', async () => {
    const client = createChapterClient()

    await expect(client.getChapterStructureWorkspace({ chapterId: 'unknown-chapter' })).resolves.toBeNull()
  })

  it('reorders chapter scenes through the writable chapter boundary', async () => {
    const client = createChapterClient()

    await expect(
      client.reorderChapterScene({
        chapterId: 'chapter-signals-in-rain',
        sceneId: 'scene-ticket-window',
        targetIndex: 0,
      }),
    ).resolves.toMatchObject({
      scenes: [
        expect.objectContaining({ id: 'scene-ticket-window', order: 1 }),
        expect.objectContaining({ id: 'scene-midnight-platform', order: 2 }),
        expect.objectContaining({ id: 'scene-concourse-delay', order: 3 }),
        expect.objectContaining({ id: 'scene-departure-bell', order: 4 }),
      ],
    })
  })

  it('updates only the active locale for scene structure patches through the writable chapter boundary', async () => {
    const client = createChapterClient()

    await expect(
      client.updateChapterSceneStructure({
        chapterId: 'chapter-signals-in-rain',
        sceneId: 'scene-midnight-platform',
        locale: 'zh-CN',
        patch: {
          summary: '新的章节摘要',
          purpose: '新的章节目的',
        },
      }),
    ).resolves.toMatchObject({
      scenes: expect.arrayContaining([
        expect.objectContaining({
          id: 'scene-midnight-platform',
          summary: {
            en: 'Ren has to lock the bargain before the platform witness turns the ledger into public leverage.',
            'zh-CN': '新的章节摘要',
          },
          purpose: {
            en: 'Push the ledger bargain into a public stalemate without opening the ledger.',
            'zh-CN': '新的章节目的',
          },
        }),
      ]),
    })
  })

  it('treats missing-scene writes as no-ops through the writable chapter boundary', async () => {
    const client = createChapterClient()
    const beforeWrite = await client.getChapterStructureWorkspace({ chapterId: 'chapter-signals-in-rain' })

    await expect(
      client.reorderChapterScene({
        chapterId: 'chapter-signals-in-rain',
        sceneId: 'scene-missing',
        targetIndex: 0,
      }),
    ).resolves.toEqual(beforeWrite)

    await expect(
      client.updateChapterSceneStructure({
        chapterId: 'chapter-signals-in-rain',
        sceneId: 'scene-missing',
        locale: 'en',
        patch: {
          summary: 'Should not apply',
        },
      }),
    ).resolves.toEqual(beforeWrite)
  })
})
