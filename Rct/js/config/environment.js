/**
 * Environment configuration for RCT application
 * Automatically detects environment and sets appropriate API endpoints
 */

class EnvironmentConfig {
    constructor() {
        this.environment = this.detectEnvironment();
        this.config = this.getConfig();
    }

    /**
     * Detect current environment based on hostname
     * @returns {string} Environment name
     */
    detectEnvironment() {
        const hostname = window.location.hostname;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'development';
        } else if (hostname.includes('github.io')) {
            return 'production';
        } else if (hostname.includes('netlify.app') || hostname.includes('vercel.app')) {
            return 'production';
        } else {
            return 'production'; // Default to production for safety
        }
    }

    /**
     * Get configuration for current environment
     * @returns {Object} Configuration object
     */
    getConfig() {
        const configs = {
            development: {
                apiBaseUrl: 'http://localhost:8080/api',
                enableLogging: true,
                enableCache: true,
                requestTimeout: 10000,
                maxRetries: 2
            },
            production: {
                // Railway backend URL - deployed and ready!
                apiBaseUrl: 'https://remindcodetyping-production.up.railway.app/api',
                enableLogging: false,
                enableCache: true,
                requestTimeout: 15000,
                maxRetries: 3
            }
        };

        return configs[this.environment] || configs.production;
    }

    /**
     * Get API base URL
     * @returns {string} API base URL
     */
    getApiBaseUrl() {
        return this.config.apiBaseUrl;
    }

    /**
     * Check if logging is enabled
     * @returns {boolean} Whether logging is enabled
     */
    isLoggingEnabled() {
        return this.config.enableLogging;
    }

    /**
     * Check if caching is enabled
     * @returns {boolean} Whether caching is enabled
     */
    isCacheEnabled() {
        return this.config.enableCache;
    }

    /**
     * Get request timeout
     * @returns {number} Timeout in milliseconds
     */
    getRequestTimeout() {
        return this.config.requestTimeout;
    }

    /**
     * Get max retries
     * @returns {number} Maximum number of retries
     */
    getMaxRetries() {
        return this.config.maxRetries;
    }

    /**
     * Get current environment
     * @returns {string} Environment name
     */
    getEnvironment() {
        return this.environment;
    }

    /**
     * Check if in development mode
     * @returns {boolean} Whether in development
     */
    isDevelopment() {
        return this.environment === 'development';
    }

    /**
     * Check if in production mode
     * @returns {boolean} Whether in production
     */
    isProduction() {
        return this.environment === 'production';
    }
}

// Create singleton instance
const environmentConfig = new EnvironmentConfig();

// Export for use in other modules
export default environmentConfig;

// Also make available globally for legacy code
window.EnvironmentConfig = environmentConfig;