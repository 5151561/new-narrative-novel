import { existsSync, mkdtempSync, readFileSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { CredentialStore } from './credential-store.js'

const tempDirectories: string[] = []

function createUserDataPath() {
  const directory = mkdtempSync(path.join(tmpdir(), 'credential-store-'))
  tempDirectories.push(directory)
  return directory
}

afterEach(async () => {
  await Promise.all(tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

describe('CredentialStore', () => {
  it('saves, reads, redacts, and deletes provider credentials inside desktop main storage only', async () => {
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
