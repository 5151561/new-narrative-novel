import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'

import type {
  ProviderCredentialProvider,
  ProviderCredentialStatus,
} from '../shared/desktop-bridge-types.js'

interface PersistedCredentialRecord {
  encoding: 'plain' | 'safeStorage'
  value: string
}

interface PersistedCredentialStoreRecord {
  credentials: Partial<Record<ProviderCredentialProvider, PersistedCredentialRecord>>
}

export interface CredentialStoreEncryption {
  decryptString(value: string): string
  encryptString(value: string): string
  isEncryptionAvailable(): boolean
}

const PROVIDER_CREDENTIALS_FILE = 'provider-credentials.json'
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

  const normalizedEntries = Object.entries(credentials).filter((entry): entry is [
    ProviderCredentialProvider,
    PersistedCredentialRecord,
  ] => entry[0] === 'openai' && entry[1]?.encoding === 'safeStorage' && isPersistedCredentialRecord(entry[1]))

  return {
    credentials: Object.fromEntries(normalizedEntries),
  }
}

export class CredentialStore {
  private readonly filePath: string
  private readonly encryption: CredentialStoreEncryption
  private readonly sessionCredentials = new Map<ProviderCredentialProvider, string>()

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

  async getCredentialStatus(provider: ProviderCredentialProvider): Promise<ProviderCredentialStatus> {
    const secret = await this.getRawCredential(provider)
    if (!secret) {
      return {
        configured: false,
        provider,
      }
    }

    return {
      configured: true,
      provider,
      redactedValue: redactSecret(secret),
    }
  }

  async getRawCredential(provider: ProviderCredentialProvider): Promise<string | null> {
    const sessionCredential = this.sessionCredentials.get(provider)
    if (sessionCredential) {
      return sessionCredential
    }

    const record = await this.readRecord()
    const persisted = record.credentials[provider]
    if (!persisted) {
      return null
    }

    if (!this.encryption.isEncryptionAvailable()) {
      return null
    }

    return this.encryption.decryptString(persisted.value)
  }

  async saveCredential(provider: ProviderCredentialProvider, secret: string): Promise<ProviderCredentialStatus> {
    const normalizedSecret = secret.trim()
    this.sessionCredentials.set(provider, normalizedSecret)

    if (this.encryption.isEncryptionAvailable()) {
      const record = await this.readRecord()
      record.credentials[provider] = {
        encoding: 'safeStorage',
        value: this.encryption.encryptString(normalizedSecret),
      }

      await this.writeRecord(record)
    }

    return this.getCredentialStatus(provider)
  }

  async deleteCredential(provider: ProviderCredentialProvider): Promise<ProviderCredentialStatus> {
    this.sessionCredentials.delete(provider)
    const record = await this.readRecord()
    delete record.credentials[provider]
    if (this.encryption.isEncryptionAvailable() || Object.keys(record.credentials).length > 0) {
      await this.writeRecord(record)
    }

    return {
      configured: false,
      provider,
    }
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
