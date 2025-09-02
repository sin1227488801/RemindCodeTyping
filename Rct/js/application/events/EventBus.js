/**
 * Event Bus
 * Centralized event handling system for application-wide communication
 */
class EventBus {
    /**
     * Creates a new EventBus instance
     */
    constructor() {
        this.listeners = new Map();
        this.onceListeners = new Map();
        this.middleware = [];
        this.isDebugMode = false;
    }

    /**
     * Subscribes to an event
     * @param {string} eventName - Name of the event to listen for
     * @param {Function} callback - Callback function to execute when event is emitted
     * @param {Object} options - Options for the subscription
     * @returns {Function} Unsubscribe function
     */
    on(eventName, callback, options = {}) {
        const { priority = 0, context = null } = options;
        
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, []);
        }

        const listener = {
            callback,
            priority,
            context,
            id: this.generateListenerId()
        };

        const eventListeners = this.listeners.get(eventName);
        eventListeners.push(listener);
        
        // Sort by priority (higher priority first)
        eventListeners.sort((a, b) => b.priority - a.priority);

        if (this.isDebugMode) {
            console.log(`EventBus: Subscribed to '${eventName}' with priority ${priority}`);
        }

        // Return unsubscribe function
        return () => this.off(eventName, listener.id);
    }

    /**
     * Subscribes to an event for one-time execution
     * @param {string} eventName - Name of the event to listen for
     * @param {Function} callback - Callback function to execute when event is emitted
     * @param {Object} options - Options for the subscription
     * @returns {Function} Unsubscribe function
     */
    once(eventName, callback, options = {}) {
        const { priority = 0, context = null } = options;
        
        if (!this.onceListeners.has(eventName)) {
            this.onceListeners.set(eventName, []);
        }

        const listener = {
            callback,
            priority,
            context,
            id: this.generateListenerId()
        };

        const eventListeners = this.onceListeners.get(eventName);
        eventListeners.push(listener);
        
        // Sort by priority (higher priority first)
        eventListeners.sort((a, b) => b.priority - a.priority);

        if (this.isDebugMode) {
            console.log(`EventBus: Subscribed once to '${eventName}' with priority ${priority}`);
        }

        // Return unsubscribe function
        return () => this.offOnce(eventName, listener.id);
    }

    /**
     * Unsubscribes from an event
     * @param {string} eventName - Name of the event
     * @param {string} listenerId - ID of the listener to remove
     */
    off(eventName, listenerId) {
        const eventListeners = this.listeners.get(eventName);
        if (eventListeners) {
            const index = eventListeners.findIndex(listener => listener.id === listenerId);
            if (index > -1) {
                eventListeners.splice(index, 1);
                if (eventListeners.length === 0) {
                    this.listeners.delete(eventName);
                }
                
                if (this.isDebugMode) {
                    console.log(`EventBus: Unsubscribed from '${eventName}'`);
                }
            }
        }
    }

    /**
     * Unsubscribes from a once event
     * @param {string} eventName - Name of the event
     * @param {string} listenerId - ID of the listener to remove
     */
    offOnce(eventName, listenerId) {
        const eventListeners = this.onceListeners.get(eventName);
        if (eventListeners) {
            const index = eventListeners.findIndex(listener => listener.id === listenerId);
            if (index > -1) {
                eventListeners.splice(index, 1);
                if (eventListeners.length === 0) {
                    this.onceListeners.delete(eventName);
                }
            }
        }
    }

    /**
     * Emits an event to all subscribers
     * @param {string} eventName - Name of the event to emit
     * @param {*} data - Data to pass to event listeners
     * @param {Object} options - Emission options
     * @returns {Promise<boolean>} True if event was handled, false if cancelled
     */
    async emit(eventName, data = null, options = {}) {
        const { async = false, cancellable = false } = options;
        
        if (this.isDebugMode) {
            console.log(`EventBus: Emitting '${eventName}'`, data);
        }

        // Apply middleware (before emission)
        for (const middleware of this.middleware) {
            if (middleware.before) {
                const result = await middleware.before(eventName, data);
                if (result === false && cancellable) {
                    if (this.isDebugMode) {
                        console.log(`EventBus: Event '${eventName}' cancelled by middleware`);
                    }
                    return false;
                }
            }
        }

        const event = {
            name: eventName,
            data,
            timestamp: Date.now(),
            cancelled: false,
            stopPropagation: false
        };

        // Execute once listeners first
        const onceListeners = this.onceListeners.get(eventName) || [];
        const onceListenersCopy = [...onceListeners]; // Copy to avoid modification during iteration
        
        // Clear once listeners before execution
        if (onceListeners.length > 0) {
            this.onceListeners.delete(eventName);
        }

        // Execute regular listeners
        const regularListeners = this.listeners.get(eventName) || [];
        const allListeners = [...onceListenersCopy, ...regularListeners];

        if (async) {
            await this.executeListenersAsync(allListeners, event);
        } else {
            this.executeListenersSync(allListeners, event);
        }

        // Apply middleware (after emission)
        for (const middleware of this.middleware) {
            if (middleware.after) {
                await middleware.after(eventName, data, event);
            }
        }

        return !event.cancelled;
    }

    /**
     * Executes listeners synchronously
     * @param {Array} listeners - Array of listeners to execute
     * @param {Object} event - Event object
     * @private
     */
    executeListenersSync(listeners, event) {
        for (const listener of listeners) {
            if (event.stopPropagation) break;
            
            try {
                const result = listener.callback.call(listener.context, event);
                
                // Handle cancellation
                if (result === false) {
                    event.cancelled = true;
                }
                
                // Handle stop propagation
                if (event.stopPropagation) {
                    break;
                }
            } catch (error) {
                console.error(`EventBus: Error in listener for '${event.name}':`, error);
            }
        }
    }

    /**
     * Executes listeners asynchronously
     * @param {Array} listeners - Array of listeners to execute
     * @param {Object} event - Event object
     * @private
     */
    async executeListenersAsync(listeners, event) {
        for (const listener of listeners) {
            if (event.stopPropagation) break;
            
            try {
                const result = await listener.callback.call(listener.context, event);
                
                // Handle cancellation
                if (result === false) {
                    event.cancelled = true;
                }
                
                // Handle stop propagation
                if (event.stopPropagation) {
                    break;
                }
            } catch (error) {
                console.error(`EventBus: Error in async listener for '${event.name}':`, error);
            }
        }
    }

    /**
     * Adds middleware to the event bus
     * @param {Object} middleware - Middleware object with before/after methods
     */
    addMiddleware(middleware) {
        this.middleware.push(middleware);
        
        if (this.isDebugMode) {
            console.log('EventBus: Added middleware');
        }
    }

    /**
     * Removes middleware from the event bus
     * @param {Object} middleware - Middleware to remove
     */
    removeMiddleware(middleware) {
        const index = this.middleware.indexOf(middleware);
        if (index > -1) {
            this.middleware.splice(index, 1);
            
            if (this.isDebugMode) {
                console.log('EventBus: Removed middleware');
            }
        }
    }

    /**
     * Gets all listeners for an event
     * @param {string} eventName - Name of the event
     * @returns {Array} Array of listeners
     */
    getListeners(eventName) {
        const regular = this.listeners.get(eventName) || [];
        const once = this.onceListeners.get(eventName) || [];
        return [...regular, ...once];
    }

    /**
     * Gets all event names that have listeners
     * @returns {Array} Array of event names
     */
    getEventNames() {
        const regularEvents = Array.from(this.listeners.keys());
        const onceEvents = Array.from(this.onceListeners.keys());
        return [...new Set([...regularEvents, ...onceEvents])];
    }

    /**
     * Checks if an event has any listeners
     * @param {string} eventName - Name of the event
     * @returns {boolean} True if event has listeners
     */
    hasListeners(eventName) {
        const regularListeners = this.listeners.get(eventName);
        const onceListeners = this.onceListeners.get(eventName);
        return (regularListeners && regularListeners.length > 0) || 
               (onceListeners && onceListeners.length > 0);
    }

    /**
     * Removes all listeners for an event
     * @param {string} eventName - Name of the event (optional, removes all if not provided)
     */
    removeAllListeners(eventName = null) {
        if (eventName) {
            this.listeners.delete(eventName);
            this.onceListeners.delete(eventName);
            
            if (this.isDebugMode) {
                console.log(`EventBus: Removed all listeners for '${eventName}'`);
            }
        } else {
            this.listeners.clear();
            this.onceListeners.clear();
            
            if (this.isDebugMode) {
                console.log('EventBus: Removed all listeners');
            }
        }
    }

    /**
     * Enables or disables debug mode
     * @param {boolean} enabled - Whether to enable debug mode
     */
    setDebugMode(enabled) {
        this.isDebugMode = enabled;
        console.log(`EventBus: Debug mode ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Creates a namespaced event emitter
     * @param {string} namespace - Namespace for events
     * @returns {Object} Namespaced event emitter
     */
    namespace(namespace) {
        return {
            on: (eventName, callback, options) => 
                this.on(`${namespace}:${eventName}`, callback, options),
            
            once: (eventName, callback, options) => 
                this.once(`${namespace}:${eventName}`, callback, options),
            
            off: (eventName, listenerId) => 
                this.off(`${namespace}:${eventName}`, listenerId),
            
            emit: (eventName, data, options) => 
                this.emit(`${namespace}:${eventName}`, data, options),
            
            removeAllListeners: (eventName) => 
                this.removeAllListeners(eventName ? `${namespace}:${eventName}` : null)
        };
    }

    /**
     * Creates an event proxy that forwards events to another event bus
     * @param {EventBus} targetEventBus - Target event bus to forward to
     * @param {Array} eventNames - Array of event names to forward (optional, forwards all if not provided)
     * @returns {Function} Function to stop proxying
     */
    proxy(targetEventBus, eventNames = null) {
        const unsubscribeFunctions = [];
        
        const setupProxy = (eventName) => {
            const unsubscribe = this.on(eventName, (event) => {
                targetEventBus.emit(event.name, event.data);
            });
            unsubscribeFunctions.push(unsubscribe);
        };

        if (eventNames) {
            eventNames.forEach(setupProxy);
        } else {
            // Proxy all current events
            this.getEventNames().forEach(setupProxy);
        }

        // Return function to stop proxying
        return () => {
            unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
        };
    }

    /**
     * Waits for an event to be emitted
     * @param {string} eventName - Name of the event to wait for
     * @param {number} timeout - Timeout in milliseconds (optional)
     * @returns {Promise} Promise that resolves when event is emitted
     */
    waitFor(eventName, timeout = null) {
        return new Promise((resolve, reject) => {
            let timeoutId = null;
            
            const unsubscribe = this.once(eventName, (event) => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                resolve(event);
            });

            if (timeout) {
                timeoutId = setTimeout(() => {
                    unsubscribe();
                    reject(new Error(`Timeout waiting for event '${eventName}'`));
                }, timeout);
            }
        });
    }

    /**
     * Generates a unique listener ID
     * @returns {string} Unique ID
     * @private
     */
    generateListenerId() {
        return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Gets statistics about the event bus
     * @returns {Object} Statistics object
     */
    getStatistics() {
        const regularListenerCount = Array.from(this.listeners.values())
            .reduce((sum, listeners) => sum + listeners.length, 0);
        
        const onceListenerCount = Array.from(this.onceListeners.values())
            .reduce((sum, listeners) => sum + listeners.length, 0);

        return {
            totalEvents: this.getEventNames().length,
            totalListeners: regularListenerCount + onceListenerCount,
            regularListeners: regularListenerCount,
            onceListeners: onceListenerCount,
            middlewareCount: this.middleware.length,
            debugMode: this.isDebugMode
        };
    }
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventBus;
} else if (typeof window !== 'undefined') {
    window.EventBus = EventBus;
}