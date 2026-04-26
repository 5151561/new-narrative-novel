import {
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
  getBookExportProfiles(input: GetBookExportProfilesInput): Promise<BookExportProfileRecord[]>
  getBookExportProfile(input: GetBookExportProfileInput): Promise<BookExportProfileRecord | null>
  getBookExportArtifacts(input: GetBookExportArtifactsInput): Promise<BookExportArtifactRecord[]>
  buildBookExportArtifact(input: BuildBookExportArtifactInput): Promise<BookExportArtifactRecord>
  getBookExperimentBranches(input: GetBookExperimentBranchesInput): Promise<BookExperimentBranchRecord[]>
  getBookExperimentBranch(input: GetBookExperimentBranchInput): Promise<BookExperimentBranchRecord | null>
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
}

function clone<T>(value: T): T {
  return structuredClone(value)
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
  }
}

export const bookClient = createBookClient()
