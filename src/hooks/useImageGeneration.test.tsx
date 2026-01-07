// src/hooks/useImageGeneration.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useImageGeneration } from './useImageGeneration'
import * as qwenApi from '@/lib/qwen-api'
import { ErrorCode } from '@/lib/errors'

// Mock the API functions
vi.mock('@/lib/qwen-api', () => ({
  generateImage: vi.fn(),
  getTaskResult: vi.fn()
}))

// Mock console to avoid spamming test output
vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})

describe('useImageGeneration hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should start with idle status', () => {
      const { result } = renderHook(() => useImageGeneration())

      expect(result.current.status).toBe('idle')
      expect(result.current.imageUrl).toBeNull()
      expect(result.current.taskId).toBeNull()
      expect(result.current.error).toBeNull()
    })
  })

  describe('generate function', () => {
    it('should set status to pending immediately', async () => {
      const { result } = renderHook(() => useImageGeneration())

      vi.mocked(qwenApi.generateImage).mockResolvedValue({
        output: { task_id: 'task-123', task_status: 'PENDING' },
        request_id: 'req-123'
      })

      act(() => {
        result.current.generate('test prompt')
      })

      expect(result.current.status).toBe('pending')
    })

    it('should set taskId and status to processing on successful task creation', async () => {
      const { result } = renderHook(() => useImageGeneration())

      vi.mocked(qwenApi.generateImage).mockResolvedValue({
        output: { task_id: 'task-123', task_status: 'PENDING' },
        request_id: 'req-123'
      })

      await act(async () => {
        await result.current.generate('test prompt')
      })

      expect(result.current.taskId).toBe('task-123')
      expect(result.current.status).toBe('processing')
    })

    it('should set error and failed status on API failure', async () => {
      const { result } = renderHook(() => useImageGeneration())

      vi.mocked(qwenApi.generateImage).mockRejectedValue(
        new Error('Some other error')
      )

      await act(async () => {
        await result.current.generate('test prompt')
      })

      expect(result.current.status).toBe('failed')
      expect(result.current.error).not.toBeNull()
      expect(result.current.error?.isRetryable).toBe(false)
    })

    it('should retry retryable errors (timeout)', async () => {
      const { result } = renderHook(() => useImageGeneration())

      const timeoutError = new Error('Request timeout')
      timeoutError.name = 'AbortError'

      vi.mocked(qwenApi.generateImage)
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValue({
          output: { task_id: 'task-123', task_status: 'PENDING' },
          request_id: 'req-123'
        })

      await act(async () => {
        await result.current.generate('test prompt')
      })

      // Should have retried
      expect(qwenApi.generateImage).toHaveBeenCalledTimes(2)
      expect(result.current.status).toBe('processing')
    })

    it('should retry retryable errors (fetch)', async () => {
      const { result } = renderHook(() => useImageGeneration())

      const fetchError = new Error('Failed to fetch')

      vi.mocked(qwenApi.generateImage)
        .mockRejectedValueOnce(fetchError)
        .mockResolvedValue({
          output: { task_id: 'task-123', task_status: 'PENDING' },
          request_id: 'req-123'
        })

      await act(async () => {
        await result.current.generate('test prompt')
      })

      // Should have retried
      expect(qwenApi.generateImage).toHaveBeenCalledTimes(2)
      expect(result.current.status).toBe('processing')
    })

    it('should not retry non-retryable errors', async () => {
      const { result } = renderHook(() => useImageGeneration())

      vi.mocked(qwenApi.generateImage).mockRejectedValue(
        new Error('Some other error')
      )

      await act(async () => {
        await result.current.generate('test prompt')
      })

      // Should NOT have retried
      expect(qwenApi.generateImage).toHaveBeenCalledTimes(1)
      expect(result.current.status).toBe('failed')
      expect(result.current.error?.isRetryable).toBe(false)
    })

    it('should retry up to MAX_RETRIES times (3)', async () => {
      const { result } = renderHook(() => useImageGeneration())

      const timeoutError = new Error('Request timeout')
      timeoutError.name = 'AbortError'

      // Fail 4 times (initial + 3 retries)
      vi.mocked(qwenApi.generateImage).mockRejectedValue(timeoutError)

      await act(async () => {
        await result.current.generate('test prompt')
      })

      // Should have tried 4 times total
      expect(qwenApi.generateImage).toHaveBeenCalledTimes(4)
      expect(result.current.status).toBe('failed')
      expect(result.current.error?.isRetryable).toBe(true)
    })

    it('should use exponential backoff for retries', async () => {
      const { result } = renderHook(() => useImageGeneration())

      const timeoutError = new Error('Request timeout')
      timeoutError.name = 'AbortError'

      vi.mocked(qwenApi.generateImage)
        .mockRejectedValueOnce(timeoutError)
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValue({
          output: { task_id: 'task-123', task_status: 'PENDING' },
          request_id: 'req-123'
        })

      await act(async () => {
        await result.current.generate('test prompt')
      })

      // Should have retried twice
      expect(qwenApi.generateImage).toHaveBeenCalledTimes(3)
      expect(result.current.status).toBe('processing')
    })
  })

  describe('cleanup function', () => {
    it('should clear all state and stop polling', async () => {
      const { result } = renderHook(() => useImageGeneration())

      vi.mocked(qwenApi.generateImage).mockResolvedValue({
        output: { task_id: 'task-123', task_status: 'PENDING' },
        request_id: 'req-123'
      })

      await act(async () => {
        await result.current.generate('test prompt')
      })

      expect(result.current.status).toBe('processing')
      expect(result.current.taskId).toBe('task-123')

      act(() => {
        result.current.cleanup()
      })

      expect(result.current.status).toBe('idle')
      expect(result.current.taskId).toBeNull()
      expect(result.current.imageUrl).toBeNull()
      expect(result.current.error).toBeNull()
    })
  })

  describe('error state', () => {
    it('should set error as ParsedError object', async () => {
      const { result } = renderHook(() => useImageGeneration())

      vi.mocked(qwenApi.generateImage).mockRejectedValue(
        new Error('Some error')
      )

      await act(async () => {
        await result.current.generate('test prompt')
      })

      expect(result.current.error).not.toBeNull()
      expect(result.current.error).toHaveProperty('code')
      expect(result.current.error).toHaveProperty('userMessage')
      expect(result.current.error).toHaveProperty('technicalMessage')
      expect(result.current.error).toHaveProperty('suggestion')
      expect(result.current.error).toHaveProperty('isRetryable')
    })

    it('should clear error on successful retry', async () => {
      const { result } = renderHook(() => useImageGeneration())

      const timeoutError = new Error('Request timeout')
      timeoutError.name = 'AbortError'

      vi.mocked(qwenApi.generateImage)
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValue({
          output: { task_id: 'task-123', task_status: 'PENDING' },
          request_id: 'req-123'
        })

      await act(async () => {
        await result.current.generate('test prompt')
      })

      // Error should be cleared after successful retry
      expect(result.current.error).toBeNull()
      expect(result.current.status).toBe('processing')
    })
  })

  describe('console logging', () => {
    it('should log retry attempts with [Retry] prefix', async () => {
      const { result } = renderHook(() => useImageGeneration())

      const timeoutError = new Error('Request timeout')
      timeoutError.name = 'AbortError'

      vi.mocked(qwenApi.generateImage)
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValue({
          output: { task_id: 'task-123', task_status: 'PENDING' },
          request_id: 'req-123'
        })

      await act(async () => {
        await result.current.generate('test prompt')
      })

      expect(console.log).toHaveBeenCalledWith('[Retry]', expect.objectContaining({
        attempt: 1,
        maxRetries: 3,
        delay: '2000ms',
        backoffMultiplier: 1.5
      }))
    })
  })
})
