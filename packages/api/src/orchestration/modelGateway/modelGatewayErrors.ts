export type ModelGatewayRole = 'planner' | 'sceneProseWriter' | 'sceneRevision'
export type ModelGatewayProvider = 'openai-compatible'
export type ModelGatewayFailureClass = 'provider_error' | 'invalid_output'

interface ModelGatewayMissingConfigInput {
  provider: ModelGatewayProvider
  role: ModelGatewayRole
}

interface ModelGatewayExecutionInput {
  failureClass: ModelGatewayFailureClass
  message: string
  modelId: string
  provider: ModelGatewayProvider
  providerId?: string
  providerLabel?: string
  retryable: boolean
  role: ModelGatewayRole
}

export class ModelGatewayMissingConfigError extends Error {
  readonly code = 'MODEL_GATEWAY_MISSING_CONFIG'
  readonly provider: ModelGatewayProvider
  readonly role: ModelGatewayRole

  constructor(input: ModelGatewayMissingConfigInput) {
    super(`Model settings for ${input.role} are incomplete.`)
    this.name = 'ModelGatewayMissingConfigError'
    this.provider = input.provider
    this.role = input.role
  }
}

export class ModelGatewayExecutionError extends Error {
  readonly failureClass: ModelGatewayFailureClass
  readonly modelId: string
  readonly provider: ModelGatewayProvider
  readonly providerId?: string
  readonly providerLabel?: string
  readonly retryable: boolean
  readonly role: ModelGatewayRole

  constructor(input: ModelGatewayExecutionInput) {
    super(input.message)
    this.name = 'ModelGatewayExecutionError'
    this.failureClass = input.failureClass
    this.modelId = input.modelId
    this.provider = input.provider
    this.providerId = input.providerId
    this.providerLabel = input.providerLabel
    this.retryable = input.retryable
    this.role = input.role
  }
}

export function isModelGatewayMissingConfigError(error: unknown): error is ModelGatewayMissingConfigError {
  return error instanceof ModelGatewayMissingConfigError
}

export function isModelGatewayExecutionError(error: unknown): error is ModelGatewayExecutionError {
  return error instanceof ModelGatewayExecutionError
}
