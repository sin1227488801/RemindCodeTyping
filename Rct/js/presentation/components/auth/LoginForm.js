/**
 * LoginForm Component
 * Reusable login form component with validation and error handling
 */
class LoginForm {
    /**
     * Creates a new LoginForm instance
     * @param {HTMLElement} container - Container element for the form
     * @param {Object} options - Configuration options
     */
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            showGuestLogin: true,
            showRegisterLink: true,
            showPasswordToggle: true,
            ...options
        };
        this.eventHandlers = new Map();
        this.validationRules = this.initializeValidationRules();
        this.isSubmitting = false;
    }

    /**
     * Renders the login form
     */
    render() {
        this.container.innerHTML = this.getFormHTML();
        this.attachEventListeners();
        this.initializeFormElements();
    }

    /**
     * Gets the HTML structure for the login form
     * @returns {string} HTML string
     * @private
     */
    getFormHTML() {
        return `
            <form class="login-form" id="login-form" novalidate>
                <div class="form-header">
                    <h2>ログイン</h2>
                </div>
                
                <div class="error-container" id="error-container" style="display: none;"></div>
                <div class="success-container" id="success-container" style="display: none;"></div>
                
                <div class="form-group">
                    <label for="loginId" class="form-label">ログインID</label>
                    <input 
                        type="text" 
                        id="loginId" 
                        name="loginId" 
                        class="form-input" 
                        placeholder="IDを入力"
                        autocomplete="username"
                        required
                    >
                    <div class="field-error" id="loginId-error"></div>
                </div>
                
                <div class="form-group">
                    <label for="password" class="form-label">パスワード</label>
                    <div class="password-input-container">
                        <input 
                            type="password" 
                            id="password" 
                            name="password" 
                            class="form-input" 
                            placeholder="パスワードを入力"
                            autocomplete="current-password"
                            required
                        >
                        ${this.options.showPasswordToggle ? `
                            <button type="button" class="password-toggle" id="password-toggle" aria-label="パスワードを表示">
                                <span class="toggle-icon">👁</span>
                            </button>
                        ` : ''}
                    </div>
                    <div class="field-error" id="password-error"></div>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary" id="login-submit">
                        <span class="btn-text">ログイン</span>
                        <span class="btn-loading" style="display: none;">ログイン中...</span>
                    </button>
                </div>
                
                ${this.options.showGuestLogin || this.options.showRegisterLink ? `
                    <div class="form-footer">
                        <p class="footer-text">IDをお持ちでない方</p>
                        <div class="footer-actions">
                            ${this.options.showGuestLogin ? `
                                <button type="button" class="btn btn-secondary" id="guest-login">
                                    ゲストプレイ
                                </button>
                            ` : ''}
                            ${this.options.showRegisterLink ? `
                                <button type="button" class="btn btn-secondary" id="register-link">
                                    新規登録
                                </button>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}
            </form>
        `;
    }

    /**
     * Attaches event listeners to form elements
     * @private
     */
    attachEventListeners() {
        const form = this.container.querySelector('#login-form');
        const passwordToggle = this.container.querySelector('#password-toggle');
        const guestLoginBtn = this.container.querySelector('#guest-login');
        const registerBtn = this.container.querySelector('#register-link');

        // Form submission
        if (form) {
            const submitHandler = (event) => this.handleSubmit(event);
            form.addEventListener('submit', submitHandler);
            this.eventHandlers.set('form-submit', { element: form, event: 'submit', handler: submitHandler });
        }

        // Password toggle
        if (passwordToggle) {
            const toggleHandler = () => this.togglePasswordVisibility();
            passwordToggle.addEventListener('click', toggleHandler);
            this.eventHandlers.set('password-toggle', { element: passwordToggle, event: 'click', handler: toggleHandler });
        }

        // Guest login
        if (guestLoginBtn) {
            const guestHandler = (event) => this.handleGuestLogin(event);
            guestLoginBtn.addEventListener('click', guestHandler);
            this.eventHandlers.set('guest-login', { element: guestLoginBtn, event: 'click', handler: guestHandler });
        }

        // Register link
        if (registerBtn) {
            const registerHandler = (event) => this.handleRegisterClick(event);
            registerBtn.addEventListener('click', registerHandler);
            this.eventHandlers.set('register-link', { element: registerBtn, event: 'click', handler: registerHandler });
        }

        // Real-time validation
        this.attachValidationListeners();
    }

    /**
     * Attaches real-time validation listeners
     * @private
     */
    attachValidationListeners() {
        const inputs = this.container.querySelectorAll('.form-input');
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
            // Emit login event with form data
            this.emit('login', formData);
        } catch (error) {
            this.displayError('ログイン処理中にエラーが発生しました。');
        }
    }

    /**
     * Handles guest login button click
     * @param {Event} event - Click event
     * @private
     */
    handleGuestLogin(event) {
        event.preventDefault();
        this.emit('guestLogin');
    }

    /**
     * Handles register button click
     * @param {Event} event - Click event
     * @private
     */
    handleRegisterClick(event) {
        event.preventDefault();
        this.emit('registerClick');
    }

    /**
     * Toggles password visibility
     * @private
     */
    togglePasswordVisibility() {
        const passwordInput = this.container.querySelector('#password');
        const toggleIcon = this.container.querySelector('.toggle-icon');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.textContent = '🙈';
        } else {
            passwordInput.type = 'password';
            toggleIcon.textContent = '👁';
        }
    }

    /**
     * Gets form data as an object
     * @returns {Object} Form data
     * @private
     */
    getFormData() {
        const form = this.container.querySelector('#login-form');
        const formData = new FormData(form);
        return {
            loginId: formData.get('loginId')?.trim() || '',
            password: formData.get('password') || ''
        };
    }

    /**
     * Initializes validation rules
     * @returns {Object} Validation rules
     * @private
     */
    initializeValidationRules() {
        return {
            loginId: [
                { type: 'required', message: 'ログインIDを入力してください。' },
                { type: 'minLength', value: 3, message: 'ログインIDは3文字以上で入力してください。' },
                { type: 'maxLength', value: 20, message: 'ログインIDは20文字以下で入力してください。' }
            ],
            password: [
                { type: 'required', message: 'パスワードを入力してください。' },
                { type: 'minLength', value: 6, message: 'パスワードは6文字以上で入力してください。' }
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
        
        const submitBtn = this.container.querySelector('#login-submit');
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

        // Disable other buttons
        const otherButtons = this.container.querySelectorAll('#guest-login, #register-link');
        otherButtons.forEach(btn => {
            btn.disabled = isSubmitting;
        });
    }

    /**
     * Emits a custom event
     * @param {string} eventName - Event name
     * @param {*} data - Event data
     * @private
     */
    emit(eventName, data = null) {
        const event = new CustomEvent(`loginForm:${eventName}`, {
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
        this.container.addEventListener(`loginForm:${eventName}`, handler);
    }

    /**
     * Removes an event listener
     * @param {string} eventName - Event name
     * @param {Function} handler - Event handler
     */
    off(eventName, handler) {
        this.container.removeEventListener(`loginForm:${eventName}`, handler);
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
    module.exports = LoginForm;
} else if (typeof window !== 'undefined') {
    window.LoginForm = LoginForm;
}