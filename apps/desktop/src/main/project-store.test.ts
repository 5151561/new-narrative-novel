import path from 'node:path'

import { describe, expect, it, vi } from 'vitest'

import { ProjectStore, type SelectedProjectSession } from './project-store.js'

function createSession(projectRoot: string, title = 'Local Project'): SelectedProjectSession {
  return {
    projectId: `local-project-${path.basename(projectRoot)}`,
    projectRoot,
    projectTitle: title,
  }
}

describe('ProjectStore', () => {
  it('creates a project through the native picker flow and persists it into recent projects', async () => {
    const selectedProject = createSession('/tmp/project-created', 'Created Through Dialog')
    const picker = {
      createProjectWithDialog: vi.fn(async () => selectedProject),
      openProjectWithDialog: vi.fn(),
      readExistingProjectSession: vi.fn(),
      readOrInitializeProjectSession: vi.fn(),
    }
    const recentProjects = {
      add: vi.fn(async (project: SelectedProjectSession) => [project]),
      list: vi.fn(async () => []),
      remove: vi.fn(async () => []),
    }
    const store = new ProjectStore({
      picker,
      recentProjects,
    })

    await expect(store.createProject()).resolves.toEqual(selectedProject)
    expect(store.getCurrentProject()).toEqual(selectedProject)
    expect(recentProjects.add).toHaveBeenCalledWith(selectedProject)
  })

  it('restores the last valid recent project root on desktop startup', async () => {
    const createdProject = createSession('/tmp/project-created', 'Created Through Dialog')
    const openedProject = createSession('/tmp/project-opened', 'Opened Through Dialog')
    const restoredProject = createSession('/tmp/project-restored', 'Recovered Project')
    const picker = {
      createProjectWithDialog: vi.fn(async () => createdProject),
      openProjectWithDialog: vi.fn(async () => openedProject),
      readExistingProjectSession: vi.fn(async (projectRoot: string) => {
        if (projectRoot === '/tmp/missing-project') {
          throw new Error('Narrative project root does not exist: /tmp/missing-project')
        }

        return restoredProject
      }),
      readOrInitializeProjectSession: vi.fn(async () => restoredProject),
    }
    const recentProjects = {
      add: vi.fn(async (project: SelectedProjectSession) => [project]),
      list: vi.fn(async () => [
        createSession('/tmp/missing-project', 'Missing Project'),
        restoredProject,
      ]),
      remove: vi.fn(async () => [restoredProject]),
    }
    const store = new ProjectStore({
      picker,
      recentProjects,
    })

    await expect(store.restoreLastProject()).resolves.toEqual(restoredProject)
    await expect(store.createProject()).resolves.toEqual(createdProject)
    await expect(store.openProject()).resolves.toEqual(openedProject)
    expect(store.getCurrentProject()).toEqual(openedProject)
    expect(recentProjects.remove).toHaveBeenCalledWith('/tmp/missing-project')
    expect(recentProjects.add).toHaveBeenCalledWith(restoredProject)
    expect(store.getRecentProjects()).toEqual([openedProject])
  })

  it('opens a project through the native picker and persists it into recent projects', async () => {
    const selectedProject = createSession('/tmp/project-dialog', 'Opened Through Dialog')
    const picker = {
      createProjectWithDialog: vi.fn(),
      openProjectWithDialog: vi.fn(async () => selectedProject),
      readExistingProjectSession: vi.fn(),
      readOrInitializeProjectSession: vi.fn(),
    }
    const recentProjects = {
      add: vi.fn(async (project: SelectedProjectSession) => [project]),
      list: vi.fn(async () => []),
      remove: vi.fn(async () => []),
    }
    const store = new ProjectStore({
      picker,
      recentProjects,
    })

    await expect(store.openProject()).resolves.toEqual(selectedProject)
    expect(store.getCurrentProject()).toEqual(selectedProject)
    expect(recentProjects.add).toHaveBeenCalledWith(selectedProject)
  })

  it('keeps the selected project active when recent-project persistence fails after a valid recent-root selection', async () => {
    const selectedProject = createSession('/tmp/project-valid', 'Recovered Project')
    const picker = {
      createProjectWithDialog: vi.fn(),
      openProjectWithDialog: vi.fn(),
      readExistingProjectSession: vi.fn(),
      readOrInitializeProjectSession: vi.fn(async () => selectedProject),
    }
    const recentProjects = {
      add: vi.fn(async () => {
        throw new Error('disk full')
      }),
      list: vi.fn(async () => []),
      remove: vi.fn(async () => []),
    }
    const store = new ProjectStore({
      picker,
      recentProjects,
    })

    await expect(store.selectProjectRoot('/tmp/project-valid')).resolves.toEqual(selectedProject)
    expect(store.getCurrentProject()).toEqual(selectedProject)
    expect(store.getRecentProjects()).toEqual([])
    expect(recentProjects.remove).not.toHaveBeenCalled()
  })
})
