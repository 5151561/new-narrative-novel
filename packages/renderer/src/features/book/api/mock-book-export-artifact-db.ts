import type { BookExportArtifactRecord, BuildBookExportArtifactInput } from './book-export-artifact-records'

const MOCK_CREATED_AT_LABEL = 'Built in mock export session'
const MOCK_CREATED_BY_LABEL = 'Narrative editor'

const mockBookExportArtifactDb = new Map<string, BookExportArtifactRecord[]>()
let artifactSequence = 0

function clone<T>(value: T): T {
  return structuredClone(value)
}

function getBookArtifactBucket(bookId: string, createIfMissing = false) {
  const existing = mockBookExportArtifactDb.get(bookId)
  if (existing) {
    return existing
  }

  if (!createIfMissing) {
    return undefined
  }

  const next: BookExportArtifactRecord[] = []
  mockBookExportArtifactDb.set(bookId, next)
  return next
}

export function getMockBookExportArtifacts({
  bookId,
  exportProfileId,
  checkpointId,
}: {
  bookId: string
  exportProfileId?: string
  checkpointId?: string
}): BookExportArtifactRecord[] {
  return (getBookArtifactBucket(bookId) ?? [])
    .filter((record) => (exportProfileId === undefined ? true : record.exportProfileId === exportProfileId))
    .filter((record) => (checkpointId === undefined ? record.checkpointId === undefined : record.checkpointId === checkpointId))
    .map((record) => clone(record))
}

export function buildMockBookExportArtifact(input: BuildBookExportArtifactInput): BookExportArtifactRecord {
  const clonedInput = clone(input)
  const bucket = getBookArtifactBucket(clonedInput.bookId, true)
  artifactSequence += 1

  const record: BookExportArtifactRecord = {
    ...clonedInput,
    id: `book-export-artifact-${clonedInput.bookId}-${clonedInput.exportProfileId}-${clonedInput.format}-${artifactSequence}`,
    status: 'ready',
    createdAtLabel: MOCK_CREATED_AT_LABEL,
    createdByLabel: MOCK_CREATED_BY_LABEL,
  }

  bucket!.unshift(record)
  return clone(record)
}

export function resetMockBookExportArtifactDb(): void {
  mockBookExportArtifactDb.clear()
  artifactSequence = 0
}

export function exportMockBookExportArtifactSnapshot(): Record<string, BookExportArtifactRecord[]> {
  return Object.fromEntries(
    Array.from(mockBookExportArtifactDb.entries()).map(([bookId, records]) => [bookId, records.map((record) => clone(record))]),
  )
}

function readArtifactSequence(recordId: string) {
  const match = recordId.match(/-(\d+)$/)
  return match ? Number.parseInt(match[1]!, 10) : 0
}

export function importMockBookExportArtifactSnapshot(snapshot: Record<string, BookExportArtifactRecord[]>): void {
  mockBookExportArtifactDb.clear()

  let importedArtifactCount = 0
  let maxImportedSequence = 0

  for (const [bookId, records] of Object.entries(snapshot)) {
    if (records.length === 0) {
      continue
    }

    const clonedRecords = records.map((record) => clone(record))
    importedArtifactCount += clonedRecords.length
    maxImportedSequence = Math.max(maxImportedSequence, ...clonedRecords.map((record) => readArtifactSequence(record.id)))
    mockBookExportArtifactDb.set(bookId, clonedRecords)
  }

  artifactSequence = Math.max(importedArtifactCount, maxImportedSequence)
}
