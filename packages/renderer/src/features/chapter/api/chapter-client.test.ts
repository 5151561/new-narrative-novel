import { createChapterClient } from './chapter-client'

describe('chapterClient', () => {
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
})
