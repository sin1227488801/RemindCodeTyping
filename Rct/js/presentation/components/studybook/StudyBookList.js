/**
 * StudyBookList Component
 * Reusable component for displaying and managing a list of study books
 */
class StudyBookList {
    /**
     * Creates a new StudyBookList instance
     * @param {HTMLElement} container - Container element for the list
     * @param {Object} options - Configuration options
     */
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            showActions: true,
            showLanguageFilter: true,
            showSearch: true,
            showPagination: true,
            itemsPerPage: 10,
            allowEdit: true,
            allowDelete: true,
            allowPreview: true,
            ...options
        };
        this.eventHandlers = new Map();
        this.studyBooks = [];
        this.filteredStudyBooks = [];
        this.currentPage = 1;
        this.currentLanguageFilter = '';
        this.currentSearchQuery = '';
        this.isLoading = false;
    }

    /**
     * Renders the study book list
     */
    render() {
        this.container.innerHTML = this.getListHTML();
        this.attachEventListeners();
        this.renderStudyBooks();
    }

    /**
     * Gets the HTML structure for the study book list
     * @returns {string} HTML string
     * @private
     */
    getListHTML() {
        return `
            <div class="studybook-list">
                <div class="list-header">
                    <h2>学習帳一覧</h2>
                    <div class="list-actions">
                        <button type="button" class="btn btn-primary" id="add-studybook-btn">
                            <span class="btn-icon">+</span>
                            新規作成
                        </button>
                    </div>
                </div>
                
                ${this.options.showSearch || this.options.showLanguageFilter ? `
                    <div class="list-filters">
                        ${this.options.showSearch ? `
                            <div class="filter-group">
                                <label for="search-input" class="filter-label">検索</label>
                                <input 
                                    type="text" 
                                    id="search-input" 
                                    class="filter-input" 
                                    placeholder="問題文で検索..."
                                >
                            </div>
                        ` : ''}
                        
                        ${this.options.showLanguageFilter ? `
                            <div class="filter-group">
                                <label for="language-filter" class="filter-label">言語</label>
                                <select id="language-filter" class="filter-select">
                                    <option value="">すべて</option>
                                    <!-- Options will be populated dynamically -->
                                </select>
                            </div>
                        ` : ''}
                        
                        <div class="filter-group">
                            <button type="button" class="btn btn-secondary" id="clear-filters-btn">
                                フィルタクリア
                            </button>
                        </div>
                    </div>
                ` : ''}
                
                <div class="list-content">
                    <div class="loading-container" id="loading-container" style="display: none;">
                        <div class="loading-spinner"></div>
                        <span>読み込み中...</span>
                    </div>
                    
                    <div class="empty-state" id="empty-state" style="display: none;">
                        <div class="empty-icon">📚</div>
                        <h3>学習帳がありません</h3>
                        <p>新しい学習帳を作成して、タイピング練習を始めましょう。</p>
                        <button type="button" class="btn btn-primary" id="empty-add-btn">
                            新規作成
                        </button>
                    </div>
                    
                    <div class="studybook-grid" id="studybook-grid">
                        <!-- Study books will be rendered here -->
                    </div>
                </div>
                
                ${this.options.showPagination ? `
                    <div class="list-pagination" id="pagination-container" style="display: none;">
                        <button type="button" class="btn btn-secondary" id="prev-page-btn" disabled>
                            前へ
                        </button>
                        <span class="pagination-info" id="pagination-info">
                            1 / 1 ページ
                        </span>
                        <button type="button" class="btn btn-secondary" id="next-page-btn" disabled>
                            次へ
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Attaches event listeners to list elements
     * @private
     */
    attachEventListeners() {
        const addBtn = this.container.querySelector('#add-studybook-btn');
        const emptyAddBtn = this.container.querySelector('#empty-add-btn');
        const searchInput = this.container.querySelector('#search-input');
        const languageFilter = this.container.querySelector('#language-filter');
        const clearFiltersBtn = this.container.querySelector('#clear-filters-btn');
        const prevPageBtn = this.container.querySelector('#prev-page-btn');
        const nextPageBtn = this.container.querySelector('#next-page-btn');

        // Add buttons
        if (addBtn) {
            const addHandler = () => this.handleAddClick();
            addBtn.addEventListener('click', addHandler);
            this.eventHandlers.set('add-btn', { element: addBtn, event: 'click', handler: addHandler });
        }

        if (emptyAddBtn) {
            const emptyAddHandler = () => this.handleAddClick();
            emptyAddBtn.addEventListener('click', emptyAddHandler);
            this.eventHandlers.set('empty-add-btn', { element: emptyAddBtn, event: 'click', handler: emptyAddHandler });
        }

        // Search input
        if (searchInput) {
            const searchHandler = () => this.handleSearch();
            searchInput.addEventListener('input', searchHandler);
            this.eventHandlers.set('search-input', { element: searchInput, event: 'input', handler: searchHandler });
        }

        // Language filter
        if (languageFilter) {
            const filterHandler = () => this.handleLanguageFilter();
            languageFilter.addEventListener('change', filterHandler);
            this.eventHandlers.set('language-filter', { element: languageFilter, event: 'change', handler: filterHandler });
        }

        // Clear filters
        if (clearFiltersBtn) {
            const clearHandler = () => this.handleClearFilters();
            clearFiltersBtn.addEventListener('click', clearHandler);
            this.eventHandlers.set('clear-filters-btn', { element: clearFiltersBtn, event: 'click', handler: clearHandler });
        }

        // Pagination
        if (prevPageBtn) {
            const prevHandler = () => this.handlePreviousPage();
            prevPageBtn.addEventListener('click', prevHandler);
            this.eventHandlers.set('prev-page-btn', { element: prevPageBtn, event: 'click', handler: prevHandler });
        }

        if (nextPageBtn) {
            const nextHandler = () => this.handleNextPage();
            nextPageBtn.addEventListener('click', nextHandler);
            this.eventHandlers.set('next-page-btn', { element: nextPageBtn, event: 'click', handler: nextHandler });
        }
    }

    /**
     * Sets the study books data
     * @param {Array} studyBooks - Array of study book objects
     */
    setStudyBooks(studyBooks) {
        this.studyBooks = studyBooks || [];
        this.applyFilters();
        this.updateLanguageFilterOptions();
        this.renderStudyBooks();
    }

    /**
     * Adds a new study book to the list
     * @param {Object} studyBook - Study book object
     */
    addStudyBook(studyBook) {
        this.studyBooks.unshift(studyBook);
        this.applyFilters();
        this.updateLanguageFilterOptions();
        this.renderStudyBooks();
    }

    /**
     * Updates an existing study book in the list
     * @param {Object} updatedStudyBook - Updated study book object
     */
    updateStudyBook(updatedStudyBook) {
        const index = this.studyBooks.findIndex(sb => sb.id === updatedStudyBook.id);
        if (index !== -1) {
            this.studyBooks[index] = updatedStudyBook;
            this.applyFilters();
            this.renderStudyBooks();
        }
    }

    /**
     * Removes a study book from the list
     * @param {string} studyBookId - Study book ID
     */
    removeStudyBook(studyBookId) {
        this.studyBooks = this.studyBooks.filter(sb => sb.id !== studyBookId);
        this.applyFilters();
        this.updateLanguageFilterOptions();
        this.renderStudyBooks();
    }

    /**
     * Applies current filters to the study books
     * @private
     */
    applyFilters() {
        let filtered = [...this.studyBooks];

        // Apply search filter
        if (this.currentSearchQuery) {
            const query = this.currentSearchQuery.toLowerCase();
            filtered = filtered.filter(sb => 
                sb.question.toLowerCase().includes(query) ||
                (sb.explanation && sb.explanation.toLowerCase().includes(query))
            );
        }

        // Apply language filter
        if (this.currentLanguageFilter) {
            filtered = filtered.filter(sb => sb.language === this.currentLanguageFilter);
        }

        this.filteredStudyBooks = filtered;
        this.currentPage = 1; // Reset to first page when filters change
    }

    /**
     * Updates language filter options based on available study books
     * @private
     */
    updateLanguageFilterOptions() {
        const languageFilter = this.container.querySelector('#language-filter');
        if (!languageFilter) return;

        const languages = [...new Set(this.studyBooks.map(sb => sb.language))].sort();
        
        // Keep the current selection
        const currentValue = languageFilter.value;
        
        // Clear and repopulate options
        languageFilter.innerHTML = '<option value="">すべて</option>';
        languages.forEach(language => {
            const option = document.createElement('option');
            option.value = language;
            option.textContent = language;
            languageFilter.appendChild(option);
        });
        
        // Restore selection if it still exists
        if (languages.includes(currentValue)) {
            languageFilter.value = currentValue;
        }
    }

    /**
     * Renders the study books based on current filters and pagination
     * @private
     */
    renderStudyBooks() {
        const gridContainer = this.container.querySelector('#studybook-grid');
        const emptyState = this.container.querySelector('#empty-state');
        const paginationContainer = this.container.querySelector('#pagination-container');

        if (!gridContainer) return;

        // Show/hide empty state
        if (this.filteredStudyBooks.length === 0) {
            gridContainer.style.display = 'none';
            if (emptyState) {
                emptyState.style.display = 'block';
            }
            if (paginationContainer) {
                paginationContainer.style.display = 'none';
            }
            return;
        }

        // Hide empty state and show grid
        gridContainer.style.display = 'grid';
        if (emptyState) {
            emptyState.style.display = 'none';
        }

        // Calculate pagination
        const totalItems = this.filteredStudyBooks.length;
        const totalPages = Math.ceil(totalItems / this.options.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.options.itemsPerPage;
        const endIndex = Math.min(startIndex + this.options.itemsPerPage, totalItems);
        const pageItems = this.filteredStudyBooks.slice(startIndex, endIndex);

        // Render study book cards
        gridContainer.innerHTML = pageItems.map(studyBook => this.getStudyBookCardHTML(studyBook)).join('');

        // Attach card event listeners
        this.attachCardEventListeners();

        // Update pagination
        if (this.options.showPagination && paginationContainer) {
            this.updatePagination(totalPages);
        }
    }

    /**
     * Gets HTML for a study book card
     * @param {Object} studyBook - Study book object
     * @returns {string} HTML string
     * @private
     */
    getStudyBookCardHTML(studyBook) {
        const truncatedQuestion = this.truncateText(studyBook.question, 100);
        const truncatedExplanation = studyBook.explanation ? 
            this.truncateText(studyBook.explanation, 80) : '';

        return `
            <div class="studybook-card" data-id="${studyBook.id}">
                <div class="card-header">
                    <span class="language-tag">${studyBook.language}</span>
                    ${this.options.showActions ? `
                        <div class="card-actions">
                            <button type="button" class="action-btn" data-action="menu" data-id="${studyBook.id}" title="メニュー">
                                ⋮
                            </button>
                        </div>
                    ` : ''}
                </div>
                
                <div class="card-content">
                    <div class="question-preview">
                        <h4>問題</h4>
                        <p>${truncatedQuestion}</p>
                    </div>
                    
                    ${truncatedExplanation ? `
                        <div class="explanation-preview">
                            <h4>解説</h4>
                            <p>${truncatedExplanation}</p>
                        </div>
                    ` : ''}
                </div>
                
                <div class="card-footer">
                    <div class="card-meta">
                        <span class="created-date">${this.formatDate(studyBook.createdAt)}</span>
                    </div>
                    
                    <div class="card-buttons">
                        ${this.options.allowPreview ? `
                            <button type="button" class="btn btn-sm btn-secondary" data-action="preview" data-id="${studyBook.id}">
                                プレビュー
                            </button>
                        ` : ''}
                        <button type="button" class="btn btn-sm btn-primary" data-action="practice" data-id="${studyBook.id}">
                            練習開始
                        </button>
                    </div>
                </div>
                
                ${this.options.showActions ? `
                    <div class="card-menu" id="menu-${studyBook.id}" style="display: none;">
                        ${this.options.allowEdit ? `
                            <button type="button" class="menu-item" data-action="edit" data-id="${studyBook.id}">
                                <span class="menu-icon">✏️</span>
                                編集
                            </button>
                        ` : ''}
                        <button type="button" class="menu-item" data-action="duplicate" data-id="${studyBook.id}">
                            <span class="menu-icon">📋</span>
                            複製
                        </button>
                        ${this.options.allowDelete ? `
                            <button type="button" class="menu-item danger" data-action="delete" data-id="${studyBook.id}">
                                <span class="menu-icon">🗑️</span>
                                削除
                            </button>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Attaches event listeners to study book cards
     * @private
     */
    attachCardEventListeners() {
        const cards = this.container.querySelectorAll('.studybook-card');
        
        cards.forEach(card => {
            // Action buttons
            const actionButtons = card.querySelectorAll('[data-action]');
            actionButtons.forEach(button => {
                const action = button.dataset.action;
                const id = button.dataset.id;
                
                const handler = (event) => this.handleCardAction(event, action, id);
                button.addEventListener('click', handler);
                
                const handlerKey = `card-${action}-${id}`;
                this.eventHandlers.set(handlerKey, { element: button, event: 'click', handler });
            });
        });

        // Close menus when clicking outside
        const closeMenuHandler = (event) => {
            if (!event.target.closest('.card-actions') && !event.target.closest('.card-menu')) {
                this.closeAllMenus();
            }
        };
        document.addEventListener('click', closeMenuHandler);
        this.eventHandlers.set('close-menus', { element: document, event: 'click', handler: closeMenuHandler });
    }

    /**
     * Handles card action button clicks
     * @param {Event} event - Click event
     * @param {string} action - Action type
     * @param {string} studyBookId - Study book ID
     * @private
     */
    handleCardAction(event, action, studyBookId) {
        event.stopPropagation();
        
        switch (action) {
            case 'menu':
                this.toggleCardMenu(studyBookId);
                break;
            case 'preview':
                this.emit('preview', studyBookId);
                break;
            case 'practice':
                this.emit('practice', studyBookId);
                break;
            case 'edit':
                this.emit('edit', studyBookId);
                this.closeAllMenus();
                break;
            case 'duplicate':
                this.emit('duplicate', studyBookId);
                this.closeAllMenus();
                break;
            case 'delete':
                this.handleDeleteConfirmation(studyBookId);
                this.closeAllMenus();
                break;
        }
    }

    /**
     * Toggles the card menu visibility
     * @param {string} studyBookId - Study book ID
     * @private
     */
    toggleCardMenu(studyBookId) {
        const menu = this.container.querySelector(`#menu-${studyBookId}`);
        if (!menu) return;

        // Close other menus
        this.closeAllMenus();

        // Toggle current menu
        const isVisible = menu.style.display !== 'none';
        menu.style.display = isVisible ? 'none' : 'block';
    }

    /**
     * Closes all open card menus
     * @private
     */
    closeAllMenus() {
        const menus = this.container.querySelectorAll('.card-menu');
        menus.forEach(menu => {
            menu.style.display = 'none';
        });
    }

    /**
     * Handles delete confirmation
     * @param {string} studyBookId - Study book ID
     * @private
     */
    handleDeleteConfirmation(studyBookId) {
        const studyBook = this.studyBooks.find(sb => sb.id === studyBookId);
        if (!studyBook) return;

        const confirmed = confirm(`「${studyBook.question.substring(0, 50)}...」を削除しますか？\n\nこの操作は取り消せません。`);
        if (confirmed) {
            this.emit('delete', studyBookId);
        }
    }

    /**
     * Handles search input
     * @private
     */
    handleSearch() {
        const searchInput = this.container.querySelector('#search-input');
        if (!searchInput) return;

        this.currentSearchQuery = searchInput.value.trim();
        this.applyFilters();
        this.renderStudyBooks();
    }

    /**
     * Handles language filter change
     * @private
     */
    handleLanguageFilter() {
        const languageFilter = this.container.querySelector('#language-filter');
        if (!languageFilter) return;

        this.currentLanguageFilter = languageFilter.value;
        this.applyFilters();
        this.renderStudyBooks();
    }

    /**
     * Handles clear filters button click
     * @private
     */
    handleClearFilters() {
        const searchInput = this.container.querySelector('#search-input');
        const languageFilter = this.container.querySelector('#language-filter');

        if (searchInput) {
            searchInput.value = '';
        }
        if (languageFilter) {
            languageFilter.value = '';
        }

        this.currentSearchQuery = '';
        this.currentLanguageFilter = '';
        this.applyFilters();
        this.renderStudyBooks();
    }

    /**
     * Handles add button click
     * @private
     */
    handleAddClick() {
        this.emit('add');
    }

    /**
     * Handles previous page button click
     * @private
     */
    handlePreviousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderStudyBooks();
        }
    }

    /**
     * Handles next page button click
     * @private
     */
    handleNextPage() {
        const totalPages = Math.ceil(this.filteredStudyBooks.length / this.options.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderStudyBooks();
        }
    }

    /**
     * Updates pagination controls
     * @param {number} totalPages - Total number of pages
     * @private
     */
    updatePagination(totalPages) {
        const paginationContainer = this.container.querySelector('#pagination-container');
        const prevBtn = this.container.querySelector('#prev-page-btn');
        const nextBtn = this.container.querySelector('#next-page-btn');
        const paginationInfo = this.container.querySelector('#pagination-info');

        if (!paginationContainer) return;

        if (totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }

        paginationContainer.style.display = 'flex';

        if (prevBtn) {
            prevBtn.disabled = this.currentPage <= 1;
        }

        if (nextBtn) {
            nextBtn.disabled = this.currentPage >= totalPages;
        }

        if (paginationInfo) {
            paginationInfo.textContent = `${this.currentPage} / ${totalPages} ページ`;
        }
    }

    /**
     * Sets loading state
     * @param {boolean} isLoading - Whether list is loading
     */
    setLoadingState(isLoading) {
        this.isLoading = isLoading;
        
        const loadingContainer = this.container.querySelector('#loading-container');
        const gridContainer = this.container.querySelector('#studybook-grid');
        const emptyState = this.container.querySelector('#empty-state');

        if (loadingContainer) {
            loadingContainer.style.display = isLoading ? 'flex' : 'none';
        }

        if (isLoading) {
            if (gridContainer) {
                gridContainer.style.display = 'none';
            }
            if (emptyState) {
                emptyState.style.display = 'none';
            }
        }
    }

    /**
     * Truncates text to specified length
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated text
     * @private
     */
    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) {
            return text || '';
        }
        return text.substring(0, maxLength) + '...';
    }

    /**
     * Formats date for display
     * @param {string|Date} date - Date to format
     * @returns {string} Formatted date
     * @private
     */
    formatDate(date) {
        if (!date) return '';
        
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return dateObj.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Emits a custom event
     * @param {string} eventName - Event name
     * @param {*} data - Event data
     * @private
     */
    emit(eventName, data = null) {
        const event = new CustomEvent(`studyBookList:${eventName}`, {
            detail: data,
            bubbles: true
        });
        this.container.dispatchEvent(event);
    }

    /**
     * Adds an event listener
     * @param {string} eventName - Event name
     * @param {Function} handler - Event handler
     */
    on(eventName, handler) {
        this.container.addEventListener(`studyBookList:${eventName}`, handler);
    }

    /**
     * Removes an event listener
     * @param {string} eventName - Event name
     * @param {Function} handler - Event handler
     */
    off(eventName, handler) {
        this.container.removeEventListener(`studyBookList:${eventName}`, handler);
    }

    /**
     * Destroys the component and cleans up resources
     */
    destroy() {
        // Remove event listeners
        this.eventHandlers.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventHandlers.clear();

        // Clear container
        this.container.innerHTML = '';
    }
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StudyBookList;
} else if (typeof window !== 'undefined') {
    window.StudyBookList = StudyBookList;
}