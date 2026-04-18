import type { BookStructureRecord } from './book-records'
import { getMockBookRecordById } from './mock-book-db'

export interface GetBookStructureRecordInput {
  bookId: string
}

export interface BookClient {
  getBookStructureRecord(input: GetBookStructureRecordInput): Promise<BookStructureRecord | null>
}

interface CreateBookClientOptions {
  getBookById?: (bookId: string) => BookStructureRecord | null
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

export function createBookClient({ getBookById = getMockBookRecordById }: CreateBookClientOptions = {}): BookClient {
  return {
    async getBookStructureRecord({ bookId }) {
      const record = getBookById(bookId)
      return record ? clone(record) : null
    },
  }
}

export const bookClient = createBookClient()
