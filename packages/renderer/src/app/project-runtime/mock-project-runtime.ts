import {
  createAssetClient,
  type AssetClient,
} from '@/features/asset/api/asset-client'
import {
  createBookClient,
  type BookClient,
} from '@/features/book/api/book-client'
import {
  exportMockBookExportArtifactSnapshot,
  importMockBookExportArtifactSnapshot,
} from '@/features/book/api/mock-book-export-artifact-db'
import {
  createChapterClient,
  type ChapterClient,
} from '@/features/chapter/api/chapter-client'
import {
  exportMockChapterSnapshot,
  importMockChapterSnapshot,
} from '@/features/chapter/api/mock-chapter-db'
import {
  createReviewClient,
  type ReviewClient,
} from '@/features/review/api/review-client'
import {
  exportMockReviewDecisionSnapshot,
  importMockReviewDecisionSnapshot,
} from '@/features/review/api/mock-review-decision-db'
import {
  exportMockReviewFixActionSnapshot,
  importMockReviewFixActionSnapshot,
} from '@/features/review/api/mock-review-fix-action-db'
import {
  createRunClient,
  type RunClient,
} from '@/features/run/api/run-client'
import {
  exportMockRunSnapshot,
  importMockRunSnapshot,
} from '@/features/run/api/mock-run-db'
import {
  createSceneClient,
  type SceneClient,
} from '@/features/scene/api/scene-client'
import type { TraceabilitySceneClient } from '@/features/traceability/hooks/useTraceabilitySceneSources'

import { createLocalStorageProjectPersistence } from './local-storage-project-persistence'
import type { ProjectPersistedSnapshotV1, ProjectPersistencePort } from './project-persistence'
import type { ProjectRuntime } from './project-runtime'
import type { ProjectRuntimeInfoRecord } from './project-runtime-info'

export interface CreateMockProjectRuntimeOptions {
  projectId?: string
  bookClient?: BookClient
  chapterClient?: ChapterClient
  assetClient?: AssetClient
  reviewClient?: ReviewClient
  runClient?: RunClient
  sceneClient?: SceneClient
  traceabilitySceneClient?: TraceabilitySceneClient
  persistence?: ProjectPersistencePort
}

function withProjectBucket<T>(projectId: string, snapshot: Record<string, T[]>): Record<string, T[]> {
  const bucket = snapshot[projectId]
  if (!bucket || bucket.length === 0) {
    return {}
  }

  return {
    [projectId]: bucket,
  }
}

function withProjectRecord<T>(projectId: string, snapshot: Record<string, T>): Record<string, T> {
  const bucket = snapshot[projectId]
  if (!bucket) {
    return {}
  }

  return {
    [projectId]: structuredClone(bucket),
  }
}

async function resolveProjectChapterIds(projectId: string, bookClient: BookClient) {
  const bookRecord = await bookClient.getBookStructureRecord({ bookId: projectId })
  return bookRecord?.chapterIds ?? []
}

function pickProjectChapterRecords(
  chapterRecordsById: ProjectPersistedSnapshotV1['chapterRecordsById'],
  chapterIds: string[],
): ProjectPersistedSnapshotV1['chapterRecordsById'] {
  return Object.fromEntries(
    chapterIds
      .map((chapterId) => {
        const record = chapterRecordsById[chapterId]
        return record ? [chapterId, record] : null
      })
      .filter((entry): entry is [string, ProjectPersistedSnapshotV1['chapterRecordsById'][string]] => entry !== null),
  )
}

async function buildProjectScopedMockSnapshot(projectId: string, bookClient: BookClient): Promise<ProjectPersistedSnapshotV1> {
  const chapterIds = await resolveProjectChapterIds(projectId, bookClient)
  const runSnapshot = exportMockRunSnapshot()

  return {
    schemaVersion: 1,
    projectId,
    updatedAt: new Date().toISOString(),
    reviewDecisionsByBookId: withProjectBucket(projectId, exportMockReviewDecisionSnapshot()),
    reviewFixActionsByBookId: withProjectBucket(projectId, exportMockReviewFixActionSnapshot()),
    bookExportArtifactsByBookId: withProjectBucket(projectId, exportMockBookExportArtifactSnapshot()),
    runStatesByProjectId: withProjectBucket(projectId, runSnapshot.runStatesByProjectId),
    runSceneSequencesByProjectId: withProjectRecord(projectId, runSnapshot.runSceneSequencesByProjectId),
    chapterRecordsById: pickProjectChapterRecords(exportMockChapterSnapshot(), chapterIds),
  }
}

