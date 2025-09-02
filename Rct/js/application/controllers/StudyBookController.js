/**
 * StudyBook Controller
 * Coordinates study book management UI interactions and business logic
 */
class StudyBookController {
    /**
     * Creates a new StudyBookController instance
     * @param {Object} studyBookService - Study book service
     * @param {Object} studyBookRepository - Study book repository for state management
     * @param {Object} userRepository - User repository for current user
     * @param {Object} errorHandler - Error handling service
     */
    constructor(studyBookService, studyBookRepository, userRepository, errorHandler) {
        this.studyBookService = studyBookService;
        this.studyBookRepository = studyBookRepository;
        this.userRepository = userRepository;
        this.errorHandler = errorHandler;
        this.eventListeners = new Map();
        this.currentPage = 0;
        this.pageSize = 10;
        this.currentFilter = { language: '', searchTerm: '' };
    }

    /**
     * Initializes the study book controller
     */
    initialize() {
        this.setupEventListeners();
        this.loadAvailableLanguages();
        this.loadStudyBooks();
    }

    /**
     * Sets up event listeners for study book management
     * @private
     */
    setupEventListeners() {
        // Create study book form
        const createForm = document.getElementById('create-studybook-form');
        if (createForm) {
            const createHandler = (event) => this.handleCreateStudyBook(event);
            createForm.addEventListener('submit', createHandler);
            this.eventListeners.set('create-form', { element: createForm, event: 'submit', handler: createHandler });
        }

        // Update study book form
        const updateForm = document.getElementById('update-studybook-form');
        if (updateForm) {
            const updateHandler = (event) => this.handleUpdateStudyBook(event);
            updateForm.addEventListener('submit', updateHandler);
            this.eventListeners.set('update-form', { element: updateForm, event: 'submit', handler: updateHandler });
        }

        // Language filter
        const languageFilter = document.getElementById('language-filter');
        if (languageFilter) {
            const filterHandler = (event) => this.handleLanguageFilter(event);
            languageFilter.addEventListener('change', filterHandler);
            this.eventListeners.set('language-filter', { element: languageFilter, event: 'change', handler: filterHandler });
        }

        // Search input
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            const searchHandler = (event) => this.handleSearch(event);
            searchInput.addEventListener('input', this.debounce(searchHandler, 300));
            this.eventListeners.set('search-input', { element: searchInput, event: 'input', handler: searchHandler });
        }

        // Pagination buttons
        const prevButton = document.getElementById('prev-page-btn');
        if (prevButton) {
            const prevHandler = () => this.handlePreviousPage();
            prevButton.addEventListener('click', prevHandler);
            this.eventListeners.set('prev-page-btn', { element: prevButton, event: 'click', handler: prevHandler });
        }

