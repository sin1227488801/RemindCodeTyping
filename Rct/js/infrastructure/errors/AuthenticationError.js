import RctError from './RctError.js';

/**
 * Authentication and authorization error class
 * Handles login failures, token issues, and permission problems
 */
class AuthenticationError extends RctError {
    /**
     * Creates a new AuthenticationError instance
     * @param {string} message - Error message
     * @param {string} type - Authentication error type
     * @param {Object} details - Additional error details
     * @param {Error} cause - Original error that caused this error
     */
    constructor(message = 'Authentication failed', type = 'GENERAL', details = null, cause = null) {
        const code = `AUTH_${type}`;
        super(message, code, details, cause);
        this.type = type;
    }

    /**
     * Get user-friendly error message
     * @returns {string} User-friendly message
     */
    getUserMessage() {
        switch (this.type) {
            case 'INVALID_CREDENTIALS':
                return 'ログインIDまたはパスワードが正しくありません。';
            case 'TOKEN_EXPIRED':
                return 'セッションが期限切れです。再度ログインしてください。';
            case 'TOKEN_INVALID':
                return '認証情報が無効です。再度ログインしてください。';
            case 'UNAUTHORIZED':
                return 'この操作を実行する権限がありません。';
            case 'FORBIDDEN':
                return 'アクセスが拒否されました。管理者にお問い合わせください。';
            case 'SESSION_EXPIRED':
                return 'セッションが期限切れです。再度ログインしてください。';
            case 'ACCOUNT_LOCKED':
                return 'アカウントがロックされています。管理者にお問い合わせください。';
            case 'ACCOUNT_DISABLED':
                return 'アカウントが無効になっています。管理者にお問い合わせください。';
            case 'LOGIN_REQUIRED':
                return 'この機能を使用するにはログインが必要です。';
            case 'REGISTRATION_FAILED':
                return 'ユーザー登録に失敗しました。入力内容を確認してください。';
            case 'PASSWORD_WEAK':
                return 'パスワードが弱すぎます。より強力なパスワードを設定してください。';
            case 'USER_EXISTS':
                return 'このログインIDは既に使用されています。';
            default:
                return '認証エラーが発生しました。';
        }
    }

    /**
     * Check if error requires redirect to login
     * @returns {boolean} Whether redirect to login is needed
     */
    requiresLoginRedirect() {
        return [
            'TOKEN_EXPIRED',
            'TOKEN_INVALID',
            'SESSION_EXPIRED',
            'LOGIN_REQUIRED',
            'UNAUTHORIZED'
        ].includes(this.type);
    }

    /**
     * Check if error is retryable
     * @returns {boolean} Whether error is retryable
     */
    isRetryable() {
        // Most auth errors are not retryable without user intervention
        return false;
    }

    /**
     * Get error severity level
     * @returns {string} Severity level
     */
    getSeverity() {
        switch (this.type) {
            case 'ACCOUNT_LOCKED':
            case 'ACCOUNT_DISABLED':
                return 'high';
            case 'TOKEN_EXPIRED':
            case 'SESSION_EXPIRED':
                return 'medium';
            default:
                return 'low';
        }
    }

    /**
     * Get error category
     * @returns {string} Error category
     */
    getCategory() {
        return 'authentication';
    }

    /**
     * Create invalid credentials error
     * @returns {AuthenticationError} New AuthenticationError instance
     */
    static invalidCredentials() {
        return new AuthenticationError(
            'Invalid login credentials',
            'INVALID_CREDENTIALS'
        );
    }

    /**
     * Create token expired error
     * @returns {AuthenticationError} New AuthenticationError instance
     */
    static tokenExpired() {
        return new AuthenticationError(
            'Authentication token has expired',
            'TOKEN_EXPIRED'
        );
    }

    /**
     * Create token invalid error
     * @returns {AuthenticationError} New AuthenticationError instance
     */
    static tokenInvalid() {
        return new AuthenticationError(
            'Authentication token is invalid',
            'TOKEN_INVALID'
        );
    }

    /**
     * Create unauthorized error
     * @returns {AuthenticationError} New AuthenticationError instance
     */
    static unauthorized() {
        return new AuthenticationError(
            'Unauthorized access',
            'UNAUTHORIZED'
        );
    }

    /**
     * Create forbidden error
     * @returns {AuthenticationError} New AuthenticationError instance
     */
    static forbidden() {
        return new AuthenticationError(
            'Access forbidden',
            'FORBIDDEN'
        );
    }

    /**
     * Create session expired error
     * @returns {AuthenticationError} New AuthenticationError instance
     */
    static sessionExpired() {
        return new AuthenticationError(
            'Session has expired',
            'SESSION_EXPIRED'
        );
    }

    /**
     * Create login required error
     * @returns {AuthenticationError} New AuthenticationError instance
     */
    static loginRequired() {
        return new AuthenticationError(
            'Login is required to access this resource',
            'LOGIN_REQUIRED'
        );
    }

    /**
     * Create registration failed error
     * @param {string} reason - Reason for registration failure
     * @returns {AuthenticationError} New AuthenticationError instance
     */
    static registrationFailed(reason = null) {
        return new AuthenticationError(
            'User registration failed',
            'REGISTRATION_FAILED',
            { reason }
        );
    }

    /**
     * Create user exists error
     * @param {string} loginId - Login ID that already exists
     * @returns {AuthenticationError} New AuthenticationError instance
     */
    static userExists(loginId) {
        return new AuthenticationError(
            'User already exists',
            'USER_EXISTS',
            { loginId }
        );
    }

    /**
     * Create weak password error
     * @param {Array} requirements - Password requirements that were not met
     * @returns {AuthenticationError} New AuthenticationError instance
     */
    static weakPassword(requirements = []) {
        return new AuthenticationError(
            'Password does not meet security requirements',
            'PASSWORD_WEAK',
            { requirements }
        );
    }
}

export default AuthenticationError;