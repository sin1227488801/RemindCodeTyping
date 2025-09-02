import cacheManager, { CachePresets } from '../performance/CacheManager.js';

/**
 * HTTP Client with proper error handling, interceptors, retry logic, and caching
 * Implements the infrastructure layer for API communication with performance optimizations
 */
class ApiClient {
    constructor(baseUrl, options = {}) {
        // Auto-detect environment and set appropriate base URL
        this.baseUrl = baseUrl || this.getDefaultBaseUrl();
        this.defaultTimeout = options.timeout || 10000;
        this.maxRetries = options.maxRetries || 2;
        this.retryDelay = options.retryDelay || 1000;
        
        // Request/Response interceptors
        this.requestInterceptors = [];
        this.responseInterceptors = [];
        this.errorInterceptors = [];
        
        // Authentication token management
        this.authToken = null;
        this.tokenRefreshCallback = null;
        
        // Caching configuration
        this.cacheEnabled = options.cacheEnabled !== false;
        this.cacheManager = options.cacheManager || cacheManager;
        
        // Request deduplication
        this.pendingRequests = new Map();
        
        this.setupDefaultInterceptors();
    }

    /**
     * Get default base URL based on environment
     * @returns {string} Default API base URL
     */
    getDefaultBaseUrl() {
        const hostname = window.location.hostname;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:8080/api';
        } else {
            // Production environment - enable demo mode if backend not available
            console.log('Production environment detected - demo mode may be enabled');
            return 'https://rct-backend-production.up.railway.app/api';
        }
    }

    /**
     * Setup default interceptors for common functionality
     */
    setupDefaultInterceptors() {
        // Request interceptor for authentication
        this.addRequestInterceptor((config) => {
            if (this.authToken) {
                config.headers = config.headers || {};
                config.headers['Authorization'] = `Bearer ${this.authToken}`;
            }
            return config;
        });

        // Request interceptor for user ID (legacy support)
        this.addRequestInterceptor((config) => {
            const userId = sessionStorage.getItem('userId');
            if (userId && !config.headers['X-User-Id']) {
                config.headers = config.headers || {};
                config.headers['X-User-Id'] = userId;
            }
            return config;
        });

        // Response interceptor for token refresh
        this.addResponseInterceptor(
            (response) => response,
            async (error) => {
                if (error.status === 401 && this.tokenRefreshCallback) {
                    try {
                        const newToken = await this.tokenRefreshCallback();
                        if (newToken) {
                            this.setAuthToken(newToken);
                            // Retry the original request
                            return this.request(error.config.endpoint, error.config);
                        }
                    } catch (refreshError) {
                        console.error('Token refresh failed:', refreshError);
                    }
                }
                throw error;
            }
        );
    }

    /**
     * Add request interceptor
     * @param {Function} interceptor - Function that receives and returns config
     */
    addRequestInterceptor(interceptor) {
        this.requestInterceptors.push(interceptor);
    }

    /**
     * Add response interceptor
     * @param {Function} onSuccess - Function for successful responses
     * @param {Function} onError - Function for error responses
     */
    addResponseInterceptor(onSuccess, onError) {
        this.responseInterceptors.push({ onSuccess, onError });
    }

    /**
     * Add error interceptor
     * @param {Function} interceptor - Function that receives and handles errors
     */
    addErrorInterceptor(interceptor) {
        this.errorInterceptors.push(interceptor);
    }

    /**
     * Set authentication token
     * @param {string} token - JWT token
     */
    setAuthToken(token) {
        this.authToken = token;
        if (token) {
            sessionStorage.setItem('token', token);
        } else {
            sessionStorage.removeItem('token');
        }
    }

    /**
     * Get authentication token
     * @returns {string|null} Current auth token
     */
    getAuthToken() {
        return this.authToken || sessionStorage.getItem('token');
    }

    /**
     * Set token refresh callback
     * @param {Function} callback - Function to call when token needs refresh
     */
    setTokenRefreshCallback(callback) {
        this.tokenRefreshCallback = callback;
    }

    /**
     * Apply request interceptors to config
     * @param {Object} config - Request configuration
     * @returns {Object} Modified configuration
     */
    applyRequestInterceptors(config) {
        return this.requestInterceptors.reduce((acc, interceptor) => {
            return interceptor(acc) || acc;
        }, config);
    }

    /**
     * Apply response interceptors
     * @param {*} response - Response data
     * @param {Object} error - Error object (if any)
     * @returns {*} Processed response
     */
    async applyResponseInterceptors(response, error = null) {
        for (const interceptor of this.responseInterceptors) {
            try {
                if (error && interceptor.onError) {
                    response = await interceptor.onError(error);
                } else if (!error && interceptor.onSuccess) {
                    response = await interceptor.onSuccess(response);
                }
            } catch (interceptorError) {
                console.error('Response interceptor error:', interceptorError);
                if (!error) {
                    error = interceptorError;
                }
            }
        }
        
        if (error) {
            throw error;
        }
        
        return response;
    }

    /**
     * Apply error interceptors
     * @param {Error} error - Error to process
     * @returns {Error} Processed error
     */
    applyErrorInterceptors(error) {
        return this.errorInterceptors.reduce((acc, interceptor) => {
            try {
                return interceptor(acc) || acc;
            } catch (interceptorError) {
                console.error('Error interceptor failed:', interceptorError);
                return acc;
            }
        }, error);
    }

    /**
     * Build request configuration
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @returns {Object} Complete request configuration
     */
    buildRequestConfig(endpoint, options = {}) {
        const config = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            signal: options.signal,
            endpoint, // Store for retry logic
            ...options
        };

        // Apply request interceptors
        return this.applyRequestInterceptors(config);
    }

    /**
     * Handle successful response
     * @param {Response} response - Fetch response object
     * @returns {*} Parsed response data
     */
    async handleSuccessResponse(response) {
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            console.log(`API Response Data:`, data);
            return data;
        }
        
        // For non-JSON responses, return the response object
        return response;
    }

    /**
     * Handle error response
     * @param {Response} response - Fetch response object
     * @param {string} endpoint - API endpoint
     * @returns {Error} Formatted error object
     */
    async handleErrorResponse(response, endpoint) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errorDetails = null;
        
        try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                errorDetails = await response.json();
                if (errorDetails.message) {
                    errorMessage = errorDetails.message;
                } else if (errorDetails.error) {
                    errorMessage = errorDetails.error;
                }
            } else {
                const errorText = await response.text();
                if (errorText) {
                    errorMessage = errorText;
                }
            }
        } catch (e) {
            console.warn('Could not read error response body:', e);
        }
        
        const error = new Error(errorMessage);
        error.status = response.status;
        error.statusText = response.statusText;
        error.details = errorDetails;
        error.endpoint = endpoint;
        error.isHttpError = true;
        
        return error;
    }

    /**
     * Check if error is retryable
     * @param {Error} error - Error to check
     * @returns {boolean} Whether error is retryable
     */
    isRetryableError(error) {
        // Don't retry client errors (4xx) except for specific cases
        if (error.status >= 400 && error.status < 500) {
            // Retry on 408 (Request Timeout) and 429 (Too Many Requests)
            return error.status === 408 || error.status === 429;
        }
        
        // Retry on server errors (5xx) and network errors
        return error.status >= 500 || error.name === 'TypeError' || !error.status;
    }

    /**
     * Calculate retry delay with exponential backoff
     * @param {number} attempt - Current attempt number
     * @returns {number} Delay in milliseconds
     */
    calculateRetryDelay(attempt) {
        return this.retryDelay * Math.pow(2, attempt - 1);
    }

    /**
     * Main request method with retry logic and caching
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @returns {Promise<*>} Response data
     */
    async request(endpoint, options = {}) {
        const method = options.method || 'GET';
        const cacheOptions = options.cache || {};
        
        // Check cache for GET requests
        if (method === 'GET' && this.cacheEnabled && !options.skipCache) {
            const cacheKey = this.buildCacheKey(method, endpoint, options.params);
            
            try {
                const cachedData = await this.cacheManager.get(cacheKey);
                if (cachedData !== null) {
                    console.log(`Cache hit for ${endpoint}`);
                    return cachedData;
                }
            } catch (error) {
                console.warn('Cache retrieval failed:', error);
            }
        }
        
        // Check for duplicate requests
        const requestKey = this.buildRequestKey(method, endpoint, options);
        if (this.pendingRequests.has(requestKey)) {
            console.log(`Deduplicating request for ${endpoint}`);
            return this.pendingRequests.get(requestKey);
        }
        
        // Create request promise
        const requestPromise = this.executeRequest(endpoint, options);
        
        // Store pending request for deduplication
        this.pendingRequests.set(requestKey, requestPromise);
        
        try {
            const data = await requestPromise;
            
            // Cache successful GET responses
            if (method === 'GET' && this.cacheEnabled && !options.skipCache) {
                const cacheKey = this.buildCacheKey(method, endpoint, options.params);
                const cacheConfig = this.determineCacheConfig(endpoint, cacheOptions);
                
                try {
                    await this.cacheManager.set(cacheKey, data, cacheConfig);
                    console.log(`Cached response for ${endpoint}`);
                } catch (error) {
                    console.warn('Cache storage failed:', error);
                }
            }
            
            return data;
        } finally {
            // Remove from pending requests
            this.pendingRequests.delete(requestKey);
        }
    }

    /**
     * Execute the actual HTTP request
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @returns {Promise<*>} Response data
     */
    async executeRequest(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        let lastError;
        
        for (let attempt = 1; attempt <= this.maxRetries + 1; attempt++) {
            try {
                if (attempt > 1) {
                    console.log(`API Retry attempt ${attempt - 1} for ${endpoint}`);
                    const delay = this.calculateRetryDelay(attempt - 1);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
                
                const config = this.buildRequestConfig(endpoint, options);
                
                // Create timeout signal if not provided
                if (!config.signal && this.defaultTimeout > 0) {
                    const controller = new AbortController();
                    config.signal = controller.signal;
                    setTimeout(() => controller.abort(), this.defaultTimeout);
                }
                
                console.log(`API Request: ${config.method} ${url}`, config);
                
                const response = await fetch(url, config);
                
                console.log(`API Response: ${response.status}`, response);
                
                if (!response.ok) {
                    const error = await this.handleErrorResponse(response, endpoint);
                    error.config = config; // Store config for retry logic
                    throw error;
                }
                
                const data = await this.handleSuccessResponse(response);
                return await this.applyResponseInterceptors(data);
                
            } catch (error) {
                lastError = this.applyErrorInterceptors(error);
                
                // Enhanced network error detection
                if (error.name === 'TypeError' && error.message.includes('fetch')) {
                    lastError.message = 'ネットワークエラー: サーバーに接続できません。バックエンドが起動しているか確認してください。';
                    lastError.isNetworkError = true;
                } else if (error.name === 'AbortError') {
                    lastError.message = 'リクエストがタイムアウトしました。';
                    lastError.isTimeoutError = true;
                }
                
                console.error(`API Error (${endpoint}):`, lastError);
                
                // Check if we should retry
                if (attempt <= this.maxRetries && this.isRetryableError(lastError)) {
                    console.log(`Retrying request... (${attempt}/${this.maxRetries})`);
                    continue;
                }
                
                // Apply response interceptors for error handling
                try {
                    await this.applyResponseInterceptors(null, lastError);
                } catch (interceptorError) {
                    // If interceptor throws, use that error instead
                    lastError = interceptorError;
                }
                
                break;
            }
        }
        
        throw lastError;
    }

    /**
     * Build cache key for request
     * @param {string} method - HTTP method
     * @param {string} endpoint - API endpoint
     * @param {Object} params - Request parameters
     * @returns {string} Cache key
     */
    buildCacheKey(method, endpoint, params = {}) {
        return this.cacheManager.constructor.createApiKey(method, endpoint, params);
    }

    /**
     * Build request key for deduplication
     * @param {string} method - HTTP method
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @returns {string} Request key
     */
    buildRequestKey(method, endpoint, options = {}) {
        const key = `${method}_${endpoint}`;
        if (options.params) {
            return `${key}_${JSON.stringify(options.params)}`;
        }
        return key;
    }

    /**
     * Determine cache configuration based on endpoint
     * @param {string} endpoint - API endpoint
     * @param {Object} cacheOptions - Cache options from request
     * @returns {Object} Cache configuration
     */
    determineCacheConfig(endpoint, cacheOptions = {}) {
        // Use provided cache options if available
        if (Object.keys(cacheOptions).length > 0) {
            return cacheOptions;
        }
        
        // Default cache configurations based on endpoint patterns
        if (endpoint.includes('/statistics') || endpoint.includes('/dashboard')) {
            return CachePresets.MEDIUM_TERM;
        } else if (endpoint.includes('/user/profile') || endpoint.includes('/settings')) {
            return CachePresets.LONG_TERM;
        } else if (endpoint.includes('/random') || endpoint.includes('/search')) {
            return CachePresets.SHORT_TERM;
        } else if (endpoint.includes('/languages') || endpoint.includes('/system-problems')) {
            return CachePresets.LONG_TERM;
        }
        
        // Default to medium-term caching
        return CachePresets.MEDIUM_TERM;
    }

    /**
     * Invalidate cache for specific patterns
     * @param {string|RegExp} pattern - Pattern to match cache keys
     * @returns {Promise<void>}
     */
    async invalidateCache(pattern) {
        if (typeof pattern === 'string') {
            await this.cacheManager.remove(pattern);
        } else {
            // For regex patterns, we'd need to implement cache key enumeration
            console.warn('Regex cache invalidation not implemented yet');
        }
    }

    /**
     * Clear all API cache
     * @returns {Promise<void>}
     */
    async clearCache() {
        await this.cacheManager.clear();
    }

    /**
     * GET request
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @returns {Promise<*>} Response data
     */
    async get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    /**
     * POST request
     * @param {string} endpoint - API endpoint
     * @param {*} data - Request body data
     * @param {Object} options - Request options
     * @returns {Promise<*>} Response data
     */
    async post(endpoint, data = null, options = {}) {
        const requestOptions = { ...options, method: 'POST' };
        if (data !== null) {
            requestOptions.body = JSON.stringify(data);
        }
        return this.request(endpoint, requestOptions);
    }

    /**
     * PUT request
     * @param {string} endpoint - API endpoint
     * @param {*} data - Request body data
     * @param {Object} options - Request options
     * @returns {Promise<*>} Response data
     */
    async put(endpoint, data = null, options = {}) {
        const requestOptions = { ...options, method: 'PUT' };
        if (data !== null) {
            requestOptions.body = JSON.stringify(data);
        }
        return this.request(endpoint, requestOptions);
    }

    /**
     * DELETE request
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @returns {Promise<*>} Response data
     */
    async delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }

    /**
     * PATCH request
     * @param {string} endpoint - API endpoint
     * @param {*} data - Request body data
     * @param {Object} options - Request options
     * @returns {Promise<*>} Response data
     */
    async patch(endpoint, data = null, options = {}) {
        const requestOptions = { ...options, method: 'PATCH' };
        if (data !== null) {
            requestOptions.body = JSON.stringify(data);
        }
        return this.request(endpoint, requestOptions);
    }
}

export default ApiClient;