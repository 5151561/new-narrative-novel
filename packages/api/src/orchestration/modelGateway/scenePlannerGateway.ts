import type { ApiServerConfig } from '../../config.js'
import { resolveModelBindingForRole } from './model-binding.js'
import { createScenePlannerFixtureProvider, FIXTURE_SCENE_PLANNER_MODEL_ID } from './scenePlannerFixtureProvider.js'
import {
  createScenePlannerOpenAiResponsesProvider,
  type ScenePlannerOpenAiResponsesProviderOptions,
} from './scenePlannerOpenAiResponsesProvider.js'
import {
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

export interface ScenePlannerGatewayProvenance {
  provider: 'fixture' | 'openai'
  modelId: string
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
  extends Pick<ApiServerConfig, 'modelBindings' | 'modelProvider' | 'openAiModel' | 'openAiApiKey'> {}

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
    return {
      output: parseScenePlannerOutput(await fixtureProvider.generate(request)),
      provenance: {
        provider: 'fixture',
        modelId: FIXTURE_SCENE_PLANNER_MODEL_ID,
      },
    }
  }

  return {
    async generate(request: ScenePlannerGatewayRequest): Promise<ScenePlannerGatewayResult> {
      const binding = resolveModelBindingForRole(config, 'planner')

      if (binding.provider !== 'openai') {
        return renderFixtureResult(request)
      }

      if (!binding.modelId || !binding.apiKey) {
        throw new ModelGatewayMissingConfigError({
          provider: 'openai',
          role: 'planner',
        })
      }

      const openAiProvider = dependencies.openAiProvider ?? openAiProviderFactory({
        modelId: binding.modelId,
        apiKey: binding.apiKey,
      })

      let payload: unknown
      try {
        payload = await openAiProvider.generate(request)
      } catch {
        throw new ModelGatewayExecutionError({
          failureClass: 'provider_error',
          message: 'OpenAI provider request failed.',
          modelId: binding.modelId,
          provider: 'openai',
          retryable: true,
          role: 'planner',
        })
      }

      try {
        return {
          output: parseScenePlannerOutput(payload),
          provenance: {
            provider: 'openai',
            modelId: binding.modelId,
          },
        }
      } catch {
        throw new ModelGatewayExecutionError({
          failureClass: 'invalid_output',
          message: 'OpenAI provider returned invalid structured planner output.',
          modelId: binding.modelId,
          provider: 'openai',
          retryable: true,
          role: 'planner',
        })
      }
    },
  }
}
