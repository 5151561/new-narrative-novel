import type { BookExportArtifactFormat } from '../api/book-export-artifact-records'

export interface BookExportArtifactGateReasonViewModel {
  id: string
  severity: 'blocker' | 'warning'
  title: string
  detail: string
  source: 'export-readiness' | 'review-open-blocker'
}

export interface BookExportArtifactGateViewModel {
  canBuild: boolean
  status: 'ready' | 'attention' | 'blocked'
  label: string
  reasons: BookExportArtifactGateReasonViewModel[]
  openBlockerCount: number
  checkedFixCount: number
  blockedFixCount: number
  staleFixCount: number
}

export interface BookExportArtifactSummaryViewModel {
  artifactId: string
  format: BookExportArtifactFormat
  filename: string
  mimeType: string
  title: string
  summary: string
  content: string
  createdAtLabel: string
  createdByLabel: string
  sourceSignature: string
  isStale: boolean
  chapterCount: number
  sceneCount: number
  wordCount: number
  readinessStatus: 'ready' | 'attention' | 'blocked'
}

export interface BookExportArtifactWorkspaceViewModel {
  bookId: string
  exportProfileId: string
  checkpointId?: string
  sourceSignature: string
  gate: BookExportArtifactGateViewModel
  latestArtifact: BookExportArtifactSummaryViewModel | null
  artifacts: BookExportArtifactSummaryViewModel[]
}
