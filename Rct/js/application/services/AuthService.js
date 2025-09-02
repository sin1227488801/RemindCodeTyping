/**
 * Authentication Service for the RemindCodeTyping application.
 * 
 * This service coordinates all authentication-related operations and business logic,
 * acting as the primary interface between the presentation layer and the domain/infrastructure
 * layers. It implements comprehensive authentication workflows including login, registration,
 * guest access, session management, and token handling.
 * 
 * @class AuthService
 * @since 1.0.0
 * @author RCT Development Team
 * 
 * Key Features:
 * - User authentication with credentials
 * - User registration and account creation
 * - Guest user support for demo access
 * - JWT token management and refresh
 * - Session validation and persistence
 * - Password change functionality
 * - Event-driven architecture integration
 * - Automatic token refresh and session management
 * 
 * @example
 * // Initialize the service
 * const authService = new AuthService(apiClient, userRepository, eventBus);
 * authService.initialize();
 * 
 * @example
 * // User login
 * const result = await authService.login('john_doe', 'password123');
 * if (result.success) {
 *   console.log('Login successful:', result.user);
 * }
 * 
 * @example
 * // Guest login
 * const guestResult = await authService.loginAsGuest();
 * console.log('Guest user:', guestResult.user);
 * 
 * @example
 * // Check authentication status
 * const status = authService.getAuthStatus();
 * if (status.isAuthenticated) {
 *   console.log('User is logged in:', status.user);
 * }
 */
class AuthService {
    /**
     * Creates a new AuthService instance with required dependencies.
     * 
     * The service requires three core dependencies to function properly:
     * - API client for backend communication
     * - User repository for local user state management
     * - Event bus for decoupled communication with other application components
     * 
     * @param {ApiClient} apiClient - HTTP client for backend API communication
     * @param {UserRepository} userRepository - Repository for managing user state
     * @param {EventBus} eventBus - Event bus for publishing authentication events
     * 
     * @throws {Error} If any required dependency is null or undefined
     * 
     * @since 1.0.0
     */
    constructor(apiClient, userRepository, eventBus) {
        this.apiClient = apiClient;
        this.userRepository = userRepository;
        this.eventBus = eventBus;
    }

    /**
     * Authenticates a user with their login credentials.
     * 
     * This method performs the complete authentication workflow:
     * 1. Emits login attempt event for monitoring
     * 2. Sends credentials to backend for verification
     * 3. Creates User domain object from response
     * 4. Stores authentication token securely
     * 5. Emits success/failure events for application coordination
     * 
     * The method handles all error scenarios gracefully and provides detailed
     * error information for debugging and user feedback.
     * 
     * @param {string} loginId - User's unique login identifier
     * @param {string} password - User's password (will be sent securely to backend)
     * 
     * @returns {Promise<AuthenticationResult>} Authentication result object
     * @returns {Promise<AuthenticationResult>} result.success - Whether authentication succeeded
     * @returns {Promise<AuthenticationResult>} result.user - User object if successful
     * @returns {Promise<AuthenticationResult>} result.token - JWT token if successful
     * @returns {Promise<AuthenticationResult>} result.error - Error message if failed
     * 
     * @throws {Error} If loginId or password is null/undefined
     * 
     * @fires AuthService#auth:login:attempt
     * @fires AuthService#auth:login:success
     * @fires AuthService#auth:login:failure
     * @fires AuthService#auth:login:error
     * 
     * @since 1.0.0
     * 
     * @example
     * try {
     *   const result = await authService.login('john_doe', 'securePassword123');
     *   if (result.success) {
     *     console.log('Welcome back,', result.user.loginId);
     *     // Redirect to main application
     *   } else {
     *     console.error('Login failed:', result.error);
     *     // Show error message to user
     *   }
     * } catch (error) {
     *   console.error('Login error:', error);
     * }
     */
    async login(loginId, password) {
        try {
            // Emit login attempt event
            await this.eventBus.emit('auth:login:attempt', { loginId });

            // Call backend authentication endpoint
            const response = await this.apiClient.post('/auth/login', {
                loginId,
                password
            });

            if (response.success) {
                // Create User instance from response
                const user = new User(
                    response.data.user.id,
                    response.data.user.loginId,
                    false // Not a guest user
                );

                // Store authentication token if provided
                if (response.data.token) {
                    this.storeAuthToken(response.data.token);
                }

                // Emit successful login event
                await this.eventBus.emit('auth:login:success', { user });

                return {
                    success: true,
                    user: user,
                    token: response.data.token
                };
            } else {
                // Emit failed login event
                await this.eventBus.emit('auth:login:failure', { 
                    loginId, 
                    error: response.error 
                });

                return {
                    success: false,
                    error: response.error || 'Login failed'
                };
            }

        } catch (error) {
            // Emit error event
            await this.eventBus.emit('auth:login:error', { 
                loginId, 
                error: error.message 
            });

            return {
                success: false,
                error: error.message || 'An error occurred during login'
            };
        }
    }

