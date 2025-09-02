import ErrorHandlerService from '../../../Rct/js/infrastructure/errors/ErrorHandlerService.js';
import NotificationService from '../../../Rct/js/infrastructure/notifications/NotificationService.js';
import Logger from '../../../Rct/js/infrastructure/logging/Logger.js';
import { NetworkError, AuthenticationError, BusinessError } from '../../../Rct/js/infrastructure/errors/index.js';

describe('Error Handling Integration', () => {
    let errorHandler;
    let notificationService;
    let logger;
    let mockRouter;

    beforeEach(() => {
        // Setup mock DOM
        document.body.innerHTML = '';
        
        // Create services
        logger = new Logger({ enableConsole: false, enableRemote: false });
        notificationService = new NotificationService();
        mockRouter = { navigateToLogin: jest.fn() };
        
        errorHandler = new ErrorHandlerService({
            notificationService,
            logger,
            router: mockRouter
        });
    });

    describe('end-to-end error handling flow', () => {
        test('should handle network error with complete flow', async () => {
            const logSpy = jest.spyOn(logger, 'error');
            const notificationSpy = jest.spyOn(notificationService, 'showError');
            
            const error = new NetworkError('Server error', 500, '/api/test');
            
            await errorHandler.handleError(error, {
                component: 'TestComponent',
                userId: 'user123'
            });
            
            // Verify logging
            expect(logSpy).toHaveBeenCalledWith(
                'High severity error',
                expect.objectContaining({
                    name: 'NetworkError',
                    code: 'SERVER_ERROR_500',
                    context: expect.objectContaining({
                        component: 'TestComponent',
                        userId: 'user123'
                    })
                })
            );
            
            // Verify notification
            expect(notificationSpy).toHaveBeenCalledWith(
                'サーバーエラーが発生しました。しばらく待ってから再度お試しください。',
                'network',
                expect.objectContaining({
                    type: 'error',
                    category: 'network'
                })
            );
        });

        test('should handle authentication error with redirect', async () => {
            const error = AuthenticationError.tokenExpired();
            
            await errorHandler.handleError(error);
            
            // Should clear auth data
            expect(sessionStorage.removeItem).toHaveBeenCalledWith('token');
            expect(sessionStorage.removeItem).toHaveBeenCalledWith('userId');
            
            // Should schedule redirect
            setTimeout(() => {
                expect(mockRouter.navigateToLogin).toHaveBeenCalled();
            }, 2100);
        });

        test('should handle business error appropriately', async () => {
            const logSpy = jest.spyOn(logger, 'warn');
            const notificationSpy = jest.spyOn(notificationService, 'showError');
            
            const error = BusinessError.studyBookLimitExceeded(100);
            
            await errorHandler.handleError(error);
            
            // Business errors should be logged as warnings (medium severity)
            expect(logSpy).toHaveBeenCalled();
            
            // Should show user-friendly message
            expect(notificationSpy).toHaveBeenCalledWith(
                '学習帳の作成上限に達しました。',
                'business',
                expect.any(Object)
            );
        });
    });

    describe('retry mechanism integration', () => {
        test('should retry retryable operations', async () => {
            let attempts = 0;
            const operation = jest.fn().mockImplementation(() => {
                attempts++;
                if (attempts < 3) {
                    throw new NetworkError('Server error', 500);
                }
                return 'success';
            });
            
            const result = await errorHandler.handleWithRetry(operation, {
                maxAttempts: 3,
                delay: 10 // Short delay for testing
            });
            
            expect(operation).toHaveBeenCalledTimes(3);
            expect(result).toBe('success');
        });

        test('should not retry non-retryable errors', async () => {
            const operation = jest.fn().mockRejectedValue(
                new NetworkError('Bad request', 400)
            );
            
            await expect(errorHandler.handleWithRetry(operation)).rejects.toThrow();
            expect(operation).toHaveBeenCalledTimes(1);
        });
    });

    describe('duplicate error suppression', () => {
        test('should suppress duplicate errors within time window', async () => {
            const notificationSpy = jest.spyOn(notificationService, 'showError');
            
            const error1 = new NetworkError('Same error', 500);
            const error2 = new NetworkError('Same error', 500);
            
            await errorHandler.handleError(error1);
            await errorHandler.handleError(error2);
            
            // Should only show notification once
            expect(notificationSpy).toHaveBeenCalledTimes(1);
        });

        test('should not suppress different errors', async () => {
            const notificationSpy = jest.spyOn(notificationService, 'showError');
            
            const error1 = new NetworkError('Error 1', 500);
            const error2 = new NetworkError('Error 2', 404);
            
            await errorHandler.handleError(error1);
            await errorHandler.handleError(error2);
            
            // Should show both notifications
            expect(notificationSpy).toHaveBeenCalledTimes(2);
        });
    });

    describe('error normalization', () => {
        test('should normalize JavaScript errors to SystemError', async () => {
            const logSpy = jest.spyOn(logger, 'error');
            const jsError = new TypeError('Cannot read property of undefined');
            
            await errorHandler.handleError(jsError);
            
            expect(logSpy).toHaveBeenCalledWith(
                'High severity error',
                expect.objectContaining({
                    name: 'SystemError',
                    code: 'SYSTEM_DEPENDENCY_ERROR'
                })
            );
        });

        test('should normalize HTTP errors to NetworkError', async () => {
            const logSpy = jest.spyOn(logger, 'error');
            const httpError = new Error('HTTP error');
            httpError.status = 404;
            httpError.isHttpError = true;
            
            await errorHandler.handleError(httpError);
            
            expect(logSpy).toHaveBeenCalledWith(
                'High severity error',
                expect.objectContaining({
                    name: 'NetworkError',
                    code: 'NETWORK_ERROR'
                })
            );
        });
    });

    describe('notification integration', () => {
        test('should show appropriate notification types based on severity', async () => {
            const notificationSpy = jest.spyOn(notificationService, 'show');
            
            // Low severity error
            const lowError = new NetworkError('Client error', 400);
            await errorHandler.handleError(lowError);
            
            expect(notificationSpy).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'warning' })
            );
            
            // High severity error
            const highError = new NetworkError('Server error', 500);
            await errorHandler.handleError(highError);
            
            expect(notificationSpy).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'error' })
            );
        });

        test('should include retry option for retryable errors', async () => {
            const notificationSpy = jest.spyOn(notificationService, 'showError');
            const retryCallback = jest.fn();
            
            const error = new NetworkError('Server error', 500);
            
            await errorHandler.handleError(error, { retryCallback });
            
            expect(notificationSpy).toHaveBeenCalledWith(
                expect.any(String),
                'network',
                expect.objectContaining({ showRetry: true })
            );
        });
    });

    describe('logging integration', () => {
        test('should log with appropriate levels based on severity', async () => {
            const errorSpy = jest.spyOn(logger, 'error');
            const warnSpy = jest.spyOn(logger, 'warn');
            const infoSpy = jest.spyOn(logger, 'info');
            
            // Critical error
            const criticalError = new Error('Critical system error');
            criticalError.getSeverity = () => 'critical';
            await errorHandler.handleError(criticalError);
            expect(errorSpy).toHaveBeenCalled();
            
            // Medium severity error
            const mediumError = new BusinessError('Business error', 'GENERAL');
            await errorHandler.handleError(mediumError);
            expect(warnSpy).toHaveBeenCalled();
            
            // Low severity error
            const lowError = new NetworkError('Client error', 400);
            await errorHandler.handleError(lowError);
            expect(infoSpy).toHaveBeenCalled();
        });

        test('should include context in log entries', async () => {
            const logSpy = jest.spyOn(logger, 'error');
            
            const error = new NetworkError('Test error', 500);
            const context = {
                component: 'TestComponent',
                userId: 'user123',
                operation: 'testOperation'
            };
            
            await errorHandler.handleError(error, context);
            
            expect(logSpy).toHaveBeenCalledWith(
                'High severity error',
                expect.objectContaining({
                    context: expect.objectContaining(context)
                })
            );
        });
    });

    describe('global error handling', () => {
        test('should handle unhandled promise rejections', () => {
            const handleErrorSpy = jest.spyOn(errorHandler, 'handleError');
            
            // Simulate unhandled promise rejection
            const rejectionEvent = new Event('unhandledrejection');
            rejectionEvent.reason = new Error('Unhandled rejection');
            
            window.dispatchEvent(rejectionEvent);
            
            expect(handleErrorSpy).toHaveBeenCalledWith(
                rejectionEvent.reason,
                expect.objectContaining({ context: 'unhandledrejection' })
            );
        });

        test('should handle uncaught JavaScript errors', () => {
            const handleErrorSpy = jest.spyOn(errorHandler, 'handleError');
            
            // Simulate uncaught error
            const errorEvent = new ErrorEvent('error', {
                error: new Error('Uncaught error'),
                filename: 'test.js',
                lineno: 10,
                colno: 5
            });
            
            window.dispatchEvent(errorEvent);
            
            expect(handleErrorSpy).toHaveBeenCalledWith(
                expect.any(Error),
                expect.objectContaining({ context: 'uncaught' })
            );
        });
    });

    describe('configuration and customization', () => {
        test('should respect configuration changes', async () => {
            errorHandler.updateConfig({
                suppressDuplicates: false,
                showStackTrace: true
            });
            
            const notificationSpy = jest.spyOn(notificationService, 'showError');
            
            const error1 = new NetworkError('Same error', 500);
            const error2 = new NetworkError('Same error', 500);
            
            await errorHandler.handleError(error1);
            await errorHandler.handleError(error2);
            
            // Should not suppress duplicates when disabled
            expect(notificationSpy).toHaveBeenCalledTimes(2);
        });

        test('should clear recent errors cache', () => {
            const error = new NetworkError('Test error', 500);
            errorHandler.trackError(error);
            
            expect(errorHandler.recentErrors.size).toBe(1);
            
            errorHandler.clearRecentErrors();
            
            expect(errorHandler.recentErrors.size).toBe(0);
        });
    });
});