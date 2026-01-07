// src/lib/errors.test.ts
import { describe, it, expect, vi } from 'vitest'
import { ErrorCode, parseAPIError, parseNetworkError, type ParsedError } from './errors'

describe('ErrorCode', () => {
  it('has all expected error codes', () => {
    expect(ErrorCode.INVALID_API_KEY).toBe('InvalidApiKey')
    expect(ErrorCode.AUTH_FAILED).toBe('AuthFailed')
    expect(ErrorCode.RATE_LIMIT_EXCEEDED).toBe('RateLimitExceeded')
    expect(ErrorCode.QUOTA_EXCEEDED).toBe('QuotaExceeded')
    expect(ErrorCode.CONTENT_MODERATION_FAILED).toBe('DataInspectionFailed')
    expect(ErrorCode.INVALID_REQUEST).toBe('InvalidRequest')
    expect(ErrorCode.TASK_NOT_FOUND).toBe('TaskNotFound')
    expect(ErrorCode.TASK_FAILED).toBe('TaskFailed')
    expect(ErrorCode.NETWORK_ERROR).toBe('NetworkError')
    expect(ErrorCode.TIMEOUT).toBe('Timeout')
    expect(ErrorCode.UNKNOWN).toBe('Unknown')
  })
})

describe('parseAPIError', () => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('DashScope JSON error responses', () => {
    it('parses InvalidApiKey error correctly', () => {
      const errorText = JSON.stringify({
        code: 'InvalidApiKey',
        message: 'The API key is invalid',
        request_id: 'req-123'
      })

      const result = parseAPIError(errorText, 401)

      expect(result.code).toBe(ErrorCode.INVALID_API_KEY)
      expect(result.userMessage).toBe('API key is invalid or missing')
      expect(result.technicalMessage).toBe('The API key is invalid')
      expect(result.suggestion).toBe('Check your .env file and ensure DASHSCOPE_API_KEY is set correctly')
      expect(result.isRetryable).toBe(false)
      expect(console.error).toHaveBeenCalledWith('[API Error]', expect.objectContaining({
        errorCode: 'InvalidApiKey',
        statusCode: 401,
        action: 'will show to user'
      }))
    })

    it('parses RateLimitExceeded error correctly', () => {
      const errorText = JSON.stringify({
        code: 'RateLimitExceeded',
        message: 'Too many requests',
        request_id: 'req-456'
      })

      const result = parseAPIError(errorText, 429)

      expect(result.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED)
      expect(result.userMessage).toBe('Too many requests - rate limit exceeded')
      expect(result.technicalMessage).toBe('Too many requests')
      expect(result.suggestion).toBe('Wait a few minutes before trying again')
      expect(result.isRetryable).toBe(true)
      expect(console.error).toHaveBeenCalledWith('[API Error]', expect.objectContaining({
        errorCode: 'RateLimitExceeded',
        statusCode: 429,
        action: 'will retry with backoff'
      }))
    })

    it('parses QuotaExceeded error correctly', () => {
      const errorText = JSON.stringify({
        code: 'QuotaExceeded',
        message: 'API quota exceeded',
        request_id: 'req-789'
      })

      const result = parseAPIError(errorText, 429)

      expect(result.code).toBe(ErrorCode.QUOTA_EXCEEDED)
      expect(result.userMessage).toBe('API quota exceeded - no more generations available')
      expect(result.technicalMessage).toBe('API quota exceeded')
      expect(result.suggestion).toBe('Check your Alibaba Cloud account to add more quota')
      expect(result.isRetryable).toBe(false)
      expect(console.error).toHaveBeenCalledWith('[API Error]', expect.objectContaining({
        errorCode: 'QuotaExceeded',
        action: 'will show to user'
      }))
    })

    it('parses DataInspectionFailed error correctly', () => {
      const errorText = JSON.stringify({
        code: 'DataInspectionFailed',
        message: 'Content moderation blocked this prompt',
        request_id: 'req-101'
      })

      const result = parseAPIError(errorText, 400)

      expect(result.code).toBe(ErrorCode.CONTENT_MODERATION_FAILED)
      expect(result.userMessage).toBe('Prompt blocked by content moderation')
      expect(result.technicalMessage).toBe('Content moderation blocked this prompt')
      expect(result.suggestion).toBe('Try rephrasing your prompt. Avoid sensitive or inappropriate content.')
      expect(result.isRetryable).toBe(false)
      expect(console.error).toHaveBeenCalledWith('[API Error]', expect.objectContaining({
        errorCode: 'DataInspectionFailed',
        action: 'will show to user'
      }))
    })

    it('parses InvalidRequest error correctly', () => {
      const errorText = JSON.stringify({
        code: 'InvalidRequest',
        message: 'Invalid request format',
        request_id: 'req-102'
      })

      const result = parseAPIError(errorText, 400)

      expect(result.code).toBe(ErrorCode.INVALID_REQUEST)
      expect(result.userMessage).toBe('Invalid request format')
      expect(result.technicalMessage).toBe('Invalid request format')
      expect(result.suggestion).toBe('This is likely a bug - please report it')
      expect(result.isRetryable).toBe(false)
    })

    it('parses TaskNotFound error correctly', () => {
      const errorText = JSON.stringify({
        code: 'TaskNotFound',
        message: 'Task not found',
        request_id: 'req-103'
      })

      const result = parseAPIError(errorText, 404)

      expect(result.code).toBe(ErrorCode.TASK_NOT_FOUND)
      expect(result.userMessage).toBe('Task not found - it may have expired')
      expect(result.technicalMessage).toBe('Task not found')
      expect(result.suggestion).toBe('Try generating the image again')
      expect(result.isRetryable).toBe(true)
      expect(console.error).toHaveBeenCalledWith('[API Error]', expect.objectContaining({
        errorCode: 'TaskNotFound',
        action: 'will retry with backoff'
      }))
    })

    it('parses TaskFailed error correctly', () => {
      const errorText = JSON.stringify({
        code: 'TaskFailed',
        message: 'Generation failed',
        request_id: 'req-104'
      })

      const result = parseAPIError(errorText, 500)

      expect(result.code).toBe(ErrorCode.TASK_FAILED)
      expect(result.userMessage).toBe('Image generation failed on the server')
      expect(result.technicalMessage).toBe('Generation failed')
      expect(result.suggestion).toBe('Try a different prompt or check the DashScope console for details')
      expect(result.isRetryable).toBe(true)
      expect(console.error).toHaveBeenCalledWith('[API Error]', expect.objectContaining({
        errorCode: 'TaskFailed',
        action: 'will retry with backoff'
      }))
    })

    it('handles unknown error codes', () => {
      const errorText = JSON.stringify({
        code: 'UnknownErrorCode',
        message: 'Something went wrong',
        request_id: 'req-105'
      })

      const result = parseAPIError(errorText, 500)

      expect(result.code).toBe('UnknownErrorCode')
      expect(result.userMessage).toBe('Something went wrong')
      expect(result.technicalMessage).toBe('Something went wrong')
      expect(result.suggestion).toBe('Try again or contact support')
      expect(result.isRetryable).toBe(false)
    })

    it('handles missing error code', () => {
      const errorText = JSON.stringify({
        message: 'Error without code',
        request_id: 'req-106'
      })

      const result = parseAPIError(errorText, 500)

      expect(result.code).toBe(ErrorCode.UNKNOWN)
      expect(result.userMessage).toBe('Error without code')
      expect(result.technicalMessage).toBe('Error without code')
      expect(result.suggestion).toBe('Try again or contact support')
      expect(result.isRetryable).toBe(false)
    })
  })

  describe('Non-JSON fallback handling', () => {
    it('handles 401 status without JSON body', () => {
      const result = parseAPIError('Unauthorized', 401)

      expect(result.code).toBe(ErrorCode.AUTH_FAILED)
      expect(result.userMessage).toBe('Authentication failed')
      expect(result.technicalMessage).toBe('Unauthorized')
      expect(result.suggestion).toBe('Check your API key configuration')
      expect(result.isRetryable).toBe(false)
      expect(console.error).toHaveBeenCalledWith('[API Error]', expect.objectContaining({
        statusCode: 401,
        errorCode: 'AuthFailed',
        parseError: 'Failed to parse as JSON',
        action: 'will show to user'
      }))
    })

    it('handles 429 status without JSON body', () => {
      const result = parseAPIError('Too many requests', 429)

      expect(result.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED)
      expect(result.userMessage).toBe('Too many requests')
      expect(result.technicalMessage).toBe('Too many requests')
      expect(result.suggestion).toBe('Wait a few minutes before trying again')
      expect(result.isRetryable).toBe(true)
      expect(console.error).toHaveBeenCalledWith('[API Error]', expect.objectContaining({
        statusCode: 429,
        errorCode: 'RateLimitExceeded',
        parseError: 'Failed to parse as JSON',
        action: 'will retry with backoff'
      }))
    })

    it('handles 5xx server errors', () => {
      const result = parseAPIError('Internal server error', 500)

      expect(result.code).toBe(ErrorCode.UNKNOWN)
      expect(result.userMessage).toBe('Server error - DashScope API is having issues')
      expect(result.technicalMessage).toBe('Internal server error')
      expect(result.suggestion).toBe('Try again in a few minutes')
      expect(result.isRetryable).toBe(true)
      expect(console.error).toHaveBeenCalledWith('[API Error]', expect.objectContaining({
        statusCode: 500,
        parseError: 'Failed to parse as JSON',
        action: 'will retry with backoff'
      }))
    })

    it('handles other status codes', () => {
      const result = parseAPIError('Bad request', 400)

      expect(result.code).toBe(ErrorCode.UNKNOWN)
      expect(result.userMessage).toBe('Request failed (400)')
      expect(result.technicalMessage).toBe('Bad request')
      expect(result.suggestion).toBe('Check your internet connection and try again')
      expect(result.isRetryable).toBe(false)
      expect(console.error).toHaveBeenCalledWith('[API Error]', expect.objectContaining({
        statusCode: 400,
        parseError: 'Failed to parse as JSON',
        action: 'will show to user'
      }))
    })

    it('handles malformed JSON', () => {
      const result = parseAPIError('not json at all', 500)

      expect(result.code).toBe(ErrorCode.UNKNOWN)
      expect(result.userMessage).toBe('Server error - DashScope API is having issues')
      expect(result.technicalMessage).toBe('not json at all')
      expect(result.isRetryable).toBe(true)
      expect(console.error).toHaveBeenCalledWith('[API Error]', expect.objectContaining({
        parseError: 'Failed to parse as JSON'
      }))
    })
  })

  describe('Console logging', () => {
    it('logs with [API Error] prefix', () => {
      const errorText = JSON.stringify({
        code: 'InvalidApiKey',
        message: 'Invalid key',
        request_id: 'req-123'
      })

      parseAPIError(errorText, 401)

      expect(console.error).toHaveBeenCalledWith('[API Error]', expect.any(Object))
    })

    it('includes timestamp in ISO format', () => {
      const errorText = JSON.stringify({
        code: 'InvalidApiKey',
        message: 'Invalid key',
        request_id: 'req-123'
      })

      parseAPIError(errorText, 401)

      const logCall = console.error.mock.calls[0]
      const loggedData = logCall[1]
      expect(loggedData.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })

    it('includes all ParsedError fields in log', () => {
      const errorText = JSON.stringify({
        code: 'InvalidApiKey',
        message: 'Invalid key',
        request_id: 'req-123'
      })

      const result = parseAPIError(errorText, 401)

      expect(console.error).toHaveBeenCalledWith('[API Error]', expect.objectContaining({
        errorCode: result.code,
        userMessage: result.userMessage,
        technicalMessage: result.technicalMessage,
        suggestion: result.suggestion,
        isRetryable: result.isRetryable
      }))
    })
  })
})

