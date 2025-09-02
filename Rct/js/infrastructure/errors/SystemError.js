import RctError from './RctError.js';

/**
 * System-level error class
 * Handles unexpected errors, configuration issues, and system failures
 */
class SystemError extends RctError {
    /**
     * Creates a new SystemError instance
     * @param {string} message - Error message
     * @param {string} type - System error type
     * @param {Object} details - Additional error details
     * @param {Error} cause - Original error that caused this error
     */
    constructor(message, type = 'GENERAL', details = null, cause = null) {
        const code = `SYSTEM_${type}`;
        super(message, code, details, cause);
        this.type = type;
    }

    /**
     * Get user-friendly error message
     * @returns {string} User-friendly message
     */
    getUserMessage() {
        switch (this.type) {
            case 'CONFIGURATION_ERROR':
                return 'システム設定に問題があります。管理者にお問い合わせください。';
            case 'DEPENDENCY_ERROR':
                return 'システムの依存関係に問題があります。';
            case 'STORAGE_ERROR':
                return 'データの保存に失敗しました。';
            case 'PARSING_ERROR':
                return 'データの解析に失敗しました。';
            case 'SERIALIZATION_ERROR':
                return 'データの変換に失敗しました。';
            case 'INITIALIZATION_ERROR':
                return 'システムの初期化に失敗しました。';
            case 'RESOURCE_ERROR':
                return 'システムリソースの問題が発生しました。';
            case 'UNEXPECTED_ERROR':
                return '予期しないエラーが発生しました。しばらく待ってから再度お試しください。';
            case 'BROWSER_NOT_SUPPORTED':
                return 'お使いのブラウザはサポートされていません。';
            case 'FEATURE_NOT_AVAILABLE':
                return 'この機能は現在利用できません。';
            default:
                return 'システムエラーが発生しました。管理者にお問い合わせください。';
        }
    }

    /**
     * Check if error is retryable
     * @returns {boolean} Whether error is retryable
     */
    isRetryable() {
        // Most system errors are not retryable
        return this.type === 'RESOURCE_ERROR' || this.type === 'UNEXPECTED_ERROR';
    }

    /**
     * Get error severity level
     * @returns {string} Severity level
     */
    getSeverity() {
        switch (this.type) {
            case 'CONFIGURATION_ERROR':
            case 'DEPENDENCY_ERROR':
            case 'INITIALIZATION_ERROR':
                return 'critical';
            case 'STORAGE_ERROR':
            case 'RESOURCE_ERROR':
                return 'high';
            case 'PARSING_ERROR':
            case 'SERIALIZATION_ERROR':
                return 'medium';
            default:
                return 'high';
        }
    }

    /**
     * Get error category
     * @returns {string} Error category
     */
    getCategory() {
        return 'system';
    }

    /**
     * Create configuration error
     * @param {string} component - Component with configuration issue
     * @param {string} issue - Configuration issue description
     * @returns {SystemError} New SystemError instance
     */
    static configurationError(component, issue) {
        return new SystemError(
            `Configuration error in ${component}: ${issue}`,
            'CONFIGURATION_ERROR',
            { component, issue }
        );
    }

    /**
     * Create dependency error
     * @param {string} dependency - Missing or failed dependency
     * @returns {SystemError} New SystemError instance
     */
    static dependencyError(dependency) {
        return new SystemError(
            `Dependency error: ${dependency}`,
            'DEPENDENCY_ERROR',
            { dependency }
        );
    }

    /**
     * Create storage error
     * @param {string} operation - Storage operation that failed
     * @param {Error} cause - Original error
     * @returns {SystemError} New SystemError instance
     */
    static storageError(operation, cause = null) {
        return new SystemError(
            `Storage error during ${operation}`,
            'STORAGE_ERROR',
            { operation },
            cause
        );
    }

    /**
     * Create parsing error
     * @param {string} data - Data that failed to parse
     * @param {Error} cause - Original parsing error
     * @returns {SystemError} New SystemError instance
     */
    static parsingError(data, cause = null) {
        return new SystemError(
            'Data parsing failed',
            'PARSING_ERROR',
            { dataType: typeof data },
            cause
        );
    }

    /**
     * Create serialization error
     * @param {*} data - Data that failed to serialize
     * @param {Error} cause - Original serialization error
     * @returns {SystemError} New SystemError instance
     */
    static serializationError(data, cause = null) {
        return new SystemError(
            'Data serialization failed',
            'SERIALIZATION_ERROR',
            { dataType: typeof data },
            cause
        );
    }

    /**
     * Create initialization error
     * @param {string} component - Component that failed to initialize
     * @param {Error} cause - Original error
     * @returns {SystemError} New SystemError instance
     */
    static initializationError(component, cause = null) {
        return new SystemError(
            `Initialization failed for ${component}`,
            'INITIALIZATION_ERROR',
            { component },
            cause
        );
    }

    /**
     * Create resource error
     * @param {string} resource - Resource that caused the error
     * @param {string} operation - Operation that failed
     * @returns {SystemError} New SystemError instance
     */
    static resourceError(resource, operation) {
        return new SystemError(
            `Resource error: ${resource} during ${operation}`,
            'RESOURCE_ERROR',
            { resource, operation }
        );
    }

    /**
     * Create unexpected error
     * @param {Error} cause - Original unexpected error
     * @returns {SystemError} New SystemError instance
     */
    static unexpectedError(cause = null) {
        return new SystemError(
            'An unexpected error occurred',
            'UNEXPECTED_ERROR',
            null,
            cause
        );
    }

    /**
     * Create browser not supported error
     * @param {string} feature - Feature not supported
     * @param {string} browser - Browser information
     * @returns {SystemError} New SystemError instance
     */
    static browserNotSupported(feature, browser = null) {
        return new SystemError(
            `Browser does not support ${feature}`,
            'BROWSER_NOT_SUPPORTED',
            { feature, browser }
        );
    }

    /**
     * Create feature not available error
     * @param {string} feature - Feature that is not available
     * @param {string} reason - Reason why feature is not available
     * @returns {SystemError} New SystemError instance
     */
    static featureNotAvailable(feature, reason = null) {
        return new SystemError(
            `Feature not available: ${feature}`,
            'FEATURE_NOT_AVAILABLE',
            { feature, reason }
        );
    }

    /**
     * Create error from generic JavaScript error
     * @param {Error} error - Original JavaScript error
     * @param {string} context - Context where error occurred
     * @returns {SystemError} New SystemError instance
     */
    static fromJavaScriptError(error, context = null) {
        let type = 'UNEXPECTED_ERROR';
        
        if (error instanceof TypeError) {
            type = 'DEPENDENCY_ERROR';
        } else if (error instanceof ReferenceError) {
            type = 'CONFIGURATION_ERROR';
        } else if (error instanceof SyntaxError) {
            type = 'PARSING_ERROR';
        }
        
        return new SystemError(
            error.message,
            type,
            { context, originalErrorType: error.constructor.name },
            error
        );
    }
}

export default SystemError;