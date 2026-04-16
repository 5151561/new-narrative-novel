import { resolveAppLocale, type Locale } from '@/app/i18n'
import { createChapterMockDatabase, type ChapterMockDatabase } from '@/mock/chapter-fixtures'
import type { ChapterStructureWorkspaceData } from '../types/chapter-view-models'

export interface ChapterClient {
  getChapterStructureWorkspace(chapterId: string): Promise<ChapterStructureWorkspaceData>
}

interface CreateChapterClientOptions {
  database?: ChapterMockDatabase
  databaseFactory?: (locale: Locale) => ChapterMockDatabase
  localeResolver?: () => Locale
}

const DEFAULT_CHAPTER_ID = 'chapter-signals-in-rain'

function clone<T>(value: T): T {
  return structuredClone(value)
}

export function createChapterClient({
  database,
  databaseFactory = (locale) => createChapterMockDatabase(locale),
  localeResolver = resolveAppLocale,
}: CreateChapterClientOptions = {}): ChapterClient {
  const localeDatabases = new Map<Locale, ChapterMockDatabase>()

  function getDatabase(locale: Locale) {
    if (database) {
      return database
    }

    const existingDatabase = localeDatabases.get(locale)
    if (existingDatabase) {
      return existingDatabase
    }

    const nextDatabase = databaseFactory(locale)
    localeDatabases.set(locale, nextDatabase)
    return nextDatabase
  }

  return {
    async getChapterStructureWorkspace(chapterId: string) {
      const activeDatabase = getDatabase(localeResolver())
      const chapter = activeDatabase.chapters[chapterId] ?? activeDatabase.chapters[DEFAULT_CHAPTER_ID]

      if (!chapter) {
        throw new Error(`Unknown chapter "${chapterId}"`)
      }

      return clone(chapter)
    },
  }
}

export const chapterClient = createChapterClient()