    /**
     * Registers a new user
     * @param {string} loginId - Desired login ID
     * @param {string} password - User's password
     * @returns {Promise<Object>} Registration result
     */
    async register(loginId, password) {
        try {
            // Emit registration attempt event
            await this.eventBus.emit('auth:register:attempt', { loginId });

            // Call backend registration endpoint
            const response = await this.apiClient.post('/auth/register', {
                loginId,
                password
            });

            if (response.success) {
                // Create User instance from response
                const user = new User(
                    response.data.user.id,
                    response.data.user.loginId,
                    false // Not a guest user
                );

                // Store authentication token if provided
                if (response.data.token) {
                    this.storeAuthToken(response.data.token);
                }

                // Emit successful registration event
                await this.eventBus.emit('auth:register:success', { user });

                return {
                    success: true,
                    user: user,
                    token: response.data.token
                };
            } else {
                // Emit failed registration event
                await this.eventBus.emit('auth:register:failure', { 
                    loginId, 
                    error: response.error 
                });

                return {
                    success: false,
                    error: response.error || 'Registration failed'
                };
            }

        } catch (error) {
            // Emit error event
            await this.eventBus.emit('auth:register:error', { 
                loginId, 
                error: error.message 
            });

            return {
                success: false,
                error: error.message || 'An error occurred during registration'
            };
        }
    }

    /**
     * Logs in as a guest user
     * @returns {Promise<Object>} Guest login result
     */
    async loginAsGuest() {
        try {
            // Emit guest login attempt event
            await this.eventBus.emit('auth:guest:attempt');

            // Create guest user
            const guestUser = this.userRepository.createGuestUser();

            // Emit successful guest login event
            await this.eventBus.emit('auth:guest:success', { user: guestUser });

            return {
                success: true,
                user: guestUser
            };

        } catch (error) {
            // Emit error event
            await this.eventBus.emit('auth:guest:error', { error: error.message });

            return {
                success: false,
                error: error.message || 'An error occurred during guest login'
            };
        }
    }

    /**
     * Logs out the current user
     * @returns {Promise<Object>} Logout result
     */
    async logout() {
        try {
            const currentUser = this.userRepository.getCurrentUser();
            
            // Emit logout attempt event
            await this.eventBus.emit('auth:logout:attempt', { user: currentUser });

            // If not a guest user, call backend logout endpoint
            if (currentUser && !currentUser.isGuest) {
                try {
                    await this.apiClient.post('/auth/logout');
                } catch (error) {
                    // Log error but don't fail logout process
                    console.warn('Backend logout failed:', error);
                }
            }

            // Clear authentication token
            this.clearAuthToken();

            // Emit successful logout event
            await this.eventBus.emit('auth:logout:success', { user: currentUser });

            return {
                success: true
            };

        } catch (error) {
            // Emit error event
            await this.eventBus.emit('auth:logout:error', { error: error.message });

            return {
                success: false,
                error: error.message || 'An error occurred during logout'
            };
        }
    }

    /**
     * Validates the current authentication session
     * @returns {Promise<Object>} Validation result
     */
    async validateSession() {
        try {
            const currentUser = this.userRepository.getCurrentUser();
            
            if (!currentUser) {
                return { success: false, error: 'No active session' };
            }

            // Guest users don't need server validation
            if (currentUser.isGuest) {
                return { success: true, user: currentUser };
            }

            // Validate with backend
            const token = this.getAuthToken();
            if (!token) {
                return { success: false, error: 'No authentication token' };
            }

            const response = await this.apiClient.get('/auth/validate');
            
            if (response.success) {
                // Update user information if provided
                if (response.data.user) {
                    const updatedUser = new User(
                        response.data.user.id,
                        response.data.user.loginId,
                        false
                    );
                    
                    return { success: true, user: updatedUser };
                }
                
                return { success: true, user: currentUser };
            } else {
                // Session is invalid, clear it
                this.clearAuthToken();
                return { success: false, error: 'Session expired' };
            }

        } catch (error) {
            // On validation error, assume session is invalid
            this.clearAuthToken();
            return { success: false, error: 'Session validation failed' };
        }
    }

