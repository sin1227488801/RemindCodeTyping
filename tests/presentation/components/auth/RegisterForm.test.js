/**
 * @jest-environment jsdom
 */

const RegisterForm = require('../../../../Rct/js/presentation/components/auth/RegisterForm.js');

describe('RegisterForm Component', () => {
    let container;
    let registerForm;

    beforeEach(() => {
        // Set up DOM
        document.body.innerHTML = '';
        container = document.createElement('div');
        document.body.appendChild(container);
        
        registerForm = new RegisterForm(container);
    });

    afterEach(() => {
        if (registerForm) {
            registerForm.destroy();
        }
        document.body.innerHTML = '';
    });

    describe('Rendering', () => {
        test('should render register form with all required elements', () => {
            registerForm.render();

            expect(container.querySelector('#register-form')).toBeTruthy();
            expect(container.querySelector('#loginId')).toBeTruthy();
            expect(container.querySelector('#password')).toBeTruthy();
            expect(container.querySelector('#confirmPassword')).toBeTruthy();
            expect(container.querySelector('#register-submit')).toBeTruthy();
        });

        test('should render password strength indicator when enabled', () => {
            registerForm = new RegisterForm(container, { showPasswordStrength: true });
            registerForm.render();

            expect(container.querySelector('#password-strength')).toBeTruthy();
            expect(container.querySelector('#strength-bar')).toBeTruthy();
            expect(container.querySelector('#strength-text')).toBeTruthy();
        });

        test('should not render password strength indicator when disabled', () => {
            registerForm = new RegisterForm(container, { showPasswordStrength: false });
            registerForm.render();

            expect(container.querySelector('#password-strength')).toBeFalsy();
        });

        test('should render password toggles when enabled', () => {
            registerForm = new RegisterForm(container, { showPasswordToggle: true });
            registerForm.render();

            expect(container.querySelector('#password-toggle')).toBeTruthy();
            expect(container.querySelector('#confirm-password-toggle')).toBeTruthy();
        });

        test('should render login link when enabled', () => {
            registerForm = new RegisterForm(container, { showLoginLink: true });
            registerForm.render();

            expect(container.querySelector('#login-link')).toBeTruthy();
        });
    });

    describe('Form Validation', () => {
        beforeEach(() => {
            registerForm.render();
        });

        test('should validate required fields', () => {
            const formData = { loginId: '', password: '', confirmPassword: '' };
            const result = registerForm.validateForm(formData);

            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(3);
        });

        test('should validate loginId pattern', () => {
            const formData = { 
                loginId: 'invalid@user', 
                password: 'password123', 
                confirmPassword: 'password123' 
            };
            const result = registerForm.validateForm(formData);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.field === 'loginId')).toBe(true);
        });

        test('should validate loginId length constraints', () => {
            // Too short
            let formData = { 
                loginId: 'ab', 
                password: 'password123', 
                confirmPassword: 'password123' 
            };
            let result = registerForm.validateForm(formData);
            expect(result.isValid).toBe(false);

            // Too long
            formData = { 
                loginId: 'a'.repeat(25), 
                password: 'password123', 
                confirmPassword: 'password123' 
            };
            result = registerForm.validateForm(formData);
            expect(result.isValid).toBe(false);
        });

        test('should validate password confirmation match', () => {
            const formData = { 
                loginId: 'testuser', 
                password: 'password123', 
                confirmPassword: 'different123' 
            };
            const result = registerForm.validateForm(formData);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.field === 'confirmPassword')).toBe(true);
        });

        test('should pass validation with valid data', () => {
            const formData = { 
                loginId: 'testuser', 
                password: 'password123', 
                confirmPassword: 'password123' 
            };
            const result = registerForm.validateForm(formData);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('should validate valid loginId patterns', () => {
            const validIds = ['user123', 'test_user', 'user-name', 'User123'];
            
            validIds.forEach(loginId => {
                const formData = { 
                    loginId, 
                    password: 'password123', 
                    confirmPassword: 'password123' 
                };
                const result = registerForm.validateForm(formData);
                expect(result.isValid).toBe(true);
            });
        });
    });

    describe('Password Strength Calculation', () => {
        beforeEach(() => {
            registerForm = new RegisterForm(container, { showPasswordStrength: true });
            registerForm.render();
        });

        test('should calculate weak password strength', () => {
            const strength = registerForm.calculatePasswordStrength('123');
            expect(strength.level).toBe('weak');
            expect(strength.percentage).toBe(25);
        });

        test('should calculate medium password strength', () => {
            const strength = registerForm.calculatePasswordStrength('password');
            expect(strength.level).toBe('medium');
            expect(strength.percentage).toBe(50);
        });

        test('should calculate strong password strength', () => {
            const strength = registerForm.calculatePasswordStrength('Password123');
            expect(strength.level).toBe('strong');
            expect(strength.percentage).toBe(75);
        });

        test('should calculate very strong password strength', () => {
            const strength = registerForm.calculatePasswordStrength('Password123!@#');
            expect(strength.level).toBe('very-strong');
            expect(strength.percentage).toBe(100);
        });

        test('should handle empty password', () => {
            const strength = registerForm.calculatePasswordStrength('');
            expect(strength.level).toBe('none');
            expect(strength.percentage).toBe(0);
        });
    });

    describe('Password Strength Indicator', () => {
        beforeEach(() => {
            registerForm = new RegisterForm(container, { showPasswordStrength: true });
            registerForm.render();
        });

        test('should update strength indicator on password input', () => {
            const passwordInput = container.querySelector('#password');
            const strengthBar = container.querySelector('#strength-bar');
            const strengthText = container.querySelector('#strength-text');

            passwordInput.value = 'weak';
            registerForm.updatePasswordStrength();

            expect(strengthBar.className).toContain('strength-weak');
            expect(strengthText.textContent).toContain('弱');
        });

        test('should update strength bar width', () => {
            const passwordInput = container.querySelector('#password');
            const strengthBar = container.querySelector('#strength-bar');

            passwordInput.value = 'Password123';
            registerForm.updatePasswordStrength();

            expect(strengthBar.style.width).toBe('75%');
        });
    });

    describe('Password Toggle Functionality', () => {
        beforeEach(() => {
            registerForm = new RegisterForm(container, { showPasswordToggle: true });
            registerForm.render();
        });

        test('should toggle password field visibility', () => {
            const passwordInput = container.querySelector('#password');
            const toggleButton = container.querySelector('#password-toggle');
            
            expect(passwordInput.type).toBe('password');
            
            toggleButton.click();
            expect(passwordInput.type).toBe('text');
            
            toggleButton.click();
            expect(passwordInput.type).toBe('password');
        });

        test('should toggle confirm password field visibility', () => {
            const confirmPasswordInput = container.querySelector('#confirmPassword');
            const toggleButton = container.querySelector('#confirm-password-toggle');
            
            expect(confirmPasswordInput.type).toBe('password');
            
            toggleButton.click();
            expect(confirmPasswordInput.type).toBe('text');
            
            toggleButton.click();
            expect(confirmPasswordInput.type).toBe('password');
        });

        test('should update toggle icons', () => {
            const toggleButton = container.querySelector('#password-toggle');
            const toggleIcon = toggleButton.querySelector('.toggle-icon');
            
            expect(toggleIcon.textContent).toBe('👁');
            
            toggleButton.click();
            expect(toggleIcon.textContent).toBe('🙈');
        });
    });

    describe('Form Submission', () => {
        beforeEach(() => {
            registerForm.render();
        });

        test('should emit register event with valid data', (done) => {
            const loginIdInput = container.querySelector('#loginId');
            const passwordInput = container.querySelector('#password');
            const confirmPasswordInput = container.querySelector('#confirmPassword');
            const form = container.querySelector('#register-form');
            
            loginIdInput.value = 'testuser';
            passwordInput.value = 'password123';
            confirmPasswordInput.value = 'password123';
            
            registerForm.on('register', (event) => {
                expect(event.detail.loginId).toBe('testuser');
                expect(event.detail.password).toBe('password123');
                done();
            });
            
            form.dispatchEvent(new Event('submit'));
        });

        test('should not emit register event with invalid data', () => {
            const form = container.querySelector('#register-form');
            let eventEmitted = false;
            
            registerForm.on('register', () => {
                eventEmitted = true;
            });
            
            form.dispatchEvent(new Event('submit'));
            expect(eventEmitted).toBe(false);
        });

        test('should display validation errors on invalid submission', () => {
            const form = container.querySelector('#register-form');
            
            form.dispatchEvent(new Event('submit'));
            
            expect(container.querySelector('#loginId-error').textContent).toBeTruthy();
            expect(container.querySelector('#password-error').textContent).toBeTruthy();
            expect(container.querySelector('#confirmPassword-error').textContent).toBeTruthy();
        });

        test('should prevent multiple submissions', () => {
            const form = container.querySelector('#register-form');
            
            registerForm.setSubmittingState(true);
            
            let eventCount = 0;
            registerForm.on('register', () => {
                eventCount++;
            });
            
            form.dispatchEvent(new Event('submit'));
            form.dispatchEvent(new Event('submit'));
            
            expect(eventCount).toBe(0);
        });
    });

    describe('Real-time Validation', () => {
        beforeEach(() => {
            registerForm.render();
        });

        test('should validate field on blur', () => {
            const loginIdInput = container.querySelector('#loginId');
            loginIdInput.value = 'ab';
            
            const isValid = registerForm.validateField('loginId');
            
            expect(isValid).toBe(false);
            expect(container.querySelector('#loginId-error').textContent).toBeTruthy();
        });

        test('should clear field error on input', () => {
            const loginIdInput = container.querySelector('#loginId');
            
            // Make field invalid first
            loginIdInput.value = 'ab';
            registerForm.validateField('loginId');
            expect(loginIdInput.classList.contains('error')).toBe(true);
            
            // Clear error
            registerForm.clearFieldError('loginId');
            expect(loginIdInput.classList.contains('error')).toBe(false);
        });

        test('should validate password confirmation against password field', () => {
            const passwordInput = container.querySelector('#password');
            const confirmPasswordInput = container.querySelector('#confirmPassword');
            
            passwordInput.value = 'password123';
            confirmPasswordInput.value = 'different123';
            
            const isValid = registerForm.validateField('confirmPassword');
            
            expect(isValid).toBe(false);
            expect(container.querySelector('#confirmPassword-error').textContent).toContain('一致しません');
        });
    });

    describe('Login Link', () => {
        beforeEach(() => {
            registerForm = new RegisterForm(container, { showLoginLink: true });
            registerForm.render();
        });

        test('should emit loginClick event when login link clicked', (done) => {
            const loginLink = container.querySelector('#login-link');
            
            registerForm.on('loginClick', () => {
                done();
            });
            
            loginLink.click();
        });
    });

    describe('Loading States', () => {
        beforeEach(() => {
            registerForm.render();
        });

        test('should disable form during submission', () => {
            const submitButton = container.querySelector('#register-submit');
            
            registerForm.setSubmittingState(true);
            
            expect(submitButton.disabled).toBe(true);
        });

        test('should show loading text during submission', () => {
            const btnText = container.querySelector('.btn-text');
            const btnLoading = container.querySelector('.btn-loading');
            
            registerForm.setSubmittingState(true);
            
            expect(btnText.style.display).toBe('none');
            expect(btnLoading.style.display).toBe('inline');
        });
    });

    describe('Error and Success Messages', () => {
        beforeEach(() => {
            registerForm.render();
        });

        test('should display error message', () => {
            const errorMessage = 'Test error message';
            registerForm.displayError(errorMessage);
            
            const errorContainer = container.querySelector('#error-container');
            expect(errorContainer.textContent).toBe(errorMessage);
            expect(errorContainer.style.display).toBe('block');
        });

        test('should display success message', () => {
            const successMessage = 'Test success message';
            registerForm.displaySuccess(successMessage);
            
            const successContainer = container.querySelector('#success-container');
            expect(successContainer.textContent).toBe(successMessage);
            expect(successContainer.style.display).toBe('block');
        });

        test('should clear all messages', () => {
            registerForm.displayError('Test error');
            registerForm.displaySuccess('Test success');
            
            registerForm.clearErrors();
            
            const errorContainer = container.querySelector('#error-container');
            const successContainer = container.querySelector('#success-container');
            
            expect(errorContainer.style.display).toBe('none');
            expect(successContainer.style.display).toBe('none');
        });
    });

    describe('Accessibility', () => {
        beforeEach(() => {
            registerForm.render();
        });

        test('should have proper form labels', () => {
            const labels = container.querySelectorAll('label');
            expect(labels.length).toBeGreaterThan(0);
            
            labels.forEach(label => {
                const forAttribute = label.getAttribute('for');
                expect(forAttribute).toBeTruthy();
                expect(container.querySelector(`#${forAttribute}`)).toBeTruthy();
            });
        });

        test('should have proper input attributes', () => {
            const loginIdInput = container.querySelector('#loginId');
            const passwordInput = container.querySelector('#password');
            const confirmPasswordInput = container.querySelector('#confirmPassword');
            
            expect(loginIdInput.getAttribute('autocomplete')).toBe('username');
            expect(passwordInput.getAttribute('autocomplete')).toBe('new-password');
            expect(confirmPasswordInput.getAttribute('autocomplete')).toBe('new-password');
        });

        test('should have proper ARIA labels for password toggles', () => {
            registerForm = new RegisterForm(container, { showPasswordToggle: true });
            registerForm.render();
            
            const passwordToggle = container.querySelector('#password-toggle');
            const confirmPasswordToggle = container.querySelector('#confirm-password-toggle');
            
            expect(passwordToggle.getAttribute('aria-label')).toBeTruthy();
            expect(confirmPasswordToggle.getAttribute('aria-label')).toBeTruthy();
        });
    });

    describe('Cleanup', () => {
        test('should clean up resources on destroy', () => {
            registerForm.render();
            
            const initialHTML = container.innerHTML;
            expect(initialHTML).toBeTruthy();
            
            registerForm.destroy();
            
            expect(container.innerHTML).toBe('');
        });
    });
});