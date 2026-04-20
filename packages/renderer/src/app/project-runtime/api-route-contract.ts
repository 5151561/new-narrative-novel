import type { SceneDockTabId } from '@/features/scene/types/scene-view-models'

function segment(value: string) {
  return encodeURIComponent(value)
}

function projectBase(projectId: string) {
  return `/api/projects/${segment(projectId)}`
}

function bookBase(projectId: string, bookId: string) {
  return `${projectBase(projectId)}/books/${segment(bookId)}`
}

function chapterBase(projectId: string, chapterId: string) {
  return `${projectBase(projectId)}/chapters/${segment(chapterId)}`
}

function chapterSceneBase(projectId: string, chapterId: string, sceneId: string) {
  return `${chapterBase(projectId, chapterId)}/scenes/${segment(sceneId)}`
}

function assetBase(projectId: string, assetId: string) {
  return `${projectBase(projectId)}/assets/${segment(assetId)}`
}

function sceneBase(projectId: string, sceneId: string) {
  return `${projectBase(projectId)}/scenes/${segment(sceneId)}`
}

function bookManuscriptCheckpointsPath(projectId: string, bookId: string) {
  return `${bookBase(projectId, bookId)}/manuscript-checkpoints`
}

function bookExportProfilesPath(projectId: string, bookId: string) {
  return `${bookBase(projectId, bookId)}/export-profiles`
}

function bookExperimentBranchesPath(projectId: string, bookId: string) {
  return `${bookBase(projectId, bookId)}/experiment-branches`
}

