import OpenAI from 'openai'

import type { SceneProseWriterGatewayRequest, SceneProseWriterProvider } from './sceneProseWriterGateway.js'
import {
  parseSceneProseWriterOutput,
  sceneProseWriterOpenAiOutputSchema,
} from './sceneProseWriterOutputSchema.js'

export interface SceneProseWriterOpenAiClientLike {
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
          schema: typeof sceneProseWriterOpenAiOutputSchema
        }
      }
    }): Promise<{
      output_text: string
    }>
  }
}

export interface SceneProseWriterOpenAiResponsesProviderOptions {
  modelId: string
  apiKey: string
  client?: SceneProseWriterOpenAiClientLike
}

export function createSceneProseWriterOpenAiResponsesProvider(
  options: SceneProseWriterOpenAiResponsesProviderOptions,
): SceneProseWriterProvider {
  const client = options.client ?? new OpenAI({
    apiKey: options.apiKey,
  })

  return {
    async generate(request: SceneProseWriterGatewayRequest) {
      const response = await client.responses.create({
        model: options.modelId,
        instructions: request.instructions,
        input: request.input,
        text: {
          format: {
            name: 'scene_prose_writer_output',
            type: 'json_schema',
            strict: true,
            description: 'Structured accepted scene prose draft output.',
            schema: sceneProseWriterOpenAiOutputSchema,
          },
        },
      })

      const outputText = response.output_text.trim()
      if (!outputText) {
        return outputText
      }

      try {
        return parseSceneProseWriterOutput(JSON.parse(outputText) as unknown)
      } catch {
        return outputText
      }
    },
  }
}
