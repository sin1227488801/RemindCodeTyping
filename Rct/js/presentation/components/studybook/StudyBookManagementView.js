/**
 * StudyBookManagementView Component
 * Main view component that manages study book CRUD operations
 */
class StudyBookManagementView {
    /**
     * Creates a new StudyBookManagementView instance
     * @param {HTMLElement} container - Container element for the view
     * @param {Object} dependencies - Required dependencies
     */
    constructor(container, dependencies = {}) {
        this.container = container;
        this.studyBookController = dependencies.studyBookController;
        this.errorHandler = dependencies.errorHandler;
        
        this.currentView = 'list'; // 'list', 'form', 'preview'
        this.studyBookList = null;
        this.studyBookForm = null;
        this.currentEditingStudyBook = null;
        this.eventHandlers = new Map();
    }

    /**
     * Initializes the study book management view
     */
    initialize() {
        this.render();
        this.setupEventListeners();
        this.loadStudyBooks();
    }

    /**
     * Renders the study book management view
     * @private
     */
    render() {
        this.container.innerHTML = this.getViewHTML();
        this.initializeCurrentView();
    }

    /**
     * Gets the HTML structure for the management view
     * @returns {string} HTML string
     * @private
     */
    getViewHTML() {
        return `
            <div class="studybook-management-view">
                <div class="view-header">
                    <nav class="breadcrumb" id="breadcrumb">
                        <span class="breadcrumb-item active">電子学習帳</span>
                    </nav>
                    
                    <div class="view-actions" id="view-actions">
                        <!-- Actions will be populated based on current view -->
                    </div>
                </div>
                
                <div class="view-content" id="view-content">
                    <!-- Content will be populated based on current view -->
                </div>
            </div>
        `;
    }

    /**
     * Initializes the current view
     * @private
     */
    initializeCurrentView() {
        const contentContainer = this.container.querySelector('#view-content');
        if (!contentContainer) return;

        // Clean up existing components
        this.destroyComponents();

        switch (this.currentView) {
            case 'list':
                this.initializeListView(contentContainer);
                break;
            case 'form':
                this.initializeFormView(contentContainer);
                break;
            case 'preview':
                this.initializePreviewView(contentContainer);
                break;
        }

        this.updateBreadcrumb();
        this.updateViewActions();
    }

    /**
     * Initializes the list view
     * @param {HTMLElement} container - Content container
     * @private
     */
    initializeListView(container) {
        this.studyBookList = new StudyBookList(container, {
            showActions: true,
            showLanguageFilter: true,
            showSearch: true,
            showPagination: true,
            itemsPerPage: 12,
            allowEdit: true,
            allowDelete: true,
            allowPreview: true
        });

        this.studyBookList.render();

        // Set up list event listeners
        this.studyBookList.on('add', () => this.handleAddStudyBook());
        this.studyBookList.on('edit', (event) => this.handleEditStudyBook(event.detail));
        this.studyBookList.on('delete', (event) => this.handleDeleteStudyBook(event.detail));
        this.studyBookList.on('duplicate', (event) => this.handleDuplicateStudyBook(event.detail));
        this.studyBookList.on('preview', (event) => this.handlePreviewStudyBook(event.detail));
        this.studyBookList.on('practice', (event) => this.handlePracticeStudyBook(event.detail));
    }

    /**
     * Initializes the form view
     * @param {HTMLElement} container - Content container
     * @private
     */
    initializeFormView(container) {
        const isEditMode = !!this.currentEditingStudyBook;
        
        this.studyBookForm = new StudyBookForm(container, {
            mode: isEditMode ? 'edit' : 'create',
            showLanguageHelp: true,
            showCharacterCount: true,
            studyBookData: this.currentEditingStudyBook
        });

        this.studyBookForm.render();

        // Set up form event listeners
        this.studyBookForm.on('create', (event) => this.handleCreateStudyBook(event.detail));
        this.studyBookForm.on('update', (event) => this.handleUpdateStudyBook(event.detail));
        this.studyBookForm.on('cancel', () => this.handleFormCancel());
    }

    /**
     * Initializes the preview view
     * @param {HTMLElement} container - Content container
     * @private
     */
    initializePreviewView(container) {
        if (!this.currentPreviewStudyBook) {
            this.switchView('list');
            return;
        }

        container.innerHTML = this.getPreviewHTML(this.currentPreviewStudyBook);
        this.attachPreviewEventListeners();
    }