export const apiRouteContract = {
  bookStructure({ projectId, bookId }: { projectId: string; bookId: string }) {
    return `${bookBase(projectId, bookId)}/structure`
  },
  bookManuscriptCheckpoints({ projectId, bookId }: { projectId: string; bookId: string }) {
    return bookManuscriptCheckpointsPath(projectId, bookId)
  },
  bookManuscriptCheckpoint({
    projectId,
    bookId,
    checkpointId,
  }: {
    projectId: string
    bookId: string
    checkpointId: string
  }) {
    return `${bookManuscriptCheckpointsPath(projectId, bookId)}/${segment(checkpointId)}`
  },
  bookExportProfiles({ projectId, bookId }: { projectId: string; bookId: string }) {
    return bookExportProfilesPath(projectId, bookId)
  },
  bookExportProfile({
    projectId,
    bookId,
    exportProfileId,
  }: {
    projectId: string
    bookId: string
    exportProfileId: string
  }) {
    return `${bookExportProfilesPath(projectId, bookId)}/${segment(exportProfileId)}`
  },
  bookExportArtifacts({ projectId, bookId }: { projectId: string; bookId: string }) {
    return `${bookBase(projectId, bookId)}/export-artifacts`
  },
  bookExperimentBranches({ projectId, bookId }: { projectId: string; bookId: string }) {
    return bookExperimentBranchesPath(projectId, bookId)
  },
  bookExperimentBranch({
    projectId,
    bookId,
    branchId,
  }: {
    projectId: string
    bookId: string
    branchId: string
  }) {
    return `${bookExperimentBranchesPath(projectId, bookId)}/${segment(branchId)}`
  },
  chapterStructure({ projectId, chapterId }: { projectId: string; chapterId: string }) {
    return `${chapterBase(projectId, chapterId)}/structure`
  },
  chapterSceneReorder({
    projectId,
    chapterId,
    sceneId,
  }: {
    projectId: string
    chapterId: string
    sceneId: string
  }) {
    return `${chapterSceneBase(projectId, chapterId, sceneId)}/reorder`
  },
  chapterSceneStructure({
    projectId,
    chapterId,
    sceneId,
  }: {
    projectId: string
    chapterId: string
    sceneId: string
  }) {
    return `${chapterSceneBase(projectId, chapterId, sceneId)}/structure`
  },
  assetKnowledge({ projectId, assetId }: { projectId: string; assetId: string }) {
    return `${assetBase(projectId, assetId)}/knowledge`
  },
  reviewDecisions({ projectId, bookId }: { projectId: string; bookId: string }) {
    return `${bookBase(projectId, bookId)}/review-decisions`
  },
  reviewIssueDecision({
    projectId,
    bookId,
    issueId,
  }: {
    projectId: string
    bookId: string
    issueId: string
  }) {
    return `${bookBase(projectId, bookId)}/review-decisions/${segment(issueId)}`
  },
  reviewFixActions({ projectId, bookId }: { projectId: string; bookId: string }) {
    return `${bookBase(projectId, bookId)}/review-fix-actions`
  },
  reviewIssueFixAction({
    projectId,
    bookId,
    issueId,
  }: {
    projectId: string
    bookId: string
    issueId: string
  }) {
    return `${bookBase(projectId, bookId)}/review-fix-actions/${segment(issueId)}`
  },
  sceneRuntimeInfo({ projectId }: { projectId: string }) {
    return `${projectBase(projectId)}/runtime-info`
  },
  sceneWorkspace({ projectId, sceneId }: { projectId: string; sceneId: string }) {
    return `${sceneBase(projectId, sceneId)}/workspace`
  },
  sceneSetup({ projectId, sceneId }: { projectId: string; sceneId: string }) {
    return `${sceneBase(projectId, sceneId)}/setup`
  },
  sceneExecution({ projectId, sceneId }: { projectId: string; sceneId: string }) {
    return `${sceneBase(projectId, sceneId)}/execution`
  },
  sceneProse({ projectId, sceneId }: { projectId: string; sceneId: string }) {
    return `${sceneBase(projectId, sceneId)}/prose`
  },
  sceneInspector({ projectId, sceneId }: { projectId: string; sceneId: string }) {
    return `${sceneBase(projectId, sceneId)}/inspector`
  },
  sceneDockSummary({ projectId, sceneId }: { projectId: string; sceneId: string }) {
    return `${sceneBase(projectId, sceneId)}/dock-summary`
  },
  sceneDockTab({ projectId, sceneId, tab }: { projectId: string; sceneId: string; tab: SceneDockTabId }) {
    return `${sceneBase(projectId, sceneId)}/dock-tabs/${segment(tab)}`
  },
  scenePatchPreview({ projectId, sceneId }: { projectId: string; sceneId: string }) {
    return `${sceneBase(projectId, sceneId)}/patch-preview`
  },
  scenePatchCommit({ projectId, sceneId }: { projectId: string; sceneId: string }) {
    return `${sceneBase(projectId, sceneId)}/patch-commit`
  },
  sceneProseRevision({ projectId, sceneId }: { projectId: string; sceneId: string }) {
    return `${sceneBase(projectId, sceneId)}/prose/revision`
  },
  sceneExecutionContinue({ projectId, sceneId }: { projectId: string; sceneId: string }) {
    return `${sceneBase(projectId, sceneId)}/execution/continue`
  },
  sceneExecutionThread({ projectId, sceneId }: { projectId: string; sceneId: string }) {
    return `${sceneBase(projectId, sceneId)}/execution/thread`
  },
  sceneProposalAccept({ projectId, sceneId }: { projectId: string; sceneId: string }) {
    return `${sceneBase(projectId, sceneId)}/proposals/accept`
  },
  sceneProposalEditAccept({ projectId, sceneId }: { projectId: string; sceneId: string }) {
    return `${sceneBase(projectId, sceneId)}/proposals/edit-accept`
  },
  sceneProposalRequestRewrite({ projectId, sceneId }: { projectId: string; sceneId: string }) {
    return `${sceneBase(projectId, sceneId)}/proposals/request-rewrite`
  },
  sceneProposalReject({ projectId, sceneId }: { projectId: string; sceneId: string }) {
    return `${sceneBase(projectId, sceneId)}/proposals/reject`
  },
}
