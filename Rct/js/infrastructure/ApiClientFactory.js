import ApiClient from './http/ApiClient.js';
import TokenManager from './auth/TokenManager.js';
import AuthApiService from './api/AuthApiService.js';
import StudyBookApiService from './api/StudyBookApiService.js';
import TypingApiService from './api/TypingApiService.js';

/**
 * API Client Factory
 * Creates and configures the complete API client infrastructure
 */
class ApiClientFactory {
    constructor(config = {}) {
        this.config = {
            baseUrl: config.baseUrl || 'http://localhost:8080/api',
            timeout: config.timeout || 10000,
            maxRetries: config.maxRetries || 2,
            retryDelay: config.retryDelay || 1000,
            tokenStorage: config.tokenStorage || sessionStorage,
            ...config
        };
        
        this.instances = {};
        this.initialized = false;
    }

    /**
     * Initialize the API client infrastructure
     * @returns {Object} Configured API services
     */
    initialize() {
        if (this.initialized) {
            return this.getServices();
        }

        // Create core components
        this.apiClient = this.createApiClient();
        this.tokenManager = this.createTokenManager();
        
        // Create API services
        this.authService = this.createAuthService();
        this.studyBookService = this.createStudyBookService();
        this.typingService = this.createTypingService();
        
        // Setup integrations
        this.setupTokenIntegration();
        this.setupErrorHandling();
        this.setupLogging();
        
        this.initialized = true;
        
        return this.getServices();
    }

    /**
     * Create the main API client
     * @returns {ApiClient} Configured API client
     */
    createApiClient() {
        const client = new ApiClient(this.config.baseUrl, {
            timeout: this.config.timeout,
            maxRetries: this.config.maxRetries,
            retryDelay: this.config.retryDelay
        });
        
        // Add request logging interceptor
        client.addRequestInterceptor((config) => {
            if (this.config.enableRequestLogging) {
                console.log(`[API Request] ${config.method} ${config.endpoint}`, config);
            }
            return config;
        });
        
        // Add response logging interceptor
        client.addResponseInterceptor(
            (response) => {
                if (this.config.enableResponseLogging) {
                    console.log(`[API Response]`, response);
                }
                return response;
            },
            (error) => {
                if (this.config.enableErrorLogging) {
                    console.error(`[API Error]`, error);
                }
                throw error;
            }
        );
        
        return client;
    }

    /**
     * Create the token manager
     * @returns {TokenManager} Configured token manager
     */
    createTokenManager() {
        return new TokenManager({
            storage: this.config.tokenStorage,
            tokenExpiryBuffer: this.config.tokenExpiryBuffer || 60000,
            onTokenExpired: () => {
                console.log('Token expired, redirecting to login');
                if (this.config.onTokenExpired) {
                    this.config.onTokenExpired();
                } else {
                    this.handleTokenExpired();
                }
            },
            onTokenRefreshed: (token, refreshToken) => {
                console.log('Token refreshed successfully');
                if (this.config.onTokenRefreshed) {
                    this.config.onTokenRefreshed(token, refreshToken);
                }
            }
        });
    }

    /**
     * Create the authentication service
     * @returns {AuthApiService} Configured auth service
     */
    createAuthService() {
        return new AuthApiService(this.apiClient, this.tokenManager);
    }

    /**
     * Create the study book service
     * @returns {StudyBookApiService} Configured study book service
     */
    createStudyBookService() {
        return new StudyBookApiService(this.apiClient);
    }

    /**
     * Create the typing service
     * @returns {TypingApiService} Configured typing service
     */
    createTypingService() {
        return new TypingApiService(this.apiClient);
    }

    /**
     * Setup token integration between components
     */
    setupTokenIntegration() {
        // Initialize token from storage
        const existingToken = this.tokenManager.getToken();
        if (existingToken) {
            this.apiClient.setAuthToken(existingToken);
        }
        
        // Setup token refresh callback
        const refreshFunction = this.tokenManager.createRefreshFunction(
            async (refreshToken) => {
                return await this.authService.refreshToken(refreshToken);
            }
        );
        
        this.apiClient.setTokenRefreshCallback(refreshFunction);
    }

    /**
     * Setup global error handling
     */
    setupErrorHandling() {
        // Add global error interceptor
        this.apiClient.addErrorInterceptor((error) => {
            // Handle specific error types
            if (error.status === 401) {
                console.warn('Unauthorized request, clearing tokens');
                this.tokenManager.clearTokens();
                
                if (this.config.onUnauthorized) {
                    this.config.onUnauthorized(error);
                } else {
                    this.handleUnauthorized(error);
                }
            } else if (error.status === 403) {
                console.warn('Forbidden request');
                
                if (this.config.onForbidden) {
                    this.config.onForbidden(error);
                }
            } else if (error.status >= 500) {
                console.error('Server error:', error);
                
                if (this.config.onServerError) {
                    this.config.onServerError(error);
                }
            }
            
            return error;
        });
    }

