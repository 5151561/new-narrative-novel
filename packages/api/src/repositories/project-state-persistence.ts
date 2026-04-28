import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { FixtureProjectData } from '../contracts/api-records.js'

import { createSignalArcProjectTemplate } from './fixture-data.js'
import { createProjectBackup } from './project-backup.js'

export const LOCAL_PROJECT_STORE_SCHEMA_VERSION = 1 as const
export const LOCAL_PROJECT_STORE_KIND = 'narrative-local-project-store' as const
export const LOCAL_PROJECT_STORE_TEMPLATE_VERSION = 'local-project-store-v1' as const

type JsonPrimitive = string | number | boolean | null
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }
export interface PersistedRunStore {
  runStates: JsonValue[]
  sceneSequences: Record<string, number>
}

export interface LocalProjectStoreRecord {
  schemaVersion: typeof LOCAL_PROJECT_STORE_SCHEMA_VERSION
  storeKind: typeof LOCAL_PROJECT_STORE_KIND
  templateVersion: typeof LOCAL_PROJECT_STORE_TEMPLATE_VERSION
  project: {
    projectId: string
    projectTitle: string
    createdAt: string
    updatedAt: string
    data: FixtureProjectData
  }
  runStore?: PersistedRunStore
}

interface LocalProjectStoreFileSystem {
  mkdir: typeof mkdir
  readFile: typeof readFile
  rename: typeof rename
  writeFile: typeof writeFile
}

interface CreateLocalProjectStorePersistenceOptions {
  filePath: string
  artifactDirPath: string
  apiBaseUrl: string
  projectId: string
  projectTitle: string
  runtimeSummary?: string
  versionLabel?: string
  now?: () => string
  createBackup?: typeof createProjectBackup
  fileSystem?: LocalProjectStoreFileSystem
}

interface LegacyProjectStateEnvelope {
  schemaVersion: number
  seedVersion: string
  projects: Record<string, {
    updatedAt: string
    reviewDecisions?: Record<string, unknown>
    reviewFixActions?: Record<string, unknown>
    exportArtifacts?: Record<string, unknown>
    chapters?: Record<string, unknown>
    scenes?: Record<string, unknown>
    runStore?: unknown
  }>
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

function toJsonClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function isFixtureProjectData(value: unknown): value is FixtureProjectData {
  if (!isRecord(value) || !isRecord(value.runtimeInfo)) {
    return false
  }

  const runtimeInfo = value.runtimeInfo
  if (
    typeof runtimeInfo.projectId !== 'string'
    || typeof runtimeInfo.projectTitle !== 'string'
    || typeof runtimeInfo.runtimeKind !== 'string'
    || typeof runtimeInfo.source !== 'string'
    || typeof runtimeInfo.status !== 'string'
    || typeof runtimeInfo.summary !== 'string'
    || !isRecord(runtimeInfo.capabilities)
  ) {
    return false
  }

  const recordFields = [
    'books',
    'manuscriptCheckpoints',
    'exportProfiles',
    'exportArtifacts',
    'experimentBranches',
    'chapters',
    'assets',
    'reviewDecisions',
    'reviewFixActions',
    'scenes',
  ] as const

  return recordFields.every((field) => isRecord(value[field]))
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
    runStates: toJsonClone(value.runStates),
    sceneSequences,
  }
}

function invalidLocalProjectStoreError(filePath: string) {
  return new Error(`Local project store is invalid: ${filePath}`)
}

function unsupportedLocalProjectStoreSchemaVersionError() {
  return new Error('Unsupported local project store schemaVersion')
}