async function restoreProjectScopedMockSnapshot(
  projectId: string,
  snapshot: ProjectPersistedSnapshotV1,
  bookClient: BookClient,
) {
  const currentReviewDecisions = exportMockReviewDecisionSnapshot()
  const currentReviewFixActions = exportMockReviewFixActionSnapshot()
  const currentBookExportArtifacts = exportMockBookExportArtifactSnapshot()
  const currentRunSnapshot = exportMockRunSnapshot()
  const currentChapterRecords = exportMockChapterSnapshot()
  const projectChapterIds = await resolveProjectChapterIds(projectId, bookClient)

  const projectReviewDecisions = snapshot.reviewDecisionsByBookId[projectId]
  const projectReviewFixActions = snapshot.reviewFixActionsByBookId[projectId]
  const projectBookExportArtifacts = snapshot.bookExportArtifactsByBookId[projectId]
  const projectRunStates = snapshot.runStatesByProjectId?.[projectId]
  const projectRunSequences = snapshot.runSceneSequencesByProjectId?.[projectId]

  if (projectReviewDecisions && projectReviewDecisions.length > 0) {
    currentReviewDecisions[projectId] = projectReviewDecisions
  } else {
    delete currentReviewDecisions[projectId]
  }

  if (projectReviewFixActions && projectReviewFixActions.length > 0) {
    currentReviewFixActions[projectId] = projectReviewFixActions
  } else {
    delete currentReviewFixActions[projectId]
  }

  if (projectBookExportArtifacts && projectBookExportArtifacts.length > 0) {
    currentBookExportArtifacts[projectId] = projectBookExportArtifacts
  } else {
    delete currentBookExportArtifacts[projectId]
  }

  if (projectRunStates && projectRunStates.length > 0) {
    currentRunSnapshot.runStatesByProjectId[projectId] = projectRunStates
  } else {
    delete currentRunSnapshot.runStatesByProjectId[projectId]
  }

  if (projectRunSequences && Object.keys(projectRunSequences).length > 0) {
    currentRunSnapshot.runSceneSequencesByProjectId[projectId] = projectRunSequences
  } else {
    delete currentRunSnapshot.runSceneSequencesByProjectId[projectId]
  }

  for (const chapterId of projectChapterIds) {
    delete currentChapterRecords[chapterId]
  }

  Object.assign(currentChapterRecords, pickProjectChapterRecords(snapshot.chapterRecordsById, projectChapterIds))

  importMockReviewDecisionSnapshot(currentReviewDecisions)
  importMockReviewFixActionSnapshot(currentReviewFixActions)
  importMockBookExportArtifactSnapshot(currentBookExportArtifacts)
  importMockRunSnapshot(currentRunSnapshot)
  importMockChapterSnapshot(currentChapterRecords)
}

async function persistCurrentMockSnapshot(projectId: string, persistence: ProjectPersistencePort, bookClient: BookClient) {
  await persistence.saveProjectSnapshot(projectId, await buildProjectScopedMockSnapshot(projectId, bookClient))
}

function buildMockProjectRuntimeInfo(projectId: string): ProjectRuntimeInfoRecord {
  return {
    projectId,
    projectTitle: projectId,
    source: 'mock',
    status: 'healthy',
    summary: 'Using in-memory mock project runtime.',
    checkedAtLabel: 'Static mock runtime',
    capabilities: {
      read: true,
      write: true,
      runEvents: true,
      runEventPolling: true,
      runEventStream: false,
      reviewDecisions: true,
      contextPacketRefs: true,
      proposalSetRefs: true,
    },
  }
}

