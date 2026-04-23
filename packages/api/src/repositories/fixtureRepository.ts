import type { FixtureDataSnapshot, ProjectRuntimeInfoRecord } from '../contracts/api-records.js'
import { notFound } from '../http/errors.js'

import { createFixtureDataSnapshot } from './fixture-data.js'

function clone<T>(value: T): T {
  return structuredClone(value)
}

export interface FixtureRepository {
  getProjectRuntimeInfo(projectId: string): ProjectRuntimeInfoRecord
  exportSnapshot(): FixtureDataSnapshot
  reset(): void
}

export function createFixtureRepository(options: { apiBaseUrl: string }): FixtureRepository {
  let snapshot = createFixtureDataSnapshot(options.apiBaseUrl)

  function getProject(projectId: string) {
    const project = snapshot.projects[projectId]
    if (!project) {
      throw notFound(`Project ${projectId} was not found.`, {
        code: 'PROJECT_NOT_FOUND',
        detail: { projectId },
      })
    }
    return project
  }

  return {
    getProjectRuntimeInfo(projectId: string) {
      return clone(getProject(projectId).runtimeInfo)
    },
    exportSnapshot() {
      return clone(snapshot)
    },
    reset() {
      snapshot = createFixtureDataSnapshot(options.apiBaseUrl)
    },
  }
}
