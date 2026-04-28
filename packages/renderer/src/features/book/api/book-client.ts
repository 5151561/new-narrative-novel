import {
  type CreateBookExperimentBranchInput,
  type ArchiveBookExperimentBranchInput,
  archiveMockBookExperimentBranch,
  createMockBookExperimentBranch,
  getMockBookExperimentBranch,
  getMockBookExperimentBranches,
  type BookExperimentBranchRecord,
} from './book-experiment-branches'
import type { BookDraftAssemblyRecord } from './book-draft-assembly-records'
import {
  getMockBookExportProfile,
  getMockBookExportProfiles,
  type BookExportProfileRecord,
} from './book-export-profiles'
import type { BookExportArtifactRecord, BuildBookExportArtifactInput } from './book-export-artifact-records'
import { buildMockBookExportArtifact, getMockBookExportArtifacts } from './mock-book-export-artifact-db'
import {
  type CreateBookManuscriptCheckpointInput,
  createMockBookManuscriptCheckpoint,
  getMockBookManuscriptCheckpoint,
  getMockBookManuscriptCheckpoints,
  type BookManuscriptCheckpointRecord,
} from './book-manuscript-checkpoints'
import type { BookStructureRecord } from './book-records'
import { getMockBookRecordById } from './mock-book-db'

export interface GetBookStructureRecordInput {
  bookId: string
}

export interface GetBookDraftAssemblyInput {
  bookId: string
}

export interface GetBookManuscriptCheckpointsInput {
  bookId: string
}

export interface GetBookManuscriptCheckpointInput {
  bookId: string
  checkpointId: string
}

export interface GetBookExportProfilesInput {
  bookId: string
}

export interface GetBookExportProfileInput {
  bookId: string
  exportProfileId: string
}

export interface GetBookExportArtifactsInput {
  bookId: string
  exportProfileId?: string | null
  checkpointId?: string | null
}

export interface GetBookExperimentBranchesInput {
  bookId: string
}

export interface GetBookExperimentBranchInput {
  bookId: string
  branchId: string
}

const unsupportedBookDraftAssemblyErrorCode = 'BOOK_DRAFT_ASSEMBLY_UNSUPPORTED'

export function createUnsupportedBookDraftAssemblyError(message = 'Book draft assembly is unavailable.') {
  const error = new Error(message)
  ;(error as Error & { code?: string }).code = unsupportedBookDraftAssemblyErrorCode
  return error
}

export function isUnsupportedBookDraftAssemblyError(error: unknown): error is Error & { code: string } {
  return (
    error instanceof Error &&
    (error as Error & { code?: string }).code === unsupportedBookDraftAssemblyErrorCode
  )
}

export interface BookClient {
  getBookStructureRecord(input: GetBookStructureRecordInput): Promise<BookStructureRecord | null>
  getBookDraftAssembly?(input: GetBookDraftAssemblyInput): Promise<BookDraftAssemblyRecord | null>
  getBookManuscriptCheckpoints(input: GetBookManuscriptCheckpointsInput): Promise<BookManuscriptCheckpointRecord[]>
  getBookManuscriptCheckpoint(input: GetBookManuscriptCheckpointInput): Promise<BookManuscriptCheckpointRecord | null>
  createBookManuscriptCheckpoint(input: CreateBookManuscriptCheckpointInput): Promise<BookManuscriptCheckpointRecord>
  getBookExportProfiles(input: GetBookExportProfilesInput): Promise<BookExportProfileRecord[]>
  getBookExportProfile(input: GetBookExportProfileInput): Promise<BookExportProfileRecord | null>
  getBookExportArtifacts(input: GetBookExportArtifactsInput): Promise<BookExportArtifactRecord[]>
  buildBookExportArtifact(input: BuildBookExportArtifactInput): Promise<BookExportArtifactRecord>
  getBookExperimentBranches(input: GetBookExperimentBranchesInput): Promise<BookExperimentBranchRecord[]>
  getBookExperimentBranch(input: GetBookExperimentBranchInput): Promise<BookExperimentBranchRecord | null>
  createBookExperimentBranch(input: CreateBookExperimentBranchInput): Promise<BookExperimentBranchRecord>
  archiveBookExperimentBranch(input: ArchiveBookExperimentBranchInput): Promise<BookExperimentBranchRecord>
}

