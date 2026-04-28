import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'

import { getChapterBacklogStatusLabel, getChapterUnresolvedCountLabel, useI18n } from '@/app/i18n'
import { resolveProjectRuntimeDependency, useOptionalProjectRuntime } from '@/app/project-runtime'

import {
  chapterClient,
  type ChapterClient,
  type GetChapterStructureWorkspaceInput,
} from '../api/chapter-client'
import {
  type ChapterBacklogConstraintRecord,
  type ChapterBacklogProposalRecord,
  type ChapterBacklogProposalSceneRecord,
  readLocalizedChapterText,
  type ChapterLocalizedText,
  type ChapterStructureAssemblyHintRecord,
  type ChapterStructureProblemSummaryRecord,
  type ChapterStructureSceneRecord,
  type ChapterStructureWorkspaceRecord,
} from '../api/chapter-records'
import type {
  ChapterBacklogConstraintViewModel,
  ChapterBacklogPlanningViewModel,
  ChapterBacklogProposalSceneViewModel,
  ChapterBacklogProposalViewModel,
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

interface UseChapterStructureWorkspaceQueryOptions {
  enabled?: boolean
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
    backlogStatus: record.backlogStatus,
    backlogStatusLabel: getChapterBacklogStatusLabel(locale, record.backlogStatus),
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

function mapBacklogConstraintRecord(
  record: ChapterBacklogConstraintRecord,
  locale: 'en' | 'zh-CN',
): ChapterBacklogConstraintViewModel {
  return {
    id: record.id,
    label: localize(record.label, locale),
    detail: localize(record.detail, locale),
  }
}

function mapBacklogProposalSceneRecord(
  record: ChapterBacklogProposalSceneRecord,
  locale: 'en' | 'zh-CN',
): ChapterBacklogProposalSceneViewModel {
  return {
    proposalSceneId: record.proposalSceneId,
    sceneId: record.sceneId,
    order: record.order,
    title: localize(record.title, locale),
    summary: localize(record.summary, locale),
    purpose: localize(record.purpose, locale),
    pov: localize(record.pov, locale),
    location: localize(record.location, locale),
    conflict: localize(record.conflict, locale),
    reveal: localize(record.reveal, locale),
    backlogStatus: record.backlogStatus,
    backlogStatusLabel: getChapterBacklogStatusLabel(locale, record.backlogStatus),
    plannerNotes: localize(record.plannerNotes, locale),
  }
}

function mapBacklogProposalRecord(
  record: ChapterBacklogProposalRecord,
  locale: 'en' | 'zh-CN',
): ChapterBacklogProposalViewModel {
  return {
    proposalId: record.proposalId,
    chapterId: record.chapterId,
    goalSnapshot: localize(record.goalSnapshot, locale),
    constraintSnapshot: record.constraintSnapshot.map((constraint) => mapBacklogConstraintRecord(constraint, locale)),
    scenes: record.scenes.map((scene) => mapBacklogProposalSceneRecord(scene, locale)),
    status: record.status,
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
  const planning: ChapterBacklogPlanningViewModel = {
    goal: localize(record.planning.goal, locale),
    constraints: record.planning.constraints.map((constraint) => mapBacklogConstraintRecord(constraint, locale)),
    proposals: record.planning.proposals.map((proposal) => mapBacklogProposalRecord(proposal, locale)),
    acceptedProposalId: record.planning.acceptedProposalId,
  }

  return {
    chapterId: record.chapterId,
    title: localize(record.title, locale),
    summary: localize(record.summary, locale),
    sceneCount: scenes.length,
    unresolvedCount: scenes.reduce((total, scene) => total + scene.unresolvedCount, 0),
    selectedSceneId: selectedScene?.id ?? null,
    planning,
    scenes,
    inspector,
    viewsMeta: record.viewsMeta,
  }
}

export function useChapterStructureWorkspaceQuery(
  { chapterId, selectedSceneId }: UseChapterStructureWorkspaceQueryInput,
  client?: Pick<ChapterClient, 'getChapterStructureWorkspace'>,
  { enabled = true }: UseChapterStructureWorkspaceQueryOptions = {},
) {
  const runtime = useOptionalProjectRuntime()
  const { locale } = useI18n()
  const effectiveClient = resolveProjectRuntimeDependency(
    client,
    runtime?.chapterClient,
    'useChapterStructureWorkspaceQuery',
    'client',
  )
  const query = useQuery({
    queryKey: chapterQueryKeys.workspace(chapterId),
    enabled,
    queryFn: () => effectiveClient.getChapterStructureWorkspace({ chapterId }),
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
