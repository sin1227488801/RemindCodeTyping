/**
 * State Manager
 * Centralized state management for the application
 */
class StateManager {
    /**
     * Creates a new StateManager instance
     */
    constructor() {
        this.state = {
            currentUser: null,
            currentSession: null,
            currentStudyBook: null,
            studyBooks: [],
            userStatistics: null,
            appSettings: {},
            uiState: {
                isLoading: false,
                activeTab: null,
                modals: {}
            }
        };
        
        this.listeners = new Map();
        this.middleware = [];
    }

    /**
     * Gets the current state
     * @returns {Object} Current application state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Gets a specific part of the state
     * @param {string} path - Dot-separated path to state property
     * @returns {*} State value at the specified path
     */
    getStateValue(path) {
        return this.getNestedValue(this.state, path);
    }

    /**
     * Updates the state
     * @param {Object} updates - State updates to apply
     * @param {string} action - Action name for debugging/middleware
     */
    setState(updates, action = 'UPDATE_STATE') {
        const previousState = { ...this.state };
        
        // Apply middleware (before state change)
        this.middleware.forEach(middleware => {
            if (middleware.before) {
                middleware.before(action, updates, previousState);
            }
        });

        // Apply updates
        this.state = this.mergeDeep(this.state, updates);

        // Apply middleware (after state change)
        this.middleware.forEach(middleware => {
            if (middleware.after) {
                middleware.after(action, this.state, previousState);
            }
        });

        // Notify listeners
        this.notifyListeners(action, this.state, previousState);
    }

    /**
     * Subscribes to state changes
     * @param {string} path - State path to watch (optional, watches all if not provided)
     * @param {Function} callback - Callback function to call on state change
     * @returns {Function} Unsubscribe function
     */
    subscribe(path, callback) {
        // If only callback is provided, watch entire state
        if (typeof path === 'function') {
            callback = path;
            path = null;
        }

        const listenerId = this.generateListenerId();
        
        if (!this.listeners.has(path)) {
            this.listeners.set(path, new Map());
        }
        
        this.listeners.get(path).set(listenerId, callback);

        // Return unsubscribe function
        return () => {
            const pathListeners = this.listeners.get(path);
            if (pathListeners) {
                pathListeners.delete(listenerId);
                if (pathListeners.size === 0) {
                    this.listeners.delete(path);
                }
            }
        };
    }

    /**
     * Adds middleware for state changes
     * @param {Object} middleware - Middleware object with before/after methods
     */
    addMiddleware(middleware) {
        this.middleware.push(middleware);
    }

    /**
     * Removes middleware
     * @param {Object} middleware - Middleware to remove
     */
    removeMiddleware(middleware) {
        const index = this.middleware.indexOf(middleware);
        if (index > -1) {
            this.middleware.splice(index, 1);
        }
    }

    /**
     * Dispatches an action to update state
     * @param {string} type - Action type
     * @param {*} payload - Action payload
     */
    dispatch(type, payload) {
        switch (type) {
            case 'SET_CURRENT_USER':
                this.setState({ currentUser: payload }, type);
                break;
                
            case 'CLEAR_CURRENT_USER':
                this.setState({ currentUser: null }, type);
                break;
                
            case 'SET_CURRENT_SESSION':
                this.setState({ currentSession: payload }, type);
                break;
                
            case 'CLEAR_CURRENT_SESSION':
                this.setState({ currentSession: null }, type);
                break;
                
            case 'SET_CURRENT_STUDY_BOOK':
                this.setState({ currentStudyBook: payload }, type);
                break;
                
            case 'CLEAR_CURRENT_STUDY_BOOK':
                this.setState({ currentStudyBook: null }, type);
                break;
                
            case 'SET_STUDY_BOOKS':
                this.setState({ studyBooks: payload }, type);
                break;
                
            case 'ADD_STUDY_BOOK':
                this.setState({ 
                    studyBooks: [...this.state.studyBooks, payload] 
                }, type);
                break;
                
            case 'UPDATE_STUDY_BOOK':
                this.setState({
                    studyBooks: this.state.studyBooks.map(book => 
                        book.id === payload.id ? payload : book
                    )
                }, type);
                break;
                
            case 'REMOVE_STUDY_BOOK':
                this.setState({
                    studyBooks: this.state.studyBooks.filter(book => book.id !== payload)
                }, type);
                break;
                
            case 'SET_USER_STATISTICS':
                this.setState({ userStatistics: payload }, type);
                break;
                
            case 'UPDATE_APP_SETTINGS':
                this.setState({
                    appSettings: { ...this.state.appSettings, ...payload }
                }, type);
                break;
                
            case 'SET_LOADING':
                this.setState({
                    uiState: { ...this.state.uiState, isLoading: payload }
                }, type);
                break;
                
            case 'SET_ACTIVE_TAB':
                this.setState({
                    uiState: { ...this.state.uiState, activeTab: payload }
                }, type);
                break;
                
            case 'SHOW_MODAL':
                this.setState({
                    uiState: {
                        ...this.state.uiState,
                        modals: { ...this.state.uiState.modals, [payload.name]: payload.data }
                    }
                }, type);
                break;
                
            case 'HIDE_MODAL':
                const newModals = { ...this.state.uiState.modals };
                delete newModals[payload];
                this.setState({
                    uiState: { ...this.state.uiState, modals: newModals }
                }, type);
                break;
                
            default:
                console.warn(`Unknown action type: ${type}`);
        }
    }

