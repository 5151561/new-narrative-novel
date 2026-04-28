import { execFileSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const defaultRepoRoot = path.resolve(__dirname, '..')

const SCOPE_CONFIG = {
  api: {
    ports: [4174],
    patterns: [/tsx src\/server\.ts/, /node .*src\/server\.ts/],
  },
  desktop: {
    ports: [],
    patterns: [/scripts\/desktop-dev\.mjs/, /\belectron\b.*dist\/main\.js/],
  },
  playwright: {
    ports: [],
    patterns: [/\bplaywright\b.*\btest\b/, /playwright-mcp/],
  },
  renderer: {
    ports: [5173, 5174],
    patterns: [/(^|[\/\s])vite(?:$|\s)/],
  },
  storybook: {
    ports: [6006, 6007],
    patterns: [/\bstorybook\b.*\bdev\b/, /\/\.bin\/storybook\b/],
  },
}

function parseArgs(argv) {
  const result = {
    ports: [],
    quiet: false,
    repoRoot: defaultRepoRoot,
    scopes: ['all'],
  }

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index]

    if (current === '--quiet') {
      result.quiet = true
      continue
    }

    if (current === '--repo-root') {
      result.repoRoot = path.resolve(argv[index + 1])
      index += 1
      continue
    }

    if (current === '--scope') {
      result.scopes = argv[index + 1].split(',').map((scope) => scope.trim()).filter(Boolean)
      index += 1
      continue
    }

    if (current === '--ports') {
      result.ports = argv[index + 1]
        .split(',')
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isInteger(value) && value > 0)
      index += 1
      continue
    }

    throw new Error(`Unknown argument: ${current}`)
  }

  return result
}

function runCommand(command, args) {
  try {
    return execFileSync(command, args, { encoding: 'utf8' })
  } catch (error) {
    if (typeof error?.status === 'number' && error.status === 1) {
      return error.stdout ?? ''
    }

    throw error
  }
}

function parseProcessList(output) {
  return output
    .split('\n')
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^\s*(\d+)\s+(\d+)\s+(.*)$/)
      if (!match) {
        return null
      }

      return {
        pid: Number(match[1]),
        ppid: Number(match[2]),
        command: match[3],
      }
    })
    .filter(Boolean)
}

function parseListeningPid(output) {
  const pidLine = output
    .split('\n')
    .find((line) => line.startsWith('p'))

  return pidLine ? Number(pidLine.slice(1)) : null
}

function getProcessList() {
  const output = runCommand('ps', ['-u', process.env.USER, '-o', 'pid=,ppid=,command='])
  return parseProcessList(output)
}

function getProcessCwd(pid) {
  const output = runCommand('lsof', ['-a', '-p', String(pid), '-d', 'cwd', '-Fn'])
  const cwdLine = output
    .split('\n')
    .find((line) => line.startsWith('n'))

  return cwdLine ? cwdLine.slice(1) : null
}

function getListeningPids(ports) {
  const pids = new Set()

  for (const port of ports) {
    const output = runCommand('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-Fp'])
    const pid = parseListeningPid(output)
    if (pid) {
      pids.add(pid)
    }
  }

  return pids
}

