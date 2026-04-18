import {
  getMockBookManuscriptCheckpoints,
  type BookManuscriptCheckpointRecord,
} from './book-manuscript-checkpoints'
import type { BookStructureRecord } from './book-records'
import { getMockBookRecordById } from './mock-book-db'

export interface GetBookStructureRecordInput {
  bookId: string
}

export interface GetBookManuscriptCheckpointsInput {
  bookId: string
}

export interface GetBookManuscriptCheckpointInput {
  bookId: string
  checkpointId: string
}

export interface BookClient {
  getBookStructureRecord(input: GetBookStructureRecordInput): Promise<BookStructureRecord | null>
  getBookManuscriptCheckpoints(input: GetBookManuscriptCheckpointsInput): Promise<BookManuscriptCheckpointRecord[]>
  getBookManuscriptCheckpoint(input: GetBookManuscriptCheckpointInput): Promise<BookManuscriptCheckpointRecord | null>
}

interface CreateBookClientOptions {
  getBookById?: (bookId: string) => BookStructureRecord | null
  getBookManuscriptCheckpointsByBookId?: (bookId: string) => BookManuscriptCheckpointRecord[]
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

export function createBookClient({
  getBookById = getMockBookRecordById,
  getBookManuscriptCheckpointsByBookId = getMockBookManuscriptCheckpoints,
}: CreateBookClientOptions = {}): BookClient {
  return {
    async getBookStructureRecord({ bookId }) {
      const record = getBookById(bookId)
      return record ? clone(record) : null
    },
    async getBookManuscriptCheckpoints({ bookId }) {
      return clone(getBookManuscriptCheckpointsByBookId(bookId))
    },
    async getBookManuscriptCheckpoint({ bookId, checkpointId }) {
      const record = getBookManuscriptCheckpointsByBookId(bookId).find((item) => item.checkpointId === checkpointId)
      return record ? clone(record) : null
    },
  }
}

export const bookClient = createBookClient()
