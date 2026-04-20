export type BookExportArtifactFormat = 'markdown' | 'plain_text'

export type BookExportArtifactBuildStatus = 'ready'

export interface BookExportArtifactReadinessSnapshot {
  status: 'ready' | 'attention' | 'blocked'
  blockerCount: number
  warningCount: number
  infoCount: number
}

export interface BookExportArtifactReviewGateSnapshot {
  openBlockerCount: number
  checkedFixCount: number
  blockedFixCount: number
  staleFixCount: number
}

export interface BookExportArtifactRecord {
  id: string
  bookId: string
  exportProfileId: string
  checkpointId?: string
  format: BookExportArtifactFormat
  status: BookExportArtifactBuildStatus
  filename: string
  mimeType: string
  title: string
  summary: string
  content: string
  sourceSignature: string
  chapterCount: number
  sceneCount: number
  wordCount: number
  readinessSnapshot: BookExportArtifactReadinessSnapshot
  reviewGateSnapshot: BookExportArtifactReviewGateSnapshot
  createdAtLabel: string
  createdByLabel: string
}

export interface BuildBookExportArtifactInput {
  bookId: string
  exportProfileId: string
  checkpointId?: string
  format: BookExportArtifactFormat
  filename: string
  mimeType: string
  title: string
  summary: string
  content: string
  sourceSignature: string
  chapterCount: number
  sceneCount: number
  wordCount: number
  readinessSnapshot: BookExportArtifactReadinessSnapshot
  reviewGateSnapshot: BookExportArtifactReviewGateSnapshot
}
