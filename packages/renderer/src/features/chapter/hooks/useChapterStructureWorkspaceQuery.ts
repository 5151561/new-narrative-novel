import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'

import { getChapterUnresolvedCountLabel, useI18n } from '@/app/i18n'

import {
  chapterClient,
  type ChapterClient,
  type GetChapterStructureWorkspaceInput,
} from '../api/chapter-client'
import {
  readLocalizedChapterText,
  type ChapterLocalizedText,
  type ChapterStructureAssemblyHintRecord,
  type ChapterStructureProblemSummaryRecord,
  type ChapterStructureSceneRecord,
  type ChapterStructureWorkspaceRecord,
} from '../api/chapter-records'
import type {
  ChapterStructureAssemblyHintItem,
  ChapterStructureInspectorViewModel,
  ChapterStructureProblemSummaryItem,
  ChapterStructureSceneViewModel,
  ChapterStructureSelectedSceneBrief,
  ChapterStructureWorkspaceViewModel,
} from '../types/chapter-view-models'
import { chapterQueryKeys } from './chapter-query-keys'

interface UseChapterStructureWorkspaceQueryInput extends GetChapterStructureWorkspaceInput {
  selectedSceneId?: string | null
}

function localize(value: ChapterLocalizedText, locale: 'en' | 'zh-CN') {
  return readLocalizedChapterText(value, locale)
}

function mapSceneRecord(record: ChapterStructureSceneRecord, locale: 'en' | 'zh-CN'): ChapterStructureSceneViewModel {
  return {
    id: record.id,
    order: record.order,
    title: localize(record.title, locale),
    summary: localize(record.summary, locale),
    purpose: localize(record.purpose, locale),
    pov: localize(record.pov, locale),
    location: localize(record.location, locale),
    conflict: localize(record.conflict, locale),
    reveal: localize(record.reveal, locale),
    statusLabel: localize(record.statusLabel, locale),
    proseStatusLabel: localize(record.proseStatusLabel, locale),
    runStatusLabel: localize(record.runStatusLabel, locale),
    unresolvedCount: record.unresolvedCount,
    lastRunLabel: localize(record.lastRunLabel, locale),
  }
}

function mapProblemSummaryRecord(
  record: ChapterStructureProblemSummaryRecord,
  locale: 'en' | 'zh-CN',
): ChapterStructureProblemSummaryItem {
  return {
    id: record.id,
    label: localize(record.label, locale),
    detail: localize(record.detail, locale),
  }
}

function mapAssemblyHintRecord(
  record: ChapterStructureAssemblyHintRecord,
  locale: 'en' | 'zh-CN',
): ChapterStructureAssemblyHintItem {
  return {
    id: record.id,
    label: localize(record.label, locale),
    detail: localize(record.detail, locale),
  }
}

function buildSelectedSceneBrief(
  scene: ChapterStructureSceneViewModel | undefined,
  locale: 'en' | 'zh-CN',
): ChapterStructureSelectedSceneBrief | null {
  if (!scene) {
    return null
  }

  return {
    sceneId: scene.id,
    title: scene.title,
    summary: scene.summary,
    unresolvedCount: scene.unresolvedCount,
    unresolvedLabel: getChapterUnresolvedCountLabel(locale, scene.unresolvedCount),
  }
}

function buildChapterStructureWorkspaceModel(
  record: ChapterStructureWorkspaceRecord | null | undefined,
  selectedSceneId: string | null | undefined,
  locale: 'en' | 'zh-CN',
): ChapterStructureWorkspaceViewModel | null | undefined {
  if (record === undefined) {
    return undefined
  }

  if (record === null) {
    return null
  }

  const scenes = [...record.scenes]
    .sort((left, right) => left.order - right.order)
    .map((scene) => mapSceneRecord(scene, locale))
  const selectedScene = scenes.find((scene) => scene.id === selectedSceneId) ?? scenes[0]
  const inspector: ChapterStructureInspectorViewModel = {
    selectedSceneBrief: buildSelectedSceneBrief(selectedScene, locale),
    chapterNotes: record.inspector.chapterNotes.map((note) => localize(note, locale)),
    problemsSummary: record.inspector.problemsSummary.map((item) => mapProblemSummaryRecord(item, locale)),
    assemblyHints: record.inspector.assemblyHints.map((item) => mapAssemblyHintRecord(item, locale)),
  }

  return {
    chapterId: record.chapterId,
    title: localize(record.title, locale),
    summary: localize(record.summary, locale),
    sceneCount: scenes.length,
    unresolvedCount: scenes.reduce((total, scene) => total + scene.unresolvedCount, 0),
    selectedSceneId: selectedScene?.id ?? null,
    scenes,
    inspector,
    viewsMeta: record.viewsMeta,
  }
}

export function useChapterStructureWorkspaceQuery(
  { chapterId, selectedSceneId }: UseChapterStructureWorkspaceQueryInput,
  client: ChapterClient = chapterClient,
) {
  const { locale } = useI18n()
  const query = useQuery({
    queryKey: chapterQueryKeys.workspace(chapterId),
    queryFn: () => client.getChapterStructureWorkspace({ chapterId }),
  })

  const workspace = useMemo(
    () => buildChapterStructureWorkspaceModel(query.data, selectedSceneId, locale),
    [locale, query.data, selectedSceneId],
  )

  return {
    workspace,
    isLoading: query.isLoading,
    error: query.error,
    refetch: async () => {
      await query.refetch()
    },
  }
}
