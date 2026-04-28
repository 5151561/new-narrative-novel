import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import test from 'node:test'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const wrapperPath = path.join(__dirname, 'run-with-cleanup.mjs')
const fixturePath = path.join(__dirname, 'run-with-cleanup.fixture.mjs')

function isRunning(pid) {
  if (!pid) {
    return false
  }

  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ESRCH') {
      return false
    }

    throw error
  }
}

async function waitFor(predicate, { timeoutMs = 5_000, intervalMs = 50 } = {}) {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    if (await predicate()) {
      return
    }

    await delay(intervalMs)
  }

  throw new Error(`Condition was not met within ${timeoutMs}ms`)
}

async function readPidFile(pidFile) {
  const content = await fs.readFile(pidFile, 'utf8')
  return Number(content.trim())
}

async function cleanupPid(pid) {
  if (!isRunning(pid)) {
    return
  }

  process.kill(pid, 'SIGKILL')
  await waitFor(() => !isRunning(pid), { timeoutMs: 2_000 })
}

test('cleans descendant processes after the wrapped command exits', async (t) => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'run-with-cleanup-'))
  const pidFile = path.join(tempDir, 'child.pid')
  let childPid

  t.after(async () => {
    await fs.rm(tempDir, { force: true, recursive: true })

    if (childPid) {
      await cleanupPid(childPid)
    }
  })

  const child = spawn(process.execPath, [wrapperPath, process.execPath, fixturePath, 'spawn-tree-and-exit', pidFile], {
    stdio: 'ignore',
  })

  const [exitCode, signal] = await once(child, 'exit')
  assert.equal(signal, null)
  assert.equal(exitCode, 0)

  childPid = await readPidFile(pidFile)
  await waitFor(() => !isRunning(childPid), { timeoutMs: 5_000 })
})

test('kills descendant processes when the wrapper receives SIGTERM', async (t) => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'run-with-cleanup-'))
  const pidFile = path.join(tempDir, 'child.pid')
  let childPid

  t.after(async () => {
    await fs.rm(tempDir, { force: true, recursive: true })

    if (childPid) {
      await cleanupPid(childPid)
    }
  })

  const child = spawn(process.execPath, [wrapperPath, process.execPath, fixturePath, 'spawn-tree-and-hold', pidFile], {
    stdio: 'ignore',
  })

  await waitFor(async () => {
    try {
      childPid = await readPidFile(pidFile)
      return isRunning(childPid)
    } catch {
      return false
    }
  })

  child.kill('SIGTERM')
  await once(child, 'exit')
  await waitFor(() => !isRunning(childPid), { timeoutMs: 5_000 })
})

test('forwards the wrapped command exit code', async () => {
  const child = spawn(process.execPath, [wrapperPath, process.execPath, fixturePath, 'exit', '7'], {
    stdio: 'ignore',
  })

  const [exitCode, signal] = await once(child, 'exit')
  assert.equal(signal, null)
  assert.equal(exitCode, 7)
})
