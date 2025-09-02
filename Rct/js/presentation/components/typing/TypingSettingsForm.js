/**
 * TypingSettingsForm Component
 * Reusable component for typing practice settings configuration
 */
class TypingSettingsForm {
    /**
     * Creates a new TypingSettingsForm instance
     * @param {HTMLElement} container - Container element for the form
     * @param {Object} options - Configuration options
     */
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            showUserStats: true,
            showRankList: true,
            defaultSettings: {
                problemSource: 'system',
                languages: ['JavaScript'],
                rule: 'option1',
                problemCount: 10,
                timeLimit: 10
            },
            availableLanguages: ['JavaScript', 'Java', 'Python', 'C++', 'C#', 'TypeScript', 'HTML', 'CSS', 'SQL'],
            ...options
        };
        this.eventHandlers = new Map();
        this.validationRules = this.initializeValidationRules();
        this.isSubmitting = false;
        this.userStats = null;
    }

    /**
     * Renders the typing settings form
     */
    render() {
        this.container.innerHTML = this.getFormHTML();
        this.attachEventListeners();
        this.initializeFormElements();
        this.populateLanguageOptions();
        
        if (this.options.showUserStats) {
            this.loadUserStats();
        }
    }

    /**
     * Gets the HTML structure for the settings form
     * @returns {string} HTML string
     * @private
     */
    getFormHTML() {
        return `
            <div class="typing-settings-form">
                <div class="settings-header">
                    <h2>タイピング訓練(設定)</h2>
                    ${this.options.showUserStats ? `
                        <div class="user-stats" id="user-stats">
                            <div id="stats-loading" class="stats-loading" style="display: none;">
                                統計情報を読み込み中...
                            </div>
                            <div id="stats-display" class="stats-display">
                                <span id="recent-accuracy">直近の正答率 ---%</span><br>
                                <span id="highest-rank">最高ランク ---</span>
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="settings-content">
                    <div class="settings-form">
                        <form id="typing-settings-form" novalidate>
                            <div class="form-group">
                                <label for="problem-source" class="form-label">問題選択</label>
                                <select id="problem-source" name="problemSource" class="form-select">
                                    <option value="system">システム問題（基礎学習用）</option>
                                    <option value="user">My問題（自作問題）</option>
                                    <option value="mixed">ミックス（システム + My問題）</option>
                                </select>
                                <div class="field-error" id="problemSource-error"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="languages" class="form-label">言語選択</label>
                                <div class="language-selection">
                                    <select id="languages" name="languages" class="form-select" multiple size="8">
                                        <!-- Options will be populated dynamically -->
                                    </select>
                                    <div class="selection-help">
                                        Ctrl または Cmd キーを使用して複数選択
                                    </div>
                                </div>
                                <div class="field-error" id="languages-error"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="rule" class="form-label">ルール選択</label>
                                <select id="rule" name="rule" class="form-select">
                                    <option value="random">ランダム出題</option>
                                    <option value="weak-priority">苦手優先</option>
                                    <option value="strong-priority">得意優先</option>
                                    <option value="newest-first">登録順(新しい順)</option>
                                    <option value="oldest-first">登録順(古い順)</option>
                                </select>
                                <div class="field-error" id="rule-error"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="problem-count" class="form-label">問題数選択 (1-20問)</label>
                                <input 
                                    type="number" 
                                    id="problem-count" 
                                    name="problemCount" 
                                    class="form-input"
                                    min="1" 
                                    max="20" 
                                    value="10"
                                    placeholder="1-20の数値を入力"
                                >
                                <div class="field-error" id="problemCount-error"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="time-limit" class="form-label">挑戦時間選択(分単位)</label>
                                <select id="time-limit" name="timeLimit" class="form-select">
                                    <option value="5">5分</option>
                                    <option value="10">10分</option>
                                    <option value="15">15分</option>
                                    <option value="20">20分</option>
                                    <option value="25">25分</option>
                                    <option value="30">30分</option>
                                </select>
                                <div class="field-error" id="timeLimit-error"></div>
                            </div>
                            
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary" id="start-btn">
                                    <span class="btn-text">Start！</span>
                                    <span class="btn-loading" style="display: none;">準備中...</span>
                                </button>
                            </div>
                        </form>
                    </div>
                    
                    ${this.options.showRankList ? `
                        <div class="rank-section">
                            <h3>評価ランク一覧</h3>
                            <div class="rank-list">
                                <ul>
                                    <li class="rank-item rank-shodan-special" data-rank="shodan" data-tooltip="最高ランク！">
                                        <span class="rank-name">初段</span>
                                        <span class="rank-points">100~</span>
                                        <div class="highlight-effect"></div>
                                    </li>
                                    <li class="rank-item rank-1-special" data-rank="1kyu" data-tooltip="ワープロ検定1級相当！">
                                        <span class="rank-name">1級</span>
                                        <span class="rank-points">70~</span>
                                        <div class="highlight-effect"></div>
                                    </li>
                                    <li class="rank-item" data-rank="jun1kyu">
                                        <span class="rank-name">準1級</span>
                                        <span class="rank-points">60~</span>
                                    </li>
                                    <li class="rank-item rank-2-special" data-rank="2kyu" data-tooltip="ワープロ検定2級相当！">
                                        <span class="rank-name">2級</span>
                                        <span class="rank-points">50~</span>
                                        <div class="highlight-effect"></div>
                                    </li>
                                    <li class="rank-item" data-rank="jun2kyu">
                                        <span class="rank-name">準2級</span>
                                        <span class="rank-points">40~</span>
                                    </li>
                                    <li class="rank-item" data-rank="3kyu">
                                        <span class="rank-name">3級</span>
                                        <span class="rank-points">30~</span>
                                    </li>
                                    <li class="rank-item" data-rank="4kyu">
                                        <span class="rank-name">4級</span>
                                        <span class="rank-points">~29</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <!-- Rank Detail Modal -->
                <div id="rank-modal" class="modal" style="display: none;">
                    <div class="modal-content">
                        <span class="modal-close" id="modal-close">&times;</span>
                        <h3 id="modal-rank-title">ランク詳細</h3>
                        <div id="modal-rank-content">
                            <p id="modal-rank-description"></p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Attaches event listeners to form elements
     * @private
     */
    attachEventListeners() {
        const form = this.container.querySelector('#typing-settings-form');
        const rankItems = this.container.querySelectorAll('.rank-item');
        const modalClose = this.container.querySelector('#modal-close');

        // Form submission
        if (form) {
            const submitHandler = (event) => this.handleSubmit(event);
            form.addEventListener('submit', submitHandler);
            this.eventHandlers.set('form-submit', { element: form, event: 'submit', handler: submitHandler });
        }

        // Rank item clicks
        rankItems.forEach(item => {
            const clickHandler = () => this.handleRankClick(item);
            item.addEventListener('click', clickHandler);
            this.eventHandlers.set(`rank-${item.dataset.rank}`, { element: item, event: 'click', handler: clickHandler });
        });

        // Modal close
        if (modalClose) {
            const closeHandler = () => this.closeRankModal();
            modalClose.addEventListener('click', closeHandler);
            this.eventHandlers.set('modal-close', { element: modalClose, event: 'click', handler: closeHandler });
        }

        // Real-time validation
        this.attachValidationListeners();
    }

    /**
     * Attaches real-time validation listeners
     * @private
     */
    attachValidationListeners() {
        const inputs = this.container.querySelectorAll('.form-input, .form-select');
        inputs.forEach(input => {
            const changeHandler = () => this.validateField(input.name);
            const inputHandler = () => this.clearFieldError(input.name);
            
            input.addEventListener('change', changeHandler);
            input.addEventListener('input', inputHandler);
            
            this.eventHandlers.set(`${input.name}-change`, { element: input, event: 'change', handler: changeHandler });
            this.eventHandlers.set(`${input.name}-input`, { element: input, event: 'input', handler: inputHandler });
        });
    }

    /**
     * Initializes form elements with default values
     * @private
     */
    initializeFormElements() {
        const defaults = this.options.defaultSettings;
        
        // Set default values
        const problemSourceSelect = this.container.querySelector('#problem-source');
        const ruleSelect = this.container.querySelector('#rule');
        const problemCountInput = this.container.querySelector('#problem-count');
        const timeLimitSelect = this.container.querySelector('#time-limit');

        if (problemSourceSelect) {
            problemSourceSelect.value = defaults.problemSource;
        }
        if (ruleSelect) {
            ruleSelect.value = defaults.rule;
        }
        if (problemCountInput) {
            problemCountInput.value = defaults.problemCount;
        }
        if (timeLimitSelect) {
            timeLimitSelect.value = defaults.timeLimit;
        }
    }

    /**
     * Populates language options in the select
     * @private
     */
    populateLanguageOptions() {
        const languageSelect = this.container.querySelector('#languages');
        if (!languageSelect) return;

        languageSelect.innerHTML = '';
        this.options.availableLanguages.forEach(language => {
            const option = document.createElement('option');
            option.value = language;
            option.textContent = language;
            
            // Select default languages
            if (this.options.defaultSettings.languages.includes(language)) {
                option.selected = true;
            }
            
            languageSelect.appendChild(option);
        });
    }

    /**
     * Loads user statistics
     * @private
     */
    async loadUserStats() {
        const statsLoading = this.container.querySelector('#stats-loading');
        const statsDisplay = this.container.querySelector('#stats-display');
        
        if (statsLoading) {
            statsLoading.style.display = 'block';
        }
        if (statsDisplay) {
            statsDisplay.style.display = 'none';
        }

        try {
            // Emit event to request user stats
            this.emit('loadStats');
        } catch (error) {
            console.error('Failed to load user stats:', error);
            this.displayUserStats(null);
        }
    }

    /**
     * Displays user statistics
     * @param {Object} stats - User statistics data
     */
    displayUserStats(stats) {
        const statsLoading = this.container.querySelector('#stats-loading');
        const statsDisplay = this.container.querySelector('#stats-display');
        const recentAccuracy = this.container.querySelector('#recent-accuracy');
        const highestRank = this.container.querySelector('#highest-rank');
        
        if (statsLoading) {
            statsLoading.style.display = 'none';
        }
        if (statsDisplay) {
            statsDisplay.style.display = 'block';
        }

        if (stats && recentAccuracy && highestRank) {
            recentAccuracy.textContent = `直近の正答率 ${stats.recentAccuracy || '---'}%`;
            highestRank.textContent = `最高ランク ${stats.highestRank || '---'}`;
        } else if (recentAccuracy && highestRank) {
            recentAccuracy.textContent = '直近の正答率 ---%';
            highestRank.textContent = '最高ランク ---';
        }

        this.userStats = stats;
    }

    /**
     * Handles form submission
     * @param {Event} event - Submit event
     * @private
     */
    async handleSubmit(event) {
        event.preventDefault();
        
        if (this.isSubmitting) {
            return;
        }

        const formData = this.getFormData();
        const validationResult = this.validateForm(formData);

        if (!validationResult.isValid) {
            this.displayValidationErrors(validationResult.errors);
            return;
        }

        this.clearErrors();
        this.setSubmittingState(true);

        try {
            // Emit start event with settings
            this.emit('start', formData);
        } catch (error) {
            console.error('Failed to start typing practice:', error);
            this.setSubmittingState(false);
        }
    }

    /**
     * Handles rank item click
     * @param {HTMLElement} rankItem - Clicked rank item
     * @private
     */
    handleRankClick(rankItem) {
        const rank = rankItem.dataset.rank;
        const tooltip = rankItem.dataset.tooltip;
        
        if (tooltip) {
            this.showRankModal(rank, tooltip);
        }
    }

    /**
     * Shows rank detail modal
     * @param {string} rank - Rank identifier
     * @param {string} description - Rank description
     * @private
     */
    showRankModal(rank, description) {
        const modal = this.container.querySelector('#rank-modal');
        const title = this.container.querySelector('#modal-rank-title');
        const content = this.container.querySelector('#modal-rank-description');
        
        if (modal && title && content) {
            title.textContent = this.getRankDisplayName(rank);
            content.textContent = description;
            modal.style.display = 'block';
        }
    }

    /**
     * Closes rank detail modal
     * @private
     */
    closeRankModal() {
        const modal = this.container.querySelector('#rank-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Gets display name for rank
     * @param {string} rank - Rank identifier
     * @returns {string} Display name
     * @private
     */
    getRankDisplayName(rank) {
        const rankNames = {
            'shodan': '初段',
            '1kyu': '1級',
            'jun1kyu': '準1級',
            '2kyu': '2級',
            'jun2kyu': '準2級',
            '3kyu': '3級',
            '4kyu': '4級'
        };
        return rankNames[rank] || rank;
    }

    /**
     * Gets form data as an object
     * @returns {Object} Form data
     * @private
     */
    getFormData() {
        const form = this.container.querySelector('#typing-settings-form');
        const formData = new FormData(form);
        
        // Handle multiple select for languages
        const languageSelect = this.container.querySelector('#languages');
        const selectedLanguages = Array.from(languageSelect.selectedOptions).map(option => option.value);
        
        return {
            problemSource: formData.get('problemSource'),
            languages: selectedLanguages,
            rule: formData.get('rule'),
            problemCount: parseInt(formData.get('problemCount'), 10),
            timeLimit: parseInt(formData.get('timeLimit'), 10)
        };
    }

    /**
     * Initializes validation rules
     * @returns {Object} Validation rules
     * @private
     */
    initializeValidationRules() {
        return {
            problemSource: [
                { type: 'required', message: '問題選択を選んでください。' }
            ],
            languages: [
                { type: 'required', message: '言語を1つ以上選択してください。' }
            ],
            rule: [
                { type: 'required', message: 'ルールを選択してください。' }
            ],
            problemCount: [
                { type: 'required', message: '問題数を入力してください。' },
                { type: 'min', value: 1, message: '問題数は1以上で入力してください。' },
                { type: 'max', value: 20, message: '問題数は20以下で入力してください。' }
            ],
            timeLimit: [
                { type: 'required', message: '挑戦時間を選択してください。' }
            ]
        };
    }

    /**
     * Validates the entire form
     * @param {Object} data - Form data
     * @returns {Object} Validation result
     * @private
     */
    validateForm(data) {
        const errors = [];

        // Validate each field
        Object.keys(this.validationRules).forEach(field => {
            const fieldErrors = this.validateFieldValue(field, data[field]);
            errors.push(...fieldErrors);
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validates a single field
     * @param {string} fieldName - Field name
     * @returns {boolean} Whether field is valid
     * @private
     */
    validateField(fieldName) {
        const formData = this.getFormData();
        const errors = this.validateFieldValue(fieldName, formData[fieldName]);
        
        if (errors.length > 0) {
            this.displayFieldError(fieldName, errors[0].message);
            return false;
        } else {
            this.clearFieldError(fieldName);
            return true;
        }
    }

    /**
     * Validates a field value against rules
     * @param {string} fieldName - Field name
     * @param {*} value - Field value
     * @returns {Array} Array of errors
     * @private
     */
    validateFieldValue(fieldName, value) {
        const rules = this.validationRules[fieldName] || [];
        const errors = [];

        rules.forEach(rule => {
            switch (rule.type) {
                case 'required':
                    if (fieldName === 'languages') {
                        if (!value || !Array.isArray(value) || value.length === 0) {
                            errors.push({ field: fieldName, message: rule.message });
                        }
                    } else {
                        if (!value || (typeof value === 'string' && value.trim() === '')) {
                            errors.push({ field: fieldName, message: rule.message });
                        }
                    }
                    break;
                case 'min':
                    if (typeof value === 'number' && value < rule.value) {
                        errors.push({ field: fieldName, message: rule.message });
                    }
                    break;
                case 'max':
                    if (typeof value === 'number' && value > rule.value) {
                        errors.push({ field: fieldName, message: rule.message });
                    }
                    break;
            }
        });

        return errors;
    }

    /**
     * Displays validation errors
     * @param {Array} errors - Array of validation errors
     * @private
     */
    displayValidationErrors(errors) {
        errors.forEach(error => {
            this.displayFieldError(error.field, error.message);
        });

        // Focus on first error field
        if (errors.length > 0) {
            const firstErrorField = this.container.querySelector(`[name="${errors[0].field}"]`);
            if (firstErrorField) {
                firstErrorField.focus();
            }
        }
    }

    /**
     * Displays error for a specific field
     * @param {string} fieldName - Field name
     * @param {string} message - Error message
     * @private
     */
    displayFieldError(fieldName, message) {
        const input = this.container.querySelector(`[name="${fieldName}"]`);
        const errorElement = this.container.querySelector(`#${fieldName}-error`);
        
        if (input) {
            input.classList.add('error');
        }
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    /**
     * Clears error for a specific field
     * @param {string} fieldName - Field name
     * @private
     */
    clearFieldError(fieldName) {
        const input = this.container.querySelector(`[name="${fieldName}"]`);
        const errorElement = this.container.querySelector(`#${fieldName}-error`);
        
        if (input) {
            input.classList.remove('error');
        }
        
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }

    /**
     * Clears all error messages
     */
    clearErrors() {
        Object.keys(this.validationRules).forEach(fieldName => {
            this.clearFieldError(fieldName);
        });
    }

    /**
     * Sets the submitting state
     * @param {boolean} isSubmitting - Whether form is submitting
     */
    setSubmittingState(isSubmitting) {
        this.isSubmitting = isSubmitting;
        
        const submitBtn = this.container.querySelector('#start-btn');
        const btnText = submitBtn?.querySelector('.btn-text');
        const btnLoading = submitBtn?.querySelector('.btn-loading');
        
        if (submitBtn) {
            submitBtn.disabled = isSubmitting;
        }
        
        if (btnText && btnLoading) {
            if (isSubmitting) {
                btnText.style.display = 'none';
                btnLoading.style.display = 'inline';
            } else {
                btnText.style.display = 'inline';
                btnLoading.style.display = 'none';
            }
        }

        // Disable form inputs
        const inputs = this.container.querySelectorAll('.form-input, .form-select');
        inputs.forEach(input => {
            input.disabled = isSubmitting;
        });
    }

    /**
     * Sets the form settings
     * @param {Object} settings - Settings to apply
     */
    setSettings(settings) {
        if (!settings) return;

        const problemSourceSelect = this.container.querySelector('#problem-source');
        const languageSelect = this.container.querySelector('#languages');
        const ruleSelect = this.container.querySelector('#rule');
        const problemCountInput = this.container.querySelector('#problem-count');
        const timeLimitSelect = this.container.querySelector('#time-limit');

        if (problemSourceSelect && settings.problemSource) {
            problemSourceSelect.value = settings.problemSource;
        }
        
        if (languageSelect && settings.languages) {
            Array.from(languageSelect.options).forEach(option => {
                option.selected = settings.languages.includes(option.value);
            });
        }
        
        if (ruleSelect && settings.rule) {
            ruleSelect.value = settings.rule;
        }
        
        if (problemCountInput && settings.problemCount) {
            problemCountInput.value = settings.problemCount;
        }
        
        if (timeLimitSelect && settings.timeLimit) {
            timeLimitSelect.value = settings.timeLimit;
        }
    }

    /**
     * Gets current form settings
     * @returns {Object} Current settings
     */
    getSettings() {
        return this.getFormData();
    }

    /**
     * Emits a custom event
     * @param {string} eventName - Event name
     * @param {*} data - Event data
     * @private
     */
    emit(eventName, data = null) {
        const event = new CustomEvent(`typingSettings:${eventName}`, {
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
        this.container.addEventListener(`typingSettings:${eventName}`, handler);
    }

    /**
     * Removes an event listener
     * @param {string} eventName - Event name
     * @param {Function} handler - Event handler
     */
    off(eventName, handler) {
        this.container.removeEventListener(`typingSettings:${eventName}`, handler);
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
    module.exports = TypingSettingsForm;
} else if (typeof window !== 'undefined') {
    window.TypingSettingsForm = TypingSettingsForm;
}