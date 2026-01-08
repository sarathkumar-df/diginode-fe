/**
 * Standardized Error Classes and Handling
 * 
 * Provides consistent error handling across all server actions.
 */

// =============================================================================
// ERROR CODES
// =============================================================================

export const ErrorCode = {
    // Authentication & Authorization
    UNAUTHORIZED: "UNAUTHORIZED",
    FORBIDDEN: "FORBIDDEN",

    // Lock Errors
    LOCK_ACQUIRED_BY_OTHER: "LOCK_ACQUIRED_BY_OTHER",
    LOCK_LOST: "LOCK_LOST",
    LOCK_NOT_HELD: "LOCK_NOT_HELD",

    // Concurrency Errors
    VERSION_CONFLICT: "VERSION_CONFLICT",

    // Resource Errors
    NOT_FOUND: "NOT_FOUND",

    // Rate Limiting
    RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",

    // Validation
    VALIDATION_ERROR: "VALIDATION_ERROR",

    // General
    INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

// =============================================================================
// ERROR CLASSES
// =============================================================================

export class AppError extends Error {
    public readonly code: ErrorCodeType;
    public readonly statusCode: number;
    public readonly details?: Record<string, unknown>;

    constructor(
        code: ErrorCodeType,
        message: string,
        statusCode: number = 500,
        details?: Record<string, unknown>
    ) {
        super(message);
        this.name = "AppError";
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;

        // Maintains proper stack trace for where error was thrown
        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            success: false,
            error: {
                code: this.code,
                message: this.message,
                details: this.details,
            },
        };
    }
}

// =============================================================================
// SPECIFIC ERROR CLASSES
// =============================================================================

export class UnauthorizedError extends AppError {
    constructor(message: string = "Authentication required") {
        super(ErrorCode.UNAUTHORIZED, message, 401);
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = "Access denied") {
        super(ErrorCode.FORBIDDEN, message, 403);
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string = "Resource") {
        super(ErrorCode.NOT_FOUND, `${resource} not found`, 404);
    }
}

export class LockConflictError extends AppError {
    constructor(
        lockedByUserId: string,
        message: string = "Resource is locked by another user"
    ) {
        super(ErrorCode.LOCK_ACQUIRED_BY_OTHER, message, 409, { lockedByUserId });
    }
}

export class LockLostError extends AppError {
    constructor(message: string = "Your lock has been stolen by another user") {
        super(ErrorCode.LOCK_LOST, message, 409);
    }
}

export class LockNotHeldError extends AppError {
    constructor(message: string = "You do not hold the lock for this resource") {
        super(ErrorCode.LOCK_NOT_HELD, message, 403);
    }
}

export class VersionConflictError extends AppError {
    constructor(
        currentVersion: number,
        expectedVersion: number
    ) {
        super(
            ErrorCode.VERSION_CONFLICT,
            "The resource has been modified. Please refresh and try again.",
            409,
            { currentVersion, expectedVersion }
        );
    }
}

export class RateLimitError extends AppError {
    constructor(
        limit: number,
        resetTime?: Date
    ) {
        super(
            ErrorCode.RATE_LIMIT_EXCEEDED,
            `Rate limit exceeded. Maximum ${limit} requests per hour.`,
            429,
            { limit, resetTime: resetTime?.toISOString() }
        );
    }
}

export class ValidationError extends AppError {
    constructor(
        message: string,
        details?: Record<string, unknown>
    ) {
        super(ErrorCode.VALIDATION_ERROR, message, 400, details);
    }
}

// =============================================================================
// ACTION RESULT TYPES
// =============================================================================

export type ActionResult<T> =
    | { success: true; data: T }
    | { success: false; error: { code: ErrorCodeType; message: string; details?: Record<string, unknown> } };

/**
 * Helper to create a successful result
 */
export function successResult<T>(data: T): ActionResult<T> {
    return { success: true, data };
}

/**
 * Helper to create an error result from an AppError
 */
export function errorResult<T>(error: AppError): ActionResult<T> {
    return {
        success: false,
        error: {
            code: error.code,
            message: error.message,
            details: error.details,
        },
    };
}

/**
 * Helper to handle errors in server actions
 */
export function handleActionError<T>(error: unknown): ActionResult<T> {
    console.error("[Action Error]", error);

    if (error instanceof AppError) {
        return errorResult(error);
    }

    if (error instanceof Error) {
        return {
            success: false,
            error: {
                code: ErrorCode.INTERNAL_ERROR,
                message: error.message,
            },
        };
    }

    return {
        success: false,
        error: {
            code: ErrorCode.INTERNAL_ERROR,
            message: "An unexpected error occurred",
        },
    };
}