    /**
     * Resets the state to initial values
     */
    reset() {
        this.setState({
            currentUser: null,
            currentSession: null,
            currentStudyBook: null,
            studyBooks: [],
            userStatistics: null,
            appSettings: {},
            uiState: {
                isLoading: false,
                activeTab: null,
                modals: {}
            }
        }, 'RESET_STATE');
    }

    /**
     * Persists state to localStorage
     * @param {string[]} keys - Keys to persist (optional, persists all if not provided)
     */
    persistState(keys = ['currentUser', 'appSettings']) {
        const stateToPersist = {};
        
        keys.forEach(key => {
            if (this.state.hasOwnProperty(key)) {
                stateToPersist[key] = this.state[key];
            }
        });

        try {
            localStorage.setItem('appState', JSON.stringify(stateToPersist));
        } catch (error) {
            console.warn('Failed to persist state:', error);
        }
    }

    /**
     * Loads state from localStorage
     * @param {string[]} keys - Keys to load (optional, loads all if not provided)
     */
    loadPersistedState(keys = ['currentUser', 'appSettings']) {
        try {
            const persistedState = localStorage.getItem('appState');
            if (persistedState) {
                const parsedState = JSON.parse(persistedState);
                const stateToLoad = {};
                
                keys.forEach(key => {
                    if (parsedState.hasOwnProperty(key)) {
                        stateToLoad[key] = parsedState[key];
                    }
                });

                this.setState(stateToLoad, 'LOAD_PERSISTED_STATE');
            }
        } catch (error) {
            console.warn('Failed to load persisted state:', error);
        }
    }

    /**
     * Private helper methods
     */

    /**
     * Notifies all relevant listeners about state changes
     * @param {string} action - Action that caused the change
     * @param {Object} newState - New state
     * @param {Object} previousState - Previous state
     * @private
     */
    notifyListeners(action, newState, previousState) {
        // Notify global listeners (watching entire state)
        const globalListeners = this.listeners.get(null);
        if (globalListeners) {
            globalListeners.forEach(callback => {
                try {
                    callback(newState, previousState, action);
                } catch (error) {
                    console.error('Error in state listener:', error);
                }
            });
        }

        // Notify path-specific listeners
        this.listeners.forEach((pathListeners, path) => {
            if (path && this.hasStateChanged(newState, previousState, path)) {
                const newValue = this.getNestedValue(newState, path);
                const previousValue = this.getNestedValue(previousState, path);
                
                pathListeners.forEach(callback => {
                    try {
                        callback(newValue, previousValue, action);
                    } catch (error) {
                        console.error('Error in state listener:', error);
                    }
                });
            }
        });
    }

    /**
     * Checks if state at a specific path has changed
     * @param {Object} newState - New state
     * @param {Object} previousState - Previous state
     * @param {string} path - Dot-separated path
     * @returns {boolean} True if state at path has changed
     * @private
     */
    hasStateChanged(newState, previousState, path) {
        const newValue = this.getNestedValue(newState, path);
        const previousValue = this.getNestedValue(previousState, path);
        return newValue !== previousValue;
    }

    /**
     * Gets nested value from object using dot-separated path
     * @param {Object} obj - Object to get value from
     * @param {string} path - Dot-separated path
     * @returns {*} Value at path
     * @private
     */
    getNestedValue(obj, path) {
        if (!path) return obj;
        
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    /**
     * Deep merges two objects
     * @param {Object} target - Target object
     * @param {Object} source - Source object
     * @returns {Object} Merged object
     * @private
     */
    mergeDeep(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (this.isObject(source[key]) && this.isObject(result[key])) {
                    result[key] = this.mergeDeep(result[key], source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }
        
        return result;
    }

    /**
     * Checks if value is an object
     * @param {*} value - Value to check
     * @returns {boolean} True if value is an object
     * @private
     */
    isObject(value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    }

    /**
     * Generates a unique listener ID
     * @returns {string} Unique ID
     * @private
     */
    generateListenerId() {
        return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StateManager;
} else if (typeof window !== 'undefined') {
    window.StateManager = StateManager;
}