/**
 * ValidationError Value Object
 * Represents validation errors with detailed information
 */
class ValidationError extends Error {
    /**
     * Creates a new ValidationError instance
     * @param {string} message - Error message
     * @param {string|null} field - Field name that caused the error
     * @param {string|null} code - Error code for programmatic handling
     * @param {*} value - The invalid value that caused the error
     */
    constructor(message, field = null, code = null, value = null) {
        super(message);
        this.name = 'ValidationError';
        this._field = field;
        this._code = code;
        this._value = value;
        this._timestamp = new Date();
    }

    // Getters
    get field() {
        return this._field;
    }

    get code() {
        return this._code;
    }

    get value() {
        return this._value;
    }

    get timestamp() {
        return this._timestamp;
    }

    /**
     * Converts the error to a plain object for serialization
     * @returns {Object} Plain object representation
     */
    toPlainObject() {
        return {
            name: this.name,
            message: this.message,
            field: this._field,
            code: this._code,
            value: this._value,
            timestamp: this._timestamp.toISOString(),
            stack: this.stack
        };
    }

    /**
     * Creates a ValidationError instance from a plain object
     * @param {Object} data - Plain object data
     * @returns {ValidationError} New ValidationError instance
     */
    static fromPlainObject(data) {
        const error = new ValidationError(data.message, data.field, data.code, data.value);
        if (data.timestamp) {
            error._timestamp = new Date(data.timestamp);
        }
        if (data.stack) {
            error.stack = data.stack;
        }
        return error;
    }

    /**
     * Creates a required field validation error
     * @param {string} field - Field name
     * @returns {ValidationError} New ValidationError instance
     */
    static required(field) {
        return new ValidationError(
            `${field} is required`,
            field,
            'REQUIRED',
            null
        );
    }

    /**
     * Creates a type validation error
     * @param {string} field - Field name
     * @param {string} expectedType - Expected type
     * @param {*} actualValue - Actual value
     * @returns {ValidationError} New ValidationError instance
     */
    static invalidType(field, expectedType, actualValue) {
        return new ValidationError(
            `${field} must be of type ${expectedType}`,
            field,
            'INVALID_TYPE',
            actualValue
        );
    }

    /**
     * Creates a length validation error
     * @param {string} field - Field name
     * @param {number} minLength - Minimum length
     * @param {number} maxLength - Maximum length
     * @param {*} actualValue - Actual value
     * @returns {ValidationError} New ValidationError instance
     */
    static invalidLength(field, minLength, maxLength, actualValue) {
        let message;
        if (minLength && maxLength) {
            message = `${field} must be between ${minLength} and ${maxLength} characters`;
        } else if (minLength) {
            message = `${field} must be at least ${minLength} characters`;
        } else if (maxLength) {
            message = `${field} must be at most ${maxLength} characters`;
        } else {
            message = `${field} has invalid length`;
        }

        return new ValidationError(
            message,
            field,
            'INVALID_LENGTH',
            actualValue
        );
    }

    /**
     * Creates a format validation error
     * @param {string} field - Field name
     * @param {string} format - Expected format
     * @param {*} actualValue - Actual value
     * @returns {ValidationError} New ValidationError instance
     */
    static invalidFormat(field, format, actualValue) {
        return new ValidationError(
            `${field} must match the format: ${format}`,
            field,
            'INVALID_FORMAT',
            actualValue
        );
    }

    /**
     * Creates a range validation error
     * @param {string} field - Field name
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @param {*} actualValue - Actual value
     * @returns {ValidationError} New ValidationError instance
     */
    static outOfRange(field, min, max, actualValue) {
        return new ValidationError(
            `${field} must be between ${min} and ${max}`,
            field,
            'OUT_OF_RANGE',
            actualValue
        );
    }
}

/**
 * ValidationResult Value Object
 * Represents the result of a validation operation
 */
class ValidationResult {
    /**
     * Creates a new ValidationResult instance
     * @param {boolean} isValid - Whether validation passed
     * @param {ValidationError[]} errors - Array of validation errors
     */
    constructor(isValid, errors = []) {
        this._isValid = isValid;
        this._errors = [...errors];
        this._timestamp = new Date();
    }

    // Getters
    get isValid() {
        return this._isValid;
    }

    get errors() {
        return [...this._errors];
    }

    get timestamp() {
        return this._timestamp;
    }

    /**
     * Gets the first error
     * @returns {ValidationError|null} First error or null if no errors
     */
    getFirstError() {
        return this._errors.length > 0 ? this._errors[0] : null;
    }

    /**
     * Gets errors for a specific field
     * @param {string} field - Field name
     * @returns {ValidationError[]} Array of errors for the field
     */
    getErrorsForField(field) {
        return this._errors.filter(error => error.field === field);
    }

    /**
     * Gets all error messages
     * @returns {string[]} Array of error messages
     */
    getErrorMessages() {
        return this._errors.map(error => error.message);
    }

    /**
     * Gets error messages for a specific field
     * @param {string} field - Field name
     * @returns {string[]} Array of error messages for the field
     */
    getErrorMessagesForField(field) {
        return this.getErrorsForField(field).map(error => error.message);
    }

    /**
     * Adds an error to the result
     * @param {ValidationError} error - Error to add
     */
    addError(error) {
        if (!(error instanceof ValidationError)) {
            throw new Error('Error must be an instance of ValidationError');
        }
        this._errors.push(error);
        this._isValid = false;
    }

    /**
     * Merges another validation result into this one
     * @param {ValidationResult} other - Other validation result
     */
    merge(other) {
        if (!(other instanceof ValidationResult)) {
            throw new Error('Other must be an instance of ValidationResult');
        }
        
        this._errors.push(...other._errors);
        if (!other._isValid) {
            this._isValid = false;
        }
    }

    /**
     * Converts the result to a plain object for serialization
     * @returns {Object} Plain object representation
     */
    toPlainObject() {
        return {
            isValid: this._isValid,
            errors: this._errors.map(error => error.toPlainObject()),
            timestamp: this._timestamp.toISOString()
        };
    }

    /**
     * Creates a ValidationResult instance from a plain object
     * @param {Object} data - Plain object data
     * @returns {ValidationResult} New ValidationResult instance
     */
    static fromPlainObject(data) {
        const errors = data.errors ? data.errors.map(errorData => ValidationError.fromPlainObject(errorData)) : [];
        const result = new ValidationResult(data.isValid, errors);
        if (data.timestamp) {
            result._timestamp = new Date(data.timestamp);
        }
        return result;
    }

    /**
     * Creates a successful validation result
     * @returns {ValidationResult} Successful validation result
     */
    static success() {
        return new ValidationResult(true, []);
    }

    /**
     * Creates a failed validation result with errors
     * @param {ValidationError|ValidationError[]} errors - Error or array of errors
     * @returns {ValidationResult} Failed validation result
     */
    static failure(errors) {
        const errorArray = Array.isArray(errors) ? errors : [errors];
        return new ValidationResult(false, errorArray);
    }

    /**
     * Returns a string representation of the result
     * @returns {string} String representation
     */
    toString() {
        if (this._isValid) {
            return 'ValidationResult(valid)';
        } else {
            return `ValidationResult(invalid, ${this._errors.length} errors)`;
        }
    }
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ValidationError, ValidationResult };
} else if (typeof window !== 'undefined') {
    window.ValidationError = ValidationError;
    window.ValidationResult = ValidationResult;
}