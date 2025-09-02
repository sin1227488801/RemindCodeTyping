/**
 * Base error class for the RCT application
 * Provides common functionality for all application errors
 */
class RctError extends Error {
    /**
     * Creates a new RctError instance
     * @param {string} message - Error message
     * @param {string} code - Error code for programmatic handling
     * @param {Object} details - Additional error details
     * @param {Error} cause - Original error that caused this error
     */
    constructor(message, code, details = null, cause = null) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.details = details;
        this.cause = cause;
        this.timestamp = new Date();
        this.correlationId = this.generateCorrelationId();
        
        // Maintain proper stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    /**
     * Generate a correlation ID for error tracking
     * @returns {string} Correlation ID
     */
    generateCorrelationId() {
        return 'err_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get user-friendly error message
     * @returns {string} User-friendly message
     */
    getUserMessage() {
        return this.message;
    }

    /**
     * Get technical error details for logging
     * @returns {Object} Technical details
     */
    getTechnicalDetails() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            details: this.details,
            timestamp: this.timestamp.toISOString(),
            correlationId: this.correlationId,
            stack: this.stack,
            cause: this.cause ? {
                name: this.cause.name,
                message: this.cause.message,
                stack: this.cause.stack
            } : null
        };
    }

    /**
     * Convert error to plain object for serialization
     * @returns {Object} Plain object representation
     */
    toPlainObject() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            details: this.details,
            timestamp: this.timestamp.toISOString(),
            correlationId: this.correlationId,
            stack: this.stack
        };
    }

    /**
     * Create RctError from plain object
     * @param {Object} data - Plain object data
     * @returns {RctError} New RctError instance
     */
    static fromPlainObject(data) {
        const error = new RctError(data.message, data.code, data.details);
        if (data.timestamp) {
            error.timestamp = new Date(data.timestamp);
        }
        if (data.correlationId) {
            error.correlationId = data.correlationId;
        }
        if (data.stack) {
            error.stack = data.stack;
        }
        return error;
    }

    /**
     * Check if error is retryable
     * @returns {boolean} Whether error is retryable
     */
    isRetryable() {
        return false; // Override in subclasses
    }

    /**
     * Get error severity level
     * @returns {string} Severity level (low, medium, high, critical)
     */
    getSeverity() {
        return 'medium'; // Override in subclasses
    }

    /**
     * Get error category for classification
     * @returns {string} Error category
     */
    getCategory() {
        return 'general'; // Override in subclasses
    }

    /**
     * String representation of the error
     * @returns {string} String representation
     */
    toString() {
        return `${this.name}: ${this.message} (${this.code})`;
    }
}

export default RctError;