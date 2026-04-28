import { useMemo } from 'react'

import { useQuery, type QueryObserverResult } from '@tanstack/react-query'

import { getProjectRuntimeKind, useProjectRuntime } from './ProjectRuntimeProvider'
import { ApiRequestError } from './api-transport'
import {
  createProjectRuntimeInfoRecord,
  type ProjectRuntimeHealthStatus,
  type ProjectRuntimeInfoRecord,
  type ProjectRuntimeSource,
} from './project-runtime-info'
import type { RuntimeKind } from '@/app/runtime'

export interface ProjectRuntimeHealthQueryResult {
  info: ProjectRuntimeInfoRecord
  isChecking: boolean
  error: unknown | null
  refetch: () => Promise<QueryObserverResult<ProjectRuntimeInfoRecord, unknown>>
}

interface ProjectRuntimeHealthErrorState {
  status: Extract<ProjectRuntimeHealthStatus, 'unavailable' | 'unauthorized' | 'forbidden' | 'not_found' | 'unknown'>
  summary: string
}

interface ProjectRuntimeIdentity {
  projectId: string
  projectTitle: string
  runtimeKind: RuntimeKind
  source: ProjectRuntimeSource
}

export function useProjectRuntimeHealthQuery(): ProjectRuntimeHealthQueryResult {
  const runtime = useProjectRuntime()
  const source = inferProjectRuntimeSource(runtime)
  const fallbackProjectTitle = getRuntimeProjectTitle(runtime)
  const runtimeKind = getProjectRuntimeKind(runtime)
  const query = useQuery<ProjectRuntimeInfoRecord, unknown>({
    queryKey: ['project-runtime', runtime.projectId, 'health'],
    queryFn: () => runtime.runtimeInfoClient.getProjectRuntimeInfo(),
  })

  return useMemo(() => {
    const error = query.error ?? null
    const runtimeIdentity = {
      projectId: runtime.projectId,
      projectTitle: fallbackProjectTitle,
      runtimeKind,
      source,
    } satisfies ProjectRuntimeIdentity
    const errorState = query.isPending ? null : classifyProjectRuntimeHealthError(error, runtimeIdentity)
    const info = query.data ?? createFallbackProjectRuntimeInfo({
      projectId: runtime.projectId,
      projectTitle: fallbackProjectTitle,
      runtimeKind,
      source,
      status: query.isPending ? 'checking' : errorState?.status ?? 'unknown',
      summary: query.isPending ? 'Checking project runtime health.' : errorState?.summary ?? 'Project runtime health check failed.',
    })

    return {
      info,
      isChecking: query.isFetching,
      error,
      refetch: query.refetch,
    }
  }, [fallbackProjectTitle, query.data, query.error, query.isFetching, query.isPending, query.refetch, runtime, runtimeKind, source])
}

function inferProjectRuntimeSource(runtime: { persistence?: unknown }): ProjectRuntimeSource {
  return runtime.persistence ? 'mock' : 'api'
}

function createFallbackProjectRuntimeInfo({
  projectId,
  projectTitle,
  runtimeKind,
  source,
  status,
  summary,
}: {
  projectId: string
  projectTitle: string
  runtimeKind: RuntimeKind
  source: ProjectRuntimeSource
  status: ProjectRuntimeHealthStatus
  summary: string
}) {
  return createProjectRuntimeInfoRecord({
    projectId,
    projectTitle,
    runtimeKind,
    source,
    status,
    summary,
  })
}

function getRuntimeProjectTitle(runtime: { projectId: string; projectTitle?: string }) {
  const projectTitle = runtime.projectTitle?.trim()
  return projectTitle && projectTitle.length > 0 ? projectTitle : runtime.projectId
}

