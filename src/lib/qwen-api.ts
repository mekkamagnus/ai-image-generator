// src/lib/qwen-api.ts

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

// Determine API base URL based on environment
// In production, this will fail without a CORS proxy (serverless function or backend)
// The deployment phase (07-02) should add a server-side proxy to handle this
const getApiBaseUrl = () => {
  if (import.meta.env.PROD) {
    // Production: Direct API call (will fail due to CORS without proxy)
    // DEPLOYMENT NOTE: This requires a CORS proxy solution:
    // - Vercel/Netlify serverless function
    // - Backend API proxy (e.g., PocketBase)
    // - CORS proxy service (temporary workaround)
    return 'https://dashscope.aliyuncs.com/api/v1';
  } else {
    // Development: Use Vite proxy (configured in vite.config.ts)
    return '/api/qwen';
  }
};

const API_KEY = import.meta.env.VITE_DASHSCOPE_API_KEY || import.meta.env.DASHSCOPE_API_KEY;

export async function generateImage(
  prompt: string,
  options: GenerateImageOptions = {}
): Promise<GenerateImageResponse | { imageUrl: string }> {
  const apiBaseUrl = getApiBaseUrl();
  const isProduction = import.meta.env.PROD;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  // In production, we need to include Authorization header directly
  // (In dev, Vite proxy adds it automatically)
  if (isProduction && API_KEY) {
    headers['Authorization'] = `Bearer ${API_KEY}`;
  }

  const response = await fetch(`${apiBaseUrl}/services/aigc/multimodal-generation/generation`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: 'qwen-image-plus',
      input: {
        messages: [{
          role: 'user',
          content: [{ text: prompt }]
        }]
      },
      parameters: {
        size: options.size || '1328*1328',
        prompt_extend: options.promptExtend !== false,
        watermark: options.watermark || false
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();

  // Check if response is synchronous (contains image directly)
  const imageUrl = data.output?.choices?.[0]?.message?.content?.[0]?.image;
  if (imageUrl) {
    console.log('[API] Synchronous response - image URL received directly');
    return { imageUrl };
  }

  // Otherwise, return task_id for async polling
  const taskId = data.output?.task_id;
  if (taskId) {
    console.log('[API] Asynchronous response - task_id:', taskId);
    return { output: { task_id: taskId, task_status: 'PENDING' }, request_id: data.request_id };
  }

  // Neither image nor task_id - this is an error
  throw new Error('API response missing both image URL and task_id');
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
  const apiBaseUrl = getApiBaseUrl();
  const isProduction = import.meta.env.PROD;

  const headers: Record<string, string> = {};
  if (isProduction && API_KEY) {
    headers['Authorization'] = `Bearer ${API_KEY}`;
  }

  const response = await fetch(`${apiBaseUrl}/tasks/${taskId}`, {
    method: 'GET',
    headers
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return await response.json();
}
