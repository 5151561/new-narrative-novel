import type { RunSelectedProposalVariantRecord } from '../../contracts/api-records.js'
import type { ApiServerConfig } from '../../config.js'
import { resolveModelBindingForRole } from './model-binding.js'

import {
  createSceneProseWriterFixtureProvider,
  FIXTURE_SCENE_PROSE_WRITER_MODEL_ID,
} from './sceneProseWriterFixtureProvider.js'
import {
  createSceneProseWriterOpenAiResponsesProvider,
  type SceneProseWriterOpenAiResponsesProviderOptions,
} from './sceneProseWriterOpenAiResponsesProvider.js'
import {
  ModelGatewayExecutionError,
  ModelGatewayMissingConfigError,
} from './modelGatewayErrors.js'
import {
  parseSceneProseWriterOutput,
  type SceneProseWriterOutput,
} from './sceneProseWriterOutputSchema.js'

export interface SceneProseWriterGatewayRequest {
  task: 'draft' | 'revision'
  sceneId: string
  decision: 'accept' | 'accept-with-edit'
  acceptedProposalIds: string[]
  selectedVariants?: RunSelectedProposalVariantRecord[]
  revisionMode?: 'rewrite' | 'compress' | 'expand' | 'tone_adjust' | 'continuity_fix'
  currentProse?: string
  sourceProseDraftId?: string
  sourceCanonPatchId?: string
  contextPacketId?: string
  instruction?: string
  instructions: string
  input: string
}

export type SceneProseWriterGatewayFallbackReason =
  | 'missing-config'
  | 'provider-error'
  | 'invalid-output'

export type SceneProseWriterGatewayProvenance =
  | {
      provider: 'fixture'
      modelId: string
      fallbackReason?: SceneProseWriterGatewayFallbackReason
    }
  | {
      provider: 'openai-compatible'
      providerId: string
      providerLabel: string
      modelId: string
      fallbackReason?: SceneProseWriterGatewayFallbackReason
    }

export interface SceneProseWriterGatewayResult {
  output: SceneProseWriterOutput
  provenance: SceneProseWriterGatewayProvenance
}

export interface SceneProseWriterProvider {
  generate(request: SceneProseWriterGatewayRequest): Promise<unknown>
}

export interface SceneProseWriterGatewayConfig
  extends Pick<ApiServerConfig, 'modelBindings' | 'modelProvider' | 'openAiModel' | 'openAiApiKey'> {}

export interface SceneProseWriterGatewayDependencies {
  fixtureProvider?: SceneProseWriterProvider
  openAiProvider?: SceneProseWriterProvider
  openAiProviderFactory?: (options: SceneProseWriterOpenAiResponsesProviderOptions) => SceneProseWriterProvider
}

export function createSceneProseWriterGateway(
  config: SceneProseWriterGatewayConfig,
  dependencies: SceneProseWriterGatewayDependencies = {},
) {
  const fixtureProvider = dependencies.fixtureProvider ?? createSceneProseWriterFixtureProvider()
  const openAiProviderFactory = dependencies.openAiProviderFactory ?? createSceneProseWriterOpenAiResponsesProvider

  async function renderFixtureResult(
    request: SceneProseWriterGatewayRequest,
  ): Promise<SceneProseWriterGatewayResult> {
    return {
      output: parseSceneProseWriterOutput(await fixtureProvider.generate(request)),
      provenance: {
        provider: 'fixture',
        modelId: FIXTURE_SCENE_PROSE_WRITER_MODEL_ID,
      },
    }
  }

  return {
    async generate(request: SceneProseWriterGatewayRequest): Promise<SceneProseWriterGatewayResult> {
      const binding = resolveModelBindingForRole(
        config,
        request.task === 'revision' ? 'sceneRevision' : 'sceneProseWriter',
      )

      if (binding.provider !== 'openai-compatible') {
        return renderFixtureResult(request)
      }

      if (!binding.modelId || !binding.apiKey) {
        throw new ModelGatewayMissingConfigError({
          provider: 'openai-compatible',
          role: request.task === 'revision' ? 'sceneRevision' : 'sceneProseWriter',
        })
      }

      const openAiProvider = dependencies.openAiProvider ?? openAiProviderFactory({
        modelId: binding.modelId,
        apiKey: binding.apiKey,
        baseUrl: binding.baseUrl,
      })

      let payload: unknown
      try {
        payload = await openAiProvider.generate(request)
      } catch {
        throw new ModelGatewayExecutionError({
          failureClass: 'provider_error',
          message: 'OpenAI-compatible provider request failed.',
          modelId: binding.modelId,
          provider: 'openai-compatible',
          providerId: binding.providerId,
          providerLabel: binding.providerLabel,
          retryable: true,
          role: request.task === 'revision' ? 'sceneRevision' : 'sceneProseWriter',
        })
      }

      try {
        return {
          output: parseSceneProseWriterOutput(payload),
          provenance: {
            provider: 'openai-compatible',
            providerId: binding.providerId,
            providerLabel: binding.providerLabel,
            modelId: binding.modelId,
          },
        }
      } catch {
        throw new ModelGatewayExecutionError({
          failureClass: 'invalid_output',
          message: 'OpenAI-compatible provider returned invalid structured prose output.',
          modelId: binding.modelId,
          provider: 'openai-compatible',
          providerId: binding.providerId,
          providerLabel: binding.providerLabel,
          retryable: true,
          role: request.task === 'revision' ? 'sceneRevision' : 'sceneProseWriter',
        })
      }
    },
  }
}
