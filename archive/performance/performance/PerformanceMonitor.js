/**
 * Performance monitoring utility for tracking and optimizing frontend performance.
 * Provides metrics collection, analysis, and reporting capabilities.
 */
class PerformanceMonitor {
    constructor(options = {}) {
        this.enabled = options.enabled !== false;
        this.sampleRate = options.sampleRate || 1.0; // 100% sampling by default
        this.maxEntries = options.maxEntries || 1000;
        
        // Performance metrics storage
        this.metrics = {
            pageLoad: [],
            apiCalls: [],
            userInteractions: [],
            resourceLoading: [],
            memoryUsage: [],
            customMetrics: []
        };
        
        // Performance observers
        this.observers = new Map();
        
        // Thresholds for performance alerts
        this.thresholds = {
            pageLoadTime: 3000, // 3 seconds
            apiResponseTime: 1000, // 1 second
            resourceLoadTime: 2000, // 2 seconds
            memoryUsage: 100 * 1024 * 1024, // 100MB
            ...options.thresholds
        };
        
        this.setupPerformanceObservers();
        this.setupMemoryMonitoring();
    }

    /**
     * Setup performance observers for automatic metrics collection
     */
    setupPerformanceObservers() {
        if (!this.enabled || !('PerformanceObserver' in window)) {
            return;
        }

        // Navigation timing observer
        try {
            const navObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordPageLoadMetric(entry);
                }
            });
            navObserver.observe({ entryTypes: ['navigation'] });
            this.observers.set('navigation', navObserver);
        } catch (error) {
            console.warn('Navigation observer not supported:', error);
        }

        // Resource timing observer
        try {
            const resourceObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordResourceMetric(entry);
                }
            });
            resourceObserver.observe({ entryTypes: ['resource'] });
            this.observers.set('resource', resourceObserver);
        } catch (error) {
            console.warn('Resource observer not supported:', error);
        }

        // Measure observer for custom metrics
        try {
            const measureObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordCustomMetric(entry);
                }
            });
            measureObserver.observe({ entryTypes: ['measure'] });
            this.observers.set('measure', measureObserver);
        } catch (error) {
            console.warn('Measure observer not supported:', error);
        }

        // Long task observer for performance issues
        try {
            const longTaskObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordLongTask(entry);
                }
            });
            longTaskObserver.observe({ entryTypes: ['longtask'] });
            this.observers.set('longtask', longTaskObserver);
        } catch (error) {
            console.warn('Long task observer not supported:', error);
        }
    }

    /**
     * Setup memory usage monitoring
     */
    setupMemoryMonitoring() {
        if (!this.enabled || !('memory' in performance)) {
            return;
        }

        // Monitor memory usage every 30 seconds
        setInterval(() => {
            this.recordMemoryUsage();
        }, 30000);
    }

    /**
     * Record page load performance metric
     * @param {PerformanceNavigationTiming} entry - Navigation timing entry
     */
    recordPageLoadMetric(entry) {
        if (!this.shouldSample()) return;

        const metric = {
            timestamp: Date.now(),
            url: entry.name,
            loadTime: entry.loadEventEnd - entry.loadEventStart,
            domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            firstPaint: this.getFirstPaint(),
            firstContentfulPaint: this.getFirstContentfulPaint(),
            largestContentfulPaint: this.getLargestContentfulPaint(),
            cumulativeLayoutShift: this.getCumulativeLayoutShift(),
            firstInputDelay: this.getFirstInputDelay(),
            timeToInteractive: this.getTimeToInteractive(),
            networkTime: entry.responseEnd - entry.requestStart,
            serverTime: entry.responseEnd - entry.responseStart,
            domProcessingTime: entry.domComplete - entry.domLoading
        };

        this.metrics.pageLoad.push(metric);
        this.trimMetrics('pageLoad');

        // Check thresholds
        if (metric.loadTime > this.thresholds.pageLoadTime) {
            this.reportPerformanceIssue('slow_page_load', metric);
        }

        console.log('Page Load Performance:', metric);
    }

    /**
     * Record API call performance metric
     * @param {string} endpoint - API endpoint
     * @param {string} method - HTTP method
     * @param {number} startTime - Request start time
     * @param {number} endTime - Request end time
     * @param {boolean} success - Whether request was successful
     * @param {boolean} fromCache - Whether response came from cache
     */
    recordApiMetric(endpoint, method, startTime, endTime, success = true, fromCache = false) {
        if (!this.enabled || !this.shouldSample()) return;

        const responseTime = endTime - startTime;
        const metric = {
            timestamp: Date.now(),
            endpoint,
            method,
            responseTime,
            success,
            fromCache,
            startTime,
            endTime
        };

        this.metrics.apiCalls.push(metric);
        this.trimMetrics('apiCalls');

        // Check thresholds
        if (!fromCache && responseTime > this.thresholds.apiResponseTime) {
            this.reportPerformanceIssue('slow_api_response', metric);
        }

        console.log('API Performance:', metric);
    }

    /**
     * Record user interaction performance metric
     * @param {string} action - Type of interaction
     * @param {string} target - Target element or component
     * @param {number} duration - Interaction duration
     */
    recordInteractionMetric(action, target, duration) {
        if (!this.enabled || !this.shouldSample()) return;

        const metric = {
            timestamp: Date.now(),
            action,
            target,
            duration
        };

        this.metrics.userInteractions.push(metric);
        this.trimMetrics('userInteractions');

        console.log('Interaction Performance:', metric);
    }

    /**
     * Record resource loading performance metric
     * @param {PerformanceResourceTiming} entry - Resource timing entry
     */
    recordResourceMetric(entry) {
        if (!this.shouldSample()) return;

        const metric = {
            timestamp: Date.now(),
            name: entry.name,
            type: this.getResourceType(entry),
            size: entry.transferSize || entry.encodedBodySize,
            loadTime: entry.responseEnd - entry.startTime,
            networkTime: entry.responseEnd - entry.requestStart,
            cacheHit: entry.transferSize === 0 && entry.encodedBodySize > 0
        };

        this.metrics.resourceLoading.push(metric);
        this.trimMetrics('resourceLoading');

        // Check thresholds
        if (metric.loadTime > this.thresholds.resourceLoadTime) {
            this.reportPerformanceIssue('slow_resource_load', metric);
        }
    }

    /**
     * Record custom performance metric
     * @param {PerformanceMeasure} entry - Performance measure entry
     */
    recordCustomMetric(entry) {
        if (!this.shouldSample()) return;

        const metric = {
            timestamp: Date.now(),
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime
        };

        this.metrics.customMetrics.push(metric);
        this.trimMetrics('customMetrics');

        console.log('Custom Performance Metric:', metric);
    }

    /**
     * Record long task that blocks the main thread
     * @param {PerformanceLongTaskTiming} entry - Long task entry
     */
    recordLongTask(entry) {
        const metric = {
            timestamp: Date.now(),
            duration: entry.duration,
            startTime: entry.startTime,
            attribution: entry.attribution
        };

        console.warn('Long Task Detected:', metric);
        this.reportPerformanceIssue('long_task', metric);
    }

    /**
     * Record memory usage metric
     */
    recordMemoryUsage() {
        if (!('memory' in performance)) return;

        const memory = performance.memory;
        const metric = {
            timestamp: Date.now(),
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit,
            usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        };

        this.metrics.memoryUsage.push(metric);
        this.trimMetrics('memoryUsage');

        // Check thresholds
        if (memory.usedJSHeapSize > this.thresholds.memoryUsage) {
            this.reportPerformanceIssue('high_memory_usage', metric);
        }
    }

    /**
     * Start timing a custom operation
     * @param {string} name - Operation name
     */
    startTiming(name) {
        if (!this.enabled) return;
        performance.mark(`${name}-start`);
    }

    /**
     * End timing a custom operation
     * @param {string} name - Operation name
     */
    endTiming(name) {
        if (!this.enabled) return;
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
    }

    /**
     * Time an async operation
     * @param {string} name - Operation name
     * @param {Function} operation - Async operation to time
     * @returns {Promise<*>} Operation result
     */
    async timeAsync(name, operation) {
        if (!this.enabled) {
            return await operation();
        }

        this.startTiming(name);
        try {
            const result = await operation();
            this.endTiming(name);
            return result;
        } catch (error) {
            this.endTiming(name);
            throw error;
        }
    }

    /**
     * Get performance summary
     * @returns {Object} Performance summary
     */
    getSummary() {
        const summary = {};

        // Page load summary
        if (this.metrics.pageLoad.length > 0) {
            const pageLoads = this.metrics.pageLoad;
            summary.pageLoad = {
                count: pageLoads.length,
                averageLoadTime: this.calculateAverage(pageLoads, 'loadTime'),
                medianLoadTime: this.calculateMedian(pageLoads, 'loadTime'),
                p95LoadTime: this.calculatePercentile(pageLoads, 'loadTime', 95)
            };
        }

        // API calls summary
        if (this.metrics.apiCalls.length > 0) {
            const apiCalls = this.metrics.apiCalls;
            const successfulCalls = apiCalls.filter(call => call.success);
            const cachedCalls = apiCalls.filter(call => call.fromCache);
            
            summary.apiCalls = {
                total: apiCalls.length,
                successful: successfulCalls.length,
                cached: cachedCalls.length,
                cacheHitRate: (cachedCalls.length / apiCalls.length * 100).toFixed(2) + '%',
                averageResponseTime: this.calculateAverage(successfulCalls, 'responseTime'),
                medianResponseTime: this.calculateMedian(successfulCalls, 'responseTime'),
                p95ResponseTime: this.calculatePercentile(successfulCalls, 'responseTime', 95)
            };
        }

        // Memory usage summary
        if (this.metrics.memoryUsage.length > 0) {
            const memoryMetrics = this.metrics.memoryUsage;
            const latest = memoryMetrics[memoryMetrics.length - 1];
            
            summary.memory = {
                current: {
                    used: this.formatBytes(latest.usedJSHeapSize),
                    total: this.formatBytes(latest.totalJSHeapSize),
                    limit: this.formatBytes(latest.jsHeapSizeLimit),
                    usagePercentage: latest.usagePercentage.toFixed(2) + '%'
                },
                peak: {
                    used: this.formatBytes(Math.max(...memoryMetrics.map(m => m.usedJSHeapSize))),
                    usagePercentage: Math.max(...memoryMetrics.map(m => m.usagePercentage)).toFixed(2) + '%'
                }
            };
        }

        return summary;
    }

    /**
     * Get detailed metrics for a specific category
     * @param {string} category - Metrics category
     * @returns {Array} Metrics array
     */
    getMetrics(category) {
        return this.metrics[category] || [];
    }

    /**
     * Clear all metrics
     */
    clearMetrics() {
        Object.keys(this.metrics).forEach(key => {
            this.metrics[key] = [];
        });
    }

    /**
     * Export metrics as JSON
     * @returns {string} JSON string of all metrics
     */
    exportMetrics() {
        return JSON.stringify({
            timestamp: Date.now(),
            summary: this.getSummary(),
            metrics: this.metrics
        }, null, 2);
    }

    // Helper methods

    shouldSample() {
        return Math.random() < this.sampleRate;
    }

    trimMetrics(category) {
        if (this.metrics[category].length > this.maxEntries) {
            this.metrics[category] = this.metrics[category].slice(-this.maxEntries);
        }
    }

    calculateAverage(array, property) {
        if (array.length === 0) return 0;
        const sum = array.reduce((acc, item) => acc + item[property], 0);
        return Math.round(sum / array.length);
    }

    calculateMedian(array, property) {
        if (array.length === 0) return 0;
        const sorted = array.map(item => item[property]).sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0 
            ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
            : sorted[mid];
    }

    calculatePercentile(array, property, percentile) {
        if (array.length === 0) return 0;
        const sorted = array.map(item => item[property]).sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[Math.max(0, index)];
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getResourceType(entry) {
        const name = entry.name.toLowerCase();
        if (name.includes('.js')) return 'script';
        if (name.includes('.css')) return 'stylesheet';
        if (name.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
        if (name.match(/\.(woff|woff2|ttf|otf)$/)) return 'font';
        if (name.includes('/api/')) return 'xhr';
        return 'other';
    }

    getFirstPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const fp = paintEntries.find(entry => entry.name === 'first-paint');
        return fp ? fp.startTime : null;
    }

    getFirstContentfulPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        return fcp ? fcp.startTime : null;
    }

    getLargestContentfulPaint() {
        // This would need to be implemented with PerformanceObserver for 'largest-contentful-paint'
        return null;
    }

    getCumulativeLayoutShift() {
        // This would need to be implemented with PerformanceObserver for 'layout-shift'
        return null;
    }

    getFirstInputDelay() {
        // This would need to be implemented with PerformanceObserver for 'first-input'
        return null;
    }

    getTimeToInteractive() {
        // This is a complex metric that requires custom implementation
        return null;
    }

    reportPerformanceIssue(type, data) {
        console.warn(`Performance Issue - ${type}:`, data);
        
        // In a real application, you might want to send this to an analytics service
        // analytics.track('performance_issue', { type, data });
    }

    /**
     * Cleanup observers and intervals
     */
    destroy() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
    }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor({
    enabled: true,
    sampleRate: 1.0,
    maxEntries: 1000
});

export default performanceMonitor;