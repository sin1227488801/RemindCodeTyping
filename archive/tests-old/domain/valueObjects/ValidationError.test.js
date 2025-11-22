/**
 * Unit tests for ValidationError and ValidationResult value objects
 */

// Import the classes
const { ValidationError, ValidationResult } = require('../../../Rct/js/domain/valueObjects/ValidationError.js');

describe('ValidationError Value Object', () => {
    describe('Constructor', () => {
        test('should create a validation error with message only', () => {
            const error = new ValidationError('Test error message');
            
            expect(error.message).toBe('Test error message');
            expect(error.name).toBe('ValidationError');
            expect(error.field).toBeNull();
            expect(error.code).toBeNull();
            expect(error.value).toBeNull();
            expect(error.timestamp).toBeInstanceOf(Date);
        });

        test('should create a validation error with all parameters', () => {
            const error = new ValidationError('Test error', 'username', 'REQUIRED', null);
            
            expect(error.message).toBe('Test error');
            expect(error.field).toBe('username');
            expect(error.code).toBe('REQUIRED');
            expect(error.value).toBeNull();
        });

        test('should inherit from Error', () => {
            const error = new ValidationError('Test error');
            
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(ValidationError);
        });
    });

    describe('Serialization', () => {
        test('toPlainObject should return correct plain object', () => {
            const error = new ValidationError('Test error', 'username', 'REQUIRED', 'invalid_value');
            const plainObject = error.toPlainObject();
            
            expect(plainObject.name).toBe('ValidationError');
            expect(plainObject.message).toBe('Test error');
            expect(plainObject.field).toBe('username');
            expect(plainObject.code).toBe('REQUIRED');
            expect(plainObject.value).toBe('invalid_value');
            expect(plainObject.timestamp).toBe(error.timestamp.toISOString());
            expect(plainObject.stack).toBeTruthy();
        });

        test('fromPlainObject should create error from plain object', () => {
            const data = {
                message: 'Test error',
                field: 'username',
                code: 'REQUIRED',
                value: 'invalid_value',
                timestamp: '2024-01-01T00:00:00.000Z',
                stack: 'Error stack trace'
            };
            
            const error = ValidationError.fromPlainObject(data);
            
            expect(error.message).toBe('Test error');
            expect(error.field).toBe('username');
            expect(error.code).toBe('REQUIRED');
            expect(error.value).toBe('invalid_value');
            expect(error.timestamp).toEqual(new Date('2024-01-01T00:00:00.000Z'));
            expect(error.stack).toBe('Error stack trace');
        });
    });

    describe('Static Factory Methods', () => {
        test('required should create required field error', () => {
            const error = ValidationError.required('username');
            
            expect(error.message).toBe('username is required');
            expect(error.field).toBe('username');
            expect(error.code).toBe('REQUIRED');
            expect(error.value).toBeNull();
        });

        test('invalidType should create type validation error', () => {
            const error = ValidationError.invalidType('age', 'number', 'not_a_number');
            
            expect(error.message).toBe('age must be of type number');
            expect(error.field).toBe('age');
            expect(error.code).toBe('INVALID_TYPE');
            expect(error.value).toBe('not_a_number');
        });

        test('invalidLength should create length validation error with min and max', () => {
            const error = ValidationError.invalidLength('password', 8, 20, 'short');
            
            expect(error.message).toBe('password must be between 8 and 20 characters');
            expect(error.field).toBe('password');
            expect(error.code).toBe('INVALID_LENGTH');
            expect(error.value).toBe('short');
        });

        test('invalidLength should create length validation error with min only', () => {
            const error = ValidationError.invalidLength('password', 8, null, 'short');
            
            expect(error.message).toBe('password must be at least 8 characters');
        });

        test('invalidLength should create length validation error with max only', () => {
            const error = ValidationError.invalidLength('username', null, 20, 'very_long_username');
            
            expect(error.message).toBe('username must be at most 20 characters');
        });

        test('invalidFormat should create format validation error', () => {
            const error = ValidationError.invalidFormat('email', 'user@domain.com', 'invalid_email');
            
            expect(error.message).toBe('email must match the format: user@domain.com');
            expect(error.field).toBe('email');
            expect(error.code).toBe('INVALID_FORMAT');
            expect(error.value).toBe('invalid_email');
        });

        test('outOfRange should create range validation error', () => {
            const error = ValidationError.outOfRange('age', 18, 65, 10);
            
            expect(error.message).toBe('age must be between 18 and 65');
            expect(error.field).toBe('age');
            expect(error.code).toBe('OUT_OF_RANGE');
            expect(error.value).toBe(10);
        });
    });
});

