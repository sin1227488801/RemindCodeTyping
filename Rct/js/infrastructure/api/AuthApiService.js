/**
 * Authentication API Service
 * Handles all authentication-related API calls
 */
class AuthApiService {
    constructor(apiClient, tokenManager) {
        this.apiClient = apiClient;
        this.tokenManager = tokenManager;
    }

    /**
     * Demo login for testing
     * @returns {Promise<Object>} User data
     */
    async demoLogin() {
        try {
            const response = await this.apiClient.post('/auth/demo');
            this.handleAuthResponse(response);
            return response;
        } catch (error) {
            throw this.handleAuthError(error, 'demo login');
        }
    }

    /**
     * Guest login
     * @returns {Promise<Object>} User data
     */
    async guestLogin() {
        try {
            const response = await this.apiClient.post('/auth/demo');
            this.handleAuthResponse(response);
            return response;
        } catch (error) {
            throw this.handleAuthError(error, 'guest login');
        }
    }

    /**
     * User login with credentials
     * @param {string} loginId - User login ID
     * @param {string} password - User password
     * @returns {Promise<Object>} User data with token
     */
    async login(loginId, password) {
        if (!loginId || !password) {
            throw new Error('ログインIDとパスワードを入力してください。');
        }

        try {
            const response = await this.apiClient.post('/auth/login', {
                loginId: loginId.trim(),
                password
            });
            
            this.handleAuthResponse(response);
            return response;
        } catch (error) {
            throw this.handleAuthError(error, 'login');
        }
    }

    /**
     * Register new user
     * @param {string} loginId - Desired login ID
     * @param {string} password - User password
     * @returns {Promise<Object>} User data with token
     */
    async register(loginId, password) {
        if (!loginId || !password) {
            throw new Error('ログインIDとパスワードを入力してください。');
        }

        if (password.length < 8) {
            throw new Error('パスワードは8文字以上で入力してください。');
        }

        try {
            const response = await this.apiClient.post('/auth/register', {
                loginId: loginId.trim(),
                password
            });
            
            this.handleAuthResponse(response);
            return response;
        } catch (error) {
            throw this.handleAuthError(error, 'registration');
        }
    }

    /**
     * Refresh authentication token
     * @param {string} refreshToken - Refresh token
     * @returns {Promise<Object>} New token data
     */
    async refreshToken(refreshToken) {
        if (!refreshToken) {
            throw new Error('Refresh token is required');
        }

        try {
            const response = await this.apiClient.post('/auth/refresh', {
                refreshToken
            });
            
            if (response.token) {
                this.tokenManager.setTokens(response.token, response.refreshToken || refreshToken);
                this.apiClient.setAuthToken(response.token);
            }
            
            return response;
        } catch (error) {
            console.error('Token refresh failed:', error);
            this.tokenManager.clearTokens();
            throw error;
        }
    }

    /**
     * Logout user
     * @returns {Promise<void>}
     */
    async logout() {
        try {
            // Call logout endpoint if available
            const token = this.tokenManager.getToken();
            if (token) {
                try {
                    await this.apiClient.post('/auth/logout');
                } catch (error) {
                    // Continue with local logout even if server logout fails
                    console.warn('Server logout failed, continuing with local logout:', error);
                }
            }
        } finally {
            // Always clear local tokens and session data
            this.tokenManager.clearTokens();
            this.apiClient.setAuthToken(null);
            this.clearSessionData();
        }
    }

    /**
     * Check if user is currently authenticated
     * @returns {boolean} Authentication status
     */
    isAuthenticated() {
        return this.tokenManager.hasToken();
    }

    /**
     * Get current user information
     * @returns {Object|null} Current user data
     */
    getCurrentUser() {
        const userInfo = this.tokenManager.getUserInfo();
        
        if (!userInfo) {
            return null;
        }
        
        return {
            userId: userInfo.userId,
            loginId: userInfo.loginId,
            isGuest: sessionStorage.getItem('isGuest') === 'true',
            roles: userInfo.roles || []
        };
    }

    /**
     * Validate current session
     * @returns {Promise<boolean>} Whether session is valid
     */
    async validateSession() {
        try {
            if (!this.tokenManager.hasToken()) {
                return false;
            }

            // Call a protected endpoint to validate token
            await this.apiClient.get('/auth/validate');
            return true;
        } catch (error) {
            console.warn('Session validation failed:', error);
            
            // Try to refresh token if available
            const refreshToken = this.tokenManager.getRefreshToken();
            if (refreshToken) {
                try {
                    await this.refreshToken(refreshToken);
                    return true;
                } catch (refreshError) {
                    console.error('Token refresh during validation failed:', refreshError);
                }
            }
            
            // Clear invalid session
            this.tokenManager.clearTokens();
            this.clearSessionData();
            return false;
        }
    }

    /**
     * Handle successful authentication response
     * @param {Object} response - Authentication response
     */
    handleAuthResponse(response) {
        if (response.token) {
            this.tokenManager.setTokens(response.token, response.refreshToken);
            this.apiClient.setAuthToken(response.token);
        }
        
        // Store user data in session storage (legacy compatibility)
        if (response.userId) {
            sessionStorage.setItem('userId', response.userId);
        }
        if (response.loginId) {
            sessionStorage.setItem('loginId', response.loginId);
        }
        if (response.guest !== undefined) {
            sessionStorage.setItem('isGuest', response.guest.toString());
        }
        
        // Setup automatic token refresh
        if (response.token) {
            this.setupTokenRefresh();
        }
    }

    /**
     * Handle authentication errors
     * @param {Error} error - Original error
     * @param {string} operation - Operation that failed
     * @returns {Error} Enhanced error
     */
    handleAuthError(error, operation) {
        console.error(`Authentication error during ${operation}:`, error);
        
        // Enhance error messages for better user experience
        if (error.status === 401) {
            if (operation === 'login') {
                error.message = 'ログインIDまたはパスワードが正しくありません。';
            } else if (operation === 'registration') {
                error.message = '登録に失敗しました。入力内容を確認してください。';
            }
        } else if (error.status === 409 && operation === 'registration') {
            error.message = 'このIDは既に使用されています。別のIDを選択してください。';
        } else if (error.status === 422) {
            error.message = 'パスワードが要件を満たしていません。8文字以上で入力してください。';
        } else if (error.status === 429) {
            error.message = 'ログイン試行回数が上限に達しました。しばらく待ってから再試行してください。';
        } else if (error.isNetworkError) {
            error.message = 'ネットワークに接続できません。インターネット接続を確認してください。';
        }
        
        return error;
    }

    /**
     * Setup automatic token refresh
     */
    setupTokenRefresh() {
        const refreshFunction = this.tokenManager.createRefreshFunction(
            (refreshToken) => this.refreshToken(refreshToken)
        );
        
        this.apiClient.setTokenRefreshCallback(refreshFunction);
        this.tokenManager.scheduleTokenRefresh(refreshFunction);
    }

    /**
     * Clear session data
     */
    clearSessionData() {
        sessionStorage.removeItem('userId');
        sessionStorage.removeItem('loginId');
        sessionStorage.removeItem('isGuest');
        sessionStorage.removeItem('token');
    }

    /**
     * Get authentication status information
     * @returns {Object} Authentication status
     */
    getAuthStatus() {
        const tokenStatus = this.tokenManager.getTokenStatus();
        const currentUser = this.getCurrentUser();
        
        return {
            isAuthenticated: this.isAuthenticated(),
            user: currentUser,
            token: tokenStatus,
            sessionValid: tokenStatus.isValid && !tokenStatus.isExpired
        };
    }
}

export default AuthApiService;