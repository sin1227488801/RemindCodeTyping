import ApiClientFactory from './ApiClientFactory.js';

/**
 * Legacy API Adapter
 * Provides backward compatibility with the existing RctApi interface
 * while using the new infrastructure layer underneath
 */
class LegacyApiAdapter {
    constructor(config = {}) {
        // Initialize the new API infrastructure
        const services = ApiClientFactory.createDefault(config);
        
        this.apiClient = services.apiClient;
        this.tokenManager = services.tokenManager;
        this.authService = services.auth;
        this.studyBookService = services.studyBooks;
        this.typingService = services.typing;
        
        // Legacy properties for compatibility
        this.baseUrl = services.apiClient.baseUrl;
        this.userId = sessionStorage.getItem('userId');
        
        // Setup error display compatibility
        this.setupErrorDisplay();
    }

    /**
     * Setup error display to match legacy behavior
     */
    setupErrorDisplay() {
        // Add error interceptor to show user-friendly errors
        this.apiClient.addErrorInterceptor((error) => {
            this.showUserFriendlyError(error, error.endpoint || 'unknown');
            return error;
        });
    }

    // ===== Legacy Authentication Methods =====

    async demoLogin() {
        const response = await this.authService.demoLogin();
        this.setUser(response);
        return response;
    }

    async guestLogin() {
        const response = await this.authService.guestLogin();
        this.setUser(response);
        return response;
    }

    async login(loginId, password) {
        const response = await this.authService.login(loginId, password);
        this.setUser(response);
        return response;
    }

    async register(loginId, password) {
        const response = await this.authService.register(loginId, password);
        this.setUser(response);
        return response;
    }

    // ===== Legacy StudyBook Methods =====

    async getStudyBooks(params = {}) {
        return await this.studyBookService.getStudyBooks(params);
    }

    async getRandomStudyBooks(language = null, limit = 10) {
        return await this.studyBookService.getRandomStudyBooks(language, limit);
    }

    async createStudyBook(language, question, explanation) {
        return await this.studyBookService.createStudyBook({
            language,
            question,
            explanation
        });
    }

    async updateStudyBook(id, language, question, explanation) {
        return await this.studyBookService.updateStudyBook(id, {
            language,
            question,
            explanation
        });
    }

    async deleteStudyBook(id) {
        return await this.studyBookService.deleteStudyBook(id);
    }

    async getAllLanguages() {
        return await this.studyBookService.getAllLanguages();
    }

    async getSystemProblemLanguages() {
        return await this.studyBookService.getSystemProblemLanguages();
    }

    async getUserProblemLanguages() {
        return await this.studyBookService.getUserProblemLanguages();
    }

    async getSystemProblemsByLanguage(language) {
        return await this.studyBookService.getSystemProblemsByLanguage(language);
    }

    async getUserProblemsByLanguage(language) {
        return await this.studyBookService.getUserProblemsByLanguage(language);
    }

    // ===== Legacy Typing Methods =====

    async saveTypingLog(studyBookId, startedAt, durationMs, totalChars, correctChars) {
        return await this.typingService.saveTypingSession({
            studyBookId,
            startedAt,
            durationMs,
            totalChars,
            correctChars
        });
    }

    async getStats() {
        return await this.typingService.getTypingStatistics();
    }

    // ===== Legacy Request Methods =====

    async request(endpoint, options = {}) {
        return await this.apiClient.request(endpoint, options);
    }

    async requestWithRetry(endpoint, options = {}, maxRetries = 2) {
        // The new API client already has retry logic built-in
        return await this.apiClient.request(endpoint, options);
    }

    // ===== Legacy User Management =====

    setUser(userData) {
        this.userId = userData.userId;
        
        // Update session storage for compatibility
        if (userData.userId) {
            sessionStorage.setItem('userId', userData.userId);
        }
        if (userData.loginId) {
            sessionStorage.setItem('loginId', userData.loginId);
        }
        if (userData.guest !== undefined) {
            sessionStorage.setItem('isGuest', userData.guest.toString());
        }
        if (userData.token) {
            sessionStorage.setItem('token', userData.token);
            this.tokenManager.setTokens(userData.token, userData.refreshToken);
        }
    }

    getUser() {
        const currentUser = this.authService.getCurrentUser();
        
        if (currentUser) {
            return {
                userId: currentUser.userId,
                loginId: currentUser.loginId,
                isGuest: currentUser.isGuest,
                token: this.tokenManager.getToken()
            };
        }
        
        // Fallback to session storage
        return {
            userId: sessionStorage.getItem('userId'),
            loginId: sessionStorage.getItem('loginId'),
            isGuest: sessionStorage.getItem('isGuest') === 'true',
            token: sessionStorage.getItem('token')
        };
    }

    async logout() {
        console.log('API logout処理開始');
        try {
            await this.authService.logout();
            console.log('ログアウト完了');
            
            // Clear local properties
            this.userId = null;
            
            // Redirect to login page
            console.log('ログインページにリダイレクト中...');
            window.location.href = 'login.html';
        } catch (error) {
            console.error('ログアウト処理でエラー:', error);
            // Force redirect even on error
            window.location.href = 'login.html';
        }
    }

