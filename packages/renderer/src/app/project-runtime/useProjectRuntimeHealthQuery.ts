import { useMemo } from 'react'

import { useQuery, type QueryObserverResult } from '@tanstack/react-query'

import { useProjectRuntime } from './ProjectRuntimeProvider'
import { ApiRequestError } from './api-transport'
import {
  createProjectRuntimeInfoRecord,
  type ProjectRuntimeHealthStatus,
  type ProjectRuntimeInfoRecord,
  type ProjectRuntimeSource,
} from './project-runtime-info'

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

export function useProjectRuntimeHealthQuery(): ProjectRuntimeHealthQueryResult {
  const runtime = useProjectRuntime()
  const source = inferProjectRuntimeSource(runtime)
  const fallbackProjectTitle = getRuntimeProjectTitle(runtime)
  const query = useQuery<ProjectRuntimeInfoRecord, unknown>({
    queryKey: ['project-runtime', runtime.projectId, 'health'],
    queryFn: () => runtime.runtimeInfoClient.getProjectRuntimeInfo(),
  })

  return useMemo(() => {
    const error = query.error ?? null
    const errorState = query.isPending ? null : classifyProjectRuntimeHealthError(error, source, runtime.projectId)
    const info = query.data ?? createFallbackProjectRuntimeInfo({
      projectId: runtime.projectId,
      projectTitle: fallbackProjectTitle,
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
  }, [fallbackProjectTitle, query.data, query.error, query.isFetching, query.isPending, query.refetch, runtime, source])
}

function inferProjectRuntimeSource(runtime: { persistence?: unknown }): ProjectRuntimeSource {
  return runtime.persistence ? 'mock' : 'api'
}

function createFallbackProjectRuntimeInfo({
  projectId,
  projectTitle,
  source,
  status,
  summary,
}: {
  projectId: string
  projectTitle: string
  source: ProjectRuntimeSource
  status: ProjectRuntimeHealthStatus
  summary: string
}) {
  return createProjectRuntimeInfoRecord({
    projectId,
    projectTitle,
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
  source: ProjectRuntimeSource,
  projectId: string,
): ProjectRuntimeHealthErrorState {
  if (error instanceof ApiRequestError) {
    if (isMalformedProjectRuntimeResponseError(error)) {
      return {
        status: 'unavailable',
        summary: getMalformedRuntimeSummary(source),
      }
    }

    if (error.status === 401) {
      return {
        status: 'unauthorized',
        summary: getUnauthorizedRuntimeSummary(source),
      }
    }

    if (error.status === 403) {
      return {
        status: 'forbidden',
        summary: getForbiddenRuntimeSummary(source),
      }
    }

    if (error.status === 404) {
      return {
        status: 'not_found',
        summary: getNotFoundRuntimeSummary(source, projectId),
      }
    }

    if (error.status >= 500) {
      return {
        status: 'unavailable',
        summary: getUnavailableRuntimeSummary(source),
      }
    }

    return {
      status: 'unknown',
      summary: getUnknownRuntimeSummary(source),
    }
  }

  if (error instanceof Error) {
    return {
      status: 'unavailable',
      summary: getUnavailableRuntimeSummary(source),
    }
  }

  return {
    status: 'unknown',
    summary: getUnknownRuntimeSummary(source),
  }
}

function isMalformedProjectRuntimeResponseError(error: ApiRequestError) {
  return error.message === 'Malformed JSON response'
}

function getUnavailableRuntimeSummary(source: ProjectRuntimeSource) {
  if (source === 'api') {
    return 'API demo runtime is unavailable. Start the fixture API or reopen the desktop-local demo, then retry.'
  }

  return 'Project runtime is unavailable.'
}

function getMalformedRuntimeSummary(source: ProjectRuntimeSource) {
  if (source === 'api') {
    return 'API demo runtime returned malformed runtime info. Restart the fixture API or reopen the desktop-local demo, then retry.'
  }

  return 'Project runtime returned malformed JSON.'
}

function getUnauthorizedRuntimeSummary(source: ProjectRuntimeSource) {
  if (source === 'api') {
    return 'API demo runtime requires authentication before this project can load.'
  }

  return 'Project runtime authentication is required.'
}

function getForbiddenRuntimeSummary(source: ProjectRuntimeSource) {
  if (source === 'api') {
    return 'API demo runtime rejected access to this project. Verify the runtime session, then retry.'
  }

  return 'Project runtime access is forbidden.'
}

function getNotFoundRuntimeSummary(source: ProjectRuntimeSource, projectId: string) {
  if (source === 'api') {
    return `API demo project "${projectId}" was not found. Verify the runtime project id and seeded fixture data, then retry.`
  }

  return 'Project runtime was not found.'
}

function getUnknownRuntimeSummary(source: ProjectRuntimeSource) {
  if (source === 'api') {
    return 'API demo runtime health check failed. Verify the fixture API or desktop-local demo, then retry.'
  }

  return 'Project runtime health check failed.'
}
