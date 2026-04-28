import { createContext, useContext, useMemo, type PropsWithChildren } from 'react'

import { createApiProjectRuntime } from './api-project-runtime'
import { createApiTransport } from './api-transport'
import type { ProjectRuntime } from './project-runtime'
import { createMockProjectRuntime } from './mock-project-runtime'
import { createWebRuntimeConfig, type RuntimeConfig, type RuntimeKind } from '@/app/runtime'

const ProjectRuntimeContext = createContext<ProjectRuntime | null>(null)
const fixtureDemoProjectIds = new Set([
  'book-signal-arc',
  'project-artifact-a',
  'project-artifact-b',
])

type TaggedProjectRuntime = ProjectRuntime & {
  runtimeKind: RuntimeKind
}

function assignProjectRuntimeKind<T extends ProjectRuntime>(runtime: T, runtimeKind: RuntimeKind): T & TaggedProjectRuntime {
  return Object.assign(runtime, { runtimeKind })
}

export function getProjectRuntimeKind(runtime: ProjectRuntime): RuntimeKind {
  const runtimeKind = (runtime as Partial<TaggedProjectRuntime>).runtimeKind
  if (runtimeKind === 'fixture-demo' || runtimeKind === 'mock-storybook' || runtimeKind === 'real-local-project') {
    return runtimeKind
  }

  if (runtime.persistence) {
    return 'mock-storybook'
  }

  if (runtime.projectTitle && runtime.projectTitle !== runtime.projectId) {
    return 'real-local-project'
  }

  if (fixtureDemoProjectIds.has(runtime.projectId)) {
    return 'fixture-demo'
  }

  return 'fixture-demo'
}

export function createDefaultProjectRuntime(runtimeConfig: RuntimeConfig = createWebRuntimeConfig()) {
  const apiBaseUrl = import.meta.env.VITE_NARRATIVE_API_BASE_URL
  if (runtimeConfig.runtimeMode === 'desktop-local') {
    const runtime = createApiProjectRuntime({
      projectId: runtimeConfig.projectId,
      transport: createApiTransport({
        baseUrl: runtimeConfig.apiBaseUrl,
      }),
    })

    return assignProjectRuntimeKind({
      ...runtime,
      projectTitle: runtimeConfig.projectTitle ?? runtimeConfig.projectId,
    }, 'real-local-project')
  }

  if (apiBaseUrl) {
    const projectId =
      import.meta.env.VITE_NARRATIVE_PROJECT_ID ?? 'book-signal-arc'
    return assignProjectRuntimeKind(createApiProjectRuntime({
      projectId,
      transport: createApiTransport({
        baseUrl: apiBaseUrl,
      }),
    }), 'fixture-demo')
  }

  return assignProjectRuntimeKind(createMockProjectRuntime(), 'mock-storybook')
}

export function ProjectRuntimeProvider({
  runtime,
  runtimeConfig,
  children,
}: PropsWithChildren<{ runtime?: ProjectRuntime; runtimeConfig?: RuntimeConfig }>) {
  const resolvedRuntime = useMemo(() => {
    if (runtime) {
      return assignProjectRuntimeKind(runtime, getProjectRuntimeKind(runtime))
    }

    return createDefaultProjectRuntime(runtimeConfig)
  }, [runtime, runtimeConfig])

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
