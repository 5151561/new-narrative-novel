import { describe, expect, it, vi } from 'vitest'

import { ProjectStore, type SelectedProjectSession } from './project-store.js'

function createSession(projectRoot: string, title = 'Local Project'): SelectedProjectSession {
  return {
    projectId: 'book-signal-arc',
    projectRoot,
    projectTitle: title,
  }
}

describe('ProjectStore', () => {
  it('restores the last valid recent project root on desktop startup', async () => {
    const invalidRoot = '/tmp/project-missing'
    const validRoot = '/tmp/project-valid'
    const resolvedProject = createSession(validRoot, 'Recovered Project')
    const picker = {
      openProjectWithDialog: vi.fn(),
      readOrInitializeProjectSession: vi.fn(async (projectRoot: string) => {
        if (projectRoot === invalidRoot) {
          throw new Error('project missing')
        }

        return resolvedProject
      }),
    }
    const recentProjects = {
      add: vi.fn(async (project: SelectedProjectSession) => [project]),
      list: vi.fn(async () => [
        createSession(invalidRoot, 'Missing Project'),
        createSession(validRoot, 'Recovered Project'),
      ]),
      remove: vi.fn(async () => [createSession(validRoot, 'Recovered Project')]),
    }
    const store = new ProjectStore({
      picker,
      recentProjects,
    })

    await expect(store.restoreLastProject()).resolves.toEqual(resolvedProject)
    expect(store.getCurrentProject()).toEqual(resolvedProject)
    expect(recentProjects.remove).toHaveBeenCalledWith(invalidRoot)
  })

  it('opens a project through the native picker and persists it into recent projects', async () => {
    const selectedProject = createSession('/tmp/project-dialog', 'Opened Through Dialog')
    const picker = {
      openProjectWithDialog: vi.fn(async () => selectedProject),
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
      openProjectWithDialog: vi.fn(),
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
