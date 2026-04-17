import { describe, expect, it } from 'vitest'

import { getMockChapterRecordById, reorderMockChapterScene, resetMockChapterDb, updateMockChapterSceneStructure } from './mock-chapter-db'

describe('mock chapter db', () => {
  it('writes reorders into the mutable db and reset restores the seed data', () => {
    resetMockChapterDb()

    const initialRecord = getMockChapterRecordById('chapter-signals-in-rain')
    expect(initialRecord?.scenes.map((scene) => [scene.id, scene.order])).toEqual([
      ['scene-midnight-platform', 1],
      ['scene-concourse-delay', 2],
      ['scene-ticket-window', 3],
      ['scene-departure-bell', 4],
    ])

    const reordered = reorderMockChapterScene({
      chapterId: 'chapter-signals-in-rain',
      sceneId: 'scene-ticket-window',
      targetIndex: 0,
    })
    expect(reordered?.scenes.map((scene) => [scene.id, scene.order])).toEqual([
      ['scene-ticket-window', 1],
      ['scene-midnight-platform', 2],
      ['scene-concourse-delay', 3],
      ['scene-departure-bell', 4],
    ])

    const afterWrite = getMockChapterRecordById('chapter-signals-in-rain')
    expect(afterWrite?.scenes.map((scene) => [scene.id, scene.order])).toEqual([
      ['scene-ticket-window', 1],
      ['scene-midnight-platform', 2],
      ['scene-concourse-delay', 3],
      ['scene-departure-bell', 4],
    ])

    resetMockChapterDb()

    const afterReset = getMockChapterRecordById('chapter-signals-in-rain')
    expect(afterReset?.scenes.map((scene) => [scene.id, scene.order])).toEqual([
      ['scene-midnight-platform', 1],
      ['scene-concourse-delay', 2],
      ['scene-ticket-window', 3],
      ['scene-departure-bell', 4],
    ])
  })

  it('returns clones so reads cannot mutate the backing db', () => {
    resetMockChapterDb()

    const firstRead = getMockChapterRecordById('chapter-signals-in-rain')
    expect(firstRead).not.toBeNull()
    if (!firstRead) {
      return
    }

    firstRead.scenes[0]!.title.en = 'Mutated outside db'
    firstRead.inspector.chapterNotes[0]!.en = 'Mutated note'

    const secondRead = getMockChapterRecordById('chapter-signals-in-rain')
    expect(secondRead?.scenes[0]?.title.en).toBe('Midnight Platform')
    expect(secondRead?.inspector.chapterNotes[0]?.en).toBe(
      'Witness scrutiny belongs in the auxiliary context, not the stage copy.',
    )
  })

  it('writes locale-aware structure patches into the mutable db', () => {
    resetMockChapterDb()

    const updated = updateMockChapterSceneStructure({
      chapterId: 'chapter-signals-in-rain',
      sceneId: 'scene-midnight-platform',
      locale: 'zh-CN',
      patch: {
        summary: '新的结构摘要',
        location: '新月台',
      },
    })

    expect(updated?.scenes.find((scene) => scene.id === 'scene-midnight-platform')).toMatchObject({
      summary: {
        en: 'Ren has to lock the bargain before the platform witness turns the ledger into public leverage.',
        'zh-CN': '新的结构摘要',
      },
      location: {
        en: 'Eastbound platform',
        'zh-CN': '新月台',
      },
      statusLabel: {
        en: 'Current',
        'zh-CN': '当前',
      },
    })
  })

  it('treats missing-scene writes as no-ops in the mutable db', () => {
    resetMockChapterDb()

    const beforeWrite = getMockChapterRecordById('chapter-signals-in-rain')

    const reordered = reorderMockChapterScene({
      chapterId: 'chapter-signals-in-rain',
      sceneId: 'scene-missing',
      targetIndex: 0,
    })
    const patched = updateMockChapterSceneStructure({
      chapterId: 'chapter-signals-in-rain',
      sceneId: 'scene-missing',
      locale: 'en',
      patch: {
        summary: 'Should not apply',
      },
    })

    expect(reordered).toEqual(beforeWrite)
    expect(patched).toEqual(beforeWrite)
    expect(getMockChapterRecordById('chapter-signals-in-rain')).toEqual(beforeWrite)
  })
})
