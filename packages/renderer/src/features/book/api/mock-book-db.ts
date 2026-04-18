import type { BookLocalizedText, BookStructureRecord } from './book-records'

function text(en: string, zhCN: string): BookLocalizedText {
  return {
    en,
    'zh-CN': zhCN,
  }
}

export const mockBookRecordSeeds: Record<string, BookStructureRecord> = {
  'book-signal-arc': {
    bookId: 'book-signal-arc',
    title: text('Signal Arc', '信号弧线'),
    summary: text(
      'Aggregate the current chapter workspaces into one ordered book-level structure surface.',
      '把现有章节工作台聚合成一个按顺序展开的书籍结构视图。',
    ),
    chapterIds: ['chapter-signals-in-rain', 'chapter-open-water-signals'],
    viewsMeta: {
      availableViews: ['sequence', 'outliner', 'signals'],
    },
  },
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

let mutableMockBookRecords: Record<string, BookStructureRecord> = clone(mockBookRecordSeeds)

export function resetMockBookDb() {
  mutableMockBookRecords = clone(mockBookRecordSeeds)
}

export function getMockBookRecordById(bookId: string): BookStructureRecord | null {
  const record = mutableMockBookRecords[bookId]
  return record ? clone(record) : null
}
