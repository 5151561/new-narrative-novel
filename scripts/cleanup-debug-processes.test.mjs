import assert from 'node:assert/strict'
import http from 'node:http'
import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import test from 'node:test'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const cleanupScriptPath = path.join(__dirname, 'cleanup-debug-processes.mjs')

function isRunning(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    if (error?.code === 'ESRCH') {
      return false
    }

    throw error
  }
}

async function waitFor(predicate, timeoutMs = 5_000) {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    if (await predicate()) {
      return
    }

    await delay(50)
  }

  throw new Error(`Condition was not met within ${timeoutMs}ms`)
}

async function waitForPort(port) {
  await waitFor(
    () =>
      new Promise((resolve) => {
        const request = http
          .get({ host: '127.0.0.1', port, path: '/' }, (response) => {
            response.resume()
            resolve(true)
          })
          .on('error', () => resolve(false))

        request.setTimeout(250, () => {
          request.destroy()
          resolve(false)
        })
      }),
  )
}

async function getFreePort() {
  return await new Promise((resolve, reject) => {
    const server = http.createServer()
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : null
      server.close((error) => {
        if (error) {
          reject(error)
          return
        }

        resolve(port)
      })
    })
    server.on('error', reject)
  })
}

async function cleanupChild(child) {
  if (child && isRunning(child.pid)) {
    child.kill('SIGKILL')
    await waitFor(() => !isRunning(child.pid), 2_000)
  }
}

function spawnServer({ cwd, port }) {
  return spawn(
    process.execPath,
    [
      '-e',
      `const http=require('node:http'); http.createServer((_,res)=>res.end('ok')).listen(${port}, '127.0.0.1'); setInterval(()=>{}, 1000);`,
    ],
    {
      cwd,
      stdio: 'ignore',
    },
  )
}

test('kills repo-owned listening processes on managed ports', async (t) => {
  const port = await getFreePort()
  const child = spawnServer({ cwd: repoRoot, port })

  t.after(async () => {
    await cleanupChild(child)
  })

  await waitForPort(port)

  const cleanup = spawn(process.execPath, [cleanupScriptPath, '--scope', 'storybook', '--ports', String(port), '--repo-root', repoRoot], {
    cwd: repoRoot,
    stdio: 'ignore',
  })

  const exitCode = await new Promise((resolve) => cleanup.on('exit', resolve))
  assert.equal(exitCode, 0)
  await waitFor(() => !isRunning(child.pid))
})

test('does not kill listeners outside the repo root', async (t) => {
  const port = await getFreePort()
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cleanup-debug-outside-'))
  const child = spawnServer({ cwd: tempDir, port })

  t.after(async () => {
    await cleanupChild(child)
    await fs.rm(tempDir, { force: true, recursive: true })
  })

  await waitForPort(port)

  const cleanup = spawn(process.execPath, [cleanupScriptPath, '--scope', 'storybook', '--ports', String(port), '--repo-root', repoRoot], {
    cwd: repoRoot,
    stdio: 'ignore',
  })

  const exitCode = await new Promise((resolve) => cleanup.on('exit', resolve))
  assert.equal(exitCode, 0)
  assert.equal(isRunning(child.pid), true)
})
