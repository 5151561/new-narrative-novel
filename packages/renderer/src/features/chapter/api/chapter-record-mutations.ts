import type { Locale } from '@/app/i18n'

import type {
  ChapterBacklogPlanningRecord,
  ChapterBacklogProposalSceneRecord,
  ChapterLocalizedText,
  ChapterSceneBacklogStatus,
  ChapterStructureSceneRecord,
  ChapterStructureWorkspaceRecord,
} from './chapter-records'

export type ChapterSceneStructureField = 'summary' | 'purpose' | 'pov' | 'location' | 'conflict' | 'reveal'

export type ChapterSceneStructurePatch = Partial<Record<ChapterSceneStructureField, string>>
export type ChapterBacklogProposalScenePatch = Partial<Record<'title' | 'summary' | 'purpose' | 'pov' | 'location' | 'conflict' | 'reveal' | 'plannerNotes', string>>

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

function normalizeProposalSceneOrders(scenes: ChapterBacklogProposalSceneRecord[]) {
  return scenes.map((scene, index) => ({
    ...scene,
    order: index + 1,
  }))
}

function reorderProposalScenes(
  scenes: ChapterBacklogProposalSceneRecord[],
  proposalSceneId: string,
  targetOrder: number,
) {
  const normalizedScenes = normalizeProposalSceneOrders(scenes)
  const sourceIndex = normalizedScenes.findIndex((scene) => scene.proposalSceneId === proposalSceneId)
  if (sourceIndex === -1) {
    return normalizedScenes
  }

  const nextScenes = [...normalizedScenes]
  const [movedScene] = nextScenes.splice(sourceIndex, 1)
  if (!movedScene) {
    return normalizedScenes
  }

  const targetIndex = Math.min(Math.max(targetOrder - 1, 0), nextScenes.length)
  nextScenes.splice(targetIndex, 0, movedScene)
  return normalizeProposalSceneOrders(nextScenes)
}

function createConstraintId(index: number) {
  return `constraint-${String(index + 1).padStart(3, '0')}`
}

