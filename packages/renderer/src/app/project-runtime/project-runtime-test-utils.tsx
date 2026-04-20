import type { PropsWithChildren, ReactElement } from 'react'

import { QueryClient } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'

import { AppProviders } from '@/app/providers'
import { resetMockBookDb } from '@/features/book/api/mock-book-db'
import { resetMockBookExportArtifactDb } from '@/features/book/api/mock-book-export-artifact-db'
import { resetMockChapterDb } from '@/features/chapter/api/mock-chapter-db'
import { resetMockReviewDecisionDb } from '@/features/review/api/mock-review-decision-db'
import { resetMockReviewFixActionDb } from '@/features/review/api/mock-review-fix-action-db'

import { createMockProjectRuntime, type CreateMockProjectRuntimeOptions } from './mock-project-runtime'
import type { ProjectPersistedSnapshotV1, ProjectPersistencePort } from './project-persistence'
import type { ProjectRuntime } from './project-runtime'

function cloneSnapshot(snapshot: ProjectPersistedSnapshotV1 | null): ProjectPersistedSnapshotV1 | null {
  return snapshot ? structuredClone(snapshot) : null
}

// Test and Storybook helpers should stay off the browser-backed persistence path.
export function createMemoryProjectPersistence(
  initialSnapshot: ProjectPersistedSnapshotV1 | null = null,
): ProjectPersistencePort & {
  loadCalls: string[]
  saves: ProjectPersistedSnapshotV1[]
  getSnapshot: () => ProjectPersistedSnapshotV1 | null
} {
  let storedSnapshot = cloneSnapshot(initialSnapshot)
  const loadCalls: string[] = []
  const saves: ProjectPersistedSnapshotV1[] = []

  return {
    loadCalls,
    saves,
    getSnapshot() {
      return cloneSnapshot(storedSnapshot)
    },
    async loadProjectSnapshot(projectId) {
      loadCalls.push(projectId)
      return storedSnapshot?.projectId === projectId ? cloneSnapshot(storedSnapshot) : null
    },
    async saveProjectSnapshot(_projectId, snapshot) {
      const nextSnapshot = structuredClone(snapshot)
      storedSnapshot = nextSnapshot
      saves.push(nextSnapshot)
    },
    async clearProjectSnapshot(projectId) {
      if (storedSnapshot?.projectId === projectId) {
        storedSnapshot = null
      }
    },
  }
}

export function createTestProjectRuntime(options: CreateMockProjectRuntimeOptions = {}): ProjectRuntime {
  return createMockProjectRuntime({
    ...options,
    persistence: options.persistence ?? createMemoryProjectPersistence(),
  })
}

function createProjectRuntimeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

interface ProjectRuntimeRenderOptions {
  runtime?: ProjectRuntime
  queryClient?: QueryClient
}

export function createProjectRuntimeTestWrapper({
  runtime = createTestProjectRuntime(),
  queryClient = createProjectRuntimeQueryClient(),
}: ProjectRuntimeRenderOptions = {}) {
  return function ProjectRuntimeTestWrapper({ children }: PropsWithChildren) {
    return (
      <AppProviders runtime={runtime} queryClient={queryClient}>
        {children}
      </AppProviders>
    )
  }
}

export function renderWithProjectRuntime(
  ui: ReactElement,
  options: ProjectRuntimeRenderOptions & Omit<RenderOptions, 'wrapper'> = {},
) {
  const { runtime, queryClient, ...renderOptions } = options

  return render(ui, {
    wrapper: createProjectRuntimeTestWrapper({ runtime, queryClient }),
    ...renderOptions,
  })
}

export function resetProjectRuntimeMockState() {
  resetMockBookDb()
  resetMockBookExportArtifactDb()
  resetMockChapterDb()
  resetMockReviewDecisionDb()
  resetMockReviewFixActionDb()
}

export function createStoryProjectRuntimeEnvironment(options: CreateMockProjectRuntimeOptions = {}) {
  resetProjectRuntimeMockState()

  return {
    runtime: createTestProjectRuntime(options),
    queryClient: createProjectRuntimeQueryClient(),
  }
}
