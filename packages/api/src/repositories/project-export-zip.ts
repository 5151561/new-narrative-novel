import type { FixtureDataSnapshot } from '../contracts/api-records.js'
import { sanitizeArchiveValue } from './project-backup.js'

export const README_BACKUP_TEXT = [
  'Narrative Novel Project Backup',
  '===============================',
  '',
  'This archive contains a snapshot of your writing project.',
  '',
  'Included:',
  '- Project state (chapters, scenes, prose, settings)',
  '- Model binding metadata (model IDs, provider labels)',
  '',
  'Excluded:',
  '- Raw OpenAI API keys (security)',
  '- Credential store contents',
  '',
  'To restore: place local-project-store.json in your project\'s .narrative/ directory.',
].join('\n')

export interface ProjectExportZip {
  exportedAt: string
  kind: 'narrative-project-export'
  schemaVersion: number
  projectId: string
  manifest: {
    projectTitle: string
    projectMode: string
    runtimeKind: string
    books: Record<string, { title: string; chapterCount: number }>
  }
  store: unknown
  readme: string
}

export function exportProjectZip(
  snapshot: FixtureDataSnapshot,
  projectId: string,
  now: () => string = () => new Date().toISOString(),
): ProjectExportZip {
  const project = snapshot.projects[projectId]
  if (!project) {
    throw new Error(`Project ${projectId} was not found.`)
  }

  const sanitized = sanitizeArchiveValue(project)

  const books: Record<string, { title: string; chapterCount: number }> = {}
  for (const [bookId, book] of Object.entries(project.books)) {
    books[bookId] = {
      title: book.title.en,
      chapterCount: book.chapterIds.length,
    }
  }

  return {
    exportedAt: now(),
    kind: 'narrative-project-export',
    schemaVersion: 1,
    projectId,
    manifest: {
      projectTitle: project.runtimeInfo.projectTitle,
      projectMode: project.runtimeInfo.projectMode ?? 'demo-fixture',
      runtimeKind: project.runtimeInfo.runtimeKind ?? 'fixture-demo',
      books,
    },
    store: sanitized,
    readme: README_BACKUP_TEXT,
  }
}
