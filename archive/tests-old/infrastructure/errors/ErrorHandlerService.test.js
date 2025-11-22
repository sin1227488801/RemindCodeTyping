import ErrorHandlerService from '../../../Rct/js/infrastructure/errors/ErrorHandlerService.js';
import NetworkError from '../../../Rct/js/infrastructure/errors/NetworkError.js';
import AuthenticationError from '../../../Rct/js/infrastructure/errors/AuthenticationError.js';
import BusinessError from '../../../Rct/js/infrastructure/errors/BusinessError.js';
import SystemError from '../../../Rct/js/infrastructure/errors/SystemError.js';

// Mock dependencies
const mockNotificationService = {
    showError: jest.fn()
};

const mockLogger = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
};

const mockRouter = {
    navigateToLogin: jest.fn()
};

describe('ErrorHandlerService', () => {
    let errorHandler;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock sessionStorage
        Object.defineProperty(window, 'sessionStorage', {
            value: {
                getItem: jest.fn(),
                setItem: jest.fn(),
                removeItem: jest.fn()
            },
            writable: true
        });

        errorHandler = new ErrorHandlerService({
            notificationService: mockNotificationService,
            logger: mockLogger,
            router: mockRouter
        });
    });

    describe('constructor', () => {
        test('should initialize with default configuration', () => {
            expect(errorHandler.config.showStackTrace).toBe(false);
            expect(errorHandler.config.logAllErrors).toBe(true);
            expect(errorHandler.config.retryAttempts).toBe(3);
            expect(errorHandler.config.suppressDuplicates).toBe(true);
        });

        test('should setup global error handlers', () => {
            const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
            
            new ErrorHandlerService({
                notificationService: mockNotificationService,
                logger: mockLogger
            });
            
            expect(addEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
            expect(addEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));
            
            addEventListenerSpy.mockRestore();
        });
    });

    describe('handleError', () => {
        test('should handle RctError instances', async () => {
            const error = new NetworkError('Network failed', 500, '/api/test');
            
            await errorHandler.handleError(error);
            
            expect(mockLogger.error).toHaveBeenCalledWith(
                'High severity error',
                expect.objectContaining({
                    name: 'NetworkError',
                    message: 'Network failed',
                    code: 'SERVER_ERROR_500'
                })
            );
            
            expect(mockNotificationService.showError).toHaveBeenCalledWith(
                'サーバーエラーが発生しました。しばらく待ってから再度お試しください。',
                'network',
                expect.any(Object)
            );
        });

        test('should normalize JavaScript errors', async () => {
            const jsError = new Error('JavaScript error');
            
            await errorHandler.handleError(jsError);
            
            expect(mockLogger.error).toHaveBeenCalled();
            expect(mockNotificationService.showError).toHaveBeenCalled();
        });

        test('should handle string errors', async () => {
            await errorHandler.handleError('String error');
            
            expect(mockLogger.error).toHaveBeenCalled();
            expect(mockNotificationService.showError).toHaveBeenCalled();
        });

        test('should add context information', async () => {
            const error = new NetworkError('Network failed', 500);
            const context = { userId: 'user123', component: 'TestComponent' };
            
            await errorHandler.handleError(error, context);
            
            expect(mockLogger.error).toHaveBeenCalledWith(
                'High severity error',
                expect.objectContaining({
                    context: expect.objectContaining({
                        userId: 'user123',
                        component: 'TestComponent'
                    })
                })
            );
        });
    });

    describe('normalizeError', () => {
        test('should return RctError instances as-is', () => {
            const error = new NetworkError('Test', 500);
            const normalized = errorHandler.normalizeError(error);
            
            expect(normalized).toBe(error);
        });

        test('should convert HTTP errors to NetworkError', () => {
            const httpError = new Error('HTTP error');
            httpError.status = 404;
            httpError.isHttpError = true;
            httpError.endpoint = '/api/test';
            
            const normalized = errorHandler.normalizeError(httpError);
            
            expect(normalized).toBeInstanceOf(NetworkError);
        });

        test('should convert generic errors to SystemError', () => {
            const jsError = new Error('Generic error');
            const normalized = errorHandler.normalizeError(jsError);
            
            expect(normalized).toBeInstanceOf(SystemError);
        });

        test('should handle string errors', () => {
            const normalized = errorHandler.normalizeError('String error');
            
            expect(normalized).toBeInstanceOf(SystemError);
            expect(normalized.message).toBe('String error');
        });
    });

    describe('isDuplicateError', () => {
        test('should detect duplicate errors within time window', () => {
            const error1 = new NetworkError('Same error', 500);
            const error2 = new NetworkError('Same error', 500);
            
            errorHandler.trackError(error1);
            
            expect(errorHandler.isDuplicateError(error2)).toBe(true);
        });

        test('should not detect duplicates when suppression is disabled', () => {
            errorHandler.config.suppressDuplicates = false;
            
            const error1 = new NetworkError('Same error', 500);
            const error2 = new NetworkError('Same error', 500);
            
            errorHandler.trackError(error1);
            
            expect(errorHandler.isDuplicateError(error2)).toBe(false);
        });

        test('should not detect duplicates outside time window', () => {
            const error1 = new NetworkError('Same error', 500);
            const error2 = new NetworkError('Same error', 500);
            
            errorHandler.trackError(error1);
            
            // Mock time passage
            const originalNow = Date.now;
            Date.now = jest.fn(() => originalNow() + 10000); // 10 seconds later
            
            expect(errorHandler.isDuplicateError(error2)).toBe(false);
            
            Date.now = originalNow;
        });
    });

    describe('handleSpecificError', () => {
        test('should handle authentication errors with login redirect', async () => {
            const error = AuthenticationError.tokenExpired();
            
            await errorHandler.handleSpecificError(error, {});
            
            // Should clear auth data
            expect(window.sessionStorage.removeItem).toHaveBeenCalledWith('token');
            expect(window.sessionStorage.removeItem).toHaveBeenCalledWith('userId');
            
            // Should schedule redirect
            setTimeout(() => {
                expect(mockRouter.navigateToLogin).toHaveBeenCalled();
            }, 2100);
        });

        test('should handle network errors with retry', async () => {
            const error = new NetworkError('Server error', 500);
            const retryCallback = jest.fn();
            const context = { retryCallback };
            
            await errorHandler.handleSpecificError(error, context);
            
            // Should schedule retry
            setTimeout(() => {
                expect(retryCallback).toHaveBeenCalled();
            }, 1100);
        });

        test('should handle business errors with refresh', async () => {
            const error = BusinessError.concurrentModification('User');
            const refreshCallback = jest.fn();
            const context = { refreshCallback };
            
            await errorHandler.handleSpecificError(error, context);
            
            // Should schedule refresh
            setTimeout(() => {
                expect(refreshCallback).toHaveBeenCalled();
            }, 1100);
        });
    });

    describe('showUserNotification', () => {
        test('should show notification with appropriate options', async () => {
            const error = new NetworkError('Network failed', 500);
            
            await errorHandler.showUserNotification(error, {});
            
            expect(mockNotificationService.showError).toHaveBeenCalledWith(
                'サーバーエラーが発生しました。しばらく待ってから再度お試しください。',
                'network',
                expect.objectContaining({
                    type: 'error',
                    category: 'network',
                    duration: 10000
                })
            );
        });

        test('should show retry option for retryable errors', async () => {
            const error = new NetworkError('Server error', 500);
            const context = { retryCallback: jest.fn() };
            
            await errorHandler.showUserNotification(error, context);
            
            expect(mockNotificationService.showError).toHaveBeenCalledWith(
                expect.any(String),
                'network',
                expect.objectContaining({
                    showRetry: true
                })
            );
        });

        test('should adjust notification type based on severity', async () => {
            const lowSeverityError = new NetworkError('Client error', 400);
            const criticalError = new SystemError('Critical error', 'CONFIGURATION_ERROR');
            
            await errorHandler.showUserNotification(lowSeverityError, {});
            expect(mockNotificationService.showError).toHaveBeenCalledWith(
                expect.any(String),
                'network',
                expect.objectContaining({ type: 'warning' })
            );
            
            await errorHandler.showUserNotification(criticalError, {});
            expect(mockNotificationService.showError).toHaveBeenCalledWith(
                expect.any(String),
                'system',
                expect.objectContaining({ type: 'critical' })
            );
        });
    });

    describe('handleWithRetry', () => {
        test('should retry operation on retryable errors', async () => {
            const operation = jest.fn()
                .mockRejectedValueOnce(new NetworkError('Server error', 500))
                .mockResolvedValueOnce('success');
            
            const result = await errorHandler.handleWithRetry(operation);
            
            expect(operation).toHaveBeenCalledTimes(2);
            expect(result).toBe('success');
        });

        test('should not retry non-retryable errors', async () => {
            const operation = jest.fn()
                .mockRejectedValue(new NetworkError('Client error', 400));
            
            await expect(errorHandler.handleWithRetry(operation)).rejects.toThrow();
            expect(operation).toHaveBeenCalledTimes(1);
        });

        test('should respect max attempts', async () => {
            const operation = jest.fn()
                .mockRejectedValue(new NetworkError('Server error', 500));
            
            await expect(errorHandler.handleWithRetry(operation, { maxAttempts: 2 }))
                .rejects.toThrow();
            expect(operation).toHaveBeenCalledTimes(2);
        });
    });

    describe('configuration', () => {
        test('should update configuration', () => {
            const newConfig = { showStackTrace: true, retryAttempts: 5 };
            
            errorHandler.updateConfig(newConfig);
            
            expect(errorHandler.config.showStackTrace).toBe(true);
            expect(errorHandler.config.retryAttempts).toBe(5);
            expect(errorHandler.config.logAllErrors).toBe(true); // Should preserve existing
        });

        test('should clear recent errors', () => {
            const error = new NetworkError('Test', 500);
            errorHandler.trackError(error);
            
            expect(errorHandler.recentErrors.size).toBe(1);
            
            errorHandler.clearRecentErrors();
            
            expect(errorHandler.recentErrors.size).toBe(0);
        });
    });
});