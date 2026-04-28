import type {
  ChapterBacklogPlanningRecord,
  ChapterBacklogProposalRecord,
  ChapterStructureSceneRecord,
} from '../../contracts/api-records.js'

interface CreateChapterBacklogProposalInput {
  chapterId: string
  proposalSequence: number
  planning: Pick<ChapterBacklogPlanningRecord, 'goal' | 'constraints' | 'proposals'>
  scenes: Array<Pick<ChapterStructureSceneRecord, 'id' | 'order' | 'title' | 'summary' | 'purpose' | 'pov' | 'location' | 'conflict' | 'reveal'>>
}

function formatProposalSequence(sequence: number) {
  return String(sequence).padStart(3, '0')
}

function buildPlannerNotes(
  planning: Pick<ChapterBacklogPlanningRecord, 'goal' | 'constraints'>,
): ChapterBacklogProposalRecord['scenes'][number]['plannerNotes'] {
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

export function createChapterBacklogProposal(
  input: CreateChapterBacklogProposalInput,
): ChapterBacklogProposalRecord {
  const proposalId = `${input.chapterId}-backlog-proposal-${formatProposalSequence(input.proposalSequence)}`
  const plannerNotes = buildPlannerNotes(input.planning)

  return {
    proposalId,
    chapterId: input.chapterId,
    goalSnapshot: structuredClone(input.planning.goal),
    constraintSnapshot: structuredClone(input.planning.constraints),
    status: 'draft',
    scenes: [...input.scenes]
      .sort((left, right) => left.order - right.order)
      .map((scene, index) => ({
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
  }
}
