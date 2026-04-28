import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'

import {
  type DesktopModelConnectionTestRecord,
  DESKTOP_MODEL_BINDING_ROLES,
  type DesktopModelBinding,
  type DesktopModelBindingRole,
  type DesktopModelBindings,
  type OpenAiCompatibleProviderProfile,
  type UpdateModelBindingInput,
} from '../shared/desktop-bridge-types.js'

interface PersistedModelBindingStoreRecord {
  providers?: OpenAiCompatibleProviderProfile[]
  bindings?: Partial<Record<DesktopModelBindingRole, DesktopModelBinding | LegacyDesktopModelBinding>>
  connectionTest?: DesktopModelConnectionTestRecord
}

interface LegacyDesktopModelBinding {
  provider: 'openai'
  modelId?: string
}

export interface DesktopModelSettingsStoreRecord {
  providers: OpenAiCompatibleProviderProfile[]
  bindings: DesktopModelBindings
  connectionTest: DesktopModelConnectionTestRecord
}

const DEFAULT_CONNECTION_TEST: DesktopModelConnectionTestRecord = {
  status: 'never',
}

const DEFAULT_PROVIDER_PROFILE: OpenAiCompatibleProviderProfile = {
  baseUrl: 'https://api.openai.com/v1',
  id: 'openai-default',
  label: 'OpenAI',
}
const RESERVED_PROVIDER_IDS = new Set(['openai', DEFAULT_PROVIDER_PROFILE.id])

export const DEFAULT_DESKTOP_MODEL_BINDINGS: DesktopModelBindings = {
  continuityReviewer: {
    provider: 'fixture',
  },
  planner: {
    provider: 'fixture',
  },
  sceneProseWriter: {
    provider: 'fixture',
  },
  sceneRevision: {
    provider: 'fixture',
  },
  summary: {
    provider: 'fixture',
  },
}

function normalizeOptionalString(value?: string): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function normalizeProviderProfile(profile: OpenAiCompatibleProviderProfile): OpenAiCompatibleProviderProfile {
  const id = normalizeOptionalString(profile.id)
  const label = normalizeOptionalString(profile.label)
  const baseUrl = normalizeOptionalString(profile.baseUrl)
  if (!id || !label || !baseUrl) {
    throw new Error('Provider profiles require id, label, and baseUrl.')
  }

  return {
    baseUrl,
    id,
    label,
  }
}

function normalizeBinding(binding: DesktopModelBinding | LegacyDesktopModelBinding): DesktopModelBinding {
  if (binding.provider === 'fixture') {
    return {
      provider: 'fixture',
    }
  }

  if (binding.provider === 'openai') {
    const modelId = normalizeOptionalString(binding.modelId)
    if (!modelId) {
      return {
        provider: 'fixture',
      }
    }

    return {
      modelId,
      provider: 'openai-compatible',
      providerId: DEFAULT_PROVIDER_PROFILE.id,
    }
  }

  const modelId = normalizeOptionalString(binding.modelId)
  const providerId = normalizeOptionalString(binding.providerId)
  if (!modelId || !providerId) {
    throw new Error('OpenAI-compatible model bindings require providerId and modelId.')
  }

  return {
    modelId,
    provider: 'openai-compatible',
    providerId,
  }
}

function isDesktopModelBinding(value: unknown): value is DesktopModelBinding | LegacyDesktopModelBinding {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as {
    provider?: unknown
    modelId?: unknown
    providerId?: unknown
  }
  if (candidate.provider === 'fixture') {
    return true
  }

  if (candidate.provider === 'openai') {
    return typeof candidate.modelId === 'string'
  }

  return (
    candidate.provider === 'openai-compatible'
    && typeof candidate.modelId === 'string'
    && candidate.modelId.trim().length > 0
    && typeof candidate.providerId === 'string'
    && candidate.providerId.trim().length > 0
  )
}

function buildStoreFilePath(projectRoot: string): string {
  return path.join(projectRoot, '.narrative', 'model-bindings.json')
}

