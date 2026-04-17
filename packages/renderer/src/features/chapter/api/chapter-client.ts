import type { ChapterStructureWorkspaceRecord } from './chapter-records'
import type { ChapterSceneStructurePatch } from './chapter-record-mutations'
import { getMockChapterRecordById, reorderMockChapterScene, updateMockChapterSceneStructure } from './mock-chapter-db'

export interface GetChapterStructureWorkspaceInput {
  chapterId: string
}

export interface ChapterClient {
  getChapterStructureWorkspace(input: GetChapterStructureWorkspaceInput): Promise<ChapterStructureWorkspaceRecord | null>
  reorderChapterScene(input: ReorderChapterSceneInput): Promise<ChapterStructureWorkspaceRecord | null>
  updateChapterSceneStructure(input: UpdateChapterSceneStructureInput): Promise<ChapterStructureWorkspaceRecord | null>
}

interface CreateChapterClientOptions {
  getChapterById?: (chapterId: string) => ChapterStructureWorkspaceRecord | null
  reorderChapterScene?: (input: ReorderChapterSceneInput) => ChapterStructureWorkspaceRecord | null
  updateChapterSceneStructure?: (input: UpdateChapterSceneStructureInput) => ChapterStructureWorkspaceRecord | null
}

export interface ReorderChapterSceneInput {
  chapterId: string
  sceneId: string
  targetIndex: number
}

export interface UpdateChapterSceneStructureInput {
  chapterId: string
  sceneId: string
  locale: 'en' | 'zh-CN'
  patch: ChapterSceneStructurePatch
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

export function createChapterClient({
  getChapterById = getMockChapterRecordById,
  reorderChapterScene = reorderMockChapterScene,
  updateChapterSceneStructure = updateMockChapterSceneStructure,
}: CreateChapterClientOptions = {}): ChapterClient {
  return {
    async getChapterStructureWorkspace({ chapterId }) {
      const chapterRecord = getChapterById(chapterId)
      return chapterRecord ? clone(chapterRecord) : null
    },
    async reorderChapterScene(input) {
      const chapterRecord = reorderChapterScene(input)
      return chapterRecord ? clone(chapterRecord) : null
    },
    async updateChapterSceneStructure(input) {
      const chapterRecord = updateChapterSceneStructure(input)
      return chapterRecord ? clone(chapterRecord) : null
    },
  }
}

export const chapterClient = createChapterClient()
