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

export interface ProjectRuntimeInfoClient {
  getProjectRuntimeInfo(): Promise<ProjectRuntimeInfoRecord>
}
