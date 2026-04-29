import type { RunSelectedProposalVariantRecord } from '../../contracts/api-records.js'
import type { ApiServerConfig } from '../../config.js'
import {
  resolveModelBindingForRole,
  resolveModelGatewayProjectMode,
} from './model-binding.js'

import {
  createSceneProseWriterFixtureProvider,
  FIXTURE_SCENE_PROSE_WRITER_MODEL_ID,
} from './sceneProseWriterFixtureProvider.js'
import {
  createSceneProseWriterOpenAiResponsesProvider,
  type SceneProseWriterOpenAiResponsesProviderOptions,
} from './sceneProseWriterOpenAiResponsesProvider.js'
import {
  ModelGatewayBindingNotAllowedError,
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
      fallbackUsed: boolean
      provider: 'fixture'
      modelId: string
      projectMode: 'demo-fixture' | 'real-project'
      fallbackReason?: SceneProseWriterGatewayFallbackReason
      latencyMs?: number
    }
  | {
      fallbackUsed: boolean
      provider: 'openai-compatible'
      providerId: string
      providerLabel: string
      modelId: string
      projectMode: 'demo-fixture' | 'real-project'
      fallbackReason?: SceneProseWriterGatewayFallbackReason
      latencyMs?: number
      repairAttempted?: boolean
    }

export interface SceneProseWriterGatewayResult {
  output: SceneProseWriterOutput
  provenance: SceneProseWriterGatewayProvenance
}

export interface SceneProseWriterProvider {
  generate(request: SceneProseWriterGatewayRequest): Promise<unknown>
}

export interface SceneProseWriterGatewayConfig
  extends Pick<ApiServerConfig, 'currentProject' | 'modelBindings' | 'modelProvider' | 'openAiModel' | 'openAiApiKey'> {}

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
    const projectMode = resolveModelGatewayProjectMode(config)
    return {
      output: parseSceneProseWriterOutput(await fixtureProvider.generate(request)),
      provenance: {
        fallbackUsed: false,
        provider: 'fixture',
        modelId: FIXTURE_SCENE_PROSE_WRITER_MODEL_ID,
        projectMode,
      },
    }
  }

  return {
    async generate(request: SceneProseWriterGatewayRequest): Promise<SceneProseWriterGatewayResult> {
      const role = request.task === 'revision' ? 'sceneRevision' : 'sceneProseWriter'
      const binding = resolveModelBindingForRole(config, role)
      const projectMode = resolveModelGatewayProjectMode(config)

      if (binding.provider !== 'openai-compatible') {
        if (projectMode === 'real-project') {
          throw new ModelGatewayBindingNotAllowedError({
            projectMode,
            role,
          })
        }

        return renderFixtureResult(request)
      }

      if (!binding.modelId || !binding.apiKey) {
        throw new ModelGatewayMissingConfigError({
          provider: 'openai-compatible',
          projectMode,
          role,
        })
      }

      const openAiProvider = dependencies.openAiProvider ?? openAiProviderFactory({
        modelId: binding.modelId,
        apiKey: binding.apiKey,
        baseUrl: binding.baseUrl,
      })

      const startedAt = Date.now()
      let payload: unknown
      try {
        payload = await openAiProvider.generate(request)
      } catch (error) {
        const isRateLimit = error instanceof Error && (
          error.message.includes('rate_limit') ||
          error.message.includes('429')
        )
        throw new ModelGatewayExecutionError({
          failureClass: isRateLimit ? 'rate_limited' : 'provider_error',
          message: isRateLimit
            ? 'OpenAI-compatible provider returned a rate limit error.'
            : 'OpenAI-compatible provider request failed.',
          modelId: binding.modelId,
          provider: 'openai-compatible',
          providerId: binding.providerId,
          providerLabel: binding.providerLabel,
          projectMode,
          fallbackUsed: false,
          retryable: isRateLimit,
          role,
        })
      }

      const firstLatencyMs = Date.now() - startedAt

      try {
        return {
          output: parseSceneProseWriterOutput(payload),
          provenance: {
            fallbackUsed: false,
            provider: 'openai-compatible' as const,
            providerId: binding.providerId,
            providerLabel: binding.providerLabel,
            modelId: binding.modelId,
            projectMode,
            latencyMs: firstLatencyMs,
          },
        }
      } catch {
        // Attempt one repair retry
        try {
          const repairPayload = await openAiProvider.generate({
            ...request,
            instructions: 'The previous output did not match the required JSON schema. Return only valid JSON matching the schema.',
            input: 'Previous output was invalid. Return only valid JSON matching the required schema.',
          })
          const repairLatencyMs = Date.now() - startedAt
          return {
            output: parseSceneProseWriterOutput(repairPayload),
            provenance: {
              fallbackUsed: false,
              provider: 'openai-compatible' as const,
              providerId: binding.providerId,
              providerLabel: binding.providerLabel,
              modelId: binding.modelId,
              projectMode,
              latencyMs: repairLatencyMs,
              repairAttempted: true,
            },
          }
        } catch {
          throw new ModelGatewayExecutionError({
            failureClass: 'invalid_output',
            message: 'OpenAI-compatible provider returned invalid structured prose output. Repair retry also failed.',
            modelId: binding.modelId,
            provider: 'openai-compatible',
            providerId: binding.providerId,
            providerLabel: binding.providerLabel,
            projectMode,
            fallbackUsed: false,
            retryable: false,
            role,
          })
        }
      }
    },
  }
}
