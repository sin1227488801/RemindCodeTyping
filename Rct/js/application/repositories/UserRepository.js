/**
 * User Repository
 * Manages user state and provides user-related data access
 */
class UserRepository {
    /**
     * Creates a new UserRepository instance
     * @param {StateManager} stateManager - State manager instance
     */
    constructor(stateManager) {
        this.stateManager = stateManager;
    }

    /**
     * Gets the current user
     * @returns {User|null} Current user or null if not authenticated
     */
    getCurrentUser() {
        return this.stateManager.getStateValue('currentUser');
    }

    /**
     * Sets the current user
     * @param {User} user - User to set as current
     */
    setCurrentUser(user) {
        this.stateManager.dispatch('SET_CURRENT_USER', user);
        
        // Persist user to localStorage for session management
        if (user) {
            this.persistUserSession(user);
        }
    }

    /**
     * Clears the current user
     */
    clearCurrentUser() {
        this.stateManager.dispatch('CLEAR_CURRENT_USER');
        this.clearUserSession();
    }

    /**
     * Checks if a user is currently authenticated
     * @returns {boolean} True if user is authenticated
     */
    isAuthenticated() {
        const user = this.getCurrentUser();
        return user && user.isAuthenticated();
    }

    /**
     * Checks if the current user is a guest
     * @returns {boolean} True if current user is a guest
     */
    isGuest() {
        const user = this.getCurrentUser();
        return user && user.isGuest;
    }

    /**
     * Gets the current user's ID
     * @returns {string|null} User ID or null if not authenticated
     */
    getCurrentUserId() {
        const user = this.getCurrentUser();
        return user ? user.id : null;
    }

    /**
     * Gets the current user's login ID
     * @returns {string|null} Login ID or null if not authenticated
     */
    getCurrentUserLoginId() {
        const user = this.getCurrentUser();
        return user ? user.loginId : null;
    }

    /**
     * Subscribes to user state changes
     * @param {Function} callback - Callback function to call when user changes
     * @returns {Function} Unsubscribe function
     */
    subscribeToUserChanges(callback) {
        return this.stateManager.subscribe('currentUser', callback);
    }

    /**
     * Updates the current user's information
     * @param {Object} updates - User updates to apply
     */
    updateCurrentUser(updates) {
        const currentUser = this.getCurrentUser();
        if (currentUser) {
            const updatedUser = { ...currentUser, ...updates };
            this.setCurrentUser(updatedUser);
        }
    }

    /**
     * Persists user session to localStorage
     * @param {User} user - User to persist
     * @private
     */
    persistUserSession(user) {
        try {
            const sessionData = {
                id: user.id,
                loginId: user.loginId,
                isGuest: user.isGuest,
                timestamp: Date.now()
            };
            
            localStorage.setItem('userSession', JSON.stringify(sessionData));
        } catch (error) {
            console.warn('Failed to persist user session:', error);
        }
    }

    /**
     * Loads user session from localStorage
     * @returns {User|null} Loaded user or null if no valid session
     */
    loadUserSession() {
        try {
            const sessionData = localStorage.getItem('userSession');
            if (!sessionData) return null;

            const parsed = JSON.parse(sessionData);
            
            // Check if session is still valid (24 hours)
            const sessionAge = Date.now() - parsed.timestamp;
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours
            
            if (sessionAge > maxAge) {
                this.clearUserSession();
                return null;
            }

            // Create User instance from session data
            const user = new User(parsed.id, parsed.loginId, parsed.isGuest);
            return user;
            
        } catch (error) {
            console.warn('Failed to load user session:', error);
            this.clearUserSession();
            return null;
        }
    }

    /**
     * Clears user session from localStorage
     * @private
     */
    clearUserSession() {
        try {
            localStorage.removeItem('userSession');
        } catch (error) {
            console.warn('Failed to clear user session:', error);
        }
    }

    /**
     * Initializes the repository by loading persisted session
     */
    initialize() {
        const persistedUser = this.loadUserSession();
        if (persistedUser) {
            this.stateManager.dispatch('SET_CURRENT_USER', persistedUser);
        }
    }

    /**
     * Validates user session and refreshes if needed
     * @returns {Promise<boolean>} True if session is valid
     */
    async validateSession() {
        const user = this.getCurrentUser();
        if (!user || user.isGuest) {
            return true; // Guest sessions don't need validation
        }

        try {
            // This would typically make an API call to validate the session
            // For now, we'll just check if the user exists in localStorage
            const sessionData = localStorage.getItem('userSession');
            return !!sessionData;
        } catch (error) {
            console.warn('Session validation failed:', error);
            this.clearCurrentUser();
            return false;
        }
    }

    /**
     * Creates a guest user
     * @returns {User} Guest user instance
     */
    createGuestUser() {
        const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return new User(guestId, 'Guest', true);
    }

    /**
     * Checks if the current user can perform a specific action
     * @param {string} action - Action to check permission for
     * @returns {boolean} True if user has permission
     */
    hasPermission(action) {
        const user = this.getCurrentUser();
        if (!user) return false;

        // Define permission rules
        const permissions = {
            'create_study_book': !user.isGuest,
            'edit_study_book': !user.isGuest,
            'delete_study_book': !user.isGuest,
            'save_typing_results': !user.isGuest,
            'view_statistics': !user.isGuest,
            'practice_typing': true, // Everyone can practice
            'view_study_books': true // Everyone can view
        };

        return permissions[action] || false;
    }

    /**
     * Gets user preferences
     * @returns {Object} User preferences
     */
    getUserPreferences() {
        const user = this.getCurrentUser();
        if (!user) return {};

        try {
            const preferences = localStorage.getItem(`userPreferences_${user.id}`);
            return preferences ? JSON.parse(preferences) : {};
        } catch (error) {
            console.warn('Failed to load user preferences:', error);
            return {};
        }
    }

    /**
     * Saves user preferences
     * @param {Object} preferences - Preferences to save
     */
    saveUserPreferences(preferences) {
        const user = this.getCurrentUser();
        if (!user) return;

        try {
            localStorage.setItem(`userPreferences_${user.id}`, JSON.stringify(preferences));
        } catch (error) {
            console.warn('Failed to save user preferences:', error);
        }
    }

    /**
     * Updates specific user preference
     * @param {string} key - Preference key
     * @param {*} value - Preference value
     */
    updateUserPreference(key, value) {
        const preferences = this.getUserPreferences();
        preferences[key] = value;
        this.saveUserPreferences(preferences);
    }

    /**
     * Gets specific user preference
     * @param {string} key - Preference key
     * @param {*} defaultValue - Default value if preference doesn't exist
     * @returns {*} Preference value
     */
    getUserPreference(key, defaultValue = null) {
        const preferences = this.getUserPreferences();
        return preferences.hasOwnProperty(key) ? preferences[key] : defaultValue;
    }
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserRepository;
} else if (typeof window !== 'undefined') {
    window.UserRepository = UserRepository;
}