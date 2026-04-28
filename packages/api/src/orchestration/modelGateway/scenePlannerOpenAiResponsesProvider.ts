import OpenAI from 'openai'

import type { ScenePlannerGatewayRequest, ScenePlannerProvider } from './scenePlannerGateway.js'
import {
  normalizeScenePlannerOpenAiOutput,
  scenePlannerOpenAiOutputSchema,
} from './scenePlannerOutputSchema.js'

export interface ScenePlannerOpenAiClientLike {
  responses: {
    create(request: {
      model: string
      instructions: string
      input: string
      text: {
        format: {
          name: string
          type: 'json_schema'
          strict: boolean
          description: string
          schema: typeof scenePlannerOpenAiOutputSchema
        }
      }
    }): Promise<{
      output_text: string
    }>
  }
}

export interface ScenePlannerOpenAiResponsesProviderOptions {
  modelId: string
  apiKey: string
  client?: ScenePlannerOpenAiClientLike
}

export function createScenePlannerOpenAiResponsesProvider(
  options: ScenePlannerOpenAiResponsesProviderOptions,
): ScenePlannerProvider {
  const client = options.client ?? new OpenAI({
    apiKey: options.apiKey,
  })

  return {
    async generate(request: ScenePlannerGatewayRequest) {
      let response: { output_text: string }
      try {
        response = await client.responses.create({
          model: options.modelId,
          instructions: request.instructions,
          input: request.input,
          text: {
            format: {
              name: 'scene_planner_output',
              type: 'json_schema',
              strict: true,
              description: 'Structured scene planner proposal candidates.',
              schema: scenePlannerOpenAiOutputSchema,
            },
          },
        })
      } catch {
        throw new Error(`OpenAI Responses request failed for planner model ${options.modelId}.`)
      }

      const outputText = response.output_text.trim()
      if (!outputText) {
        return outputText
      }

      try {
        return normalizeScenePlannerOpenAiOutput(JSON.parse(outputText) as unknown)
      } catch {
        return outputText
      }
    },
  }
}
