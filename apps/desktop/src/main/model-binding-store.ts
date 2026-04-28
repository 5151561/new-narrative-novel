import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'

import {
  DESKTOP_MODEL_BINDING_ROLES,
  type DesktopModelBinding,
  type DesktopModelBindingRole,
  type DesktopModelBindings,
  type UpdateModelBindingInput,
} from '../shared/desktop-bridge-types.js'

interface PersistedModelBindingStoreRecord {
  bindings: Partial<Record<DesktopModelBindingRole, DesktopModelBinding>>
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
  async readBindings(projectRoot: string): Promise<DesktopModelBindings> {
    const filePath = buildStoreFilePath(projectRoot)

    try {
      const parsed = JSON.parse(await readFile(filePath, 'utf8')) as unknown
      return this.normalizeRecord(parsed)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return { ...DEFAULT_DESKTOP_MODEL_BINDINGS }
      }

      if (error instanceof SyntaxError) {
        const defaults = { ...DEFAULT_DESKTOP_MODEL_BINDINGS }
        await this.writeBindings(projectRoot, defaults)
        return defaults
      }

      throw error
    }
  }

  async updateBinding(projectRoot: string, input: UpdateModelBindingInput): Promise<DesktopModelBindings> {
    const bindings = await this.readBindings(projectRoot)
    const nextBindings: DesktopModelBindings = {
      ...bindings,
      [input.role]: normalizeBinding(input.binding),
    }

    await this.writeBindings(projectRoot, nextBindings)
    return nextBindings
  }

  private normalizeRecord(value: unknown): DesktopModelBindings {
    if (!value || typeof value !== 'object') {
      return { ...DEFAULT_DESKTOP_MODEL_BINDINGS }
    }

    const bindings = (value as Partial<PersistedModelBindingStoreRecord>).bindings
    if (!bindings || typeof bindings !== 'object') {
      return { ...DEFAULT_DESKTOP_MODEL_BINDINGS }
    }

    return DESKTOP_MODEL_BINDING_ROLES.reduce<DesktopModelBindings>((result, role) => {
      const candidate = bindings[role]
      result[role] = isDesktopModelBinding(candidate)
        ? normalizeBinding(candidate)
        : DEFAULT_DESKTOP_MODEL_BINDINGS[role]
      return result
    }, { ...DEFAULT_DESKTOP_MODEL_BINDINGS })
  }

  private async writeBindings(projectRoot: string, bindings: DesktopModelBindings): Promise<void> {
    const filePath = buildStoreFilePath(projectRoot)
    const serialized = `${JSON.stringify({ bindings }, null, 2)}\n`
    const temporaryFilePath = `${filePath}.tmp`

    await mkdir(path.dirname(filePath), { recursive: true })
    await writeFile(temporaryFilePath, serialized, 'utf8')
    await rename(temporaryFilePath, filePath)
  }
}
