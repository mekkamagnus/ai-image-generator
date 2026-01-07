// src/lib/qwen-api.ts
import pb from './pocketbase';

export interface GenerateImageOptions {
  size?: '1024*1024' | '1328*1328' | '1920*1080';
  promptExtend?: boolean;
  watermark?: boolean;
}

export interface GenerateImageResponse {
  output: {
    task_id: string;
    task_status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  };
  request_id: string;
}

export async function generateImage(
  prompt: string,
  options: GenerateImageOptions = {}
): Promise<GenerateImageResponse> {
  const result = await pb.send('/api/qwen/generate', {
    method: 'POST',
    body: JSON.stringify({
      prompt,
      size: options.size || '1328*1328',
      prompt_extend: options.promptExtend !== false,
      watermark: options.watermark || false
    })
  });

  return result as GenerateImageResponse;
}

export interface TaskResult {
  output: {
    task_id: string;
    task_status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
    choices?: Array<{
      message: {
        content: Array<{ image: string; type: string }>;
      };
    }>;
  };
}

export async function getTaskResult(taskId: string): Promise<TaskResult> {
  const result = await pb.send(`/api/qwen/task/${taskId}`, {
    method: 'GET'
  });

  return result as TaskResult;
}
