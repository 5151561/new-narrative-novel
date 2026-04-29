import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'

import { readOrInitializeProjectSession, type ReadProjectSessionOptions, type SelectedProjectSession } from './project-picker.js'

const require = createRequire(import.meta.url)
const DEMO_PROJECT_ID = 'book-signal-arc'
const DEMO_PROJECT_TITLE = 'Signal Arc Demo'

function getElectronUserDataPath(): string {
  const { app } = require('electron') as typeof import('electron')
  return app.getPath('userData')
}

export async function readOrCreateDemoProjectSession({
  userDataPath = getElectronUserDataPath(),
  ...options
}: ReadProjectSessionOptions & { userDataPath?: string } = {}): Promise<SelectedProjectSession> {
  const projectRoot = path.join(userDataPath, 'demo-projects', DEMO_PROJECT_ID)
  await mkdir(projectRoot, { recursive: true })

  const session = await readOrInitializeProjectSession(projectRoot, {
    ...options,
    bootstrapSource: 'signal-arc-demo-template-v1',
    createProjectId: () => DEMO_PROJECT_ID,
  })
  const projectFilePath = path.join(projectRoot, 'narrative.project.json')
  const record = JSON.parse(await readFile(projectFilePath, 'utf8')) as {
    title?: string
  }
  if (record.title !== DEMO_PROJECT_TITLE) {
    await writeFile(projectFilePath, `${JSON.stringify({
      ...record,
      title: DEMO_PROJECT_TITLE,
    }, null, 2)}\n`, 'utf8')
  }

  return {
    ...session,
    projectId: DEMO_PROJECT_ID,
    projectMode: 'demo-fixture',
    runtimeKind: 'fixture-demo',
    projectTitle: DEMO_PROJECT_TITLE,
  }
}
