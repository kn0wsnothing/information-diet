"use client";

/**
 * Centralized error handling utilities
 */

export interface AppError {
  code: string;
  message: string;
  details?: string;
  recoverable: boolean;
}

export class AppErrorClass extends Error implements AppError {
  code: string;
  details?: string;
  recoverable: boolean;

  constructor(code: string, message: string, details?: string, recoverable = true) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = details;
    this.recoverable = recoverable;
  }
}

/**
 * Error code constants
 */
export const ErrorCodes = {
  NETWORK_ERROR: "NETWORK_ERROR",
  AUTH_ERROR: "AUTH_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  SERVER_ERROR: "SERVER_ERROR",
  PARSE_ERROR: "PARSE_ERROR",
  RATE_LIMIT: "RATE_LIMIT",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

/**
 * Parse error and return user-friendly AppError
 */
export function parseError(error: unknown): AppError {
  if (error instanceof AppErrorClass) {
    return error;
  }

  if (error instanceof Error) {
    // Network errors
    if (error.message.includes("fetch") || error.message.includes("network")) {
      if (error.message.includes("timeout")) {
        return new AppErrorClass(
          ErrorCodes.NETWORK_ERROR,
          "Request timed out",
          "The server took too long to respond. Please try again.",
          true
        );
      }
      if (error.message.includes("Failed to fetch")) {
        return new AppErrorClass(
          ErrorCodes.NETWORK_ERROR,
          "Network connection failed",
          "Please check your internet connection and try again.",
          true
        );
      }
      return new AppErrorClass(
        ErrorCodes.NETWORK_ERROR,
        "Network error",
        error.message,
        true
      );
    }

    // Parse errors
    if (error.message.includes("Invalid XML") || error.message.includes("parse")) {
      return new AppErrorClass(
        ErrorCodes.PARSE_ERROR,
        "Unable to parse data",
        error.message,
        true
      );
    }

    // Generic error
    return new AppErrorClass(
      ErrorCodes.UNKNOWN_ERROR,
      error.message || "An unexpected error occurred",
      error.message,
      false
    );
  }

  // Unknown error type
  return new AppErrorClass(
    ErrorCodes.UNKNOWN_ERROR,
    "An unexpected error occurred",
    "Please try again later.",
    true
  );
}

/**
 * Format error for user display
 */
export function formatErrorForDisplay(error: AppError): {
  title: string;
  message: string;
  showDetails: boolean;
} {
  const messages: Record<string, { title: string; message: string }> = {
    [ErrorCodes.NETWORK_ERROR]: {
      title: "Connection Error",
      message: error.message || "Unable to connect to the server. Please check your internet connection.",
    },
    [ErrorCodes.AUTH_ERROR]: {
      title: "Authentication Error",
      message: "You need to sign in to perform this action.",
    },
    [ErrorCodes.VALIDATION_ERROR]: {
      title: "Invalid Input",
      message: error.message || "Please check your input and try again.",
    },
    [ErrorCodes.NOT_FOUND]: {
      title: "Not Found",
      message: "The requested resource was not found.",
    },
    [ErrorCodes.SERVER_ERROR]: {
      title: "Server Error",
      message: "Something went wrong on our end. Please try again later.",
    },
    [ErrorCodes.PARSE_ERROR]: {
      title: "Data Error",
      message: "Unable to process the data. It might be in an invalid format.",
    },
    [ErrorCodes.RATE_LIMIT]: {
      title: "Too Many Requests",
      message: "Please wait a moment before trying again.",
    },
    [ErrorCodes.UNKNOWN_ERROR]: {
      title: "Unexpected Error",
      message: error.message || "An unexpected error occurred. Please try again.",
    },
  };

  const defaultMessage = messages[error.code] || messages[ErrorCodes.UNKNOWN_ERROR];
  
  return {
    title: defaultMessage.title,
    message: defaultMessage.message,
    showDetails: !!error.details && error.details !== error.message,
  };
}

/**
 * Safe fetch wrapper with error handling
 */
export async function safeFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      let errorDetails: string;
      
      if (contentType?.includes("application/json")) {
        try {
          const errorData = await response.json();
          errorDetails = errorData.error || errorData.message || response.statusText;
        } catch {
          errorDetails = response.statusText;
        }
      } else {
        errorDetails = response.statusText;
      }
      
      const appError = new AppErrorClass(
        response.status === 401 ? ErrorCodes.AUTH_ERROR :
        response.status === 404 ? ErrorCodes.NOT_FOUND :
        response.status === 429 ? ErrorCodes.RATE_LIMIT :
        response.status >= 500 ? ErrorCodes.SERVER_ERROR :
        ErrorCodes.UNKNOWN_ERROR,
        `Request failed: ${response.status}`,
        errorDetails,
        response.status < 500
      );
      
      throw appError;
    }
    
    return response;
  } catch (error) {
    if (error instanceof AppErrorClass) {
      throw error;
    }
    throw parseError(error);
  }
}
