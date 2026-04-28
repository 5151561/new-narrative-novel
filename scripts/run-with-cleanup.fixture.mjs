import fs from 'node:fs/promises'
import { spawn } from 'node:child_process'

const mode = process.argv[2]

async function writePidFile(pidFile, pid) {
  await fs.writeFile(pidFile, `${pid}\n`, 'utf8')
}

function spawnLeakyChild() {
  return spawn(process.execPath, ['-e', 'setInterval(() => {}, 1_000)'], {
    stdio: 'ignore',
  })
}

if (mode === 'exit') {
  const code = Number(process.argv[3] || 0)
  process.exit(code)
} else if (mode === 'spawn-tree-and-exit') {
  const pidFile = process.argv[3]
  const child = spawnLeakyChild()
  await writePidFile(pidFile, child.pid)
  process.exit(0)
} else if (mode === 'spawn-tree-and-hold') {
  const pidFile = process.argv[3]
  const child = spawnLeakyChild()
  await writePidFile(pidFile, child.pid)
  setInterval(() => {}, 1_000)
} else {
  throw new Error(`Unknown fixture mode: ${mode ?? '<missing>'}`)
}
