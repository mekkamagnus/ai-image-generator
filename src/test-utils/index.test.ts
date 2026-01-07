// src/test-utils/index.test.ts
import { describe, it, expect } from 'vitest'
// Verify that re-exports from index work correctly
import {
  mockDashScopeSuccessResponse,
  mockParsedError,
  mockSuccessTaskResult,
  renderWithProviders
} from './index'
import { ErrorCode } from '@/lib/errors'

describe('Test Utils Index Exports', () => {
  it('re-exports mock functions', () => {
    const response = mockDashScopeSuccessResponse()
    expect(response.output.task_id).toBeDefined()

    const error = mockParsedError(ErrorCode.INVALID_API_KEY)
    expect(error.code).toBe(ErrorCode.INVALID_API_KEY)

    const task = mockSuccessTaskResult()
    expect(task.output.task_status).toBe('SUCCEEDED')
  })

  it('re-exports test helpers', () => {
    // Just verify the function exists and is callable
    expect(typeof renderWithProviders).toBe('function')
  })
})
