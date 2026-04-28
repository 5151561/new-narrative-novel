import { readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { app } from 'electron'

import type { SelectedProjectSession } from './project-picker.js'

export type RecentProjectRecord = SelectedProjectSession

interface PersistedRecentProjectsRecord {
  projects: RecentProjectRecord[]
}

const RECENT_PROJECTS_FILE = 'recent-projects.json'
const MAX_RECENT_PROJECTS = 10

function isRecentProjectRecord(value: unknown): value is RecentProjectRecord {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<RecentProjectRecord>
  return (
    typeof candidate.projectId === 'string'
    && candidate.projectId.length > 0
    && typeof candidate.projectRoot === 'string'
    && candidate.projectRoot.length > 0
    && typeof candidate.projectTitle === 'string'
    && candidate.projectTitle.length > 0
  )
}

function sanitizeRecentProjectRecord(value: RecentProjectRecord): RecentProjectRecord {
  return {
    projectId: value.projectId,
    projectRoot: value.projectRoot,
    projectTitle: value.projectTitle,
  }
}

function normalizeRecentProjects(value: unknown): RecentProjectRecord[] {
  if (!value || typeof value !== 'object') {
    return []
  }

  const projects = (value as Partial<PersistedRecentProjectsRecord>).projects
  if (!Array.isArray(projects)) {
    return []
  }

  return projects.filter(isRecentProjectRecord).map(sanitizeRecentProjectRecord)
}

function isPersistedRecentProjectsRecord(value: unknown): value is PersistedRecentProjectsRecord {
  if (!value || typeof value !== 'object') {
    return false
  }

  const projects = (value as Partial<PersistedRecentProjectsRecord>).projects
  return Array.isArray(projects) && projects.every(isRecentProjectRecord)
}

export class RecentProjectsStore {
  private readonly filePath: string

  constructor({ userDataPath = app.getPath('userData') }: { userDataPath?: string } = {}) {
    this.filePath = path.join(userDataPath, RECENT_PROJECTS_FILE)
  }

  async list(): Promise<RecentProjectRecord[]> {
    return this.readProjects()
  }

  async add(project: RecentProjectRecord): Promise<RecentProjectRecord[]> {
    const projects = await this.readProjects()
    const updatedProjects = [
      sanitizeRecentProjectRecord(project),
      ...projects.filter((candidate) => candidate.projectRoot !== project.projectRoot),
    ].slice(0, MAX_RECENT_PROJECTS)

    await this.writeProjects(updatedProjects)
    return updatedProjects
  }

  async remove(projectRoot: string): Promise<RecentProjectRecord[]> {
    const projects = await this.readProjects()
    const updatedProjects = projects.filter((candidate) => candidate.projectRoot !== projectRoot)

    await this.writeProjects(updatedProjects)
    return updatedProjects
  }

  private async readProjects(): Promise<RecentProjectRecord[]> {
    try {
      const parsed = JSON.parse(await readFile(this.filePath, 'utf8')) as unknown
      if (!isPersistedRecentProjectsRecord(parsed)) {
        await this.writeProjects([])
        return []
      }

      return normalizeRecentProjects(parsed)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return []
      }

      if (error instanceof SyntaxError) {
        await this.writeProjects([])
        return []
      }

      throw error
    }
  }

  private async writeProjects(projects: RecentProjectRecord[]): Promise<void> {
    const record: PersistedRecentProjectsRecord = {
      projects,
    }
    const serializedRecord = `${JSON.stringify(record, null, 2)}\n`
    const temporaryFilePath = `${this.filePath}.tmp`

    await writeFile(temporaryFilePath, serializedRecord, 'utf8')
    await rename(temporaryFilePath, this.filePath)
  }
}
