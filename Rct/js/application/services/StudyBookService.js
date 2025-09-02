/**
 * StudyBook Service
 * Coordinates study book-related operations and business logic
 */
class StudyBookService {
    /**
     * Creates a new StudyBookService instance
     * @param {Object} apiClient - API client for backend communication
     * @param {StudyBookRepository} studyBookRepository - Study book repository
     * @param {UserRepository} userRepository - User repository
     * @param {EventBus} eventBus - Event bus for application events
     */
    constructor(apiClient, studyBookRepository, userRepository, eventBus) {
        this.apiClient = apiClient;
        this.studyBookRepository = studyBookRepository;
        this.userRepository = userRepository;
        this.eventBus = eventBus;
    }

    /**
     * Creates a new study book
     * @param {StudyBook} studyBook - Study book to create
     * @returns {Promise<Object>} Creation result
     */
    async create(studyBook) {
        try {
            const currentUser = this.userRepository.getCurrentUser();
            
            if (!currentUser) {
                return { success: false, error: 'User not authenticated' };
            }

            if (currentUser.isGuest) {
                return { success: false, error: 'Guest users cannot create study books' };
            }

            // Validate study book
            studyBook.validate();

            // Emit creation attempt event
            await this.eventBus.emit('studybook:create:attempt', { 
                studyBook, 
                userId: currentUser.id 
            });

            // Call backend API
            const response = await this.apiClient.post('/studybooks', {
                language: studyBook.language,
                question: studyBook.question,
                explanation: studyBook.explanation
            });

            if (response.success) {
                // Create StudyBook instance from response
                const createdStudyBook = new StudyBook(
                    response.data.id,
                    response.data.language,
                    response.data.question,
                    response.data.explanation,
                    currentUser.id,
                    response.data.isSystemProblem || false,
                    response.data.createdAt,
                    response.data.updatedAt
                );

                // Add to repository
                this.studyBookRepository.add(createdStudyBook);

                // Emit successful creation event
                await this.eventBus.emit('studybook:create:success', { 
                    studyBook: createdStudyBook 
                });

                return {
                    success: true,
                    studyBook: createdStudyBook
                };
            } else {
                // Emit failed creation event
                await this.eventBus.emit('studybook:create:failure', { 
                    studyBook,
                    error: response.error 
                });

                return {
                    success: false,
                    error: response.error || 'Failed to create study book'
                };
            }

        } catch (error) {
            // Emit error event
            await this.eventBus.emit('studybook:create:error', { 
                studyBook,
                error: error.message 
            });

            return {
                success: false,
                error: error.message || 'An error occurred while creating study book'
            };
        }
    }

    /**
     * Updates an existing study book
     * @param {StudyBook} studyBook - Study book to update
     * @returns {Promise<Object>} Update result
     */
    async update(studyBook) {
        try {
            const currentUser = this.userRepository.getCurrentUser();
            
            if (!currentUser) {
                return { success: false, error: 'User not authenticated' };
            }

            if (currentUser.isGuest) {
                return { success: false, error: 'Guest users cannot update study books' };
            }

            // Check if user owns the study book
            if (!studyBook.belongsToUser(currentUser.id)) {
                return { success: false, error: 'You can only update your own study books' };
            }

            // Validate study book
            studyBook.validate();

            // Emit update attempt event
            await this.eventBus.emit('studybook:update:attempt', { 
                studyBook, 
                userId: currentUser.id 
            });

            // Call backend API
            const response = await this.apiClient.put(`/studybooks/${studyBook.id}`, {
                language: studyBook.language,
                question: studyBook.question,
                explanation: studyBook.explanation
            });

            if (response.success) {
                // Update StudyBook instance from response
                const updatedStudyBook = new StudyBook(
                    response.data.id,
                    response.data.language,
                    response.data.question,
                    response.data.explanation,
                    currentUser.id,
                    response.data.isSystemProblem || false,
                    response.data.createdAt,
                    response.data.updatedAt
                );

                // Update in repository
                this.studyBookRepository.update(updatedStudyBook);

                // Emit successful update event
                await this.eventBus.emit('studybook:update:success', { 
                    studyBook: updatedStudyBook 
                });

                return {
                    success: true,
                    studyBook: updatedStudyBook
                };
            } else {
                // Emit failed update event
                await this.eventBus.emit('studybook:update:failure', { 
                    studyBook,
                    error: response.error 
                });

                return {
                    success: false,
                    error: response.error || 'Failed to update study book'
                };
            }

        } catch (error) {
            // Emit error event
            await this.eventBus.emit('studybook:update:error', { 
                studyBook,
                error: error.message 
            });

            return {
                success: false,
                error: error.message || 'An error occurred while updating study book'
            };
        }
    }

