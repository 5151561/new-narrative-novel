import { createChapterClient } from './chapter-client'

describe('chapterClient', () => {
  it('returns locale-aware chapter structure workspace data', async () => {
    const englishClient = createChapterClient({
      localeResolver: () => 'en',
    })
    const chineseClient = createChapterClient({
      localeResolver: () => 'zh-CN',
    })

    await expect(englishClient.getChapterStructureWorkspace('chapter-signals-in-rain')).resolves.toMatchObject({
      chapterId: 'chapter-signals-in-rain',
      title: 'Signals in Rain',
      scenes: expect.arrayContaining([
        expect.objectContaining({
          id: 'scene-ticket-window',
          order: 3,
          title: 'Ticket Window',
        }),
      ]),
      inspector: expect.objectContaining({
        chapterNotes: expect.arrayContaining(['Ordering remains structural; no prose merge is implied here.']),
      }),
    })

    await expect(chineseClient.getChapterStructureWorkspace('chapter-signals-in-rain')).resolves.toMatchObject({
      chapterId: 'chapter-signals-in-rain',
      title: '雨中信号',
      scenes: expect.arrayContaining([
        expect.objectContaining({
          id: 'scene-ticket-window',
          order: 3,
          title: '售票窗',
        }),
      ]),
      inspector: expect.objectContaining({
        chapterNotes: expect.arrayContaining(['排序属于结构层，这里不引入正文合并。']),
      }),
    })
  })

  it('returns cloned workspace data without mutating the backing mock database', async () => {
    const client = createChapterClient()

    const firstRead = await client.getChapterStructureWorkspace('chapter-signals-in-rain')
    firstRead.title = 'Mutated title'
    firstRead.scenes[0]!.title = 'Mutated scene'
    firstRead.inspector.chapterNotes.push('Mutated note')

    await expect(client.getChapterStructureWorkspace('chapter-signals-in-rain')).resolves.toMatchObject({
      title: 'Signals in Rain',
      scenes: expect.arrayContaining([expect.objectContaining({ id: 'scene-midnight-platform', title: 'Midnight Platform' })]),
      inspector: expect.objectContaining({
        chapterNotes: expect.not.arrayContaining(['Mutated note']),
      }),
    })
  })

  it('falls back unknown chapter ids to the default chapter while preserving canonical scene metadata', async () => {
    const client = createChapterClient()

    await expect(client.getChapterStructureWorkspace('unknown-chapter')).resolves.toMatchObject({
      chapterId: 'chapter-signals-in-rain',
      scenes: expect.arrayContaining([
        expect.objectContaining({
          id: 'scene-midnight-platform',
          order: 1,
          proseStatusLabel: 'Needs draft',
          runStatusLabel: 'Paused',
        }),
      ]),
      inspector: expect.objectContaining({
        problemsSummary: expect.any(String),
        assemblyHints: expect.any(Array),
      }),
    })
  })
})
