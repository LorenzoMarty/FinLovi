import type { ApiError, ApiResponse } from '@finlovi/shared';

export function ok<T>(data: T): ApiResponse<T> {
  return { ok: true, data };
}

export function fail(message: string, code?: string, details?: unknown): ApiResponse<null> {
  const error: ApiError = { message, code, details };
  return { ok: false, error };
}
