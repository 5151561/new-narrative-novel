export interface ApiErrorResponse {
  status: number
  message: string
  code?: string
  detail?: unknown
}

export type ProjectRuntimeSource = 'mock' | 'api'

export type ProjectRuntimeHealthStatus =
  | 'healthy'
  | 'checking'
  | 'unavailable'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'unknown'

export interface ProjectRuntimeCapabilitiesRecord {
  read: boolean
  write: boolean
  runEvents: boolean
  runEventPolling: boolean
  runEventStream: boolean
  reviewDecisions: boolean
  contextPacketRefs: boolean
  proposalSetRefs: boolean
}

export interface ProjectRuntimeInfoRecord {
  projectId: string
  projectTitle: string
  source: ProjectRuntimeSource
  status: ProjectRuntimeHealthStatus
  summary: string
  checkedAtLabel?: string
  apiBaseUrl?: string
  versionLabel?: string
  capabilities: ProjectRuntimeCapabilitiesRecord
}

export interface LocalizedTextRecord {
  en: string
  'zh-CN': string
}

export interface BookStructureRecord {
  bookId: string
  title: LocalizedTextRecord
  summary: LocalizedTextRecord
  chapterIds: string[]
}

export interface ChapterSceneRecord {
  id: string
  order: number
  title: LocalizedTextRecord
  summary: LocalizedTextRecord
}

export interface ChapterStructureRecord {
  chapterId: string
  title: LocalizedTextRecord
  summary: LocalizedTextRecord
  scenes: ChapterSceneRecord[]
}

export interface SceneRecord {
  sceneId: string
  chapterId: string
  bookId: string
  title: LocalizedTextRecord
  status: string
}

export interface AssetRecord {
  assetId: string
  kind: 'character' | 'location' | 'object'
  title: LocalizedTextRecord
  summary: LocalizedTextRecord
}

export interface ReviewDecisionRecord {
  id: string
  bookId: string
  issueId: string
  status: 'accepted' | 'deferred' | 'rejected'
  note?: string
}

export interface BookExportProfileRecord {
  id: string
  bookId: string
  title: LocalizedTextRecord
  format: 'docx' | 'pdf'
}

export interface BookExportArtifactRecord {
  id: string
  bookId: string
  exportProfileId: string
  label: string
  status: 'ready' | 'queued'
}

export interface BookExperimentBranchRecord {
  id: string
  bookId: string
  label: string
  baseline: 'current' | 'checkpoint'
}

export interface BookManuscriptCheckpointRecord {
  id: string
  bookId: string
  label: string
  sceneCount: number
}

export interface FixtureProjectData {
  runtimeInfo: ProjectRuntimeInfoRecord
  books: Record<string, BookStructureRecord>
  chapters: Record<string, ChapterStructureRecord>
  scenes: Record<string, SceneRecord>
  assets: Record<string, AssetRecord>
  reviewDecisions: Record<string, ReviewDecisionRecord[]>
  exportProfiles: Record<string, BookExportProfileRecord[]>
  exportArtifacts: Record<string, BookExportArtifactRecord[]>
  experimentBranches: Record<string, BookExperimentBranchRecord[]>
  manuscriptCheckpoints: Record<string, BookManuscriptCheckpointRecord[]>
}

export interface FixtureDataSnapshot {
  projects: Record<string, FixtureProjectData>
}
