/**
 * Lazy loading utility for dynamic module imports and component loading.
 * Provides performance optimization through code splitting and on-demand loading.
 */
class LazyLoader {
    constructor() {
        this.loadedModules = new Map();
        this.loadingPromises = new Map();
        this.preloadQueue = new Set();
        this.intersectionObserver = null;
        
        this.setupIntersectionObserver();
    }

    /**
     * Setup intersection observer for automatic preloading
     */
    setupIntersectionObserver() {
        if ('IntersectionObserver' in window) {
            this.intersectionObserver = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const element = entry.target;
                            const preloadModule = element.dataset.preloadModule;
                            if (preloadModule) {
                                this.preloadModule(preloadModule);
                                this.intersectionObserver.unobserve(element);
                            }
                        }
                    });
                },
                {
                    rootMargin: '50px',
                    threshold: 0.1
                }
            );
        }
    }

    /**
     * Dynamically import a module with caching
     * @param {string} modulePath - Path to the module
     * @returns {Promise<Object>} Module exports
     */
    async loadModule(modulePath) {
        // Check if module is already loaded
        if (this.loadedModules.has(modulePath)) {
            return this.loadedModules.get(modulePath);
        }

        // Check if module is currently being loaded
        if (this.loadingPromises.has(modulePath)) {
            return this.loadingPromises.get(modulePath);
        }

        // Start loading the module
        const loadingPromise = this.importModule(modulePath);
        this.loadingPromises.set(modulePath, loadingPromise);

        try {
            const module = await loadingPromise;
            this.loadedModules.set(modulePath, module);
            this.loadingPromises.delete(modulePath);
            return module;
        } catch (error) {
            this.loadingPromises.delete(modulePath);
            console.error(`Failed to load module ${modulePath}:`, error);
            throw error;
        }
    }

    /**
     * Import module with retry logic
     * @param {string} modulePath - Path to the module
     * @returns {Promise<Object>} Module exports
     */
    async importModule(modulePath) {
        const maxRetries = 3;
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Loading module: ${modulePath} (attempt ${attempt})`);
                
                // Dynamic import based on module path
                let module;
                switch (modulePath) {
                    case 'typing':
                        module = await import('../modules/typing.js');
                        break;
                    case 'studybook':
                        module = await import('../modules/studybook.js');
                        break;
                    case 'records':
                        module = await import('../modules/records.js');
                        break;
                    case 'dashboard':
                        module = await import('../modules/dashboard.js');
                        break;
                    default:
                        // Try direct import for custom paths
                        module = await import(modulePath);
                }

                console.log(`Successfully loaded module: ${modulePath}`);
                return module;
            } catch (error) {
                lastError = error;
                console.warn(`Failed to load module ${modulePath} (attempt ${attempt}):`, error);
                
                if (attempt < maxRetries) {
                    // Wait before retry with exponential backoff
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
            }
        }

        throw new Error(`Failed to load module ${modulePath} after ${maxRetries} attempts: ${lastError.message}`);
    }

    /**
     * Preload a module without executing it
     * @param {string} modulePath - Path to the module
     * @returns {Promise<void>}
     */
    async preloadModule(modulePath) {
        if (this.loadedModules.has(modulePath) || this.loadingPromises.has(modulePath)) {
            return;
        }

        try {
            await this.loadModule(modulePath);
            console.log(`Preloaded module: ${modulePath}`);
        } catch (error) {
            console.warn(`Failed to preload module ${modulePath}:`, error);
        }
    }

    /**
     * Load and initialize a component
     * @param {string} modulePath - Path to the module
     * @param {HTMLElement} container - Container element
     * @param {Object} options - Component options
     * @returns {Promise<Object>} Component instance
     */
    async loadComponent(modulePath, container, options = {}) {
        try {
            // Show loading indicator
            this.showLoadingIndicator(container);

            const module = await this.loadModule(modulePath);
            
            // Hide loading indicator
            this.hideLoadingIndicator(container);

            // Initialize component if it has an init method
            if (module.default && typeof module.default.init === 'function') {
                return await module.default.init(container, options);
            } else if (module.init && typeof module.init === 'function') {
                return await module.init(container, options);
            } else if (module.default && typeof module.default === 'function') {
                return new module.default(container, options);
            }

            return module;
        } catch (error) {
            this.hideLoadingIndicator(container);
            this.showErrorIndicator(container, error);
            throw error;
        }
    }

    /**
     * Load page content dynamically
     * @param {string} pageName - Name of the page to load
     * @param {HTMLElement} container - Container element
     * @param {Object} options - Page options
     * @returns {Promise<void>}
     */
    async loadPage(pageName, container, options = {}) {
        try {
            // Show loading state
            this.showLoadingIndicator(container);

            // Load the page module
            const pageModule = await this.loadModule(pageName);

            // Clear container
            container.innerHTML = '';

            // Initialize page
            if (pageModule.default && typeof pageModule.default.render === 'function') {
                await pageModule.default.render(container, options);
            } else if (pageModule.render && typeof pageModule.render === 'function') {
                await pageModule.render(container, options);
            } else {
                throw new Error(`Page module ${pageName} does not have a render method`);
            }

            // Hide loading indicator
            this.hideLoadingIndicator(container);

            // Trigger page loaded event
            this.triggerPageLoadedEvent(pageName, container);

        } catch (error) {
            this.hideLoadingIndicator(container);
            this.showErrorIndicator(container, error);
            console.error(`Failed to load page ${pageName}:`, error);
            throw error;
        }
    }

    /**
     * Preload multiple modules in the background
     * @param {string[]} modulePaths - Array of module paths
     * @returns {Promise<void>}
     */
    async preloadModules(modulePaths) {
        const preloadPromises = modulePaths.map(path => 
            this.preloadModule(path).catch(error => 
                console.warn(`Failed to preload ${path}:`, error)
            )
        );

        await Promise.allSettled(preloadPromises);
    }

    /**
     * Setup automatic preloading for elements with data attributes
     */
    setupAutoPreload() {
        const preloadElements = document.querySelectorAll('[data-preload-module]');
        preloadElements.forEach(element => {
            if (this.intersectionObserver) {
                this.intersectionObserver.observe(element);
            }
        });
    }

    /**
     * Show loading indicator
     * @param {HTMLElement} container - Container element
     */
    showLoadingIndicator(container) {
        const existingIndicator = container.querySelector('.lazy-loading-indicator');
        if (existingIndicator) return;

        const indicator = document.createElement('div');
        indicator.className = 'lazy-loading-indicator';
        indicator.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>読み込み中...</p>
            </div>
        `;
        
        // Add CSS if not already present
        this.addLoadingStyles();
        
        container.appendChild(indicator);
    }

    /**
     * Hide loading indicator
     * @param {HTMLElement} container - Container element
     */
    hideLoadingIndicator(container) {
        const indicator = container.querySelector('.lazy-loading-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    /**
     * Show error indicator
     * @param {HTMLElement} container - Container element
     * @param {Error} error - Error object
     */
    showErrorIndicator(container, error) {
        const indicator = document.createElement('div');
        indicator.className = 'lazy-error-indicator';
        indicator.innerHTML = `
            <div class="error-message">
                <h3>読み込みエラー</h3>
                <p>${error.message}</p>
                <button class="retry-button" onclick="location.reload()">再試行</button>
            </div>
        `;
        
        container.appendChild(indicator);
    }

    /**
     * Add loading styles to the document
     */
    addLoadingStyles() {
        if (document.getElementById('lazy-loader-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'lazy-loader-styles';
        styles.textContent = `
            .lazy-loading-indicator {
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 200px;
                padding: 20px;
            }
            
            .loading-spinner {
                text-align: center;
            }
            
            .spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #3498db;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 10px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .lazy-error-indicator {
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 200px;
                padding: 20px;
            }
            
            .error-message {
                text-align: center;
                color: #e74c3c;
            }
            
            .retry-button {
                background: #3498db;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
                margin-top: 10px;
            }
            
            .retry-button:hover {
                background: #2980b9;
            }
        `;
        
        document.head.appendChild(styles);
    }

    /**
     * Trigger page loaded event
     * @param {string} pageName - Name of the loaded page
     * @param {HTMLElement} container - Container element
     */
    triggerPageLoadedEvent(pageName, container) {
        const event = new CustomEvent('pageLoaded', {
            detail: { pageName, container }
        });
        document.dispatchEvent(event);
    }

    /**
     * Clear all cached modules (useful for development)
     */
    clearCache() {
        this.loadedModules.clear();
        this.loadingPromises.clear();
        console.log('Lazy loader cache cleared');
    }

    /**
     * Get loading statistics
     * @returns {Object} Loading statistics
     */
    getStats() {
        return {
            loadedModules: Array.from(this.loadedModules.keys()),
            loadingModules: Array.from(this.loadingPromises.keys()),
            cacheSize: this.loadedModules.size
        };
    }
}

// Create singleton instance
const lazyLoader = new LazyLoader();

export default lazyLoader;