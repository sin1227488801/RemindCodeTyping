import RctError from './RctError.js';

/**
 * Network-related error class
 * Handles HTTP errors, connection issues, and API communication problems
 */
class NetworkError extends RctError {
    /**
     * Creates a new NetworkError instance
     * @param {string} message - Error message
     * @param {number} status - HTTP status code
     * @param {string} endpoint - API endpoint that failed
     * @param {Object} details - Additional error details
     * @param {Error} cause - Original error that caused this error
     */
    constructor(message, status = null, endpoint = null, details = null, cause = null) {
        const code = NetworkError.getErrorCode(status);
        super(message, code, { status, endpoint, ...details }, cause);
        this.status = status;
        this.endpoint = endpoint;
    }

    /**
     * Get error code based on HTTP status
     * @param {number} status - HTTP status code
     * @returns {string} Error code
     */
    static getErrorCode(status) {
        if (!status) return 'NETWORK_ERROR';
        
        if (status >= 400 && status < 500) {
            return `CLIENT_ERROR_${status}`;
        } else if (status >= 500) {
            return `SERVER_ERROR_${status}`;
        } else {
            return 'NETWORK_ERROR';
        }
    }

    /**
     * Get user-friendly error message
     * @returns {string} User-friendly message
     */
    getUserMessage() {
        if (!this.status) {
            return 'ネットワークエラーが発生しました。インターネット接続を確認してください。';
        }

        switch (this.status) {
            case 400:
                return 'リクエストに問題があります。入力内容を確認してください。';
            case 401:
                return 'ログインが必要です。再度ログインしてください。';
            case 403:
                return 'この操作を実行する権限がありません。';
            case 404:
                return 'リクエストされたリソースが見つかりません。';
            case 408:
                return 'リクエストがタイムアウトしました。再度お試しください。';
            case 409:
                return 'データの競合が発生しました。ページを更新して再度お試しください。';
            case 429:
                return 'リクエストが多すぎます。しばらく待ってから再度お試しください。';
            case 500:
                return 'サーバーエラーが発生しました。しばらく待ってから再度お試しください。';
            case 502:
            case 503:
            case 504:
                return 'サーバーが一時的に利用できません。しばらく待ってから再度お試しください。';
            default:
                if (this.status >= 400 && this.status < 500) {
                    return 'リクエストエラーが発生しました。入力内容を確認してください。';
                } else if (this.status >= 500) {
                    return 'サーバーエラーが発生しました。しばらく待ってから再度お試しください。';
                } else {
                    return 'ネットワークエラーが発生しました。';
                }
        }
    }

    /**
     * Check if error is retryable
     * @returns {boolean} Whether error is retryable
     */
    isRetryable() {
        if (!this.status) return true; // Network errors are retryable
        
        // Retry on server errors and specific client errors
        return this.status >= 500 || 
               this.status === 408 || // Request Timeout
               this.status === 429;   // Too Many Requests
    }

    /**
     * Get error severity level
     * @returns {string} Severity level
     */
    getSeverity() {
        if (!this.status) return 'high';
        
        if (this.status >= 500) return 'high';
        if (this.status === 401 || this.status === 403) return 'medium';
        return 'low';
    }

    /**
     * Get error category
     * @returns {string} Error category
     */
    getCategory() {
        return 'network';
    }

    /**
     * Create NetworkError from fetch error
     * @param {Error} fetchError - Original fetch error
     * @param {string} endpoint - API endpoint
     * @returns {NetworkError} New NetworkError instance
     */
    static fromFetchError(fetchError, endpoint) {
        let message = 'ネットワークエラーが発生しました。';
        
        if (fetchError.name === 'TypeError' && fetchError.message.includes('fetch')) {
            message = 'サーバーに接続できません。バックエンドが起動しているか確認してください。';
        } else if (fetchError.name === 'AbortError') {
            message = 'リクエストがタイムアウトしました。';
        }
        
        return new NetworkError(message, null, endpoint, null, fetchError);
    }

    /**
     * Create NetworkError from HTTP response
     * @param {Response} response - HTTP response
     * @param {string} endpoint - API endpoint
     * @param {Object} errorData - Error data from response body
     * @returns {NetworkError} New NetworkError instance
     */
    static fromHttpResponse(response, endpoint, errorData = null) {
        let message = `HTTP error! status: ${response.status}`;
        
        if (errorData) {
            if (errorData.message) {
                message = errorData.message;
            } else if (errorData.error) {
                message = errorData.error;
            }
        }
        
        return new NetworkError(
            message,
            response.status,
            endpoint,
            {
                statusText: response.statusText,
                errorData
            }
        );
    }

    /**
     * Create timeout error
     * @param {string} endpoint - API endpoint
     * @param {number} timeout - Timeout duration in ms
     * @returns {NetworkError} New NetworkError instance
     */
    static timeout(endpoint, timeout) {
        return new NetworkError(
            `リクエストがタイムアウトしました (${timeout}ms)`,
            408,
            endpoint,
            { timeout }
        );
    }

    /**
     * Create connection error
     * @param {string} endpoint - API endpoint
     * @returns {NetworkError} New NetworkError instance
     */
    static connectionError(endpoint) {
        return new NetworkError(
            'サーバーに接続できません',
            null,
            endpoint,
            { type: 'connection' }
        );
    }
}

export default NetworkError;