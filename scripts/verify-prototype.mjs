import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const verificationSteps = [
  {
    label: 'API prototype regression suite',
    cwd: 'packages/api',
    args: [
      'exec',
      'vitest',
      'run',
      'src/orchestration/sceneRun/sceneRunTransitions.test.ts',
      'src/repositories/runFixtureStore.test.ts',
      'src/createServer.run-flow.test.ts',
      'src/createServer.run-artifacts.test.ts',
      'src/createServer.draft-assembly-regression.test.ts',
    ],
  },
  {
    label: 'Renderer prototype regression suite',
    cwd: 'packages/renderer',
    args: [
      'exec',
      'vitest',
      'run',
      'src/App.scene-runtime-smoke.test.tsx',
      'src/features/workbench/hooks/useWorkbenchRouteState.test.tsx',
      'src/features/run/hooks/useSceneRunSession.test.tsx',
      'src/features/scene/components/SceneExecutionTab.test.tsx',
      'src/features/scene/components/SceneBottomDock.test.tsx',
      'src/features/run/components/RunReviewGate.test.tsx',
      'src/app/project-runtime/mock-project-runtime.test.ts',
    ],
  },
]

for (const step of verificationSteps) {
  console.log(`\n[verify:prototype] ${step.label}`)
  console.log(`cwd=${step.cwd}`)
  console.log([pnpmCommand, ...step.args].join(' '))

  const result = spawnSync(pnpmCommand, step.args, {
    stdio: 'inherit',
    cwd: resolve(repoRoot, step.cwd),
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }

  if (result.signal) {
    console.error(`[verify:prototype] stopped by signal ${result.signal}`)
    process.exit(1)
  }
}
