import NotificationService from '../../../Rct/js/infrastructure/notifications/NotificationService.js';

// Mock DOM methods
Object.defineProperty(document, 'getElementById', {
    value: jest.fn(),
    writable: true
});

Object.defineProperty(document, 'createElement', {
    value: jest.fn(() => ({
        id: '',
        className: '',
        textContent: '',
        innerHTML: '',
        style: {},
        appendChild: jest.fn(),
        setAttribute: jest.fn(),
        querySelector: jest.fn(),
        classList: {
            add: jest.fn(),
            remove: jest.fn()
        },
        parentNode: {
            removeChild: jest.fn()
        }
    })),
    writable: true
});

Object.defineProperty(document, 'head', {
    value: {
        appendChild: jest.fn()
    },
    writable: true
});

Object.defineProperty(document, 'body', {
    value: {
        appendChild: jest.fn()
    },
    writable: true
});

describe('NotificationService', () => {
    let notificationService;
    let mockContainer;

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockContainer = {
            id: 'notification-container',
            className: 'notification-container notification-top-right',
            appendChild: jest.fn()
        };
        
        document.getElementById.mockReturnValue(null);
        document.createElement.mockReturnValue(mockContainer);
        
        notificationService = new NotificationService();
    });

    describe('constructor', () => {
        test('should initialize with default configuration', () => {
            expect(notificationService.config.containerId).toBe('notification-container');
            expect(notificationService.config.maxNotifications).toBe(5);
            expect(notificationService.config.defaultDuration).toBe(5000);
            expect(notificationService.config.position).toBe('top-right');
        });

        test('should create container if it does not exist', () => {
            expect(document.createElement).toHaveBeenCalledWith('div');
            expect(document.body.appendChild).toHaveBeenCalledWith(mockContainer);
        });

        test('should use existing container if it exists', () => {
            const existingContainer = { id: 'notification-container' };
            document.getElementById.mockReturnValue(existingContainer);
            
            const service = new NotificationService();
            
            expect(service.container).toBe(existingContainer);
        });

        test('should accept custom configuration', () => {
            const customConfig = {
                containerId: 'custom-container',
                maxNotifications: 10,
                position: 'bottom-left'
            };
            
            const service = new NotificationService(customConfig);
            
            expect(service.config.containerId).toBe('custom-container');
            expect(service.config.maxNotifications).toBe(10);
            expect(service.config.position).toBe('bottom-left');
        });
    });

    describe('show methods', () => {
        let mockElement;

        beforeEach(() => {
            mockElement = {
                className: '',
                setAttribute: jest.fn(),
                appendChild: jest.fn(),
                querySelector: jest.fn(() => ({ style: {} })),
                classList: { add: jest.fn() }
            };
            
            document.createElement.mockReturnValue(mockElement);
        });

        test('should show error notification', () => {
            const id = notificationService.showError('Test error message', 'network');
            
            expect(typeof id).toBe('number');
            expect(mockContainer.appendChild).toHaveBeenCalledWith(mockElement);
            expect(mockElement.className).toContain('notification-error');
        });

        test('should show warning notification', () => {
            notificationService.showWarning('Test warning');
            
            expect(mockContainer.appendChild).toHaveBeenCalledWith(mockElement);
            expect(mockElement.className).toContain('notification-warning');
        });

        test('should show success notification', () => {
            notificationService.showSuccess('Test success');
            
            expect(mockContainer.appendChild).toHaveBeenCalledWith(mockElement);
            expect(mockElement.className).toContain('notification-success');
        });

        test('should show info notification', () => {
            notificationService.showInfo('Test info');
            
            expect(mockContainer.appendChild).toHaveBeenCalledWith(mockElement);
            expect(mockElement.className).toContain('notification-info');
        });

        test('should show critical notification', () => {
            notificationService.showCritical('Test critical');
            
            expect(mockContainer.appendChild).toHaveBeenCalledWith(mockElement);
            expect(mockElement.className).toContain('notification-critical');
        });
    });

    describe('createNotification', () => {
        let mockElements;

        beforeEach(() => {
            mockElements = {
                notification: {
                    className: '',
                    setAttribute: jest.fn(),
                    appendChild: jest.fn(),
                    querySelector: jest.fn(() => ({ style: {} })),
                    classList: { add: jest.fn() }
                },
                header: { className: '', appendChild: jest.fn() },
                title: { className: '', textContent: '' },
                closeButton: { className: '', innerHTML: '', setAttribute: jest.fn() },
                message: { className: '', textContent: '' },
                progress: { className: '', style: {} }
            };
            
            document.createElement.mockImplementation((tag) => {
                switch (tag) {
                    case 'div':
                        return tag === 'div' ? mockElements.notification : mockElements.header;
                    case 'h4':
                        return mockElements.title;
                    case 'button':
                        return mockElements.closeButton;
                    case 'p':
                        return mockElements.message;
                    default:
                        return mockElements.notification;
                }
            });
        });

        test('should create notification with basic structure', () => {
            const options = {
                type: 'error',
                title: 'Error Title',
                message: 'Error message'
            };
            
            const notification = notificationService.createNotification(options);
            
            expect(notification.id).toBeDefined();
            expect(notification.element).toBe(mockElements.notification);
            expect(notification.options).toBe(options);
            expect(mockElements.title.textContent).toBe('Error Title');
            expect(mockElements.message.textContent).toBe('Error message');
        });

        test('should add details section when provided', () => {
            const options = {
                type: 'error',
                title: 'Error',
                message: 'Message',
                details: 'Stack trace details'
            };
            
            notificationService.createNotification(options);
            
            // Should create additional div for details
            expect(document.createElement).toHaveBeenCalledWith('div');
        });

        test('should add retry button when showRetry is true', () => {
            const options = {
                type: 'error',
                title: 'Error',
                message: 'Message',
                showRetry: true,
                onRetry: jest.fn()
            };
            
            notificationService.createNotification(options);
            
            // Should create actions div and button
            expect(document.createElement).toHaveBeenCalledWith('button');
        });

        test('should add custom actions when provided', () => {
            const actions = [
                { label: 'Action 1', type: 'primary', handler: jest.fn() },
                { label: 'Action 2', type: 'secondary', handler: jest.fn() }
            ];
            
            const options = {
                type: 'info',
                title: 'Info',
                message: 'Message',
                actions
            };
            
            notificationService.createNotification(options);
            
            // Should create buttons for each action
            expect(document.createElement).toHaveBeenCalledWith('button');
        });

        test('should setup auto-hide timer for timed notifications', () => {
            jest.useFakeTimers();
            
            const options = {
                type: 'info',
                title: 'Info',
                message: 'Message',
                duration: 3000
            };
            
            const notification = notificationService.createNotification(options);
            
            expect(notification.timer).toBeDefined();
            
            jest.useRealTimers();
        });

        test('should not setup timer for permanent notifications', () => {
            const options = {
                type: 'critical',
                title: 'Critical',
                message: 'Message',
                duration: 0
            };
            
            const notification = notificationService.createNotification(options);
            
            expect(notification.timer).toBeNull();
        });
    });

    describe('hide', () => {
        test('should hide notification by id', () => {
            jest.useFakeTimers();
            
            const mockElement = {
                classList: { add: jest.fn() },
                parentNode: { removeChild: jest.fn() }
            };
            
            const notification = {
                id: 1,
                element: mockElement,
                timer: setTimeout(() => {}, 1000)
            };
            
            notificationService.notifications.set(1, notification);
            
            notificationService.hide(1);
            
            expect(mockElement.classList.add).toHaveBeenCalledWith('hide');
            expect(clearTimeout).toHaveBeenCalled();
            
            jest.useRealTimers();
        });

        test('should handle hiding non-existent notification', () => {
            expect(() => notificationService.hide(999)).not.toThrow();
        });
    });

    describe('hideAll', () => {
        test('should hide all notifications', () => {
            const hideSpy = jest.spyOn(notificationService, 'hide');
            
            notificationService.notifications.set(1, { id: 1 });
            notificationService.notifications.set(2, { id: 2 });
            
            notificationService.hideAll();
            
            expect(hideSpy).toHaveBeenCalledWith(1);
            expect(hideSpy).toHaveBeenCalledWith(2);
            
            hideSpy.mockRestore();
        });
    });

    describe('enforceMaxNotifications', () => {
        test('should remove oldest notifications when limit exceeded', () => {
            const hideSpy = jest.spyOn(notificationService, 'hide');
            notificationService.config.maxNotifications = 2;
            
            // Add notifications with different timestamps
            notificationService.notifications.set(1, { id: 1, createdAt: 1000 });
            notificationService.notifications.set(2, { id: 2, createdAt: 2000 });
            notificationService.notifications.set(3, { id: 3, createdAt: 3000 });
            
            notificationService.enforceMaxNotifications();
            
            expect(hideSpy).toHaveBeenCalledWith(1); // Oldest should be removed
            expect(hideSpy).not.toHaveBeenCalledWith(2);
            expect(hideSpy).not.toHaveBeenCalledWith(3);
            
            hideSpy.mockRestore();
        });

        test('should not remove notifications when under limit', () => {
            const hideSpy = jest.spyOn(notificationService, 'hide');
            notificationService.config.maxNotifications = 5;
            
            notificationService.notifications.set(1, { id: 1, createdAt: 1000 });
            notificationService.notifications.set(2, { id: 2, createdAt: 2000 });
            
            notificationService.enforceMaxNotifications();
            
            expect(hideSpy).not.toHaveBeenCalled();
            
            hideSpy.mockRestore();
        });
    });

    describe('getErrorTitle', () => {
        test('should return appropriate titles for different categories', () => {
            expect(notificationService.getErrorTitle('network')).toBe('ネットワークエラー');
            expect(notificationService.getErrorTitle('authentication')).toBe('認証エラー');
            expect(notificationService.getErrorTitle('business')).toBe('エラー');
            expect(notificationService.getErrorTitle('system')).toBe('システムエラー');
            expect(notificationService.getErrorTitle('validation')).toBe('入力エラー');
            expect(notificationService.getErrorTitle('unknown')).toBe('エラー');
        });
    });

    describe('utility methods', () => {
        test('should update configuration', () => {
            const newConfig = { maxNotifications: 10, defaultDuration: 8000 };
            
            notificationService.updateConfig(newConfig);
            
            expect(notificationService.config.maxNotifications).toBe(10);
            expect(notificationService.config.defaultDuration).toBe(8000);
        });

        test('should return notification count', () => {
            notificationService.notifications.set(1, { id: 1 });
            notificationService.notifications.set(2, { id: 2 });
            
            expect(notificationService.getNotificationCount()).toBe(2);
        });

        test('should check if notification exists', () => {
            notificationService.notifications.set(1, { id: 1 });
            
            expect(notificationService.hasNotification(1)).toBe(true);
            expect(notificationService.hasNotification(2)).toBe(false);
        });
    });
});