function buildPlannerNotes(
  planning: Pick<ChapterBacklogPlanningRecord, 'goal' | 'constraints'>,
): ChapterLocalizedText {
  const constraintTextEn = planning.constraints
    .map((constraint) => [constraint.label.en, constraint.detail.en].filter(Boolean).join(': '))
    .join('; ')
  const constraintTextZh = planning.constraints
    .map((constraint) => [constraint.label['zh-CN'], constraint.detail['zh-CN']].filter(Boolean).join('：'))
    .join('；')

  return {
    en: constraintTextEn
      ? `Advance chapter goal: ${planning.goal.en} Hold constraints: ${constraintTextEn}`
      : `Advance chapter goal: ${planning.goal.en}`,
    'zh-CN': constraintTextZh
      ? `推进章节目标：${planning.goal['zh-CN']} 守住约束：${constraintTextZh}`
      : `推进章节目标：${planning.goal['zh-CN']}`,
  }
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

export function patchChapterBacklogPlanning(
  record: ChapterStructureWorkspaceRecord,
  input: {
    goal?: string
    constraints?: string[]
  },
  locale: Locale,
): ChapterStructureWorkspaceRecord {
  return {
    ...record,
    planning: {
      ...record.planning,
      goal: input.goal === undefined
        ? record.planning.goal
        : mergeLocalizedChapterText(record.planning.goal, locale, input.goal),
      constraints: input.constraints === undefined
        ? record.planning.constraints
        : input.constraints.map((constraint, index) => ({
          id: record.planning.constraints[index]?.id ?? createConstraintId(index),
          label: mergeLocalizedChapterText(
            record.planning.constraints[index]?.label ?? { en: '', 'zh-CN': '' },
            locale,
            constraint,
          ),
          detail: record.planning.constraints[index]?.detail ?? { en: '', 'zh-CN': '' },
        })),
    },
  }
}

export function appendGeneratedChapterBacklogProposal(
  record: ChapterStructureWorkspaceRecord,
): ChapterStructureWorkspaceRecord {
  const proposalId = `${record.chapterId}-backlog-proposal-${String(record.planning.proposals.length + 1).padStart(3, '0')}`
  const plannerNotes = buildPlannerNotes(record.planning)

  return {
    ...record,
    planning: {
      ...record.planning,
      proposals: [
        ...record.planning.proposals,
        {
          proposalId,
          chapterId: record.chapterId,
          goalSnapshot: structuredClone(record.planning.goal),
          constraintSnapshot: structuredClone(record.planning.constraints),
          status: 'draft',
          scenes: sortScenesByOrder(record.scenes).map((scene, index) => ({
            proposalSceneId: `${proposalId}::${scene.id}`,
            sceneId: scene.id,
            order: index + 1,
            title: structuredClone(scene.title),
            summary: structuredClone(scene.summary),
            purpose: structuredClone(scene.purpose),
            pov: structuredClone(scene.pov),
            location: structuredClone(scene.location),
            conflict: structuredClone(scene.conflict),
            reveal: structuredClone(scene.reveal),
            backlogStatus: 'planned',
            plannerNotes: structuredClone(plannerNotes),
          })),
        },
      ],
    },
  }
}

export function patchChapterBacklogProposalScene(
  record: ChapterStructureWorkspaceRecord,
  proposalId: string,
  proposalSceneId: string,
  patch: ChapterBacklogProposalScenePatch,
  locale: Locale,
  order?: number,
  backlogStatus?: ChapterSceneBacklogStatus,
): ChapterStructureWorkspaceRecord {
  return {
    ...record,
    planning: {
      ...record.planning,
      proposals: record.planning.proposals.map((proposal) => {
        if (proposal.proposalId !== proposalId) {
          return proposal
        }

        const patchedScenes = proposal.scenes.map((scene) => {
          if (scene.proposalSceneId !== proposalSceneId) {
            return scene
          }

          const nextScene = {
            ...scene,
            backlogStatus: backlogStatus ?? scene.backlogStatus,
          }

          if (patch.title !== undefined) {
            nextScene.title = mergeLocalizedChapterText(nextScene.title, locale, patch.title)
          }
          if (patch.summary !== undefined) {
            nextScene.summary = mergeLocalizedChapterText(nextScene.summary, locale, patch.summary)
          }
          if (patch.purpose !== undefined) {
            nextScene.purpose = mergeLocalizedChapterText(nextScene.purpose, locale, patch.purpose)
          }
          if (patch.pov !== undefined) {
            nextScene.pov = mergeLocalizedChapterText(nextScene.pov, locale, patch.pov)
          }
          if (patch.location !== undefined) {
            nextScene.location = mergeLocalizedChapterText(nextScene.location, locale, patch.location)
          }
          if (patch.conflict !== undefined) {
            nextScene.conflict = mergeLocalizedChapterText(nextScene.conflict, locale, patch.conflict)
          }
          if (patch.reveal !== undefined) {
            nextScene.reveal = mergeLocalizedChapterText(nextScene.reveal, locale, patch.reveal)
          }
          if (patch.plannerNotes !== undefined) {
            nextScene.plannerNotes = mergeLocalizedChapterText(nextScene.plannerNotes, locale, patch.plannerNotes)
          }

          return nextScene
        })

        return {
          ...proposal,
          scenes: order === undefined
            ? normalizeProposalSceneOrders(patchedScenes)
            : reorderProposalScenes(patchedScenes, proposalSceneId, order),
        }
      }),
    },
  }
}

export function acceptChapterBacklogProposal(
  record: ChapterStructureWorkspaceRecord,
  proposalId: string,
): ChapterStructureWorkspaceRecord {
  const proposal = record.planning.proposals.find((item) => item.proposalId === proposalId)
  if (!proposal) {
    return record
  }

  const nextScenes = normalizeSceneOrders({
    ...record,
    scenes: proposal.scenes.map((proposalScene) => {
      const currentScene = record.scenes.find((scene) => scene.id === proposalScene.sceneId)
      if (!currentScene) {
        return {
          id: proposalScene.sceneId,
          order: proposalScene.order,
          title: proposalScene.title,
          summary: proposalScene.summary,
          purpose: proposalScene.purpose,
          pov: { en: '', 'zh-CN': '' },
          location: { en: '', 'zh-CN': '' },
          conflict: { en: '', 'zh-CN': '' },
          reveal: { en: '', 'zh-CN': '' },
          backlogStatus: proposalScene.backlogStatus,
          statusLabel: { en: '', 'zh-CN': '' },
          proseStatusLabel: { en: '', 'zh-CN': '' },
          runStatusLabel: { en: '', 'zh-CN': '' },
          unresolvedCount: 0,
          lastRunLabel: { en: '', 'zh-CN': '' },
        }
      }

      return {
        ...currentScene,
        order: proposalScene.order,
        title: structuredClone(proposalScene.title),
        summary: structuredClone(proposalScene.summary),
        purpose: structuredClone(proposalScene.purpose),
        pov: structuredClone(proposalScene.pov),
        location: structuredClone(proposalScene.location),
        conflict: structuredClone(proposalScene.conflict),
        reveal: structuredClone(proposalScene.reveal),
        backlogStatus: proposalScene.backlogStatus,
      }
    }),
  }).scenes

  return {
    ...record,
    scenes: nextScenes,
    planning: {
      ...record.planning,
      acceptedProposalId: proposalId,
      proposals: record.planning.proposals.map((item) => ({
        ...item,
        status: item.proposalId === proposalId ? 'accepted' : item.status,
      })),
    },
  }
}
