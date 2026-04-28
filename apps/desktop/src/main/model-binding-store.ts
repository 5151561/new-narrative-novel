import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'

import {
  type DesktopModelConnectionTestRecord,
  DESKTOP_MODEL_BINDING_ROLES,
  type DesktopModelBinding,
  type DesktopModelBindingRole,
  type DesktopModelBindings,
  type UpdateModelBindingInput,
} from '../shared/desktop-bridge-types.js'

interface PersistedModelBindingStoreRecord {
  bindings: Partial<Record<DesktopModelBindingRole, DesktopModelBinding>>
  connectionTest?: DesktopModelConnectionTestRecord
}

export interface DesktopModelSettingsStoreRecord {
  bindings: DesktopModelBindings
  connectionTest: DesktopModelConnectionTestRecord
}

const DEFAULT_CONNECTION_TEST: DesktopModelConnectionTestRecord = {
  status: 'never',
}

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

function normalizeBinding(binding: DesktopModelBinding): DesktopModelBinding {
  if (binding.provider === 'fixture') {
    return {
      provider: 'fixture',
    }
  }

  const modelId = binding.modelId?.trim()
  if (!modelId) {
    throw new Error('OpenAI model bindings require a modelId.')
  }

  return {
    modelId,
    provider: 'openai',
  }
}

function isDesktopModelBinding(value: unknown): value is DesktopModelBinding {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<DesktopModelBinding>
  if (candidate.provider === 'fixture') {
    return true
  }

  return candidate.provider === 'openai' && typeof candidate.modelId === 'string' && candidate.modelId.trim().length > 0
}

function buildStoreFilePath(projectRoot: string): string {
  return path.join(projectRoot, '.narrative', 'model-bindings.json')
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
        }
      }

      if (error instanceof SyntaxError) {
        const defaults = {
          bindings: { ...DEFAULT_DESKTOP_MODEL_BINDINGS },
          connectionTest: { ...DEFAULT_CONNECTION_TEST },
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

  async updateBinding(projectRoot: string, input: UpdateModelBindingInput): Promise<DesktopModelBindings> {
    const record = await this.readModelSettingsRecord(projectRoot)
    const nextBindings: DesktopModelBindings = {
      ...record.bindings,
      [input.role]: normalizeBinding(input.binding),
    }

    await this.writeRecord(projectRoot, {
      bindings: nextBindings,
      connectionTest: { ...DEFAULT_CONNECTION_TEST },
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
      }
    }

    const bindings = (value as Partial<PersistedModelBindingStoreRecord>).bindings
    const connectionTest = normalizeConnectionTest((value as Partial<PersistedModelBindingStoreRecord>).connectionTest)

    const normalizedBindings = !bindings || typeof bindings !== 'object'
      ? { ...DEFAULT_DESKTOP_MODEL_BINDINGS }
      : DESKTOP_MODEL_BINDING_ROLES.reduce<DesktopModelBindings>((result, role) => {
      const candidate = bindings[role]
      result[role] = isDesktopModelBinding(candidate)
        ? normalizeBinding(candidate)
        : DEFAULT_DESKTOP_MODEL_BINDINGS[role]
      return result
    }, { ...DEFAULT_DESKTOP_MODEL_BINDINGS })

    return {
      bindings: normalizedBindings,
      connectionTest,
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
