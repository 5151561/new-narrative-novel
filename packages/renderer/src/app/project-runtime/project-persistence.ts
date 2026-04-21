import type { BookExportArtifactRecord } from '@/features/book/api/book-export-artifact-records'
import type { ChapterStructureWorkspaceRecord } from '@/features/chapter/api/chapter-records'
import type { ReviewIssueDecisionRecord } from '@/features/review/api/review-decision-records'
import type { ReviewIssueFixActionRecord } from '@/features/review/api/review-fix-action-records'
import type { RunEventRecord, RunRecord } from '@/features/run/api/run-records'

export interface PersistedRunStateRecord {
  run: RunRecord
  events: RunEventRecord[]
}

export interface ProjectPersistedSnapshotV1 {
  schemaVersion: 1
  projectId: string
  updatedAt: string
  reviewDecisionsByBookId: Record<string, ReviewIssueDecisionRecord[]>
  reviewFixActionsByBookId: Record<string, ReviewIssueFixActionRecord[]>
  bookExportArtifactsByBookId: Record<string, BookExportArtifactRecord[]>
  runStatesByProjectId?: Record<string, PersistedRunStateRecord[]>
  runSceneSequencesByProjectId?: Record<string, Record<string, number>>
  chapterRecordsById: Record<string, ChapterStructureWorkspaceRecord>
}

export interface ProjectPersistencePort {
  loadProjectSnapshot(projectId: string): Promise<ProjectPersistedSnapshotV1 | null>
  saveProjectSnapshot(projectId: string, snapshot: ProjectPersistedSnapshotV1): Promise<void>
  clearProjectSnapshot(projectId: string): Promise<void>
}
