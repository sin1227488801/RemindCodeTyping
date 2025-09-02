import RctError from './RctError.js';

/**
 * Business logic error class
 * Handles domain-specific errors and business rule violations
 */
class BusinessError extends RctError {
    /**
     * Creates a new BusinessError instance
     * @param {string} message - Error message
     * @param {string} type - Business error type
     * @param {string} entity - Entity related to the error
     * @param {Object} details - Additional error details
     * @param {Error} cause - Original error that caused this error
     */
    constructor(message, type = 'GENERAL', entity = null, details = null, cause = null) {
        const code = `BUSINESS_${type}`;
        super(message, code, { entity, ...details }, cause);
        this.type = type;
        this.entity = entity;
    }

    /**
     * Get user-friendly error message
     * @returns {string} User-friendly message
     */
    getUserMessage() {
        switch (this.type) {
            case 'ENTITY_NOT_FOUND':
                return `${this.getEntityDisplayName()}が見つかりません。`;
            case 'ENTITY_ALREADY_EXISTS':
                return `${this.getEntityDisplayName()}は既に存在します。`;
            case 'INVALID_OPERATION':
                return 'この操作は現在実行できません。';
            case 'BUSINESS_RULE_VIOLATION':
                return 'ビジネスルールに違反しています。';
            case 'CONCURRENT_MODIFICATION':
                return 'データが他のユーザーによって変更されています。ページを更新して再度お試しください。';
            case 'RESOURCE_LIMIT_EXCEEDED':
                return 'リソースの上限に達しました。';
            case 'INVALID_STATE':
                return 'データの状態が無効です。';
            case 'DEPENDENCY_ERROR':
                return '関連するデータに問題があります。';
            case 'STUDY_BOOK_LIMIT_EXCEEDED':
                return '学習帳の作成上限に達しました。';
            case 'TYPING_SESSION_INVALID':
                return 'タイピングセッションが無効です。';
            case 'LANGUAGE_NOT_SUPPORTED':
                return 'サポートされていない言語です。';
            default:
                return 'ビジネスエラーが発生しました。';
        }
    }

    /**
     * Get display name for entity
     * @returns {string} Entity display name
     */
    getEntityDisplayName() {
        switch (this.entity) {
            case 'User':
                return 'ユーザー';
            case 'StudyBook':
                return '学習帳';
            case 'TypingSession':
                return 'タイピングセッション';
            default:
                return this.entity || 'データ';
        }
    }

    /**
     * Check if error is retryable
     * @returns {boolean} Whether error is retryable
     */
    isRetryable() {
        // Some business errors might be retryable after user action
        return this.type === 'CONCURRENT_MODIFICATION';
    }

    /**
     * Get error severity level
     * @returns {string} Severity level
     */
    getSeverity() {
        switch (this.type) {
            case 'ENTITY_NOT_FOUND':
            case 'ENTITY_ALREADY_EXISTS':
                return 'low';
            case 'BUSINESS_RULE_VIOLATION':
            case 'INVALID_OPERATION':
                return 'medium';
            case 'CONCURRENT_MODIFICATION':
            case 'RESOURCE_LIMIT_EXCEEDED':
                return 'high';
            default:
                return 'medium';
        }
    }

    /**
     * Get error category
     * @returns {string} Error category
     */
    getCategory() {
        return 'business';
    }

    /**
     * Create entity not found error
     * @param {string} entity - Entity type
     * @param {string} identifier - Entity identifier
     * @returns {BusinessError} New BusinessError instance
     */
    static entityNotFound(entity, identifier = null) {
        return new BusinessError(
            `${entity} not found`,
            'ENTITY_NOT_FOUND',
            entity,
            { identifier }
        );
    }

    /**
     * Create entity already exists error
     * @param {string} entity - Entity type
     * @param {string} identifier - Entity identifier
     * @returns {BusinessError} New BusinessError instance
     */
    static entityAlreadyExists(entity, identifier = null) {
        return new BusinessError(
            `${entity} already exists`,
            'ENTITY_ALREADY_EXISTS',
            entity,
            { identifier }
        );
    }

    /**
     * Create invalid operation error
     * @param {string} operation - Operation that failed
     * @param {string} reason - Reason for failure
     * @returns {BusinessError} New BusinessError instance
     */
    static invalidOperation(operation, reason = null) {
        return new BusinessError(
            `Invalid operation: ${operation}`,
            'INVALID_OPERATION',
            null,
            { operation, reason }
        );
    }

    /**
     * Create business rule violation error
     * @param {string} rule - Business rule that was violated
     * @param {Object} context - Context information
     * @returns {BusinessError} New BusinessError instance
     */
    static businessRuleViolation(rule, context = null) {
        return new BusinessError(
            `Business rule violation: ${rule}`,
            'BUSINESS_RULE_VIOLATION',
            null,
            { rule, context }
        );
    }

    /**
     * Create concurrent modification error
     * @param {string} entity - Entity that was modified
     * @returns {BusinessError} New BusinessError instance
     */
    static concurrentModification(entity) {
        return new BusinessError(
            `Concurrent modification detected for ${entity}`,
            'CONCURRENT_MODIFICATION',
            entity
        );
    }

    /**
     * Create resource limit exceeded error
     * @param {string} resource - Resource type
     * @param {number} limit - Resource limit
     * @returns {BusinessError} New BusinessError instance
     */
    static resourceLimitExceeded(resource, limit) {
        return new BusinessError(
            `Resource limit exceeded for ${resource}`,
            'RESOURCE_LIMIT_EXCEEDED',
            null,
            { resource, limit }
        );
    }

    /**
     * Create study book limit exceeded error
     * @param {number} limit - Study book limit
     * @returns {BusinessError} New BusinessError instance
     */
    static studyBookLimitExceeded(limit) {
        return new BusinessError(
            'Study book creation limit exceeded',
            'STUDY_BOOK_LIMIT_EXCEEDED',
            'StudyBook',
            { limit }
        );
    }

    /**
     * Create typing session invalid error
     * @param {string} reason - Reason for invalidity
     * @returns {BusinessError} New BusinessError instance
     */
    static typingSessionInvalid(reason) {
        return new BusinessError(
            'Typing session is invalid',
            'TYPING_SESSION_INVALID',
            'TypingSession',
            { reason }
        );
    }

    /**
     * Create language not supported error
     * @param {string} language - Unsupported language
     * @returns {BusinessError} New BusinessError instance
     */
    static languageNotSupported(language) {
        return new BusinessError(
            `Language not supported: ${language}`,
            'LANGUAGE_NOT_SUPPORTED',
            null,
            { language }
        );
    }
}

export default BusinessError;