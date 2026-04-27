import { describe, expect, it } from 'vitest'

import {
  getSignalArcCanonicalSceneIdsForChapter,
  signalArcChapterHasMockOnlyPreviewSceneIds,
  signalArcBookId,
  signalArcCanonicalSceneIds,
  signalArcChapterIds,
  signalArcFixtureSeed,
  signalArcMockOnlyPreviewSceneIds,
  signalArcSceneIdsByChapter,
} from './signal-arc.js'

describe('signal arc fixture seed', () => {
  it('keeps the canonical book id and chapter ids stable', () => {
    expect(signalArcBookId).toBe('book-signal-arc')
    expect(signalArcChapterIds).toEqual(['chapter-signals-in-rain', 'chapter-open-water-signals'])
  })

  it('keeps canonical scene ids exact and unique', () => {
    expect(signalArcCanonicalSceneIds).toEqual([
      'scene-midnight-platform',
      'scene-concourse-delay',
      'scene-ticket-window',
      'scene-departure-bell',
      'scene-warehouse-bridge',
    ])
    expect(new Set(signalArcCanonicalSceneIds).size).toBe(signalArcCanonicalSceneIds.length)
  })

  it('keeps mock-only preview ids separate from the canonical scene seed', () => {
    const canonicalSceneIdSet = new Set<string>(signalArcCanonicalSceneIds)

    expect(signalArcMockOnlyPreviewSceneIds).toEqual(['scene-canal-watch', 'scene-dawn-slip'])
    expect(signalArcMockOnlyPreviewSceneIds.every((sceneId) => !canonicalSceneIdSet.has(sceneId))).toBe(true)
  })

  it('derives helper collections from the raw chapter seed', () => {
    expect(signalArcChapterIds).toEqual(signalArcFixtureSeed.chapters.map((chapter) => chapter.chapterId))
    expect(signalArcCanonicalSceneIds).toEqual(
      signalArcFixtureSeed.chapters.flatMap((chapter) => chapter.canonicalSceneIds),
    )
    expect(signalArcMockOnlyPreviewSceneIds).toEqual(
      signalArcFixtureSeed.chapters
        .filter(signalArcChapterHasMockOnlyPreviewSceneIds)
        .flatMap((chapter) => chapter.mockOnlyPreviewSceneIds),
    )
    expect(signalArcSceneIdsByChapter).toEqual(
      Object.fromEntries(
        signalArcFixtureSeed.chapters.map((chapter) => [chapter.chapterId, chapter.canonicalSceneIds]),
      ),
    )
  })

  it('maps every canonical scene id to exactly one canonical chapter', () => {
    const membership = signalArcCanonicalSceneIds.map((sceneId) => ({
      sceneId,
      chapterIds: signalArcChapterIds.filter((chapterId) => new Set<string>(signalArcSceneIdsByChapter[chapterId]).has(sceneId)),
    }))

    expect(membership).toEqual([
      { sceneId: 'scene-midnight-platform', chapterIds: ['chapter-signals-in-rain'] },
      { sceneId: 'scene-concourse-delay', chapterIds: ['chapter-signals-in-rain'] },
      { sceneId: 'scene-ticket-window', chapterIds: ['chapter-signals-in-rain'] },
      { sceneId: 'scene-departure-bell', chapterIds: ['chapter-signals-in-rain'] },
      { sceneId: 'scene-warehouse-bridge', chapterIds: ['chapter-open-water-signals'] },
    ])
  })

  it('returns canonical scene ids in chapter order', () => {
    expect(getSignalArcCanonicalSceneIdsForChapter('chapter-signals-in-rain')).toEqual([
      'scene-midnight-platform',
      'scene-concourse-delay',
      'scene-ticket-window',
      'scene-departure-bell',
    ])
    expect(getSignalArcCanonicalSceneIdsForChapter('chapter-open-water-signals')).toEqual(['scene-warehouse-bridge'])
  })
})