    /**
     * Gets HTML for the preview view
     * @param {Object} studyBook - Study book to preview
     * @returns {string} HTML string
     * @private
     */
    getPreviewHTML(studyBook) {
        return `
            <div class="studybook-preview">
                <div class="preview-header">
                    <div class="preview-meta">
                        <span class="language-tag">${studyBook.language}</span>
                        <span class="created-date">作成日: ${this.formatDate(studyBook.createdAt)}</span>
                    </div>
                </div>
                
                <div class="preview-content">
                    <div class="preview-section">
                        <h3>問題</h3>
                        <div class="preview-question">
                            <pre>${studyBook.question}</pre>
                        </div>
                    </div>
                    
                    ${studyBook.explanation ? `
                        <div class="preview-section">
                            <h3>解説</h3>
                            <div class="preview-explanation">
                                <pre>${studyBook.explanation}</pre>
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="preview-actions">
                    <button type="button" class="btn btn-secondary" id="preview-back-btn">
                        戻る
                    </button>
                    <button type="button" class="btn btn-secondary" id="preview-edit-btn">
                        編集
                    </button>
                    <button type="button" class="btn btn-primary" id="preview-practice-btn">
                        練習開始
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Attaches event listeners for preview view
     * @private
     */
    attachPreviewEventListeners() {
        const backBtn = this.container.querySelector('#preview-back-btn');
        const editBtn = this.container.querySelector('#preview-edit-btn');
        const practiceBtn = this.container.querySelector('#preview-practice-btn');

        if (backBtn) {
            const backHandler = () => this.switchView('list');
            backBtn.addEventListener('click', backHandler);
            this.eventHandlers.set('preview-back', { element: backBtn, event: 'click', handler: backHandler });
        }

        if (editBtn) {
            const editHandler = () => this.handleEditStudyBook(this.currentPreviewStudyBook.id);
            editBtn.addEventListener('click', editHandler);
            this.eventHandlers.set('preview-edit', { element: editBtn, event: 'click', handler: editHandler });
        }

        if (practiceBtn) {
            const practiceHandler = () => this.handlePracticeStudyBook(this.currentPreviewStudyBook.id);
            practiceBtn.addEventListener('click', practiceHandler);
            this.eventHandlers.set('preview-practice', { element: practiceBtn, event: 'click', handler: practiceHandler });
        }
    }

    /**
     * Sets up global event listeners
     * @private
     */
    setupEventListeners() {
        // Keyboard shortcuts
        const keyHandler = (event) => this.handleKeyboardShortcuts(event);
        document.addEventListener('keydown', keyHandler);
        this.eventHandlers.set('keyboard', { element: document, event: 'keydown', handler: keyHandler });
    }

    /**
     * Handles keyboard shortcuts
     * @param {KeyboardEvent} event - Keyboard event
     * @private
     */
    handleKeyboardShortcuts(event) {
        // Ctrl+N or Cmd+N for new study book
        if ((event.ctrlKey || event.metaKey) && event.key === 'n' && this.currentView === 'list') {
            event.preventDefault();
            this.handleAddStudyBook();
        }

        // Escape to go back
        if (event.key === 'Escape') {
            if (this.currentView === 'form' || this.currentView === 'preview') {
                this.switchView('list');
            }
        }
    }

    /**
     * Switches to a different view
     * @param {string} view - View name ('list', 'form', 'preview')
     * @param {Object} data - Optional data for the view
     */
    switchView(view, data = null) {
        this.currentView = view;
        
        // Set view-specific data
        if (view === 'form' && data) {
            this.currentEditingStudyBook = data;
        } else if (view === 'preview' && data) {
            this.currentPreviewStudyBook = data;
        } else if (view === 'list') {
            this.currentEditingStudyBook = null;
            this.currentPreviewStudyBook = null;
        }

        this.initializeCurrentView();
    }

    /**
     * Updates the breadcrumb navigation
     * @private
     */
    updateBreadcrumb() {
        const breadcrumb = this.container.querySelector('#breadcrumb');
        if (!breadcrumb) return;

        let breadcrumbHTML = '<span class="breadcrumb-item">電子学習帳</span>';

        switch (this.currentView) {
            case 'form':
                const isEdit = !!this.currentEditingStudyBook;
                breadcrumbHTML += ` <span class="breadcrumb-separator">></span> <span class="breadcrumb-item active">${isEdit ? '編集' : '新規作成'}</span>`;
                break;
            case 'preview':
                breadcrumbHTML += ' <span class="breadcrumb-separator">></span> <span class="breadcrumb-item active">プレビュー</span>';
                break;
        }

        breadcrumb.innerHTML = breadcrumbHTML;
    }

    /**
     * Updates view actions based on current view
     * @private
     */
    updateViewActions() {
        const actionsContainer = this.container.querySelector('#view-actions');
        if (!actionsContainer) return;

        let actionsHTML = '';

        switch (this.currentView) {
            case 'list':
                actionsHTML = `
                    <button type="button" class="btn btn-primary" id="add-studybook-action">
                        <span class="btn-icon">+</span>
                        新規作成
                    </button>
                `;
                break;
            case 'form':
                actionsHTML = `
                    <button type="button" class="btn btn-secondary" id="cancel-form-action">
                        キャンセル
                    </button>
                `;
                break;
            case 'preview':
                actionsHTML = `
                    <button type="button" class="btn btn-secondary" id="back-to-list-action">
                        一覧に戻る
                    </button>
                `;
                break;
        }

        actionsContainer.innerHTML = actionsHTML;
        this.attachActionEventListeners();
    }

    /**
     * Attaches event listeners to view actions
     * @private
     */
    attachActionEventListeners() {
        const addBtn = this.container.querySelector('#add-studybook-action');
        const cancelBtn = this.container.querySelector('#cancel-form-action');
        const backBtn = this.container.querySelector('#back-to-list-action');

        if (addBtn) {
            const addHandler = () => this.handleAddStudyBook();
            addBtn.addEventListener('click', addHandler);
            this.eventHandlers.set('add-action', { element: addBtn, event: 'click', handler: addHandler });
        }

        if (cancelBtn) {
            const cancelHandler = () => this.handleFormCancel();
            cancelBtn.addEventListener('click', cancelHandler);
            this.eventHandlers.set('cancel-action', { element: cancelBtn, event: 'click', handler: cancelHandler });
        }

        if (backBtn) {
            const backHandler = () => this.switchView('list');
            backBtn.addEventListener('click', backHandler);
            this.eventHandlers.set('back-action', { element: backBtn, event: 'click', handler: backHandler });
        }
    }

    /**
     * Loads study books from the controller
     * @private
     */
    async loadStudyBooks() {
        if (!this.studyBookController) {
            console.warn('StudyBookController not available');
            return;
        }

        try {
            if (this.studyBookList) {
                this.studyBookList.setLoadingState(true);
            }

            const result = await this.studyBookController.getStudyBooks();
            
            if (result.success && this.studyBookList) {
                this.studyBookList.setStudyBooks(result.studyBooks);
            } else if (!result.success) {
                this.displayError(result.error || '学習帳の読み込みに失敗しました。');
            }
        } catch (error) {
            this.handleError(error, 'load_studybooks');
        } finally {
            if (this.studyBookList) {
                this.studyBookList.setLoadingState(false);
            }
        }
    }

    /**
     * Handles add study book action
     * @private
     */
    handleAddStudyBook() {
        this.switchView('form');
    }

    /**
     * Handles edit study book action
     * @param {string} studyBookId - Study book ID
     * @private
     */
    async handleEditStudyBook(studyBookId) {
        if (!this.studyBookController) return;

        try {
            const result = await this.studyBookController.getStudyBook(studyBookId);
            
            if (result.success) {
                this.switchView('form', result.studyBook);
            } else {
                this.displayError(result.error || '学習帳の取得に失敗しました。');
            }
        } catch (error) {
            this.handleError(error, 'get_studybook');
        }
    }

    /**
     * Handles delete study book action
     * @param {string} studyBookId - Study book ID
     * @private
     */
    async handleDeleteStudyBook(studyBookId) {
        if (!this.studyBookController) return;

        try {
            const result = await this.studyBookController.deleteStudyBook(studyBookId);
            
            if (result.success) {
                if (this.studyBookList) {
                    this.studyBookList.removeStudyBook(studyBookId);
                }
                this.displaySuccess('学習帳を削除しました。');
            } else {
                this.displayError(result.error || '学習帳の削除に失敗しました。');
            }
        } catch (error) {
            this.handleError(error, 'delete_studybook');
        }
    }

    /**
     * Handles duplicate study book action
     * @param {string} studyBookId - Study book ID
     * @private
     */
    async handleDuplicateStudyBook(studyBookId) {
        if (!this.studyBookController) return;

        try {
            const result = await this.studyBookController.duplicateStudyBook(studyBookId);
            
            if (result.success) {
                if (this.studyBookList) {
                    this.studyBookList.addStudyBook(result.studyBook);
                }
                this.displaySuccess('学習帳を複製しました。');
            } else {
                this.displayError(result.error || '学習帳の複製に失敗しました。');
            }
        } catch (error) {
            this.handleError(error, 'duplicate_studybook');
        }
    }

    /**
     * Handles preview study book action
     * @param {string} studyBookId - Study book ID
     * @private
     */
    async handlePreviewStudyBook(studyBookId) {
        if (!this.studyBookController) return;

        try {
            const result = await this.studyBookController.getStudyBook(studyBookId);
            
            if (result.success) {
                this.switchView('preview', result.studyBook);
            } else {
                this.displayError(result.error || '学習帳の取得に失敗しました。');
            }
        } catch (error) {
            this.handleError(error, 'get_studybook');
        }
    }

    /**
     * Handles practice study book action
     * @param {string} studyBookId - Study book ID
     * @private
     */
    handlePracticeStudyBook(studyBookId) {
        this.emit('startPractice', studyBookId);
    }

    /**
     * Handles create study book action
     * @param {Object} studyBookData - Study book data
     * @private
     */
    async handleCreateStudyBook(studyBookData) {
        if (!this.studyBookController) return;

        try {
            const result = await this.studyBookController.createStudyBook(studyBookData);
            
            if (result.success) {
                if (this.studyBookList) {
                    this.studyBookList.addStudyBook(result.studyBook);
                }
                this.displaySuccess('学習帳を作成しました。');
                this.switchView('list');
            } else {
                this.displayError(result.error || '学習帳の作成に失敗しました。');
            }
        } catch (error) {
            this.handleError(error, 'create_studybook');
        } finally {
            if (this.studyBookForm) {
                this.studyBookForm.setSubmittingState(false);
            }
        }
    }

    /**
     * Handles update study book action
     * @param {Object} studyBookData - Updated study book data
     * @private
     */
    async handleUpdateStudyBook(studyBookData) {
        if (!this.studyBookController) return;

        try {
            const result = await this.studyBookController.updateStudyBook(studyBookData.id, studyBookData);
            
            if (result.success) {
                if (this.studyBookList) {
                    this.studyBookList.updateStudyBook(result.studyBook);
                }
                this.displaySuccess('学習帳を更新しました。');
                this.switchView('list');
            } else {
                this.displayError(result.error || '学習帳の更新に失敗しました。');
            }
        } catch (error) {
            this.handleError(error, 'update_studybook');
        } finally {
            if (this.studyBookForm) {
                this.studyBookForm.setSubmittingState(false);
            }
        }
    }

    /**
     * Handles form cancel action
     * @private
     */
    handleFormCancel() {
        this.switchView('list');
    }

    /**
     * Handles errors
     * @param {Error} error - Error object
     * @param {string} context - Error context
     * @private
     */
    handleError(error, context) {
        console.error(`StudyBook management error (${context}):`, error);
        
        if (this.errorHandler) {
            this.errorHandler.handle(error, { context });
        }
        
        // Display user-friendly error message
        let message = 'エラーが発生しました。しばらく時間をおいて再度お試しください。';
        
        if (error.message.includes('network') || error.message.includes('fetch')) {
            message = 'ネットワークエラーが発生しました。インターネット接続を確認してください。';
        } else if (error.message.includes('validation')) {
            message = '入力内容に問題があります。内容を確認してください。';
        }
        
        this.displayError(message);
    }

    /**
     * Displays a success message
     * @param {string} message - Success message
     */
    displaySuccess(message) {
        // You could implement a toast notification system here
        console.log('Success:', message);
    }

    /**
     * Displays an error message
     * @param {string} message - Error message
     */
    displayError(message) {
        // You could implement a toast notification system here
        console.error('Error:', message);
        alert(message); // Temporary fallback
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
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Destroys existing components
     * @private
     */
    destroyComponents() {
        if (this.studyBookList) {
            this.studyBookList.destroy();
            this.studyBookList = null;
        }
        
        if (this.studyBookForm) {
            this.studyBookForm.destroy();
            this.studyBookForm = null;
        }
    }

    /**
     * Gets the current view
     * @returns {string} Current view name
     */
    getCurrentView() {
        return this.currentView;
    }

    /**
     * Emits a custom event
     * @param {string} eventName - Event name
     * @param {*} data - Event data
     * @private
     */
    emit(eventName, data = null) {
        const event = new CustomEvent(`studyBookManagement:${eventName}`, {
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
        this.container.addEventListener(`studyBookManagement:${eventName}`, handler);
    }

    /**
     * Removes an event listener
     * @param {string} eventName - Event name
     * @param {Function} handler - Event handler
     */
    off(eventName, handler) {
        this.container.removeEventListener(`studyBookManagement:${eventName}`, handler);
    }

    /**
     * Destroys the component and cleans up resources
     */
    destroy() {
        // Destroy components
        this.destroyComponents();
        
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
    module.exports = StudyBookManagementView;
} else if (typeof window !== 'undefined') {
    window.StudyBookManagementView = StudyBookManagementView;
}