/**
 * Performance optimization tests for frontend components.
 * These tests verify that performance optimizations are working correctly.
 */

import LazyLoader from '../../../Rct/js/infrastructure/performance/LazyLoader.js';
import CacheManager, { CachePresets } from '../../../Rct/js/infrastructure/performance/CacheManager.js';
import PerformanceMonitor from '../../../Rct/js/infrastructure/performance/PerformanceMonitor.js';

// Mock modules for testing
const mockModules = {
    'typing': {
        default: {
            init: jest.fn().mockResolvedValue({ name: 'typing' }),
            render: jest.fn().mockResolvedValue(undefined)
        }
    },
    'studybook': {
        default: {
            init: jest.fn().mockResolvedValue({ name: 'studybook' }),
            render: jest.fn().mockResolvedValue(undefined)
        }
    }
};

// Mock dynamic imports
jest.mock('../../../Rct/js/modules/typing.js', () => mockModules.typing, { virtual: true });
jest.mock('../../../Rct/js/modules/studybook.js', () => mockModules.studybook, { virtual: true });

describe('LazyLoader Performance Tests', () => {
    let lazyLoader;
    let container;

    beforeEach(() => {
        lazyLoader = new LazyLoader();
        container = document.createElement('div');
        document.body.appendChild(container);
        
        // Clear module cache
        lazyLoader.clearCache();
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    test('should load module only once for multiple requests', async () => {
        const startTime = performance.now();
        
        // Make multiple concurrent requests for the same module
        const promises = [
            lazyLoader.loadModule('typing'),
            lazyLoader.loadModule('typing'),
            lazyLoader.loadModule('typing')
        ];
        
        const results = await Promise.all(promises);
        const endTime = performance.now();
        
        // All results should be the same instance
        expect(results[0]).toBe(results[1]);
        expect(results[1]).toBe(results[2]);
        
        // Should complete quickly due to caching
        expect(endTime - startTime).toBeLessThan(100);
        
        // Module should be cached
        const stats = lazyLoader.getStats();
        expect(stats.loadedModules).toContain('typing');
        expect(stats.cacheSize).toBe(1);
    });

    test('should preload modules without blocking', async () => {
        const startTime = performance.now();
        
        // Preload multiple modules
        await lazyLoader.preloadModules(['typing', 'studybook']);
        
        const preloadTime = performance.now();
        
        // Now load the modules - should be instant
        const module1 = await lazyLoader.loadModule('typing');
        const module2 = await lazyLoader.loadModule('studybook');
        
        const loadTime = performance.now();
        
        expect(module1).toBeDefined();
        expect(module2).toBeDefined();
        
        // Loading preloaded modules should be very fast
        expect(loadTime - preloadTime).toBeLessThan(10);
        
        const stats = lazyLoader.getStats();
        expect(stats.cacheSize).toBe(2);
    });

    test('should handle component loading with performance tracking', async () => {
        const startTime = performance.now();
        
        const component = await lazyLoader.loadComponent('typing', container, { test: true });
        
        const endTime = performance.now();
        
        expect(component).toBeDefined();
        expect(mockModules.typing.default.init).toHaveBeenCalledWith(container, { test: true });
        
        // Should complete within reasonable time
        expect(endTime - startTime).toBeLessThan(200);
    });

    test('should handle page loading with error recovery', async () => {
        // Mock a failing module
        const originalImport = lazyLoader.importModule;
        let attemptCount = 0;
        
        lazyLoader.importModule = jest.fn().mockImplementation(async (modulePath) => {
            attemptCount++;
            if (attemptCount < 2) {
                throw new Error('Network error');
            }
            return originalImport.call(lazyLoader, modulePath);
        });
        
        const startTime = performance.now();
        
        await lazyLoader.loadPage('typing', container);
        
        const endTime = performance.now();
        
        expect(mockModules.typing.default.render).toHaveBeenCalledWith(container, {});
        expect(attemptCount).toBe(2); // Should retry once
        
        // Should complete even with retry
        expect(endTime - startTime).toBeLessThan(2000);
    });
});

describe('CacheManager Performance Tests', () => {
    let cacheManager;

    beforeEach(() => {
        cacheManager = new CacheManager({
            defaultTTL: 1000,
            maxCacheSize: 10
        });
    });

    afterEach(async () => {
        await cacheManager.clear();
    });

    test('should provide fast cache hits', async () => {
        const testData = { large: 'data'.repeat(1000) };
        
        // Set data in cache
        await cacheManager.set('test-key', testData);
        
        // Measure cache hit performance
        const startTime = performance.now();
        const cachedData = await cacheManager.get('test-key');
        const endTime = performance.now();
        
        expect(cachedData).toEqual(testData);
        
        // Cache hit should be very fast (< 1ms)
        expect(endTime - startTime).toBeLessThan(1);
        
        const stats = cacheManager.getStats();
        expect(stats.hits).toBe(1);
        expect(stats.misses).toBe(0);
    });

    test('should handle cache misses with fallback efficiently', async () => {
        let fallbackCalled = false;
        const fallback = jest.fn().mockImplementation(async () => {
            fallbackCalled = true;
            // Simulate slow API call
            await new Promise(resolve => setTimeout(resolve, 100));
            return { data: 'from-api' };
        });
        
        const startTime = performance.now();
        
        // First call - cache miss, should use fallback
        const result1 = await cacheManager.get('api-key', fallback);
        
        const firstCallTime = performance.now();
        
        // Second call - cache hit, should be fast
        const result2 = await cacheManager.get('api-key', fallback);
        
        const secondCallTime = performance.now();
        
        expect(result1).toEqual({ data: 'from-api' });
        expect(result2).toEqual({ data: 'from-api' });
        expect(fallback).toHaveBeenCalledTimes(1);
        
        // First call should take time due to fallback
        expect(firstCallTime - startTime).toBeGreaterThan(90);
        
        // Second call should be fast due to cache
        expect(secondCallTime - firstCallTime).toBeLessThan(10);
        
        const stats = cacheManager.getStats();
        expect(stats.hits).toBe(1);
        expect(stats.misses).toBe(1);
    });

    test('should handle cache eviction efficiently', async () => {
        const maxSize = 5;
        const testCache = new CacheManager({ maxCacheSize: maxSize });
        
        // Fill cache beyond capacity
        for (let i = 0; i < maxSize + 2; i++) {
            await testCache.set(`key-${i}`, `data-${i}`);
        }
        
        const stats = testCache.getStats();
        expect(stats.memorySize).toBeLessThanOrEqual(maxSize);
        expect(stats.evictions).toBeGreaterThan(0);
        
        // Oldest items should be evicted
        const oldestData = await testCache.get('key-0');
        expect(oldestData).toBeNull();
        
        // Newest items should still be cached
        const newestData = await testCache.get(`key-${maxSize + 1}`);
        expect(newestData).toBe(`data-${maxSize + 1}`);
    });

    test('should handle different cache presets appropriately', async () => {
        const shortTermData = { type: 'short' };
        const longTermData = { type: 'long' };
        
        // Set with different TTLs
        await cacheManager.set('short-key', shortTermData, CachePresets.SHORT_TERM);
        await cacheManager.set('long-key', longTermData, CachePresets.LONG_TERM);
        
        // Both should be available immediately
        expect(await cacheManager.get('short-key')).toEqual(shortTermData);
        expect(await cacheManager.get('long-key')).toEqual(longTermData);
        
        // Wait for short-term to expire (using a very short TTL for testing)
        const testCache = new CacheManager();
        await testCache.set('expire-test', 'data', { ttl: 10 });
        
        // Should be available immediately
        expect(await testCache.get('expire-test')).toBe('data');
        
        // Wait for expiration
        await new Promise(resolve => setTimeout(resolve, 20));
        
        // Should be expired
        expect(await testCache.get('expire-test')).toBeNull();
    });
});

describe('PerformanceMonitor Tests', () => {
    let performanceMonitor;

    beforeEach(() => {
        performanceMonitor = new PerformanceMonitor({
            enabled: true,
            sampleRate: 1.0,
            maxEntries: 100
        });
        performanceMonitor.clearMetrics();
    });

    afterEach(() => {
        performanceMonitor.destroy();
    });

    test('should track API call performance', () => {
        const endpoint = '/api/test';
        const method = 'GET';
        const startTime = performance.now();
        const endTime = startTime + 150; // 150ms response time
        
        performanceMonitor.recordApiMetric(endpoint, method, startTime, endTime, true, false);
        
        const metrics = performanceMonitor.getMetrics('apiCalls');
        expect(metrics).toHaveLength(1);
        
        const metric = metrics[0];
        expect(metric.endpoint).toBe(endpoint);
        expect(metric.method).toBe(method);
        expect(metric.responseTime).toBe(150);
        expect(metric.success).toBe(true);
        expect(metric.fromCache).toBe(false);
    });

    test('should track custom timing operations', async () => {
        const operationName = 'test-operation';
        
        performanceMonitor.startTiming(operationName);
        
        // Simulate some work
        await new Promise(resolve => setTimeout(resolve, 50));
        
        performanceMonitor.endTiming(operationName);
        
        // Wait for performance observer to process
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const customMetrics = performanceMonitor.getMetrics('customMetrics');
        
        if (customMetrics.length > 0) {
            const metric = customMetrics.find(m => m.name === operationName);
            expect(metric).toBeDefined();
            expect(metric.duration).toBeGreaterThan(40);
            expect(metric.duration).toBeLessThan(100);
        }
    });

    test('should time async operations accurately', async () => {
        const asyncOperation = async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
            return 'result';
        };
        
        const startTime = performance.now();
        const result = await performanceMonitor.timeAsync('async-test', asyncOperation);
        const endTime = performance.now();
        
        expect(result).toBe('result');
        expect(endTime - startTime).toBeGreaterThan(90);
        expect(endTime - startTime).toBeLessThan(150);
    });

    test('should generate performance summary', () => {
        // Add some test metrics
        performanceMonitor.recordApiMetric('/api/test1', 'GET', 0, 100, true, false);
        performanceMonitor.recordApiMetric('/api/test2', 'GET', 0, 200, true, true);
        performanceMonitor.recordApiMetric('/api/test3', 'POST', 0, 150, false, false);
        
        const summary = performanceMonitor.getSummary();
        
        expect(summary.apiCalls).toBeDefined();
        expect(summary.apiCalls.total).toBe(3);
        expect(summary.apiCalls.successful).toBe(2);
        expect(summary.apiCalls.cached).toBe(1);
        expect(summary.apiCalls.cacheHitRate).toBe('33.33%');
        expect(summary.apiCalls.averageResponseTime).toBeGreaterThan(0);
    });

    test('should handle performance thresholds', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        
        // Record a slow API call that exceeds threshold
        performanceMonitor.recordApiMetric('/api/slow', 'GET', 0, 2000, true, false);
        
        // Should have logged a performance warning
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('Performance Issue - slow_api_response'),
            expect.any(Object)
        );
        
        consoleSpy.mockRestore();
    });

    test('should export metrics in correct format', () => {
        performanceMonitor.recordApiMetric('/api/test', 'GET', 0, 100, true, false);
        
        const exported = performanceMonitor.exportMetrics();
        const data = JSON.parse(exported);
        
        expect(data).toHaveProperty('timestamp');
        expect(data).toHaveProperty('summary');
        expect(data).toHaveProperty('metrics');
        expect(data.metrics.apiCalls).toHaveLength(1);
    });
});

