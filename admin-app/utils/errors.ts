/**
 * API Error handling for Admin App
 */

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

export class ApiException implements ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;

  constructor(message: string, status?: number, code?: string, details?: any) {
    this.message = message;
    this.status = status;
    this.code = code;
    this.details = details;
  }

  isUnauthorized(): boolean {
    return this.status === 401;
  }

  isForbidden(): boolean {
    return this.status === 403;
  }

  isNotFound(): boolean {
    return this.status === 404;
  }

  isValidationError(): boolean {
    return this.status === 400;
  }

  isServerError(): boolean {
    return !!(this.status && this.status >= 500);
  }
}

export const handleApiError = (error: any): ApiException => {
  if (error.response) {
    // API returned error response
    const { status, data } = error.response;
    return new ApiException(
      data?.message || 'Something went wrong',
      status,
      data?.code,
      data?.details
    );
  } else if (error.request) {
    // Request made but no response
    return new ApiException('No response from server', 0, 'NO_RESPONSE');
  } else {
    // Error in request setup
    return new ApiException(error.message || 'Unknown error occurred', 0, 'UNKNOWN_ERROR');
  }
};

export const getErrorMessage = (error: ApiError): string => {
  if (error.status === 401) {
    return 'Your session has expired. Please login again.';
  }
  if (error.status === 403) {
    return 'You do not have permission to perform this action.';
  }
  if (error.status === 404) {
    return 'The requested resource was not found.';
  }
  if (error.status === 400) {
    return `Validation error: ${error.message}`;
  }
  if (error.status && error.status >= 500) {
    return 'Server error. Please try again later.';
  }
  return error.message || 'An unexpected error occurred.';
};
