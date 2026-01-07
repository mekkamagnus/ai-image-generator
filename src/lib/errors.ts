// src/lib/errors.ts

// DashScope API error response structure
interface DashScopeErrorResponse {
  code: string;
  message: string;
  request_id: string;
}

export enum ErrorCode {
  // Authentication errors
  INVALID_API_KEY = 'InvalidApiKey',
  AUTH_FAILED = 'AuthFailed',

  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RateLimitExceeded',
  QUOTA_EXCEEDED = 'QuotaExceeded',

  // Content errors
  CONTENT_MODERATION_FAILED = 'DataInspectionFailed',
  INVALID_REQUEST = 'InvalidRequest',

  // Task errors
  TASK_NOT_FOUND = 'TaskNotFound',
  TASK_FAILED = 'TaskFailed',

  // Network/system errors
  NETWORK_ERROR = 'NetworkError',
  TIMEOUT = 'Timeout',
  UNKNOWN = 'Unknown'
}

export interface ParsedError {
  code: ErrorCode;
  userMessage: string;
  technicalMessage: string;
  suggestion: string;
  isRetryable: boolean;
}

// Map DashScope error codes to user-friendly messages
const ERROR_MESSAGES: Record<string, Omit<ParsedError, 'code' | 'technicalMessage'>> = {
  [ErrorCode.INVALID_API_KEY]: {
    userMessage: 'API key is invalid or missing',
    suggestion: 'Check your .env file and ensure DASHSCOPE_API_KEY is set correctly',
    isRetryable: false
  },
  [ErrorCode.RATE_LIMIT_EXCEEDED]: {
    userMessage: 'Too many requests - rate limit exceeded',
    suggestion: 'Wait a few minutes before trying again',
    isRetryable: true
  },
  [ErrorCode.QUOTA_EXCEEDED]: {
    userMessage: 'API quota exceeded - no more generations available',
    suggestion: 'Check your Alibaba Cloud account to add more quota',
    isRetryable: false
  },
  [ErrorCode.CONTENT_MODERATION_FAILED]: {
    userMessage: 'Prompt blocked by content moderation',
    suggestion: 'Try rephrasing your prompt. Avoid sensitive or inappropriate content.',
    isRetryable: false
  },
  [ErrorCode.INVALID_REQUEST]: {
    userMessage: 'Invalid request format',
    suggestion: 'This is likely a bug - please report it',
    isRetryable: false
  },
  [ErrorCode.TASK_NOT_FOUND]: {
    userMessage: 'Task not found - it may have expired',
    suggestion: 'Try generating the image again',
    isRetryable: true
  },
  [ErrorCode.TASK_FAILED]: {
    userMessage: 'Image generation failed on the server',
    suggestion: 'Try a different prompt or check the DashScope console for details',
    isRetryable: true
  }
};

// Parse DashScope API error response
export function parseAPIError(errorText: string, statusCode: number): ParsedError {
  try {
    const errorJson: DashScopeErrorResponse = JSON.parse(errorText);
    const code = errorJson.code || ErrorCode.UNKNOWN;
    const mapped = ERROR_MESSAGES[code] || {
      userMessage: errorJson.message || 'Unknown error',
      suggestion: 'Try again or contact support',
      isRetryable: false
    };

    const parsed = {
      code: code as ErrorCode,
      technicalMessage: errorJson.message,
      ...mapped
    };

    // Log error for debugging and AI analysis
    console.error('[API Error]', {
      timestamp: new Date().toISOString(),
      statusCode,
      errorCode: code,
      userMessage: parsed.userMessage,
      technicalMessage: parsed.technicalMessage,
      suggestion: parsed.suggestion,
      isRetryable: parsed.isRetryable,
      rawResponse: errorJson,
      action: parsed.isRetryable ? 'will retry with backoff' : 'will show to user'
    });

    return parsed;
  } catch {
    // JSON parse failed - likely not a DashScope error
    let parsed: ParsedError;

    if (statusCode === 401) {
      parsed = {
        code: ErrorCode.AUTH_FAILED,
        userMessage: 'Authentication failed',
        technicalMessage: 'Unauthorized',
        suggestion: 'Check your API key configuration',
        isRetryable: false
      };
    } else if (statusCode === 429) {
      parsed = {
        code: ErrorCode.RATE_LIMIT_EXCEEDED,
        userMessage: 'Too many requests',
        technicalMessage: errorText,
        suggestion: 'Wait a few minutes before trying again',
        isRetryable: true
      };
    } else if (statusCode >= 500) {
      parsed = {
        code: ErrorCode.UNKNOWN,
        userMessage: 'Server error - DashScope API is having issues',
        technicalMessage: errorText,
        suggestion: 'Try again in a few minutes',
        isRetryable: true
      };
    } else {
      parsed = {
        code: ErrorCode.UNKNOWN,
        userMessage: `Request failed (${statusCode})`,
        technicalMessage: errorText,
        suggestion: 'Check your internet connection and try again',
        isRetryable: false
      };
    }

    // Log non-JSON error for debugging and AI analysis
    console.error('[API Error]', {
      timestamp: new Date().toISOString(),
      statusCode,
      errorCode: parsed.code,
      userMessage: parsed.userMessage,
      technicalMessage: parsed.technicalMessage,
      suggestion: parsed.suggestion,
      isRetryable: parsed.isRetryable,
      rawResponse: errorText,
      parseError: 'Failed to parse as JSON',
      action: parsed.isRetryable ? 'will retry with backoff' : 'will show to user'
    });

    return parsed;
  }
}

// Parse network/timeout errors
export function parseNetworkError(err: unknown): ParsedError {
  let parsed: ParsedError;

  if (err instanceof Error) {
    if (err.name === 'AbortError' || err.message.includes('timeout')) {
      parsed = {
        code: ErrorCode.TIMEOUT,
        userMessage: 'Request timed out',
        technicalMessage: err.message,
        suggestion: 'Check your internet connection and try again',
        isRetryable: true
      };
    } else if (err.message.includes('fetch')) {
      parsed = {
        code: ErrorCode.NETWORK_ERROR,
        userMessage: 'Network error - could not reach the API',
        technicalMessage: err.message,
        suggestion: 'Check your internet connection',
        isRetryable: true
      };
    } else {
      parsed = {
        code: ErrorCode.UNKNOWN,
        userMessage: 'An unexpected error occurred',
        technicalMessage: err.message,
        suggestion: 'Try refreshing the page',
        isRetryable: false
      };
    }
  } else {
    parsed = {
      code: ErrorCode.UNKNOWN,
      userMessage: 'An unexpected error occurred',
      technicalMessage: err instanceof Error ? err.message : 'Unknown error',
      suggestion: 'Try refreshing the page',
      isRetryable: false
    };
  }

  // Log network error for debugging and AI analysis
  console.error('[Network Error]', {
    timestamp: new Date().toISOString(),
    errorCode: parsed.code,
    userMessage: parsed.userMessage,
    technicalMessage: parsed.technicalMessage,
    suggestion: parsed.suggestion,
    isRetryable: parsed.isRetryable,
    originalError: err instanceof Error ? { name: err.name, message: err.message } : err,
    action: parsed.isRetryable ? 'will retry with backoff' : 'will show to user'
  });

  return parsed;
}