    /**
     * Deletes a study book
     * @param {string} studyBookId - ID of study book to delete
     * @returns {Promise<Object>} Deletion result
     */
    async delete(studyBookId) {
        try {
            const currentUser = this.userRepository.getCurrentUser();
            
            if (!currentUser) {
                return { success: false, error: 'User not authenticated' };
            }

            if (currentUser.isGuest) {
                return { success: false, error: 'Guest users cannot delete study books' };
            }

            // Get study book from repository
            const studyBook = this.studyBookRepository.getById(studyBookId);
            if (!studyBook) {
                return { success: false, error: 'Study book not found' };
            }

            // Check if user owns the study book
            if (!studyBook.belongsToUser(currentUser.id)) {
                return { success: false, error: 'You can only delete your own study books' };
            }

            // Emit deletion attempt event
            await this.eventBus.emit('studybook:delete:attempt', { 
                studyBookId, 
                userId: currentUser.id 
            });

            // Call backend API
            const response = await this.apiClient.delete(`/studybooks/${studyBookId}`);

            if (response.success) {
                // Remove from repository
                this.studyBookRepository.remove(studyBookId);

                // Emit successful deletion event
                await this.eventBus.emit('studybook:delete:success', { 
                    studyBookId 
                });

                return { success: true };
            } else {
                // Emit failed deletion event
                await this.eventBus.emit('studybook:delete:failure', { 
                    studyBookId,
                    error: response.error 
                });

                return {
                    success: false,
                    error: response.error || 'Failed to delete study book'
                };
            }

        } catch (error) {
            // Emit error event
            await this.eventBus.emit('studybook:delete:error', { 
                studyBookId,
                error: error.message 
            });

            return {
                success: false,
                error: error.message || 'An error occurred while deleting study book'
            };
        }
    }

