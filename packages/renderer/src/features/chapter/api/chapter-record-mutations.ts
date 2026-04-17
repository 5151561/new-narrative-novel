import type { Locale } from '@/app/i18n'

import type { ChapterLocalizedText, ChapterStructureSceneRecord, ChapterStructureWorkspaceRecord } from './chapter-records'

export type ChapterSceneStructureField = 'summary' | 'purpose' | 'pov' | 'location' | 'conflict' | 'reveal'

export type ChapterSceneStructurePatch = Partial<Record<ChapterSceneStructureField, string>>

const chapterSceneStructureFields: ChapterSceneStructureField[] = [
  'summary',
  'purpose',
  'pov',
  'location',
  'conflict',
  'reveal',
]

function normalizeIndex(targetIndex: number, sceneCount: number) {
  if (sceneCount <= 1) {
    return 0
  }

  return Math.min(Math.max(targetIndex, 0), sceneCount - 1)
}

function sortScenesByOrder(scenes: ChapterStructureSceneRecord[]) {
  return [...scenes].sort((left, right) => left.order - right.order)
}

export function mergeLocalizedChapterText(
  value: ChapterLocalizedText,
  locale: Locale,
  nextValue: string,
): ChapterLocalizedText {
  return {
    ...value,
    [locale]: nextValue,
  }
}

export function normalizeSceneOrders(record: ChapterStructureWorkspaceRecord): ChapterStructureWorkspaceRecord {
  return {
    ...record,
    scenes: sortScenesByOrder(record.scenes).map((scene, index) => ({
      ...scene,
      order: index + 1,
    })),
  }
}

export function reorderChapterRecordScenes(
  record: ChapterStructureWorkspaceRecord,
  sceneId: string,
  targetIndex: number,
): ChapterStructureWorkspaceRecord {
  if (!record.scenes.some((scene) => scene.id === sceneId)) {
    return record
  }

  const normalizedRecord = normalizeSceneOrders(record)
  const sourceIndex = normalizedRecord.scenes.findIndex((scene) => scene.id === sceneId)
  if (sourceIndex === -1) {
    return record
  }

  const nextScenes = [...normalizedRecord.scenes]
  const [movedScene] = nextScenes.splice(sourceIndex, 1)
  if (!movedScene) {
    return normalizedRecord
  }

  nextScenes.splice(normalizeIndex(targetIndex, normalizedRecord.scenes.length), 0, movedScene)

  return {
    ...normalizedRecord,
    scenes: nextScenes.map((scene, index) => ({
      ...scene,
      order: index + 1,
    })),
  }
}

export function patchChapterRecordScene(
  record: ChapterStructureWorkspaceRecord,
  sceneId: string,
  patch: ChapterSceneStructurePatch,
  locale: Locale,
): ChapterStructureWorkspaceRecord {
  if (!record.scenes.some((scene) => scene.id === sceneId)) {
    return record
  }

  return {
    ...record,
    scenes: record.scenes.map((scene) => {
      if (scene.id !== sceneId) {
        return scene
      }

      const nextScene = { ...scene }
      for (const field of chapterSceneStructureFields) {
        const nextValue = patch[field]
        if (nextValue === undefined) {
          continue
        }

        nextScene[field] = mergeLocalizedChapterText(scene[field], locale, nextValue)
      }

      return nextScene
    }),
  }
}
