// src/hooks/useImageGeneration.ts
import { useState, useCallback, useRef } from 'react';
import { generateImage, getTaskResult, GenerateImageOptions } from '@/lib/qwen-api';
import { parseAPIError, parseNetworkError, type ParsedError } from '@/lib/errors';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000; // 2 seconds
const RETRY_BACKOFF = 1.5; // 1.5x multiplier

export type GenerationStatus = 'idle' | 'pending' | 'processing' | 'succeeded' | 'failed';

export function useImageGeneration() {
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [error, setError] = useState<ParsedError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const pollIntervalRef = useRef<number | null>(null);
  const taskIdRef = useRef<string | null>(null);

  const clearPoll = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Helper function to retry with exponential backoff
  const retryWithBackoff = async <T>(
    fn: () => Promise<T>,
    retries = MAX_RETRIES,
    delay = INITIAL_RETRY_DELAY
  ): Promise<T> => {
    try {
      return await fn();
    } catch (err) {
      if (retries <= 0) throw err;

      const parsedError = err instanceof Error && 'message' in err
        ? parseNetworkError(err)
        : parseAPIError(String(err), 0);

      // Only retry retryable errors
      if (!parsedError.isRetryable) {
        throw parsedError;
      }

      const attemptNumber = MAX_RETRIES - retries + 1;

      // Log retry attempt for debugging and AI analysis
      console.log('[Retry]', {
        timestamp: new Date().toISOString(),
        attempt: attemptNumber,
        maxRetries: MAX_RETRIES,
        remainingRetries: retries - 1,
        delay: `${delay}ms`,
        backoffMultiplier: RETRY_BACKOFF,
        errorCode: parsedError.code,
        userMessage: parsedError.userMessage,
        technicalMessage: parsedError.technicalMessage,
        suggestion: parsedError.suggestion,
        action: `waiting ${delay}ms before retry ${attemptNumber + 1}/${MAX_RETRIES}`
      });

      // Show retry status to user
      setError(parsedError);
      setStatus('processing'); // Keep processing status

      // Wait before retry
      await sleep(delay);

      // Retry with exponential backoff
      return retryWithBackoff(fn, retries - 1, delay * RETRY_BACKOFF);
    }
  };

  const generate = useCallback(async (prompt: string, options?: GenerateImageOptions) => {
    try {
      setStatus('pending');
      setImageUrl(null);
      setTaskId(null);
      setError(null);
      setRetryCount(0);

      // Step 1: Create task with retry logic
      const response = await retryWithBackoff(async () => {
        return await generateImage(prompt, options);
      });

      const currentTaskId = response.output.task_id;
      taskIdRef.current = currentTaskId;
      setTaskId(currentTaskId);
      setError(null); // Clear retry errors if successful
      setStatus('processing');

      // Log task creation success for debugging and AI analysis
      console.log('[Image Generation]', {
        timestamp: new Date().toISOString(),
        phase: 'task_created',
        taskId: currentTaskId,
        status: 'PENDING',
        prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
        promptLength: prompt.length,
        options: options,
        action: 'starting async task, will poll for results',
        expectedDuration: '1-2 minutes'
      });

      // Step 2: Poll for result with retry logic
      pollIntervalRef.current = window.setInterval(async () => {
        try {
          const result = await retryWithBackoff(async () => {
            return await getTaskResult(currentTaskId);
          });

          const { task_status } = result.output;

          if (task_status === 'SUCCEEDED') {
            const url = result.output.choices?.[0]?.message?.content?.[0]?.image;
            if (url) {
              setImageUrl(url);
              setStatus('succeeded');
              setError(null);

              // Log success for debugging and AI analysis
              console.log('[Image Generation]', {
                timestamp: new Date().toISOString(),
                phase: 'task_succeeded',
                taskId: currentTaskId,
                status: 'SUCCEEDED',
                imageUrl: url,
                action: 'image generation completed successfully, displaying to user'
              });
            } else {
              setStatus('failed');
              setError({
                code: 'Unknown' as any,
                userMessage: 'No image URL in response',
                technicalMessage: 'Task succeeded but no image found',
                suggestion: 'Try generating again',
                isRetryable: true
              });

              // Log missing image URL for debugging and AI analysis
              console.error('[Image Generation]', {
                timestamp: new Date().toISOString(),
                phase: 'task_succeeded_no_image',
                taskId: currentTaskId,
                status: 'SUCCEEDED',
                error: 'Task succeeded but no image URL in response',
                action: 'will show error to user suggesting retry'
              });
            }
            clearPoll();
          } else if (task_status === 'FAILED') {
            setStatus('failed');
            setError({
              code: 'TaskFailed' as any,
              userMessage: 'Image generation failed on the server',
              technicalMessage: 'Task marked as FAILED by DashScope',
              suggestion: 'Try a different prompt',
              isRetryable: true
            });

            // Log task failure for debugging and AI analysis
            console.error('[Image Generation]', {
              timestamp: new Date().toISOString(),
              phase: 'task_failed',
              taskId: currentTaskId,
              status: 'FAILED',
              error: 'Task marked as FAILED by DashScope API',
              action: 'will show error to user suggesting different prompt'
            });

            clearPoll();
          }
        } catch (err) {
          const parsedError = err instanceof Error
            ? parseNetworkError(err)
            : parseAPIError(String(err), 0);

          setStatus('failed');
          setError(parsedError);

          // Log polling error for debugging and AI analysis
          console.error('[Image Generation - Polling Error]', {
            timestamp: new Date().toISOString(),
            phase: 'polling_failed',
            taskId: currentTaskId,
            error: parsedError,
            action: 'will show error to user, stopping polling'
          });

          clearPoll();
        }
      }, 5000); // Poll every 5 seconds
    } catch (err) {
      const parsedError = err instanceof Error
        ? parseNetworkError(err)
        : parseAPIError(String(err), 0);

      setStatus('failed');
      setError(parsedError);

      // Log task creation failure for debugging and AI analysis
      console.error('[Image Generation - Failed]', {
        timestamp: new Date().toISOString(),
        phase: 'task_creation_failed',
        prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
        promptLength: prompt.length,
        options: options,
        error: parsedError,
        action: 'all retries exhausted, will show error to user'
      });

      clearPoll();
    }
  }, [clearPoll]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    clearPoll();
    setStatus('idle');
    setImageUrl(null);
    setTaskId(null);
    setError(null);
    setRetryCount(0);
  }, [clearPoll]);

  return { generate, status, imageUrl, taskId, error, cleanup };
}
