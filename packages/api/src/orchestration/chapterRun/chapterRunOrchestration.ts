import type {
  ChapterRunNextSceneRecord,
  ChapterSceneBacklogStatus,
  ChapterStructureWorkspaceRecord,
} from '../../contracts/api-records.js'

export const CHAPTER_RUN_ACCEPTED_BACKLOG_REQUIRED = 'CHAPTER_RUN_ACCEPTED_BACKLOG_REQUIRED'
export const CHAPTER_RUN_REVIEW_GATE_BLOCKED = 'CHAPTER_RUN_REVIEW_GATE_BLOCKED'
export const CHAPTER_RUN_ALL_SCENES_DRAFTED = 'CHAPTER_RUN_ALL_SCENES_DRAFTED'

export type ResolveNextChapterRunSceneResult =
  | { ok: true; scene: ChapterRunNextSceneRecord }
  | { ok: false; code: typeof CHAPTER_RUN_ACCEPTED_BACKLOG_REQUIRED }
  | { ok: false; code: typeof CHAPTER_RUN_REVIEW_GATE_BLOCKED; blockingSceneId: string }
  | { ok: false; code: typeof CHAPTER_RUN_ALL_SCENES_DRAFTED }

const blockingStatuses = new Set<ChapterSceneBacklogStatus>(['running', 'needs_review'])
const completedStatuses = new Set<ChapterSceneBacklogStatus>(['drafted', 'revised'])

export function resolveNextChapterRunScene(
  chapter: ChapterStructureWorkspaceRecord,
): ResolveNextChapterRunSceneResult {
  const acceptedProposalId = chapter.planning.acceptedProposalId
  const acceptedProposal = acceptedProposalId
    ? chapter.planning.proposals.find((proposal) => proposal.proposalId === acceptedProposalId && proposal.status === 'accepted')
    : undefined

  if (!acceptedProposal) {
    return { ok: false, code: CHAPTER_RUN_ACCEPTED_BACKLOG_REQUIRED }
  }

  for (const proposalScene of [...acceptedProposal.scenes].sort((left, right) => left.order - right.order)) {
    const canonicalScene = chapter.scenes.find((scene) => scene.id === proposalScene.sceneId)
    const backlogStatus = canonicalScene?.backlogStatus ?? proposalScene.backlogStatus

    if (blockingStatuses.has(backlogStatus)) {
      return {
        ok: false,
        code: CHAPTER_RUN_REVIEW_GATE_BLOCKED,
        blockingSceneId: proposalScene.sceneId,
      }
    }

    if (!completedStatuses.has(backlogStatus)) {
      return {
        ok: true,
        scene: {
          chapterId: chapter.chapterId,
          sceneId: proposalScene.sceneId,
          order: proposalScene.order,
          title: structuredClone(proposalScene.title),
          backlogStatus,
        },
      }
    }
  }

  return { ok: false, code: CHAPTER_RUN_ALL_SCENES_DRAFTED }
}

export function updateChapterRunSceneBacklogStatus(
  chapter: ChapterStructureWorkspaceRecord,
  input: {
    sceneId: string
    backlogStatus: ChapterSceneBacklogStatus
  },
): ChapterStructureWorkspaceRecord {
  const acceptedProposalId = chapter.planning.acceptedProposalId

  return {
    ...chapter,
    scenes: chapter.scenes.map((scene) => (
      scene.id === input.sceneId
        ? { ...scene, backlogStatus: input.backlogStatus }
        : scene
    )),
    planning: {
      ...chapter.planning,
      proposals: chapter.planning.proposals.map((proposal) => ({
        ...proposal,
        scenes: proposal.scenes.map((scene) => (
          proposal.proposalId === acceptedProposalId
          && proposal.status === 'accepted'
          && scene.sceneId === input.sceneId
            ? { ...scene, backlogStatus: input.backlogStatus }
            : scene
        )),
      })),
    },
  }
}
