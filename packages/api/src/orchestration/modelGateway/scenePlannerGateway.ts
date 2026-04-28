import type { ApiServerConfig } from '../../config.js'
import {
  resolveModelBindingForRole,
  resolveModelGatewayProjectMode,
} from './model-binding.js'
import { createScenePlannerFixtureProvider, FIXTURE_SCENE_PLANNER_MODEL_ID } from './scenePlannerFixtureProvider.js'
import {
  createScenePlannerOpenAiResponsesProvider,
  type ScenePlannerOpenAiResponsesProviderOptions,
} from './scenePlannerOpenAiResponsesProvider.js'
import {
  ModelGatewayBindingNotAllowedError,
  ModelGatewayExecutionError,
  ModelGatewayMissingConfigError,
} from './modelGatewayErrors.js'
import {
  parseScenePlannerOutput,
  type ScenePlannerOutput,
} from './scenePlannerOutputSchema.js'

export interface ScenePlannerGatewayRequest {
  sceneId: string
  instructions: string
  input: string
}

export type ScenePlannerGatewayFallbackReason =
  | 'missing-config'
  | 'provider-error'
  | 'invalid-output'

export type ScenePlannerGatewayProvenance =
  | {
      fallbackUsed: boolean
      provider: 'fixture'
      modelId: string
      projectMode: 'demo-fixture' | 'real-project'
      fallbackReason?: ScenePlannerGatewayFallbackReason
    }
  | {
      fallbackUsed: boolean
      provider: 'openai-compatible'
      providerId: string
      providerLabel: string
      modelId: string
      projectMode: 'demo-fixture' | 'real-project'
      fallbackReason?: ScenePlannerGatewayFallbackReason
    }

export interface ScenePlannerGatewayResult {
  output: ScenePlannerOutput
  provenance: ScenePlannerGatewayProvenance
}

export interface ScenePlannerProvider {
  generate(request: ScenePlannerGatewayRequest): Promise<unknown>
}

export interface ScenePlannerGatewayConfig
  extends Pick<ApiServerConfig, 'currentProject' | 'modelBindings' | 'modelProvider' | 'openAiModel' | 'openAiApiKey'> {}

export interface ScenePlannerGatewayDependencies {
  fixtureProvider?: ScenePlannerProvider
  openAiProvider?: ScenePlannerProvider
  openAiProviderFactory?: (options: ScenePlannerOpenAiResponsesProviderOptions) => ScenePlannerProvider
}

export function createScenePlannerGateway(
  config: ScenePlannerGatewayConfig,
  dependencies: ScenePlannerGatewayDependencies = {},
) {
  const fixtureProvider = dependencies.fixtureProvider ?? createScenePlannerFixtureProvider()
  const openAiProviderFactory = dependencies.openAiProviderFactory ?? createScenePlannerOpenAiResponsesProvider

  async function renderFixtureResult(
    request: ScenePlannerGatewayRequest,
  ): Promise<ScenePlannerGatewayResult> {
    const projectMode = resolveModelGatewayProjectMode(config)
    return {
      output: parseScenePlannerOutput(await fixtureProvider.generate(request)),
      provenance: {
        fallbackUsed: false,
        provider: 'fixture',
        modelId: FIXTURE_SCENE_PLANNER_MODEL_ID,
        projectMode,
      },
    }
  }

  return {
    async generate(request: ScenePlannerGatewayRequest): Promise<ScenePlannerGatewayResult> {
      const binding = resolveModelBindingForRole(config, 'planner')
      const projectMode = resolveModelGatewayProjectMode(config)

      if (binding.provider !== 'openai-compatible') {
        if (projectMode === 'real-project') {
          throw new ModelGatewayBindingNotAllowedError({
            projectMode,
            role: 'planner',
          })
        }

        return renderFixtureResult(request)
      }

      if (!binding.modelId || !binding.apiKey) {
        throw new ModelGatewayMissingConfigError({
          provider: 'openai-compatible',
          projectMode,
          role: 'planner',
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
          projectMode,
          fallbackUsed: false,
          retryable: true,
          role: 'planner',
        })
      }

      try {
        return {
          output: parseScenePlannerOutput(payload),
          provenance: {
            fallbackUsed: false,
            provider: 'openai-compatible',
            providerId: binding.providerId,
            providerLabel: binding.providerLabel,
            modelId: binding.modelId,
            projectMode,
          },
        }
      } catch {
        throw new ModelGatewayExecutionError({
          failureClass: 'invalid_output',
          message: 'OpenAI-compatible provider returned invalid structured planner output.',
          modelId: binding.modelId,
          provider: 'openai-compatible',
          providerId: binding.providerId,
          providerLabel: binding.providerLabel,
          projectMode,
          fallbackUsed: false,
          retryable: true,
          role: 'planner',
        })
      }
    },
  }
}
