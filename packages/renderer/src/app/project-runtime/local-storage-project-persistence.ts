import type { ProjectPersistedSnapshotV1, ProjectPersistencePort } from './project-persistence'

interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

function getProjectPersistenceStorageKey(projectId: string) {
  return `narrative-novel.project.${projectId}.v1`
}

function createMemoryStorage(): StorageLike {
  const records = new Map<string, string>()

  return {
    getItem(key) {
      return records.get(key) ?? null
    },
    setItem(key, value) {
      records.set(key, value)
    },
    removeItem(key) {
      records.delete(key)
    },
  }
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPersistedSnapshotV1(value: unknown): value is ProjectPersistedSnapshotV1 {
  if (!isObjectRecord(value)) {
    return false
  }

  const candidate = value as Partial<ProjectPersistedSnapshotV1>
  return (
    candidate.schemaVersion === 1 &&
    typeof candidate.projectId === 'string' &&
    typeof candidate.updatedAt === 'string' &&
    isObjectRecord(candidate.reviewDecisionsByBookId) &&
    isObjectRecord(candidate.reviewFixActionsByBookId) &&
    isObjectRecord(candidate.bookExportArtifactsByBookId) &&
    isObjectRecord(candidate.chapterRecordsById)
  )
}

export function createLocalStorageProjectPersistence(): ProjectPersistencePort {
  const memoryStorage = createMemoryStorage()

  function resolveStorage(): StorageLike {
    if (typeof window === 'undefined') {
      return memoryStorage
    }

    return window.localStorage
  }

  return {
    async loadProjectSnapshot(projectId) {
      let rawSnapshot: string | null
      try {
        rawSnapshot = resolveStorage().getItem(getProjectPersistenceStorageKey(projectId))
      } catch {
        return null
      }

      if (!rawSnapshot) {
        return null
      }

      try {
        const parsedSnapshot = JSON.parse(rawSnapshot) as unknown
        return isPersistedSnapshotV1(parsedSnapshot) ? parsedSnapshot : null
      } catch {
        return null
      }
    },
    async saveProjectSnapshot(projectId, snapshot) {
      try {
        resolveStorage().setItem(getProjectPersistenceStorageKey(projectId), JSON.stringify(snapshot))
      } catch (error) {
        throw new Error(`Failed to save project snapshot for "${projectId}"`, {
          cause: error,
        })
      }
    },
    async clearProjectSnapshot(projectId) {
      try {
        resolveStorage().removeItem(getProjectPersistenceStorageKey(projectId))
      } catch {
        return
      }
    },
  }
}
