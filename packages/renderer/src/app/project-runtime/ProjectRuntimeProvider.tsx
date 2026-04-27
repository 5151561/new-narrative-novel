import { createContext, useContext, useMemo, type PropsWithChildren } from 'react'

import { createApiProjectRuntime } from './api-project-runtime'
import { createApiTransport } from './api-transport'
import type { ProjectRuntime } from './project-runtime'
import { createMockProjectRuntime } from './mock-project-runtime'
import { createWebRuntimeConfig, type RuntimeConfig } from '@/app/runtime'

const ProjectRuntimeContext = createContext<ProjectRuntime | null>(null)

export function createDefaultProjectRuntime(runtimeConfig: RuntimeConfig = createWebRuntimeConfig()) {
  const apiBaseUrl = import.meta.env.VITE_NARRATIVE_API_BASE_URL
  if (runtimeConfig.runtimeMode === 'desktop-local' || apiBaseUrl) {
    const projectId =
      runtimeConfig.runtimeMode === 'desktop-local'
        ? runtimeConfig.projectId
        : import.meta.env.VITE_NARRATIVE_PROJECT_ID ?? 'book-signal-arc'
    const runtime = createApiProjectRuntime({
      projectId,
      transport: createApiTransport({
        baseUrl: runtimeConfig.runtimeMode === 'desktop-local' ? runtimeConfig.apiBaseUrl : apiBaseUrl,
      }),
    })

    if (runtimeConfig.runtimeMode === 'desktop-local') {
      return {
        ...runtime,
        projectTitle: runtimeConfig.projectTitle ?? runtimeConfig.projectId,
      }
    }

    return runtime
  }

  return createMockProjectRuntime()
}

export function ProjectRuntimeProvider({
  runtime,
  runtimeConfig,
  children,
}: PropsWithChildren<{ runtime?: ProjectRuntime; runtimeConfig?: RuntimeConfig }>) {
  const resolvedRuntime = useMemo(() => runtime ?? createDefaultProjectRuntime(runtimeConfig), [runtime, runtimeConfig])

  return <ProjectRuntimeContext.Provider value={resolvedRuntime}>{children}</ProjectRuntimeContext.Provider>
}

export function useProjectRuntime() {
  const runtime = useContext(ProjectRuntimeContext)
  if (!runtime) {
    throw new Error('useProjectRuntime must be used within ProjectRuntimeProvider')
  }

  return runtime
}

export function useOptionalProjectRuntime() {
  return useContext(ProjectRuntimeContext)
}

export function resolveProjectRuntimeDependency<T>(
  provided: T | undefined,
  runtimeValue: T | undefined,
  owner: string,
  dependency: string,
) {
  const resolved = provided ?? runtimeValue
  if (!resolved) {
    throw new Error(`${owner} requires ProjectRuntimeProvider or ${dependency}.`)
  }

  return resolved
}
