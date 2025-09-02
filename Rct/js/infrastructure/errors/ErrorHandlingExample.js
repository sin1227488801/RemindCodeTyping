/**
 * Example integration of the error handling system
 * Demonstrates how to set up and use the comprehensive error handling
 */

import { ErrorHandlerService, NetworkError, AuthenticationError, BusinessError } from './index.js';
import NotificationService from '../notifications/NotificationService.js';
import Logger from '../logging/Logger.js';

/**
 * Example setup of the error handling system
 */
class ErrorHandlingSetup {
    constructor() {
        this.setupServices();
        this.setupErrorHandler();
        this.demonstrateUsage();
    }

    /**
     * Setup the required services
     */
    setupServices() {
        // Initialize logger
        this.logger = new Logger({
            level: 'info',
            enableConsole: true,
            enableRemote: false, // Set to true in production
            remoteEndpoint: 'https://api.example.com/logs'
        });

        // Initialize notification service
        this.notificationService = new NotificationService({
            position: 'top-right',
            maxNotifications: 5,
            defaultDuration: 5000
        });

        // Mock router for demonstration
        this.router = {
            navigateToLogin: () => {
                console.log('Redirecting to login page...');
                // In real app: window.location.href = '/login.html';
            }
        };
    }

    /**
     * Setup the error handler service
     */
    setupErrorHandler() {
        this.errorHandler = new ErrorHandlerService({
            notificationService: this.notificationService,
            logger: this.logger,
            router: this.router
        });

        // Configure error handling
        this.errorHandler.updateConfig({
            showStackTrace: false, // Set to true in development
            suppressDuplicates: true,
            retryAttempts: 3
        });
    }

    /**
     * Demonstrate different error scenarios
     */
    demonstrateUsage() {
        console.log('Error Handling System Demo');
        console.log('==========================');

        // Example 1: Network Error
        this.demonstrateNetworkError();

        // Example 2: Authentication Error
        this.demonstrateAuthError();

        // Example 3: Business Error
        this.demonstrateBusinessError();

        // Example 4: Error with Retry
        this.demonstrateRetryableError();

        // Example 5: Global Error Handling
        this.demonstrateGlobalErrorHandling();
    }

    /**
     * Demonstrate network error handling
     */
    async demonstrateNetworkError() {
        console.log('\n1. Network Error Example:');
        
        try {
            // Simulate API call that fails
            throw new NetworkError('Server temporarily unavailable', 503, '/api/users');
        } catch (error) {
            await this.errorHandler.handleError(error, {
                component: 'UserService',
                operation: 'fetchUsers'
            });
        }
    }

    /**
     * Demonstrate authentication error handling
     */
    async demonstrateAuthError() {
        console.log('\n2. Authentication Error Example:');
        
        try {
            // Simulate expired token
            throw AuthenticationError.tokenExpired();
        } catch (error) {
            await this.errorHandler.handleError(error, {
                component: 'AuthService',
                userId: 'user123'
            });
        }
    }

    /**
     * Demonstrate business error handling
     */
    async demonstrateBusinessError() {
        console.log('\n3. Business Error Example:');
        
        try {
            // Simulate business rule violation
            throw BusinessError.studyBookLimitExceeded(100);
        } catch (error) {
            await this.errorHandler.handleError(error, {
                component: 'StudyBookService',
                userId: 'user123'
            });
        }
    }

    /**
     * Demonstrate retryable error with callback
     */
    async demonstrateRetryableError() {
        console.log('\n4. Retryable Error Example:');
        
        let attempts = 0;
        const retryCallback = async () => {
            attempts++;
            console.log(`Retry attempt ${attempts}`);
            
            if (attempts < 3) {
                throw new NetworkError('Still failing', 500, '/api/retry-test');
            }
            
            console.log('Operation succeeded after retry!');
            return 'success';
        };

        try {
            const result = await this.errorHandler.handleWithRetry(retryCallback, {
                maxAttempts: 3,
                delay: 1000
            });
            console.log('Final result:', result);
        } catch (error) {
            console.log('Operation failed after all retries');
            await this.errorHandler.handleError(error, {
                component: 'RetryService'
            });
        }
    }

    /**
     * Demonstrate global error handling
     */
    demonstrateGlobalErrorHandling() {
        console.log('\n5. Global Error Handling Example:');
        
        // Simulate unhandled promise rejection
        setTimeout(() => {
            Promise.reject(new Error('Unhandled promise rejection'));
        }, 100);

        // Simulate uncaught error
        setTimeout(() => {
            throw new Error('Uncaught JavaScript error');
        }, 200);
    }

    /**
     * Example of integrating with existing API calls
     */
    async exampleApiIntegration() {
        console.log('\n6. API Integration Example:');
        
        try {
            // Example API call with error handling
            const response = await fetch('/api/study-books');
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw NetworkError.fromHttpResponse(response, '/api/study-books', errorData);
            }
            
            const data = await response.json();
            console.log('API call successful:', data);
            
        } catch (error) {
            // Handle both network errors and parsing errors
            await this.errorHandler.handleError(error, {
                component: 'StudyBookApi',
                operation: 'fetchStudyBooks',
                retryCallback: () => this.exampleApiIntegration()
            });
        }
    }

    /**
     * Example of form validation with error handling
     */
    async exampleFormValidation(formData) {
        console.log('\n7. Form Validation Example:');
        
        try {
            // Simulate form validation
            if (!formData.loginId) {
                throw BusinessError.businessRuleViolation('Login ID is required');
            }
            
            if (!formData.password || formData.password.length < 8) {
                throw AuthenticationError.weakPassword(['minimum 8 characters']);
            }
            
            console.log('Form validation passed');
            
        } catch (error) {
            await this.errorHandler.handleError(error, {
                component: 'LoginForm',
                formData: { loginId: formData.loginId } // Don't log password
            });
        }
    }

    /**
     * Example of error recovery strategies
     */
    async exampleErrorRecovery() {
        console.log('\n8. Error Recovery Example:');
        
        try {
            // Simulate operation that might fail
            throw new NetworkError('Connection timeout', 408, '/api/save');
            
        } catch (error) {
            await this.errorHandler.handleError(error, {
                component: 'DataService',
                retryCallback: async () => {
                    console.log('Attempting to recover...');
                    // In real app: retry with exponential backoff
                    return 'recovered';
                },
                refreshCallback: () => {
                    console.log('Refreshing data...');
                    // In real app: reload data from server
                }
            });
        }
    }
}

// Example usage
if (typeof window !== 'undefined') {
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            new ErrorHandlingSetup();
        });
    } else {
        new ErrorHandlingSetup();
    }
}

export default ErrorHandlingSetup;