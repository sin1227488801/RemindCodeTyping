/**
 * Typing Controller
 * Coordinates typing practice UI interactions and session management
 */
class TypingController {
    /**
     * Creates a new TypingController instance
     * @param {Object} typingService - Typing service
     * @param {Object} sessionRepository - Session repository for state management
     * @param {Object} studyBookRepository - Study book repository
     * @param {Object} userRepository - User repository
     * @param {Object} errorHandler - Error handling service
     */
    constructor(typingService, sessionRepository, studyBookRepository, userRepository, errorHandler) {
        this.typingService = typingService;
        this.sessionRepository = sessionRepository;
        this.studyBookRepository = studyBookRepository;
        this.userRepository = userRepository;
        this.errorHandler = errorHandler;
        this.eventListeners = new Map();
        this.currentSession = null;
        this.timer = null;
        this.updateInterval = null;
    }

    /**
     * Initializes the typing controller
     */
    initialize() {
        this.setupEventListeners();
        this.loadTypingSettings();
        this.loadUserStatistics();
    }

    /**
     * Sets up event listeners for typing practice
     * @private
     */
    setupEventListeners() {
        // Start typing button
        const startButton = document.getElementById('start-typing-btn');
        if (startButton) {
            const startHandler = () => this.handleStartTyping();
            startButton.addEventListener('click', startHandler);
            this.eventListeners.set('start-typing-btn', { element: startButton, event: 'click', handler: startHandler });
        }

        // Typing input
        const typingInput = document.getElementById('typing-input');
        if (typingInput) {
            const inputHandler = (event) => this.handleTypingInput(event);
            const keydownHandler = (event) => this.handleKeyDown(event);
            
            typingInput.addEventListener('input', inputHandler);
            typingInput.addEventListener('keydown', keydownHandler);
            
            this.eventListeners.set('typing-input-input', { element: typingInput, event: 'input', handler: inputHandler });
            this.eventListeners.set('typing-input-keydown', { element: typingInput, event: 'keydown', handler: keydownHandler });
        }

        // Finish typing button
        const finishButton = document.getElementById('finish-typing-btn');
        if (finishButton) {
            const finishHandler = () => this.handleFinishTyping();
            finishButton.addEventListener('click', finishHandler);
            this.eventListeners.set('finish-typing-btn', { element: finishButton, event: 'click', handler: finishHandler });
        }

        // Restart typing button
        const restartButton = document.getElementById('restart-typing-btn');
        if (restartButton) {
            const restartHandler = () => this.handleRestartTyping();
            restartButton.addEventListener('click', restartHandler);
            this.eventListeners.set('restart-typing-btn', { element: restartButton, event: 'click', handler: restartHandler });
        }

        // Settings form
        const settingsForm = document.getElementById('typing-settings-form');
        if (settingsForm) {
            const settingsHandler = (event) => this.handleSettingsUpdate(event);
            settingsForm.addEventListener('submit', settingsHandler);
            this.eventListeners.set('typing-settings-form', { element: settingsForm, event: 'submit', handler: settingsHandler });
        }

        // Language selection
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            const languageHandler = (event) => this.handleLanguageChange(event);
            languageSelect.addEventListener('change', languageHandler);
            this.eventListeners.set('language-select', { element: languageSelect, event: 'change', handler: languageHandler });
        }

        // Random problem button
        const randomButton = document.getElementById('random-problem-btn');
        if (randomButton) {
            const randomHandler = () => this.handleRandomProblem();
            randomButton.addEventListener('click', randomHandler);
            this.eventListeners.set('random-problem-btn', { element: randomButton, event: 'click', handler: randomHandler });
        }

