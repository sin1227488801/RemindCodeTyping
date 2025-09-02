/**
 * StudyBookForm Component
 * Reusable form component for creating and editing study books
 */
class StudyBookForm {
    /**
     * Creates a new StudyBookForm instance
     * @param {HTMLElement} container - Container element for the form
     * @param {Object} options - Configuration options
     */
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            mode: 'create', // 'create' or 'edit'
            showLanguageHelp: true,
            showCharacterCount: true,
            availableLanguages: ['JavaScript', 'Java', 'Python', 'C++', 'C#', 'TypeScript', 'HTML', 'CSS', 'SQL'],
            ...options
        };
        this.eventHandlers = new Map();
        this.validationRules = this.initializeValidationRules();
        this.isSubmitting = false;
        this.studyBookData = options.studyBookData || null;
    }

    /**
     * Renders the study book form
     */
    render() {
        this.container.innerHTML = this.getFormHTML();
        this.attachEventListeners();
        this.initializeFormElements();
        this.populateLanguageOptions();
        
        if (this.studyBookData) {
            this.populateFormData();
        }
    }

    /**
     * Gets the HTML structure for the study book form
     * @returns {string} HTML string
     * @private
     */
    getFormHTML() {
        const isEditMode = this.options.mode === 'edit';
        const title = isEditMode ? '学習帳編集' : '新規登録';
        const submitText = isEditMode ? '更新' : '登録';
        const submitLoadingText = isEditMode ? '更新中...' : '登録中...';

        return `
            <form class="studybook-form" id="studybook-form" novalidate>
                <div class="form-header">
                    <h2>${title}</h2>
                </div>
                
                <div class="error-container" id="error-container" style="display: none;"></div>
                <div class="success-container" id="success-container" style="display: none;"></div>
                
                <div class="form-group">
                    <label for="language" class="form-label">
                        言語 <span class="required-mark">*</span>
                    </label>
                    <div class="language-input-container">
                        <input 
                            type="text" 
                            id="language" 
                            name="language" 
                            class="form-input" 
                            list="language-options"
                            placeholder="言語を選択または入力"
                            autocomplete="off"
                            required
                        >
                        <datalist id="language-options">
                            <!-- Options will be populated dynamically -->
                        </datalist>
                    </div>
                    ${this.options.showLanguageHelp ? `
                        <div class="field-help">
                            プルダウンから選択するか、新しい言語名を入力してください
                        </div>
                    ` : ''}
                    <div class="field-error" id="language-error"></div>
                </div>
                
                <div class="form-group">
                    <label for="question" class="form-label">
                        問題 <span class="required-mark">*</span>
                    </label>
                    <textarea 
                        id="question" 
                        name="question" 
                        class="form-textarea" 
                        placeholder="ここに問題文を入力してください"
                        rows="6"
                        required
                    ></textarea>
                    ${this.options.showCharacterCount ? `
                        <div class="character-count">
                            <span id="question-count">0</span> / 1000 文字
                        </div>
                    ` : ''}
                    <div class="field-error" id="question-error"></div>
                </div>
                
                <div class="form-group">
                    <label for="explanation" class="form-label">解説</label>
                    <textarea 
                        id="explanation" 
                        name="explanation" 
                        class="form-textarea" 
                        placeholder="ここに解説を入力してください（任意）"
                        rows="4"
                    ></textarea>
                    ${this.options.showCharacterCount ? `
                        <div class="character-count">
                            <span id="explanation-count">0</span> / 500 文字
                        </div>
                    ` : ''}
                    <div class="field-error" id="explanation-error"></div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" id="cancel-btn">
                        キャンセル
                    </button>
                    <button type="submit" class="btn btn-primary" id="submit-btn">
                        <span class="btn-text">${submitText}</span>
                        <span class="btn-loading" style="display: none;">${submitLoadingText}</span>
                    </button>
                </div>
            </form>
        `;
    }

    /**
     * Attaches event listeners to form elements
     * @private
     */
    attachEventListeners() {
        const form = this.container.querySelector('#studybook-form');
        const cancelBtn = this.container.querySelector('#cancel-btn');
        const questionTextarea = this.container.querySelector('#question');
        const explanationTextarea = this.container.querySelector('#explanation');

        // Form submission
        if (form) {
            const submitHandler = (event) => this.handleSubmit(event);
            form.addEventListener('submit', submitHandler);
            this.eventHandlers.set('form-submit', { element: form, event: 'submit', handler: submitHandler });
        }

        // Cancel button
        if (cancelBtn) {
            const cancelHandler = (event) => this.handleCancel(event);
            cancelBtn.addEventListener('click', cancelHandler);
            this.eventHandlers.set('cancel-btn', { element: cancelBtn, event: 'click', handler: cancelHandler });
        }

        // Character counting
        if (questionTextarea && this.options.showCharacterCount) {
            const questionCountHandler = () => this.updateCharacterCount('question');
            questionTextarea.addEventListener('input', questionCountHandler);
            this.eventHandlers.set('question-count', { element: questionTextarea, event: 'input', handler: questionCountHandler });
        }

        if (explanationTextarea && this.options.showCharacterCount) {
            const explanationCountHandler = () => this.updateCharacterCount('explanation');
            explanationTextarea.addEventListener('input', explanationCountHandler);
            this.eventHandlers.set('explanation-count', { element: explanationTextarea, event: 'input', handler: explanationCountHandler });
        }

        // Real-time validation
        this.attachValidationListeners();
    }

    /**
     * Attaches real-time validation listeners
     * @private
     */
    attachValidationListeners() {
        const inputs = this.container.querySelectorAll('.form-input, .form-textarea');
        inputs.forEach(input => {
            const blurHandler = () => this.validateField(input.name);
            const inputHandler = () => this.clearFieldError(input.name);
            
            input.addEventListener('blur', blurHandler);
            input.addEventListener('input', inputHandler);
            
            this.eventHandlers.set(`${input.name}-blur`, { element: input, event: 'blur', handler: blurHandler });
            this.eventHandlers.set(`${input.name}-input`, { element: input, event: 'input', handler: inputHandler });
        });
    }

    /**
     * Initializes form elements
     * @private
     */
    initializeFormElements() {
        // Focus on first input
        const firstInput = this.container.querySelector('.form-input');
        if (firstInput) {
            firstInput.focus();
        }

        // Initialize character counts
        if (this.options.showCharacterCount) {
            this.updateCharacterCount('question');
            this.updateCharacterCount('explanation');
        }
    }

    /**
     * Populates language options in the datalist
     * @private
     */
    populateLanguageOptions() {
        const datalist = this.container.querySelector('#language-options');
        if (!datalist) return;

        datalist.innerHTML = '';
        this.options.availableLanguages.forEach(language => {
            const option = document.createElement('option');
            option.value = language;
            datalist.appendChild(option);
        });
    }

    /**
     * Populates form with existing study book data (for edit mode)
     * @private
     */
    populateFormData() {
        if (!this.studyBookData) return;

        const languageInput = this.container.querySelector('#language');
        const questionTextarea = this.container.querySelector('#question');
        const explanationTextarea = this.container.querySelector('#explanation');

        if (languageInput && this.studyBookData.language) {
            languageInput.value = this.studyBookData.language;
        }

        if (questionTextarea && this.studyBookData.question) {
            questionTextarea.value = this.studyBookData.question;
        }

        if (explanationTextarea && this.studyBookData.explanation) {
            explanationTextarea.value = this.studyBookData.explanation;
        }

        // Update character counts
        if (this.options.showCharacterCount) {
            this.updateCharacterCount('question');
            this.updateCharacterCount('explanation');
        }
    }

    /**
     * Updates character count for a textarea
     * @param {string} fieldName - Field name
     * @private
     */
    updateCharacterCount(fieldName) {
        const textarea = this.container.querySelector(`#${fieldName}`);
        const countElement = this.container.querySelector(`#${fieldName}-count`);
        
        if (textarea && countElement) {
            const count = textarea.value.length;
            countElement.textContent = count;
            
            // Add warning class if approaching limit
            const maxLength = fieldName === 'question' ? 1000 : 500;
            const warningThreshold = maxLength * 0.9;
            
            countElement.classList.toggle('warning', count >= warningThreshold);
            countElement.classList.toggle('error', count > maxLength);
        }
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
            // Emit appropriate event based on mode
            const eventName = this.options.mode === 'edit' ? 'update' : 'create';
            const eventData = {
                ...formData,
                id: this.studyBookData?.id || null
            };
            
            this.emit(eventName, eventData);
        } catch (error) {
            this.displayError('処理中にエラーが発生しました。');
        }
    }

    /**
     * Handles cancel button click
     * @param {Event} event - Click event
     * @private
     */
    handleCancel(event) {
        event.preventDefault();
        this.emit('cancel');
    }

    /**
     * Gets form data as an object
     * @returns {Object} Form data
     * @private
     */
    getFormData() {
        const form = this.container.querySelector('#studybook-form');
        const formData = new FormData(form);
        return {
            language: formData.get('language')?.trim() || '',
            question: formData.get('question')?.trim() || '',
            explanation: formData.get('explanation')?.trim() || ''
        };
    }

    /**
     * Initializes validation rules
     * @returns {Object} Validation rules
     * @private
     */
    initializeValidationRules() {
        return {
            language: [
                { type: 'required', message: '言語を入力してください。' },
                { type: 'maxLength', value: 50, message: '言語名は50文字以下で入力してください。' }
            ],
            question: [
                { type: 'required', message: '問題を入力してください。' },
                { type: 'minLength', value: 10, message: '問題は10文字以上で入力してください。' },
                { type: 'maxLength', value: 1000, message: '問題は1000文字以下で入力してください。' }
            ],
            explanation: [
                { type: 'maxLength', value: 500, message: '解説は500文字以下で入力してください。' }
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
        const input = this.container.querySelector(`[name="${fieldName}"]`);
        if (!input) return true;

        const errors = this.validateFieldValue(fieldName, input.value);
        
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
     * @param {string} value - Field value
     * @returns {Array} Array of errors
     * @private
     */
    validateFieldValue(fieldName, value) {
        const rules = this.validationRules[fieldName] || [];
        const errors = [];

        rules.forEach(rule => {
            switch (rule.type) {
                case 'required':
                    if (!value || value.trim() === '') {
                        errors.push({ field: fieldName, message: rule.message });
                    }
                    break;
                case 'minLength':
                    if (value && value.length < rule.value) {
                        errors.push({ field: fieldName, message: rule.message });
                    }
                    break;
                case 'maxLength':
                    if (value && value.length > rule.value) {
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
     * Displays a general error message
     * @param {string} message - Error message
     */
    displayError(message) {
        const errorContainer = this.container.querySelector('#error-container');
        if (errorContainer) {
            errorContainer.textContent = message;
            errorContainer.style.display = 'block';
        }
    }

    /**
     * Displays a success message
     * @param {string} message - Success message
     */
    displaySuccess(message) {
        const successContainer = this.container.querySelector('#success-container');
        if (successContainer) {
            successContainer.textContent = message;
            successContainer.style.display = 'block';
        }
    }

    /**
     * Clears all error messages
     */
    clearErrors() {
        // Clear general errors
        const errorContainer = this.container.querySelector('#error-container');
        const successContainer = this.container.querySelector('#success-container');
        
        if (errorContainer) {
            errorContainer.style.display = 'none';
            errorContainer.textContent = '';
        }
        
        if (successContainer) {
            successContainer.style.display = 'none';
            successContainer.textContent = '';
        }

        // Clear field errors
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
        
        const submitBtn = this.container.querySelector('#submit-btn');
        const cancelBtn = this.container.querySelector('#cancel-btn');
        const btnText = submitBtn?.querySelector('.btn-text');
        const btnLoading = submitBtn?.querySelector('.btn-loading');
        
        if (submitBtn) {
            submitBtn.disabled = isSubmitting;
        }
        
        if (cancelBtn) {
            cancelBtn.disabled = isSubmitting;
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
        const inputs = this.container.querySelectorAll('.form-input, .form-textarea');
        inputs.forEach(input => {
            input.disabled = isSubmitting;
        });
    }

    /**
     * Sets the form data (for external updates)
     * @param {Object} data - Study book data
     */
    setFormData(data) {
        this.studyBookData = data;
        this.populateFormData();
    }

    /**
     * Resets the form to initial state
     */
    reset() {
        const form = this.container.querySelector('#studybook-form');
        if (form) {
            form.reset();
        }
        
        this.clearErrors();
        this.setSubmittingState(false);
        
        if (this.options.showCharacterCount) {
            this.updateCharacterCount('question');
            this.updateCharacterCount('explanation');
        }
    }

    /**
     * Emits a custom event
     * @param {string} eventName - Event name
     * @param {*} data - Event data
     * @private
     */
    emit(eventName, data = null) {
        const event = new CustomEvent(`studyBookForm:${eventName}`, {
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
        this.container.addEventListener(`studyBookForm:${eventName}`, handler);
    }

    /**
     * Removes an event listener
     * @param {string} eventName - Event name
     * @param {Function} handler - Event handler
     */
    off(eventName, handler) {
        this.container.removeEventListener(`studyBookForm:${eventName}`, handler);
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
    module.exports = StudyBookForm;
} else if (typeof window !== 'undefined') {
    window.StudyBookForm = StudyBookForm;
}