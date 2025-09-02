/**
 * Cache manager for API responses and application data.
 * Provides multiple caching strategies with TTL and storage options.
 */
class CacheManager {
    constructor(options = {}) {
        this.defaultTTL = options.defaultTTL || 5 * 60 * 1000; // 5 minutes
        this.maxCacheSize = options.maxCacheSize || 100;
        this.storagePrefix = options.storagePrefix || 'rct_cache_';
        
        // In-memory cache
        this.memoryCache = new Map();
        this.cacheMetadata = new Map();
        
        // Cache statistics
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            evictions: 0
        };
        
        this.setupPeriodicCleanup();
    }

    /**
     * Get item from cache with fallback strategy
     * @param {string} key - Cache key
     * @param {Function} fallback - Function to call if cache miss
     * @param {Object} options - Cache options
     * @returns {Promise<*>} Cached or fresh data
     */
    async get(key, fallback = null, options = {}) {
        const cacheKey = this.buildKey(key);
        
        // Try memory cache first
        const memoryResult = this.getFromMemory(cacheKey);
        if (memoryResult !== null) {
            this.stats.hits++;
            return memoryResult;
        }
        
        // Try persistent storage
        const storageResult = await this.getFromStorage(cacheKey);
        if (storageResult !== null) {
            // Promote to memory cache
            this.setInMemory(cacheKey, storageResult, options);
            this.stats.hits++;
            return storageResult;
        }
        
        // Cache miss - use fallback if provided
        this.stats.misses++;
        if (fallback && typeof fallback === 'function') {
            try {
                const freshData = await fallback();
                await this.set(key, freshData, options);
                return freshData;
            } catch (error) {
                console.error('Cache fallback failed:', error);
                throw error;
            }
        }
        
        return null;
    }

    /**
     * Set item in cache
     * @param {string} key - Cache key
     * @param {*} value - Value to cache
     * @param {Object} options - Cache options
     * @returns {Promise<void>}
     */
    async set(key, value, options = {}) {
        const cacheKey = this.buildKey(key);
        const ttl = options.ttl || this.defaultTTL;
        const persistToStorage = options.persist !== false;
        
        // Set in memory cache
        this.setInMemory(cacheKey, value, { ttl });
        
        // Set in persistent storage if enabled
        if (persistToStorage && this.isStorageAvailable()) {
            await this.setInStorage(cacheKey, value, { ttl });
        }
        
        this.stats.sets++;
    }

    /**
     * Remove item from cache
     * @param {string} key - Cache key
     * @returns {Promise<boolean>} True if item was removed
     */
    async remove(key) {
        const cacheKey = this.buildKey(key);
        
        // Remove from memory
        const memoryRemoved = this.memoryCache.delete(cacheKey);
        this.cacheMetadata.delete(cacheKey);
        
        // Remove from storage
        const storageRemoved = await this.removeFromStorage(cacheKey);
        
        return memoryRemoved || storageRemoved;
    }

    /**
     * Clear all cache
     * @returns {Promise<void>}
     */
    async clear() {
        // Clear memory cache
        this.memoryCache.clear();
        this.cacheMetadata.clear();
        
        // Clear storage cache
        if (this.isStorageAvailable()) {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.storagePrefix)) {
                    localStorage.removeItem(key);
                }
            });
        }
        
        // Reset stats
        this.stats = { hits: 0, misses: 0, sets: 0, evictions: 0 };
    }

    /**
     * Get item from memory cache
     * @param {string} key - Cache key
     * @returns {*} Cached value or null
     */
    getFromMemory(key) {
        if (!this.memoryCache.has(key)) {
            return null;
        }
        
        const metadata = this.cacheMetadata.get(key);
        if (metadata && this.isExpired(metadata)) {
            this.memoryCache.delete(key);
            this.cacheMetadata.delete(key);
            return null;
        }
        
        // Update access time for LRU
        if (metadata) {
            metadata.lastAccessed = Date.now();
        }
        
        return this.memoryCache.get(key);
    }

    /**
     * Set item in memory cache
     * @param {string} key - Cache key
     * @param {*} value - Value to cache
     * @param {Object} options - Cache options
     */
    setInMemory(key, value, options = {}) {
        // Check cache size and evict if necessary
        if (this.memoryCache.size >= this.maxCacheSize) {
            this.evictLRU();
        }
        
        const ttl = options.ttl || this.defaultTTL;
        const now = Date.now();
        
        this.memoryCache.set(key, value);
        this.cacheMetadata.set(key, {
            createdAt: now,
            lastAccessed: now,
            expiresAt: now + ttl,
            ttl: ttl
        });
    }

    /**
     * Get item from persistent storage
     * @param {string} key - Cache key
     * @returns {Promise<*>} Cached value or null
     */
    async getFromStorage(key) {
        if (!this.isStorageAvailable()) {
            return null;
        }
        
        try {
            const storageKey = this.storagePrefix + key;
            const cached = localStorage.getItem(storageKey);
            
            if (!cached) {
                return null;
            }
            
            const { value, metadata } = JSON.parse(cached);
            
            if (this.isExpired(metadata)) {
                localStorage.removeItem(storageKey);
                return null;
            }
            
            return value;
        } catch (error) {
            console.warn('Failed to get from storage:', error);
            return null;
        }
    }

    /**
     * Set item in persistent storage
     * @param {string} key - Cache key
     * @param {*} value - Value to cache
     * @param {Object} options - Cache options
     * @returns {Promise<void>}
     */
    async setInStorage(key, value, options = {}) {
        if (!this.isStorageAvailable()) {
            return;
        }
        
        try {
            const ttl = options.ttl || this.defaultTTL;
            const now = Date.now();
            
            const cacheData = {
                value: value,
                metadata: {
                    createdAt: now,
                    expiresAt: now + ttl,
                    ttl: ttl
                }
            };
            
            const storageKey = this.storagePrefix + key;
            localStorage.setItem(storageKey, JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Failed to set in storage:', error);
            // Handle quota exceeded error
            if (error.name === 'QuotaExceededError') {
                this.clearExpiredFromStorage();
            }
        }
    }

    /**
     * Remove item from persistent storage
     * @param {string} key - Cache key
     * @returns {Promise<boolean>} True if item was removed
     */
    async removeFromStorage(key) {
        if (!this.isStorageAvailable()) {
            return false;
        }
        
        try {
            const storageKey = this.storagePrefix + key;
            const existed = localStorage.getItem(storageKey) !== null;
            localStorage.removeItem(storageKey);
            return existed;
        } catch (error) {
            console.warn('Failed to remove from storage:', error);
            return false;
        }
    }

    /**
     * Check if metadata indicates expiration
     * @param {Object} metadata - Cache metadata
     * @returns {boolean} True if expired
     */
    isExpired(metadata) {
        return Date.now() > metadata.expiresAt;
    }

    /**
     * Evict least recently used item from memory cache
     */
    evictLRU() {
        let oldestKey = null;
        let oldestTime = Date.now();
        
        for (const [key, metadata] of this.cacheMetadata.entries()) {
            if (metadata.lastAccessed < oldestTime) {
                oldestTime = metadata.lastAccessed;
                oldestKey = key;
            }
        }
        
        if (oldestKey) {
            this.memoryCache.delete(oldestKey);
            this.cacheMetadata.delete(oldestKey);
            this.stats.evictions++;
        }
    }

    /**
     * Clear expired items from storage
     */
    clearExpiredFromStorage() {
        if (!this.isStorageAvailable()) {
            return;
        }
        
        const keys = Object.keys(localStorage);
        const now = Date.now();
        
        keys.forEach(key => {
            if (key.startsWith(this.storagePrefix)) {
                try {
                    const cached = localStorage.getItem(key);
                    if (cached) {
                        const { metadata } = JSON.parse(cached);
                        if (now > metadata.expiresAt) {
                            localStorage.removeItem(key);
                        }
                    }
                } catch (error) {
                    // Remove corrupted entries
                    localStorage.removeItem(key);
                }
            }
        });
    }

    /**
     * Setup periodic cleanup of expired items
     */
    setupPeriodicCleanup() {
        // Clean up every 5 minutes
        setInterval(() => {
            this.cleanupExpired();
        }, 5 * 60 * 1000);
    }

    /**
     * Clean up expired items from memory and storage
     */
    cleanupExpired() {
        // Clean memory cache
        for (const [key, metadata] of this.cacheMetadata.entries()) {
            if (this.isExpired(metadata)) {
                this.memoryCache.delete(key);
                this.cacheMetadata.delete(key);
            }
        }
        
        // Clean storage cache
        this.clearExpiredFromStorage();
    }

    /**
     * Build cache key with prefix
     * @param {string} key - Original key
     * @returns {string} Prefixed key
     */
    buildKey(key) {
        return key;
    }

    /**
     * Check if localStorage is available
     * @returns {boolean} True if available
     */
    isStorageAvailable() {
        try {
            const test = '__cache_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getStats() {
        const hitRate = this.stats.hits + this.stats.misses > 0 
            ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
            : 0;
            
        return {
            ...this.stats,
            hitRate: `${hitRate}%`,
            memorySize: this.memoryCache.size,
            maxSize: this.maxCacheSize
        };
    }

    /**
     * Create cache key for API requests
     * @param {string} method - HTTP method
     * @param {string} url - Request URL
     * @param {Object} params - Request parameters
     * @returns {string} Cache key
     */
    static createApiKey(method, url, params = {}) {
        const paramString = Object.keys(params).length > 0 
            ? JSON.stringify(params) 
            : '';
        return `api_${method}_${url}_${paramString}`;
    }

    /**
     * Create cache key for user-specific data
     * @param {string} userId - User ID
     * @param {string} dataType - Type of data
     * @param {Object} params - Additional parameters
     * @returns {string} Cache key
     */
    static createUserKey(userId, dataType, params = {}) {
        const paramString = Object.keys(params).length > 0 
            ? `_${JSON.stringify(params)}` 
            : '';
        return `user_${userId}_${dataType}${paramString}`;
    }
}

// Cache configuration presets
export const CachePresets = {
    // Short-term cache for frequently changing data
    SHORT_TERM: {
        ttl: 2 * 60 * 1000, // 2 minutes
        persist: false
    },
    
    // Medium-term cache for moderately stable data
    MEDIUM_TERM: {
        ttl: 15 * 60 * 1000, // 15 minutes
        persist: true
    },
    
    // Long-term cache for stable data
    LONG_TERM: {
        ttl: 60 * 60 * 1000, // 1 hour
        persist: true
    },
    
    // Session cache (cleared on page reload)
    SESSION: {
        ttl: Infinity,
        persist: false
    }
};

// Create singleton instance
const cacheManager = new CacheManager({
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    maxCacheSize: 100,
    storagePrefix: 'rct_cache_'
});

export default cacheManager;