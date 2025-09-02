/**
 * RegisterForm Component
 * Reusable registration form component with validation and error handling
 */
class RegisterForm {
    /**
     * Creates a new RegisterForm instance
     * @param {HTMLElement} container - Container element for the form
     * @param {Object} options - Configuration options
     */
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            showPasswordStrength: true,
            showPasswordToggle: true,
            showLoginLink: true,
            ...options
        };
        this.eventHandlers = new Map();
        this.validationRules = this.initializeValidationRules();
        this.isSubmitting = false;
    }

    /**
     * Renders the registration form
     */
    render() {
        this.container.innerHTML = this.getFormHTML();
        this.attachEventListeners();
        this.initializeFormElements();
    }

    /**
     * Gets the HTML structure for the registration form
     * @returns {string} HTML string
     * @private
     */
    getFormHTML() {
        return `
            <form class="register-form" id="register-form" novalidate>
                <div class="form-header">
                    <h2>新規登録</h2>
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
                        placeholder="3-20文字の英数字、アンダースコア、ハイフン"
                        autocomplete="username"
                        required
                    >
                    <div class="field-help">英数字、アンダースコア(_)、ハイフン(-)のみ使用可能</div>
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
                            placeholder="6文字以上のパスワード"
                            autocomplete="new-password"
                            required
                        >
                        ${this.options.showPasswordToggle ? `
                            <button type="button" class="password-toggle" id="password-toggle" aria-label="パスワードを表示">
                                <span class="toggle-icon">👁</span>
                            </button>
                        ` : ''}
                    </div>
                    ${this.options.showPasswordStrength ? `
                        <div class="password-strength" id="password-strength">
                            <div class="strength-meter">
                                <div class="strength-bar" id="strength-bar"></div>
                            </div>
                            <div class="strength-text" id="strength-text">パスワード強度: 弱</div>
                        </div>
                    ` : ''}
                    <div class="field-error" id="password-error"></div>
                </div>
                
                <div class="form-group">
                    <label for="confirmPassword" class="form-label">パスワード確認</label>
                    <div class="password-input-container">
                        <input 
                            type="password" 
                            id="confirmPassword" 
                            name="confirmPassword" 
                            class="form-input" 
                            placeholder="パスワードを再入力"
                            autocomplete="new-password"
                            required
                        >
                        ${this.options.showPasswordToggle ? `
                            <button type="button" class="password-toggle" id="confirm-password-toggle" aria-label="パスワード確認を表示">
                                <span class="toggle-icon">👁</span>
                            </button>
                        ` : ''}
                    </div>
                    <div class="field-error" id="confirmPassword-error"></div>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary" id="register-submit">
                        <span class="btn-text">新規登録</span>
                        <span class="btn-loading" style="display: none;">登録中...</span>
                    </button>
                </div>
                
                ${this.options.showLoginLink ? `
                    <div class="form-footer">
                        <p class="footer-text">
                            既にアカウントをお持ちの方は
                            <button type="button" class="link-button" id="login-link">こちら</button>
                        </p>
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
        const form = this.container.querySelector('#register-form');
        const passwordToggle = this.container.querySelector('#password-toggle');
        const confirmPasswordToggle = this.container.querySelector('#confirm-password-toggle');
        const loginLink = this.container.querySelector('#login-link');
        const passwordInput = this.container.querySelector('#password');

        // Form submission
        if (form) {
            const submitHandler = (event) => this.handleSubmit(event);
            form.addEventListener('submit', submitHandler);
            this.eventHandlers.set('form-submit', { element: form, event: 'submit', handler: submitHandler });
        }

        // Password toggles
        if (passwordToggle) {
            const toggleHandler = () => this.togglePasswordVisibility('password');
            passwordToggle.addEventListener('click', toggleHandler);
            this.eventHandlers.set('password-toggle', { element: passwordToggle, event: 'click', handler: toggleHandler });
        }

        if (confirmPasswordToggle) {
            const toggleHandler = () => this.togglePasswordVisibility('confirmPassword');
            confirmPasswordToggle.addEventListener('click', toggleHandler);
            this.eventHandlers.set('confirm-password-toggle', { element: confirmPasswordToggle, event: 'click', handler: toggleHandler });
        }

        // Login link
        if (loginLink) {
            const loginHandler = (event) => this.handleLoginClick(event);
            loginLink.addEventListener('click', loginHandler);
            this.eventHandlers.set('login-link', { element: loginLink, event: 'click', handler: loginHandler });
        }

        // Password strength indicator
        if (passwordInput && this.options.showPasswordStrength) {
            const strengthHandler = () => this.updatePasswordStrength();
            passwordInput.addEventListener('input', strengthHandler);
            this.eventHandlers.set('password-strength', { element: passwordInput, event: 'input', handler: strengthHandler });
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

        // Initialize password strength
        if (this.options.showPasswordStrength) {
            this.updatePasswordStrength();
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
            // Emit register event with form data
            this.emit('register', {
                loginId: formData.loginId,
                password: formData.password
            });
        } catch (error) {
            this.displayError('登録処理中にエラーが発生しました。');
        }
    }

    /**
     * Handles login link click
     * @param {Event} event - Click event
     * @private
     */
    handleLoginClick(event) {
        event.preventDefault();
        this.emit('loginClick');
    }

    /**
     * Toggles password visibility
     * @param {string} fieldName - Field name (password or confirmPassword)
     * @private
     */
    togglePasswordVisibility(fieldName) {
        const passwordInput = this.container.querySelector(`#${fieldName}`);
        const toggleButton = this.container.querySelector(`#${fieldName === 'password' ? 'password-toggle' : 'confirm-password-toggle'}`);
        const toggleIcon = toggleButton?.querySelector('.toggle-icon');
        
        if (passwordInput && toggleIcon) {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleIcon.textContent = '🙈';
            } else {
                passwordInput.type = 'password';
                toggleIcon.textContent = '👁';
            }
        }
    }

    /**
     * Updates password strength indicator
     * @private
     */
    updatePasswordStrength() {
        const passwordInput = this.container.querySelector('#password');
        const strengthBar = this.container.querySelector('#strength-bar');
        const strengthText = this.container.querySelector('#strength-text');
        
        if (!passwordInput || !strengthBar || !strengthText) {
            return;
        }

        const password = passwordInput.value;
        const strength = this.calculatePasswordStrength(password);
        
        // Update strength bar
        strengthBar.className = `strength-bar strength-${strength.level}`;
        strengthBar.style.width = `${strength.percentage}%`;
        
        // Update strength text
        strengthText.textContent = `パスワード強度: ${strength.text}`;
        strengthText.className = `strength-text strength-${strength.level}`;
    }

    /**
     * Calculates password strength
     * @param {string} password - Password to evaluate
     * @returns {Object} Strength information
     * @private
     */
    calculatePasswordStrength(password) {
        if (!password) {
            return { level: 'none', percentage: 0, text: '未入力' };
        }

        let score = 0;
        const checks = {
            length: password.length >= 8,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            numbers: /\d/.test(password),
            symbols: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
        };

        // Length scoring
        if (password.length >= 6) score += 1;
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;

        // Character type scoring
        Object.values(checks).forEach(check => {
            if (check) score += 1;
        });

        // Determine strength level
        if (score <= 2) {
            return { level: 'weak', percentage: 25, text: '弱' };
        } else if (score <= 4) {
            return { level: 'medium', percentage: 50, text: '普通' };
        } else if (score <= 6) {
            return { level: 'strong', percentage: 75, text: '強' };
        } else {
            return { level: 'very-strong', percentage: 100, text: '非常に強' };
        }
    }

    /**
     * Gets form data as an object
     * @returns {Object} Form data
     * @private
     */
    getFormData() {
        const form = this.container.querySelector('#register-form');
        const formData = new FormData(form);
        return {
            loginId: formData.get('loginId')?.trim() || '',
            password: formData.get('password') || '',
            confirmPassword: formData.get('confirmPassword') || ''
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
                { type: 'maxLength', value: 20, message: 'ログインIDは20文字以下で入力してください。' },
                { type: 'pattern', value: /^[a-zA-Z0-9_-]+$/, message: '英数字、アンダースコア、ハイフンのみ使用できます。' }
            ],
            password: [
                { type: 'required', message: 'パスワードを入力してください。' },
                { type: 'minLength', value: 6, message: 'パスワードは6文字以上で入力してください。' },
                { type: 'maxLength', value: 50, message: 'パスワードは50文字以下で入力してください。' }
            ],
            confirmPassword: [
                { type: 'required', message: 'パスワード確認を入力してください。' },
                { type: 'match', field: 'password', message: 'パスワードが一致しません。' }
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
            const fieldErrors = this.validateFieldValue(field, data[field], data);
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

        const formData = this.getFormData();
        const errors = this.validateFieldValue(fieldName, input.value, formData);
        
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
     * @param {Object} allData - All form data (for cross-field validation)
     * @returns {Array} Array of errors
     * @private
     */
    validateFieldValue(fieldName, value, allData = {}) {
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
                case 'pattern':
                    if (value && !rule.value.test(value)) {
                        errors.push({ field: fieldName, message: rule.message });
                    }
                    break;
                case 'match':
                    if (value && allData[rule.field] && value !== allData[rule.field]) {
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
        
        const submitBtn = this.container.querySelector('#register-submit');
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
        const otherButtons = this.container.querySelectorAll('#login-link');
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
        const event = new CustomEvent(`registerForm:${eventName}`, {
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
        this.container.addEventListener(`registerForm:${eventName}`, handler);
    }

    /**
     * Removes an event listener
     * @param {string} eventName - Event name
     * @param {Function} handler - Event handler
     */
    off(eventName, handler) {
        this.container.removeEventListener(`registerForm:${eventName}`, handler);
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
    module.exports = RegisterForm;
} else if (typeof window !== 'undefined') {
    window.RegisterForm = RegisterForm;
}