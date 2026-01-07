// src/test-utils/mocks.test.ts
import { describe, it, expect } from 'vitest'
import {
  mockDashScopeSuccessResponse,
  mockDashScopeErrorResponse,
  mockParsedError,
  mockSuccessTaskResult,
  mockFailedTaskResult,
  mockPendingTaskResult,
  mockRunningTaskResult
} from './mocks'
import { ErrorCode } from '@/lib/errors'

describe('Mock Utilities', () => {
  describe('mockDashScopeSuccessResponse', () => {
    it('creates a successful API response', () => {
      const response = mockDashScopeSuccessResponse('task-abc')

      expect(response.output.task_id).toBe('task-abc')
      expect(response.output.task_status).toBe('PENDING')
      expect(response.request_id).toBeDefined()
    })
  })

  describe('mockDashScopeErrorResponse', () => {
    it('creates an error response as JSON string', () => {
      const errorJson = mockDashScopeErrorResponse('InvalidApiKey', 'Invalid key')
      const parsed = JSON.parse(errorJson)

      expect(parsed.code).toBe('InvalidApiKey')
      expect(parsed.message).toBe('Invalid key')
      expect(parsed.request_id).toBeDefined()
    })
  })

  describe('mockParsedError', () => {
    it('creates a ParsedError object', () => {
      const error = mockParsedError(ErrorCode.INVALID_API_KEY, 'Test error', false)

      expect(error.code).toBe(ErrorCode.INVALID_API_KEY)
      expect(error.userMessage).toBe('Test error')
      expect(error.isRetryable).toBe(false)
      expect(error.technicalMessage).toBeDefined()
      expect(error.suggestion).toBeDefined()
    })
  })

  describe('Task Result Mocks', () => {
    it('creates a successful task result with image', () => {
      const result = mockSuccessTaskResult('task-123', 'https://example.com/image.png')

      expect(result.output.task_id).toBe('task-123')
      expect(result.output.task_status).toBe('SUCCEEDED')
      expect(result.output.choices).toBeDefined()
      expect(result.output.choices?.[0].message.content[0].image).toBe('https://example.com/image.png')
    })

    it('creates a failed task result', () => {
      const result = mockFailedTaskResult('task-456')

      expect(result.output.task_id).toBe('task-456')
      expect(result.output.task_status).toBe('FAILED')
    })

    it('creates a pending task result', () => {
      const result = mockPendingTaskResult('task-789')

      expect(result.output.task_id).toBe('task-789')
      expect(result.output.task_status).toBe('PENDING')
    })

    it('creates a running task result', () => {
      const result = mockRunningTaskResult('task-101')

      expect(result.output.task_id).toBe('task-101')
      expect(result.output.task_status).toBe('RUNNING')
    })
  })
})
