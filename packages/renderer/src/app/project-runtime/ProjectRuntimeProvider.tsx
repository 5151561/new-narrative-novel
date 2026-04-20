import { createContext, useContext, useMemo, type PropsWithChildren } from 'react'

import type { ProjectRuntime } from './project-runtime'
import { createMockProjectRuntime } from './mock-project-runtime'

const ProjectRuntimeContext = createContext<ProjectRuntime | null>(null)

export function createDefaultProjectRuntime() {
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