function isSubPath(parentPath, childPath) {
  const relative = path.relative(parentPath, childPath)
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

function resolveScopes(scopeNames) {
  if (scopeNames.includes('all')) {
    return Object.keys(SCOPE_CONFIG)
  }

  return scopeNames
}

function resolveManagedPorts(scopes, explicitPorts) {
  const ports = new Set(explicitPorts)

  for (const scope of scopes) {
    const config = SCOPE_CONFIG[scope]
    if (!config) {
      throw new Error(`Unknown scope: ${scope}`)
    }

    for (const port of config.ports) {
      ports.add(port)
    }
  }

  return [...ports]
}

function matchesCommandPatterns(command, scopes) {
  return scopes.some((scope) => SCOPE_CONFIG[scope].patterns.some((pattern) => pattern.test(command)))
}

function collectAncestorPids(processes, startPid) {
  const processByPid = new Map(processes.map((entry) => [entry.pid, entry]))
  const ancestors = new Set([startPid])

  let currentPid = startPid
  while (processByPid.has(currentPid)) {
    const current = processByPid.get(currentPid)
    if (!current || !current.ppid || ancestors.has(current.ppid)) {
      break
    }

    ancestors.add(current.ppid)
    currentPid = current.ppid
  }

  return ancestors
}

function collectProcessTreePids(processes, rootPids) {
  const childrenByParent = new Map()

  for (const entry of processes) {
    if (!childrenByParent.has(entry.ppid)) {
      childrenByParent.set(entry.ppid, [])
    }

    childrenByParent.get(entry.ppid).push(entry.pid)
  }

  const visited = new Set()
  const ordered = []

  function visit(pid) {
    if (visited.has(pid)) {
      return
    }

    visited.add(pid)

    for (const childPid of childrenByParent.get(pid) ?? []) {
      visit(childPid)
    }

    ordered.push(pid)
  }

  for (const pid of rootPids) {
    visit(pid)
  }

  return ordered
}

function shouldSelectProcess({ entry, cwd, repoRoot, scopes }) {
  const repoOwned = (cwd && isSubPath(repoRoot, cwd)) || entry.command.includes(repoRoot)
  if (!repoOwned) {
    return false
  }

  return matchesCommandPatterns(entry.command, scopes)
}

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

async function waitForExit(pid, timeoutMs = 1500) {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    if (!isRunning(pid)) {
      return true
    }

    await new Promise((resolve) => setTimeout(resolve, 50))
  }

  return !isRunning(pid)
}

async function killProcessTree(pids) {
  const survivors = []

  for (const pid of pids) {
    if (isRunning(pid)) {
      process.kill(pid, 'SIGTERM')
    }
  }

  for (const pid of pids) {
    if (!(await waitForExit(pid))) {
      survivors.push(pid)
    }
  }

  for (const pid of survivors) {
    if (isRunning(pid)) {
      process.kill(pid, 'SIGKILL')
    }
  }

  for (const pid of survivors) {
    await waitForExit(pid, 1000)
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const scopes = resolveScopes(options.scopes)
  const managedPorts = resolveManagedPorts(scopes, options.ports)
  const processes = getProcessList()
  const ancestors = collectAncestorPids(processes, process.pid)
  const candidatePids = new Set()
  const cwdCache = new Map()

  for (const pid of getListeningPids(managedPorts)) {
    if (ancestors.has(pid)) {
      continue
    }

    const entry = processes.find((processEntry) => processEntry.pid === pid)
    if (!entry) {
      continue
    }

    const cwd = getProcessCwd(pid)
    cwdCache.set(pid, cwd)

    const repoOwned = (cwd && isSubPath(options.repoRoot, cwd)) || entry.command.includes(options.repoRoot)
    if (repoOwned) {
      candidatePids.add(pid)
    }
  }

  for (const entry of processes) {
    if (ancestors.has(entry.pid)) {
      continue
    }

    if (!candidatePids.has(entry.pid) && !matchesCommandPatterns(entry.command, scopes)) {
      continue
    }

    const cwd = cwdCache.has(entry.pid) ? cwdCache.get(entry.pid) : getProcessCwd(entry.pid)
    cwdCache.set(entry.pid, cwd)

    if (shouldSelectProcess({ entry, cwd, repoRoot: options.repoRoot, scopes })) {
      candidatePids.add(entry.pid)
    }
  }

  if (candidatePids.size === 0) {
    if (!options.quiet) {
      console.log('[cleanup-debug] No stale repo debug processes found.')
    }
    return
  }

  const orderedPids = collectProcessTreePids(processes, [...candidatePids])
  const selectedEntries = [...candidatePids]
    .map((pid) => processes.find((entry) => entry.pid === pid))
    .filter(Boolean)

  if (!options.quiet) {
    for (const entry of selectedEntries) {
      console.log(`[cleanup-debug] stopping pid=${entry.pid} command=${entry.command}`)
    }
  }

  await killProcessTree(orderedPids)

  if (!options.quiet) {
    console.log(`[cleanup-debug] Cleaned ${candidatePids.size} root process(es).`)
  }
}

await main()