function sanitizeLocalProjectStoreRecord(
  value: unknown,
  options: Pick<CreateLocalProjectStorePersistenceOptions, 'filePath' | 'projectId'>,
): LocalProjectStoreRecord {
  if (!isRecord(value)) {
    throw invalidLocalProjectStoreError(options.filePath)
  }

  if (value.schemaVersion !== LOCAL_PROJECT_STORE_SCHEMA_VERSION) {
    throw unsupportedLocalProjectStoreSchemaVersionError()
  }

  if (value.storeKind !== LOCAL_PROJECT_STORE_KIND) {
    throw new Error('Unsupported local project store kind')
  }

  if (
    value.templateVersion !== LOCAL_PROJECT_STORE_TEMPLATE_VERSION
    || !isRecord(value.project)
    || typeof value.project.projectId !== 'string'
    || typeof value.project.projectTitle !== 'string'
    || typeof value.project.createdAt !== 'string'
    || typeof value.project.updatedAt !== 'string'
    || !isFixtureProjectData(value.project.data)
  ) {
    throw invalidLocalProjectStoreError(options.filePath)
  }

  if (value.project.projectId !== options.projectId) {
    throw new Error(
      `Local project store projectId mismatch: expected ${options.projectId} but found ${value.project.projectId}`,
    )
  }

  if (value.project.data.runtimeInfo.projectId !== value.project.projectId) {
    throw invalidLocalProjectStoreError(options.filePath)
  }

  const runStore = 'runStore' in value
    ? sanitizeRunStore(value.runStore)
    : undefined
  if ('runStore' in value && !runStore) {
    throw invalidLocalProjectStoreError(options.filePath)
  }

  return {
    schemaVersion: LOCAL_PROJECT_STORE_SCHEMA_VERSION,
    storeKind: LOCAL_PROJECT_STORE_KIND,
    templateVersion: LOCAL_PROJECT_STORE_TEMPLATE_VERSION,
    project: {
      projectId: value.project.projectId,
      projectTitle: value.project.projectTitle,
      createdAt: value.project.createdAt,
      updatedAt: value.project.updatedAt,
      data: toJsonClone(value.project.data),
    },
    runStore,
  }
}

async function writeLocalProjectStoreRecord(
  filePath: string,
  artifactDirPath: string,
  record: LocalProjectStoreRecord,
  fileSystem: LocalProjectStoreFileSystem,
) {
  await fileSystem.mkdir(path.dirname(filePath), { recursive: true })
  await fileSystem.mkdir(artifactDirPath, { recursive: true })

  const tempFilePath = path.join(
    path.dirname(filePath),
    `${path.basename(filePath)}.${randomUUID()}.tmp`,
  )
  await fileSystem.writeFile(tempFilePath, `${JSON.stringify(record, null, 2)}\n`, 'utf8')
  await fileSystem.rename(tempFilePath, filePath)
}

function createTemplateRecord(
  options: Pick<
    CreateLocalProjectStorePersistenceOptions,
    'apiBaseUrl' | 'projectId' | 'projectTitle' | 'runtimeSummary' | 'versionLabel' | 'now'
  >,
): LocalProjectStoreRecord {
  const now = options.now ? options.now() : new Date().toISOString()

  return {
    schemaVersion: LOCAL_PROJECT_STORE_SCHEMA_VERSION,
    storeKind: LOCAL_PROJECT_STORE_KIND,
    templateVersion: LOCAL_PROJECT_STORE_TEMPLATE_VERSION,
    project: {
      projectId: options.projectId,
      projectTitle: options.projectTitle,
      createdAt: now,
      updatedAt: now,
      data: createSignalArcProjectTemplate({
        projectId: options.projectId,
        projectTitle: options.projectTitle,
        apiBaseUrl: options.apiBaseUrl,
        runtimeSummary: options.runtimeSummary,
        versionLabel: options.versionLabel,
        includeSeedRunReferences: false,
      }),
    },
  }
}

function isLegacyProjectStateEnvelope(value: unknown): value is {
  schemaVersion: unknown
  seedVersion: unknown
  projects: unknown
} {
  return (
    isRecord(value)
    && 'schemaVersion' in value
    && 'seedVersion' in value
    && 'projects' in value
  )
}

