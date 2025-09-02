/**
 * AuthenticationView Component
 * Main authentication view that manages login and registration forms
 */
class AuthenticationView {
    /**
     * Creates a new AuthenticationView instance
     * @param {HTMLElement} container - Container element for the view
     * @param {Object} dependencies - Required dependencies
     */
    constructor(container, dependencies = {}) {
        this.container = container;
        this.authController = dependencies.authController;
        this.errorHandler = dependencies.errorHandler;
        
        this.currentView = 'login'; // 'login' or 'register'
        this.loginForm = null;
        this.registerForm = null;
        this.eventHandlers = new Map();
    }

    /**
     * Initializes the authentication view
     */
    initialize() {
        this.render();
        this.setupEventListeners();
    }

    /**
     * Renders the authentication view
     * @private
     */
    render() {
        this.container.innerHTML = this.getViewHTML();
        this.initializeForms();
    }

    /**
     * Gets the HTML structure for the authentication view
     * @returns {string} HTML string
     * @private
     */
    getViewHTML() {
        return `
            <div class="auth-view">
                <header class="auth-header">
                    <img src="./images/02_ロゴ基本_白抜き.png" alt="Remind Code Typing Logo" class="auth-logo">
                    <h1 class="auth-title">Remind code typing</h1>
                </header>
                
                <div class="auth-container">
                    <div class="auth-tabs">
                        <button 
                            type="button" 
                            class="auth-tab ${this.currentView === 'login' ? 'active' : ''}" 
                            id="login-tab"
                            data-view="login"
                        >
                            ログイン
                        </button>
                        <button 
                            type="button" 
                            class="auth-tab ${this.currentView === 'register' ? 'active' : ''}" 
                            id="register-tab"
                            data-view="register"
                        >
                            新規登録
                        </button>
                    </div>
                    
                    <div class="auth-content">
                        <div class="auth-form-container" id="auth-form-container">
                            <!-- Forms will be rendered here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Initializes the forms based on current view
     * @private
     */
    initializeForms() {
        const formContainer = this.container.querySelector('#auth-form-container');
        if (!formContainer) return;

        // Clean up existing forms
        this.destroyForms();

        if (this.currentView === 'login') {
            this.initializeLoginForm(formContainer);
        } else if (this.currentView === 'register') {
            this.initializeRegisterForm(formContainer);
        }
    }

    /**
     * Initializes the login form
     * @param {HTMLElement} container - Form container
     * @private
     */
    initializeLoginForm(container) {
        this.loginForm = new LoginForm(container, {
            showGuestLogin: true,
            showRegisterLink: false, // We use tabs instead
            showPasswordToggle: true
        });

        this.loginForm.render();

        // Set up form event listeners
        this.loginForm.on('login', (event) => this.handleLogin(event.detail));
        this.loginForm.on('guestLogin', () => this.handleGuestLogin());
    }

    /**
     * Initializes the register form
     * @param {HTMLElement} container - Form container
     * @private
     */
    initializeRegisterForm(container) {
        this.registerForm = new RegisterForm(container, {
            showPasswordStrength: true,
            showPasswordToggle: true,
            showLoginLink: false // We use tabs instead
        });

        this.registerForm.render();

        // Set up form event listeners
        this.registerForm.on('register', (event) => this.handleRegister(event.detail));
    }

    /**
     * Sets up event listeners for the view
     * @private
     */
    setupEventListeners() {
        // Tab switching
        const tabs = this.container.querySelectorAll('.auth-tab');
        tabs.forEach(tab => {
            const clickHandler = (event) => this.handleTabClick(event);
            tab.addEventListener('click', clickHandler);
            this.eventHandlers.set(`tab-${tab.id}`, { element: tab, event: 'click', handler: clickHandler });
        });

        // Keyboard navigation for tabs
        const tabContainer = this.container.querySelector('.auth-tabs');
        if (tabContainer) {
            const keyHandler = (event) => this.handleTabKeyNavigation(event);
            tabContainer.addEventListener('keydown', keyHandler);
            this.eventHandlers.set('tab-navigation', { element: tabContainer, event: 'keydown', handler: keyHandler });
        }
    }

    /**
     * Handles tab click events
     * @param {Event} event - Click event
     * @private
     */
    handleTabClick(event) {
        const tab = event.target;
        const view = tab.dataset.view;
        
        if (view && view !== this.currentView) {
            this.switchView(view);
        }
    }

    /**
     * Handles keyboard navigation for tabs
     * @param {Event} event - Keyboard event
     * @private
     */
    handleTabKeyNavigation(event) {
        const tabs = Array.from(this.container.querySelectorAll('.auth-tab'));
        const currentIndex = tabs.findIndex(tab => tab.classList.contains('active'));
        
        let newIndex = currentIndex;
        
        switch (event.key) {
            case 'ArrowLeft':
                newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
                break;
            case 'ArrowRight':
                newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
                break;
            case 'Home':
                newIndex = 0;
                break;
            case 'End':
                newIndex = tabs.length - 1;
                break;
            default:
                return; // Don't prevent default for other keys
        }
        
        if (newIndex !== currentIndex) {
            event.preventDefault();
            const newTab = tabs[newIndex];
            const view = newTab.dataset.view;
            this.switchView(view);
            newTab.focus();
        }
    }

    /**
     * Switches between login and register views
     * @param {string} view - View to switch to ('login' or 'register')
     */
    switchView(view) {
        if (view === this.currentView) return;

        this.currentView = view;
        
        // Update tab states
        this.updateTabStates();
        
        // Re-initialize forms
        this.initializeForms();
        
        // Clear any existing errors
        this.clearMessages();
    }

    /**
     * Updates tab active states
     * @private
     */
    updateTabStates() {
        const tabs = this.container.querySelectorAll('.auth-tab');
        tabs.forEach(tab => {
            const isActive = tab.dataset.view === this.currentView;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', isActive.toString());
        });
    }

    /**
     * Handles login form submission
     * @param {Object} credentials - Login credentials
     * @private
     */
    async handleLogin(credentials) {
        try {
            if (!this.authController) {
                throw new Error('AuthController not available');
            }

            const result = await this.authController.login(credentials.loginId, credentials.password);
            
            if (result.success) {
                this.displaySuccess('ログインしました。メインページに移動します...');
                setTimeout(() => {
                    window.location.href = 'main.html';
                }, 1000);
            } else {
                this.displayError(result.error || 'ログインに失敗しました。');
            }
        } catch (error) {
            this.handleError(error, 'login');
        } finally {
            if (this.loginForm) {
                this.loginForm.setSubmittingState(false);
            }
        }
    }

    /**
     * Handles guest login
     * @private
     */
    async handleGuestLogin() {
        try {
            if (!this.authController) {
                throw new Error('AuthController not available');
            }

            const result = await this.authController.loginAsGuest();
            
            if (result.success) {
                this.displaySuccess('ゲストとしてログインしました。メインページに移動します...');
                setTimeout(() => {
                    window.location.href = 'main.html';
                }, 1000);
            } else {
                this.displayError(result.error || 'ゲストログインに失敗しました。');
            }
        } catch (error) {
            this.handleError(error, 'guest_login');
        } finally {
            if (this.loginForm) {
                this.loginForm.setSubmittingState(false);
            }
        }
    }

    /**
     * Handles registration form submission
     * @param {Object} userData - Registration data
     * @private
     */
    async handleRegister(userData) {
        try {
            if (!this.authController) {
                throw new Error('AuthController not available');
            }

            const result = await this.authController.register(userData.loginId, userData.password);
            
            if (result.success) {
                this.displaySuccess('アカウントが作成されました。メインページに移動します...');
                setTimeout(() => {
                    window.location.href = 'main.html';
                }, 1500);
            } else {
                this.displayError(result.error || '新規登録に失敗しました。');
            }
        } catch (error) {
            this.handleError(error, 'registration');
        } finally {
            if (this.registerForm) {
                this.registerForm.setSubmittingState(false);
            }
        }
    }

    /**
     * Handles errors
     * @param {Error} error - Error object
     * @param {string} context - Error context
     * @private
     */
    handleError(error, context) {
        console.error(`Authentication error (${context}):`, error);
        
        if (this.errorHandler) {
            this.errorHandler.handle(error, { context });
        }
        
        // Display user-friendly error message
        let message = 'エラーが発生しました。しばらく時間をおいて再度お試しください。';
        
        if (error.message.includes('network') || error.message.includes('fetch')) {
            message = 'ネットワークエラーが発生しました。インターネット接続を確認してください。';
        } else if (error.message.includes('credentials') || error.message.includes('authentication')) {
            message = 'ログイン情報が正しくありません。';
        } else if (error.message.includes('exists') || error.message.includes('duplicate')) {
            message = 'このログインIDは既に使用されています。';
        }
        
        this.displayError(message);
    }

    /**
     * Displays a success message
     * @param {string} message - Success message
     */
    displaySuccess(message) {
        const activeForm = this.currentView === 'login' ? this.loginForm : this.registerForm;
        if (activeForm) {
            activeForm.displaySuccess(message);
        }
    }

    /**
     * Displays an error message
     * @param {string} message - Error message
     */
    displayError(message) {
        const activeForm = this.currentView === 'login' ? this.loginForm : this.registerForm;
        if (activeForm) {
            activeForm.displayError(message);
        }
    }

    /**
     * Clears all messages
     */
    clearMessages() {
        if (this.loginForm) {
            this.loginForm.clearErrors();
        }
        if (this.registerForm) {
            this.registerForm.clearErrors();
        }
    }

    /**
     * Destroys existing forms
     * @private
     */
    destroyForms() {
        if (this.loginForm) {
            this.loginForm.destroy();
            this.loginForm = null;
        }
        if (this.registerForm) {
            this.registerForm.destroy();
            this.registerForm = null;
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
     * Checks if user is already authenticated
     * @returns {boolean} Whether user is authenticated
     */
    checkAuthenticationState() {
        if (this.authController) {
            return this.authController.isAuthenticated();
        }
        return false;
    }

    /**
     * Destroys the component and cleans up resources
     */
    destroy() {
        // Destroy forms
        this.destroyForms();
        
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
    module.exports = AuthenticationView;
} else if (typeof window !== 'undefined') {
    window.AuthenticationView = AuthenticationView;
}