interface CreateBookClientOptions {
  getBookById?: (bookId: string) => BookStructureRecord | null
  getBookDraftAssemblyByBookId?: (bookId: string) => BookDraftAssemblyRecord | null
  getBookManuscriptCheckpointsByBookId?: (bookId: string) => BookManuscriptCheckpointRecord[]
  getBookExportProfilesByBookId?: (bookId: string) => BookExportProfileRecord[]
  getBookExportProfileById?: (bookId: string, exportProfileId: string) => BookExportProfileRecord | null
  getBookExportArtifactsByContext?: (input: { bookId: string; exportProfileId?: string; checkpointId?: string }) => BookExportArtifactRecord[]
  buildBookExportArtifactRecord?: (input: BuildBookExportArtifactInput) => BookExportArtifactRecord
  getBookExperimentBranchesByBookId?: (bookId: string) => BookExperimentBranchRecord[]
  getBookExperimentBranchById?: (bookId: string, branchId: string) => BookExperimentBranchRecord | null
  createBookManuscriptCheckpointRecord?: (input: CreateBookManuscriptCheckpointInput) => BookManuscriptCheckpointRecord | Promise<BookManuscriptCheckpointRecord>
  createBookExperimentBranchRecord?: (input: CreateBookExperimentBranchInput) => BookExperimentBranchRecord | Promise<BookExperimentBranchRecord>
  archiveBookExperimentBranchRecord?: (input: ArchiveBookExperimentBranchInput) => BookExperimentBranchRecord | Promise<BookExperimentBranchRecord>
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function buildCheckpointChaptersFromDraftAssembly(record: BookDraftAssemblyRecord | null | undefined) {
  if (!record) {
    return null
  }

  return record.chapters.map((chapter) => ({
    chapterId: chapter.chapterId,
    order: chapter.order,
    title: clone(chapter.title),
    summary: clone(chapter.summary),
    scenes: chapter.scenes.map((scene) => ({
      sceneId: scene.sceneId,
      order: scene.order,
      title: clone(scene.title),
      summary: clone(scene.summary),
      proseDraft: scene.kind === 'draft' ? scene.proseDraft : undefined,
      draftWordCount: scene.draftWordCount,
      warningsCount: scene.warningsCount,
      traceReady: scene.traceReady,
    })),
  }))
}

function buildBranchSnapshotsFromCheckpoint(record: BookManuscriptCheckpointRecord) {
  return record.chapters.map((chapter) => ({
    chapterId: chapter.chapterId,
    title: clone(chapter.title),
    summary: clone(chapter.summary),
    sceneSnapshots: chapter.scenes.map((scene) => ({
      sceneId: scene.sceneId,
      title: clone(scene.title),
      summary: clone(scene.summary),
      proseDraft: scene.proseDraft ? { en: scene.proseDraft, 'zh-CN': scene.proseDraft } : undefined,
      draftWordCount: scene.draftWordCount,
      traceReady: scene.traceReady,
      warningsCount: scene.warningsCount,
      sourceProposalCount: 0,
    })),
  }))
}

function buildBranchSnapshotsFromDraftAssembly(record: BookDraftAssemblyRecord | null | undefined) {
  if (!record) {
    return null
  }

  return record.chapters.map((chapter) => ({
    chapterId: chapter.chapterId,
    title: clone(chapter.title),
    summary: clone(chapter.summary),
    sceneSnapshots: chapter.scenes.map((scene) => ({
      sceneId: scene.sceneId,
      title: clone(scene.title),
      summary: clone(scene.summary),
      proseDraft: scene.kind === 'draft' ? { en: scene.proseDraft, 'zh-CN': scene.proseDraft } : undefined,
      draftWordCount: scene.draftWordCount,
      traceReady: scene.traceReady,
      warningsCount: scene.warningsCount,
      sourceProposalCount: scene.traceRollup.sourceProposalCount,
    })),
  }))
}

export function createBookClient({
  getBookById = getMockBookRecordById,
  getBookDraftAssemblyByBookId,
  getBookManuscriptCheckpointsByBookId = getMockBookManuscriptCheckpoints,
  getBookExportProfilesByBookId = getMockBookExportProfiles,
  getBookExportProfileById = getMockBookExportProfile,
  getBookExportArtifactsByContext = getMockBookExportArtifacts,
  buildBookExportArtifactRecord = buildMockBookExportArtifact,
  getBookExperimentBranchesByBookId = getMockBookExperimentBranches,
  getBookExperimentBranchById = getMockBookExperimentBranch,
  createBookManuscriptCheckpointRecord = (input) => {
    const chapters =
      buildCheckpointChaptersFromDraftAssembly(getBookDraftAssemblyByBookId?.(input.bookId))
      ?? clone(getMockBookManuscriptCheckpoints(input.bookId).at(-1)?.chapters ?? [])

    return createMockBookManuscriptCheckpoint({
      ...input,
      chapters,
    })
  },
  createBookExperimentBranchRecord = (input) => {
    const checkpoint = input.basedOnCheckpointId
      ? getMockBookManuscriptCheckpoint(input.bookId, input.basedOnCheckpointId)
      : null
    const chapterSnapshots = checkpoint
      ? buildBranchSnapshotsFromCheckpoint(checkpoint)
      : buildBranchSnapshotsFromDraftAssembly(getBookDraftAssemblyByBookId?.(input.bookId))
        ?? buildBranchSnapshotsFromCheckpoint(getMockBookManuscriptCheckpoints(input.bookId).at(-1)!)

    return createMockBookExperimentBranch({
      ...input,
      sourceSignature: input.basedOnCheckpointId
        ? `checkpoint:${input.basedOnCheckpointId}`
        : `draft-assembly:${input.bookId}:selected:${input.selectedChapterId}`,
      chapterSnapshots,
    })
  },
  archiveBookExperimentBranchRecord = archiveMockBookExperimentBranch,
}: CreateBookClientOptions = {}): BookClient {
  return {
    async getBookStructureRecord({ bookId }) {
      const record = getBookById(bookId)
      return record ? clone(record) : null
    },
    ...(getBookDraftAssemblyByBookId
      ? {
          async getBookDraftAssembly({ bookId }: GetBookDraftAssemblyInput) {
            const record = getBookDraftAssemblyByBookId(bookId)
            return record ? clone(record) : null
          },
        }
      : {}),
    async getBookManuscriptCheckpoints({ bookId }) {
      return clone(getBookManuscriptCheckpointsByBookId(bookId))
    },
    async getBookManuscriptCheckpoint({ bookId, checkpointId }) {
      const record = getBookManuscriptCheckpointsByBookId(bookId).find((item) => item.checkpointId === checkpointId)
      return record ? clone(record) : null
    },
    async getBookExportProfiles({ bookId }) {
      return clone(getBookExportProfilesByBookId(bookId))
    },
    async getBookExportProfile({ bookId, exportProfileId }) {
      const record = getBookExportProfileById(bookId, exportProfileId)
      return record ? clone(record) : null
    },
    async getBookExportArtifacts({ bookId, exportProfileId, checkpointId }) {
      return clone(
        getBookExportArtifactsByContext({
          bookId,
          exportProfileId: exportProfileId ?? undefined,
          checkpointId: checkpointId ?? undefined,
        }),
      )
    },
    async buildBookExportArtifact(input) {
      return clone(buildBookExportArtifactRecord(input))
    },
    async getBookExperimentBranches({ bookId }) {
      return clone(getBookExperimentBranchesByBookId(bookId))
    },
    async getBookExperimentBranch({ bookId, branchId }) {
      const record = getBookExperimentBranchById(bookId, branchId)
      return record ? clone(record) : null
    },
    async createBookManuscriptCheckpoint(input) {
      if (!createBookManuscriptCheckpointRecord) {
        throw new Error('Book manuscript checkpoint creation is unavailable in this client.')
      }

      return clone(await createBookManuscriptCheckpointRecord(input))
    },
    async createBookExperimentBranch(input) {
      if (!createBookExperimentBranchRecord) {
        throw new Error('Book experiment branch creation is unavailable in this client.')
      }

      return clone(await createBookExperimentBranchRecord(input))
    },
    async archiveBookExperimentBranch(input) {
      if (!archiveBookExperimentBranchRecord) {
        throw new Error('Book experiment branch archiving is unavailable in this client.')
      }

      return clone(await archiveBookExperimentBranchRecord(input))
    },
  }
}

export const bookClient = createBookClient()
