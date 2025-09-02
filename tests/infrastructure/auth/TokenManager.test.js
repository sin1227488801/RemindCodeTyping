import TokenManager from '../../../Rct/js/infrastructure/auth/TokenManager.js';

// Mock sessionStorage
const mockSessionStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};

// Mock atob for JWT parsing
global.atob = jest.fn();

describe('TokenManager', () => {
    let tokenManager;
    let mockToken;
    let mockPayload;
    
    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Mock JWT payload
        mockPayload = {
            sub: 'user123',
            loginId: 'testuser',
            roles: ['USER'],
            iat: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
            exp: Math.floor(Date.now() / 1000) + 3600  // 1 hour from now
        };
        
        // Mock JWT token (header.payload.signature)
        mockToken = 'eyJhbGciOiJIUzI1NiJ9.' + btoa(JSON.stringify(mockPayload)) + '.signature';
        
        // Setup atob mock
        atob.mockImplementation((str) => {
            if (str === btoa(JSON.stringify(mockPayload))) {
                return JSON.stringify(mockPayload);
            }
            return str;
        });
        
        tokenManager = new TokenManager({
            storage: mockSessionStorage
        });
    });

    describe('constructor', () => {
        test('should initialize with default options', () => {
            const tm = new TokenManager();
            expect(tm.storageKey).toBe('auth_token');
            expect(tm.refreshTokenKey).toBe('refresh_token');
            expect(tm.tokenExpiryBuffer).toBe(60000);
        });

        test('should initialize with custom options', () => {
            const options = {
                storageKey: 'custom_token',
                refreshTokenKey: 'custom_refresh',
                tokenExpiryBuffer: 120000,
                storage: mockSessionStorage
            };
            
            const tm = new TokenManager(options);
            expect(tm.storageKey).toBe('custom_token');
            expect(tm.refreshTokenKey).toBe('custom_refresh');
            expect(tm.tokenExpiryBuffer).toBe(120000);
            expect(tm.storage).toBe(mockSessionStorage);
        });

        test('should initialize from storage', () => {
            mockSessionStorage.getItem.mockImplementation((key) => {
                if (key === 'auth_token') return mockToken;
                if (key === 'refresh_token') return 'refresh123';
                return null;
            });
            
            const tm = new TokenManager({ storage: mockSessionStorage });
            expect(tm.currentToken).toBe(mockToken);
            expect(tm.currentRefreshToken).toBe('refresh123');
        });
    });

    describe('token management', () => {
        test('should set tokens', () => {
            const refreshToken = 'refresh123';
            
            tokenManager.setTokens(mockToken, refreshToken);
            
            expect(tokenManager.currentToken).toBe(mockToken);
            expect(tokenManager.currentRefreshToken).toBe(refreshToken);
            expect(mockSessionStorage.setItem).toHaveBeenCalledWith('auth_token', mockToken);
            expect(mockSessionStorage.setItem).toHaveBeenCalledWith('refresh_token', refreshToken);
        });

        test('should get token when valid', () => {
            tokenManager.currentToken = mockToken;
            
            const token = tokenManager.getToken();
            expect(token).toBe(mockToken);
        });

        test('should return null for expired token', () => {
            // Create expired token
            const expiredPayload = {
                ...mockPayload,
                exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
            };
            const expiredToken = 'eyJhbGciOiJIUzI1NiJ9.' + btoa(JSON.stringify(expiredPayload)) + '.signature';
            
            atob.mockImplementation((str) => {
                if (str === btoa(JSON.stringify(expiredPayload))) {
                    return JSON.stringify(expiredPayload);
                }
                return str;
            });
            
            tokenManager.currentToken = expiredToken;
            
            const token = tokenManager.getToken();
            expect(token).toBeNull();
        });

        test('should check if token exists and is valid', () => {
            tokenManager.currentToken = mockToken;
            expect(tokenManager.hasToken()).toBe(true);
            
            tokenManager.currentToken = null;
            expect(tokenManager.hasToken()).toBe(false);
        });

        test('should clear tokens', () => {
            tokenManager.currentToken = mockToken;
            tokenManager.currentRefreshToken = 'refresh123';
            
            tokenManager.clearTokens();
            
            expect(tokenManager.currentToken).toBeNull();
            expect(tokenManager.currentRefreshToken).toBeNull();
            expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('auth_token');
            expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('refresh_token');
        });
    });

    describe('token parsing', () => {
        test('should parse valid JWT token', () => {
            const payload = tokenManager.parseToken(mockToken);
            
            expect(payload).toEqual(mockPayload);
        });

        test('should return null for invalid token format', () => {
            const invalidToken = 'invalid.token';
            
            const payload = tokenManager.parseToken(invalidToken);
            expect(payload).toBeNull();
        });

        test('should return null for malformed JWT', () => {
            atob.mockImplementation(() => {
                throw new Error('Invalid base64');
            });
            
            const payload = tokenManager.parseToken(mockToken);
            expect(payload).toBeNull();
        });

        test('should return null for null token', () => {
            const payload = tokenManager.parseToken(null);
            expect(payload).toBeNull();
        });
    });

    describe('token expiration', () => {
        test('should get token expiry time', () => {
            const expiry = tokenManager.getTokenExpiry(mockToken);
            expect(expiry).toBe(mockPayload.exp * 1000);
        });

        test('should check if token is expired', () => {
            // Valid token
            expect(tokenManager.isTokenExpired(mockToken)).toBe(false);
            
            // Expired token
            const expiredPayload = {
                ...mockPayload,
                exp: Math.floor(Date.now() / 1000) - 3600
            };
            const expiredToken = 'eyJhbGciOiJIUzI1NiJ9.' + btoa(JSON.stringify(expiredPayload)) + '.signature';
            
            atob.mockImplementation((str) => {
                if (str === btoa(JSON.stringify(expiredPayload))) {
                    return JSON.stringify(expiredPayload);
                }
                return JSON.stringify(mockPayload);
            });
            
            expect(tokenManager.isTokenExpired(expiredToken)).toBe(true);
        });

        test('should check if token is expiring soon', () => {
            // Token expiring in 2 minutes
            const soonPayload = {
                ...mockPayload,
                exp: Math.floor(Date.now() / 1000) + 120
            };
            const soonToken = 'eyJhbGciOiJIUzI1NiJ9.' + btoa(JSON.stringify(soonPayload)) + '.signature';
            
            atob.mockImplementation((str) => {
                if (str === btoa(JSON.stringify(soonPayload))) {
                    return JSON.stringify(soonPayload);
                }
                return JSON.stringify(mockPayload);
            });
            
            tokenManager.currentToken = soonToken;
            
            // Default threshold is 5 minutes
            expect(tokenManager.isTokenExpiringSoon()).toBe(true);
            
            // Custom threshold of 1 minute
            expect(tokenManager.isTokenExpiringSoon(60000)).toBe(false);
        });
    });

    describe('token validation', () => {
        test('should validate valid token', () => {
            tokenManager.currentToken = mockToken;
            
            const isValid = tokenManager.validateToken();
            expect(isValid).toBe(true);
        });

        test('should invalidate expired token', () => {
            const expiredPayload = {
                ...mockPayload,
                exp: Math.floor(Date.now() / 1000) - 3600
            };
            const expiredToken = 'eyJhbGciOiJIUzI1NiJ9.' + btoa(JSON.stringify(expiredPayload)) + '.signature';
            
            atob.mockImplementation((str) => {
                if (str === btoa(JSON.stringify(expiredPayload))) {
                    return JSON.stringify(expiredPayload);
                }
                return JSON.stringify(mockPayload);
            });
            
            tokenManager.currentToken = expiredToken;
            
            const isValid = tokenManager.validateToken();
            expect(isValid).toBe(false);
            expect(tokenManager.currentToken).toBeNull();
        });

        test('should handle token expiration callback', () => {
            const onTokenExpired = jest.fn();
            tokenManager.onTokenExpired = onTokenExpired;
            
            const expiredPayload = {
                ...mockPayload,
                exp: Math.floor(Date.now() / 1000) - 3600
            };
            const expiredToken = 'eyJhbGciOiJIUzI1NiJ9.' + btoa(JSON.stringify(expiredPayload)) + '.signature';
            
            atob.mockImplementation((str) => {
                if (str === btoa(JSON.stringify(expiredPayload))) {
                    return JSON.stringify(expiredPayload);
                }
                return JSON.stringify(mockPayload);
            });
            
            tokenManager.currentToken = expiredToken;
            tokenManager.validateToken();
            
            expect(onTokenExpired).toHaveBeenCalled();
        });
    });

    describe('user information', () => {
        test('should get user info from token', () => {
            tokenManager.currentToken = mockToken;
            
            const userInfo = tokenManager.getUserInfo();
            
            expect(userInfo).toMatchObject({
                userId: 'user123',
                loginId: 'testuser',
                roles: ['USER']
            });
            expect(userInfo.issuedAt).toBeInstanceOf(Date);
            expect(userInfo.expiresAt).toBeInstanceOf(Date);
        });

        test('should return null for invalid token', () => {
            tokenManager.currentToken = null;
            
            const userInfo = tokenManager.getUserInfo();
            expect(userInfo).toBeNull();
        });

        test('should check user roles', () => {
            tokenManager.currentToken = mockToken;
            
            expect(tokenManager.hasRole('USER')).toBe(true);
            expect(tokenManager.hasRole('ADMIN')).toBe(false);
        });
    });

    describe('authorization header', () => {
        test('should get authorization header for valid token', () => {
            tokenManager.currentToken = mockToken;
            
            const header = tokenManager.getAuthorizationHeader();
            expect(header).toBe(`Bearer ${mockToken}`);
        });

        test('should return null for invalid token', () => {
            tokenManager.currentToken = null;
            
            const header = tokenManager.getAuthorizationHeader();
            expect(header).toBeNull();
        });
    });

    describe('token refresh', () => {
        test('should create refresh function', async () => {
            const mockRefreshCall = jest.fn().mockResolvedValue({
                token: 'new-token',
                refreshToken: 'new-refresh'
            });
            
            tokenManager.currentRefreshToken = 'refresh123';
            
            const refreshFunction = tokenManager.createRefreshFunction(mockRefreshCall);
            const result = await refreshFunction();
            
            expect(mockRefreshCall).toHaveBeenCalledWith('refresh123');
            expect(result).toBe('new-token');
            expect(tokenManager.currentToken).toBe('new-token');
            expect(tokenManager.currentRefreshToken).toBe('new-refresh');
        });

        test('should handle refresh failure', async () => {
            const mockRefreshCall = jest.fn().mockRejectedValue(new Error('Refresh failed'));
            
            tokenManager.currentRefreshToken = 'refresh123';
            
            const refreshFunction = tokenManager.createRefreshFunction(mockRefreshCall);
            
            await expect(refreshFunction()).rejects.toThrow('Refresh failed');
            expect(tokenManager.currentToken).toBeNull();
            expect(tokenManager.currentRefreshToken).toBeNull();
        });

        test('should schedule token refresh', () => {
            jest.useFakeTimers();
            
            const refreshCallback = jest.fn();
            tokenManager.currentToken = mockToken;
            
            tokenManager.scheduleTokenRefresh(refreshCallback, 300000); // 5 minutes
            
            // Fast-forward time to just before refresh
            jest.advanceTimersByTime(3300000); // 55 minutes
            
            expect(refreshCallback).toHaveBeenCalled();
            
            jest.useRealTimers();
        });

        test('should cancel token refresh', () => {
            jest.useFakeTimers();
            
            const refreshCallback = jest.fn();
            tokenManager.currentToken = mockToken;
            
            tokenManager.scheduleTokenRefresh(refreshCallback);
            tokenManager.cancelTokenRefresh();
            
            // Fast-forward time
            jest.advanceTimersByTime(3600000);
            
            expect(refreshCallback).not.toHaveBeenCalled();
            
            jest.useRealTimers();
        });
    });

    describe('token status', () => {
        test('should get comprehensive token status', () => {
            tokenManager.currentToken = mockToken;
            tokenManager.currentRefreshToken = 'refresh123';
            
            const status = tokenManager.getTokenStatus();
            
            expect(status).toMatchObject({
                hasToken: true,
                hasRefreshToken: true,
                isValid: true,
                isExpired: false,
                isExpiringSoon: false
            });
            expect(status.expiresAt).toBeInstanceOf(Date);
            expect(status.userInfo).toBeDefined();
        });

        test('should get status for missing token', () => {
            const status = tokenManager.getTokenStatus();
            
            expect(status).toMatchObject({
                hasToken: false,
                hasRefreshToken: false,
                isValid: false,
                isExpired: true,
                isExpiringSoon: false,
                expiresAt: null,
                userInfo: null
            });
        });
    });
});