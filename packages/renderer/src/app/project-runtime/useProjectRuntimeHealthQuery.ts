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
  const query = useQuery<ProjectRuntimeInfoRecord, unknown>({
    queryKey: ['project-runtime', runtime.projectId, 'health'],
    queryFn: () => runtime.runtimeInfoClient.getProjectRuntimeInfo(),
  })

  return useMemo(() => {
    const error = query.error ?? null
    const errorState = query.isPending ? null : classifyProjectRuntimeHealthError(error)
    const info = query.data ?? createFallbackProjectRuntimeInfo({
      projectId: runtime.projectId,
      source: inferProjectRuntimeSource(runtime),
      status: query.isPending ? 'checking' : errorState?.status ?? 'unknown',
      summary: query.isPending ? 'Checking project runtime health.' : errorState?.summary ?? 'Project runtime health check failed.',
    })

    return {
      info,
      isChecking: query.isFetching,
      error,
      refetch: query.refetch,
    }
  }, [query.data, query.error, query.isFetching, query.isPending, query.refetch, runtime])
}

function inferProjectRuntimeSource(runtime: { persistence?: unknown }): ProjectRuntimeSource {
  return runtime.persistence ? 'mock' : 'api'
}

function createFallbackProjectRuntimeInfo({
  projectId,
  source,
  status,
  summary,
}: {
  projectId: string
  source: ProjectRuntimeSource
  status: ProjectRuntimeHealthStatus
  summary: string
}) {
  return createProjectRuntimeInfoRecord({
    projectId,
    projectTitle: projectId,
    source,
    status,
    summary,
  })
}

function classifyProjectRuntimeHealthError(error: unknown): ProjectRuntimeHealthErrorState {
  if (error instanceof ApiRequestError) {
    if (isMalformedProjectRuntimeResponseError(error)) {
      return {
        status: 'unavailable',
        summary: 'Project runtime returned malformed JSON.',
      }
    }

    if (error.status === 401) {
      return {
        status: 'unauthorized',
        summary: 'Project runtime authentication is required.',
      }
    }

    if (error.status === 403) {
      return {
        status: 'forbidden',
        summary: 'Project runtime access is forbidden.',
      }
    }

    if (error.status === 404) {
      return {
        status: 'not_found',
        summary: 'Project runtime was not found.',
      }
    }

    if (error.status >= 500) {
      return {
        status: 'unavailable',
        summary: 'Project runtime is unavailable.',
      }
    }

    return {
      status: 'unknown',
      summary: 'Project runtime health check failed.',
    }
  }

  if (error instanceof Error) {
    return {
      status: 'unavailable',
      summary: 'Project runtime is unavailable.',
    }
  }

  return {
    status: 'unknown',
    summary: 'Project runtime health check failed.',
  }
}

function isMalformedProjectRuntimeResponseError(error: ApiRequestError) {
  return error.message === 'Malformed JSON response'
}
