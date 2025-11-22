import Logger from '../../../Rct/js/infrastructure/logging/Logger.js';

// Mock fetch for remote logging tests
global.fetch = jest.fn();

// Mock navigator.sendBeacon
Object.defineProperty(navigator, 'sendBeacon', {
    value: jest.fn(),
    writable: true
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
    value: {
        getItem: jest.fn(),
        setItem: jest.fn()
    },
    writable: true
});

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
    value: {
        getItem: jest.fn()
    },
    writable: true
});

describe('Logger', () => {
    let logger;
    let consoleSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock console methods
        consoleSpy = {
            error: jest.spyOn(console, 'error').mockImplementation(),
            warn: jest.spyOn(console, 'warn').mockImplementation(),
            info: jest.spyOn(console, 'info').mockImplementation(),
            debug: jest.spyOn(console, 'debug').mockImplementation(),
            trace: jest.spyOn(console, 'trace').mockImplementation(),
            log: jest.spyOn(console, 'log').mockImplementation()
        };
        
        logger = new Logger();
    });

    afterEach(() => {
        Object.values(consoleSpy).forEach(spy => spy.mockRestore());
    });

    describe('constructor', () => {
        test('should initialize with default configuration', () => {
            expect(logger.config.level).toBe('info');
            expect(logger.config.enableConsole).toBe(true);
            expect(logger.config.enableRemote).toBe(false);
            expect(logger.config.maxLogSize).toBe(1000);
        });

        test('should accept custom configuration', () => {
            const customLogger = new Logger({
                level: 'debug',
                enableConsole: false,
                enableRemote: true,
                remoteEndpoint: 'https://api.example.com/logs'
            });
            
            expect(customLogger.config.level).toBe('debug');
            expect(customLogger.config.enableConsole).toBe(false);
            expect(customLogger.config.enableRemote).toBe(true);
            expect(customLogger.config.remoteEndpoint).toBe('https://api.example.com/logs');
        });

        test('should set current level based on configuration', () => {
            const debugLogger = new Logger({ level: 'debug' });
            const errorLogger = new Logger({ level: 'error' });
            
            expect(debugLogger.currentLevel).toBe(3);
            expect(errorLogger.currentLevel).toBe(0);
        });
    });

    describe('log levels', () => {
        test('should log error messages', () => {
            logger.error('Test error', { code: 'ERR001' });
            
            expect(consoleSpy.error).toHaveBeenCalledWith(
                expect.stringContaining('[ERROR]'),
                'Test error',
                expect.objectContaining({ code: 'ERR001' })
            );
        });

        test('should log warning messages', () => {
            logger.warn('Test warning');
            
            expect(consoleSpy.warn).toHaveBeenCalledWith(
                expect.stringContaining('[WARN]'),
                'Test warning',
                null
            );
        });

        test('should log info messages', () => {
            logger.info('Test info');
            
            expect(consoleSpy.info).toHaveBeenCalledWith(
                expect.stringContaining('[INFO]'),
                'Test info',
                null
            );
        });

        test('should log debug messages when level allows', () => {
            const debugLogger = new Logger({ level: 'debug' });
            debugLogger.debug('Test debug');
            
            expect(consoleSpy.debug).toHaveBeenCalledWith(
                expect.stringContaining('[DEBUG]'),
                'Test debug',
                null
            );
        });

        test('should not log debug messages when level is info', () => {
            logger.debug('Test debug');
            
            expect(consoleSpy.debug).not.toHaveBeenCalled();
        });

        test('should log trace messages when level allows', () => {
            const traceLogger = new Logger({ level: 'trace' });
            traceLogger.trace('Test trace');
            
            expect(consoleSpy.trace).toHaveBeenCalledWith(
                expect.stringContaining('[TRACE]'),
                'Test trace',
                null
            );
        });
    });

    describe('createLogEntry', () => {
        test('should create structured log entry', () => {
            window.sessionStorage.getItem.mockReturnValue('test-session-id');
            
            const entry = logger.createLogEntry('error', 'Test message', { key: 'value' });
            
            expect(entry).toEqual({
                timestamp: expect.any(String),
                level: 'error',
                message: 'Test message',
                data: { key: 'value' },
                sessionId: 'test-session-id',
                userId: null,
                url: 'http://localhost/',
                userAgent: expect.any(String),
                correlationId: expect.stringMatching(/^log_\d+_[a-z0-9]+$/)
            });
        });

        test('should include stack trace for errors when enabled', () => {
            const loggerWithStack = new Logger({ includeStackTrace: true });
            const entry = loggerWithStack.createLogEntry('error', 'Test error');
            
            expect(entry.stackTrace).toBeDefined();
            expect(typeof entry.stackTrace).toBe('string');
        });

        test('should not include stack trace for non-errors', () => {
            const loggerWithStack = new Logger({ includeStackTrace: true });
            const entry = loggerWithStack.createLogEntry('info', 'Test info');
            
            expect(entry.stackTrace).toBeUndefined();
        });
    });

    describe('sanitizeData', () => {
        test('should redact sensitive fields', () => {
            const data = {
                username: 'user123',
                password: 'secret123',
                token: 'jwt-token',
                normalField: 'normal-value'
            };
            
            const sanitized = logger.sanitizeData(data);
            
            expect(sanitized.username).toBe('user123');
            expect(sanitized.password).toBe('[REDACTED]');
            expect(sanitized.token).toBe('[REDACTED]');
            expect(sanitized.normalField).toBe('normal-value');
        });

        test('should truncate long strings', () => {
            const longString = 'a'.repeat(1500);
            const data = { longField: longString };
            
            const sanitized = logger.sanitizeData(data);
            
            expect(sanitized.longField).toHaveLength(1015); // 1000 + '... [TRUNCATED]'
            expect(sanitized.longField).toEndWith('... [TRUNCATED]');
        });

        test('should handle null and undefined data', () => {
            expect(logger.sanitizeData(null)).toBeNull();
            expect(logger.sanitizeData(undefined)).toBeUndefined();
        });

        test('should handle circular references gracefully', () => {
            const circular = { name: 'test' };
            circular.self = circular;
            
            const sanitized = logger.sanitizeData(circular);
            
            expect(sanitized.name).toBe('test');
            // Should not throw error
        });
    });

    describe('session and user management', () => {
        test('should generate session ID if not exists', () => {
            window.sessionStorage.getItem.mockReturnValue(null);
            
            const sessionId = logger.getSessionId();
            
            expect(sessionId).toMatch(/^sess_\d+_[a-z0-9]+$/);
            expect(window.sessionStorage.setItem).toHaveBeenCalledWith('logSessionId', sessionId);
        });

        test('should reuse existing session ID', () => {
            window.sessionStorage.getItem.mockReturnValue('existing-session-id');
            
            const sessionId = logger.getSessionId();
            
            expect(sessionId).toBe('existing-session-id');
        });

        test('should get user ID from session or local storage', () => {
            window.sessionStorage.getItem.mockReturnValue('session-user-id');
            expect(logger.getUserId()).toBe('session-user-id');
            
            window.sessionStorage.getItem.mockReturnValue(null);
            window.localStorage.getItem.mockReturnValue('local-user-id');
            expect(logger.getUserId()).toBe('local-user-id');
            
            window.localStorage.getItem.mockReturnValue(null);
            expect(logger.getUserId()).toBeNull();
        });
    });

    describe('memory storage', () => {
        test('should store logs in memory', () => {
            logger.error('Error 1');
            logger.warn('Warning 1');
            
            expect(logger.logs).toHaveLength(2);
            expect(logger.logs[0].message).toBe('Error 1');
            expect(logger.logs[1].message).toBe('Warning 1');
        });

        test('should limit memory usage', () => {
            logger.config.maxLogSize = 3;
            
            logger.info('Log 1');
            logger.info('Log 2');
            logger.info('Log 3');
            logger.info('Log 4');
            logger.info('Log 5');
            
            expect(logger.logs).toHaveLength(3);
            expect(logger.logs[0].message).toBe('Log 3');
            expect(logger.logs[2].message).toBe('Log 5');
        });
    });

    describe('remote logging', () => {
        let remoteLogger;

        beforeEach(() => {
            remoteLogger = new Logger({
                enableRemote: true,
                remoteEndpoint: 'https://api.example.com/logs'
            });
            
            fetch.mockResolvedValue({
                ok: true,
                status: 200
            });
        });

        test('should queue logs for remote sending', () => {
            remoteLogger.error('Remote error');
            
            expect(remoteLogger.remoteQueue).toHaveLength(1);
            expect(remoteLogger.remoteQueue[0].message).toBe('Remote error');
        });

        test('should auto-flush on error logs', async () => {
            const flushSpy = jest.spyOn(remoteLogger, 'flushRemoteLogs');
            
            remoteLogger.error('Critical error');
            
            expect(flushSpy).toHaveBeenCalled();
            
            flushSpy.mockRestore();
        });

        test('should send logs to remote endpoint', async () => {
            remoteLogger.remoteQueue.push({
                level: 'error',
                message: 'Test error',
                timestamp: new Date().toISOString()
            });
            
            await remoteLogger.flushRemoteLogs();
            
            expect(fetch).toHaveBeenCalledWith(
                'https://api.example.com/logs',
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: expect.any(String)
                })
            );
        });

        test('should use sendBeacon for synchronous sending', async () => {
            remoteLogger.remoteQueue.push({
                level: 'error',
                message: 'Test error'
            });
            
            await remoteLogger.flushRemoteLogs(true);
            
            expect(navigator.sendBeacon).toHaveBeenCalledWith(
                'https://api.example.com/logs',
                expect.any(String)
            );
        });

        test('should handle remote logging errors gracefully', async () => {
            fetch.mockRejectedValue(new Error('Network error'));
            
            remoteLogger.remoteQueue.push({ level: 'error', message: 'Test' });
            
            await expect(remoteLogger.flushRemoteLogs()).resolves.not.toThrow();
        });
    });

    describe('log filtering and retrieval', () => {
        beforeEach(() => {
            logger.error('Error message');
            logger.warn('Warning message');
            logger.info('Info message');
        });

        test('should get all logs', () => {
            const logs = logger.getLogs();
            
            expect(logs).toHaveLength(3);
        });

        test('should filter logs by level', () => {
            const errorLogs = logger.getLogs({ level: 'error' });
            
            expect(errorLogs).toHaveLength(1);
            expect(errorLogs[0].level).toBe('error');
        });

        test('should filter logs by message content', () => {
            const warningLogs = logger.getLogs({ message: 'warning' });
            
            expect(warningLogs).toHaveLength(1);
            expect(warningLogs[0].message).toBe('Warning message');
        });

        test('should limit number of logs returned', () => {
            const limitedLogs = logger.getLogs({ limit: 2 });
            
            expect(limitedLogs).toHaveLength(2);
        });

        test('should filter logs by timestamp', () => {
            const since = new Date(Date.now() - 1000);
            const recentLogs = logger.getLogs({ since });
            
            expect(recentLogs).toHaveLength(3); // All logs should be recent
        });
    });

    describe('utility methods', () => {
        test('should set log level', () => {
            logger.setLevel('debug');
            
            expect(logger.config.level).toBe('debug');
            expect(logger.currentLevel).toBe(3);
        });

        test('should get current log level', () => {
            expect(logger.getLevel()).toBe('info');
        });

        test('should clear logs', () => {
            logger.error('Test error');
            expect(logger.logs).toHaveLength(1);
            
            logger.clearLogs();
            expect(logger.logs).toHaveLength(0);
        });

        test('should export logs as JSON', () => {
            logger.error('Test error');
            
            const exported = logger.exportLogs();
            const parsed = JSON.parse(exported);
            
            expect(Array.isArray(parsed)).toBe(true);
            expect(parsed[0].message).toBe('Test error');
        });

        test('should create child logger with context', () => {
            const childLogger = logger.child({ component: 'TestComponent' });
            
            childLogger.error('Child error');
            
            expect(consoleSpy.error).toHaveBeenCalledWith(
                expect.any(String),
                'Child error',
                expect.objectContaining({ component: 'TestComponent' })
            );
        });

        test('should update configuration', () => {
            logger.updateConfig({ level: 'debug', maxLogSize: 500 });
            
            expect(logger.config.level).toBe('debug');
            expect(logger.config.maxLogSize).toBe(500);
            expect(logger.currentLevel).toBe(3);
        });
    });

    describe('timestamp formatting', () => {
        test('should format timestamp as ISO by default', () => {
            const timestamp = logger.formatTimestamp(new Date('2024-01-01T12:00:00Z'));
            
            expect(timestamp).toBe('2024-01-01T12:00:00.000Z');
        });

        test('should format timestamp as locale string', () => {
            const localeLogger = new Logger({ timestampFormat: 'locale' });
            const timestamp = localeLogger.formatTimestamp(new Date('2024-01-01T12:00:00Z'));
            
            expect(typeof timestamp).toBe('string');
            expect(timestamp).not.toBe('2024-01-01T12:00:00.000Z');
        });

        test('should format timestamp as unix timestamp', () => {
            const unixLogger = new Logger({ timestampFormat: 'unix' });
            const date = new Date('2024-01-01T12:00:00Z');
            const timestamp = unixLogger.formatTimestamp(date);
            
            expect(timestamp).toBe(date.getTime().toString());
        });
    });
});