function classifyProjectRuntimeHealthError(
  error: unknown,
  runtimeIdentity: ProjectRuntimeIdentity,
): ProjectRuntimeHealthErrorState {
  if (error instanceof ApiRequestError) {
    if (isMalformedProjectRuntimeResponseError(error)) {
      return {
        status: 'unavailable',
        summary: getMalformedRuntimeSummary(runtimeIdentity),
      }
    }

    if (error.status === 401) {
      return {
        status: 'unauthorized',
        summary: getUnauthorizedRuntimeSummary(runtimeIdentity),
      }
    }

    if (error.status === 403) {
      return {
        status: 'forbidden',
        summary: getForbiddenRuntimeSummary(runtimeIdentity),
      }
    }

    if (error.status === 404) {
      return {
        status: 'not_found',
        summary: getNotFoundRuntimeSummary(runtimeIdentity),
      }
    }

    if (error.status >= 500) {
      return {
        status: 'unavailable',
        summary: getUnavailableRuntimeSummary(runtimeIdentity),
      }
    }

    return {
      status: 'unknown',
      summary: getUnknownRuntimeSummary(runtimeIdentity),
    }
  }

  if (error instanceof Error) {
    return {
      status: 'unavailable',
      summary: getUnavailableRuntimeSummary(runtimeIdentity),
    }
  }

  return {
    status: 'unknown',
    summary: getUnknownRuntimeSummary(runtimeIdentity),
  }
}

function isMalformedProjectRuntimeResponseError(error: ApiRequestError) {
  return error.message === 'Malformed JSON response'
}

function isRealLocalProjectRuntime(identity: ProjectRuntimeIdentity) {
  return identity.runtimeKind === 'real-local-project'
}

function getUnavailableRuntimeSummary(identity: ProjectRuntimeIdentity) {
  if (isRealLocalProjectRuntime(identity)) {
    return `Local project runtime is unavailable for "${identity.projectTitle}". The selected project stays active and mock fallback stays off until the runtime recovers.`
  }

  if (identity.source === 'api') {
    return 'API demo runtime is unavailable. Start the fixture API or reopen the desktop-local demo, then retry.'
  }

  return 'Project runtime is unavailable.'
}

function getMalformedRuntimeSummary(identity: ProjectRuntimeIdentity) {
  if (isRealLocalProjectRuntime(identity)) {
    return `Local project runtime returned malformed runtime info for "${identity.projectTitle}". The selected project stays active and mock fallback stays off until the runtime recovers.`
  }

  if (identity.source === 'api') {
    return 'API demo runtime returned malformed runtime info. Restart the fixture API or reopen the desktop-local demo, then retry.'
  }

  return 'Project runtime returned malformed JSON.'
}

function getUnauthorizedRuntimeSummary(identity: ProjectRuntimeIdentity) {
  if (isRealLocalProjectRuntime(identity)) {
    return `Local project runtime needs authorization for "${identity.projectTitle}". The selected project stays active and mock fallback stays off until access is restored.`
  }

  if (identity.source === 'api') {
    return 'API demo runtime requires authentication before this project can load.'
  }

  return 'Project runtime authentication is required.'
}

function getForbiddenRuntimeSummary(identity: ProjectRuntimeIdentity) {
  if (isRealLocalProjectRuntime(identity)) {
    return `Local project runtime denied access to "${identity.projectTitle}". The selected project stays active and mock fallback stays off until access is restored.`
  }

  if (identity.source === 'api') {
    return 'API demo runtime rejected access to this project. Verify the runtime session, then retry.'
  }

  return 'Project runtime access is forbidden.'
}

function getNotFoundRuntimeSummary(identity: ProjectRuntimeIdentity) {
  if (isRealLocalProjectRuntime(identity)) {
    return `Local project runtime could not find "${identity.projectId}". The selected project stays active and mock fallback stays off until the runtime matches this project again.`
  }

  if (identity.source === 'api') {
    return `API demo project "${identity.projectId}" was not found. Verify the runtime project id and seeded fixture data, then retry.`
  }

  return 'Project runtime was not found.'
}

function getUnknownRuntimeSummary(identity: ProjectRuntimeIdentity) {
  if (isRealLocalProjectRuntime(identity)) {
    return `Local project runtime health check failed for "${identity.projectTitle}". The selected project stays active and mock fallback stays off until the runtime recovers.`
  }

  if (identity.source === 'api') {
    return 'API demo runtime health check failed. Verify the fixture API or desktop-local demo, then retry.'
  }

  return 'Project runtime health check failed.'
}
