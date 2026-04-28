import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isSensitiveArchiveKey(key: string) {
  const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '')
  return (
    normalized.includes('secret')
    || normalized.includes('token')
    || normalized.includes('apikey')
    || normalized.includes('credential')
    || normalized.includes('authorization')
  )
}

function sanitizeArchiveValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeArchiveValue(entry))
  }

  if (!isRecord(value)) {
    return value
  }

  const sanitizedEntries = Object.entries(value)
    .filter(([key]) => !isSensitiveArchiveKey(key))
    .map(([key, entry]) => [key, sanitizeArchiveValue(entry)] as const)

  return Object.fromEntries(sanitizedEntries)
}

function toFilenameTimestamp(value: string) {
  return value.replaceAll(':', '-').replaceAll('.', '-')
}

async function readOptionalText(filePath: string) {
  try {
    return await readFile(filePath, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }

    throw error
  }
}

async function writeJsonAtomically(filePath: string, value: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true })
  const tempFilePath = `${filePath}.tmp`

  await writeFile(tempFilePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  await rename(tempFilePath, filePath)
}

export async function createProjectBackup({
  projectRoot,
  storeFilePath,
  now = () => new Date().toISOString(),
}: {
  projectRoot: string
  storeFilePath: string
  now?: () => string
}) {
  const createdAt = now()
  const backupFilePath = path.join(
    projectRoot,
    '.narrative',
    'backups',
    `project-backup-${toFilenameTimestamp(createdAt)}.json`,
  )

  await writeJsonAtomically(backupFilePath, {
    createdAt,
    kind: 'narrative-project-backup',
    manifest: {
      content: await readOptionalText(path.join(projectRoot, 'narrative.project.json')),
      relativePath: 'narrative.project.json',
    },
    projectRoot,
    schemaVersion: 1,
    store: {
      content: await readFile(storeFilePath, 'utf8'),
      relativePath: path.relative(projectRoot, storeFilePath),
    },
  })

  return {
    filePath: backupFilePath,
  }
}

export async function exportProjectArchive({
  projectRoot,
  storeFilePath,
  now = () => new Date().toISOString(),
}: {
  projectRoot: string
  storeFilePath: string
  now?: () => string
}) {
  const exportedAt = now()
  const exportFilePath = path.join(
    projectRoot,
    '.narrative',
    'exports',
    `project-archive-${toFilenameTimestamp(exportedAt)}.json`,
  )
  const manifestText = await readOptionalText(path.join(projectRoot, 'narrative.project.json'))
  const manifest = manifestText ? sanitizeArchiveValue(JSON.parse(manifestText)) : null
  const store = JSON.parse(await readFile(storeFilePath, 'utf8')) as unknown
  const storeRecord = isRecord(store) ? store : {}
  const projectRecord = isRecord(storeRecord.project) ? storeRecord.project : {}

  await writeJsonAtomically(exportFilePath, {
    exportedAt,
    kind: 'narrative-project-archive',
    manifest,
    projectData: sanitizeArchiveValue(projectRecord.data ?? null),
    projectRoot,
    runStore: sanitizeArchiveValue(storeRecord.runStore ?? null),
    schemaVersion: 1,
    storeMetadata: sanitizeArchiveValue({
      createdAt: projectRecord.createdAt ?? null,
      projectId: projectRecord.projectId ?? null,
      projectTitle: projectRecord.projectTitle ?? null,
      schemaVersion: storeRecord.schemaVersion ?? null,
      storeKind: storeRecord.storeKind ?? null,
      templateVersion: storeRecord.templateVersion ?? null,
      updatedAt: projectRecord.updatedAt ?? null,
    }),
  })

  return {
    filePath: exportFilePath,
  }
}
