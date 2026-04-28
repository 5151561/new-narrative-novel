import os from 'node:os'
import { spawn } from 'node:child_process'
import process from 'node:process'
import { setTimeout as delay } from 'node:timers/promises'

const [command, ...args] = process.argv.slice(2)

if (!command) {
  console.error('[run-with-cleanup] Missing command to execute.')
  process.exit(1)
}

const isWindows = process.platform === 'win32'
const shutdownSignals = ['SIGINT', 'SIGTERM', 'SIGHUP']
const fallbackExitCode = 1

let requestedSignal = null
let cleanupPromise = null
let finalizePromise = null
let forcedExitTimer = null

const child = spawn(command, args, {
  stdio: 'inherit',
  env: process.env,
  detached: !isWindows,
})

function isMissingProcessError(error) {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'ESRCH')
}

function exitCodeForSignal(signal) {
  if (!signal) {
    return fallbackExitCode
  }

  const signalNumber = os.constants.signals[signal]
  return typeof signalNumber === 'number' ? 128 + signalNumber : fallbackExitCode
}

function signalProcessGroup(signal) {
  if (!child.pid) {
    return false
  }

  if (isWindows) {
    child.kill(signal)
    return true
  }

  try {
    process.kill(-child.pid, signal)
    return true
  } catch (error) {
    if (isMissingProcessError(error)) {
      return false
    }

    throw error
  }
}

function processGroupAlive() {
  if (!child.pid || isWindows) {
    return child.exitCode === null && child.signalCode === null
  }

  try {
    process.kill(-child.pid, 0)
    return true
  } catch (error) {
    if (isMissingProcessError(error)) {
      return false
    }

    throw error
  }
}

async function cleanupTree(signal = 'SIGTERM') {
  if (cleanupPromise) {
    return cleanupPromise
  }

  cleanupPromise = (async () => {
    signalProcessGroup(signal)
    await delay(250)

    if (processGroupAlive()) {
      signalProcessGroup('SIGKILL')
      await delay(100)
    }
  })()

  return cleanupPromise
}

async function finalize(code, signal) {
  if (finalizePromise) {
    return finalizePromise
  }

  finalizePromise = (async () => {
    if (forcedExitTimer) {
      clearTimeout(forcedExitTimer)
      forcedExitTimer = null
    }

    await cleanupTree('SIGTERM')

    const exitCode = typeof code === 'number' ? code : exitCodeForSignal(signal ?? requestedSignal)
    process.exit(exitCode)
  })()

  return finalizePromise
}

child.on('error', (error) => {
  console.error('[run-with-cleanup] Failed to start command:', error)
  process.exit(1)
})

child.on('exit', (code, signal) => {
  void finalize(code, signal)
})

for (const signal of shutdownSignals) {
  process.on(signal, () => {
    requestedSignal = signal
    void cleanupTree(signal)

    if (!forcedExitTimer) {
      forcedExitTimer = setTimeout(() => {
        process.exit(exitCodeForSignal(signal))
      }, 3_000)
      forcedExitTimer.unref()
    }
  })
}
