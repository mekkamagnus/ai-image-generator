// src/test-utils/mocks.ts
import type { ParsedError } from '@/lib/errors'
import { ErrorCode } from '@/lib/errors'
import type { GenerateImageResponse, TaskResult } from '@/lib/qwen-api'

/**
 * Mock successful DashScope API response
 */
export function mockDashScopeSuccessResponse(taskId: string = 'task-123'): GenerateImageResponse {
  return {
    output: {
      task_id: taskId,
      task_status: 'PENDING'
    },
    request_id: 'req-abc-123'
  }
}

/**
 * Mock error DashScope API response
 */
export function mockDashScopeErrorResponse(
  code: string = 'InvalidApiKey',
  message: string = 'The API key is invalid'
): string {
  return JSON.stringify({
    code,
    message,
    request_id: 'req-error-123'
  })
}

/**
 * Mock ParsedError object for testing
 */
export function mockParsedError(
  code: ErrorCode = ErrorCode.INVALID_API_KEY,
  userMessage: string = 'API key is invalid or missing',
  isRetryable: boolean = false
): ParsedError {
  return {
    code,
    userMessage,
    technicalMessage: 'Technical error details',
    suggestion: 'Check your configuration',
    isRetryable
  }
}

/**
 * Mock TaskResult with various statuses
 */
export function mockTaskResult(
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' = 'PENDING',
  taskId: string = 'task-123',
  imageUrl?: string
): TaskResult {
  const result: TaskResult = {
    output: {
      task_id: taskId,
      task_status: status
    }
  }

  if (status === 'SUCCEEDED' && imageUrl) {
    result.output.choices = [
      {
        message: {
          content: [
            { image: imageUrl, type: 'image' }
          ]
        }
      }
    ]
  }

  return result
}

/**
 * Mock successful task result with image
 */
export function mockSuccessTaskResult(
  taskId: string = 'task-123',
  imageUrl: string = 'https://example.com/generated-image.png'
): TaskResult {
  return mockTaskResult('SUCCEEDED', taskId, imageUrl)
}

/**
 * Mock failed task result
 */
export function mockFailedTaskResult(
  taskId: string = 'task-123'
): TaskResult {
  return mockTaskResult('FAILED', taskId)
}

/**
 * Mock pending task result
 */
export function mockPendingTaskResult(
  taskId: string = 'task-123'
): TaskResult {
  return mockTaskResult('PENDING', taskId)
}

/**
 * Mock running task result
 */
export function mockRunningTaskResult(
  taskId: string = 'task-123'
): TaskResult {
  return mockTaskResult('RUNNING', taskId)
}
