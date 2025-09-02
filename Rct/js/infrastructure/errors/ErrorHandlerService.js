import RctError from './RctError.js';
import NetworkError from './NetworkError.js';
import AuthenticationError from './AuthenticationError.js';
import BusinessError from './BusinessError.js';
import SystemError from './SystemError.js';

/**
 * Central error handling service
 * Coordinates error processing, logging, and user notification
 */
class ErrorHandlerService {
    /**
     * Creates a new ErrorHandlerService instance
     * @param {Object} dependencies - Service dependencies
     * @param {Object} dependencies.notificationService - Notification service
     * @param {Object} dependencies.logger - Logger service
     * @param {Object} dependencies.router - Router for navigation
     */
    constructor({ notificationService, logger, router = null }) {
        this.notificationService = notificationService;
        this.logger = logger;
        this.router = router;
        
        // Error handling configuration
        this.config = {
            showStackTrace: false, // Set to true in development
            logAllErrors: true,
            retryAttempts: 3,
            retryDelay: 1000,
            suppressDuplicates: true,
            duplicateTimeWindow: 5000 // 5 seconds
        };
        
        // Track recent errors to suppress duplicates
        this.recentErrors = new Map();
        
        // Global error handlers
        this.setupGlobalErrorHandlers();
    }

    /**
     * Setup global error handlers for unhandled errors
     */
    setupGlobalErrorHandlers() {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleError(event.reason, { context: 'unhandledrejection' });
            event.preventDefault(); // Prevent default browser behavior
        });

        // Handle uncaught JavaScript errors
        window.addEventListener('error', (event) => {
            console.error('Uncaught error:', event.error);
            const systemError = SystemError.fromJavaScriptError(
                event.error || new Error(event.message),
                `${event.filename}:${event.lineno}:${event.colno}`
            );
            this.handleError(systemError, { context: 'uncaught' });
        });
    }

    /**
     * Main error handling method
     * @param {Error|RctError} error - Error to handle
     * @param {Object} context - Additional context information
     * @returns {Promise<void>}
     */
    async handleError(error, context = {}) {
        try {
            // Normalize error to RctError
            const normalizedError = this.normalizeError(error);
            
            // Add context information
            if (context.userId) {
                normalizedError.details = { ...normalizedError.details, userId: context.userId };
            }
            if (context.component) {
                normalizedError.details = { ...normalizedError.details, component: context.component };
            }
            
            // Check for duplicate errors
            if (this.isDuplicateError(normalizedError)) {
                return;
            }
            
            // Log the error
            await this.logError(normalizedError, context);
            
            // Handle specific error types
            await this.handleSpecificError(normalizedError, context);
            
            // Show user notification
            await this.showUserNotification(normalizedError, context);
            
            // Track error for duplicate detection
            this.trackError(normalizedError);
            
        } catch (handlingError) {
            console.error('Error in error handler:', handlingError);
            // Fallback notification
            this.notificationService?.showError(
                '予期しないエラーが発生しました。',
                'system'
            );
        }
    }

    /**
     * Normalize any error to RctError
     * @param {Error|RctError} error - Error to normalize
     * @returns {RctError} Normalized error
     */
    normalizeError(error) {
        if (error instanceof RctError) {
            return error;
        }
        
        if (error instanceof Error) {
            // Try to determine error type based on properties
            if (error.status || error.isHttpError) {
                return NetworkError.fromFetchError(error, error.endpoint);
            }
            
            // Default to system error
            return SystemError.fromJavaScriptError(error);
        }
        
        // Handle string errors or other types
        if (typeof error === 'string') {
            return new SystemError(error, 'UNEXPECTED_ERROR');
        }
        
        return new SystemError('Unknown error occurred', 'UNEXPECTED_ERROR', { originalError: error });
    }

    /**
     * Check if error is a duplicate of recent errors
     * @param {RctError} error - Error to check
     * @returns {boolean} Whether error is duplicate
     */
    isDuplicateError(error) {
        if (!this.config.suppressDuplicates) {
            return false;
        }
        
        const errorKey = `${error.code}_${error.message}`;
        const now = Date.now();
        const lastOccurrence = this.recentErrors.get(errorKey);
        
        if (lastOccurrence && (now - lastOccurrence) < this.config.duplicateTimeWindow) {
            return true;
        }
        
        return false;
    }

    /**
     * Track error for duplicate detection
     * @param {RctError} error - Error to track
     */
    trackError(error) {
        if (!this.config.suppressDuplicates) {
            return;
        }
        
        const errorKey = `${error.code}_${error.message}`;
        this.recentErrors.set(errorKey, Date.now());
        
        // Clean up old entries
        const cutoff = Date.now() - this.config.duplicateTimeWindow;
        for (const [key, timestamp] of this.recentErrors.entries()) {
            if (timestamp < cutoff) {
                this.recentErrors.delete(key);
            }
        }
    }

    /**
     * Log error with appropriate level
     * @param {RctError} error - Error to log
     * @param {Object} context - Context information
     */
    async logError(error, context) {
        if (!this.config.logAllErrors) {
            return;
        }
        
        const logData = {
            ...error.getTechnicalDetails(),
            context,
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString()
        };
        
        const severity = error.getSeverity();
        
        switch (severity) {
            case 'critical':
                this.logger.error('Critical error occurred', logData);
                break;
            case 'high':
                this.logger.error('High severity error', logData);
                break;
            case 'medium':
                this.logger.warn('Medium severity error', logData);
                break;
            case 'low':
                this.logger.info('Low severity error', logData);
                break;
            default:
                this.logger.error('Error occurred', logData);
        }
    }

    /**
     * Handle specific error types with custom logic
     * @param {RctError} error - Error to handle
     * @param {Object} context - Context information
     */
    async handleSpecificError(error, context) {
        if (error instanceof AuthenticationError) {
            await this.handleAuthenticationError(error, context);
        } else if (error instanceof NetworkError) {
            await this.handleNetworkError(error, context);
        } else if (error instanceof BusinessError) {
            await this.handleBusinessError(error, context);
        } else if (error instanceof SystemError) {
            await this.handleSystemError(error, context);
        }
    }

    /**
     * Handle authentication errors
     * @param {AuthenticationError} error - Authentication error
     * @param {Object} context - Context information
     */
    async handleAuthenticationError(error, context) {
        if (error.requiresLoginRedirect() && this.router) {
            // Clear any stored authentication data
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('userId');
            localStorage.removeItem('token');
            
            // Redirect to login page after a short delay
            setTimeout(() => {
                this.router.navigateToLogin();
            }, 2000);
        }
    }

    /**
     * Handle network errors
     * @param {NetworkError} error - Network error
     * @param {Object} context - Context information
     */
    async handleNetworkError(error, context) {
        // Check if error is retryable and context allows retry
        if (error.isRetryable() && context.retryCallback && !context.hasRetried) {
            setTimeout(async () => {
                try {
                    await context.retryCallback();
                } catch (retryError) {
                    this.handleError(retryError, { ...context, hasRetried: true });
                }
            }, this.config.retryDelay);
        }
    }

    /**
     * Handle business errors
     * @param {BusinessError} error - Business error
     * @param {Object} context - Context information
     */
    async handleBusinessError(error, context) {
        // Business errors usually require user action
        // Additional handling can be added here based on error type
        if (error.type === 'CONCURRENT_MODIFICATION' && context.refreshCallback) {
            // Suggest refreshing data
            setTimeout(() => {
                if (context.refreshCallback) {
                    context.refreshCallback();
                }
            }, 1000);
        }
    }

    /**
     * Handle system errors
     * @param {SystemError} error - System error
     * @param {Object} context - Context information
     */
    async handleSystemError(error, context) {
        // System errors might require page refresh or component reinitialization
        if (error.getSeverity() === 'critical') {
            // For critical errors, suggest page refresh
            setTimeout(() => {
                if (confirm('重大なエラーが発生しました。ページを再読み込みしますか？')) {
                    window.location.reload();
                }
            }, 3000);
        }
    }

    /**
     * Show user notification for error
     * @param {RctError} error - Error to show
     * @param {Object} context - Context information
     */
    async showUserNotification(error, context) {
        if (!this.notificationService) {
            return;
        }
        
        const message = error.getUserMessage();
        const category = error.getCategory();
        const severity = error.getSeverity();
        
        // Determine notification type based on severity
        let notificationType = 'error';
        if (severity === 'low') {
            notificationType = 'warning';
        } else if (severity === 'critical') {
            notificationType = 'critical';
        }
        
        // Show notification with appropriate options
        const options = {
            type: notificationType,
            category,
            duration: this.getNotificationDuration(severity),
            showRetry: error.isRetryable() && context.retryCallback,
            correlationId: error.correlationId
        };
        
        if (this.config.showStackTrace && error.stack) {
            options.details = error.stack;
        }
        
        this.notificationService.showError(message, category, options);
    }

    /**
     * Get notification duration based on severity
     * @param {string} severity - Error severity
     * @returns {number} Duration in milliseconds
     */
    getNotificationDuration(severity) {
        switch (severity) {
            case 'critical':
                return 0; // Don't auto-hide critical errors
            case 'high':
                return 10000; // 10 seconds
            case 'medium':
                return 7000; // 7 seconds
            case 'low':
                return 5000; // 5 seconds
            default:
                return 7000;
        }
    }

    /**
     * Handle error with retry logic
     * @param {Function} operation - Operation to retry
     * @param {Object} options - Retry options
     * @returns {Promise<*>} Operation result
     */
    async handleWithRetry(operation, options = {}) {
        const maxAttempts = options.maxAttempts || this.config.retryAttempts;
        const delay = options.delay || this.config.retryDelay;
        
        let lastError;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = this.normalizeError(error);
                
                if (attempt === maxAttempts || !lastError.isRetryable()) {
                    break;
                }
                
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, delay * attempt));
            }
        }
        
        throw lastError;
    }

    /**
     * Update configuration
     * @param {Object} newConfig - New configuration options
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * Clear recent errors cache
     */
    clearRecentErrors() {
        this.recentErrors.clear();
    }
}

export default ErrorHandlerService;