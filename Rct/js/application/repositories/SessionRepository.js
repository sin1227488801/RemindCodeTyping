/**
 * Session Repository
 * Manages typing session state and provides session-related data access
 */
class SessionRepository {
    /**
     * Creates a new SessionRepository instance
     * @param {StateManager} stateManager - State manager instance
     */
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.sessionHistory = [];
        this.maxHistorySize = 100;
    }

    /**
     * Gets the current typing session
     * @returns {TypingSession|null} Current session or null if none active
     */
    getCurrentSession() {
        return this.stateManager.getStateValue('currentSession');
    }

    /**
     * Sets the current typing session
     * @param {TypingSession} session - Session to set as current
     */
    setCurrentSession(session) {
        this.stateManager.dispatch('SET_CURRENT_SESSION', session);
        
        // Persist session state for recovery
        if (session) {
            this.persistCurrentSession(session);
        }
    }

    /**
     * Clears the current typing session
     */
    clearCurrentSession() {
        this.stateManager.dispatch('CLEAR_CURRENT_SESSION');
        this.clearPersistedSession();
    }

    /**
     * Gets the current study book for practice
     * @returns {StudyBook|null} Current study book or null if none selected
     */
    getCurrentStudyBook() {
        return this.stateManager.getStateValue('currentStudyBook');
    }

    /**
     * Sets the current study book for practice
     * @param {StudyBook} studyBook - Study book to set as current
     */
    setCurrentStudyBook(studyBook) {
        this.stateManager.dispatch('SET_CURRENT_STUDY_BOOK', studyBook);
    }

    /**
     * Clears the current study book
     */
    clearCurrentStudyBook() {
        this.stateManager.dispatch('CLEAR_CURRENT_STUDY_BOOK');
    }

    /**
     * Checks if there's an active typing session
     * @returns {boolean} True if there's an active session
     */
    hasActiveSession() {
        const session = this.getCurrentSession();
        return session && session.isActive();
    }

    /**
     * Gets session statistics
     * @returns {Object} Session statistics
     */
    getSessionStatistics() {
        const session = this.getCurrentSession();
        if (!session) return null;

        return {
            elapsedTime: session.getElapsedTime(),
            progress: session.getProgress(),
            currentAccuracy: session.getCurrentAccuracy(),
            estimatedTimeRemaining: session.getEstimatedTimeRemaining(),
            charactersTyped: session.getCharactersTyped(),
            totalCharacters: session.getTotalCharacters(),
            errorsCount: session.getErrorsCount(),
            currentWPM: session.getCurrentWPM(),
            currentCPM: session.getCurrentCPM()
        };
    }

    /**
     * Adds a completed session to history
     * @param {TypingSession} session - Completed session
     * @param {TypingResult} result - Session result
     */
    addToHistory(session, result) {
        const historyEntry = {
            id: session.id,
            studyBookId: session.studyBook.id,
            studyBookLanguage: session.studyBook.language,
            result: result,
            completedAt: new Date(),
            duration: result.duration,
            accuracy: result.accuracy,
            wpm: Math.round((result.totalCharacters / 5) / (result.duration.toMinutes())),
            cpm: Math.round(result.totalCharacters / result.duration.toMinutes())
        };

        this.sessionHistory.unshift(historyEntry);

        // Limit history size
        if (this.sessionHistory.length > this.maxHistorySize) {
            this.sessionHistory = this.sessionHistory.slice(0, this.maxHistorySize);
        }

        // Persist history
        this.persistSessionHistory();
    }

    /**
     * Gets session history
     * @param {Object} options - Filter and pagination options
     * @returns {Object} Paginated session history
     */
    getHistory(options = {}) {
        const {
            page = 0,
            size = 10,
            language = null,
            dateFrom = null,
            dateTo = null,
            sortBy = 'completedAt',
            sortOrder = 'desc'
        } = options;

        let history = [...this.sessionHistory];

        // Apply filters
        if (language) {
            history = history.filter(entry => entry.studyBookLanguage === language);
        }

        if (dateFrom) {
            const fromDate = new Date(dateFrom);
            history = history.filter(entry => new Date(entry.completedAt) >= fromDate);
        }

        if (dateTo) {
            const toDate = new Date(dateTo);
            history = history.filter(entry => new Date(entry.completedAt) <= toDate);
        }

        // Apply sorting
        history.sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];

            // Handle date sorting
            if (sortBy === 'completedAt') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        // Apply pagination
        const totalElements = history.length;
        const totalPages = Math.ceil(totalElements / size);
        const startIndex = page * size;
        const endIndex = startIndex + size;
        const pageHistory = history.slice(startIndex, endIndex);

        return {
            sessions: pageHistory,
            pagination: {
                page,
                size,
                totalElements,
                totalPages,
                hasNext: page < totalPages - 1,
                hasPrevious: page > 0
            }
        };
    }

    /**
     * Gets aggregated statistics from session history
     * @param {Object} options - Filter options
     * @returns {Object} Aggregated statistics
     */
    getAggregatedStatistics(options = {}) {
        const {
            language = null,
            dateFrom = null,
            dateTo = null,
            period = 'all' // 'all', 'week', 'month', 'year'
        } = options;

        let sessions = [...this.sessionHistory];

        // Apply filters
        if (language) {
            sessions = sessions.filter(entry => entry.studyBookLanguage === language);
        }

        // Apply date filters
        let fromDate = dateFrom ? new Date(dateFrom) : null;
        let toDate = dateTo ? new Date(dateTo) : null;

        // Set period-based date filters
        if (period !== 'all' && !fromDate) {
            const now = new Date();
            switch (period) {
                case 'week':
                    fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case 'year':
                    fromDate = new Date(now.getFullYear(), 0, 1);
                    break;
            }
        }

        if (fromDate) {
            sessions = sessions.filter(entry => new Date(entry.completedAt) >= fromDate);
        }

        if (toDate) {
            sessions = sessions.filter(entry => new Date(entry.completedAt) <= toDate);
        }

        if (sessions.length === 0) {
            return {
                totalSessions: 0,
                averageAccuracy: 0,
                bestAccuracy: 0,
                averageWpm: 0,
                bestWpm: 0,
                averageCpm: 0,
                bestCpm: 0,
                totalTime: '0m',
                totalCharacters: 0,
                languageBreakdown: {},
                progressTrend: []
            };
        }

        // Calculate statistics
        const totalSessions = sessions.length;
        const accuracies = sessions.map(s => s.accuracy);
        const wpms = sessions.map(s => s.wpm);
        const cpms = sessions.map(s => s.cpm);
        const durations = sessions.map(s => s.duration);

        const averageAccuracy = accuracies.reduce((sum, acc) => sum + acc, 0) / totalSessions;
        const bestAccuracy = Math.max(...accuracies);
        const averageWpm = wpms.reduce((sum, wpm) => sum + wpm, 0) / totalSessions;
        const bestWpm = Math.max(...wpms);
        const averageCpm = cpms.reduce((sum, cpm) => sum + cpm, 0) / totalSessions;
        const bestCpm = Math.max(...cpms);

        // Calculate total time
        const totalMinutes = durations.reduce((sum, duration) => {
            return sum + (duration.toMinutes ? duration.toMinutes() : 0);
        }, 0);

        const totalTime = this.formatDuration(totalMinutes);

        // Calculate total characters
        const totalCharacters = sessions.reduce((sum, session) => {
            return sum + (session.result.totalCharacters || 0);
        }, 0);

        // Language breakdown
        const languageBreakdown = {};
        sessions.forEach(session => {
            const lang = session.studyBookLanguage;
            if (!languageBreakdown[lang]) {
                languageBreakdown[lang] = {
                    sessions: 0,
                    averageAccuracy: 0,
                    averageWpm: 0,
                    totalTime: 0
                };
            }
            languageBreakdown[lang].sessions++;
            languageBreakdown[lang].averageAccuracy += session.accuracy;
            languageBreakdown[lang].averageWpm += session.wpm;
            languageBreakdown[lang].totalTime += session.duration.toMinutes ? session.duration.toMinutes() : 0;
        });

        // Calculate averages for each language
        Object.keys(languageBreakdown).forEach(lang => {
            const data = languageBreakdown[lang];
            data.averageAccuracy = data.averageAccuracy / data.sessions;
            data.averageWpm = data.averageWpm / data.sessions;
            data.totalTime = this.formatDuration(data.totalTime);
        });

        // Progress trend (last 10 sessions)
        const recentSessions = sessions.slice(0, 10).reverse();
        const progressTrend = recentSessions.map((session, index) => ({
            session: index + 1,
            accuracy: session.accuracy,
            wpm: session.wpm,
            date: session.completedAt
        }));

        return {
            totalSessions,
            averageAccuracy,
            bestAccuracy,
            averageWpm,
            bestWpm,
            averageCpm,
            bestCpm,
            totalTime,
            totalCharacters,
            languageBreakdown,
            progressTrend
        };
    }

    /**
     * Subscribes to current session changes
     * @param {Function} callback - Callback function to call when session changes
     * @returns {Function} Unsubscribe function
     */
    subscribeToSessionChanges(callback) {
        return this.stateManager.subscribe('currentSession', callback);
    }

    /**
     * Subscribes to current study book changes
     * @param {Function} callback - Callback function to call when study book changes
     * @returns {Function} Unsubscribe function
     */
    subscribeToStudyBookChanges(callback) {
        return this.stateManager.subscribe('currentStudyBook', callback);
    }

    /**
     * Recovers a session from persisted state
     * @returns {TypingSession|null} Recovered session or null if none found
     */
    recoverSession() {
        try {
            const sessionData = localStorage.getItem('currentSession');
            if (!sessionData) return null;

            const parsed = JSON.parse(sessionData);
            
            // Check if session is recent (within last hour)
            const sessionAge = Date.now() - parsed.timestamp;
            const maxAge = 60 * 60 * 1000; // 1 hour
            
            if (sessionAge > maxAge) {
                this.clearPersistedSession();
                return null;
            }

            // Reconstruct session (this would need to be implemented based on TypingSession structure)
            // For now, return null as we'd need the actual TypingSession constructor
            return null;
            
        } catch (error) {
            console.warn('Failed to recover session:', error);
            this.clearPersistedSession();
            return null;
        }
    }

    /**
     * Clears session history
     */
    clearHistory() {
        this.sessionHistory = [];
        this.persistSessionHistory();
    }

    /**
     * Exports session history as JSON
     * @returns {string} JSON string of session history
     */
    exportHistory() {
        return JSON.stringify(this.sessionHistory, null, 2);
    }

    /**
     * Imports session history from JSON
     * @param {string} jsonData - JSON string of session history
     * @returns {boolean} True if import was successful
     */
    importHistory(jsonData) {
        try {
            const imported = JSON.parse(jsonData);
            if (Array.isArray(imported)) {
                this.sessionHistory = imported;
                this.persistSessionHistory();
                return true;
            }
        } catch (error) {
            console.error('Failed to import session history:', error);
        }
        return false;
    }

    /**
     * Private helper methods
     */

    /**
     * Persists current session to localStorage
     * @param {TypingSession} session - Session to persist
     * @private
     */
    persistCurrentSession(session) {
        try {
            const sessionData = {
                id: session.id,
                studyBookId: session.studyBook.id,
                startTime: session.startTime,
                settings: session.settings,
                timestamp: Date.now()
            };
            
            localStorage.setItem('currentSession', JSON.stringify(sessionData));
        } catch (error) {
            console.warn('Failed to persist current session:', error);
        }
    }

    /**
     * Clears persisted session from localStorage
     * @private
     */
    clearPersistedSession() {
        try {
            localStorage.removeItem('currentSession');
        } catch (error) {
            console.warn('Failed to clear persisted session:', error);
        }
    }

    /**
     * Persists session history to localStorage
     * @private
     */
    persistSessionHistory() {
        try {
            localStorage.setItem('sessionHistory', JSON.stringify(this.sessionHistory));
        } catch (error) {
            console.warn('Failed to persist session history:', error);
        }
    }

    /**
     * Loads session history from localStorage
     * @private
     */
    loadSessionHistory() {
        try {
            const stored = localStorage.getItem('sessionHistory');
            if (stored) {
                this.sessionHistory = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Failed to load session history:', error);
            this.sessionHistory = [];
        }
    }

    /**
     * Formats duration in minutes to human-readable string
     * @param {number} minutes - Duration in minutes
     * @returns {string} Formatted duration string
     * @private
     */
    formatDuration(minutes) {
        if (minutes < 60) {
            return `${Math.round(minutes)}m`;
        }
        
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = Math.round(minutes % 60);
        
        if (hours < 24) {
            return `${hours}h ${remainingMinutes}m`;
        }
        
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        
        return `${days}d ${remainingHours}h ${remainingMinutes}m`;
    }

    /**
     * Initializes the repository
     */
    initialize() {
        // Load persisted session history
        this.loadSessionHistory();
        
        // Try to recover active session
        const recoveredSession = this.recoverSession();
        if (recoveredSession) {
            this.setCurrentSession(recoveredSession);
        }
    }
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SessionRepository;
} else if (typeof window !== 'undefined') {
    window.SessionRepository = SessionRepository;
}