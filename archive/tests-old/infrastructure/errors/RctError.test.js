import RctError from '../../../Rct/js/infrastructure/errors/RctError.js';

describe('RctError', () => {
    describe('constructor', () => {
        test('should create error with basic properties', () => {
            const error = new RctError('Test message', 'TEST_CODE');
            
            expect(error.message).toBe('Test message');
            expect(error.code).toBe('TEST_CODE');
            expect(error.name).toBe('RctError');
            expect(error.details).toBeNull();
            expect(error.cause).toBeNull();
            expect(error.timestamp).toBeInstanceOf(Date);
            expect(error.correlationId).toMatch(/^err_\d+_[a-z0-9]+$/);
        });

        test('should create error with details and cause', () => {
            const cause = new Error('Original error');
            const details = { field: 'test', value: 123 };
            const error = new RctError('Test message', 'TEST_CODE', details, cause);
            
            expect(error.details).toEqual(details);
            expect(error.cause).toBe(cause);
        });

        test('should maintain proper stack trace', () => {
            const error = new RctError('Test message', 'TEST_CODE');
            
            expect(error.stack).toBeDefined();
            expect(error.stack).toContain('RctError');
        });
    });

    describe('generateCorrelationId', () => {
        test('should generate unique correlation IDs', () => {
            const error1 = new RctError('Message 1', 'CODE_1');
            const error2 = new RctError('Message 2', 'CODE_2');
            
            expect(error1.correlationId).not.toBe(error2.correlationId);
            expect(error1.correlationId).toMatch(/^err_\d+_[a-z0-9]+$/);
            expect(error2.correlationId).toMatch(/^err_\d+_[a-z0-9]+$/);
        });
    });

    describe('getUserMessage', () => {
        test('should return the error message by default', () => {
            const error = new RctError('Test message', 'TEST_CODE');
            
            expect(error.getUserMessage()).toBe('Test message');
        });
    });

    describe('getTechnicalDetails', () => {
        test('should return comprehensive technical details', () => {
            const cause = new Error('Original error');
            const details = { field: 'test' };
            const error = new RctError('Test message', 'TEST_CODE', details, cause);
            
            const technicalDetails = error.getTechnicalDetails();
            
            expect(technicalDetails).toEqual({
                name: 'RctError',
                message: 'Test message',
                code: 'TEST_CODE',
                details: { field: 'test' },
                timestamp: error.timestamp.toISOString(),
                correlationId: error.correlationId,
                stack: error.stack,
                cause: {
                    name: 'Error',
                    message: 'Original error',
                    stack: cause.stack
                }
            });
        });

        test('should handle missing cause', () => {
            const error = new RctError('Test message', 'TEST_CODE');
            const technicalDetails = error.getTechnicalDetails();
            
            expect(technicalDetails.cause).toBeNull();
        });
    });

    describe('toPlainObject', () => {
        test('should convert error to plain object', () => {
            const details = { field: 'test' };
            const error = new RctError('Test message', 'TEST_CODE', details);
            
            const plainObject = error.toPlainObject();
            
            expect(plainObject).toEqual({
                name: 'RctError',
                message: 'Test message',
                code: 'TEST_CODE',
                details: { field: 'test' },
                timestamp: error.timestamp.toISOString(),
                correlationId: error.correlationId,
                stack: error.stack
            });
        });
    });

    describe('fromPlainObject', () => {
        test('should create error from plain object', () => {
            const data = {
                message: 'Test message',
                code: 'TEST_CODE',
                details: { field: 'test' },
                timestamp: '2024-01-01T00:00:00.000Z',
                correlationId: 'err_123_abc',
                stack: 'Error stack trace'
            };
            
            const error = RctError.fromPlainObject(data);
            
            expect(error.message).toBe('Test message');
            expect(error.code).toBe('TEST_CODE');
            expect(error.details).toEqual({ field: 'test' });
            expect(error.timestamp).toEqual(new Date('2024-01-01T00:00:00.000Z'));
            expect(error.correlationId).toBe('err_123_abc');
            expect(error.stack).toBe('Error stack trace');
        });

        test('should handle missing optional fields', () => {
            const data = {
                message: 'Test message',
                code: 'TEST_CODE'
            };
            
            const error = RctError.fromPlainObject(data);
            
            expect(error.message).toBe('Test message');
            expect(error.code).toBe('TEST_CODE');
            expect(error.details).toBeNull();
        });
    });

    describe('isRetryable', () => {
        test('should return false by default', () => {
            const error = new RctError('Test message', 'TEST_CODE');
            
            expect(error.isRetryable()).toBe(false);
        });
    });

    describe('getSeverity', () => {
        test('should return medium by default', () => {
            const error = new RctError('Test message', 'TEST_CODE');
            
            expect(error.getSeverity()).toBe('medium');
        });
    });

    describe('getCategory', () => {
        test('should return general by default', () => {
            const error = new RctError('Test message', 'TEST_CODE');
            
            expect(error.getCategory()).toBe('general');
        });
    });

    describe('toString', () => {
        test('should return formatted string representation', () => {
            const error = new RctError('Test message', 'TEST_CODE');
            
            expect(error.toString()).toBe('RctError: Test message (TEST_CODE)');
        });
    });

    describe('inheritance', () => {
        test('should be instance of Error', () => {
            const error = new RctError('Test message', 'TEST_CODE');
            
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(RctError);
        });

        test('should work with instanceof checks', () => {
            const error = new RctError('Test message', 'TEST_CODE');
            
            expect(error instanceof Error).toBe(true);
            expect(error instanceof RctError).toBe(true);
        });
    });
});