    /**
     * Gets study books with filtering and pagination
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} Study books result
     */
    async getStudyBooks(params = {}) {
        try {
            const currentUser = this.userRepository.getCurrentUser();
            
            // Emit get study books attempt event
            await this.eventBus.emit('studybook:get:attempt', { params });

            // For guest users, only return cached study books
            if (!currentUser || currentUser.isGuest) {
                const result = this.studyBookRepository.getPaginated(params);
                
                // Emit successful get event
                await this.eventBus.emit('studybook:get:success', { 
                    studyBooks: result.studyBooks,
                    pagination: result.pagination 
                });

                return {
                    success: true,
                    studyBooks: result.studyBooks,
                    pagination: result.pagination
                };
            }

            // Build query parameters
            const queryParams = new URLSearchParams();
            
            if (params.page !== undefined) queryParams.append('page', params.page);
            if (params.size !== undefined) queryParams.append('size', params.size);
            if (params.language) queryParams.append('language', params.language);
            if (params.search) queryParams.append('search', params.search);
            if (params.userId) queryParams.append('userId', params.userId);

            // Call backend API
            const response = await this.apiClient.get(`/studybooks?${queryParams.toString()}`);

            if (response.success) {
                // Convert response data to StudyBook instances
                const studyBooks = response.data.content.map(data => new StudyBook(
                    data.id,
                    data.language,
                    data.question,
                    data.explanation,
                    data.userId,
                    data.isSystemProblem || false,
                    data.createdAt,
                    data.updatedAt
                ));

                const pagination = {
                    page: response.data.page,
                    size: response.data.size,
                    totalElements: response.data.totalElements,
                    totalPages: response.data.totalPages,
                    hasNext: !response.data.last,
                    hasPrevious: response.data.page > 0
                };

                // Update repository with fresh data
                if (params.page === 0 || params.page === undefined) {
                    this.studyBookRepository.setStudyBooks(studyBooks);
                }

                // Emit successful get event
                await this.eventBus.emit('studybook:get:success', { 
                    studyBooks,
                    pagination 
                });

                return {
                    success: true,
                    studyBooks,
                    pagination
                };
            } else {
                // Emit failed get event
                await this.eventBus.emit('studybook:get:failure', { 
                    params,
                    error: response.error 
                });

                return {
                    success: false,
                    error: response.error || 'Failed to get study books'
                };
            }

        } catch (error) {
            // Emit error event
            await this.eventBus.emit('studybook:get:error', { 
                params,
                error: error.message 
            });

            return {
                success: false,
                error: error.message || 'An error occurred while getting study books'
            };
        }
    }

    /**
     * Gets a random study book for a specific language
     * @param {string} language - Language to get random study book for
     * @returns {Promise<Object>} Random study book result
     */
    async getRandomStudyBook(language) {
        try {
            // Emit get random study book attempt event
            await this.eventBus.emit('studybook:random:attempt', { language });

            // Try to get from local repository first
            const localStudyBooks = this.studyBookRepository.getRandomByLanguage(language, 1);
            if (localStudyBooks.length > 0) {
                const studyBook = localStudyBooks[0];
                
                // Emit successful get event
                await this.eventBus.emit('studybook:random:success', { studyBook });
                
                return {
                    success: true,
                    studyBook
                };
            }

            // If not found locally, try backend API
            const response = await this.apiClient.get(`/studybooks/random?language=${encodeURIComponent(language)}`);

            if (response.success && response.data) {
                const studyBook = new StudyBook(
                    response.data.id,
                    response.data.language,
                    response.data.question,
                    response.data.explanation,
                    response.data.userId,
                    response.data.isSystemProblem || false,
                    response.data.createdAt,
                    response.data.updatedAt
                );

                // Add to repository for future use
                this.studyBookRepository.add(studyBook);

                // Emit successful get event
                await this.eventBus.emit('studybook:random:success', { studyBook });

                return {
                    success: true,
                    studyBook
                };
            } else {
                // Emit failed get event
                await this.eventBus.emit('studybook:random:failure', { 
                    language,
                    error: response.error 
                });

                return {
                    success: false,
                    error: response.error || 'No study books found for the specified language'
                };
            }

        } catch (error) {
            // Emit error event
            await this.eventBus.emit('studybook:random:error', { 
                language,
                error: error.message 
            });

            return {
                success: false,
                error: error.message || 'An error occurred while getting random study book'
            };
        }
    }

    /**
     * Gets available languages
     * @returns {Promise<string[]>} Array of available languages
     */
    async getAvailableLanguages() {
        try {
            // Try to get from local repository first
            const localLanguages = this.studyBookRepository.getAvailableLanguages();
            if (localLanguages.length > 0) {
                return localLanguages;
            }

            // If not found locally, try backend API
            const response = await this.apiClient.get('/studybooks/languages');

            if (response.success && response.data) {
                return response.data;
            } else {
                // Return default languages as fallback
                return ['JavaScript', 'Python', 'Java', 'SQL', 'HTML', 'CSS'];
            }

        } catch (error) {
            console.warn('Failed to get available languages:', error);
            // Return default languages as fallback
            return ['JavaScript', 'Python', 'Java', 'SQL', 'HTML', 'CSS'];
        }
    }

