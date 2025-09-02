/**
 * Logger service for structured logging
 * Provides different log levels and formatting options
 */
class Logger {
    /**
     * Creates a new Logger instance
     * @param {Object} options - Logger configuration
     */
    constructor(options = {}) {
        this.config = {
            level: options.level || 'info',
            enableConsole: options.enableConsole !== false,
            enableRemote: options.enableRemote || false,
            remoteEndpoint: options.remoteEndpoint || null,
            maxLogSize: options.maxLogSize || 1000,
            includeStackTrace: options.includeStackTrace || false,
            timestampFormat: options.timestampFormat || 'iso',
            ...options
        };
        
        // Log levels (higher number = more verbose)
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3,
            trace: 4
        };
        
        // Current log level
        this.currentLevel = this.levels[this.config.level] || this.levels.info;
        
        // In-memory log storage
        this.logs = [];
        
        // Remote logging queue
        this.remoteQueue = [];
        this.isFlushingRemote = false;
        
        this.setupRemoteLogging();
    }

    /**
     * Setup remote logging if enabled
     */
    setupRemoteLogging() {
        if (!this.config.enableRemote || !this.config.remoteEndpoint) {
            return;
        }
        
        // Flush remote logs periodically
        setInterval(() => {
            this.flushRemoteLogs();
        }, 30000); // Every 30 seconds
        
        // Flush on page unload
        window.addEventListener('beforeunload', () => {
            this.flushRemoteLogs(true);
        });
    }

    /**
     * Log error message
     * @param {string} message - Log message
     * @param {*} data - Additional data
     */
    error(message, data = null) {
        this.log('error', message, data);
    }

    /**
     * Log warning message
     * @param {string} message - Log message
     * @param {*} data - Additional data
     */
    warn(message, data = null) {
        this.log('warn', message, data);
    }

    /**
     * Log info message
     * @param {string} message - Log message
     * @param {*} data - Additional data
     */
    info(message, data = null) {
        this.log('info', message, data);
    }

    /**
     * Log debug message
     * @param {string} message - Log message
     * @param {*} data - Additional data
     */
    debug(message, data = null) {
        this.log('debug', message, data);
    }

    /**
     * Log trace message
     * @param {string} message - Log message
     * @param {*} data - Additional data
     */
    trace(message, data = null) {
        this.log('trace', message, data);
    }

    /**
     * Main logging method
     * @param {string} level - Log level
     * @param {string} message - Log message
     * @param {*} data - Additional data
     */
    log(level, message, data = null) {
        const levelValue = this.levels[level];
        
        if (levelValue === undefined || levelValue > this.currentLevel) {
            return;
        }
        
        const logEntry = this.createLogEntry(level, message, data);
        
        // Store in memory
        this.storeLog(logEntry);
        
        // Console logging
        if (this.config.enableConsole) {
            this.logToConsole(logEntry);
        }
        
        // Remote logging
        if (this.config.enableRemote) {
            this.queueForRemote(logEntry);
        }
    }

    /**
     * Create structured log entry
     * @param {string} level - Log level
     * @param {string} message - Log message
     * @param {*} data - Additional data
     * @returns {Object} Log entry
     */
    createLogEntry(level, message, data) {
        const timestamp = this.formatTimestamp(new Date());
        
        const entry = {
            timestamp,
            level,
            message,
            data: this.sanitizeData(data),
            sessionId: this.getSessionId(),
            userId: this.getUserId(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            correlationId: this.generateCorrelationId()
        };
        
        // Add stack trace for errors if enabled
        if (level === 'error' && this.config.includeStackTrace) {
            entry.stackTrace = this.captureStackTrace();
        }
        
        return entry;
    }

    /**
     * Format timestamp according to configuration
     * @param {Date} date - Date to format
     * @returns {string} Formatted timestamp
     */
    formatTimestamp(date) {
        switch (this.config.timestampFormat) {
            case 'iso':
                return date.toISOString();
            case 'locale':
                return date.toLocaleString();
            case 'unix':
                return date.getTime().toString();
            default:
                return date.toISOString();
        }
    }

    /**
     * Sanitize data for logging (remove sensitive information)
     * @param {*} data - Data to sanitize
     * @returns {*} Sanitized data
     */
    sanitizeData(data) {
        if (!data) {
            return data;
        }
        
        try {
            // Convert to JSON and back to create a clean copy
            const jsonString = JSON.stringify(data, (key, value) => {
                // Remove sensitive fields
                const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
                if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
                    return '[REDACTED]';
                }
                
                // Limit string length
                if (typeof value === 'string' && value.length > 1000) {
                    return value.substring(0, 1000) + '... [TRUNCATED]';
                }
                
                return value;
            });
            
            return JSON.parse(jsonString);
        } catch (error) {
            return { error: 'Failed to sanitize data', type: typeof data };
        }
    }

    /**
     * Get session ID for correlation
     * @returns {string} Session ID
     */
    getSessionId() {
        let sessionId = sessionStorage.getItem('logSessionId');
        
        if (!sessionId) {
            sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('logSessionId', sessionId);
        }
        
        return sessionId;
    }

    /**
     * Get user ID if available
     * @returns {string|null} User ID
     */
    getUserId() {
        return sessionStorage.getItem('userId') || localStorage.getItem('userId') || null;
    }

    /**
     * Generate correlation ID for log entry
     * @returns {string} Correlation ID
     */
    generateCorrelationId() {
        return 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Capture stack trace
     * @returns {string} Stack trace
     */
    captureStackTrace() {
        try {
            throw new Error();
        } catch (error) {
            return error.stack || 'Stack trace not available';
        }
    }

    /**
     * Store log entry in memory
     * @param {Object} logEntry - Log entry to store
     */
    storeLog(logEntry) {
        this.logs.push(logEntry);
        
        // Limit memory usage
        if (this.logs.length > this.config.maxLogSize) {
            this.logs = this.logs.slice(-this.config.maxLogSize);
        }
    }

    /**
     * Log to browser console
     * @param {Object} logEntry - Log entry to log
     */
    logToConsole(logEntry) {
        const { level, message, data, timestamp } = logEntry;
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
        
        switch (level) {
            case 'error':
                console.error(prefix, message, data);
                break;
            case 'warn':
                console.warn(prefix, message, data);
                break;
            case 'info':
                console.info(prefix, message, data);
                break;
            case 'debug':
                console.debug(prefix, message, data);
                break;
            case 'trace':
                console.trace(prefix, message, data);
                break;
            default:
                console.log(prefix, message, data);
        }
    }

    /**
     * Queue log entry for remote logging
     * @param {Object} logEntry - Log entry to queue
     */
    queueForRemote(logEntry) {
        this.remoteQueue.push(logEntry);
        
        // Auto-flush on error or when queue is full
        if (logEntry.level === 'error' || this.remoteQueue.length >= 10) {
            this.flushRemoteLogs();
        }
    }

    /**
     * Flush remote logs to server
     * @param {boolean} synchronous - Whether to send synchronously
     */
    async flushRemoteLogs(synchronous = false) {
        if (!this.config.enableRemote || 
            !this.config.remoteEndpoint || 
            this.remoteQueue.length === 0 || 
            this.isFlushingRemote) {
            return;
        }
        
        this.isFlushingRemote = true;
        const logsToSend = [...this.remoteQueue];
        this.remoteQueue = [];
        
        try {
            const payload = {
                logs: logsToSend,
                metadata: {
                    userAgent: navigator.userAgent,
                    url: window.location.href,
                    timestamp: new Date().toISOString()
                }
            };
            
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            };
            
            if (synchronous && navigator.sendBeacon) {
                // Use sendBeacon for synchronous sending (e.g., on page unload)
                navigator.sendBeacon(this.config.remoteEndpoint, options.body);
            } else {
                const response = await fetch(this.config.remoteEndpoint, options);
                
                if (!response.ok) {
                    console.warn('Failed to send logs to remote endpoint:', response.status);
                }
            }
        } catch (error) {
            console.warn('Error sending logs to remote endpoint:', error);
            // Re-queue logs on failure (but limit to prevent infinite growth)
            if (this.remoteQueue.length < 50) {
                this.remoteQueue.unshift(...logsToSend);
            }
        } finally {
            this.isFlushingRemote = false;
        }
    }

    /**
     * Set log level
     * @param {string} level - New log level
     */
    setLevel(level) {
        if (this.levels[level] !== undefined) {
            this.config.level = level;
            this.currentLevel = this.levels[level];
        }
    }

    /**
     * Get current log level
     * @returns {string} Current log level
     */
    getLevel() {
        return this.config.level;
    }

    /**
     * Get logs from memory
     * @param {Object} filters - Filter options
     * @returns {Array} Filtered logs
     */
    getLogs(filters = {}) {
        let logs = [...this.logs];
        
        if (filters.level) {
            logs = logs.filter(log => log.level === filters.level);
        }
        
        if (filters.since) {
            const since = new Date(filters.since);
            logs = logs.filter(log => new Date(log.timestamp) >= since);
        }
        
        if (filters.message) {
            logs = logs.filter(log => 
                log.message.toLowerCase().includes(filters.message.toLowerCase())
            );
        }
        
        if (filters.limit) {
            logs = logs.slice(-filters.limit);
        }
        
        return logs;
    }

    /**
     * Clear logs from memory
     */
    clearLogs() {
        this.logs = [];
    }

    /**
     * Export logs as JSON
     * @param {Object} filters - Filter options
     * @returns {string} JSON string of logs
     */
    exportLogs(filters = {}) {
        const logs = this.getLogs(filters);
        return JSON.stringify(logs, null, 2);
    }

    /**
     * Create child logger with additional context
     * @param {Object} context - Additional context for all logs
     * @returns {Logger} Child logger
     */
    child(context) {
        const childLogger = new Logger(this.config);
        childLogger.logs = this.logs; // Share log storage
        childLogger.remoteQueue = this.remoteQueue; // Share remote queue
        
        // Override log method to include context
        const originalLog = childLogger.log.bind(childLogger);
        childLogger.log = (level, message, data) => {
            const contextualData = data ? { ...context, ...data } : context;
            originalLog(level, message, contextualData);
        };
        
        return childLogger;
    }

    /**
     * Update configuration
     * @param {Object} newConfig - New configuration options
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.currentLevel = this.levels[this.config.level] || this.levels.info;
    }
}

export default Logger;