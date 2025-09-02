/**
 * StudyBook Repository
 * Manages study book state and provides study book-related data access
 */
class StudyBookRepository {
    /**
     * Creates a new StudyBookRepository instance
     * @param {StateManager} stateManager - State manager instance
     */
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Gets all study books from state
     * @returns {StudyBook[]} Array of study books
     */
    getAll() {
        return this.stateManager.getStateValue('studyBooks') || [];
    }

    /**
     * Gets a study book by ID
     * @param {string} id - Study book ID
     * @returns {StudyBook|null} Study book or null if not found
     */
    getById(id) {
        const studyBooks = this.getAll();
        return studyBooks.find(book => book.id === id) || null;
    }

    /**
     * Gets study books by language
     * @param {string} language - Language to filter by
     * @returns {StudyBook[]} Array of study books for the language
     */
    getByLanguage(language) {
        const studyBooks = this.getAll();
        return studyBooks.filter(book => book.language === language);
    }

    /**
     * Gets study books by user ID
     * @param {string} userId - User ID to filter by
     * @returns {StudyBook[]} Array of study books for the user
     */
    getByUserId(userId) {
        const studyBooks = this.getAll();
        return studyBooks.filter(book => book.userId === userId);
    }

    /**
     * Searches study books by query
     * @param {string} query - Search query
     * @returns {StudyBook[]} Array of matching study books
     */
    search(query) {
        if (!query || query.trim() === '') {
            return this.getAll();
        }

        const searchTerm = query.toLowerCase().trim();
        const studyBooks = this.getAll();
        
        return studyBooks.filter(book => 
            book.language.toLowerCase().includes(searchTerm) ||
            book.question.toLowerCase().includes(searchTerm) ||
            (book.explanation && book.explanation.toLowerCase().includes(searchTerm))
        );
    }

    /**
     * Gets paginated study books
     * @param {Object} options - Pagination and filter options
     * @returns {Object} Paginated result with studyBooks and pagination info
     */
    getPaginated(options = {}) {
        const {
            page = 0,
            size = 10,
            language = null,
            userId = null,
            searchTerm = null,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = options;

        let studyBooks = this.getAll();

        // Apply filters
        if (language) {
            studyBooks = studyBooks.filter(book => book.language === language);
        }

        if (userId) {
            studyBooks = studyBooks.filter(book => book.userId === userId);
        }

        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            studyBooks = studyBooks.filter(book => 
                book.language.toLowerCase().includes(searchLower) ||
                book.question.toLowerCase().includes(searchLower) ||
                (book.explanation && book.explanation.toLowerCase().includes(searchLower))
            );
        }

        // Apply sorting
        studyBooks.sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];

            // Handle date sorting
            if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
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
        const totalElements = studyBooks.length;
        const totalPages = Math.ceil(totalElements / size);
        const startIndex = page * size;
        const endIndex = startIndex + size;
        const pageStudyBooks = studyBooks.slice(startIndex, endIndex);

