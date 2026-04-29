import { randomUUID } from 'node:crypto'
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { OpenDialogReturnValue } from 'electron'

export interface SelectedProjectSession {
  projectId: string
  projectMode: 'demo-fixture' | 'real-project'
  runtimeKind: 'fixture-demo' | 'real-local-project'
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
  bootstrapSource?: string
  createProjectId?: () => string
  now?: () => string
}

export interface ProjectDirectoryDialog {
  showOpenDialog(options: {
    title: string
    properties: Array<'openDirectory' | 'createDirectory'>
  }): Promise<OpenDialogReturnValue>
}

interface ChooseProjectWithDialogOptions {
  dialog?: ProjectDirectoryDialog
  readProjectSession?: (projectRoot: string) => Promise<SelectedProjectSession>
}

const NARRATIVE_PROJECT_FILE = 'narrative.project.json'
const DEFAULT_SCHEMA_VERSION = 1
const DEFAULT_BOOTSTRAP_SOURCE = 'real-project-template-v1'
const DEMO_BOOTSTRAP_SOURCE = 'signal-arc-demo-template-v1'
const DEFAULT_STORE_DATA_FILE = '.narrative/project-store.json'
const DEFAULT_STORE_ARTIFACT_DIR = '.narrative/artifacts'

async function showNativeDirectoryDialog(options: {
  title: string
  properties: Array<'openDirectory' | 'createDirectory'>
}): Promise<OpenDialogReturnValue> {
  const { dialog } = await import('electron')
  return dialog.showOpenDialog(options)
}

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
  return typeof record?.bootstrap?.source === 'string' && record.bootstrap.source.trim().length > 0
}

function getProjectFilePath(projectRoot: string) {
  return path.join(projectRoot, NARRATIVE_PROJECT_FILE)
}

function assertSupportedManifestSchema(record: NarrativeProjectFileRecord | null) {
  if (
    typeof record?.schemaVersion === 'number'
    && Number.isFinite(record.schemaVersion)
    && record.schemaVersion > DEFAULT_SCHEMA_VERSION
  ) {
    throw new Error(`Unsupported narrative project schemaVersion: ${record.schemaVersion}`)
  }
}

async function readProjectFileRecord(projectRoot: string): Promise<NarrativeProjectFileRecord | null> {
  try {
    return JSON.parse(await readFile(getProjectFilePath(projectRoot), 'utf8')) as NarrativeProjectFileRecord
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
  }

  return null
}

export async function readOrInitializeProjectSession(
  projectRoot: string,
  {
    bootstrapSource = DEFAULT_BOOTSTRAP_SOURCE,
    createProjectId = () => `local-project-${randomUUID()}`,
    now = () => new Date().toISOString(),
  }: ReadProjectSessionOptions = {},
): Promise<SelectedProjectSession> {
  const projectFilePath = getProjectFilePath(projectRoot)
  const existingRecord = await readProjectFileRecord(projectRoot)
  assertSupportedManifestSchema(existingRecord)

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
      source: bootstrapSource,
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
    projectMode: 'real-project',
    runtimeKind: 'real-local-project',
    projectRoot,
    projectTitle: title,
  }
}

export async function readExistingProjectSession(
  projectRoot: string,
  options: ReadProjectSessionOptions = {},
): Promise<SelectedProjectSession> {
  await access(projectRoot).catch(() => {
    throw new Error(`Narrative project root does not exist: ${projectRoot}`)
  })

  const existingRecord = await readProjectFileRecord(projectRoot)
  if (!existingRecord) {
    throw new Error(`Narrative project manifest does not exist: ${getProjectFilePath(projectRoot)}`)
  }

  assertSupportedManifestSchema(existingRecord)
  return readOrInitializeProjectSession(projectRoot, options)
}

export async function openProjectWithDialog({
  dialog: dialogApi = {
    showOpenDialog: showNativeDirectoryDialog,
  },
  readProjectSession = readOrInitializeProjectSession,
}: ChooseProjectWithDialogOptions = {}): Promise<SelectedProjectSession | null> {
  return chooseProjectWithDialog({
    dialog: dialogApi,
    readProjectSession,
    title: 'Open Project',
  })
}

export async function createProjectWithDialog({
  dialog: dialogApi = {
    showOpenDialog: showNativeDirectoryDialog,
  },
  readProjectSession = readOrInitializeProjectSession,
}: ChooseProjectWithDialogOptions = {}): Promise<SelectedProjectSession | null> {
  return chooseProjectWithDialog({
    dialog: dialogApi,
    readProjectSession,
    title: 'Create Project',
  })
}

async function chooseProjectWithDialog({
  dialog: dialogApi,
  readProjectSession,
  title,
}: {
  dialog: ProjectDirectoryDialog
  readProjectSession: (projectRoot: string) => Promise<SelectedProjectSession>
  title: string
}): Promise<SelectedProjectSession | null> {
  const result = await dialogApi.showOpenDialog({
    properties: ['openDirectory', 'createDirectory'],
    title,
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  return readProjectSession(result.filePaths[0]!)
}
