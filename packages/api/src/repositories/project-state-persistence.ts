import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'

export const PROJECT_STATE_SCHEMA_VERSION = 1 as const
export const PROJECT_STATE_SEED_VERSION = 'prototype-fixture-seed-v1' as const

type JsonPrimitive = string | number | boolean | null
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }
type JsonRecord = Record<string, JsonValue>

export interface PersistedRunStore {
  runStates: JsonValue[]
  sceneSequences: Record<string, number>
}

export interface PersistedProjectStateOverlay {
  updatedAt: string
  reviewDecisions?: JsonRecord
  reviewFixActions?: JsonRecord
  exportArtifacts?: JsonRecord
  chapters?: JsonRecord
  scenes?: JsonRecord
  runStore?: PersistedRunStore
}

export interface PersistedProjectStateEnvelope {
  schemaVersion: typeof PROJECT_STATE_SCHEMA_VERSION
  seedVersion: typeof PROJECT_STATE_SEED_VERSION
  projects: Record<string, PersistedProjectStateOverlay>
}

interface ProjectStateFileSystem {
  mkdir: typeof mkdir
  readFile: typeof readFile
  rename: typeof rename
  writeFile: typeof writeFile
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isJsonValue(value: unknown): value is JsonValue {
  if (
    value === null
    || typeof value === 'string'
    || typeof value === 'boolean'
  ) {
    return true
  }

  if (typeof value === 'number') {
    return Number.isFinite(value)
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue)
  }

  if (!isRecord(value)) {
    return false
  }

  return Object.values(value).every(isJsonValue)
}

function cloneJsonRecord(value: JsonRecord): JsonRecord {
  return structuredClone(value)
}

function sanitizeJsonRecord(value: unknown): JsonRecord | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const entries = Object.entries(value)
  if (!entries.every(([, entryValue]) => isJsonValue(entryValue))) {
    return undefined
  }

  return cloneJsonRecord(value as JsonRecord)
}

function sanitizeRunStore(value: unknown): PersistedRunStore | undefined {
  if (!isRecord(value) || !Array.isArray(value.runStates) || !isRecord(value.sceneSequences)) {
    return undefined
  }

  if (!value.runStates.every(isJsonValue)) {
    return undefined
  }

  const sceneSequences = {} as Record<string, number>
  for (const [sceneId, sequence] of Object.entries(value.sceneSequences)) {
    if (typeof sequence !== 'number' || !Number.isFinite(sequence)) {
      return undefined
    }

    sceneSequences[sceneId] = sequence
  }

  return {
    runStates: structuredClone(value.runStates),
    sceneSequences,
  }
}

function sanitizeProjectStateOverlay(value: unknown): PersistedProjectStateOverlay | undefined {
  if (!isRecord(value) || typeof value.updatedAt !== 'string') {
    return undefined
  }

  const overlay: PersistedProjectStateOverlay = {
    updatedAt: value.updatedAt,
  }

  const jsonRecordFields = ['reviewDecisions', 'reviewFixActions', 'exportArtifacts', 'chapters', 'scenes'] as const
  for (const field of jsonRecordFields) {
    if (!(field in value)) {
      continue
    }

    const nextValue = sanitizeJsonRecord(value[field])
    if (!nextValue) {
      return undefined
    }

    overlay[field] = nextValue
  }

  if ('runStore' in value) {
    const runStore = sanitizeRunStore(value.runStore)
    if (!runStore) {
      return undefined
    }

    overlay.runStore = runStore
  }

  return overlay
}

function createEmptyEnvelope(): PersistedProjectStateEnvelope {
  return {
    schemaVersion: PROJECT_STATE_SCHEMA_VERSION,
    seedVersion: PROJECT_STATE_SEED_VERSION,
    projects: {},
  }
}

function sanitizeEnvelope(value: unknown): PersistedProjectStateEnvelope | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  if (value.schemaVersion !== PROJECT_STATE_SCHEMA_VERSION || value.seedVersion !== PROJECT_STATE_SEED_VERSION) {
    return undefined
  }

  if (!isRecord(value.projects)) {
    return undefined
  }

  const projects = {} as Record<string, PersistedProjectStateOverlay>
  for (const [projectId, projectValue] of Object.entries(value.projects)) {
    const overlay = sanitizeProjectStateOverlay(projectValue)
    if (!overlay) {
      return undefined
    }

    projects[projectId] = overlay
  }

  return {
    schemaVersion: PROJECT_STATE_SCHEMA_VERSION,
    seedVersion: PROJECT_STATE_SEED_VERSION,
    projects,
  }
}

async function readEnvelope(filePath: string, fileSystem: ProjectStateFileSystem) {
  try {
    const fileContents = await fileSystem.readFile(filePath, 'utf8')
    return sanitizeEnvelope(JSON.parse(fileContents))
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException
    if (nodeError.code === 'ENOENT' || error instanceof SyntaxError) {
      return undefined
    }

    throw error
  }
}

async function writeEnvelope(
  filePath: string,
  envelope: PersistedProjectStateEnvelope,
  fileSystem: ProjectStateFileSystem,
) {
  await fileSystem.mkdir(path.dirname(filePath), { recursive: true })
  const tempFilePath = path.join(
    path.dirname(filePath),
    `${path.basename(filePath)}.${randomUUID()}.tmp`,
  )
  await fileSystem.writeFile(tempFilePath, `${JSON.stringify(envelope, null, 2)}\n`, 'utf8')
  await fileSystem.rename(tempFilePath, filePath)
}

export function resolveDefaultProjectStateFilePath() {
  return fileURLToPath(new URL('../../../../.narrative/prototype-state.json', import.meta.url))
}

const defaultFileSystem: ProjectStateFileSystem = {
  mkdir,
  readFile,
  rename,
  writeFile,
}

export function createProjectStatePersistence(options: { filePath: string; fileSystem?: ProjectStateFileSystem }) {
  const fileSystem = options.fileSystem ?? defaultFileSystem

  return {
    async load(): Promise<PersistedProjectStateEnvelope> {
      return (await readEnvelope(options.filePath, fileSystem)) ?? createEmptyEnvelope()
    },
    async saveProjectOverlay(projectId: string, overlay: PersistedProjectStateOverlay) {
      const nextOverlay = sanitizeProjectStateOverlay(overlay)
      if (!nextOverlay) {
        throw new Error(`Persisted project overlay for ${projectId} is invalid.`)
      }

      const envelope = await this.load()
      envelope.projects[projectId] = nextOverlay
      await writeEnvelope(options.filePath, envelope, fileSystem)
    },
    async clearProjectOverlay(projectId: string) {
      const envelope = await this.load()
      delete envelope.projects[projectId]
      await writeEnvelope(options.filePath, envelope, fileSystem)
    },
  }
}
