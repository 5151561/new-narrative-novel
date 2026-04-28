import type { RuntimeKind } from '@/app/runtime'

export type ProjectRuntimeKind = RuntimeKind
export type ProjectRuntimeProjectMode = 'demo-fixture' | 'real-project'
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
  projectMode: ProjectRuntimeProjectMode
  runtimeKind: ProjectRuntimeKind
  source: ProjectRuntimeSource
  status: ProjectRuntimeHealthStatus
  summary: string
  checkedAtLabel?: string
  apiBaseUrl?: string
  versionLabel?: string
  modelBindings: {
    usable: boolean
  }
  capabilities: ProjectRuntimeCapabilitiesRecord
}

export interface ProjectRuntimeInfoClient {
  getProjectRuntimeInfo(): Promise<ProjectRuntimeInfoRecord>
}

const defaultProjectRuntimeCapabilities: ProjectRuntimeCapabilitiesRecord = {
  read: false,
  write: false,
  runEvents: false,
  runEventPolling: false,
  runEventStream: false,
  reviewDecisions: false,
  contextPacketRefs: false,
  proposalSetRefs: false,
}

export function createProjectRuntimeCapabilitiesRecord(
  overrides: Partial<ProjectRuntimeCapabilitiesRecord> = {},
): ProjectRuntimeCapabilitiesRecord {
  return {
    ...defaultProjectRuntimeCapabilities,
    ...overrides,
  }
}

export function createProjectRuntimeInfoRecord({
  projectId,
  projectTitle = projectId,
  projectMode,
  source,
  runtimeKind,
  status,
  summary,
  checkedAtLabel,
  apiBaseUrl,
  versionLabel,
  modelBindings,
  capabilities,
}: {
  projectId: string
  projectTitle?: string
  projectMode?: ProjectRuntimeProjectMode
  runtimeKind?: ProjectRuntimeKind
  source: ProjectRuntimeSource
  status: ProjectRuntimeHealthStatus
  summary: string
  checkedAtLabel?: string
  apiBaseUrl?: string
  versionLabel?: string
  modelBindings?: {
    usable: boolean
  }
  capabilities?: Partial<ProjectRuntimeCapabilitiesRecord>
}): ProjectRuntimeInfoRecord {
  const resolvedRuntimeKind = runtimeKind ?? (source === 'mock' ? 'mock-storybook' : 'fixture-demo')
  const resolvedProjectMode = projectMode ?? (resolvedRuntimeKind === 'real-local-project' ? 'real-project' : 'demo-fixture')

  return {
    projectId,
    projectTitle,
    projectMode: resolvedProjectMode,
    runtimeKind: resolvedRuntimeKind,
    source,
    status,
    summary,
    checkedAtLabel,
    apiBaseUrl,
    versionLabel,
    modelBindings: modelBindings ?? {
      usable: resolvedProjectMode !== 'real-project',
    },
    capabilities: createProjectRuntimeCapabilitiesRecord(capabilities),
  }
}

export function isRealProjectRuntime(info: Pick<ProjectRuntimeInfoRecord, 'projectMode'> | null | undefined) {
  return info?.projectMode === 'real-project'
}

export function areProjectRuntimeModelBindingsUsable(
  info: Pick<ProjectRuntimeInfoRecord, 'modelBindings'> | null | undefined,
) {
  return Boolean(info?.modelBindings.usable)
}

export function supportsRunEventStream(info: Pick<ProjectRuntimeInfoRecord, 'capabilities'> | null | undefined) {
  return Boolean(info?.capabilities.runEvents && info.capabilities.runEventStream)
}

export function supportsRunEventPolling(info: Pick<ProjectRuntimeInfoRecord, 'capabilities'> | null | undefined) {
  return Boolean(info?.capabilities.runEvents && info.capabilities.runEventPolling)
}
