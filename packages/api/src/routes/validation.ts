import { badRequest } from '../http/errors.js'

export function assertRequiredString(
  value: unknown,
  field: string,
  options: {
    code: string
    detail: unknown
    allowEmpty?: boolean
  },
): string {
  if (typeof value !== 'string') {
    throw badRequest(`${field} must be a string.`, {
      code: options.code,
      detail: options.detail,
    })
  }

  if (!options.allowEmpty && value.trim() === '') {
    throw badRequest(`${field} must not be empty.`, {
      code: options.code,
      detail: options.detail,
    })
  }

  return value
}

export function assertOptionalString(
  value: unknown,
  field: string,
  options: {
    code: string
    detail: unknown
    allowEmpty?: boolean
  },
) {
  if (value === undefined) {
    return undefined
  }

  if (typeof value !== 'string') {
    throw badRequest(`${field} must be a string when provided.`, {
      code: options.code,
      detail: options.detail,
    })
  }

  if (!options.allowEmpty && value.trim() === '') {
    throw badRequest(`${field} must not be empty when provided.`, {
      code: options.code,
      detail: options.detail,
    })
  }

  return value
}

export function assertEnumValue<T extends string>(
  value: unknown,
  field: string,
  allowedValues: readonly T[],
  options: {
    code: string
    detail: unknown
    allowedValuesDetailKey: string
  },
): T {
  if (typeof value !== 'string' || !allowedValues.includes(value as T)) {
    throw badRequest(`Unsupported ${field} "${String(value)}".`, {
      code: options.code,
      detail: {
        ...((options.detail && typeof options.detail === 'object') ? options.detail as Record<string, unknown> : { detail: options.detail }),
        [options.allowedValuesDetailKey]: allowedValues,
      },
    })
  }

  return value as T
}