    isLoggedIn() {
        return this.authService.isAuthenticated();
    }

    // ===== Legacy Error Handling =====

    async handleSuccessResponse(response) {
        // This is now handled by the ApiClient
        return response;
    }

    async handleErrorResponse(response, endpoint) {
        // This is now handled by the ApiClient
        const error = new Error(`HTTP error! status: ${response.status}`);
        error.status = response.status;
        error.endpoint = endpoint;
        return error;
    }

    showUserFriendlyError(error, endpoint) {
        // Enhanced error display using the legacy method signature
        const errorContainer = document.getElementById('error-message');
        let userMessage = this.getErrorMessage(error, endpoint);
        
        if (errorContainer) {
            errorContainer.textContent = userMessage;
            errorContainer.style.display = 'block';
            errorContainer.className = 'error-message';
            
            setTimeout(() => {
                if (errorContainer) {
                    errorContainer.style.display = 'none';
                }
            }, 5000);
        } else {
            this.createAndShowErrorMessage(userMessage);
        }
    }

    getErrorMessage(error, endpoint) {
        // Enhanced error message mapping
        const endpointMessages = {
            '/auth/login': {
                401: 'ログインIDまたはパスワードが正しくありません。',
                403: 'アカウントがロックされています。管理者にお問い合わせください。',
                429: 'ログイン試行回数が上限に達しました。しばらく待ってから再試行してください。'
            },
            '/auth/register': {
                400: '入力内容に不備があります。IDとパスワードを確認してください。',
                409: 'このIDは既に使用されています。別のIDを選択してください。',
                422: 'パスワードが要件を満たしていません。'
            },
            '/studybooks': {
                400: '学習帳の内容に不備があります。入力内容を確認してください。',
                413: 'データサイズが大きすぎます。内容を短くしてください。'
            },
            '/typing/logs': {
                400: 'タイピング結果の保存に失敗しました。データを確認してください。'
            }
        };

        // Check for endpoint-specific messages
        for (const [path, messages] of Object.entries(endpointMessages)) {
            if (endpoint && endpoint.includes(path) && messages[error.status]) {
                return messages[error.status];
            }
        }

        // Use error message from the new infrastructure if available
        if (error.message && !error.message.includes('HTTP error')) {
            return error.message;
        }

        // Fallback to generic messages
        if (error.status === 400) {
            return 'リクエストの内容に問題があります。入力内容を確認してください。';
        } else if (error.status === 401) {
            return '認証が必要です。ログインしてください。';
        } else if (error.status === 403) {
            return 'この操作を実行する権限がありません。';
        } else if (error.status === 404) {
            return 'リクエストされたリソースが見つかりません。';
        } else if (error.status === 409) {
            return 'データの競合が発生しました。ページを更新して再試行してください。';
        } else if (error.status === 413) {
            return 'データサイズが大きすぎます。';
        } else if (error.status === 422) {
            return '入力データの形式が正しくありません。';
        } else if (error.status === 429) {
            return 'リクエストが多すぎます。しばらく待ってから再試行してください。';
        } else if (error.status >= 500 && error.status < 600) {
            return 'サーバーで問題が発生しました。しばらく待ってから再試行してください。';
        } else if (error.isNetworkError || (error.name === 'TypeError' && error.message.includes('fetch'))) {
            return 'ネットワークに接続できません。インターネット接続を確認してください。';
        } else {
            return 'エラーが発生しました。しばらく待ってから再試行してください。';
        }
    }

    createAndShowErrorMessage(message) {
        // Remove existing error message
        const existingError = document.querySelector('.rct-error-message');
        if (existingError) {
            existingError.remove();
        }

        // Create error message element
        const errorDiv = document.createElement('div');
        errorDiv.className = 'rct-error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
            border-radius: 4px;
            padding: 12px 16px;
            max-width: 400px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            line-height: 1.4;
        `;

        document.body.appendChild(errorDiv);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv && errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);

        // Manual removal on click
        errorDiv.addEventListener('click', () => {
            if (errorDiv && errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        });
    }

    showSuccessMessage(message) {
        // Remove existing success message
        const existingSuccess = document.querySelector('.rct-success-message');
        if (existingSuccess) {
            existingSuccess.remove();
        }

        // Create success message element
        const successDiv = document.createElement('div');
        successDiv.className = 'rct-success-message';
        successDiv.textContent = message;
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
            border-radius: 4px;
            padding: 12px 16px;
            max-width: 400px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            line-height: 1.4;
        `;

        document.body.appendChild(successDiv);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (successDiv && successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 3000);

        // Manual removal on click
        successDiv.addEventListener('click', () => {
            if (successDiv && successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        });
    }

    // ===== New Infrastructure Access =====

    /**
     * Get access to the new API infrastructure
     * @returns {Object} New API services
     */
    getNewInfrastructure() {
        return {
            apiClient: this.apiClient,
            tokenManager: this.tokenManager,
            authService: this.authService,
            studyBookService: this.studyBookService,
            typingService: this.typingService
        };
    }
}

export default LegacyApiAdapter;