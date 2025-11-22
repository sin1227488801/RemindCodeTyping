import ApiClient from '../../../Rct/js/infrastructure/http/ApiClient.js';

// Mock fetch globally
global.fetch = jest.fn();

describe('ApiClient', () => {
    let apiClient;
    
    beforeEach(() => {
        apiClient = new ApiClient('http://localhost:8080/api');
        fetch.mockClear();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        test('should initialize with default values', () => {
            const client = new ApiClient();
            expect(client.baseUrl).toBe('http://localhost:8080/api');
            expect(client.defaultTimeout).toBe(10000);
            expect(client.maxRetries).toBe(2);
        });

        test('should initialize with custom options', () => {
            const client = new ApiClient('http://example.com/api', {
                timeout: 5000,
                maxRetries: 3,
                retryDelay: 2000
            });
            
            expect(client.baseUrl).toBe('http://example.com/api');
            expect(client.defaultTimeout).toBe(5000);
            expect(client.maxRetries).toBe(3);
            expect(client.retryDelay).toBe(2000);
        });
    });

    describe('interceptors', () => {
        test('should add and apply request interceptors', async () => {
            const interceptor = jest.fn((config) => {
                config.headers['X-Custom'] = 'test';
                return config;
            });
            
            apiClient.addRequestInterceptor(interceptor);
            
            fetch.mockResolvedValueOnce({
                ok: true,
                headers: new Map([['content-type', 'application/json']]),
                json: () => Promise.resolve({ success: true })
            });
            
            await apiClient.get('/test');
            
            expect(interceptor).toHaveBeenCalled();
            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:8080/api/test',
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'X-Custom': 'test'
                    })
                })
            );
        });

        test('should add and apply response interceptors', async () => {
            const onSuccess = jest.fn((response) => response);
            const onError = jest.fn();
            
            apiClient.addResponseInterceptor(onSuccess, onError);
            
            fetch.mockResolvedValueOnce({
                ok: true,
                headers: new Map([['content-type', 'application/json']]),
                json: () => Promise.resolve({ success: true })
            });
            
            const result = await apiClient.get('/test');
            
            expect(onSuccess).toHaveBeenCalledWith({ success: true });
            expect(onError).not.toHaveBeenCalled();
            expect(result).toEqual({ success: true });
        });

        test('should apply error interceptors on failure', async () => {
            const errorInterceptor = jest.fn((error) => {
                error.handled = true;
                return error;
            });
            
            apiClient.addErrorInterceptor(errorInterceptor);
            
            fetch.mockRejectedValueOnce(new Error('Network error'));
            
            try {
                await apiClient.get('/test');
            } catch (error) {
                expect(errorInterceptor).toHaveBeenCalled();
                expect(error.handled).toBe(true);
            }
        });
    });

    describe('authentication', () => {
        test('should set and use auth token', async () => {
            apiClient.setAuthToken('test-token');
            
            fetch.mockResolvedValueOnce({
                ok: true,
                headers: new Map([['content-type', 'application/json']]),
                json: () => Promise.resolve({ success: true })
            });
            
            await apiClient.get('/test');
            
            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:8080/api/test',
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer test-token'
                    })
                })
            );
        });

        test('should handle token refresh on 401 error', async () => {
            const refreshCallback = jest.fn().mockResolvedValue('new-token');
            apiClient.setTokenRefreshCallback(refreshCallback);
            
            // First call returns 401
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                headers: new Map(),
                json: () => Promise.resolve({ error: 'Unauthorized' })
            });
            
            // Second call (after refresh) succeeds
            fetch.mockResolvedValueOnce({
                ok: true,
                headers: new Map([['content-type', 'application/json']]),
                json: () => Promise.resolve({ success: true })
            });
            
            const result = await apiClient.get('/test');
            
            expect(refreshCallback).toHaveBeenCalled();
            expect(result).toEqual({ success: true });
        });
    });

    describe('request methods', () => {
        beforeEach(() => {
            fetch.mockResolvedValue({
                ok: true,
                headers: new Map([['content-type', 'application/json']]),
                json: () => Promise.resolve({ success: true })
            });
        });

        test('should make GET request', async () => {
            await apiClient.get('/test');
            
            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:8080/api/test',
                expect.objectContaining({
                    method: 'GET'
                })
            );
        });

        test('should make POST request with data', async () => {
            const data = { name: 'test' };
            await apiClient.post('/test', data);
            
            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:8080/api/test',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(data)
                })
            );
        });

        test('should make PUT request with data', async () => {
            const data = { id: 1, name: 'updated' };
            await apiClient.put('/test/1', data);
            
            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:8080/api/test/1',
                expect.objectContaining({
                    method: 'PUT',
                    body: JSON.stringify(data)
                })
            );
        });

        test('should make DELETE request', async () => {
            await apiClient.delete('/test/1');
            
            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:8080/api/test/1',
                expect.objectContaining({
                    method: 'DELETE'
                })
            );
        });

        test('should make PATCH request with data', async () => {
            const data = { name: 'patched' };
            await apiClient.patch('/test/1', data);
            
            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:8080/api/test/1',
                expect.objectContaining({
                    method: 'PATCH',
                    body: JSON.stringify(data)
                })
            );
        });
    });

    describe('error handling', () => {
        test('should handle HTTP error responses', async () => {
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                headers: new Map([['content-type', 'application/json']]),
                json: () => Promise.resolve({ error: 'Invalid data' })
            });
            
            try {
                await apiClient.get('/test');
                fail('Should have thrown an error');
            } catch (error) {
                expect(error.status).toBe(400);
                expect(error.message).toBe('Invalid data');
                expect(error.isHttpError).toBe(true);
            }
        });

        test('should handle network errors', async () => {
            fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
            
            try {
                await apiClient.get('/test');
                fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).toContain('ネットワークエラー');
                expect(error.isNetworkError).toBe(true);
            }
        });

        test('should handle timeout errors', async () => {
            const abortError = new Error('The operation was aborted');
            abortError.name = 'AbortError';
            fetch.mockRejectedValueOnce(abortError);
            
            try {
                await apiClient.get('/test');
                fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).toContain('タイムアウト');
                expect(error.isTimeoutError).toBe(true);
            }
        });
    });

    describe('retry logic', () => {
        test('should retry on retryable errors', async () => {
            // First two calls fail with 500 error
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                headers: new Map(),
                json: () => Promise.resolve({ error: 'Server error' })
            });
            
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                headers: new Map(),
                json: () => Promise.resolve({ error: 'Server error' })
            });
            
            // Third call succeeds
            fetch.mockResolvedValueOnce({
                ok: true,
                headers: new Map([['content-type', 'application/json']]),
                json: () => Promise.resolve({ success: true })
            });
            
            const result = await apiClient.get('/test');
            
            expect(fetch).toHaveBeenCalledTimes(3);
            expect(result).toEqual({ success: true });
        });

        test('should not retry on non-retryable errors', async () => {
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                headers: new Map(),
                json: () => Promise.resolve({ error: 'Bad request' })
            });
            
            try {
                await apiClient.get('/test');
                fail('Should have thrown an error');
            } catch (error) {
                expect(fetch).toHaveBeenCalledTimes(1);
                expect(error.status).toBe(400);
            }
        });

        test('should retry on 429 (Too Many Requests)', async () => {
            // First call fails with 429
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 429,
                headers: new Map(),
                json: () => Promise.resolve({ error: 'Too many requests' })
            });
            
            // Second call succeeds
            fetch.mockResolvedValueOnce({
                ok: true,
                headers: new Map([['content-type', 'application/json']]),
                json: () => Promise.resolve({ success: true })
            });
            
            const result = await apiClient.get('/test');
            
            expect(fetch).toHaveBeenCalledTimes(2);
            expect(result).toEqual({ success: true });
        });
    });

    describe('response handling', () => {
        test('should handle JSON responses', async () => {
            const responseData = { id: 1, name: 'test' };
            
            fetch.mockResolvedValueOnce({
                ok: true,
                headers: new Map([['content-type', 'application/json']]),
                json: () => Promise.resolve(responseData)
            });
            
            const result = await apiClient.get('/test');
            expect(result).toEqual(responseData);
        });

        test('should handle non-JSON responses', async () => {
            const mockResponse = {
                ok: true,
                headers: new Map([['content-type', 'text/plain']]),
                text: () => Promise.resolve('Plain text response')
            };
            
            fetch.mockResolvedValueOnce(mockResponse);
            
            const result = await apiClient.get('/test');
            expect(result).toBe(mockResponse);
        });
    });

    describe('request configuration', () => {
        test('should build proper request configuration', () => {
            const config = apiClient.buildRequestConfig('/test', {
                method: 'POST',
                headers: { 'X-Custom': 'value' },
                body: JSON.stringify({ data: 'test' })
            });
            
            expect(config).toMatchObject({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Custom': 'value'
                },
                body: JSON.stringify({ data: 'test' }),
                endpoint: '/test'
            });
        });

        test('should apply default headers', () => {
            const config = apiClient.buildRequestConfig('/test');
            
            expect(config.headers).toMatchObject({
                'Content-Type': 'application/json'
            });
        });
    });
});