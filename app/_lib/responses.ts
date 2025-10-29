/**
 * Standardized API response types and helpers
 * 
 * All API routes should use these helpers to ensure consistent response formats
 * across the application.
 */

export type ApiOk<T = unknown> = { ok: true; data: T };
export type ApiErr = { ok: false; error: string; details?: unknown };

/**
 * Return a successful API response with data
 * @param data - The response payload
 * @param status - HTTP status code (default: 200)
 * @returns Response object with standardized format
 */
export function successResponse<T = unknown>(data: T, status = 200): Response {
  return new Response(
    JSON.stringify({ ok: true, data } satisfies ApiOk<T>),
    {
      status,
      headers: { "content-type": "application/json" },
    },
  );
}

/**
 * Return an error API response
 * @param message - Error message
 * @param status - HTTP status code (default: 400)
 * @param details - Optional additional error details (for debugging)
 * @returns Response object with standardized error format
 */
export function errorResponse(message: string, status = 400, details?: unknown): Response {
  const payload: ApiErr = { ok: false, error: message };
  if (details !== undefined) {
    payload.details = details;
  }
  return new Response(
    JSON.stringify(payload),
    {
      status,
      headers: { "content-type": "application/json" },
    },
  );
}

/**
 * Common HTTP status codes for API responses
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Common error messages
 */
export const ErrorMessages = {
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  INVALID_PAYLOAD: 'Invalid request payload',
  MISSING_REQUIRED_FIELD: 'Missing required field',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  INTERNAL_ERROR: 'Internal server error',
} as const;