        // Show explanation button
        const explanationButton = document.getElementById('show-explanation-btn');
        if (explanationButton) {
            const explanationHandler = () => this.handleShowExplanation();
            explanationButton.addEventListener('click', explanationHandler);
            this.eventListeners.set('show-explanation-btn', { element: explanationButton, event: 'click', handler: explanationHandler });
        }
    }

    /**
     * Handles starting a typing session
     */
    async handleStartTyping() {
        try {
            // Get selected study book
            const selectedStudyBook = await this.getSelectedStudyBook();
            if (!selectedStudyBook) {
                this.displayError('Please select a study book to practice');
                return;
            }

            // Get typing settings
            const settings = this.getTypingSettings();

            // Create and start session
            const session = new TypingSession(selectedStudyBook, settings);
            session.start();

            // Store session
            this.currentSession = session;
            this.sessionRepository.setCurrentSession(session);

            // Update UI
            this.updateUIForActiveSession();
            this.startTimer();
            this.startRealTimeUpdates();

            // Focus on typing input
            const typingInput = document.getElementById('typing-input');
            if (typingInput) {
                typingInput.focus();
            }

        } catch (error) {
            this.errorHandler.handle(error, { context: 'start_typing' });
        }
    }

    /**
     * Handles typing input changes
     * @param {Event} event - Input event
     */
    handleTypingInput(event) {
        if (!this.currentSession) return;

        const typedText = event.target.value;
        
        // Update session with current input
        this.currentSession.updateTypedText(typedText);
        
        // Update real-time feedback
        this.updateTypingFeedback(typedText);
        
        // Check if typing is complete
        if (this.currentSession.isComplete()) {
            this.handleFinishTyping();
        }
    }

    /**
     * Handles keydown events for special keys
     * @param {Event} event - Keydown event
     */
    handleKeyDown(event) {
        if (!this.currentSession) return;

        // Handle special keys
        switch (event.key) {
            case 'Tab':
                event.preventDefault();
                this.insertTab(event.target);
                break;
            case 'Escape':
                event.preventDefault();
                this.handleRestartTyping();
                break;
            case 'F1':
                event.preventDefault();
                this.handleShowExplanation();
                break;
        }
    }

    /**
     * Handles finishing a typing session
     */
    async handleFinishTyping() {
        if (!this.currentSession) return;

        try {
            // Stop timer and updates
            this.stopTimer();
            this.stopRealTimeUpdates();

            // Calculate final result
            const result = this.currentSession.finish();

            // Save session result
            const currentUser = this.userRepository.getCurrentUser();
            if (currentUser && !currentUser.isGuest) {
                await this.typingService.recordResult(this.currentSession, result);
            }

            // Update UI
            this.updateUIForCompletedSession();
            this.displayResults(result);

            // Update statistics
            this.loadUserStatistics();

        } catch (error) {
            this.errorHandler.handle(error, { context: 'finish_typing' });
        }
    }

    /**
     * Handles restarting the current typing session
     */
    handleRestartTyping() {
        if (!this.currentSession) return;

        // Stop current session
        this.stopTimer();
        this.stopRealTimeUpdates();

        // Reset session
        this.currentSession.restart();

        // Update UI
        this.updateUIForActiveSession();
        this.clearTypingInput();
        this.clearTypingFeedback();

        // Restart timer
        this.startTimer();
        this.startRealTimeUpdates();

        // Focus on typing input
        const typingInput = document.getElementById('typing-input');
        if (typingInput) {
            typingInput.focus();
        }
    }

    /**
     * Handles typing settings update
     * @param {Event} event - Form submission event
     */
    handleSettingsUpdate(event) {
        event.preventDefault();

        try {
            const formData = new FormData(event.target);
            const settings = {
                showRealTimeAccuracy: formData.get('showRealTimeAccuracy') === 'on',
                highlightErrors: formData.get('highlightErrors') === 'on',
                playSound: formData.get('playSound') === 'on',
                fontSize: parseInt(formData.get('fontSize')) || 14,
                theme: formData.get('theme') || 'light'
            };

            // Validate settings
            const validationResult = this.validateSettings(settings);
            if (!validationResult.isValid) {
                this.displayValidationErrors(validationResult.errors);
                return;
            }

            // Save settings
            this.saveTypingSettings(settings);
            this.applySettings(settings);

            // Show success message
            this.displaySuccessMessage('Settings updated successfully!');

        } catch (error) {
            this.errorHandler.handle(error, { context: 'update_settings' });
        }
    }

    /**
     * Handles language selection change
     * @param {Event} event - Change event
     */
    async handleLanguageChange(event) {
        const selectedLanguage = event.target.value;
        
        try {
            // Load study books for selected language
            await this.loadStudyBooksForLanguage(selectedLanguage);
            
            // Clear current selection
            this.clearCurrentStudyBook();
            
        } catch (error) {
            this.errorHandler.handle(error, { context: 'language_change' });
        }
    }

    /**
     * Handles random problem selection
     */
    async handleRandomProblem() {
        try {
            const selectedLanguage = this.getSelectedLanguage();
            if (!selectedLanguage) {
                this.displayError('Please select a language first');
                return;
            }

            // Show loading state
            this.setLoadingState(true);

            // Get random study book
            const result = await this.studyBookService.getRandomStudyBook(selectedLanguage);
            
            if (result.success && result.studyBook) {
                // Set as current study book
                this.setCurrentStudyBook(result.studyBook);
                this.displayStudyBook(result.studyBook);
            } else {
                this.displayError('No study books found for the selected language');
            }

        } catch (error) {
            this.errorHandler.handle(error, { context: 'random_problem' });
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Handles showing explanation
     */
    handleShowExplanation() {
        const currentStudyBook = this.getCurrentStudyBook();
        if (!currentStudyBook || !currentStudyBook.explanation) {
            this.displayError('No explanation available for this problem');
            return;
        }

        // Show explanation modal or panel
        this.displayExplanation(currentStudyBook.explanation);
    }

    /**
     * Gets the selected study book for typing practice
     * @returns {Promise<StudyBook|null>} Selected study book
     * @private
     */
    async getSelectedStudyBook() {
        // Check if there's a pre-selected study book (from study book management)
        const preSelectedId = sessionStorage.getItem('practiceStudyBookId');
        if (preSelectedId) {
            sessionStorage.removeItem('practiceStudyBookId');
            const studyBook = this.studyBookRepository.getById(preSelectedId);
            if (studyBook) {
                this.setCurrentStudyBook(studyBook);
                return studyBook;
            }
        }

        // Get currently selected study book
        return this.getCurrentStudyBook();
    }

    /**
     * Gets current typing settings
     * @returns {Object} Typing settings
     * @private
     */
    getTypingSettings() {
        const savedSettings = localStorage.getItem('typingSettings');
        const defaultSettings = {
            showRealTimeAccuracy: true,
            highlightErrors: true,
            playSound: false,
            fontSize: 14,
            theme: 'light'
        };

        return savedSettings ? { ...defaultSettings, ...JSON.parse(savedSettings) } : defaultSettings;
    }

    /**
     * Saves typing settings to localStorage
     * @param {Object} settings - Settings to save
     * @private
     */
    saveTypingSettings(settings) {
        localStorage.setItem('typingSettings', JSON.stringify(settings));
    }

    /**
     * Applies settings to the UI
     * @param {Object} settings - Settings to apply
     * @private
     */
    applySettings(settings) {
        const typingArea = document.getElementById('typing-area');
        if (typingArea) {
            typingArea.style.fontSize = `${settings.fontSize}px`;
            typingArea.className = `typing-area theme-${settings.theme}`;
        }

        // Update other UI elements based on settings
        this.updateSettingsUI(settings);
    }

    /**
     * Updates the UI for an active typing session
     * @private
     */
    updateUIForActiveSession() {
        // Show/hide appropriate buttons
        const startButton = document.getElementById('start-typing-btn');
        const finishButton = document.getElementById('finish-typing-btn');
        const restartButton = document.getElementById('restart-typing-btn');
        const typingInput = document.getElementById('typing-input');

        if (startButton) startButton.style.display = 'none';
        if (finishButton) finishButton.style.display = 'inline-block';
        if (restartButton) restartButton.style.display = 'inline-block';
        if (typingInput) {
            typingInput.disabled = false;
            typingInput.value = '';
        }

        // Display the problem text
        this.displayProblemText();
        
        // Reset feedback area
        this.clearTypingFeedback();
    }

    /**
     * Updates the UI for a completed typing session
     * @private
     */
    updateUIForCompletedSession() {
        // Show/hide appropriate buttons
        const startButton = document.getElementById('start-typing-btn');
        const finishButton = document.getElementById('finish-typing-btn');
        const restartButton = document.getElementById('restart-typing-btn');
        const typingInput = document.getElementById('typing-input');

        if (startButton) startButton.style.display = 'inline-block';
        if (finishButton) finishButton.style.display = 'none';
        if (restartButton) restartButton.style.display = 'inline-block';
        if (typingInput) typingInput.disabled = true;
    }

    /**
     * Displays the problem text for typing
     * @private
     */
    displayProblemText() {
        const problemDisplay = document.getElementById('problem-display');
        if (!problemDisplay || !this.currentSession) return;

        const studyBook = this.currentSession.studyBook;
        problemDisplay.innerHTML = `
            <div class="problem-header">
                <span class="language-tag">${this.escapeHtml(studyBook.language)}</span>
                <span class="difficulty-level">Level ${studyBook.getDifficultyLevel()}</span>
            </div>
            <pre class="problem-text"><code>${this.escapeHtml(studyBook.question)}</code></pre>
        `;
    }

    /**
     * Updates real-time typing feedback
     * @param {string} typedText - Currently typed text
     * @private
     */
    updateTypingFeedback(typedText) {
        if (!this.currentSession) return;

        const settings = this.getTypingSettings();
        const targetText = this.currentSession.studyBook.question;
        
        // Update accuracy display
        if (settings.showRealTimeAccuracy) {
            const accuracy = this.calculateRealTimeAccuracy(typedText, targetText);
            this.updateAccuracyDisplay(accuracy);
        }

        // Highlight errors
        if (settings.highlightErrors) {
            this.highlightTypingErrors(typedText, targetText);
        }

        // Update progress
        this.updateProgressDisplay(typedText.length, targetText.length);
    }

    /**
     * Calculates real-time accuracy
     * @param {string} typedText - Typed text
     * @param {string} targetText - Target text
     * @returns {number} Accuracy percentage
     * @private
     */
    calculateRealTimeAccuracy(typedText, targetText) {
        if (typedText.length === 0) return 100;

        let correctChars = 0;
        const minLength = Math.min(typedText.length, targetText.length);

        for (let i = 0; i < minLength; i++) {
            if (typedText[i] === targetText[i]) {
                correctChars++;
            }
        }

        return Math.round((correctChars / typedText.length) * 100);
    }

    /**
     * Updates accuracy display
     * @param {number} accuracy - Accuracy percentage
     * @private
     */
    updateAccuracyDisplay(accuracy) {
        const accuracyDisplay = document.getElementById('accuracy-display');
        if (accuracyDisplay) {
            accuracyDisplay.textContent = `${accuracy}%`;
            accuracyDisplay.className = `accuracy-display ${this.getAccuracyClass(accuracy)}`;
        }
    }

    /**
     * Gets CSS class for accuracy level
     * @param {number} accuracy - Accuracy percentage
     * @returns {string} CSS class name
     * @private
     */
    getAccuracyClass(accuracy) {
        if (accuracy >= 95) return 'excellent';
        if (accuracy >= 85) return 'good';
        if (accuracy >= 70) return 'fair';
        return 'poor';
    }

    /**
     * Highlights typing errors in the input
     * @param {string} typedText - Typed text
     * @param {string} targetText - Target text
     * @private
     */
    highlightTypingErrors(typedText, targetText) {
        const typingInput = document.getElementById('typing-input');
        if (!typingInput) return;

        // Remove existing error highlighting
        typingInput.classList.remove('has-errors');

        // Check for errors
        let hasErrors = false;
        for (let i = 0; i < typedText.length; i++) {
            if (i >= targetText.length || typedText[i] !== targetText[i]) {
                hasErrors = true;
                break;
            }
        }

        if (hasErrors) {
            typingInput.classList.add('has-errors');
        }
    }

    /**
     * Updates progress display
     * @param {number} current - Current character count
     * @param {number} total - Total character count
     * @private
     */
    updateProgressDisplay(current, total) {
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');

        if (progressBar) {
            const percentage = Math.min((current / total) * 100, 100);
            progressBar.style.width = `${percentage}%`;
        }

        if (progressText) {
            progressText.textContent = `${current} / ${total} characters`;
        }
    }

    /**
     * Displays typing results
     * @param {TypingResult} result - Typing result
     * @private
     */
    displayResults(result) {
        const resultsContainer = document.getElementById('results-container');
        if (!resultsContainer) return;

        const wpm = Math.round((result.totalCharacters / 5) / (result.duration.toMinutes()));
        const cpm = Math.round(result.totalCharacters / result.duration.toMinutes());

        resultsContainer.innerHTML = `
            <div class="results-modal">
                <div class="results-header">
                    <h3>Typing Results</h3>
                </div>
                <div class="results-content">
                    <div class="result-item">
                        <span class="result-label">Accuracy:</span>
                        <span class="result-value ${this.getAccuracyClass(result.accuracy)}">${result.accuracy.toFixed(1)}%</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Words per minute:</span>
                        <span class="result-value">${wpm} WPM</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Characters per minute:</span>
                        <span class="result-value">${cpm} CPM</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Time taken:</span>
                        <span class="result-value">${result.duration.toDisplayString()}</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Total characters:</span>
                        <span class="result-value">${result.totalCharacters}</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Correct characters:</span>
                        <span class="result-value">${result.correctCharacters}</span>
                    </div>
                </div>
                <div class="results-actions">
                    <button class="btn btn-primary" onclick="this.parentElement.parentElement.parentElement.style.display='none'">Close</button>
                    <button class="btn btn-secondary" onclick="window.typingController.handleRestartTyping(); this.parentElement.parentElement.parentElement.style.display='none'">Try Again</button>
                </div>
            </div>
        `;

        resultsContainer.style.display = 'block';
    }

    /**
     * Starts the session timer
     * @private
     */
    startTimer() {
        const timerDisplay = document.getElementById('timer-display');
        if (!timerDisplay) return;

        this.timer = setInterval(() => {
            if (this.currentSession) {
                const elapsed = this.currentSession.getElapsedTime();
                timerDisplay.textContent = elapsed.toDisplayString();
            }
        }, 1000);
    }

    /**
     * Stops the session timer
     * @private
     */
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    /**
     * Starts real-time updates
     * @private
     */
    startRealTimeUpdates() {
        this.updateInterval = setInterval(() => {
            if (this.currentSession) {
                const typingInput = document.getElementById('typing-input');
                if (typingInput) {
                    this.updateTypingFeedback(typingInput.value);
                }
            }
        }, 100);
    }

    /**
     * Stops real-time updates
     * @private
     */
    stopRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Utility methods
     */

    loadTypingSettings() {
        const settings = this.getTypingSettings();
        this.applySettings(settings);
        this.populateSettingsForm(settings);
    }

    populateSettingsForm(settings) {
        const form = document.getElementById('typing-settings-form');
        if (!form) return;

        Object.keys(settings).forEach(key => {
            const field = form.querySelector(`[name="${key}"]`);
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = settings[key];
                } else {
                    field.value = settings[key];
                }
            }
        });
    }

    async loadUserStatistics() {
        try {
            const currentUser = this.userRepository.getCurrentUser();
            if (!currentUser || currentUser.isGuest) return;

            const stats = await this.typingService.getUserStatistics(currentUser.id);
            this.displayUserStatistics(stats);
        } catch (error) {
            console.warn('Failed to load user statistics:', error);
        }
    }

    displayUserStatistics(stats) {
        const statsContainer = document.getElementById('user-statistics');
        if (!statsContainer || !stats) return;

        statsContainer.innerHTML = `
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-label">Total Sessions:</span>
                    <span class="stat-value">${stats.totalSessions}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Average Accuracy:</span>
                    <span class="stat-value">${stats.averageAccuracy.toFixed(1)}%</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Best Accuracy:</span>
                    <span class="stat-value">${stats.bestAccuracy.toFixed(1)}%</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Average WPM:</span>
                    <span class="stat-value">${Math.round(stats.averageWpm)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Best WPM:</span>
                    <span class="stat-value">${Math.round(stats.bestWpm)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Total Time:</span>
                    <span class="stat-value">${stats.totalTime}</span>
                </div>
            </div>
        `;
    }

    validateSettings(settings) {
        const errors = [];

        if (settings.fontSize < 10 || settings.fontSize > 24) {
            errors.push(ValidationError.invalidRange('fontSize', 10, 24, settings.fontSize));
        }

        if (!['light', 'dark'].includes(settings.theme)) {
            errors.push(ValidationError.invalidValue('theme', ['light', 'dark'], settings.theme));
        }

        return errors.length > 0 ? ValidationResult.failure(errors) : ValidationResult.success();
    }

    // Additional utility methods
    insertTab(inputElement) {
        const start = inputElement.selectionStart;
        const end = inputElement.selectionEnd;
        const value = inputElement.value;
        
        inputElement.value = value.substring(0, start) + '\t' + value.substring(end);
        inputElement.selectionStart = inputElement.selectionEnd = start + 1;
        
        // Trigger input event
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    }

    clearTypingInput() {
        const typingInput = document.getElementById('typing-input');
        if (typingInput) {
            typingInput.value = '';
        }
    }

    clearTypingFeedback() {
        const accuracyDisplay = document.getElementById('accuracy-display');
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');

        if (accuracyDisplay) accuracyDisplay.textContent = '100%';
        if (progressBar) progressBar.style.width = '0%';
        if (progressText) progressText.textContent = '0 / 0 characters';
    }

    getCurrentStudyBook() {
        return this.sessionRepository.getCurrentStudyBook();
    }

    setCurrentStudyBook(studyBook) {
        this.sessionRepository.setCurrentStudyBook(studyBook);
    }

    clearCurrentStudyBook() {
        this.sessionRepository.clearCurrentStudyBook();
    }

    getSelectedLanguage() {
        const languageSelect = document.getElementById('language-select');
        return languageSelect ? languageSelect.value : null;
    }

    displayStudyBook(studyBook) {
        const studyBookDisplay = document.getElementById('current-studybook-display');
        if (studyBookDisplay) {
            studyBookDisplay.innerHTML = `
                <div class="studybook-preview">
                    <div class="studybook-header">
                        <span class="language-tag">${this.escapeHtml(studyBook.language)}</span>
                        <span class="difficulty-level">Level ${studyBook.getDifficultyLevel()}</span>
                    </div>
                    <div class="studybook-question">
                        <pre><code>${this.escapeHtml(studyBook.question.substring(0, 200))}${studyBook.question.length > 200 ? '...' : ''}</code></pre>
                    </div>
                </div>
            `;
        }
    }

    displayExplanation(explanation) {
        const modal = document.getElementById('explanation-modal') || this.createExplanationModal();
        const content = modal.querySelector('.explanation-content');
        
        if (content) {
            content.innerHTML = `<pre>${this.escapeHtml(explanation)}</pre>`;
        }
        
        modal.style.display = 'block';
    }

    createExplanationModal() {
        const modal = document.createElement('div');
        modal.id = 'explanation-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Explanation</h3>
                    <button class="close-btn" onclick="this.closest('.modal').style.display='none'">&times;</button>
                </div>
                <div class="explanation-content"></div>
            </div>
        `;
        document.body.appendChild(modal);
        return modal;
    }

    async loadStudyBooksForLanguage(language) {
        // Implementation would load study books for the selected language
        // This would typically call the study book service
    }

    updateSettingsUI(settings) {
        // Update UI elements based on settings
        const form = document.getElementById('typing-settings-form');
        if (form) {
            this.populateSettingsForm(settings);
        }
    }

    // Error handling and UI utility methods
    displayValidationErrors(errors) {
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
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            if (isLoading) {
                button.disabled = true;
                button.dataset.originalText = button.textContent;
                button.textContent = 'Loading...';
            } else {
                button.disabled = false;
                button.textContent = button.dataset.originalText || button.textContent;
            }
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Cleans up event listeners and intervals
     */
    destroy() {
        this.stopTimer();
        this.stopRealTimeUpdates();
        
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners.clear();
    }
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TypingController;
} else if (typeof window !== 'undefined') {
    window.TypingController = TypingController;
}