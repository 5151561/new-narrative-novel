import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { dialog, type OpenDialogReturnValue } from 'electron'

export interface SelectedProjectSession {
  projectId: string
  projectRoot: string
  projectTitle: string
}

interface NarrativeProjectFileRecord {
  schemaVersion?: number
  projectId?: unknown
  title?: unknown
}

export interface ProjectDirectoryDialog {
  showOpenDialog(options: {
    title: string
    properties: Array<'openDirectory' | 'createDirectory'>
  }): Promise<OpenDialogReturnValue>
}

const NARRATIVE_PROJECT_FILE = 'narrative.project.json'
const DEFAULT_PROJECT_ID = 'book-signal-arc'
const DEFAULT_SCHEMA_VERSION = 1

function normalizeProjectTitle(projectRoot: string, value: unknown) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }

  return path.basename(projectRoot)
}

function normalizeProjectId(value: unknown) {
  return DEFAULT_PROJECT_ID
}

export async function readOrInitializeProjectSession(projectRoot: string): Promise<SelectedProjectSession> {
  const projectFilePath = path.join(projectRoot, NARRATIVE_PROJECT_FILE)
  let existingRecord: NarrativeProjectFileRecord | null = null

  try {
    existingRecord = JSON.parse(await readFile(projectFilePath, 'utf8')) as NarrativeProjectFileRecord
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
  }

  const normalizedRecord = {
    projectId: normalizeProjectId(existingRecord?.projectId),
    schemaVersion: DEFAULT_SCHEMA_VERSION,
    title: normalizeProjectTitle(projectRoot, existingRecord?.title),
  }

  if (
    !existingRecord
    || existingRecord.schemaVersion !== normalizedRecord.schemaVersion
    || existingRecord.projectId !== normalizedRecord.projectId
    || existingRecord.title !== normalizedRecord.title
  ) {
    await writeFile(projectFilePath, `${JSON.stringify(normalizedRecord, null, 2)}\n`, 'utf8')
  }

  return {
    projectId: normalizedRecord.projectId,
    projectRoot,
    projectTitle: normalizedRecord.title,
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
