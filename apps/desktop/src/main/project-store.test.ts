import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
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
    const invalidRoot = path.join(mkdtempSync(path.join(tmpdir(), 'project-missing-')), 'deleted-root')
    const validRoot = mkdtempSync(path.join(tmpdir(), 'project-valid-'))
    const resolvedProject = createSession(validRoot, 'Recovered Project')
    rmSync(invalidRoot, { force: true, recursive: true })
    mkdirSync(validRoot, { recursive: true })
    writeFileSync(path.join(validRoot, 'narrative.project.json'), `${JSON.stringify({
      bootstrap: {
        source: 'signal-arc-demo-template-v1',
      },
      createdAt: '2026-04-27T00:00:00.000Z',
      projectId: resolvedProject.projectId,
      schemaVersion: 1,
      store: {
        artifactDir: '.narrative/artifacts',
        dataFile: '.narrative/project-store.json',
        schemaVersion: 1,
      },
      title: resolvedProject.projectTitle,
      updatedAt: '2026-04-27T00:00:00.000Z',
    }, null, 2)}\n`, 'utf8')
    const recentProjects = {
      add: vi.fn(async (project: SelectedProjectSession) => [project]),
      list: vi.fn(async () => [
        createSession(invalidRoot, 'Missing Project'),
        createSession(validRoot, 'Recovered Project'),
      ]),
      remove: vi.fn(async () => [createSession(validRoot, 'Recovered Project')]),
    }
    const store = new ProjectStore({
      recentProjects,
    })

    await expect(store.restoreLastProject()).resolves.toEqual(resolvedProject)
    expect(store.getCurrentProject()).toEqual(resolvedProject)
    expect(recentProjects.remove).toHaveBeenCalledWith(invalidRoot)
    expect(recentProjects.add).toHaveBeenCalledWith(resolvedProject)
    expect(store.getRecentProjects()).toEqual([resolvedProject])
    expect(() => readFileSync(path.join(invalidRoot, 'narrative.project.json'), 'utf8')).toThrow()

    rmSync(validRoot, { force: true, recursive: true })
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
