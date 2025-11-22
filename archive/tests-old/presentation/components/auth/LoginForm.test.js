/**
 * @jest-environment jsdom
 */

const LoginForm = require('../../../../Rct/js/presentation/components/auth/LoginForm.js');

describe('LoginForm Component', () => {
    let container;
    let loginForm;

    beforeEach(() => {
        // Set up DOM
        document.body.innerHTML = '';
        container = document.createElement('div');
        document.body.appendChild(container);
        
        loginForm = new LoginForm(container);
    });

    afterEach(() => {
        if (loginForm) {
            loginForm.destroy();
        }
        document.body.innerHTML = '';
    });

    describe('Rendering', () => {
        test('should render login form with all required elements', () => {
            loginForm.render();

            expect(container.querySelector('#login-form')).toBeTruthy();
            expect(container.querySelector('#loginId')).toBeTruthy();
            expect(container.querySelector('#password')).toBeTruthy();
            expect(container.querySelector('#login-submit')).toBeTruthy();
        });

        test('should render guest login button when enabled', () => {
            loginForm = new LoginForm(container, { showGuestLogin: true });
            loginForm.render();

            expect(container.querySelector('#guest-login')).toBeTruthy();
        });

        test('should not render guest login button when disabled', () => {
            loginForm = new LoginForm(container, { showGuestLogin: false });
            loginForm.render();

            expect(container.querySelector('#guest-login')).toBeFalsy();
        });

        test('should render password toggle when enabled', () => {
            loginForm = new LoginForm(container, { showPasswordToggle: true });
            loginForm.render();

            expect(container.querySelector('#password-toggle')).toBeTruthy();
        });

        test('should focus on first input after rendering', () => {
            loginForm.render();
            
            const firstInput = container.querySelector('#loginId');
            expect(document.activeElement).toBe(firstInput);
        });
    });

    describe('Form Validation', () => {
        beforeEach(() => {
            loginForm.render();
        });

        test('should validate required fields', () => {
            const formData = { loginId: '', password: '' };
            const result = loginForm.validateForm(formData);

            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(2);
            expect(result.errors[0].field).toBe('loginId');
            expect(result.errors[1].field).toBe('password');
        });

        test('should validate minimum length for loginId', () => {
            const formData = { loginId: 'ab', password: 'password123' };
            const result = loginForm.validateForm(formData);

            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].field).toBe('loginId');
            expect(result.errors[0].message).toContain('3文字以上');
        });

        test('should validate minimum length for password', () => {
            const formData = { loginId: 'testuser', password: '123' };
            const result = loginForm.validateForm(formData);

            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].field).toBe('password');
            expect(result.errors[0].message).toContain('6文字以上');
        });

        test('should pass validation with valid data', () => {
            const formData = { loginId: 'testuser', password: 'password123' };
            const result = loginForm.validateForm(formData);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });

    describe('Field Validation', () => {
        beforeEach(() => {
            loginForm.render();
        });

        test('should validate individual field on blur', () => {
            const loginIdInput = container.querySelector('#loginId');
            loginIdInput.value = 'ab';
            
            const isValid = loginForm.validateField('loginId');
            
            expect(isValid).toBe(false);
            expect(container.querySelector('#loginId-error').textContent).toContain('3文字以上');
            expect(loginIdInput.classList.contains('error')).toBe(true);
        });

        test('should clear field error on valid input', () => {
            const loginIdInput = container.querySelector('#loginId');
            
            // First make it invalid
            loginIdInput.value = 'ab';
            loginForm.validateField('loginId');
            expect(container.querySelector('#loginId-error').textContent).toBeTruthy();
            
            // Then make it valid
            loginIdInput.value = 'testuser';
            loginForm.validateField('loginId');
            expect(container.querySelector('#loginId-error').textContent).toBe('');
            expect(loginIdInput.classList.contains('error')).toBe(false);
        });

        test('should clear field error on input event', () => {
            const loginIdInput = container.querySelector('#loginId');
            
            // Make field invalid first
            loginIdInput.value = 'ab';
            loginForm.validateField('loginId');
            expect(loginIdInput.classList.contains('error')).toBe(true);
            
            // Simulate input event
            loginForm.clearFieldError('loginId');
            expect(loginIdInput.classList.contains('error')).toBe(false);
        });
    });

    describe('Password Toggle', () => {
        beforeEach(() => {
            loginForm = new LoginForm(container, { showPasswordToggle: true });
            loginForm.render();
        });

        test('should toggle password visibility', () => {
            const passwordInput = container.querySelector('#password');
            const toggleButton = container.querySelector('#password-toggle');
            
            expect(passwordInput.type).toBe('password');
            
            toggleButton.click();
            expect(passwordInput.type).toBe('text');
            
            toggleButton.click();
            expect(passwordInput.type).toBe('password');
        });

        test('should update toggle icon', () => {
            const toggleButton = container.querySelector('#password-toggle');
            const toggleIcon = toggleButton.querySelector('.toggle-icon');
            
            expect(toggleIcon.textContent).toBe('👁');
            
            toggleButton.click();
            expect(toggleIcon.textContent).toBe('🙈');
            
            toggleButton.click();
            expect(toggleIcon.textContent).toBe('👁');
        });
    });

    describe('Form Submission', () => {
        beforeEach(() => {
            loginForm.render();
        });

        test('should emit login event with valid data', (done) => {
            const loginIdInput = container.querySelector('#loginId');
            const passwordInput = container.querySelector('#password');
            const form = container.querySelector('#login-form');
            
            loginIdInput.value = 'testuser';
            passwordInput.value = 'password123';
            
            loginForm.on('login', (event) => {
                expect(event.detail.loginId).toBe('testuser');
                expect(event.detail.password).toBe('password123');
                done();
            });
            
            form.dispatchEvent(new Event('submit'));
        });

        test('should not emit login event with invalid data', () => {
            const form = container.querySelector('#login-form');
            let eventEmitted = false;
            
            loginForm.on('login', () => {
                eventEmitted = true;
            });
            
            form.dispatchEvent(new Event('submit'));
            expect(eventEmitted).toBe(false);
        });

        test('should display validation errors on invalid submission', () => {
            const form = container.querySelector('#login-form');
            
            form.dispatchEvent(new Event('submit'));
            
            expect(container.querySelector('#loginId-error').textContent).toBeTruthy();
            expect(container.querySelector('#password-error').textContent).toBeTruthy();
        });

        test('should prevent multiple submissions', () => {
            const loginIdInput = container.querySelector('#loginId');
            const passwordInput = container.querySelector('#password');
            const form = container.querySelector('#login-form');
            
            loginIdInput.value = 'testuser';
            passwordInput.value = 'password123';
            
            loginForm.setSubmittingState(true);
            
            let eventCount = 0;
            loginForm.on('login', () => {
                eventCount++;
            });
            
            form.dispatchEvent(new Event('submit'));
            form.dispatchEvent(new Event('submit'));
            
            expect(eventCount).toBe(0);
        });
    });

    describe('Guest Login', () => {
        beforeEach(() => {
            loginForm = new LoginForm(container, { showGuestLogin: true });
            loginForm.render();
        });

        test('should emit guestLogin event when guest button clicked', (done) => {
            const guestButton = container.querySelector('#guest-login');
            
            loginForm.on('guestLogin', () => {
                done();
            });
            
            guestButton.click();
        });
    });

    describe('Loading States', () => {
        beforeEach(() => {
            loginForm.render();
        });

        test('should disable form during submission', () => {
            const submitButton = container.querySelector('#login-submit');
            const guestButton = container.querySelector('#guest-login');
            
            loginForm.setSubmittingState(true);
            
            expect(submitButton.disabled).toBe(true);
            if (guestButton) {
                expect(guestButton.disabled).toBe(true);
            }
        });

        test('should show loading text during submission', () => {
            const btnText = container.querySelector('.btn-text');
            const btnLoading = container.querySelector('.btn-loading');
            
            loginForm.setSubmittingState(true);
            
            expect(btnText.style.display).toBe('none');
            expect(btnLoading.style.display).toBe('inline');
        });

        test('should restore normal state after submission', () => {
            const submitButton = container.querySelector('#login-submit');
            const btnText = container.querySelector('.btn-text');
            const btnLoading = container.querySelector('.btn-loading');
            
            loginForm.setSubmittingState(true);
            loginForm.setSubmittingState(false);
            
            expect(submitButton.disabled).toBe(false);
            expect(btnText.style.display).toBe('inline');
            expect(btnLoading.style.display).toBe('none');
        });
    });

    describe('Error Display', () => {
        beforeEach(() => {
            loginForm.render();
        });

        test('should display general error message', () => {
            const errorMessage = 'Test error message';
            loginForm.displayError(errorMessage);
            
            const errorContainer = container.querySelector('#error-container');
            expect(errorContainer.textContent).toBe(errorMessage);
            expect(errorContainer.style.display).toBe('block');
        });

        test('should display success message', () => {
            const successMessage = 'Test success message';
            loginForm.displaySuccess(successMessage);
            
            const successContainer = container.querySelector('#success-container');
            expect(successContainer.textContent).toBe(successMessage);
            expect(successContainer.style.display).toBe('block');
        });

        test('should clear all errors', () => {
            // Set up some errors
            loginForm.displayError('Test error');
            loginForm.displayFieldError('loginId', 'Field error');
            
            loginForm.clearErrors();
            
            const errorContainer = container.querySelector('#error-container');
            const fieldError = container.querySelector('#loginId-error');
            
            expect(errorContainer.style.display).toBe('none');
            expect(fieldError.textContent).toBe('');
        });
    });

    describe('Event Management', () => {
        beforeEach(() => {
            loginForm.render();
        });

        test('should add and remove event listeners', (done) => {
            let eventReceived = false;
            
            const handler = () => {
                eventReceived = true;
            };
            
            loginForm.on('login', handler);
            loginForm.off('login', handler);
            
            const loginIdInput = container.querySelector('#loginId');
            const passwordInput = container.querySelector('#password');
            const form = container.querySelector('#login-form');
            
            loginIdInput.value = 'testuser';
            passwordInput.value = 'password123';
            
            form.dispatchEvent(new Event('submit'));
            
            setTimeout(() => {
                expect(eventReceived).toBe(false);
                done();
            }, 10);
        });
    });

    describe('Cleanup', () => {
        test('should clean up resources on destroy', () => {
            loginForm.render();
            
            const initialHTML = container.innerHTML;
            expect(initialHTML).toBeTruthy();
            
            loginForm.destroy();
            
            expect(container.innerHTML).toBe('');
        });
    });

    describe('Accessibility', () => {
        beforeEach(() => {
            loginForm.render();
        });

        test('should have proper form labels', () => {
            const loginIdLabel = container.querySelector('label[for="loginId"]');
            const passwordLabel = container.querySelector('label[for="password"]');
            
            expect(loginIdLabel).toBeTruthy();
            expect(passwordLabel).toBeTruthy();
        });

        test('should have proper input attributes', () => {
            const loginIdInput = container.querySelector('#loginId');
            const passwordInput = container.querySelector('#password');
            
            expect(loginIdInput.getAttribute('autocomplete')).toBe('username');
            expect(passwordInput.getAttribute('autocomplete')).toBe('current-password');
            expect(loginIdInput.hasAttribute('required')).toBe(true);
            expect(passwordInput.hasAttribute('required')).toBe(true);
        });

        test('should have proper ARIA labels for password toggle', () => {
            loginForm = new LoginForm(container, { showPasswordToggle: true });
            loginForm.render();
            
            const passwordToggle = container.querySelector('#password-toggle');
            expect(passwordToggle.getAttribute('aria-label')).toBeTruthy();
        });
    });
});