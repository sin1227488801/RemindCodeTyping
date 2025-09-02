import NetworkError from '../../../Rct/js/infrastructure/errors/NetworkError.js';
import RctError from '../../../Rct/js/infrastructure/errors/RctError.js';

describe('NetworkError', () => {
    describe('constructor', () => {
        test('should create network error with basic properties', () => {
            const error = new NetworkError('Network failed', 500, '/api/test');
            
            expect(error.message).toBe('Network failed');
            expect(error.code).toBe('SERVER_ERROR_500');
            expect(error.status).toBe(500);
            expect(error.endpoint).toBe('/api/test');
            expect(error.name).toBe('NetworkError');
        });

        test('should handle missing status and endpoint', () => {
            const error = new NetworkError('Network failed');
            
            expect(error.status).toBeNull();
            expect(error.endpoint).toBeNull();
            expect(error.code).toBe('NETWORK_ERROR');
        });

        test('should include additional details', () => {
            const details = { timeout: 5000 };
            const error = new NetworkError('Timeout', 408, '/api/test', details);
            
            expect(error.details.timeout).toBe(5000);
            expect(error.details.status).toBe(408);
            expect(error.details.endpoint).toBe('/api/test');
        });
    });

    describe('getErrorCode', () => {
        test('should return correct codes for different status ranges', () => {
            expect(NetworkError.getErrorCode(400)).toBe('CLIENT_ERROR_400');
            expect(NetworkError.getErrorCode(404)).toBe('CLIENT_ERROR_404');
            expect(NetworkError.getErrorCode(500)).toBe('SERVER_ERROR_500');
            expect(NetworkError.getErrorCode(503)).toBe('SERVER_ERROR_503');
            expect(NetworkError.getErrorCode(null)).toBe('NETWORK_ERROR');
        });
    });

    describe('getUserMessage', () => {
        test('should return appropriate messages for different status codes', () => {
            expect(new NetworkError('', 400).getUserMessage())
                .toBe('リクエストに問題があります。入力内容を確認してください。');
            
            expect(new NetworkError('', 401).getUserMessage())
                .toBe('ログインが必要です。再度ログインしてください。');
            
            expect(new NetworkError('', 404).getUserMessage())
                .toBe('リクエストされたリソースが見つかりません。');
            
            expect(new NetworkError('', 500).getUserMessage())
                .toBe('サーバーエラーが発生しました。しばらく待ってから再度お試しください。');
            
            expect(new NetworkError('', null).getUserMessage())
                .toBe('ネットワークエラーが発生しました。インターネット接続を確認してください。');
        });

        test('should handle unknown status codes', () => {
            expect(new NetworkError('', 418).getUserMessage())
                .toBe('リクエストエラーが発生しました。入力内容を確認してください。');
            
            expect(new NetworkError('', 599).getUserMessage())
                .toBe('サーバーエラーが発生しました。しばらく待ってから再度お試しください。');
        });
    });

    describe('isRetryable', () => {
        test('should return true for retryable errors', () => {
            expect(new NetworkError('', 500).isRetryable()).toBe(true);
            expect(new NetworkError('', 502).isRetryable()).toBe(true);
            expect(new NetworkError('', 408).isRetryable()).toBe(true);
            expect(new NetworkError('', 429).isRetryable()).toBe(true);
            expect(new NetworkError('', null).isRetryable()).toBe(true);
        });

        test('should return false for non-retryable errors', () => {
            expect(new NetworkError('', 400).isRetryable()).toBe(false);
            expect(new NetworkError('', 401).isRetryable()).toBe(false);
            expect(new NetworkError('', 403).isRetryable()).toBe(false);
            expect(new NetworkError('', 404).isRetryable()).toBe(false);
        });
    });

    describe('getSeverity', () => {
        test('should return appropriate severity levels', () => {
            expect(new NetworkError('', 500).getSeverity()).toBe('high');
            expect(new NetworkError('', 401).getSeverity()).toBe('medium');
            expect(new NetworkError('', 403).getSeverity()).toBe('medium');
            expect(new NetworkError('', 400).getSeverity()).toBe('low');
            expect(new NetworkError('', null).getSeverity()).toBe('high');
        });
    });

    describe('getCategory', () => {
        test('should return network category', () => {
            const error = new NetworkError('Test', 500);
            expect(error.getCategory()).toBe('network');
        });
    });

    describe('static factory methods', () => {
        describe('fromFetchError', () => {
            test('should create NetworkError from TypeError', () => {
                const fetchError = new TypeError('Failed to fetch');
                const error = NetworkError.fromFetchError(fetchError, '/api/test');
                
                expect(error.message).toBe('サーバーに接続できません。バックエンドが起動しているか確認してください。');
                expect(error.endpoint).toBe('/api/test');
                expect(error.cause).toBe(fetchError);
            });

            test('should create NetworkError from AbortError', () => {
                const abortError = new Error('The operation was aborted');
                abortError.name = 'AbortError';
                const error = NetworkError.fromFetchError(abortError, '/api/test');
                
                expect(error.message).toBe('リクエストがタイムアウトしました。');
                expect(error.endpoint).toBe('/api/test');
                expect(error.cause).toBe(abortError);
            });

            test('should handle generic fetch errors', () => {
                const fetchError = new Error('Generic error');
                const error = NetworkError.fromFetchError(fetchError, '/api/test');
                
                expect(error.message).toBe('ネットワークエラーが発生しました。');
                expect(error.endpoint).toBe('/api/test');
                expect(error.cause).toBe(fetchError);
            });
        });

        describe('fromHttpResponse', () => {
            test('should create NetworkError from HTTP response', () => {
                const response = {
                    status: 404,
                    statusText: 'Not Found'
                };
                const errorData = { message: 'Resource not found' };
                const error = NetworkError.fromHttpResponse(response, '/api/test', errorData);
                
                expect(error.message).toBe('Resource not found');
                expect(error.status).toBe(404);
                expect(error.endpoint).toBe('/api/test');
                expect(error.details.statusText).toBe('Not Found');
                expect(error.details.errorData).toBe(errorData);
            });

            test('should handle response without error data', () => {
                const response = {
                    status: 500,
                    statusText: 'Internal Server Error'
                };
                const error = NetworkError.fromHttpResponse(response, '/api/test');
                
                expect(error.message).toBe('HTTP error! status: 500');
                expect(error.status).toBe(500);
            });

            test('should prefer error field over message field', () => {
                const response = { status: 400, statusText: 'Bad Request' };
                const errorData = { message: 'Message field', error: 'Error field' };
                const error = NetworkError.fromHttpResponse(response, '/api/test', errorData);
                
                expect(error.message).toBe('Error field');
            });
        });

        describe('timeout', () => {
            test('should create timeout error', () => {
                const error = NetworkError.timeout('/api/test', 5000);
                
                expect(error.message).toBe('リクエストがタイムアウトしました (5000ms)');
                expect(error.status).toBe(408);
                expect(error.endpoint).toBe('/api/test');
                expect(error.details.timeout).toBe(5000);
            });
        });

        describe('connectionError', () => {
            test('should create connection error', () => {
                const error = NetworkError.connectionError('/api/test');
                
                expect(error.message).toBe('サーバーに接続できません');
                expect(error.status).toBeNull();
                expect(error.endpoint).toBe('/api/test');
                expect(error.details.type).toBe('connection');
            });
        });
    });

    describe('inheritance', () => {
        test('should be instance of RctError and Error', () => {
            const error = new NetworkError('Test', 500);
            
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(RctError);
            expect(error).toBeInstanceOf(NetworkError);
        });
    });
});