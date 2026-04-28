import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'

import type { ProviderCredentialStatus } from '../shared/desktop-bridge-types.js'

interface PersistedCredentialRecord {
  encoding: 'plain' | 'safeStorage'
  value: string
}

interface PersistedCredentialStoreRecord {
  credentials: Record<string, PersistedCredentialRecord>
}

export interface CredentialStoreEncryption {
  decryptString(value: string): string
  encryptString(value: string): string
  isEncryptionAvailable(): boolean
}

const PROVIDER_CREDENTIALS_FILE = 'provider-credentials.json'
const LEGACY_OPENAI_PROVIDER_KEY = 'openai'
const DEFAULT_PROVIDER_ID = 'openai-default'
const require = createRequire(import.meta.url)

function loadElectronModule() {
  return require('electron') as typeof import('electron')
}

function createDefaultEncryption(): CredentialStoreEncryption {
  return {
    decryptString(value) {
      return loadElectronModule().safeStorage.decryptString(Buffer.from(value, 'base64'))
    },
    encryptString(value) {
      return loadElectronModule().safeStorage.encryptString(value).toString('base64')
    },
    isEncryptionAvailable() {
      return loadElectronModule().safeStorage.isEncryptionAvailable()
    },
  }
}

function createEmptyRecord(): PersistedCredentialStoreRecord {
  return {
    credentials: {},
  }
}

function redactSecret(secret: string): string {
  if (secret.length <= 7) {
    return `${secret.slice(0, Math.min(3, secret.length))}...`
  }

  return `${secret.slice(0, 3)}...${secret.slice(-4)}`
}

function normalizeProviderId(providerId: string): string {
  const normalized = providerId.trim()
  return normalized === LEGACY_OPENAI_PROVIDER_KEY ? DEFAULT_PROVIDER_ID : normalized
}

function createCredentialStatus(providerId: string, secret?: string | null): ProviderCredentialStatus {
  return {
    configured: Boolean(secret),
    provider: 'openai-compatible',
    providerId,
    ...(secret ? { redactedValue: redactSecret(secret) } : {}),
  }
}

function isPersistedCredentialRecord(value: unknown): value is PersistedCredentialRecord {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<PersistedCredentialRecord>
  return (
    (candidate.encoding === 'plain' || candidate.encoding === 'safeStorage')
    && typeof candidate.value === 'string'
    && candidate.value.length > 0
  )
}

function normalizePersistedCredentialStoreRecord(value: unknown): PersistedCredentialStoreRecord {
  if (!value || typeof value !== 'object') {
    return createEmptyRecord()
  }

  const credentials = (value as Partial<PersistedCredentialStoreRecord>).credentials
  if (!credentials || typeof credentials !== 'object') {
    return createEmptyRecord()
  }

  const normalizedEntries = Object.entries(credentials).flatMap((entry) => {
    if (!isPersistedCredentialRecord(entry[1])) {
      return []
    }

    const key = normalizeProviderId(entry[0])
    return [[key, entry[1]] as const]
  })

  return {
    credentials: Object.fromEntries(normalizedEntries),
  }
}

export class CredentialStore {
  private readonly filePath: string
  private readonly encryption: CredentialStoreEncryption
  private readonly sessionCredentials = new Map<string, string>()

  constructor({
    encryption = createDefaultEncryption(),
    userDataPath = loadElectronModule().app.getPath('userData'),
  }: {
    encryption?: CredentialStoreEncryption
    userDataPath?: string
  } = {}) {
    this.encryption = encryption
    this.filePath = path.join(userDataPath, PROVIDER_CREDENTIALS_FILE)
  }

  async getCredentialStatus(providerId: string): Promise<ProviderCredentialStatus> {
    const normalizedProviderId = normalizeProviderId(providerId)
    const secret = await this.getRawCredential(normalizedProviderId)
    return createCredentialStatus(normalizedProviderId, secret)
  }

  async getRawCredential(providerId: string): Promise<string | null> {
    const normalizedProviderId = normalizeProviderId(providerId)
    const sessionCredential = this.sessionCredentials.get(normalizedProviderId)
    if (sessionCredential) {
      return sessionCredential
    }

    const record = await this.readRecord()
    const persisted = record.credentials[normalizedProviderId]
    if (!persisted) {
      return null
    }

    if (!this.encryption.isEncryptionAvailable()) {
      return null
    }

    return this.encryption.decryptString(persisted.value)
  }

  async saveCredential(providerId: string, secret: string): Promise<ProviderCredentialStatus> {
    const normalizedProviderId = normalizeProviderId(providerId)
    const normalizedSecret = secret.trim()
    this.sessionCredentials.set(normalizedProviderId, normalizedSecret)

    if (this.encryption.isEncryptionAvailable()) {
      const record = await this.readRecord()
      record.credentials[normalizedProviderId] = {
        encoding: 'safeStorage',
        value: this.encryption.encryptString(normalizedSecret),
      }

      await this.writeRecord(record)
    }

    return createCredentialStatus(normalizedProviderId, normalizedSecret)
  }

  async deleteCredential(providerId: string): Promise<ProviderCredentialStatus> {
    const normalizedProviderId = normalizeProviderId(providerId)
    this.sessionCredentials.delete(normalizedProviderId)
    const record = await this.readRecord()
    delete record.credentials[normalizedProviderId]
    if (this.encryption.isEncryptionAvailable() || Object.keys(record.credentials).length > 0) {
      await this.writeRecord(record)
    }

    return createCredentialStatus(normalizedProviderId)
  }

  private async readRecord(): Promise<PersistedCredentialStoreRecord> {
    try {
      const parsed = JSON.parse(await readFile(this.filePath, 'utf8')) as unknown
      return normalizePersistedCredentialStoreRecord(parsed)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return createEmptyRecord()
      }

      if (error instanceof SyntaxError) {
        const record = createEmptyRecord()
        await this.writeRecord(record)
        return record
      }

      throw error
    }
  }

  private async writeRecord(record: PersistedCredentialStoreRecord): Promise<void> {
    const serialized = `${JSON.stringify(record, null, 2)}\n`
    const temporaryFilePath = `${this.filePath}.tmp`

    await mkdir(path.dirname(this.filePath), { recursive: true })
    await writeFile(temporaryFilePath, serialized, { encoding: 'utf8', mode: 0o600 })
    await rename(temporaryFilePath, this.filePath)
  }
}
