import type { ChapterStructureWorkspaceRecord } from './chapter-records'
import { getMockChapterRecordById } from './mock-chapter-db'

export interface GetChapterStructureWorkspaceInput {
  chapterId: string
}

export interface ChapterClient {
  getChapterStructureWorkspace(input: GetChapterStructureWorkspaceInput): Promise<ChapterStructureWorkspaceRecord | null>
}

interface CreateChapterClientOptions {
  getChapterById?: (chapterId: string) => ChapterStructureWorkspaceRecord | null
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

export function createChapterClient({
  getChapterById = getMockChapterRecordById,
}: CreateChapterClientOptions = {}): ChapterClient {
  return {
    async getChapterStructureWorkspace({ chapterId }) {
      const chapterRecord = getChapterById(chapterId)
      return chapterRecord ? clone(chapterRecord) : null
    },
  }
}

export const chapterClient = createChapterClient()
