/**
 * Token Manager for handling JWT authentication tokens
 * Provides secure token storage, validation, and refresh functionality
 */
class TokenManager {
    constructor(options = {}) {
        this.storageKey = options.storageKey || 'auth_token';
        this.refreshTokenKey = options.refreshTokenKey || 'refresh_token';
        this.tokenExpiryBuffer = options.tokenExpiryBuffer || 60000; // 1 minute buffer
        this.storage = options.storage || sessionStorage;
        
        // Callbacks
        this.onTokenExpired = options.onTokenExpired || null;
        this.onTokenRefreshed = options.onTokenRefreshed || null;
        
        this.initializeFromStorage();
    }

    /**
     * Initialize token manager from storage
     */
    initializeFromStorage() {
        const token = this.storage.getItem(this.storageKey);
        const refreshToken = this.storage.getItem(this.refreshTokenKey);
        
        if (token) {
            this.currentToken = token;
            this.validateToken();
        }
        
        if (refreshToken) {
            this.currentRefreshToken = refreshToken;
        }
    }

    /**
     * Set authentication tokens
     * @param {string} token - Access token
     * @param {string} refreshToken - Refresh token (optional)
     */
    setTokens(token, refreshToken = null) {
        this.currentToken = token;
        this.storage.setItem(this.storageKey, token);
        
        if (refreshToken) {
            this.currentRefreshToken = refreshToken;
            this.storage.setItem(this.refreshTokenKey, refreshToken);
        }
        
        this.validateToken();
        
        if (this.onTokenRefreshed) {
            this.onTokenRefreshed(token, refreshToken);
        }
    }

    /**
     * Get current access token
     * @returns {string|null} Current access token
     */
    getToken() {
        if (this.isTokenExpired()) {
            return null;
        }
        return this.currentToken;
    }

    /**
     * Get current refresh token
     * @returns {string|null} Current refresh token
     */
    getRefreshToken() {
        return this.currentRefreshToken;
    }

    /**
     * Check if token exists
     * @returns {boolean} Whether token exists
     */
    hasToken() {
        return !!this.currentToken && !this.isTokenExpired();
    }

    /**
     * Parse JWT token payload
     * @param {string} token - JWT token to parse
     * @returns {Object|null} Parsed token payload
     */
    parseToken(token = null) {
        const tokenToParse = token || this.currentToken;
        
        if (!tokenToParse) {
            return null;
        }
        
        try {
            const parts = tokenToParse.split('.');
            if (parts.length !== 3) {
                console.warn('Invalid JWT token format');
                return null;
            }
            
            const payload = parts[1];
            const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
            return JSON.parse(decoded);
        } catch (error) {
            console.error('Error parsing JWT token:', error);
            return null;
        }
    }

    /**
     * Get token expiration time
     * @param {string} token - Token to check (optional)
     * @returns {number|null} Expiration timestamp in milliseconds
     */
    getTokenExpiry(token = null) {
        const payload = this.parseToken(token);
        
        if (!payload || !payload.exp) {
            return null;
        }
        
        return payload.exp * 1000; // Convert to milliseconds
    }

    /**
     * Check if token is expired
     * @param {string} token - Token to check (optional)
     * @returns {boolean} Whether token is expired
     */
    isTokenExpired(token = null) {
        const expiry = this.getTokenExpiry(token);
        
        if (!expiry) {
            return true; // Consider invalid tokens as expired
        }
        
        const now = Date.now();
        return now >= (expiry - this.tokenExpiryBuffer);
    }

    /**
     * Check if token will expire soon
     * @param {number} threshold - Time threshold in milliseconds (default: 5 minutes)
     * @returns {boolean} Whether token will expire soon
     */
    isTokenExpiringSoon(threshold = 300000) {
        const expiry = this.getTokenExpiry();
        
        if (!expiry) {
            return true;
        }
        
        const now = Date.now();
        return now >= (expiry - threshold);
    }