function sanitizeLegacyProjectStateEnvelope(
  value: unknown,
  options: Pick<CreateLocalProjectStorePersistenceOptions, 'filePath' | 'projectId' | 'projectTitle' | 'apiBaseUrl' | 'runtimeSummary' | 'versionLabel' | 'now'>,
): LocalProjectStoreRecord {
  if (!isLegacyProjectStateEnvelope(value)) {
    throw invalidLocalProjectStoreError(options.filePath)
  }

  if (value.schemaVersion !== 1) {
    throw unsupportedLocalProjectStoreSchemaVersionError()
  }

  if (typeof value.seedVersion !== 'string' || !isRecord(value.projects)) {
    throw invalidLocalProjectStoreError(options.filePath)
  }

  const legacyProject = value.projects[options.projectId]
  if (!isRecord(legacyProject) || typeof legacyProject.updatedAt !== 'string') {
    throw invalidLocalProjectStoreError(options.filePath)
  }

  const migratedRecord = createTemplateRecord(options)
  migratedRecord.project.updatedAt = legacyProject.updatedAt

  if (legacyProject.reviewDecisions && isRecord(legacyProject.reviewDecisions)) {
    migratedRecord.project.data.reviewDecisions = toJsonClone(
      legacyProject.reviewDecisions as unknown as FixtureProjectData['reviewDecisions'],
    )
  }
  if (legacyProject.reviewFixActions && isRecord(legacyProject.reviewFixActions)) {
    migratedRecord.project.data.reviewFixActions = toJsonClone(
      legacyProject.reviewFixActions as unknown as FixtureProjectData['reviewFixActions'],
    )
  }
  if (legacyProject.exportArtifacts && isRecord(legacyProject.exportArtifacts)) {
    migratedRecord.project.data.exportArtifacts = toJsonClone(
      legacyProject.exportArtifacts as unknown as FixtureProjectData['exportArtifacts'],
    )
  }
  if (legacyProject.chapters && isRecord(legacyProject.chapters)) {
    migratedRecord.project.data.chapters = toJsonClone(
      legacyProject.chapters as unknown as FixtureProjectData['chapters'],
    )
  }
  if (legacyProject.scenes && isRecord(legacyProject.scenes)) {
    migratedRecord.project.data.scenes = toJsonClone(
      legacyProject.scenes as unknown as FixtureProjectData['scenes'],
    )
  }
  if ('runStore' in legacyProject) {
    const runStore = sanitizeRunStore(legacyProject.runStore)
    if (!runStore) {
      throw invalidLocalProjectStoreError(options.filePath)
    }

    migratedRecord.runStore = runStore
  }

  return migratedRecord
}

export function resolveDefaultProjectStoreFilePath() {
  return fileURLToPath(new URL('../../../../.narrative/local-project-store.json', import.meta.url))
}

export function resolveDefaultProjectStateFilePath() {
  return resolveDefaultProjectStoreFilePath()
}

const defaultFileSystem: LocalProjectStoreFileSystem = {
  mkdir,
  readFile,
  rename,
  writeFile,
}

export function createLocalProjectStorePersistence(options: CreateLocalProjectStorePersistenceOptions) {
  const fileSystem = options.fileSystem ?? defaultFileSystem
  const createBackup = options.createBackup ?? createProjectBackup

  async function readExistingRecord() {
    try {
      const fileContents = await fileSystem.readFile(options.filePath, 'utf8')
      const parsed = JSON.parse(fileContents) as unknown

      if (isLegacyProjectStateEnvelope(parsed)) {
        const migratedRecord = sanitizeLegacyProjectStateEnvelope(parsed, options)
        await createBackup({
          now: options.now,
          projectRoot: path.dirname(path.dirname(options.filePath)),
          storeFilePath: options.filePath,
        })
        return writeRecord(migratedRecord)
      }

      return sanitizeLocalProjectStoreRecord(parsed, options)
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException
      if (nodeError.code === 'ENOENT') {
        return undefined
      }

      if (error instanceof SyntaxError) {
        throw invalidLocalProjectStoreError(options.filePath)
      }

      throw error
    }
  }

  async function writeRecord(record: LocalProjectStoreRecord) {
    await writeLocalProjectStoreRecord(
      options.filePath,
      options.artifactDirPath,
      record,
      fileSystem,
    )
    return toJsonClone(record)
  }

  return {
    async load(): Promise<LocalProjectStoreRecord> {
      const existing = await readExistingRecord()
      if (existing) {
        return existing
      }

      const template = createTemplateRecord(options)
      return writeRecord(template)
    },
    async save(input: {
      data: FixtureProjectData
      runStore?: PersistedRunStore
    }): Promise<LocalProjectStoreRecord> {
      const current = await this.load()
      const nextRunStore = input.runStore ? sanitizeRunStore(input.runStore) : undefined
      if (input.runStore && !nextRunStore) {
        throw invalidLocalProjectStoreError(options.filePath)
      }

      const nextRecord: LocalProjectStoreRecord = {
        ...current,
        project: {
          ...current.project,
          projectTitle: options.projectTitle,
          updatedAt: new Date().toISOString(),
          data: toJsonClone(input.data),
        },
        runStore: nextRunStore ? toJsonClone(nextRunStore) : undefined,
      }

      if (nextRecord.project.data.runtimeInfo.projectId !== options.projectId) {
        throw new Error(
          `Local project store projectId mismatch: expected ${options.projectId} but found ${nextRecord.project.data.runtimeInfo.projectId}`,
        )
      }

      nextRecord.project.data.runtimeInfo.projectTitle = options.projectTitle
      return writeRecord(nextRecord)
    },
    async reset(): Promise<LocalProjectStoreRecord> {
      const template = createTemplateRecord(options)
      return writeRecord(template)
    },
  }
}