describe('ValidationResult Value Object', () => {
    describe('Constructor', () => {
        test('should create a successful validation result', () => {
            const result = new ValidationResult(true);
            
            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual([]);
            expect(result.timestamp).toBeInstanceOf(Date);
        });

        test('should create a failed validation result with errors', () => {
            const error1 = new ValidationError('Error 1');
            const error2 = new ValidationError('Error 2');
            const result = new ValidationResult(false, [error1, error2]);
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(2);
            expect(result.errors[0]).toBe(error1);
            expect(result.errors[1]).toBe(error2);
        });

        test('should create a copy of errors array', () => {
            const errors = [new ValidationError('Error 1')];
            const result = new ValidationResult(false, errors);
            
            errors.push(new ValidationError('Error 2'));
            expect(result.errors).toHaveLength(1); // Should not be affected by external changes
        });
    });

    describe('Error Access Methods', () => {
        let result;
        let error1, error2, error3;
        
        beforeEach(() => {
            error1 = new ValidationError('Username required', 'username', 'REQUIRED');
            error2 = new ValidationError('Username too short', 'username', 'INVALID_LENGTH');
            error3 = new ValidationError('Email required', 'email', 'REQUIRED');
            result = new ValidationResult(false, [error1, error2, error3]);
        });

        test('getFirstError should return first error', () => {
            expect(result.getFirstError()).toBe(error1);
        });

        test('getFirstError should return null for valid result', () => {
            const validResult = new ValidationResult(true);
            expect(validResult.getFirstError()).toBeNull();
        });

        test('getErrorsForField should return errors for specific field', () => {
            const usernameErrors = result.getErrorsForField('username');
            
            expect(usernameErrors).toHaveLength(2);
            expect(usernameErrors).toContain(error1);
            expect(usernameErrors).toContain(error2);
        });

        test('getErrorsForField should return empty array for non-existent field', () => {
            const nonExistentErrors = result.getErrorsForField('nonexistent');
            
            expect(nonExistentErrors).toEqual([]);
        });

        test('getErrorMessages should return all error messages', () => {
            const messages = result.getErrorMessages();
            
            expect(messages).toEqual([
                'Username required',
                'Username too short',
                'Email required'
            ]);
        });

        test('getErrorMessagesForField should return messages for specific field', () => {
            const usernameMessages = result.getErrorMessagesForField('username');
            
            expect(usernameMessages).toEqual([
                'Username required',
                'Username too short'
            ]);
        });
    });

    describe('Error Manipulation', () => {
        test('addError should add error and set isValid to false', () => {
            const result = new ValidationResult(true);
            const error = new ValidationError('New error');
            
            result.addError(error);
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(error);
        });

        test('addError should throw error for non-ValidationError', () => {
            const result = new ValidationResult(true);
            
            expect(() => result.addError('not an error')).toThrow('Error must be an instance of ValidationError');
            expect(() => result.addError(new Error('regular error'))).toThrow('Error must be an instance of ValidationError');
        });

        test('merge should merge another validation result', () => {
            const result1 = new ValidationResult(true);
            const result2 = new ValidationResult(false, [
                new ValidationError('Error 1'),
                new ValidationError('Error 2')
            ]);
            
            result1.merge(result2);
            
            expect(result1.isValid).toBe(false);
            expect(result1.errors).toHaveLength(2);
        });

        test('merge should keep valid status if both results are valid', () => {
            const result1 = new ValidationResult(true);
            const result2 = new ValidationResult(true);
            
            result1.merge(result2);
            
            expect(result1.isValid).toBe(true);
        });

        test('merge should throw error for non-ValidationResult', () => {
            const result = new ValidationResult(true);
            
            expect(() => result.merge('not a result')).toThrow('Other must be an instance of ValidationResult');
        });
    });

    describe('Serialization', () => {
        test('toPlainObject should return correct plain object', () => {
            const error = new ValidationError('Test error', 'field', 'CODE', 'value');
            const result = new ValidationResult(false, [error]);
            const plainObject = result.toPlainObject();
            
            expect(plainObject.isValid).toBe(false);
            expect(plainObject.errors).toHaveLength(1);
            expect(plainObject.errors[0]).toEqual(error.toPlainObject());
            expect(plainObject.timestamp).toBe(result.timestamp.toISOString());
        });

        test('fromPlainObject should create result from plain object', () => {
            const data = {
                isValid: false,
                errors: [{
                    name: 'ValidationError',
                    message: 'Test error',
                    field: 'field',
                    code: 'CODE',
                    value: 'value',
                    timestamp: '2024-01-01T00:00:00.000Z'
                }],
                timestamp: '2024-01-01T00:00:00.000Z'
            };
            
            const result = ValidationResult.fromPlainObject(data);
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toBeInstanceOf(ValidationError);
            expect(result.timestamp).toEqual(new Date('2024-01-01T00:00:00.000Z'));
        });
    });

    describe('Static Factory Methods', () => {
        test('success should create successful validation result', () => {
            const result = ValidationResult.success();
            
            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual([]);
        });

        test('failure should create failed validation result with single error', () => {
            const error = new ValidationError('Test error');
            const result = ValidationResult.failure(error);
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual([error]);
        });

        test('failure should create failed validation result with multiple errors', () => {
            const errors = [
                new ValidationError('Error 1'),
                new ValidationError('Error 2')
            ];
            const result = ValidationResult.failure(errors);
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual(errors);
        });
    });

    describe('String Representation', () => {
        test('toString should return correct string for valid result', () => {
            const result = new ValidationResult(true);
            
            expect(result.toString()).toBe('ValidationResult(valid)');
        });

        test('toString should return correct string for invalid result', () => {
            const errors = [
                new ValidationError('Error 1'),
                new ValidationError('Error 2')
            ];
            const result = new ValidationResult(false, errors);
            
            expect(result.toString()).toBe('ValidationResult(invalid, 2 errors)');
        });
    });
});