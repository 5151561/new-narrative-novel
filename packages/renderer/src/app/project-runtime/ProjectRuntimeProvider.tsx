import { createContext, useContext, useMemo, type PropsWithChildren } from 'react'

import { createApiProjectRuntime } from './api-project-runtime'
import { createApiTransport } from './api-transport'
import type { ProjectRuntime } from './project-runtime'
import { createMockProjectRuntime } from './mock-project-runtime'

const ProjectRuntimeContext = createContext<ProjectRuntime | null>(null)

export function createDefaultProjectRuntime() {
  const apiBaseUrl = import.meta.env.VITE_NARRATIVE_API_BASE_URL
  if (apiBaseUrl) {
    return createApiProjectRuntime({
      projectId: import.meta.env.VITE_NARRATIVE_PROJECT_ID ?? 'book-signal-arc',
      transport: createApiTransport({
        baseUrl: apiBaseUrl,
      }),
    })
  }

  return createMockProjectRuntime()
}

export function ProjectRuntimeProvider({
  runtime,
  children,
}: PropsWithChildren<{ runtime?: ProjectRuntime }>) {
  const resolvedRuntime = useMemo(() => runtime ?? createDefaultProjectRuntime(), [runtime])

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
