/**
 * @jest-environment jsdom
 */

const AuthenticationView = require('../../../../Rct/js/presentation/components/auth/AuthenticationView.js');

// Mock the form components
jest.mock('../../../../Rct/js/presentation/components/auth/LoginForm.js', () => {
    return class MockLoginForm {
        constructor(container, options) {
            this.container = container;
            this.options = options;
            this.eventHandlers = new Map();
        }
        
        render() {
            this.container.innerHTML = '<div class="mock-login-form">Login Form</div>';
        }
        
        on(eventName, handler) {
            this.eventHandlers.set(eventName, handler);
        }
        
        off(eventName, handler) {
            this.eventHandlers.delete(eventName);
        }
        
        emit(eventName, data) {
            const handler = this.eventHandlers.get(eventName);
            if (handler) {
                handler({ detail: data });
            }
        }
        
        setSubmittingState(isSubmitting) {
            this.isSubmitting = isSubmitting;
        }
        
        displayError(message) {
            this.lastError = message;
        }
        
        displaySuccess(message) {
            this.lastSuccess = message;
        }
        
        clearErrors() {
            this.lastError = null;
            this.lastSuccess = null;
        }
        
        destroy() {
            this.container.innerHTML = '';
        }
    };
});

jest.mock('../../../../Rct/js/presentation/components/auth/RegisterForm.js', () => {
    return class MockRegisterForm {
        constructor(container, options) {
            this.container = container;
            this.options = options;
            this.eventHandlers = new Map();
        }
        
        render() {
            this.container.innerHTML = '<div class="mock-register-form">Register Form</div>';
        }
        
        on(eventName, handler) {
            this.eventHandlers.set(eventName, handler);
        }
        
        off(eventName, handler) {
            this.eventHandlers.delete(eventName);
        }
        
        emit(eventName, data) {
            const handler = this.eventHandlers.get(eventName);
            if (handler) {
                handler({ detail: data });
            }
        }
        
        setSubmittingState(isSubmitting) {
            this.isSubmitting = isSubmitting;
        }
        
        displayError(message) {
            this.lastError = message;
        }
        
        displaySuccess(message) {
            this.lastSuccess = message;
        }
        
        clearErrors() {
            this.lastError = null;
            this.lastSuccess = null;
        }
        
        destroy() {
            this.container.innerHTML = '';
        }
    };
});

