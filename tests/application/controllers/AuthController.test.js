/**
 * Unit tests for AuthController
 */

// Mock dependencies
const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
    loginAsGuest: jest.fn(),
    logout: jest.fn()
};

const mockUserRepository = {
    setCurrentUser: jest.fn(),
    clearCurrentUser: jest.fn(),
    getCurrentUser: jest.fn()
};

const mockErrorHandler = {
    handle: jest.fn()
};

// Mock DOM elements
const mockFormElement = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
};

const mockButtonElement = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
};

// Mock document methods
global.document = {
    getElementById: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => [])
};

// Mock FormData
global.FormData = jest.fn(() => ({
    get: jest.fn()
}));

// Mock ValidationError and ValidationResult
global.ValidationError = require('../../Rct/js/domain/valueObjects/ValidationError');
global.ValidationResult = require('../../Rct/js/application/validation/ValidationResult');

// Import the controller
const AuthController = require('../../Rct/js/application/controllers/AuthController');

describe('AuthController', () => {
    let authController;
    let mockFormData;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        
        // Create controller instance
        authController = new AuthController(
            mockAuthService,
            mockUserRepository,
            mockErrorHandler
        );

        // Mock FormData instance
        mockFormData = {
            get: jest.fn()
        };
        global.FormData.mockReturnValue(mockFormData);

        // Mock document.getElementById to return mock elements
        document.getElementById.mockImplementation((id) => {
            switch (id) {
                case 'login-form':
                case 'register-form':
                    return mockFormElement;
                case 'guest-login-btn':
                case 'logout-btn':
                    return mockButtonElement;
                default:
                    return null;
            }
        });
    });

    describe('initialize', () => {
        it('should set up event listeners', () => {
            authController.initialize();

            expect(document.getElementById).toHaveBeenCalledWith('login-form');
            expect(document.getElementById).toHaveBeenCalledWith('register-form');
            expect(document.getElementById).toHaveBeenCalledWith('guest-login-btn');
            expect(document.getElementById).toHaveBeenCalledWith('logout-btn');
        });

        it('should check authentication state', () => {
            const mockUser = { isAuthenticated: () => true };
            mockUserRepository.getCurrentUser.mockReturnValue(mockUser);
            
            const redirectSpy = jest.spyOn(authController, 'redirectToMainPage').mockImplementation();
            
            authController.initialize();
            
            expect(mockUserRepository.getCurrentUser).toHaveBeenCalled();
            expect(redirectSpy).toHaveBeenCalled();
            
            redirectSpy.mockRestore();
        });
    });

    describe('handleLogin', () => {
        let mockEvent;

        beforeEach(() => {
            mockEvent = {
                preventDefault: jest.fn(),
                target: mockFormElement
            };

            mockFormData.get.mockImplementation((key) => {
                switch (key) {
                    case 'loginId':
                        return 'testuser';
                    case 'password':
                        return 'password123';
                    default:
                        return null;
                }
            });
        });

        it('should handle successful login', async () => {
            const mockUser = { loginId: 'testuser' };
            mockAuthService.login.mockResolvedValue({
                success: true,
                user: mockUser
            });

            const onLoginSuccessSpy = jest.spyOn(authController, 'onLoginSuccess').mockImplementation();

            await authController.handleLogin(mockEvent);

            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(mockAuthService.login).toHaveBeenCalledWith('testuser', 'password123');
            expect(mockUserRepository.setCurrentUser).toHaveBeenCalledWith(mockUser);
            expect(onLoginSuccessSpy).toHaveBeenCalledWith(mockUser);

            onLoginSuccessSpy.mockRestore();
        });

        it('should handle login failure', async () => {
            mockAuthService.login.mockResolvedValue({
                success: false,
                error: 'Invalid credentials'
            });

            const displayErrorSpy = jest.spyOn(authController, 'displayError').mockImplementation();

            await authController.handleLogin(mockEvent);

            expect(mockAuthService.login).toHaveBeenCalledWith('testuser', 'password123');
            expect(displayErrorSpy).toHaveBeenCalledWith('Invalid credentials');
            expect(mockUserRepository.setCurrentUser).not.toHaveBeenCalled();

            displayErrorSpy.mockRestore();
        });

        it('should handle validation errors', async () => {
            mockFormData.get.mockImplementation((key) => {
                switch (key) {
                    case 'loginId':
                        return ''; // Invalid - empty
                    case 'password':
                        return 'pass'; // Invalid - too short
                    default:
                        return null;
                }
            });

            const displayValidationErrorsSpy = jest.spyOn(authController, 'displayValidationErrors').mockImplementation();

            await authController.handleLogin(mockEvent);

            expect(displayValidationErrorsSpy).toHaveBeenCalled();
            expect(mockAuthService.login).not.toHaveBeenCalled();

            displayValidationErrorsSpy.mockRestore();
        });

        it('should handle exceptions', async () => {
            const error = new Error('Network error');
            mockAuthService.login.mockRejectedValue(error);

            await authController.handleLogin(mockEvent);

            expect(mockErrorHandler.handle).toHaveBeenCalledWith(error, { context: 'login' });
        });
    });

    describe('handleRegister', () => {
        let mockEvent;

        beforeEach(() => {
            mockEvent = {
                preventDefault: jest.fn(),
                target: mockFormElement
            };

            mockFormData.get.mockImplementation((key) => {
                switch (key) {
                    case 'loginId':
                        return 'newuser';
                    case 'password':
                        return 'password123';
                    case 'confirmPassword':
                        return 'password123';
                    default:
                        return null;
                }
            });
        });

        it('should handle successful registration', async () => {
            const mockUser = { loginId: 'newuser' };
            mockAuthService.register.mockResolvedValue({
                success: true,
                user: mockUser
            });

            const onRegistrationSuccessSpy = jest.spyOn(authController, 'onRegistrationSuccess').mockImplementation();

            await authController.handleRegister(mockEvent);

            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(mockAuthService.register).toHaveBeenCalledWith('newuser', 'password123');
            expect(mockUserRepository.setCurrentUser).toHaveBeenCalledWith(mockUser);
            expect(onRegistrationSuccessSpy).toHaveBeenCalledWith(mockUser);

            onRegistrationSuccessSpy.mockRestore();
        });

        it('should handle password mismatch', async () => {
            mockFormData.get.mockImplementation((key) => {
                switch (key) {
                    case 'loginId':
                        return 'newuser';
                    case 'password':
                        return 'password123';
                    case 'confirmPassword':
                        return 'different'; // Mismatch
                    default:
                        return null;
                }
            });

            const displayValidationErrorsSpy = jest.spyOn(authController, 'displayValidationErrors').mockImplementation();

            await authController.handleRegister(mockEvent);

            expect(displayValidationErrorsSpy).toHaveBeenCalled();
            expect(mockAuthService.register).not.toHaveBeenCalled();

            displayValidationErrorsSpy.mockRestore();
        });
    });

    describe('handleGuestLogin', () => {
        let mockEvent;

        beforeEach(() => {
            mockEvent = {
                preventDefault: jest.fn()
            };
        });

        it('should handle successful guest login', async () => {
            const mockGuestUser = { loginId: 'Guest', isGuest: true };
            mockAuthService.loginAsGuest.mockResolvedValue({
                success: true,
                user: mockGuestUser
            });

            const onLoginSuccessSpy = jest.spyOn(authController, 'onLoginSuccess').mockImplementation();

            await authController.handleGuestLogin(mockEvent);

            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(mockAuthService.loginAsGuest).toHaveBeenCalled();
            expect(mockUserRepository.setCurrentUser).toHaveBeenCalledWith(mockGuestUser);
            expect(onLoginSuccessSpy).toHaveBeenCalledWith(mockGuestUser);

            onLoginSuccessSpy.mockRestore();
        });

        it('should handle guest login failure', async () => {
            mockAuthService.loginAsGuest.mockResolvedValue({
                success: false,
                error: 'Guest login failed'
            });

            const displayErrorSpy = jest.spyOn(authController, 'displayError').mockImplementation();

            await authController.handleGuestLogin(mockEvent);

            expect(displayErrorSpy).toHaveBeenCalledWith('Guest login failed');

            displayErrorSpy.mockRestore();
        });
    });

    describe('handleLogout', () => {
        let mockEvent;

        beforeEach(() => {
            mockEvent = {
                preventDefault: jest.fn()
            };
        });

        it('should handle successful logout', async () => {
            mockAuthService.logout.mockResolvedValue({ success: true });

            const onLogoutSuccessSpy = jest.spyOn(authController, 'onLogoutSuccess').mockImplementation();

            await authController.handleLogout(mockEvent);

            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(mockUserRepository.clearCurrentUser).toHaveBeenCalled();
            expect(mockAuthService.logout).toHaveBeenCalled();
            expect(onLogoutSuccessSpy).toHaveBeenCalled();

            onLogoutSuccessSpy.mockRestore();
        });

        it('should handle logout errors', async () => {
            const error = new Error('Logout failed');
            mockAuthService.logout.mockRejectedValue(error);

            await authController.handleLogout(mockEvent);

            expect(mockErrorHandler.handle).toHaveBeenCalledWith(error, { context: 'logout' });
        });
    });

    describe('validateLoginCredentials', () => {
        it('should validate correct credentials', () => {
            const credentials = {
                loginId: 'testuser',
                password: 'password123'
            };

            const result = authController.validateLoginCredentials(credentials);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject empty login ID', () => {
            const credentials = {
                loginId: '',
                password: 'password123'
            };

            const result = authController.validateLoginCredentials(credentials);

            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].field).toBe('loginId');
        });

        it('should reject short login ID', () => {
            const credentials = {
                loginId: 'ab',
                password: 'password123'
            };

            const result = authController.validateLoginCredentials(credentials);

            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].field).toBe('loginId');
        });

        it('should reject empty password', () => {
            const credentials = {
                loginId: 'testuser',
                password: ''
            };

            const result = authController.validateLoginCredentials(credentials);

            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].field).toBe('password');
        });

        it('should reject short password', () => {
            const credentials = {
                loginId: 'testuser',
                password: 'pass'
            };

            const result = authController.validateLoginCredentials(credentials);

            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].field).toBe('password');
        });
    });

    describe('validateRegistrationData', () => {
        it('should validate correct registration data', () => {
            const userData = {
                loginId: 'newuser',
                password: 'password123',
                confirmPassword: 'password123'
            };

            const result = authController.validateRegistrationData(userData);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject invalid login ID format', () => {
            const userData = {
                loginId: 'user@invalid',
                password: 'password123',
                confirmPassword: 'password123'
            };

            const result = authController.validateRegistrationData(userData);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.field === 'loginId')).toBe(true);
        });

        it('should reject password mismatch', () => {
            const userData = {
                loginId: 'newuser',
                password: 'password123',
                confirmPassword: 'different'
            };

            const result = authController.validateRegistrationData(userData);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.field === 'confirmPassword')).toBe(true);
        });

        it('should reject too long login ID', () => {
            const userData = {
                loginId: 'a'.repeat(25), // Too long
                password: 'password123',
                confirmPassword: 'password123'
            };

            const result = authController.validateRegistrationData(userData);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.field === 'loginId')).toBe(true);
        });

        it('should reject too long password', () => {
            const userData = {
                loginId: 'newuser',
                password: 'a'.repeat(55), // Too long
                confirmPassword: 'a'.repeat(55)
            };

            const result = authController.validateRegistrationData(userData);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.field === 'password')).toBe(true);
        });
    });

    describe('destroy', () => {
        it('should remove all event listeners', () => {
            // Set up some event listeners first
            authController.eventListeners.set('test', {
                element: mockFormElement,
                event: 'submit',
                handler: jest.fn()
            });

            authController.destroy();

            expect(mockFormElement.removeEventListener).toHaveBeenCalled();
            expect(authController.eventListeners.size).toBe(0);
        });
    });
});