describe('parseNetworkError', () => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Timeout errors', () => {
    it('parses AbortError correctly', () => {
      const error = new Error('Request timeout')
      error.name = 'AbortError'

      const result = parseNetworkError(error)

      expect(result.code).toBe(ErrorCode.TIMEOUT)
      expect(result.userMessage).toBe('Request timed out')
      expect(result.technicalMessage).toBe('Request timeout')
      expect(result.suggestion).toBe('Check your internet connection and try again')
      expect(result.isRetryable).toBe(true)
      expect(console.error).toHaveBeenCalledWith('[Network Error]', expect.objectContaining({
        errorCode: 'Timeout',
        action: 'will retry with backoff'
      }))
    })

    it('parses error with timeout in message', () => {
      const error = new Error('Network request timeout after 30s')

      const result = parseNetworkError(error)

      expect(result.code).toBe(ErrorCode.TIMEOUT)
      expect(result.isRetryable).toBe(true)
      expect(result.userMessage).toBe('Request timed out')
      expect(console.error).toHaveBeenCalledWith('[Network Error]', expect.objectContaining({
        errorCode: 'Timeout',
        action: 'will retry with backoff'
      }))
    })
  })

  describe('Fetch errors', () => {
    it('parses fetch errors correctly', () => {
      const error = new Error('Failed to fetch')

      const result = parseNetworkError(error)

      expect(result.code).toBe(ErrorCode.NETWORK_ERROR)
      expect(result.userMessage).toBe('Network error - could not reach the API')
      expect(result.technicalMessage).toBe('Failed to fetch')
      expect(result.suggestion).toBe('Check your internet connection')
      expect(result.isRetryable).toBe(true)
      expect(console.error).toHaveBeenCalledWith('[Network Error]', expect.objectContaining({
        errorCode: 'NetworkError',
        action: 'will retry with backoff'
      }))
    })

    it('parses network error with fetch in message', () => {
      const error = new Error('fetch failed - network offline')

      const result = parseNetworkError(error)

      expect(result.code).toBe(ErrorCode.NETWORK_ERROR)
      expect(result.isRetryable).toBe(true)
      expect(console.error).toHaveBeenCalledWith('[Network Error]', expect.objectContaining({
        errorCode: 'NetworkError'
      }))
    })
  })

  describe('Unknown errors', () => {
    it('parses generic errors correctly', () => {
      const error = new Error('Something unexpected happened')

      const result = parseNetworkError(error)

      expect(result.code).toBe(ErrorCode.UNKNOWN)
      expect(result.userMessage).toBe('An unexpected error occurred')
      expect(result.technicalMessage).toBe('Something unexpected happened')
      expect(result.suggestion).toBe('Try refreshing the page')
      expect(result.isRetryable).toBe(false)
      expect(console.error).toHaveBeenCalledWith('[Network Error]', expect.objectContaining({
        errorCode: 'Unknown',
        action: 'will show to user'
      }))
    })
  })

  describe('Non-Error objects', () => {
    it('handles string errors', () => {
      const result = parseNetworkError('string error')

      expect(result.code).toBe(ErrorCode.UNKNOWN)
      expect(result.userMessage).toBe('An unexpected error occurred')
      expect(result.isRetryable).toBe(false)
      expect(console.error).toHaveBeenCalledWith('[Network Error]', expect.objectContaining({
        errorCode: 'Unknown',
        originalError: 'string error'
      }))
    })

    it('handles null errors', () => {
      const result = parseNetworkError(null)

      expect(result.code).toBe(ErrorCode.UNKNOWN)
      expect(result.userMessage).toBe('An unexpected error occurred')
      expect(result.isRetryable).toBe(false)
      expect(console.error).toHaveBeenCalledWith('[Network Error]', expect.objectContaining({
        errorCode: 'Unknown',
        originalError: null
      }))
    })

    it('handles object errors', () => {
      const error = { customError: 'something went wrong' }
      const result = parseNetworkError(error)

      expect(result.code).toBe(ErrorCode.UNKNOWN)
      expect(result.userMessage).toBe('An unexpected error occurred')
      expect(result.isRetryable).toBe(false)
      expect(console.error).toHaveBeenCalledWith('[Network Error]', expect.objectContaining({
        errorCode: 'Unknown',
        originalError: error
      }))
    })
  })

  describe('Console logging', () => {
    it('logs with [Network Error] prefix', () => {
      const error = new Error('Failed to fetch')

      parseNetworkError(error)

      expect(console.error).toHaveBeenCalledWith('[Network Error]', expect.any(Object))
    })

    it('includes timestamp in ISO format', () => {
      const error = new Error('Failed to fetch')

      parseNetworkError(error)

      const logCall = console.error.mock.calls[0]
      const loggedData = logCall[1]
      expect(loggedData.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })

    it('includes original error details', () => {
      const error = new Error('Network failed')

      parseNetworkError(error)

      expect(console.error).toHaveBeenCalledWith('[Network Error]', expect.objectContaining({
        originalError: expect.objectContaining({
          name: 'Error',
          message: 'Network failed'
        })
      }))
    })

    it('includes all ParsedError fields in log', () => {
      const error = new Error('Failed to fetch')

      const result = parseNetworkError(error)

      expect(console.error).toHaveBeenCalledWith('[Network Error]', expect.objectContaining({
        errorCode: result.code,
        userMessage: result.userMessage,
        technicalMessage: result.technicalMessage,
        suggestion: result.suggestion,
        isRetryable: result.isRetryable
      }))
    })
  })
})