function ensureDefaultProviderIfReferenced(
  providers: OpenAiCompatibleProviderProfile[],
  bindings: DesktopModelBindings,
): OpenAiCompatibleProviderProfile[] {
  const needsDefaultProvider = DESKTOP_MODEL_BINDING_ROLES.some((role) => {
    const binding = bindings[role]
    return binding.provider === 'openai-compatible' && binding.providerId === DEFAULT_PROVIDER_PROFILE.id
  })

  if (!needsDefaultProvider || providers.some((provider) => provider.id === DEFAULT_PROVIDER_PROFILE.id)) {
    return providers
  }

  return [...providers, DEFAULT_PROVIDER_PROFILE]
}

export class ModelBindingStore {
  async readModelSettingsRecord(projectRoot: string): Promise<DesktopModelSettingsStoreRecord> {
    const filePath = buildStoreFilePath(projectRoot)

    try {
      const parsed = JSON.parse(await readFile(filePath, 'utf8')) as unknown
      return this.normalizeRecord(parsed)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return {
          bindings: { ...DEFAULT_DESKTOP_MODEL_BINDINGS },
          connectionTest: { ...DEFAULT_CONNECTION_TEST },
          providers: [],
        }
      }

      if (error instanceof SyntaxError) {
        const defaults = {
          bindings: { ...DEFAULT_DESKTOP_MODEL_BINDINGS },
          connectionTest: { ...DEFAULT_CONNECTION_TEST },
          providers: [],
        }
        await this.writeRecord(projectRoot, defaults)
        return defaults
      }

      throw error
    }
  }

  async readBindings(projectRoot: string): Promise<DesktopModelBindings> {
    return (await this.readModelSettingsRecord(projectRoot)).bindings
  }

  async readProviderProfiles(projectRoot: string): Promise<OpenAiCompatibleProviderProfile[]> {
    return (await this.readModelSettingsRecord(projectRoot)).providers
  }

  async saveProviderProfile(projectRoot: string, profile: OpenAiCompatibleProviderProfile): Promise<OpenAiCompatibleProviderProfile[]> {
    const record = await this.readModelSettingsRecord(projectRoot)
    const normalizedProfile = normalizeProviderProfile(profile)
    const nextProviders = [...record.providers]
    const existingIndex = nextProviders.findIndex((candidate) => candidate.id === normalizedProfile.id)
    if (existingIndex < 0 && RESERVED_PROVIDER_IDS.has(normalizedProfile.id)) {
      throw new Error(`Provider profile id ${normalizedProfile.id} is reserved.`)
    }

    if (existingIndex >= 0) {
      nextProviders[existingIndex] = normalizedProfile
    } else {
      nextProviders.push(normalizedProfile)
    }

    await this.writeRecord(projectRoot, {
      bindings: record.bindings,
      connectionTest: { ...DEFAULT_CONNECTION_TEST },
      providers: nextProviders,
    })

    return nextProviders
  }

  async deleteProviderProfile(projectRoot: string, providerId: string): Promise<OpenAiCompatibleProviderProfile[]> {
    const record = await this.readModelSettingsRecord(projectRoot)
    const normalizedProviderId = normalizeOptionalString(providerId)
    if (!normalizedProviderId) {
      throw new Error('providerId must be a non-empty string.')
    }

    const nextProviders = record.providers.filter((provider) => provider.id !== normalizedProviderId)
    const nextBindings = DESKTOP_MODEL_BINDING_ROLES.reduce<DesktopModelBindings>((result, role) => {
      const binding = record.bindings[role]
      result[role] = binding.provider === 'openai-compatible' && binding.providerId === normalizedProviderId
        ? { provider: 'fixture' }
        : binding
      return result
    }, { ...record.bindings })

    await this.writeRecord(projectRoot, {
      bindings: nextBindings,
      connectionTest: { ...DEFAULT_CONNECTION_TEST },
      providers: nextProviders,
    })

    return nextProviders
  }

  async updateBinding(projectRoot: string, input: UpdateModelBindingInput): Promise<DesktopModelBindings> {
    const record = await this.readModelSettingsRecord(projectRoot)
    const nextBinding = normalizeBinding(input.binding)
    if (
      nextBinding.provider === 'openai-compatible'
      && !record.providers.some((provider) => provider.id === nextBinding.providerId)
    ) {
      throw new Error(`Unknown provider profile: ${nextBinding.providerId}`)
    }

    const nextBindings: DesktopModelBindings = {
      ...record.bindings,
      [input.role]: nextBinding,
    }

    await this.writeRecord(projectRoot, {
      bindings: nextBindings,
      connectionTest: { ...DEFAULT_CONNECTION_TEST },
      providers: record.providers,
    })
    return nextBindings
  }

  async resetConnectionTest(projectRoot: string): Promise<DesktopModelConnectionTestRecord> {
    const record = await this.readModelSettingsRecord(projectRoot)
    const nextConnectionTest = { ...DEFAULT_CONNECTION_TEST }
    await this.writeRecord(projectRoot, {
      ...record,
      connectionTest: nextConnectionTest,
    })
    return nextConnectionTest
  }

  async writeConnectionTest(
    projectRoot: string,
    connectionTest: DesktopModelConnectionTestRecord,
  ): Promise<DesktopModelConnectionTestRecord> {
    const record = await this.readModelSettingsRecord(projectRoot)
    const nextConnectionTest = normalizeConnectionTest(connectionTest)
    await this.writeRecord(projectRoot, {
      ...record,
      connectionTest: nextConnectionTest,
    })
    return nextConnectionTest
  }

  private normalizeRecord(value: unknown): DesktopModelSettingsStoreRecord {
    if (!value || typeof value !== 'object') {
      return {
        bindings: { ...DEFAULT_DESKTOP_MODEL_BINDINGS },
        connectionTest: { ...DEFAULT_CONNECTION_TEST },
        providers: [],
      }
    }

    const candidate = value as Partial<PersistedModelBindingStoreRecord>
    const providers = Array.isArray(candidate.providers)
      ? candidate.providers.map(normalizeProviderProfile)
      : []
    const bindings = candidate.bindings
    const connectionTest = normalizeConnectionTest(candidate.connectionTest)

    const normalizedBindings = !bindings || typeof bindings !== 'object'
      ? { ...DEFAULT_DESKTOP_MODEL_BINDINGS }
      : DESKTOP_MODEL_BINDING_ROLES.reduce<DesktopModelBindings>((result, role) => {
        const bindingCandidate = bindings[role]
        result[role] = isDesktopModelBinding(bindingCandidate)
          ? normalizeBinding(bindingCandidate)
          : DEFAULT_DESKTOP_MODEL_BINDINGS[role]
        return result
      }, { ...DEFAULT_DESKTOP_MODEL_BINDINGS })

    return {
      bindings: normalizedBindings,
      connectionTest,
      providers: ensureDefaultProviderIfReferenced(providers, normalizedBindings),
    }
  }

  private async writeRecord(projectRoot: string, record: DesktopModelSettingsStoreRecord): Promise<void> {
    const filePath = buildStoreFilePath(projectRoot)
    const serialized = `${JSON.stringify(record, null, 2)}\n`
    const temporaryFilePath = `${filePath}.tmp`

    await mkdir(path.dirname(filePath), { recursive: true })
    await writeFile(temporaryFilePath, serialized, 'utf8')
    await rename(temporaryFilePath, filePath)
  }
}

function normalizeConnectionTest(value: unknown): DesktopModelConnectionTestRecord {
  if (!value || typeof value !== 'object') {
    return { ...DEFAULT_CONNECTION_TEST }
  }

  const candidate = value as Partial<DesktopModelConnectionTestRecord>
  if (candidate.status !== 'passed' && candidate.status !== 'failed' && candidate.status !== 'never') {
    return { ...DEFAULT_CONNECTION_TEST }
  }

  return {
    ...(candidate.errorCode ? { errorCode: candidate.errorCode } : {}),
    status: candidate.status,
    ...(candidate.summary ? { summary: candidate.summary } : {}),
  }
}
