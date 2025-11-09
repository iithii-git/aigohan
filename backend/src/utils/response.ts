import type { ApiResponse, ErrorInfo } from '../types/api.js';

export type ErrorCode =
  | 'INVALID_REQUEST'
  | 'RATE_LIMIT_EXCEEDED'
  | 'AI_SERVICE_UNAVAILABLE'
  | 'REQUEST_TIMEOUT'
  | 'AI_RESPONSE_ERROR'
  | 'INTERNAL_SERVER_ERROR';

export function createErrorResponse(
  code: ErrorCode,
  message: string,
  statusCode: number = 500,
  requestId?: string,
  processingTime?: number
): Response {
  const error: ErrorInfo = { code, message };
  const response: ApiResponse<never> = {
    success: false,
    error,
  };

  if (requestId || processingTime !== undefined) {
    response.meta = {
      requestId: requestId || '',
      processingTime: processingTime || 0,
      timestamp: new Date().toISOString(),
    };
  }

  return new Response(JSON.stringify(response), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function createSuccessResponse<T>(
  data: T,
  requestId?: string,
  processingTime?: number,
  qualityInfo?: ApiResponse<T>['qualityInfo']
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };

  if (requestId || processingTime !== undefined) {
    response.meta = {
      requestId: requestId || '',
      processingTime: processingTime || 0,
      timestamp: new Date().toISOString(),
    };
  }

  if (qualityInfo) {
    response.qualityInfo = qualityInfo;
  }

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