        return {
            studyBooks: pageStudyBooks,
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
     * Sets all study books in state
     * @param {StudyBook[]} studyBooks - Array of study books
     */
    setStudyBooks(studyBooks) {
        this.stateManager.dispatch('SET_STUDY_BOOKS', studyBooks);
        this.updateCache('all', studyBooks);
    }

    /**
     * Adds a study book to state
     * @param {StudyBook} studyBook - Study book to add
     */
    add(studyBook) {
        this.stateManager.dispatch('ADD_STUDY_BOOK', studyBook);
        this.invalidateCache();
    }

    /**
     * Updates a study book in state
     * @param {StudyBook} studyBook - Updated study book
     */
    update(studyBook) {
        this.stateManager.dispatch('UPDATE_STUDY_BOOK', studyBook);
        this.invalidateCache();
    }

    /**
     * Removes a study book from state
     * @param {string} studyBookId - ID of study book to remove
     */
    remove(studyBookId) {
        this.stateManager.dispatch('REMOVE_STUDY_BOOK', studyBookId);
        this.invalidateCache();
    }

    /**
     * Gets available languages from current study books
     * @returns {string[]} Array of unique languages
     */
    getAvailableLanguages() {
        const studyBooks = this.getAll();
        const languages = [...new Set(studyBooks.map(book => book.language))];
        return languages.sort();
    }

    /**
     * Gets study book statistics
     * @returns {Object} Statistics about study books
     */
    getStatistics() {
        const studyBooks = this.getAll();
        const languages = this.getAvailableLanguages();
        
        const stats = {
            total: studyBooks.length,
            byLanguage: {},
            byDifficulty: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            systemProblems: studyBooks.filter(book => book.isSystemProblem).length,
            userProblems: studyBooks.filter(book => !book.isSystemProblem).length
        };

        // Count by language
        languages.forEach(language => {
            stats.byLanguage[language] = studyBooks.filter(book => book.language === language).length;
        });

        // Count by difficulty
        studyBooks.forEach(book => {
            const difficulty = book.getDifficultyLevel ? book.getDifficultyLevel() : 1;
            if (stats.byDifficulty.hasOwnProperty(difficulty)) {
                stats.byDifficulty[difficulty]++;
            }
        });

        return stats;
    }

    /**
     * Subscribes to study books state changes
     * @param {Function} callback - Callback function to call when study books change
     * @returns {Function} Unsubscribe function
     */
    subscribeToChanges(callback) {
        return this.stateManager.subscribe('studyBooks', callback);
    }

    /**
     * Gets random study books for a language
     * @param {string} language - Language to get random books for
     * @param {number} count - Number of random books to get
     * @returns {StudyBook[]} Array of random study books
     */
    getRandomByLanguage(language, count = 1) {
        const languageBooks = this.getByLanguage(language);
        
        if (languageBooks.length === 0) {
            return [];
        }

        // Shuffle array and take first 'count' items
        const shuffled = [...languageBooks].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    /**
     * Checks if a study book exists
     * @param {string} id - Study book ID
     * @returns {boolean} True if study book exists
     */
    exists(id) {
        return this.getById(id) !== null;
    }

    /**
     * Gets study books that match specific criteria
     * @param {Function} predicate - Function to test each study book
     * @returns {StudyBook[]} Array of matching study books
     */
    filter(predicate) {
        const studyBooks = this.getAll();
        return studyBooks.filter(predicate);
    }

    /**
     * Finds the first study book that matches criteria
     * @param {Function} predicate - Function to test each study book
     * @returns {StudyBook|null} First matching study book or null
     */
    find(predicate) {
        const studyBooks = this.getAll();
        return studyBooks.find(predicate) || null;
    }

    /**
     * Counts study books that match criteria
     * @param {Function} predicate - Function to test each study book (optional)
     * @returns {number} Count of matching study books
     */
    count(predicate = null) {
        const studyBooks = this.getAll();
        return predicate ? studyBooks.filter(predicate).length : studyBooks.length;
    }

    /**
     * Cache management methods
     */

    /**
     * Updates cache with data
     * @param {string} key - Cache key
     * @param {*} data - Data to cache
     * @private
     */
    updateCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Gets data from cache
     * @param {string} key - Cache key
     * @returns {*|null} Cached data or null if not found/expired
     * @private
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        const isExpired = Date.now() - cached.timestamp > this.cacheExpiry;
        if (isExpired) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    /**
     * Invalidates all cache entries
     * @private
     */
    invalidateCache() {
        this.cache.clear();
    }

    /**
     * Invalidates specific cache entry
     * @param {string} key - Cache key to invalidate
     * @private
     */
    invalidateCacheKey(key) {
        this.cache.delete(key);
    }

    /**
     * Persistence methods
     */

    /**
     * Persists study books to localStorage
     */
    persistToLocalStorage() {
        try {
            const studyBooks = this.getAll();
            localStorage.setItem('studyBooks', JSON.stringify(studyBooks));
        } catch (error) {
            console.warn('Failed to persist study books to localStorage:', error);
        }
    }

    /**
     * Loads study books from localStorage
     * @returns {StudyBook[]} Array of study books from localStorage
     */
    loadFromLocalStorage() {
        try {
            const stored = localStorage.getItem('studyBooks');
            if (stored) {
                const parsed = JSON.parse(stored);
                // Convert plain objects back to StudyBook instances
                return parsed.map(data => new StudyBook(
                    data.id,
                    data.language,
                    data.question,
                    data.explanation,
                    data.userId,
                    data.isSystemProblem,
                    data.createdAt,
                    data.updatedAt
                ));
            }
        } catch (error) {
            console.warn('Failed to load study books from localStorage:', error);
        }
        return [];
    }

    /**
     * Initializes the repository
     */
    initialize() {
        // Load persisted study books if state is empty
        const currentStudyBooks = this.getAll();
        if (currentStudyBooks.length === 0) {
            const persistedStudyBooks = this.loadFromLocalStorage();
            if (persistedStudyBooks.length > 0) {
                this.setStudyBooks(persistedStudyBooks);
            }
        }

        // Set up auto-persistence
        this.subscribeToChanges(() => {
            this.persistToLocalStorage();
        });
    }

    /**
     * Clears all study books
     */
    clear() {
        this.stateManager.dispatch('SET_STUDY_BOOKS', []);
        this.invalidateCache();
    }
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StudyBookRepository;
} else if (typeof window !== 'undefined') {
    window.StudyBookRepository = StudyBookRepository;
}