export const signalArcFixtureSeed = {
  bookId: 'book-signal-arc',
  chapters: [
    {
      chapterId: 'chapter-signals-in-rain',
      canonicalSceneIds: [
        'scene-midnight-platform',
        'scene-concourse-delay',
        'scene-ticket-window',
        'scene-departure-bell',
      ],
    },
    {
      chapterId: 'chapter-open-water-signals',
      canonicalSceneIds: ['scene-warehouse-bridge'],
      mockOnlyPreviewSceneIds: ['scene-canal-watch', 'scene-dawn-slip'],
    },
  ],
} as const

type SignalArcFixtureSeed = typeof signalArcFixtureSeed
type SignalArcChapterSeed = SignalArcFixtureSeed['chapters'][number]

export type SignalArcChapterId = SignalArcChapterSeed['chapterId']
export type SignalArcCanonicalSceneId = SignalArcChapterSeed['canonicalSceneIds'][number]
export type SignalArcMockOnlyPreviewSceneId = Extract<
  SignalArcChapterSeed,
  { readonly mockOnlyPreviewSceneIds: readonly string[] }
>['mockOnlyPreviewSceneIds'][number]

export const signalArcBookId = signalArcFixtureSeed.bookId

export function signalArcChapterHasMockOnlyPreviewSceneIds(
  chapter: SignalArcChapterSeed,
): chapter is Extract<SignalArcChapterSeed, { readonly mockOnlyPreviewSceneIds: readonly string[] }> {
  return 'mockOnlyPreviewSceneIds' in chapter
}

const derivedSignalArcChapterIds = signalArcFixtureSeed.chapters.map((chapter) => chapter.chapterId)
export const signalArcChapterIds = derivedSignalArcChapterIds as readonly SignalArcChapterId[]

const derivedSignalArcCanonicalSceneIds = signalArcFixtureSeed.chapters.flatMap((chapter) => chapter.canonicalSceneIds)
export const signalArcCanonicalSceneIds = derivedSignalArcCanonicalSceneIds as readonly SignalArcCanonicalSceneId[]

const derivedSignalArcSceneIdsByChapter = Object.fromEntries(
  signalArcFixtureSeed.chapters.map((chapter) => [chapter.chapterId, chapter.canonicalSceneIds]),
)
export const signalArcSceneIdsByChapter = derivedSignalArcSceneIdsByChapter as unknown as {
  readonly [chapterId in SignalArcChapterId]: readonly Extract<
    SignalArcChapterSeed,
    { readonly chapterId: chapterId }
  >['canonicalSceneIds'][number][]
}

const derivedSignalArcMockOnlyPreviewSceneIds = signalArcFixtureSeed.chapters
  .filter(signalArcChapterHasMockOnlyPreviewSceneIds)
  .flatMap((chapter) => chapter.mockOnlyPreviewSceneIds)
export const signalArcMockOnlyPreviewSceneIds =
  derivedSignalArcMockOnlyPreviewSceneIds as readonly SignalArcMockOnlyPreviewSceneId[]

const signalArcCanonicalSceneIdSet = new Set<string>(signalArcCanonicalSceneIds)

export function isSignalArcCanonicalSceneId(sceneId: string): sceneId is SignalArcCanonicalSceneId {
  return signalArcCanonicalSceneIdSet.has(sceneId)
}

export function getSignalArcCanonicalSceneIdsForChapter(chapterId: SignalArcChapterId) {
  return signalArcSceneIdsByChapter[chapterId]
}
