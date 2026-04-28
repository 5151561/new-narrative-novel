import { existsSync, mkdtempSync, readFileSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

const tempDirectories: string[] = []

async function loadCredentialStore() {
  const module = await import('./credential-store.js')
  return module.CredentialStore
}

function createUserDataPath() {
  const directory = mkdtempSync(path.join(tmpdir(), 'credential-store-'))
  tempDirectories.push(directory)
  return directory
}

afterEach(async () => {
  await Promise.all(tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
  vi.doUnmock('electron')
  vi.resetModules()
})

describe('CredentialStore', () => {
  it('supports injected dependencies without loading electron at import time', async () => {
    vi.resetModules()

    let electronModuleLoaded = false
    vi.doMock('electron', () => {
      electronModuleLoaded = true
      throw new Error('electron should not load when dependencies are injected explicitly')
    })

    const CredentialStore = await loadCredentialStore()
    const userDataPath = createUserDataPath()
    const store = new CredentialStore({
      encryption: {
        decryptString: (value) => Buffer.from(value, 'base64').toString('utf8'),
        encryptString: (value) => Buffer.from(value, 'utf8').toString('base64'),
        isEncryptionAvailable: () => true,
      },
      userDataPath,
    })

    await expect(store.saveCredential('openai', 'sk-secret-value')).resolves.toEqual({
      configured: true,
      provider: 'openai',
      redactedValue: 'sk-...alue',
    })
    expect(electronModuleLoaded).toBe(false)

  })

  it('saves, reads, redacts, and deletes provider credentials inside desktop main storage only', async () => {
    const CredentialStore = await loadCredentialStore()
    const userDataPath = createUserDataPath()
    const store = new CredentialStore({
      encryption: {
        decryptString: (value) => Buffer.from(value, 'base64').toString('utf8'),
        encryptString: (value) => Buffer.from(value, 'utf8').toString('base64'),
        isEncryptionAvailable: () => true,
      },
      userDataPath,
    })

    await expect(store.getCredentialStatus('openai')).resolves.toEqual({
      configured: false,
      provider: 'openai',
    })

    await expect(store.saveCredential('openai', 'sk-secret-value')).resolves.toEqual({
      configured: true,
      provider: 'openai',
      redactedValue: 'sk-...alue',
    })
    await expect(store.getCredentialStatus('openai')).resolves.toEqual({
      configured: true,
      provider: 'openai',
      redactedValue: 'sk-...alue',
    })
    await expect(store.getRawCredential('openai')).resolves.toBe('sk-secret-value')

    const persisted = readFileSync(path.join(userDataPath, 'provider-credentials.json'), 'utf8')
    expect(persisted).not.toContain('sk-secret-value')

    await expect(store.deleteCredential('openai')).resolves.toEqual({
      configured: false,
      provider: 'openai',
    })
    await expect(store.getRawCredential('openai')).resolves.toBeNull()
  })

  it('keeps credentials in memory only when safe storage is unavailable instead of writing pseudo-encrypted secrets to disk', async () => {
    const CredentialStore = await loadCredentialStore()
    const userDataPath = createUserDataPath()
    const store = new CredentialStore({
      encryption: {
        decryptString: () => {
          throw new Error('session-only credentials should not hit decryptString')
        },
        encryptString: () => {
          throw new Error('session-only credentials should not hit encryptString')
        },
        isEncryptionAvailable: () => false,
      },
      userDataPath,
    })

    await expect(store.saveCredential('openai', 'sk-secret-value')).resolves.toEqual({
      configured: true,
      provider: 'openai',
      redactedValue: 'sk-...alue',
    })
    await expect(store.getRawCredential('openai')).resolves.toBe('sk-secret-value')
    expect(existsSync(path.join(userDataPath, 'provider-credentials.json'))).toBe(false)

    const restored = new CredentialStore({
      encryption: {
        decryptString: () => {
          throw new Error('session-only credentials should not hit decryptString')
        },
        encryptString: () => {
          throw new Error('session-only credentials should not hit encryptString')
        },
        isEncryptionAvailable: () => false,
      },
      userDataPath,
    })

    await expect(restored.getCredentialStatus('openai')).resolves.toEqual({
      configured: false,
      provider: 'openai',
    })
    await expect(restored.getRawCredential('openai')).resolves.toBeNull()
  })
})