describe('AuthenticationView Component', () => {
    let container;
    let authView;
    let mockAuthController;
    let mockErrorHandler;

    beforeEach(() => {
        // Set up DOM
        document.body.innerHTML = '';
        container = document.createElement('div');
        document.body.appendChild(container);
        
        // Mock dependencies
        mockAuthController = {
            login: jest.fn(),
            register: jest.fn(),
            loginAsGuest: jest.fn(),
            isAuthenticated: jest.fn()
        };
        
        mockErrorHandler = {
            handle: jest.fn()
        };
        
        authView = new AuthenticationView(container, {
            authController: mockAuthController,
            errorHandler: mockErrorHandler
        });
    });

    afterEach(() => {
        if (authView) {
            authView.destroy();
        }
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        test('should initialize with login view by default', () => {
            authView.initialize();
            
            expect(authView.getCurrentView()).toBe('login');
            expect(container.querySelector('.auth-view')).toBeTruthy();
        });

        test('should render authentication tabs', () => {
            authView.initialize();
            
            const loginTab = container.querySelector('#login-tab');
            const registerTab = container.querySelector('#register-tab');
            
            expect(loginTab).toBeTruthy();
            expect(registerTab).toBeTruthy();
            expect(loginTab.classList.contains('active')).toBe(true);
            expect(registerTab.classList.contains('active')).toBe(false);
        });

        test('should render auth header with logo and title', () => {
            authView.initialize();
            
            expect(container.querySelector('.auth-logo')).toBeTruthy();
            expect(container.querySelector('.auth-title')).toBeTruthy();
        });
    });

    describe('View Switching', () => {
        beforeEach(() => {
            authView.initialize();
        });

        test('should switch to register view when register tab clicked', () => {
            const registerTab = container.querySelector('#register-tab');
            
            registerTab.click();
            
            expect(authView.getCurrentView()).toBe('register');
            expect(registerTab.classList.contains('active')).toBe(true);
            expect(container.querySelector('#login-tab').classList.contains('active')).toBe(false);
        });

        test('should switch to login view when login tab clicked', () => {
            // First switch to register
            authView.switchView('register');
            expect(authView.getCurrentView()).toBe('register');
            
            // Then switch back to login
            const loginTab = container.querySelector('#login-tab');
            loginTab.click();
            
            expect(authView.getCurrentView()).toBe('login');
            expect(loginTab.classList.contains('active')).toBe(true);
        });

        test('should not switch if clicking on already active tab', () => {
            const loginTab = container.querySelector('#login-tab');
            const initialView = authView.getCurrentView();
            
            loginTab.click();
            
            expect(authView.getCurrentView()).toBe(initialView);
        });

        test('should update tab ARIA attributes when switching', () => {
            const loginTab = container.querySelector('#login-tab');
            const registerTab = container.querySelector('#register-tab');
            
            registerTab.click();
            
            expect(loginTab.getAttribute('aria-selected')).toBe('false');
            expect(registerTab.getAttribute('aria-selected')).toBe('true');
        });
    });

    describe('Keyboard Navigation', () => {
        beforeEach(() => {
            authView.initialize();
        });

        test('should navigate tabs with arrow keys', () => {
            const tabContainer = container.querySelector('.auth-tabs');
            const registerTab = container.querySelector('#register-tab');
            
            // Simulate right arrow key
            const rightArrowEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
            tabContainer.dispatchEvent(rightArrowEvent);
            
            expect(authView.getCurrentView()).toBe('register');
        });

        test('should navigate to first tab with Home key', () => {
            authView.switchView('register');
            
            const tabContainer = container.querySelector('.auth-tabs');
            const homeEvent = new KeyboardEvent('keydown', { key: 'Home' });
            tabContainer.dispatchEvent(homeEvent);
            
            expect(authView.getCurrentView()).toBe('login');
        });

        test('should navigate to last tab with End key', () => {
            const tabContainer = container.querySelector('.auth-tabs');
            const endEvent = new KeyboardEvent('keydown', { key: 'End' });
            tabContainer.dispatchEvent(endEvent);
            
            expect(authView.getCurrentView()).toBe('register');
        });

        test('should wrap around when navigating with arrow keys', () => {
            // Start at register (last tab)
            authView.switchView('register');
            
            const tabContainer = container.querySelector('.auth-tabs');
            const rightArrowEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
            tabContainer.dispatchEvent(rightArrowEvent);
            
            expect(authView.getCurrentView()).toBe('login');
        });
    });

    describe('Login Handling', () => {
        beforeEach(() => {
            authView.initialize();
        });

        test('should handle successful login', async () => {
            const mockResult = { success: true, user: { loginId: 'testuser' } };
            mockAuthController.login.mockResolvedValue(mockResult);
            
            // Simulate login form submission
            const credentials = { loginId: 'testuser', password: 'password123' };
            await authView.handleLogin(credentials);
            
            expect(mockAuthController.login).toHaveBeenCalledWith('testuser', 'password123');
        });

        test('should handle login failure', async () => {
            const mockResult = { success: false, error: 'Invalid credentials' };
            mockAuthController.login.mockResolvedValue(mockResult);
            
            const credentials = { loginId: 'testuser', password: 'wrongpassword' };
            await authView.handleLogin(credentials);
            
            expect(mockAuthController.login).toHaveBeenCalledWith('testuser', 'wrongpassword');
        });

        test('should handle login error', async () => {
            const error = new Error('Network error');
            mockAuthController.login.mockRejectedValue(error);
            
            const credentials = { loginId: 'testuser', password: 'password123' };
            await authView.handleLogin(credentials);
            
            expect(mockErrorHandler.handle).toHaveBeenCalledWith(error, { context: 'login' });
        });
    });

    describe('Guest Login Handling', () => {
        beforeEach(() => {
            authView.initialize();
        });

        test('should handle successful guest login', async () => {
            const mockResult = { success: true, user: { loginId: 'guest', isGuest: true } };
            mockAuthController.loginAsGuest.mockResolvedValue(mockResult);
            
            await authView.handleGuestLogin();
            
            expect(mockAuthController.loginAsGuest).toHaveBeenCalled();
        });

        test('should handle guest login failure', async () => {
            const mockResult = { success: false, error: 'Guest login failed' };
            mockAuthController.loginAsGuest.mockResolvedValue(mockResult);
            
            await authView.handleGuestLogin();
            
            expect(mockAuthController.loginAsGuest).toHaveBeenCalled();
        });
    });

    describe('Registration Handling', () => {
        beforeEach(() => {
            authView.initialize();
            authView.switchView('register');
        });

        test('should handle successful registration', async () => {
            const mockResult = { success: true, user: { loginId: 'newuser' } };
            mockAuthController.register.mockResolvedValue(mockResult);
            
            const userData = { loginId: 'newuser', password: 'password123' };
            await authView.handleRegister(userData);
            
            expect(mockAuthController.register).toHaveBeenCalledWith('newuser', 'password123');
        });

        test('should handle registration failure', async () => {
            const mockResult = { success: false, error: 'User already exists' };
            mockAuthController.register.mockResolvedValue(mockResult);
            
            const userData = { loginId: 'existinguser', password: 'password123' };
            await authView.handleRegister(userData);
            
            expect(mockAuthController.register).toHaveBeenCalledWith('existinguser', 'password123');
        });
    });

    describe('Error Handling', () => {
        beforeEach(() => {
            authView.initialize();
        });

        test('should handle network errors with appropriate message', () => {
            const networkError = new Error('Network error');
            
            authView.handleError(networkError, 'login');
            
            expect(mockErrorHandler.handle).toHaveBeenCalledWith(networkError, { context: 'login' });
        });

        test('should handle authentication errors with appropriate message', () => {
            const authError = new Error('Invalid credentials');
            
            authView.handleError(authError, 'login');
            
            expect(mockErrorHandler.handle).toHaveBeenCalledWith(authError, { context: 'login' });
        });

        test('should handle duplicate user errors with appropriate message', () => {
            const duplicateError = new Error('User already exists');
            
            authView.handleError(duplicateError, 'registration');
            
            expect(mockErrorHandler.handle).toHaveBeenCalledWith(duplicateError, { context: 'registration' });
        });
    });

    describe('Message Display', () => {
        beforeEach(() => {
            authView.initialize();
        });

        test('should display success message on active form', () => {
            const message = 'Success message';
            authView.displaySuccess(message);
            
            // Should display on login form since it's the active view
            expect(authView.loginForm.lastSuccess).toBe(message);
        });

        test('should display error message on active form', () => {
            const message = 'Error message';
            authView.displayError(message);
            
            // Should display on login form since it's the active view
            expect(authView.loginForm.lastError).toBe(message);
        });

        test('should clear messages on both forms', () => {
            authView.displayError('Test error');
            authView.switchView('register');
            authView.displayError('Another error');
            
            authView.clearMessages();
            
            expect(authView.loginForm.lastError).toBeNull();
            expect(authView.registerForm.lastError).toBeNull();
        });
    });

    describe('Authentication State Check', () => {
        test('should check authentication state', () => {
            mockAuthController.isAuthenticated.mockReturnValue(true);
            
            const isAuthenticated = authView.checkAuthenticationState();
            
            expect(isAuthenticated).toBe(true);
            expect(mockAuthController.isAuthenticated).toHaveBeenCalled();
        });

        test('should return false when no auth controller', () => {
            authView = new AuthenticationView(container, {});
            
            const isAuthenticated = authView.checkAuthenticationState();
            
            expect(isAuthenticated).toBe(false);
        });
    });

    describe('Form Management', () => {
        beforeEach(() => {
            authView.initialize();
        });

        test('should initialize login form by default', () => {
            expect(authView.loginForm).toBeTruthy();
            expect(authView.registerForm).toBeFalsy();
        });

        test('should switch forms when changing views', () => {
            expect(authView.loginForm).toBeTruthy();
            expect(authView.registerForm).toBeFalsy();
            
            authView.switchView('register');
            
            expect(authView.loginForm).toBeFalsy();
            expect(authView.registerForm).toBeTruthy();
        });

        test('should destroy forms when switching views', () => {
            const loginForm = authView.loginForm;
            const destroySpy = jest.spyOn(loginForm, 'destroy');
            
            authView.switchView('register');
            
            expect(destroySpy).toHaveBeenCalled();
        });
    });

    describe('Cleanup', () => {
        test('should clean up resources on destroy', () => {
            authView.initialize();
            
            const initialHTML = container.innerHTML;
            expect(initialHTML).toBeTruthy();
            
            authView.destroy();
            
            expect(container.innerHTML).toBe('');
        });

        test('should destroy forms on cleanup', () => {
            authView.initialize();
            
            const loginForm = authView.loginForm;
            const destroySpy = jest.spyOn(loginForm, 'destroy');
            
            authView.destroy();
            
            expect(destroySpy).toHaveBeenCalled();
        });
    });

    describe('Accessibility', () => {
        beforeEach(() => {
            authView.initialize();
        });

        test('should have proper tab roles and attributes', () => {
            const tabs = container.querySelectorAll('.auth-tab');
            
            tabs.forEach(tab => {
                expect(tab.getAttribute('data-view')).toBeTruthy();
            });
        });

        test('should update aria-selected attributes correctly', () => {
            const loginTab = container.querySelector('#login-tab');
            const registerTab = container.querySelector('#register-tab');
            
            expect(loginTab.getAttribute('aria-selected')).toBe('true');
            expect(registerTab.getAttribute('aria-selected')).toBe('false');
            
            authView.switchView('register');
            
            expect(loginTab.getAttribute('aria-selected')).toBe('false');
            expect(registerTab.getAttribute('aria-selected')).toBe('true');
        });
    });
});