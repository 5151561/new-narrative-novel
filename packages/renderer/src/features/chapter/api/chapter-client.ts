import type { ChapterStructureWorkspaceRecord } from './chapter-records'
import type {
  StartNextChapterSceneRunInput,
  StartNextChapterSceneRunRecord,
} from './chapter-records'
import type { ChapterSceneStructurePatch } from './chapter-record-mutations'
import {
  acceptMockChapterBacklogProposal,
  generateMockChapterBacklogProposal,
  getMockChapterRecordById,
  reorderMockChapterScene,
  startNextMockChapterSceneRun,
  updateMockChapterBacklogInput,
  updateMockChapterBacklogProposalScene,
  updateMockChapterSceneStructure,
} from './mock-chapter-db'

export interface GetChapterStructureWorkspaceInput {
  chapterId: string
}

export interface ChapterClient {
  getChapterStructureWorkspace(input: GetChapterStructureWorkspaceInput): Promise<ChapterStructureWorkspaceRecord | null>
  updateChapterBacklogInput(input: UpdateChapterBacklogInput): Promise<ChapterStructureWorkspaceRecord | null>
  generateChapterBacklogProposal(input: GenerateChapterBacklogProposalInput): Promise<ChapterStructureWorkspaceRecord | null>
  updateChapterBacklogProposalScene(input: UpdateChapterBacklogProposalSceneInput): Promise<ChapterStructureWorkspaceRecord | null>
  acceptChapterBacklogProposal(input: AcceptChapterBacklogProposalInput): Promise<ChapterStructureWorkspaceRecord | null>
  startNextChapterSceneRun(input: StartNextChapterSceneRunInput): Promise<StartNextChapterSceneRunRecord | null>
  reorderChapterScene(input: ReorderChapterSceneInput): Promise<ChapterStructureWorkspaceRecord | null>
  updateChapterSceneStructure(input: UpdateChapterSceneStructureInput): Promise<ChapterStructureWorkspaceRecord | null>
}

interface CreateChapterClientOptions {
  projectId?: string
  getChapterById?: (chapterId: string) => ChapterStructureWorkspaceRecord | null
  updateChapterBacklogInput?: (input: UpdateChapterBacklogInput) => ChapterStructureWorkspaceRecord | null
  generateChapterBacklogProposal?: (input: GenerateChapterBacklogProposalInput) => ChapterStructureWorkspaceRecord | null
  updateChapterBacklogProposalScene?: (input: UpdateChapterBacklogProposalSceneInput) => ChapterStructureWorkspaceRecord | null
  acceptChapterBacklogProposal?: (input: AcceptChapterBacklogProposalInput) => ChapterStructureWorkspaceRecord | null
  startNextChapterSceneRun?: (input: StartNextChapterSceneRunInput) => StartNextChapterSceneRunRecord | null
  reorderChapterScene?: (input: ReorderChapterSceneInput) => ChapterStructureWorkspaceRecord | null
  updateChapterSceneStructure?: (input: UpdateChapterSceneStructureInput) => ChapterStructureWorkspaceRecord | null
}

export interface UpdateChapterBacklogInput {
  chapterId: string
  locale: 'en' | 'zh-CN'
  goal?: string
  constraints?: string[]
}

export interface GenerateChapterBacklogProposalInput {
  chapterId: string
  locale: 'en' | 'zh-CN'
}

export interface UpdateChapterBacklogProposalSceneInput {
  chapterId: string
  proposalId: string
  proposalSceneId: string
  locale: 'en' | 'zh-CN'
  patch?: Partial<Record<'title' | 'summary' | 'purpose' | 'pov' | 'location' | 'conflict' | 'reveal' | 'plannerNotes', string>>
  order?: number
  backlogStatus?: 'planned' | 'running' | 'needs_review' | 'drafted' | 'revised'
}

export interface AcceptChapterBacklogProposalInput {
  chapterId: string
  proposalId: string
  locale: 'en' | 'zh-CN'
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
  projectId,
  getChapterById = getMockChapterRecordById,
  updateChapterBacklogInput = updateMockChapterBacklogInput,
  generateChapterBacklogProposal = generateMockChapterBacklogProposal,
  updateChapterBacklogProposalScene = updateMockChapterBacklogProposalScene,
  acceptChapterBacklogProposal = acceptMockChapterBacklogProposal,
  startNextChapterSceneRun = (input) => startNextMockChapterSceneRun(input, projectId),
  reorderChapterScene = reorderMockChapterScene,
  updateChapterSceneStructure = updateMockChapterSceneStructure,
}: CreateChapterClientOptions = {}): ChapterClient {
  return {
    async getChapterStructureWorkspace({ chapterId }) {
      const chapterRecord = getChapterById(chapterId)
      return chapterRecord ? clone(chapterRecord) : null
    },
    async updateChapterBacklogInput(input) {
      const chapterRecord = updateChapterBacklogInput(input)
      return chapterRecord ? clone(chapterRecord) : null
    },
    async generateChapterBacklogProposal(input) {
      const chapterRecord = generateChapterBacklogProposal(input)
      return chapterRecord ? clone(chapterRecord) : null
    },
    async updateChapterBacklogProposalScene(input) {
      const chapterRecord = updateChapterBacklogProposalScene(input)
      return chapterRecord ? clone(chapterRecord) : null
    },
    async acceptChapterBacklogProposal(input) {
      const chapterRecord = acceptChapterBacklogProposal(input)
      return chapterRecord ? clone(chapterRecord) : null
    },
    async startNextChapterSceneRun(input) {
      const record = startNextChapterSceneRun(input)
      return record ? clone(record) : null
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