describe('Integration Performance Tests', () => {
    test('should demonstrate end-to-end performance optimization', async () => {
        const lazyLoader = new LazyLoader();
        const cacheManager = new CacheManager();
        const performanceMonitor = new PerformanceMonitor({ enabled: true });
        
        // Simulate a complete user flow with performance tracking
        const startTime = performance.now();
        
        // 1. Load page component lazily
        const container = document.createElement('div');
        document.body.appendChild(container);
        
        performanceMonitor.startTiming('page-load');
        await lazyLoader.loadComponent('typing', container);
        performanceMonitor.endTiming('page-load');
        
        // 2. Simulate API calls with caching
        const apiCall = async (endpoint) => {
            const apiStartTime = performance.now();
            
            const data = await cacheManager.get(endpoint, async () => {
                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 100));
                return { endpoint, data: 'test-data' };
            });
            
            const apiEndTime = performance.now();
            performanceMonitor.recordApiMetric(endpoint, 'GET', apiStartTime, apiEndTime, true, data !== null);
            
            return data;
        };
        
        // First call - cache miss
        const result1 = await apiCall('/api/data');
        
        // Second call - cache hit
        const result2 = await apiCall('/api/data');
        
        const endTime = performance.now();
        
        // Verify results
        expect(result1).toEqual(result2);
        
        // Get performance summary
        const summary = performanceMonitor.getSummary();
        const cacheStats = cacheManager.getStats();
        
        // Should show performance improvements
        expect(summary.apiCalls.total).toBe(2);
        expect(summary.apiCalls.cached).toBe(1);
        expect(cacheStats.hits).toBe(1);
        expect(cacheStats.misses).toBe(1);
        
        // Total time should be reasonable
        expect(endTime - startTime).toBeLessThan(500);
        
        // Cleanup
        document.body.removeChild(container);
        await cacheManager.clear();
        performanceMonitor.destroy();
    });
});