export function createMockProjectRuntime({
  projectId = 'book-signal-arc',
  bookClient: runtimeBookClient,
  chapterClient: runtimeChapterClient,
  assetClient: runtimeAssetClient,
  reviewClient: runtimeReviewClient,
  runClient: runtimeRunClient,
  sceneClient: runtimeSceneClient,
  traceabilitySceneClient: runtimeTraceabilitySceneClient,
  persistence = createLocalStorageProjectPersistence(),
}: CreateMockProjectRuntimeOptions = {}): ProjectRuntime {
  const baseBookClient = runtimeBookClient ?? createBookClient()
  const baseChapterClient = runtimeChapterClient ?? createChapterClient()
  const baseAssetClient = runtimeAssetClient ?? createAssetClient()
  const baseReviewClient = runtimeReviewClient ?? createReviewClient()
  const baseRunClient = runtimeRunClient ?? createRunClient({ projectId })
  const baseSceneClient = runtimeSceneClient ?? createSceneClient()
  const baseTraceabilitySceneClient = runtimeTraceabilitySceneClient ?? baseSceneClient

  const hydrationPromise = (async () => {
    const snapshot = await persistence.loadProjectSnapshot(projectId)
    if (!snapshot) {
      return
    }

    await restoreProjectScopedMockSnapshot(projectId, snapshot, baseBookClient)
  })()
  void hydrationPromise.catch(() => {})

  async function ensureHydrated() {
    await hydrationPromise
  }

  async function persistAfterMutation<T>(operation: () => Promise<T>) {
    await ensureHydrated()
    const previousSnapshot = await buildProjectScopedMockSnapshot(projectId, baseBookClient)
    const result = await operation()
    try {
      await persistCurrentMockSnapshot(projectId, persistence, baseBookClient)
    } catch (error) {
      await restoreProjectScopedMockSnapshot(projectId, previousSnapshot, baseBookClient)
      throw error
    }
    return result
  }

  return {
    projectId,
    bookClient: {
      async getBookStructureRecord(input) {
        await ensureHydrated()
        return baseBookClient.getBookStructureRecord(input)
      },
      async getBookManuscriptCheckpoints(input) {
        await ensureHydrated()
        return baseBookClient.getBookManuscriptCheckpoints(input)
      },
      async getBookManuscriptCheckpoint(input) {
        await ensureHydrated()
        return baseBookClient.getBookManuscriptCheckpoint(input)
      },
      async getBookExportProfiles(input) {
        await ensureHydrated()
        return baseBookClient.getBookExportProfiles(input)
      },
      async getBookExportProfile(input) {
        await ensureHydrated()
        return baseBookClient.getBookExportProfile(input)
      },
      async getBookExportArtifacts(input) {
        await ensureHydrated()
        return baseBookClient.getBookExportArtifacts(input)
      },
      async buildBookExportArtifact(input) {
        return persistAfterMutation(() => baseBookClient.buildBookExportArtifact(input))
      },
      async getBookExperimentBranches(input) {
        await ensureHydrated()
        return baseBookClient.getBookExperimentBranches(input)
      },
      async getBookExperimentBranch(input) {
        await ensureHydrated()
        return baseBookClient.getBookExperimentBranch(input)
      },
    },
    chapterClient: {
      async getChapterStructureWorkspace(input) {
        await ensureHydrated()
        return baseChapterClient.getChapterStructureWorkspace(input)
      },
      async reorderChapterScene(input) {
        return persistAfterMutation(() => baseChapterClient.reorderChapterScene(input))
      },
      async updateChapterSceneStructure(input) {
        return persistAfterMutation(() => baseChapterClient.updateChapterSceneStructure(input))
      },
    },
    assetClient: baseAssetClient,
    reviewClient: {
      async getBookReviewDecisions(input) {
        await ensureHydrated()
        return baseReviewClient.getBookReviewDecisions(input)
      },
      async setReviewIssueDecision(input) {
        return persistAfterMutation(() => baseReviewClient.setReviewIssueDecision(input))
      },
      async clearReviewIssueDecision(input) {
        await persistAfterMutation(() => baseReviewClient.clearReviewIssueDecision(input))
      },
      async getBookReviewFixActions(input) {
        await ensureHydrated()
        return baseReviewClient.getBookReviewFixActions(input)
      },
      async setReviewIssueFixAction(input) {
        return persistAfterMutation(() => baseReviewClient.setReviewIssueFixAction(input))
      },
      async clearReviewIssueFixAction(input) {
        await persistAfterMutation(() => baseReviewClient.clearReviewIssueFixAction(input))
      },
    },
    runClient: {
      async startSceneRun(input) {
        return persistAfterMutation(() => baseRunClient.startSceneRun(input))
      },
      async getRun(input) {
        await ensureHydrated()
        return baseRunClient.getRun(input)
      },
      async getRunEvents(input) {
        await ensureHydrated()
        return baseRunClient.getRunEvents(input)
      },
      async submitRunReviewDecision(input) {
        return persistAfterMutation(() => baseRunClient.submitRunReviewDecision(input))
      },
    },
    runtimeInfoClient: {
      async getProjectRuntimeInfo() {
        return buildMockProjectRuntimeInfo(projectId)
      },
    },
    sceneClient: baseSceneClient,
    traceabilitySceneClient: {
      async getSceneExecution(sceneId) {
        await ensureHydrated()
        return baseTraceabilitySceneClient.getSceneExecution(sceneId)
      },
      async getSceneProse(sceneId) {
        await ensureHydrated()
        return baseTraceabilitySceneClient.getSceneProse(sceneId)
      },
      async getSceneInspector(sceneId) {
        await ensureHydrated()
        return baseTraceabilitySceneClient.getSceneInspector(sceneId)
      },
      async previewAcceptedPatch(sceneId) {
        await ensureHydrated()
        return baseTraceabilitySceneClient.previewAcceptedPatch(sceneId)
      },
    },
    persistence,
  }
}