        const nextButton = document.getElementById('next-page-btn');
        if (nextButton) {
            const nextHandler = () => this.handleNextPage();
            nextButton.addEventListener('click', nextHandler);
            this.eventListeners.set('next-page-btn', { element: nextButton, event: 'click', handler: nextHandler });
        }
    }

    /**
     * Handles study book creation
     * @param {Event} event - Form submission event
     */
    async handleCreateStudyBook(event) {
        event.preventDefault();
        
        try {
            const formData = new FormData(event.target);
            const studyBookData = {
                language: formData.get('language')?.trim(),
                question: formData.get('question')?.trim(),
                explanation: formData.get('explanation')?.trim() || ''
            };

            // Validate input
            const validationResult = this.validateStudyBookData(studyBookData);
            if (!validationResult.isValid) {
                this.displayValidationErrors(validationResult.errors);
                return;
            }

            // Show loading state
            this.setLoadingState(true);

            // Create study book
            const currentUser = this.userRepository.getCurrentUser();
            const studyBook = new StudyBook(
                null,
                studyBookData.language,
                studyBookData.question,
                studyBookData.explanation,
                currentUser?.id
            );

            const result = await this.studyBookService.create(studyBook);
            
            if (result.success) {
                // Add to local repository
                this.studyBookRepository.add(result.studyBook);
                
                // Clear form and show success
                event.target.reset();
                this.clearErrors();
                this.displaySuccessMessage('Study book created successfully!');
                
                // Refresh the list
                this.loadStudyBooks();
            } else {
                this.displayError(result.error || 'Failed to create study book');
            }

        } catch (error) {
            this.errorHandler.handle(error, { context: 'create_studybook' });
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Handles study book update
     * @param {Event} event - Form submission event
     */
    async handleUpdateStudyBook(event) {
        event.preventDefault();
        
        try {
            const formData = new FormData(event.target);
            const studyBookId = formData.get('id');
            const studyBookData = {
                language: formData.get('language')?.trim(),
                question: formData.get('question')?.trim(),
                explanation: formData.get('explanation')?.trim() || ''
            };

            // Validate input
            const validationResult = this.validateStudyBookData(studyBookData);
            if (!validationResult.isValid) {
                this.displayValidationErrors(validationResult.errors);
                return;
            }

            // Show loading state
            this.setLoadingState(true);

            // Get existing study book
            const existingStudyBook = this.studyBookRepository.getById(studyBookId);
            if (!existingStudyBook) {
                this.displayError('Study book not found');
                return;
            }

            // Update study book
            existingStudyBook.update(
                studyBookData.language,
                studyBookData.question,
                studyBookData.explanation
            );

            const result = await this.studyBookService.update(existingStudyBook);
            
            if (result.success) {
                // Update local repository
                this.studyBookRepository.update(result.studyBook);
                
                // Clear form and show success
                this.clearUpdateForm();
                this.displaySuccessMessage('Study book updated successfully!');
                
                // Refresh the list
                this.loadStudyBooks();
            } else {
                this.displayError(result.error || 'Failed to update study book');
            }

        } catch (error) {
            this.errorHandler.handle(error, { context: 'update_studybook' });
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Handles study book deletion
     * @param {string} studyBookId - ID of study book to delete
     */
    async handleDeleteStudyBook(studyBookId) {
        if (!confirm('Are you sure you want to delete this study book?')) {
            return;
        }

        try {
            // Show loading state
            this.setLoadingState(true);

            const result = await this.studyBookService.delete(studyBookId);
            
            if (result.success) {
                // Remove from local repository
                this.studyBookRepository.remove(studyBookId);
                
                // Show success message
                this.displaySuccessMessage('Study book deleted successfully!');
                
                // Refresh the list
                this.loadStudyBooks();
            } else {
                this.displayError(result.error || 'Failed to delete study book');
            }

        } catch (error) {
            this.errorHandler.handle(error, { context: 'delete_studybook' });
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Handles language filter change
     * @param {Event} event - Change event
     */
    handleLanguageFilter(event) {
        this.currentFilter.language = event.target.value;
        this.currentPage = 0;
        this.loadStudyBooks();
    }

    /**
     * Handles search input
     * @param {Event} event - Input event
     */
    handleSearch(event) {
        this.currentFilter.searchTerm = event.target.value.trim();
        this.currentPage = 0;
        this.loadStudyBooks();
    }

    /**
     * Handles previous page navigation
     */
    handlePreviousPage() {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.loadStudyBooks();
        }
    }

    /**
     * Handles next page navigation
     */
    handleNextPage() {
        this.currentPage++;
        this.loadStudyBooks();
    }

    /**
     * Loads available languages for the filter dropdown
     * @private
     */
    async loadAvailableLanguages() {
        try {
            const languages = await this.studyBookService.getAvailableLanguages();
            this.populateLanguageFilter(languages);
        } catch (error) {
            console.warn('Failed to load languages:', error);
            // Use default languages as fallback
            this.populateLanguageFilter(['JavaScript', 'Python', 'Java', 'SQL', 'HTML', 'CSS']);
        }
    }

    /**
     * Populates the language filter dropdown
     * @param {string[]} languages - Available languages
     * @private
     */
    populateLanguageFilter(languages) {
        const languageFilter = document.getElementById('language-filter');
        if (!languageFilter) return;

        // Clear existing options except "All"
        const allOption = languageFilter.querySelector('option[value=""]');
        languageFilter.innerHTML = '';
        if (allOption) {
            languageFilter.appendChild(allOption);
        } else {
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'All Languages';
            languageFilter.appendChild(defaultOption);
        }

        // Add language options
        languages.forEach(language => {
            const option = document.createElement('option');
            option.value = language;
            option.textContent = language;
            languageFilter.appendChild(option);
        });
    }

    /**
     * Loads study books based on current filter and pagination
     * @private
     */
    async loadStudyBooks() {
        try {
            // Show loading state
            this.setListLoadingState(true);

            const currentUser = this.userRepository.getCurrentUser();
            const params = {
                page: this.currentPage,
                size: this.pageSize,
                language: this.currentFilter.language || undefined,
                search: this.currentFilter.searchTerm || undefined,
                userId: currentUser?.id
            };

            const result = await this.studyBookService.getStudyBooks(params);
            
            if (result.success) {
                // Update local repository
                this.studyBookRepository.setStudyBooks(result.studyBooks);
                
                // Render study books
                this.renderStudyBookList(result.studyBooks, result.pagination);
            } else {
                this.displayError(result.error || 'Failed to load study books');
            }

        } catch (error) {
            this.errorHandler.handle(error, { context: 'load_studybooks' });
        } finally {
            this.setListLoadingState(false);
        }
    }

    /**
     * Renders the study book list in the UI
     * @param {StudyBook[]} studyBooks - Array of study books
     * @param {Object} pagination - Pagination information
     * @private
     */
    renderStudyBookList(studyBooks, pagination) {
        const listContainer = document.getElementById('studybook-list');
        if (!listContainer) return;

        if (studyBooks.length === 0) {
            listContainer.innerHTML = '<div class="no-results">No study books found.</div>';
            this.updatePaginationControls(pagination);
            return;
        }

        const listHTML = studyBooks.map(studyBook => this.renderStudyBookItem(studyBook)).join('');
        listContainer.innerHTML = listHTML;

        // Add event listeners for action buttons
        this.setupStudyBookItemListeners();

        // Update pagination controls
        this.updatePaginationControls(pagination);
    }

    /**
     * Renders a single study book item
     * @param {StudyBook} studyBook - Study book to render
     * @returns {string} HTML string for the study book item
     * @private
     */
    renderStudyBookItem(studyBook) {
        const currentUser = this.userRepository.getCurrentUser();
        const canEdit = studyBook.belongsToUser(currentUser?.id);
        const difficultyLevel = studyBook.getDifficultyLevel();
        const estimatedTime = studyBook.getEstimatedTypingTime();

        return `
            <div class="studybook-item" data-id="${studyBook.id}">
                <div class="studybook-header">
                    <span class="language-tag">${this.escapeHtml(studyBook.language)}</span>
                    <span class="difficulty-badge difficulty-${difficultyLevel}">Level ${difficultyLevel}</span>
                    <span class="time-estimate">${Math.ceil(estimatedTime / 60)}min</span>
                </div>
                <div class="studybook-content">
                    <div class="question-preview">
                        <pre><code>${this.escapeHtml(this.truncateText(studyBook.question, 200))}</code></pre>
                    </div>
                    ${studyBook.explanation ? `
                        <div class="explanation-preview">
                            <strong>Explanation:</strong> ${this.escapeHtml(this.truncateText(studyBook.explanation, 100))}
                        </div>
                    ` : ''}
                </div>
                <div class="studybook-actions">
                    <button class="btn btn-primary practice-btn" data-id="${studyBook.id}">
                        Practice
                    </button>
                    ${canEdit ? `
                        <button class="btn btn-secondary edit-btn" data-id="${studyBook.id}">
                            Edit
                        </button>
                        <button class="btn btn-danger delete-btn" data-id="${studyBook.id}">
                            Delete
                        </button>
                    ` : ''}
                </div>
                <div class="studybook-meta">
                    <small>
                        Created: ${new Date(studyBook.createdAt).toLocaleDateString()}
                        ${studyBook.isSystemProblem ? ' (System)' : ' (User)'}
                    </small>
                </div>
            </div>
        `;
    }

    /**
     * Sets up event listeners for study book item actions
     * @private
     */
    setupStudyBookItemListeners() {
        // Practice buttons
        document.querySelectorAll('.practice-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const studyBookId = event.target.dataset.id;
                this.handlePracticeStudyBook(studyBookId);
            });
        });

        // Edit buttons
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const studyBookId = event.target.dataset.id;
                this.handleEditStudyBook(studyBookId);
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const studyBookId = event.target.dataset.id;
                this.handleDeleteStudyBook(studyBookId);
            });
        });
    }

    /**
     * Handles practice study book action
     * @param {string} studyBookId - ID of study book to practice
     */
    handlePracticeStudyBook(studyBookId) {
        // Store the selected study book for practice
        sessionStorage.setItem('practiceStudyBookId', studyBookId);
        
        // Navigate to typing practice page
        window.location.href = 'typing-practice.html';
    }

    /**
     * Handles edit study book action
     * @param {string} studyBookId - ID of study book to edit
     */
    handleEditStudyBook(studyBookId) {
        const studyBook = this.studyBookRepository.getById(studyBookId);
        if (!studyBook) {
            this.displayError('Study book not found');
            return;
        }

        // Populate update form
        this.populateUpdateForm(studyBook);
        
        // Show update form (assuming it's initially hidden)
        const updateForm = document.getElementById('update-studybook-form');
        if (updateForm) {
            updateForm.style.display = 'block';
            updateForm.scrollIntoView({ behavior: 'smooth' });
        }
    }

    /**
     * Populates the update form with study book data
     * @param {StudyBook} studyBook - Study book to edit
     * @private
     */
    populateUpdateForm(studyBook) {
        const form = document.getElementById('update-studybook-form');
        if (!form) return;

        const idField = form.querySelector('[name="id"]');
        const languageField = form.querySelector('[name="language"]');
        const questionField = form.querySelector('[name="question"]');
        const explanationField = form.querySelector('[name="explanation"]');

        if (idField) idField.value = studyBook.id;
        if (languageField) languageField.value = studyBook.language;
        if (questionField) questionField.value = studyBook.question;
        if (explanationField) explanationField.value = studyBook.explanation;
    }

    /**
     * Clears the update form
     * @private
     */
    clearUpdateForm() {
        const form = document.getElementById('update-studybook-form');
        if (form) {
            form.reset();
            form.style.display = 'none';
        }
    }

    /**
     * Updates pagination controls
     * @param {Object} pagination - Pagination information
     * @private
     */
    updatePaginationControls(pagination) {
        const prevButton = document.getElementById('prev-page-btn');
        const nextButton = document.getElementById('next-page-btn');
        const pageInfo = document.getElementById('page-info');

        if (prevButton) {
            prevButton.disabled = this.currentPage === 0;
        }

        if (nextButton) {
            nextButton.disabled = !pagination || this.currentPage >= pagination.totalPages - 1;
        }

        if (pageInfo && pagination) {
            pageInfo.textContent = `Page ${this.currentPage + 1} of ${pagination.totalPages} (${pagination.totalElements} total)`;
        }
    }

    /**
     * Validates study book data
     * @param {Object} studyBookData - Study book data to validate
     * @returns {ValidationResult} Validation result
     * @private
     */
    validateStudyBookData(studyBookData) {
        try {
            // Use StudyBook validation
            StudyBook.validate(studyBookData);
            
            // Additional UI-specific validation
            const errors = [];
            
            if (studyBookData.question.length > 5000) {
                errors.push(ValidationError.invalidLength('question', null, 5000, studyBookData.question));
            }
            
            return errors.length > 0 ? ValidationResult.failure(errors) : ValidationResult.success();
        } catch (error) {
            return ValidationResult.failure([new ValidationError(error.message)]);
        }
    }

    /**
     * Utility methods
     */
    
    displayValidationErrors(errors) {
        // Implementation similar to AuthController
        this.clearErrors();
        errors.forEach(error => {
            const fieldElement = document.querySelector(`[name="${error.field}"]`);
            if (fieldElement) {
                fieldElement.classList.add('error');
                let errorElement = fieldElement.parentNode.querySelector('.error-message');
                if (!errorElement) {
                    errorElement = document.createElement('div');
                    errorElement.className = 'error-message';
                    fieldElement.parentNode.appendChild(errorElement);
                }
                errorElement.textContent = error.message;
            }
        });
    }

    displayError(message) {
        const errorContainer = document.getElementById('error-container');
        if (errorContainer) {
            errorContainer.textContent = message;
            errorContainer.style.display = 'block';
        }
    }

    displaySuccessMessage(message) {
        const successContainer = document.getElementById('success-container');
        if (successContainer) {
            successContainer.textContent = message;
            successContainer.style.display = 'block';
            setTimeout(() => {
                successContainer.style.display = 'none';
            }, 3000);
        }
    }

    clearErrors() {
        document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
        document.querySelectorAll('.error-message').forEach(el => el.remove());
        const errorContainer = document.getElementById('error-container');
        if (errorContainer) {
            errorContainer.style.display = 'none';
        }
    }

    setLoadingState(isLoading) {
        const submitButtons = document.querySelectorAll('button[type="submit"]');
        submitButtons.forEach(button => {
            button.disabled = isLoading;
            button.textContent = isLoading ? 'Loading...' : (button.dataset.originalText || button.textContent);
        });
    }

    setListLoadingState(isLoading) {
        const listContainer = document.getElementById('studybook-list');
        if (listContainer) {
            if (isLoading) {
                listContainer.innerHTML = '<div class="loading">Loading study books...</div>';
            }
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Cleans up event listeners
     */
    destroy() {
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners.clear();
    }
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StudyBookController;
} else if (typeof window !== 'undefined') {
    window.StudyBookController = StudyBookController;
}