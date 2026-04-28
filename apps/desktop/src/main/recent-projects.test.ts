import { mkdtempSync, writeFileSync } from 'node:fs'
import { readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { RecentProjectsStore } from './recent-projects.js'

const tempDirectories: string[] = []

function createUserDataPath() {
  const directory = mkdtempSync(path.join(tmpdir(), 'recent-projects-'))
  tempDirectories.push(directory)
  return directory
}

afterEach(async () => {
  await Promise.all(tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

describe('RecentProjectsStore', () => {
  it('persists recent projects inside Electron app data instead of renderer localStorage', async () => {
    const userDataPath = createUserDataPath()
    const store = new RecentProjectsStore({ userDataPath })

    await store.add({
      projectId: 'local-project-alpha',
      projectRoot: '/tmp/workbench-alpha',
      projectTitle: 'Workbench Alpha',
    })

    const persisted = JSON.parse(
      await readFile(path.join(userDataPath, 'recent-projects.json'), 'utf8'),
    )

    expect(persisted).toEqual({
      projects: [{
        projectId: 'local-project-alpha',
        projectRoot: '/tmp/workbench-alpha',
        projectTitle: 'Workbench Alpha',
      }],
    })
  })

  it('restores persisted recent projects with newest-first deduped ordering', async () => {
    const userDataPath = createUserDataPath()
    const store = new RecentProjectsStore({ userDataPath })

    await store.add({
      projectId: 'local-project-alpha',
      projectRoot: '/tmp/workbench-alpha',
      projectTitle: 'Workbench Alpha',
    })
    await store.add({
      projectId: 'local-project-beta',
      projectRoot: '/tmp/workbench-beta',
      projectTitle: 'Workbench Beta',
    })
    await store.add({
      projectId: 'local-project-alpha',
      projectRoot: '/tmp/workbench-alpha',
      projectTitle: 'Workbench Alpha',
    })

    const restored = new RecentProjectsStore({ userDataPath })

    await expect(restored.list()).resolves.toEqual([
      {
        projectId: 'local-project-alpha',
        projectRoot: '/tmp/workbench-alpha',
        projectTitle: 'Workbench Alpha',
      },
      {
        projectId: 'local-project-beta',
        projectRoot: '/tmp/workbench-beta',
        projectTitle: 'Workbench Beta',
      },
    ])
  })

  it('self-heals malformed recent-projects.json back to an empty list instead of bricking desktop startup', async () => {
    const userDataPath = createUserDataPath()
    writeFileSync(path.join(userDataPath, 'recent-projects.json'), '{"projects":[', 'utf8')

    const store = new RecentProjectsStore({ userDataPath })

    await expect(store.list()).resolves.toEqual([])
    await expect(readFile(path.join(userDataPath, 'recent-projects.json'), 'utf8')).resolves.toContain('"projects": []')
  })

  it('sanitizes persisted recent-project records back to SelectedProjectSession fields only', async () => {
    const userDataPath = createUserDataPath()
    writeFileSync(path.join(userDataPath, 'recent-projects.json'), JSON.stringify({
      projects: [
        {
          lastOpenedAt: '2026-04-28T00:00:00.000Z',
          projectId: 'local-project-alpha',
          projectRoot: '/tmp/workbench-alpha',
          projectTitle: 'Workbench Alpha',
        },
      ],
    }), 'utf8')

    const store = new RecentProjectsStore({ userDataPath })

    await expect(store.list()).resolves.toEqual([
      {
        projectId: 'local-project-alpha',
        projectRoot: '/tmp/workbench-alpha',
        projectTitle: 'Workbench Alpha',
      },
    ])
  })
})
