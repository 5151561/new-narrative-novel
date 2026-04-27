import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { dialog, type OpenDialogReturnValue } from 'electron'

export interface SelectedProjectSession {
  projectId: string
  projectRoot: string
  projectTitle: string
}

interface NarrativeProjectFileRecord {
  bootstrap?: {
    source?: unknown
  }
  createdAt?: unknown
  projectId?: unknown
  schemaVersion?: unknown
  store?: {
    artifactDir?: unknown
    dataFile?: unknown
    schemaVersion?: unknown
  }
  title?: unknown
  updatedAt?: unknown
}

export interface ReadProjectSessionOptions {
  createProjectId?: () => string
  now?: () => string
}

export interface ProjectDirectoryDialog {
  showOpenDialog(options: {
    title: string
    properties: Array<'openDirectory' | 'createDirectory'>
  }): Promise<OpenDialogReturnValue>
}

const NARRATIVE_PROJECT_FILE = 'narrative.project.json'
const DEFAULT_SCHEMA_VERSION = 1
const DEFAULT_BOOTSTRAP_SOURCE = 'signal-arc-demo-template-v1'
const DEFAULT_STORE_DATA_FILE = '.narrative/project-store.json'
const DEFAULT_STORE_ARTIFACT_DIR = '.narrative/artifacts'

function normalizeProjectTitle(projectRoot: string, value: unknown) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }

  return path.basename(projectRoot)
}

function normalizeProjectId(value: unknown, createProjectId: () => string) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }

  return createProjectId()
}

function normalizeTimestamp(value: unknown, fallback: () => string) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }

  return fallback()
}

function hasStoreMetadata(record: NarrativeProjectFileRecord | null) {
  return (
    record?.store?.schemaVersion === DEFAULT_SCHEMA_VERSION
    && record.store.dataFile === DEFAULT_STORE_DATA_FILE
    && record.store.artifactDir === DEFAULT_STORE_ARTIFACT_DIR
  )
}

function hasBootstrapMetadata(record: NarrativeProjectFileRecord | null) {
  return record?.bootstrap?.source === DEFAULT_BOOTSTRAP_SOURCE
}

export async function readOrInitializeProjectSession(
  projectRoot: string,
  {
    createProjectId = () => `local-project-${randomUUID()}`,
    now = () => new Date().toISOString(),
  }: ReadProjectSessionOptions = {},
): Promise<SelectedProjectSession> {
  const projectFilePath = path.join(projectRoot, NARRATIVE_PROJECT_FILE)
  let existingRecord: NarrativeProjectFileRecord | null = null

  try {
    existingRecord = JSON.parse(await readFile(projectFilePath, 'utf8')) as NarrativeProjectFileRecord
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
  }

  await mkdir(path.join(projectRoot, '.narrative', 'artifacts'), { recursive: true })

  const timestampNow = now()
  const projectId = normalizeProjectId(existingRecord?.projectId, createProjectId)
  const title = normalizeProjectTitle(projectRoot, existingRecord?.title)
  const createdAt = normalizeTimestamp(existingRecord?.createdAt, () => timestampNow)
  const needsWrite = (
    !existingRecord
    || existingRecord.schemaVersion !== DEFAULT_SCHEMA_VERSION
    || typeof existingRecord.projectId !== 'string'
    || !existingRecord.projectId.trim()
    || typeof existingRecord.title !== 'string'
    || !existingRecord.title.trim()
    || typeof existingRecord.createdAt !== 'string'
    || !existingRecord.createdAt.trim()
    || typeof existingRecord.updatedAt !== 'string'
    || !existingRecord.updatedAt.trim()
    || !hasStoreMetadata(existingRecord)
    || !hasBootstrapMetadata(existingRecord)
  )

  const normalizedRecord = {
    bootstrap: {
      source: DEFAULT_BOOTSTRAP_SOURCE,
    },
    createdAt,
    projectId,
    schemaVersion: DEFAULT_SCHEMA_VERSION,
    store: {
      artifactDir: DEFAULT_STORE_ARTIFACT_DIR,
      dataFile: DEFAULT_STORE_DATA_FILE,
      schemaVersion: DEFAULT_SCHEMA_VERSION,
    },
    title,
    updatedAt: needsWrite
      ? timestampNow
      : normalizeTimestamp(existingRecord?.updatedAt, () => timestampNow),
  }

  if (needsWrite) {
    await writeFile(projectFilePath, `${JSON.stringify(normalizedRecord, null, 2)}\n`, 'utf8')
  }

  return {
    projectId,
    projectRoot,
    projectTitle: title,
  }
}

export async function openProjectWithDialog({
  dialog: dialogApi = {
    showOpenDialog: (options) => dialog.showOpenDialog(options),
  },
}: {
  dialog?: ProjectDirectoryDialog
} = {}): Promise<SelectedProjectSession | null> {
  const result = await dialogApi.showOpenDialog({
    properties: ['openDirectory', 'createDirectory'],
    title: 'Open Project',
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  return readOrInitializeProjectSession(result.filePaths[0]!)
}
