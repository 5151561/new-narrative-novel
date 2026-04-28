import {
  createProjectWithDialog,
  openProjectWithDialog,
  readExistingProjectSession,
  readOrInitializeProjectSession,
  type SelectedProjectSession,
} from './project-picker.js'
import { RecentProjectsStore, type RecentProjectRecord } from './recent-projects.js'

interface ProjectPickerPort {
  createProjectWithDialog(): Promise<SelectedProjectSession | null>
  openProjectWithDialog(): Promise<SelectedProjectSession | null>
  readExistingProjectSession(projectRoot: string): Promise<SelectedProjectSession>
  readOrInitializeProjectSession(projectRoot: string): Promise<SelectedProjectSession>
}

interface RecentProjectsPort {
  add(project: RecentProjectRecord): Promise<RecentProjectRecord[]>
  list(): Promise<RecentProjectRecord[]>
  remove(projectRoot: string): Promise<RecentProjectRecord[]>
}

export interface ProjectStoreOptions {
  picker?: ProjectPickerPort
  recentProjects?: RecentProjectsPort
}

export { type SelectedProjectSession }

export class ProjectStore {
  private currentProject: SelectedProjectSession | null = null
  private recentProjectsSnapshot: RecentProjectRecord[] = []
  private readonly picker: ProjectPickerPort
  private readonly recentProjects: RecentProjectsPort

  constructor({
    picker = {
      createProjectWithDialog,
      openProjectWithDialog,
      readExistingProjectSession,
      readOrInitializeProjectSession,
    },
    recentProjects = new RecentProjectsStore(),
  }: ProjectStoreOptions = {}) {
    this.picker = picker
    this.recentProjects = recentProjects
  }

  getCurrentProject(): SelectedProjectSession | null {
    return this.currentProject
  }

  getRecentProjects(): RecentProjectRecord[] {
    return [...this.recentProjectsSnapshot]
  }

  private async rememberProjectSelection(selectedProject: SelectedProjectSession): Promise<SelectedProjectSession> {
    this.currentProject = selectedProject

    try {
      this.recentProjectsSnapshot = await this.recentProjects.add(selectedProject)
    } catch {
      // Keep the selected project active even if recent-project persistence fails.
    }

    return selectedProject
  }

  async restoreLastProject(): Promise<SelectedProjectSession | null> {
    this.recentProjectsSnapshot = await this.recentProjects.list()

    for (const project of this.recentProjectsSnapshot) {
      try {
        const selectedProject = await this.picker.readExistingProjectSession(project.projectRoot)
        return this.rememberProjectSelection(selectedProject)
      } catch {
        this.recentProjectsSnapshot = await this.recentProjects.remove(project.projectRoot)
      }
    }

    return null
  }

  async selectProjectRoot(projectRoot: string): Promise<SelectedProjectSession> {
    const selectedProject = await this.picker.readOrInitializeProjectSession(projectRoot)
    return this.rememberProjectSelection(selectedProject)
  }

  async createProject(): Promise<SelectedProjectSession | null> {
    const selectedProject = await this.picker.createProjectWithDialog()
    if (!selectedProject) {
      return null
    }

    return this.rememberProjectSelection(selectedProject)
  }

  async openProject(): Promise<SelectedProjectSession | null> {
    const selectedProject = await this.picker.openProjectWithDialog()
    if (!selectedProject) {
      return null
    }

    return this.rememberProjectSelection(selectedProject)
  }

  async forgetProjectRoot(projectRoot: string): Promise<void> {
    this.recentProjectsSnapshot = await this.recentProjects.remove(projectRoot)
    if (this.currentProject?.projectRoot === projectRoot) {
      this.currentProject = null
    }
  }
}
