// src/lib/errors.test.ts
import { describe, it, expect, vi } from 'vitest'
import { ErrorCode, parseAPIError, parseNetworkError } from './errors'

describe('ErrorCode', () => {
  it('has all expected error codes', () => {
    expect(ErrorCode.INVALID_API_KEY).toBe('InvalidApiKey')
    expect(ErrorCode.RATE_LIMIT_EXCEEDED).toBe('RateLimitExceeded')
    expect(ErrorCode.QUOTA_EXCEEDED).toBe('QuotaExceeded')
    expect(ErrorCode.CONTENT_MODERATION_FAILED).toBe('DataInspectionFailed')
    expect(ErrorCode.TASK_FAILED).toBe('TaskFailed')
  })
})

describe('parseAPIError', () => {
  it('parses DashScope API error response', () => {
    const errorText = JSON.stringify({
      code: 'InvalidApiKey',
      message: 'The API key is invalid',
      request_id: 'req-123'
    })

    const result = parseAPIError(errorText, 401)

    expect(result.code).toBe(ErrorCode.INVALID_API_KEY)
    expect(result.userMessage).toBe('API key is invalid or missing')
    expect(result.technicalMessage).toBe('The API key is invalid')
    expect(result.isRetryable).toBe(false)
  })

  it('handles rate limit errors', () => {
    const errorText = JSON.stringify({
      code: 'RateLimitExceeded',
      message: 'Too many requests',
      request_id: 'req-456'
    })

    const result = parseAPIError(errorText, 429)

    expect(result.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED)
    expect(result.isRetryable).toBe(true)
    expect(result.suggestion).toContain('Wait a few minutes')
  })

  it('handles non-JSON errors with status code', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const result = parseAPIError('Unauthorized', 401)

    expect(result.code).toBe(ErrorCode.AUTH_FAILED)
    expect(result.isRetryable).toBe(false)

    consoleSpy.mockRestore()
  })
})

describe('parseNetworkError', () => {
  it('parses timeout errors', () => {
    const error = new Error('Request timeout')
    error.name = 'AbortError'

    const result = parseNetworkError(error)

    expect(result.code).toBe(ErrorCode.TIMEOUT)
    expect(result.isRetryable).toBe(true)
    expect(result.userMessage).toContain('timed out')
  })

  it('parses network errors', () => {
    const error = new Error('Failed to fetch')

    const result = parseNetworkError(error)

    expect(result.code).toBe(ErrorCode.NETWORK_ERROR)
    expect(result.isRetryable).toBe(true)
    expect(result.userMessage).toContain('Network error')
  })

  it('handles unknown errors', () => {
    const error = new Error('Unknown error')

    const result = parseNetworkError(error)

    expect(result.code).toBe(ErrorCode.UNKNOWN)
    expect(result.isRetryable).toBe(false)
  })
})