    /**
     * Setup request/response logging
     */
    setupLogging() {
        if (this.config.enableDetailedLogging) {
            // Add detailed request interceptor
            this.apiClient.addRequestInterceptor((config) => {
                const timestamp = new Date().toISOString();
                console.group(`[${timestamp}] API Request: ${config.method} ${config.endpoint}`);
                console.log('Headers:', config.headers);
                if (config.body) {
                    console.log('Body:', config.body);
                }
                console.groupEnd();
                return config;
            });
            
            // Add detailed response interceptor
            this.apiClient.addResponseInterceptor(
                (response) => {
                    const timestamp = new Date().toISOString();
                    console.group(`[${timestamp}] API Response: Success`);
                    console.log('Data:', response);
                    console.groupEnd();
                    return response;
                },
                (error) => {
                    const timestamp = new Date().toISOString();
                    console.group(`[${timestamp}] API Response: Error`);
                    console.error('Error:', error);
                    console.groupEnd();
                    throw error;
                }
            );
        }
    }

    /**
     * Handle token expiration
     */
    handleTokenExpired() {
        // Clear all authentication data
        this.tokenManager.clearTokens();
        this.apiClient.setAuthToken(null);
        
        // Redirect to login page
        if (typeof window !== 'undefined' && window.location) {
            window.location.href = 'login.html';
        }
    }

    /**
     * Handle unauthorized requests
     * @param {Error} error - Unauthorized error
     */
    handleUnauthorized(error) {
        // Show user-friendly message
        if (this.config.showErrorMessages !== false) {
            this.showErrorMessage('認証が必要です。ログインしてください。');
        }
        
        // Redirect to login after a short delay
        setTimeout(() => {
            this.handleTokenExpired();
        }, 2000);
    }

    /**
     * Show error message to user
     * @param {string} message - Error message
     */
    showErrorMessage(message) {
        // Try to use existing error display mechanism
        if (typeof window !== 'undefined' && window.rctApi && window.rctApi.showUserFriendlyError) {
            window.rctApi.showUserFriendlyError({ message }, 'auth');
        } else {
            // Fallback to alert or console
            if (typeof alert !== 'undefined') {
                alert(message);
            } else {
                console.error(message);
            }
        }
    }

    /**
     * Get all configured services
     * @returns {Object} API services
     */
    getServices() {
        if (!this.initialized) {
            throw new Error('ApiClientFactory must be initialized first');
        }
        
        return {
            apiClient: this.apiClient,
            tokenManager: this.tokenManager,
            auth: this.authService,
            studyBooks: this.studyBookService,
            typing: this.typingService
        };
    }

    /**
     * Get a specific service
     * @param {string} serviceName - Name of the service
     * @returns {*} Requested service
     */
    getService(serviceName) {
        const services = this.getServices();
        
        if (!services[serviceName]) {
            throw new Error(`Service '${serviceName}' not found`);
        }
        
        return services[serviceName];
    }

    /**
     * Reconfigure the factory
     * @param {Object} newConfig - New configuration
     */
    reconfigure(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        if (this.initialized) {
            // Re-initialize with new config
            this.initialized = false;
            this.initialize();
        }
    }

    /**
     * Destroy the factory and clean up resources
     */
    destroy() {
        if (this.tokenManager) {
            this.tokenManager.cancelTokenRefresh();
            this.tokenManager.clearTokens();
        }
        
        this.instances = {};
        this.initialized = false;
    }

    /**
     * Create a factory with default configuration
     * @param {Object} config - Optional configuration overrides
     * @returns {ApiClientFactory} Configured factory
     */
    static createDefault(config = {}) {
        const defaultConfig = {
            enableRequestLogging: process.env.NODE_ENV === 'development',
            enableResponseLogging: process.env.NODE_ENV === 'development',
            enableErrorLogging: true,
            enableDetailedLogging: process.env.NODE_ENV === 'development',
            showErrorMessages: true,
            ...config
        };
        
        const factory = new ApiClientFactory(defaultConfig);
        return factory.initialize();
    }

    /**
     * Create a factory for production use
     * @param {Object} config - Optional configuration overrides
     * @returns {ApiClientFactory} Configured factory for production
     */
    static createProduction(config = {}) {
        const productionConfig = {
            enableRequestLogging: false,
            enableResponseLogging: false,
            enableErrorLogging: true,
            enableDetailedLogging: false,
            showErrorMessages: true,
            maxRetries: 3,
            timeout: 15000,
            ...config
        };
        
        const factory = new ApiClientFactory(productionConfig);
        return factory.initialize();
    }
}

export default ApiClientFactory;