    /**
     * Validate current token
     * @returns {boolean} Whether token is valid
     */
    validateToken() {
        if (!this.currentToken) {
            return false;
        }
        
        const payload = this.parseToken();
        if (!payload) {
            this.clearTokens();
            return false;
        }
        
        if (this.isTokenExpired()) {
            this.handleTokenExpired();
            return false;
        }
        
        return true;
    }

    /**
     * Handle token expiration
     */
    handleTokenExpired() {
        console.log('Token expired, clearing tokens');
        this.clearTokens();
        
        if (this.onTokenExpired) {
            this.onTokenExpired();
        }
    }

    /**
     * Clear all tokens
     */
    clearTokens() {
        this.currentToken = null;
        this.currentRefreshToken = null;
        this.storage.removeItem(this.storageKey);
        this.storage.removeItem(this.refreshTokenKey);
    }

    /**
     * Get user information from token
     * @returns {Object|null} User information from token payload
     */
    getUserInfo() {
        const payload = this.parseToken();
        
        if (!payload) {
            return null;
        }
        
        return {
            userId: payload.sub,
            loginId: payload.loginId,
            roles: payload.roles || [],
            issuedAt: payload.iat ? new Date(payload.iat * 1000) : null,
            expiresAt: payload.exp ? new Date(payload.exp * 1000) : null
        };
    }

    /**
     * Check if user has specific role
     * @param {string} role - Role to check
     * @returns {boolean} Whether user has the role
     */
    hasRole(role) {
        const userInfo = this.getUserInfo();
        return userInfo && userInfo.roles.includes(role);
    }

    /**
     * Get authorization header value
     * @returns {string|null} Authorization header value
     */
    getAuthorizationHeader() {
        const token = this.getToken();
        return token ? `Bearer ${token}` : null;
    }

    /**
     * Schedule automatic token refresh
     * @param {Function} refreshCallback - Function to call for token refresh
     * @param {number} refreshThreshold - Time before expiry to refresh (default: 5 minutes)
     */
    scheduleTokenRefresh(refreshCallback, refreshThreshold = 300000) {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }
        
        const expiry = this.getTokenExpiry();
        if (!expiry) {
            return;
        }
        
        const now = Date.now();
        const refreshTime = expiry - refreshThreshold;
        const delay = refreshTime - now;
        
        if (delay > 0) {
            this.refreshTimer = setTimeout(async () => {
                try {
                    console.log('Attempting automatic token refresh');
                    await refreshCallback();
                } catch (error) {
                    console.error('Automatic token refresh failed:', error);
                    this.handleTokenExpired();
                }
            }, delay);
            
            console.log(`Token refresh scheduled in ${Math.round(delay / 1000)} seconds`);
        }
    }

    /**
     * Cancel scheduled token refresh
     */
    cancelTokenRefresh() {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    /**
     * Create a token refresh function for use with ApiClient
     * @param {Function} refreshEndpointCall - Function that calls the refresh endpoint
     * @returns {Function} Token refresh function
     */
    createRefreshFunction(refreshEndpointCall) {
        return async () => {
            const refreshToken = this.getRefreshToken();
            
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }
            
            try {
                const response = await refreshEndpointCall(refreshToken);
                
                if (response.token) {
                    this.setTokens(response.token, response.refreshToken || refreshToken);
                    return response.token;
                }
                
                throw new Error('Invalid refresh response');
            } catch (error) {
                console.error('Token refresh failed:', error);
                this.clearTokens();
                throw error;
            }
        };
    }

    /**
     * Get token status information
     * @returns {Object} Token status information
     */
    getTokenStatus() {
        const token = this.currentToken;
        const refreshToken = this.currentRefreshToken;
        const expiry = this.getTokenExpiry();
        const userInfo = this.getUserInfo();
        
        return {
            hasToken: !!token,
            hasRefreshToken: !!refreshToken,
            isValid: this.validateToken(),
            isExpired: this.isTokenExpired(),
            isExpiringSoon: this.isTokenExpiringSoon(),
            expiresAt: expiry ? new Date(expiry) : null,
            userInfo
        };
    }
}

export default TokenManager;