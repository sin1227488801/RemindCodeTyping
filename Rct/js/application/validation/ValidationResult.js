/**
 * ValidationResult
 * Represents the result of a validation operation
 */
class ValidationResult {
    /**
     * Creates a new ValidationResult instance
     * @param {boolean} isValid - Whether the validation passed
     * @param {ValidationError[]} errors - Array of validation errors
     */
    constructor(isValid, errors = []) {
        this.isValid = isValid;
        this.errors = errors;
    }

    /**
     * Creates a successful validation result
     * @returns {ValidationResult} Success result
     */
    static success() {
        return new ValidationResult(true, []);
    }

    /**
     * Creates a failed validation result
     * @param {ValidationError[]} errors - Array of validation errors
     * @returns {ValidationResult} Failure result
     */
    static failure(errors) {
        return new ValidationResult(false, Array.isArray(errors) ? errors : [errors]);
    }

    /**
     * Adds an error to the validation result
     * @param {ValidationError} error - Error to add
     */
    addError(error) {
        this.errors.push(error);
        this.isValid = false;
    }

    /**
     * Adds multiple errors to the validation result
     * @param {ValidationError[]} errors - Errors to add
     */
    addErrors(errors) {
        this.errors.push(...errors);
        if (errors.length > 0) {
            this.isValid = false;
        }
    }

    /**
     * Gets errors for a specific field
     * @param {string} field - Field name
     * @returns {ValidationError[]} Array of errors for the field
     */
    getErrorsForField(field) {
        return this.errors.filter(error => error.field === field);
    }

    /**
     * Gets the first error for a specific field
     * @param {string} field - Field name
     * @returns {ValidationError|null} First error for the field or null
     */
    getFirstErrorForField(field) {
        const fieldErrors = this.getErrorsForField(field);
        return fieldErrors.length > 0 ? fieldErrors[0] : null;
    }

    /**
     * Checks if there are errors for a specific field
     * @param {string} field - Field name
     * @returns {boolean} True if there are errors for the field
     */
    hasErrorsForField(field) {
        return this.getErrorsForField(field).length > 0;
    }

    /**
     * Gets all error messages
     * @returns {string[]} Array of error messages
     */
    getErrorMessages() {
        return this.errors.map(error => error.message);
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
     * Gets a summary of all errors
     * @returns {string} Summary string
     */
    getErrorSummary() {
        if (this.isValid) {
            return 'Validation passed';
        }

        const errorCount = this.errors.length;
        const fieldCount = new Set(this.errors.map(error => error.field)).size;
        
        return `${errorCount} error${errorCount !== 1 ? 's' : ''} found in ${fieldCount} field${fieldCount !== 1 ? 's' : ''}`;
    }

    /**
     * Combines this validation result with another
     * @param {ValidationResult} other - Other validation result to combine
     * @returns {ValidationResult} Combined validation result
     */
    combine(other) {
        const combinedErrors = [...this.errors, ...other.errors];
        const isValid = this.isValid && other.isValid;
        return new ValidationResult(isValid, combinedErrors);
    }

    /**
     * Converts the validation result to a plain object
     * @returns {Object} Plain object representation
     */
    toObject() {
        return {
            isValid: this.isValid,
            errors: this.errors.map(error => error.toObject ? error.toObject() : error),
            errorCount: this.errors.length,
            summary: this.getErrorSummary()
        };
    }

    /**
     * Converts the validation result to JSON
     * @returns {string} JSON representation
     */
    toJSON() {
        return JSON.stringify(this.toObject());
    }

    /**
     * Creates a ValidationResult from a plain object
     * @param {Object} obj - Plain object to create from
     * @returns {ValidationResult} ValidationResult instance
     */
    static fromObject(obj) {
        const errors = obj.errors.map(errorData => {
            if (errorData instanceof ValidationError) {
                return errorData;
            }
            return ValidationError.fromObject ? ValidationError.fromObject(errorData) : errorData;
        });
        
        return new ValidationResult(obj.isValid, errors);
    }

    /**
     * Creates a ValidationResult from JSON
     * @param {string} json - JSON string to parse
     * @returns {ValidationResult} ValidationResult instance
     */
    static fromJSON(json) {
        const obj = JSON.parse(json);
        return ValidationResult.fromObject(obj);
    }
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ValidationResult;
} else if (typeof window !== 'undefined') {
    window.ValidationResult = ValidationResult;
}