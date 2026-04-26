import { spawn } from 'node:child_process'
import process from 'node:process'

import { resolveRendererDevServer } from './desktop-dev-utils.mjs'

const requestedRendererDevUrl = process.env.NARRATIVE_RENDERER_DEV_URL || 'http://127.0.0.1:5173'
const reuseRenderer = process.env.NARRATIVE_DESKTOP_REUSE_RENDERER === '1'
const strictRequestedPort = Boolean(process.env.NARRATIVE_RENDERER_DEV_URL)
const workspaceRoot = new URL('..', import.meta.url)

let rendererProcess
let electronProcess
let isShuttingDown = false
let rendererDevUrl = requestedRendererDevUrl

function run(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: options.cwd || workspaceRoot,
    env: options.env || process.env,
    stdio: options.stdio || 'inherit',
  })

  child.on('error', (error) => {
    console.error(`[desktop-dev] Failed to start ${command}:`, error)
    shutdown(1)
  })

  return child
}

function waitForExit(child, label) {
  return new Promise((resolve, reject) => {
    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`${label} exited with ${signal || `code ${code ?? 'unknown'}`}`))
    })
  })
}

async function isRendererReady(url = rendererDevUrl) {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok || response.status === 404
  } catch {
    return false
  }
}

async function waitForRenderer(url = rendererDevUrl, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    if (await isRendererReady(url)) {
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 250))
  }

  throw new Error(`Renderer dev server did not become ready at ${url}`)
}

async function ensureRenderer() {
  const rendererServer = await resolveRendererDevServer({
    requestedUrl: requestedRendererDevUrl,
    reuseRenderer,
    strictRequestedPort,
  })
  rendererDevUrl = rendererServer.url

  if (!rendererServer.shouldStartRenderer) {
    console.log(`[desktop-dev] Reusing explicitly requested renderer dev server at ${rendererDevUrl}`)
    await waitForRenderer(rendererDevUrl)
    return
  }

  const url = new URL(rendererDevUrl)
  console.log(`[desktop-dev] Starting renderer dev server at ${rendererDevUrl}`)
  rendererProcess = run('pnpm', [
    '--filter',
    '@narrative-novel/renderer',
    'dev',
    '--host',
    url.hostname === '[::1]' ? '::1' : url.hostname,
    '--port',
    url.port || '5173',
    '--strictPort',
  ])

  await waitForRenderer(rendererDevUrl)
}

function shutdown(exitCode = 0) {
  if (isShuttingDown) {
    return
  }

  isShuttingDown = true
  electronProcess?.kill()
  rendererProcess?.kill()
  process.exit(exitCode)
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

try {
  await ensureRenderer()

  const buildProcess = run('pnpm', ['--filter', '@narrative-novel/desktop', 'build'])
  await waitForExit(buildProcess, 'Desktop build')

  electronProcess = run(
    'pnpm',
    ['--filter', '@narrative-novel/desktop', 'exec', 'electron', 'dist/main.js'],
    {
      env: {
        ...process.env,
        NARRATIVE_RENDERER_DEV_URL: rendererDevUrl,
      },
    },
  )

  await waitForExit(electronProcess, 'Electron')
  shutdown(0)
} catch (error) {
  console.error('[desktop-dev]', error instanceof Error ? error.message : error)
  shutdown(1)
}
