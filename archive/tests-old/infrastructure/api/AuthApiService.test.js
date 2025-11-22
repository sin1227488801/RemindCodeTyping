import AuthApiService from '../../../Rct/js/infrastructure/api/AuthApiService.js';

// Mock dependencies
const mockApiClient = {
    post: jest.fn(),
    get: jest.fn(),
    setAuthToken: jest.fn()
};

const mockTokenManager = {
    setTokens: jest.fn(),
    getToken: jest.fn(),
    getRefreshToken: jest.fn(),
    hasToken: jest.fn(),
    getUserInfo: jest.fn(),
    clearTokens: jest.fn(),
    createRefreshFunction: jest.fn(),
    scheduleTokenRefresh: jest.fn()
};

// Mock sessionStorage
const mockSessionStorage = {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn()
};

// Mock window.location
delete window.location;
window.location = { href: '' };

describe('AuthApiService', () => {
    let authService;
    
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup sessionStorage mock
        global.sessionStorage = mockSessionStorage;
        
        authService = new AuthApiService(mockApiClient, mockTokenManager);
    });

    describe('authentication methods', () => {
        const mockAuthResponse = {
            userId: 'user123',
            loginId: 'testuser',
            token: 'jwt-token',
            refreshToken: 'refresh-token',
            guest: false
        };

        test('should handle demo login', async () => {
            mockApiClient.post.mockResolvedValue(mockAuthResponse);
            
            const result = await authService.demoLogin();
            
            expect(mockApiClient.post).toHaveBeenCalledWith('/auth/demo');
            expect(mockTokenManager.setTokens).toHaveBeenCalledWith('jwt-token', 'refresh-token');
            expect(mockApiClient.setAuthToken).toHaveBeenCalledWith('jwt-token');
            expect(mockSessionStorage.setItem).toHaveBeenCalledWith('userId', 'user123');
            expect(result).toBe(mockAuthResponse);
        });

        test('should handle guest login', async () => {
            mockApiClient.post.mockResolvedValue(mockAuthResponse);
            
            const result = await authService.guestLogin();
            
            expect(mockApiClient.post).toHaveBeenCalledWith('/auth/demo');
            expect(result).toBe(mockAuthResponse);
        });

        test('should handle user login', async () => {
            mockApiClient.post.mockResolvedValue(mockAuthResponse);
            
            const result = await authService.login('testuser', 'password123');
            
            expect(mockApiClient.post).toHaveBeenCalledWith('/auth/login', {
                loginId: 'testuser',
                password: 'password123'
            });
            expect(result).toBe(mockAuthResponse);
        });

        test('should validate login inputs', async () => {
            await expect(authService.login('', 'password')).rejects.toThrow('ログインIDとパスワードを入力してください。');
            await expect(authService.login('user', '')).rejects.toThrow('ログインIDとパスワードを入力してください。');
        });

        test('should handle user registration', async () => {
            mockApiClient.post.mockResolvedValue(mockAuthResponse);
            
            const result = await authService.register('newuser', 'password123');
            
            expect(mockApiClient.post).toHaveBeenCalledWith('/auth/register', {
                loginId: 'newuser',
                password: 'password123'
            });
            expect(result).toBe(mockAuthResponse);
        });

        test('should validate registration inputs', async () => {
            await expect(authService.register('', 'password123')).rejects.toThrow('ログインIDとパスワードを入力してください。');
            await expect(authService.register('user', 'short')).rejects.toThrow('パスワードは8文字以上で入力してください。');
        });

        test('should trim whitespace from login inputs', async () => {
            mockApiClient.post.mockResolvedValue(mockAuthResponse);
            
            await authService.login('  testuser  ', 'password123');
            
            expect(mockApiClient.post).toHaveBeenCalledWith('/auth/login', {
                loginId: 'testuser',
                password: 'password123'
            });
        });
    });

    describe('token refresh', () => {
        test('should refresh token successfully', async () => {
            const refreshResponse = {
                token: 'new-jwt-token',
                refreshToken: 'new-refresh-token'
            };
            
            mockApiClient.post.mockResolvedValue(refreshResponse);
            
            const result = await authService.refreshToken('old-refresh-token');
            
            expect(mockApiClient.post).toHaveBeenCalledWith('/auth/refresh', {
                refreshToken: 'old-refresh-token'
            });
            expect(mockTokenManager.setTokens).toHaveBeenCalledWith('new-jwt-token', 'new-refresh-token');
            expect(mockApiClient.setAuthToken).toHaveBeenCalledWith('new-jwt-token');
            expect(result).toBe(refreshResponse);
        });

        test('should handle refresh token failure', async () => {
            mockApiClient.post.mockRejectedValue(new Error('Refresh failed'));
            
            await expect(authService.refreshToken('invalid-token')).rejects.toThrow('Refresh failed');
            expect(mockTokenManager.clearTokens).toHaveBeenCalled();
        });

        test('should require refresh token', async () => {
            await expect(authService.refreshToken('')).rejects.toThrow('Refresh token is required');
        });
    });

    describe('logout', () => {
        test('should logout successfully', async () => {
            mockTokenManager.getToken.mockReturnValue('jwt-token');
            mockApiClient.post.mockResolvedValue({});
            
            await authService.logout();
            
            expect(mockApiClient.post).toHaveBeenCalledWith('/auth/logout');
            expect(mockTokenManager.clearTokens).toHaveBeenCalled();
            expect(mockApiClient.setAuthToken).toHaveBeenCalledWith(null);
            expect(window.location.href).toBe('login.html');
        });

        test('should handle logout even if server call fails', async () => {
            mockTokenManager.getToken.mockReturnValue('jwt-token');
            mockApiClient.post.mockRejectedValue(new Error('Server error'));
            
            await authService.logout();
            
            expect(mockTokenManager.clearTokens).toHaveBeenCalled();
            expect(mockApiClient.setAuthToken).toHaveBeenCalledWith(null);
            expect(window.location.href).toBe('login.html');
        });

        test('should logout without token', async () => {
            mockTokenManager.getToken.mockReturnValue(null);
            
            await authService.logout();
            
            expect(mockApiClient.post).not.toHaveBeenCalled();
            expect(mockTokenManager.clearTokens).toHaveBeenCalled();
            expect(window.location.href).toBe('login.html');
        });
    });

    describe('authentication status', () => {
        test('should check if user is authenticated', () => {
            mockTokenManager.hasToken.mockReturnValue(true);
            
            expect(authService.isAuthenticated()).toBe(true);
            
            mockTokenManager.hasToken.mockReturnValue(false);
            
            expect(authService.isAuthenticated()).toBe(false);
        });

        test('should get current user', () => {
            const mockUserInfo = {
                userId: 'user123',
                loginId: 'testuser',
                roles: ['USER']
            };
            
            mockTokenManager.getUserInfo.mockReturnValue(mockUserInfo);
            mockSessionStorage.getItem.mockReturnValue('false');
            
            const user = authService.getCurrentUser();
            
            expect(user).toEqual({
                userId: 'user123',
                loginId: 'testuser',
                isGuest: false,
                roles: ['USER']
            });
        });

        test('should return null for unauthenticated user', () => {
            mockTokenManager.getUserInfo.mockReturnValue(null);
            
            const user = authService.getCurrentUser();
            
            expect(user).toBeNull();
        });

        test('should fallback to session storage for user data', () => {
            mockTokenManager.getUserInfo.mockReturnValue(null);
            mockSessionStorage.getItem.mockImplementation((key) => {
                switch (key) {
                    case 'userId': return 'user123';
                    case 'loginId': return 'testuser';
                    case 'isGuest': return 'true';
                    case 'token': return 'jwt-token';
                    default: return null;
                }
            });
            
            const user = authService.getUser();
            
            expect(user).toEqual({
                userId: 'user123',
                loginId: 'testuser',
                isGuest: true,
                token: 'jwt-token'
            });
        });
    });

    describe('session validation', () => {
        test('should validate valid session', async () => {
            mockTokenManager.hasToken.mockReturnValue(true);
            mockApiClient.get.mockResolvedValue({});
            
            const isValid = await authService.validateSession();
            
            expect(mockApiClient.get).toHaveBeenCalledWith('/auth/validate');
            expect(isValid).toBe(true);
        });

        test('should handle invalid session', async () => {
            mockTokenManager.hasToken.mockReturnValue(false);
            
            const isValid = await authService.validateSession();
            
            expect(isValid).toBe(false);
        });

        test('should try token refresh on validation failure', async () => {
            mockTokenManager.hasToken.mockReturnValue(true);
            mockApiClient.get.mockRejectedValue(new Error('Unauthorized'));
            mockTokenManager.getRefreshToken.mockReturnValue('refresh-token');
            
            const refreshResponse = { token: 'new-token' };
            mockApiClient.post.mockResolvedValue(refreshResponse);
            
            const isValid = await authService.validateSession();
            
            expect(mockApiClient.post).toHaveBeenCalledWith('/auth/refresh', {
                refreshToken: 'refresh-token'
            });
            expect(isValid).toBe(true);
        });

        test('should clear session on validation failure without refresh token', async () => {
            mockTokenManager.hasToken.mockReturnValue(true);
            mockApiClient.get.mockRejectedValue(new Error('Unauthorized'));
            mockTokenManager.getRefreshToken.mockReturnValue(null);
            
            const isValid = await authService.validateSession();
            
            expect(mockTokenManager.clearTokens).toHaveBeenCalled();
            expect(isValid).toBe(false);
        });
    });

    describe('error handling', () => {
        test('should enhance login error messages', async () => {
            const error = new Error('HTTP error');
            error.status = 401;
            mockApiClient.post.mockRejectedValue(error);
            
            try {
                await authService.login('user', 'pass');
                fail('Should have thrown an error');
            } catch (enhancedError) {
                expect(enhancedError.message).toBe('ログインIDまたはパスワードが正しくありません。');
            }
        });

        test('should enhance registration error messages', async () => {
            const error = new Error('HTTP error');
            error.status = 409;
            mockApiClient.post.mockRejectedValue(error);
            
            try {
                await authService.register('user', 'password123');
                fail('Should have thrown an error');
            } catch (enhancedError) {
                expect(enhancedError.message).toBe('このIDは既に使用されています。別のIDを選択してください。');
            }
        });

        test('should handle network errors', async () => {
            const error = new Error('Network error');
            error.isNetworkError = true;
            mockApiClient.post.mockRejectedValue(error);
            
            try {
                await authService.login('user', 'pass');
                fail('Should have thrown an error');
            } catch (enhancedError) {
                expect(enhancedError.message).toBe('ネットワークに接続できません。インターネット接続を確認してください。');
            }
        });
    });

    describe('token refresh setup', () => {
        test('should setup automatic token refresh', () => {
            const mockRefreshFunction = jest.fn();
            mockTokenManager.createRefreshFunction.mockReturnValue(mockRefreshFunction);
            
            authService.setupTokenRefresh();
            
            expect(mockTokenManager.createRefreshFunction).toHaveBeenCalled();
            expect(mockApiClient.setTokenRefreshCallback).toHaveBeenCalledWith(mockRefreshFunction);
            expect(mockTokenManager.scheduleTokenRefresh).toHaveBeenCalledWith(mockRefreshFunction);
        });
    });

    describe('auth status', () => {
        test('should get comprehensive auth status', () => {
            const mockTokenStatus = {
                isValid: true,
                isExpired: false
            };
            const mockUser = {
                userId: 'user123',
                loginId: 'testuser'
            };
            
            mockTokenManager.getTokenStatus.mockReturnValue(mockTokenStatus);
            mockTokenManager.getUserInfo.mockReturnValue(mockUser);
            mockTokenManager.hasToken.mockReturnValue(true);
            
            const status = authService.getAuthStatus();
            
            expect(status).toMatchObject({
                isAuthenticated: true,
                user: expect.objectContaining({
                    userId: 'user123',
                    loginId: 'testuser'
                }),
                token: mockTokenStatus,
                sessionValid: true
            });
        });
    });
});