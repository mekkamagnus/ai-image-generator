// src/hooks/useImageGeneration.ts
import { useState, useCallback, useRef } from 'react';
import { generateImage, getTaskResult, GenerateImageOptions } from '@/lib/qwen-api';

export type GenerationStatus = 'idle' | 'pending' | 'processing' | 'succeeded' | 'failed';

export function useImageGeneration() {
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollIntervalRef = useRef<number | null>(null);
  const taskIdRef = useRef<string | null>(null);

  const clearPoll = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const generate = useCallback(async (prompt: string, options?: GenerateImageOptions) => {
    try {
      setStatus('pending');
      setImageUrl(null);
      setTaskId(null);
      setError(null);

      // Step 1: Create task
      const response = await generateImage(prompt, options);
      const currentTaskId = response.output.task_id;
      taskIdRef.current = currentTaskId;
      setTaskId(currentTaskId);
      setStatus('processing');

      // Step 2: Poll for result
      pollIntervalRef.current = window.setInterval(async () => {
        try {
          const result = await getTaskResult(currentTaskId);
          const { task_status } = result.output;

          if (task_status === 'SUCCEEDED') {
            const url = result.output.choices?.[0]?.message?.content?.[0]?.image;
            if (url) {
              setImageUrl(url);
              setStatus('succeeded');
            } else {
              setStatus('failed');
              setError('No image URL in response');
            }
            clearPoll();
          } else if (task_status === 'FAILED') {
            setStatus('failed');
            setError('Task failed');
            clearPoll();
          }
          // Continue polling for PENDING and RUNNING
        } catch (err) {
          setStatus('failed');
          setError(err instanceof Error ? err.message : 'Polling error');
          clearPoll();
        }
      }, 5000); // Poll every 5 seconds
    } catch (err) {
      setStatus('failed');
      setError(err instanceof Error ? err.message : 'Generation failed');
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
  }, [clearPoll]);

  return { generate, status, imageUrl, taskId, error, cleanup };
}
