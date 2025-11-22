/**
 * Unit tests for User domain model
 */

// Import the User class
const User = require('../../../Rct/js/domain/models/User.js');

describe('User Domain Model', () => {
    describe('Constructor', () => {
        test('should create a valid user with required parameters', () => {
            const user = new User('user123', 'testuser');
            
            expect(user.id).toBe('user123');
            expect(user.loginId).toBe('testuser');
            expect(user.isGuest).toBe(false);
            expect(user.token).toBeNull();
            expect(user.createdAt).toBeInstanceOf(Date);
        });

        test('should create a guest user', () => {
            const user = new User('guest123', 'guest', true, null);
            
            expect(user.id).toBe('guest123');
            expect(user.loginId).toBe('guest');
            expect(user.isGuest).toBe(true);
            expect(user.token).toBeNull();
        });

        test('should create a user with token', () => {
            const token = 'jwt-token-123';
            const user = new User('user123', 'testuser', false, token);
            
            expect(user.token).toBe(token);
        });

        test('should throw error for invalid id', () => {
            expect(() => new User('', 'testuser')).toThrow('User ID must be a non-empty string');
            expect(() => new User(null, 'testuser')).toThrow('User ID must be a non-empty string');
            expect(() => new User(123, 'testuser')).toThrow('User ID must be a non-empty string');
        });

        test('should throw error for invalid loginId', () => {
            expect(() => new User('user123', '')).toThrow('Login ID must be a non-empty string');
            expect(() => new User('user123', null)).toThrow('Login ID must be a non-empty string');
            expect(() => new User('user123', 123)).toThrow('Login ID must be a non-empty string');
        });
    });

    describe('Authentication Methods', () => {
        test('isAuthenticated should return true when user has id and token', () => {
            const user = new User('user123', 'testuser', false, 'token123');
            expect(user.isAuthenticated()).toBe(true);
        });

        test('isAuthenticated should return false when user has no token', () => {
            const user = new User('user123', 'testuser');
            expect(user.isAuthenticated()).toBe(false);
        });

        test('isAuthenticated should return false when user has no id', () => {
            const user = new User('user123', 'testuser', false, 'token123');
            user._id = null; // Simulate missing id
            expect(user.isAuthenticated()).toBe(false);
        });

        test('isRegularUser should return true for non-guest users', () => {
            const user = new User('user123', 'testuser', false);
            expect(user.isRegularUser()).toBe(true);
        });

        test('isRegularUser should return false for guest users', () => {
            const user = new User('guest123', 'guest', true);
            expect(user.isRegularUser()).toBe(false);
        });
    });

    describe('Token Management', () => {
        test('updateToken should update the token', () => {
            const user = new User('user123', 'testuser');
            const newToken = 'new-token-123';
            
            user.updateToken(newToken);
            expect(user.token).toBe(newToken);
        });

        test('updateToken should throw error for invalid token', () => {
            const user = new User('user123', 'testuser');
            
            expect(() => user.updateToken('')).toThrow('Token must be a non-empty string');
            expect(() => user.updateToken(null)).toThrow('Token must be a non-empty string');
            expect(() => user.updateToken(123)).toThrow('Token must be a non-empty string');
        });

        test('clearToken should clear the token', () => {
            const user = new User('user123', 'testuser', false, 'token123');
            
            user.clearToken();
            expect(user.token).toBeNull();
        });
    });

    describe('Serialization', () => {
        test('toPlainObject should return correct plain object', () => {
            const user = new User('user123', 'testuser', false, 'token123');
            const plainObject = user.toPlainObject();
            
            expect(plainObject).toEqual({
                id: 'user123',
                loginId: 'testuser',
                isGuest: false,
                token: 'token123',
                createdAt: user.createdAt.toISOString()
            });
        });

        test('fromPlainObject should create user from plain object', () => {
            const data = {
                id: 'user123',
                loginId: 'testuser',
                isGuest: false,
                token: 'token123',
                createdAt: '2024-01-01T00:00:00.000Z'
            };
            
            const user = User.fromPlainObject(data);
            
            expect(user.id).toBe('user123');
            expect(user.loginId).toBe('testuser');
            expect(user.isGuest).toBe(false);
            expect(user.token).toBe('token123');
            expect(user.createdAt).toEqual(new Date('2024-01-01T00:00:00.000Z'));
        });

        test('fromPlainObject should throw error for invalid data', () => {
            expect(() => User.fromPlainObject(null)).toThrow('Data must be an object');
            expect(() => User.fromPlainObject('invalid')).toThrow('Data must be an object');
        });
    });

    describe('Static Methods', () => {
        test('createGuest should create a guest user', () => {
            const guestUser = User.createGuest();
            
            expect(guestUser.loginId).toBe('guest');
            expect(guestUser.isGuest).toBe(true);
            expect(guestUser.id).toMatch(/^guest_\d+_[a-z0-9]+$/);
        });

        test('createGuest should create a guest user with custom id', () => {
            const guestUser = User.createGuest('custom-guest-id');
            
            expect(guestUser.id).toBe('custom-guest-id');
            expect(guestUser.loginId).toBe('guest');
            expect(guestUser.isGuest).toBe(true);
        });

        test('validate should return true for valid user data', () => {
            const userData = {
                id: 'user123',
                loginId: 'testuser',
                isGuest: false,
                token: 'token123'
            };
            
            expect(User.validate(userData)).toBe(true);
        });

        test('validate should throw error for invalid user data', () => {
            expect(() => User.validate(null)).toThrow('User data must be an object');
            expect(() => User.validate({ loginId: 'test' })).toThrow('User ID must be a non-empty string');
            expect(() => User.validate({ id: 'user123' })).toThrow('Login ID must be a non-empty string');
            expect(() => User.validate({ id: 'user123', loginId: 'test', isGuest: 'invalid' }))
                .toThrow('isGuest must be a boolean');
            expect(() => User.validate({ id: 'user123', loginId: 'test', token: 123 }))
                .toThrow('Token must be a string or null');
        });
    });

    describe('Comparison Methods', () => {
        test('equals should return true for same users', () => {
            const user1 = new User('user123', 'testuser');
            const user2 = new User('user123', 'testuser');
            
            expect(user1.equals(user2)).toBe(true);
        });

        test('equals should return false for different users', () => {
            const user1 = new User('user123', 'testuser');
            const user2 = new User('user456', 'testuser');
            const user3 = new User('user123', 'different');
            
            expect(user1.equals(user2)).toBe(false);
            expect(user1.equals(user3)).toBe(false);
        });

        test('equals should return false for non-User objects', () => {
            const user = new User('user123', 'testuser');
            
            expect(user.equals(null)).toBe(false);
            expect(user.equals({})).toBe(false);
            expect(user.equals('user')).toBe(false);
        });
    });

    describe('String Representation', () => {
        test('toString should return correct string representation', () => {
            const user = new User('user123', 'testuser', false);
            const expected = 'User(id=user123, loginId=testuser, isGuest=false)';
            
            expect(user.toString()).toBe(expected);
        });

        test('toString should work for guest users', () => {
            const user = new User('guest123', 'guest', true);
            const expected = 'User(id=guest123, loginId=guest, isGuest=true)';
            
            expect(user.toString()).toBe(expected);
        });
    });
});