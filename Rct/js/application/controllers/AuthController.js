/**
 * 認証コントローラー
 * 認証関連のUI操作とビジネスロジックを調整します
 */
class AuthController {
    /**
     * 新しいAuthControllerインスタンスを作成します
     * @param {Object} authService - 認証サービス
     * @param {Object} userRepository - 状態管理用のユーザーリポジトリ
     * @param {Object} errorHandler - エラーハンドリングサービス
     */
    constructor(authService, userRepository, errorHandler) {
        this.authService = authService;
        this.userRepository = userRepository;
        this.errorHandler = errorHandler;
        this.eventListeners = new Map();
    }

    /**
     * 認証コントローラーを初期化します
     * イベントリスナーと初期状態を設定します
     */
    initialize() {
        this.setupEventListeners();
        this.checkAuthenticationState();
    }

    /**
     * 認証フォーム用のイベントリスナーを設定します
     * @private
     */
    setupEventListeners() {
        // ログインフォーム
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            const loginHandler = (event) => this.handleLogin(event);
            loginForm.addEventListener('submit', loginHandler);
            this.eventListeners.set('login-form', { element: loginForm, event: 'submit', handler: loginHandler });
        }

        // 登録フォーム
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            const registerHandler = (event) => this.handleRegister(event);
            registerForm.addEventListener('submit', registerHandler);
            this.eventListeners.set('register-form', { element: registerForm, event: 'submit', handler: registerHandler });
        }

        // ゲストログインボタン
        const guestButton = document.getElementById('guest-login-btn');
        if (guestButton) {
            const guestHandler = (event) => this.handleGuestLogin(event);
            guestButton.addEventListener('click', guestHandler);
            this.eventListeners.set('guest-login-btn', { element: guestButton, event: 'click', handler: guestHandler });
        }

        // ログアウトボタン
        const logoutButton = document.getElementById('logout-btn');
        if (logoutButton) {
            const logoutHandler = (event) => this.handleLogout(event);
            logoutButton.addEventListener('click', logoutHandler);
            this.eventListeners.set('logout-btn', { element: logoutButton, event: 'click', handler: logoutHandler });
        }
    }

    /**
     * ログインフォームの送信を処理します
     * @param {Event} event - フォーム送信イベント
     */
    async handleLogin(event) {
        event.preventDefault();
        
        try {
            const formData = new FormData(event.target);
            const credentials = {
                loginId: formData.get('loginId')?.trim(),
                password: formData.get('password')
            };

            // 入力を検証
            const validationResult = this.validateLoginCredentials(credentials);
            if (!validationResult.isValid) {
                this.displayValidationErrors(validationResult.errors);
                return;
            }

            // ローディング状態を表示
            this.setLoadingState(true);

            // ログインを試行
            const result = await this.authService.login(credentials.loginId, credentials.password);
            
            if (result.success) {
                // ユーザーを保存してリダイレクト
                this.userRepository.setCurrentUser(result.user);
                this.onLoginSuccess(result.user);
            } else {
                this.displayError(result.error || 'ログインに失敗しました');
            }

        } catch (error) {
            this.errorHandler.handle(error, { context: 'login' });
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * ユーザー登録を処理します
     * @param {Event} event - フォーム送信イベント
     */
    async handleRegister(event) {
        event.preventDefault();
        
        try {
            const formData = new FormData(event.target);
            const userData = {
                loginId: formData.get('loginId')?.trim(),
                password: formData.get('password'),
                confirmPassword: formData.get('confirmPassword')
            };

            // Validate input
            const validationResult = this.validateRegistrationData(userData);
            if (!validationResult.isValid) {
                this.displayValidationErrors(validationResult.errors);
                return;
            }

            // Show loading state
            this.setLoadingState(true);

            // Attempt registration
            const result = await this.authService.register(userData.loginId, userData.password);
            
            if (result.success) {
                // Store user and redirect
                this.userRepository.setCurrentUser(result.user);
                this.onRegistrationSuccess(result.user);
            } else {
                this.displayError(result.error || 'Registration failed');
            }

        } catch (error) {
            this.errorHandler.handle(error, { context: 'registration' });
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * ゲストログインを処理します
     * @param {Event} event - クリックイベント
     */
    async handleGuestLogin(event) {
        event.preventDefault();
        
        try {
            // Show loading state
            this.setLoadingState(true);

            // Create guest user
            const result = await this.authService.loginAsGuest();
            
            if (result.success) {
                // Store guest user and redirect
                this.userRepository.setCurrentUser(result.user);
                this.onLoginSuccess(result.user);
            } else {
                this.displayError(result.error || 'Guest login failed');
            }

        } catch (error) {
            this.errorHandler.handle(error, { context: 'guest_login' });
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * ユーザーログアウトを処理します
     * @param {Event} event - クリックイベント
     */
    async handleLogout(event) {
        event.preventDefault();
        
        try {
            // Clear user state
            this.userRepository.clearCurrentUser();
            
            // Perform logout
            await this.authService.logout();
            
            // Redirect to login page
            this.onLogoutSuccess();

        } catch (error) {
            this.errorHandler.handle(error, { context: 'logout' });
        }
    }

    /**
     * ログイン認証情報を検証します
     * @param {Object} credentials - ログイン認証情報
     * @returns {ValidationResult} 検証結果
     * @private
     */
    validateLoginCredentials(credentials) {
        const errors = [];

        if (!credentials.loginId) {
            errors.push(ValidationError.required('loginId'));
        } else if (credentials.loginId.length < 3) {
            errors.push(ValidationError.invalidLength('loginId', 3, null, credentials.loginId));
        }

        if (!credentials.password) {
            errors.push(ValidationError.required('password'));
        } else if (credentials.password.length < 6) {
            errors.push(ValidationError.invalidLength('password', 6, null, credentials.password));
        }

        return errors.length > 0 ? ValidationResult.failure(errors) : ValidationResult.success();
    }

    /**
     * 登録データを検証します
     * @param {Object} userData - 登録データ
     * @returns {ValidationResult} 検証結果
     * @private
     */
    validateRegistrationData(userData) {
        const errors = [];

        // ログインIDを検証
        if (!userData.loginId) {
            errors.push(ValidationError.required('loginId'));
        } else {
            if (userData.loginId.length < 3 || userData.loginId.length > 20) {
                errors.push(ValidationError.invalidLength('loginId', 3, 20, userData.loginId));
            }
            if (!/^[a-zA-Z0-9_-]+$/.test(userData.loginId)) {
                errors.push(ValidationError.invalidFormat('loginId', 'alphanumeric characters, underscore, and hyphen only', userData.loginId));
            }
        }

        // Validate password
        if (!userData.password) {
            errors.push(ValidationError.required('password'));
        } else {
            if (userData.password.length < 6 || userData.password.length > 50) {
                errors.push(ValidationError.invalidLength('password', 6, 50, userData.password));
            }
        }

        // パスワード確認を検証
        if (!userData.confirmPassword) {
            errors.push(ValidationError.required('confirmPassword'));
        } else if (userData.password !== userData.confirmPassword) {
            errors.push(new ValidationError('Passwords do not match', 'confirmPassword', 'MISMATCH', userData.confirmPassword));
        }

        return errors.length > 0 ? ValidationResult.failure(errors) : ValidationResult.success();
    }

    /**
     * UIに検証エラーを表示します
     * @param {ValidationError[]} errors - 検証エラーの配列
     * @private
     */
    displayValidationErrors(errors) {
        // 以前のエラーをクリア
        this.clearErrors();

        errors.forEach(error => {
            const fieldElement = document.querySelector(`[name="${error.field}"]`);
            if (fieldElement) {
                // フィールドにエラークラスを追加
                fieldElement.classList.add('error');
                
                // エラーメッセージ要素を作成または更新
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

    /**
     * 一般的なエラーメッセージを表示します
     * @param {string} message - エラーメッセージ
     * @private
     */
    displayError(message) {
        const errorContainer = document.getElementById('error-container') || document.querySelector('.error-container');
        if (errorContainer) {
            errorContainer.textContent = message;
            errorContainer.style.display = 'block';
        } else {
            // エラーコンテナがない場合はアラートにフォールバック
            alert(message);
        }
    }

    /**
     * UIからすべてのエラーメッセージをクリアします
     * @private
     */
    clearErrors() {
        // フィールドエラーをクリア
        document.querySelectorAll('.error').forEach(element => {
            element.classList.remove('error');
        });
        
        document.querySelectorAll('.error-message').forEach(element => {
            element.remove();
        });

        // 一般エラーコンテナをクリア
        const errorContainer = document.getElementById('error-container') || document.querySelector('.error-container');
        if (errorContainer) {
            errorContainer.style.display = 'none';
            errorContainer.textContent = '';
        }
    }

    /**
     * UIのローディング状態を設定します
     * @param {boolean} isLoading - ローディング状態を表示するかどうか
     * @private
     */
    setLoadingState(isLoading) {
        const submitButtons = document.querySelectorAll('button[type="submit"], .auth-button');
        submitButtons.forEach(button => {
            button.disabled = isLoading;
            if (isLoading) {
                button.dataset.originalText = button.textContent;
                button.textContent = '読み込み中...';
            } else {
                button.textContent = button.dataset.originalText || button.textContent;
            }
        });
    }

    /**
     * 現在の認証状態をチェックします
     * @private
     */
    checkAuthenticationState() {
        const currentUser = this.userRepository.getCurrentUser();
        if (currentUser && currentUser.isAuthenticated()) {
            // ユーザーは既にログイン済み、メインページにリダイレクト
            this.redirectToMainPage();
        }
    }

    /**
     * ログイン成功を処理します
     * @param {User} user - 認証されたユーザー
     * @private
     */
    onLoginSuccess(user) {
        // Clear any error messages
        this.clearErrors();
        
        // 成功メッセージを表示
        this.displaySuccessMessage(`おかえりなさい、${user.loginId}さん！`);
        
        // 短い遅延後にリダイレクト
        setTimeout(() => {
            this.redirectToMainPage();
        }, 1000);
    }

    /**
     * 登録成功を処理します
     * @param {User} user - 登録されたユーザー
     * @private
     */
    onRegistrationSuccess(user) {
        // Clear any error messages
        this.clearErrors();
        
        // Show success message
        this.displaySuccessMessage(`アカウントが正常に作成されました！ようこそ、${user.loginId}さん！`);
        
        // Redirect after a short delay
        setTimeout(() => {
            this.redirectToMainPage();
        }, 1500);
    }

    /**
     * ログアウト成功を処理します
     * @private
     */
    onLogoutSuccess() {
        // Redirect to login page
        window.location.href = 'login.html';
    }

    /**
     * 成功メッセージを表示します
     * @param {string} message - 成功メッセージ
     * @private
     */
    displaySuccessMessage(message) {
        const successContainer = document.getElementById('success-container') || document.querySelector('.success-container');
        if (successContainer) {
            successContainer.textContent = message;
            successContainer.style.display = 'block';
        }
    }

    /**
     * メインアプリケーションページにリダイレクトします
     * @private
     */
    redirectToMainPage() {
        window.location.href = 'main.html';
    }

    /**
     * イベントリスナーをクリーンアップします
     */
    destroy() {
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners.clear();
    }
}

// CommonJSとESモジュールの両方でエクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthController;
} else if (typeof window !== 'undefined') {
    window.AuthController = AuthController;
}