    /**
     * Searches study books
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Promise<Object>} Search result
     */
    async searchStudyBooks(query, options = {}) {
        try {
            const {
                language = null,
                page = 0,
                size = 10
            } = options;

            // Emit search attempt event
            await this.eventBus.emit('studybook:search:attempt', { query, options });

            // Build query parameters
            const queryParams = new URLSearchParams();
            queryParams.append('q', query);
            queryParams.append('page', page);
            queryParams.append('size', size);
            
            if (language) {
                queryParams.append('language', language);
            }

            // Call backend API
            const response = await this.apiClient.get(`/studybooks/search?${queryParams.toString()}`);

            if (response.success) {
                // Convert response data to StudyBook instances
                const studyBooks = response.data.content.map(data => new StudyBook(
                    data.id,
                    data.language,
                    data.question,
                    data.explanation,
                    data.userId,
                    data.isSystemProblem || false,
                    data.createdAt,
                    data.updatedAt
                ));

                const pagination = {
                    page: response.data.page,
                    size: response.data.size,
                    totalElements: response.data.totalElements,
                    totalPages: response.data.totalPages,
                    hasNext: !response.data.last,
                    hasPrevious: response.data.page > 0
                };

                // Emit successful search event
                await this.eventBus.emit('studybook:search:success', { 
                    query,
                    studyBooks,
                    pagination 
                });

                return {
                    success: true,
                    studyBooks,
                    pagination
                };
            } else {
                // Emit failed search event
                await this.eventBus.emit('studybook:search:failure', { 
                    query,
                    error: response.error 
                });

                return {
                    success: false,
                    error: response.error || 'Search failed'
                };
            }

        } catch (error) {
            // Emit error event
            await this.eventBus.emit('studybook:search:error', { 
                query,
                error: error.message 
            });

            return {
                success: false,
                error: error.message || 'An error occurred during search'
            };
        }
    }

    /**
     * Gets study book statistics
     * @returns {Promise<Object>} Statistics result
     */
    async getStatistics() {
        try {
            const currentUser = this.userRepository.getCurrentUser();
            
            // Get local statistics
            const localStats = this.studyBookRepository.getStatistics();

            // If user is authenticated, get server statistics
            if (currentUser && !currentUser.isGuest) {
                try {
                    const response = await this.apiClient.get('/studybooks/statistics');
                    if (response.success) {
                        return {
                            success: true,
                            statistics: response.data
                        };
                    }
                } catch (error) {
                    console.warn('Failed to get server statistics:', error);
                }
            }

            return {
                success: true,
                statistics: localStats
            };

        } catch (error) {
            return {
                success: false,
                error: error.message || 'An error occurred while getting statistics'
            };
        }
    }

    /**
     * Validates a study book before creation/update
     * @param {Object} studyBookData - Study book data to validate
     * @returns {ValidationResult} Validation result
     */
    validateStudyBook(studyBookData) {
        try {
            // Create temporary StudyBook instance for validation
            const tempStudyBook = new StudyBook(
                null,
                studyBookData.language,
                studyBookData.question,
                studyBookData.explanation
            );
            
            tempStudyBook.validate();
            return ValidationResult.success();
            
        } catch (error) {
            return ValidationResult.failure([new ValidationError(error.message)]);
        }
    }

    /**
     * Initializes the study book service
     */
    initialize() {
        // Load initial study books if repository is empty
        this.loadInitialStudyBooks();
    }

    /**
     * Loads initial study books if repository is empty
     * @private
     */
    async loadInitialStudyBooks() {
        const currentStudyBooks = this.studyBookRepository.getAll();
        if (currentStudyBooks.length === 0) {
            // Try to load from server
            await this.getStudyBooks({ page: 0, size: 20 });
        }
    }
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StudyBookService;
} else if (typeof window !== 'undefined') {
    window.StudyBookService = StudyBookService;
}