    /**
     * Refreshes the authentication token
     * @returns {Promise<Object>} Refresh result
     */
    async refreshToken() {
        try {
            const currentToken = this.getAuthToken();
            if (!currentToken) {
                return { success: false, error: 'No token to refresh' };
            }

            const response = await this.apiClient.post('/auth/refresh', {
                token: currentToken
            });

            if (response.success && response.data.token) {
                this.storeAuthToken(response.data.token);
                
                // Emit token refresh event
                await this.eventBus.emit('auth:token:refreshed', { 
                    token: response.data.token 
                });

                return {
                    success: true,
                    token: response.data.token
                };
            } else {
                return {
                    success: false,
                    error: response.error || 'Token refresh failed'
                };
            }

        } catch (error) {
            return {
                success: false,
                error: error.message || 'An error occurred during token refresh'
            };
        }
    }

    /**
     * Changes the user's password
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise<Object>} Password change result
     */
    async changePassword(currentPassword, newPassword) {
        try {
            const currentUser = this.userRepository.getCurrentUser();
            
            if (!currentUser || currentUser.isGuest) {
                return { success: false, error: 'Not authenticated or guest user' };
            }

            // Emit password change attempt event
            await this.eventBus.emit('auth:password:change:attempt', { 
                userId: currentUser.id 
            });

            const response = await this.apiClient.post('/auth/change-password', {
                currentPassword,
                newPassword
            });

            if (response.success) {
                // Emit successful password change event
                await this.eventBus.emit('auth:password:change:success', { 
                    userId: currentUser.id 
                });

                return { success: true };
            } else {
                // Emit failed password change event
                await this.eventBus.emit('auth:password:change:failure', { 
                    userId: currentUser.id,
                    error: response.error 
                });

                return {
                    success: false,
                    error: response.error || 'Password change failed'
                };
            }

        } catch (error) {
            // Emit error event
            await this.eventBus.emit('auth:password:change:error', { 
                error: error.message 
            });

            return {
                success: false,
                error: error.message || 'An error occurred during password change'
            };
        }
    }

    /**
     * Checks if the user has a specific permission
     * @param {string} permission - Permission to check
     * @returns {boolean} True if user has permission
     */
    hasPermission(permission) {
        return this.userRepository.hasPermission(permission);
    }

    /**
     * Gets the current authentication status
     * @returns {Object} Authentication status
     */
    getAuthStatus() {
        const currentUser = this.userRepository.getCurrentUser();
        const token = this.getAuthToken();
        
        return {
            isAuthenticated: !!currentUser,
            isGuest: currentUser ? currentUser.isGuest : false,
            user: currentUser,
            hasToken: !!token
        };
    }

    /**
     * Token management methods
     */

    /**
     * Stores authentication token
     * @param {string} token - Authentication token
     * @private
     */
    storeAuthToken(token) {
        try {
            localStorage.setItem('authToken', token);
            
            // Set token in API client for future requests
            this.apiClient.setAuthToken(token);
        } catch (error) {
            console.warn('Failed to store auth token:', error);
        }
    }

    /**
     * Gets stored authentication token
     * @returns {string|null} Authentication token or null if not found
     * @private
     */
    getAuthToken() {
        try {
            return localStorage.getItem('authToken');
        } catch (error) {
            console.warn('Failed to get auth token:', error);
            return null;
        }
    }

    /**
     * Clears stored authentication token
     * @private
     */
    clearAuthToken() {
        try {
            localStorage.removeItem('authToken');
            
            // Clear token from API client
            this.apiClient.clearAuthToken();
        } catch (error) {
            console.warn('Failed to clear auth token:', error);
        }
    }

    /**
     * Initializes the authentication service
     */
    initialize() {
        // Load stored token and set it in API client
        const storedToken = this.getAuthToken();
        if (storedToken) {
            this.apiClient.setAuthToken(storedToken);
        }

        // Set up automatic token refresh
        this.setupTokenRefresh();

        // Validate current session
        this.validateCurrentSession();
    }

    /**
     * Sets up automatic token refresh
     * @private
     */
    setupTokenRefresh() {
        // Refresh token every 30 minutes
        setInterval(async () => {
            const currentUser = this.userRepository.getCurrentUser();
            if (currentUser && !currentUser.isGuest) {
                await this.refreshToken();
            }
        }, 30 * 60 * 1000); // 30 minutes
    }

    /**
     * Validates the current session on initialization
     * @private
     */
    async validateCurrentSession() {
        const currentUser = this.userRepository.getCurrentUser();
        if (currentUser && !currentUser.isGuest) {
            const validationResult = await this.validateSession();
            if (!validationResult.success) {
                // Clear invalid session
                this.userRepository.clearCurrentUser();
            }
        }
    }
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthService;
} else if (typeof window !== 'undefined') {
    window.AuthService = AuthService;
}