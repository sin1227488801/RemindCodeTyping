/**
 * @jest-environment jsdom
 */

const StudyBookForm = require('../../../../Rct/js/presentation/components/studybook/StudyBookForm.js');

describe('StudyBookForm Component', () => {
    let container;
    let studyBookForm;

    beforeEach(() => {
        // Set up DOM
        document.body.innerHTML = '';
        container = document.createElement('div');
        document.body.appendChild(container);
        
        studyBookForm = new StudyBookForm(container);
    });

    afterEach(() => {
        if (studyBookForm) {
            studyBookForm.destroy();
        }
        document.body.innerHTML = '';
    });

    describe('Rendering', () => {
        test('should render create form with all required elements', () => {
            studyBookForm.render();

            expect(container.querySelector('#studybook-form')).toBeTruthy();
            expect(container.querySelector('#language')).toBeTruthy();
            expect(container.querySelector('#question')).toBeTruthy();
            expect(container.querySelector('#explanation')).toBeTruthy();
            expect(container.querySelector('#submit-btn')).toBeTruthy();
            expect(container.querySelector('#cancel-btn')).toBeTruthy();
        });

        test('should render edit form when in edit mode', () => {
            const studyBookData = {
                id: '1',
                language: 'JavaScript',
                question: 'Test question',
                explanation: 'Test explanation'
            };
            
            studyBookForm = new StudyBookForm(container, { 
                mode: 'edit', 
                studyBookData 
            });
            studyBookForm.render();

            expect(container.querySelector('h2').textContent).toBe('学習帳編集');
            expect(container.querySelector('#language').value).toBe('JavaScript');
            expect(container.querySelector('#question').value).toBe('Test question');
            expect(container.querySelector('#explanation').value).toBe('Test explanation');
        });

        test('should render character count when enabled', () => {
            studyBookForm = new StudyBookForm(container, { showCharacterCount: true });
            studyBookForm.render();

            expect(container.querySelector('#question-count')).toBeTruthy();
            expect(container.querySelector('#explanation-count')).toBeTruthy();
        });

        test('should not render character count when disabled', () => {
            studyBookForm = new StudyBookForm(container, { showCharacterCount: false });
            studyBookForm.render();

            expect(container.querySelector('#question-count')).toBeFalsy();
            expect(container.querySelector('#explanation-count')).toBeFalsy();
        });

        test('should populate language options', () => {
            studyBookForm.render();

            const datalist = container.querySelector('#language-options');
            const options = datalist.querySelectorAll('option');
            
            expect(options.length).toBeGreaterThan(0);
            expect(Array.from(options).some(option => option.value === 'JavaScript')).toBe(true);
        });
    });

    describe('Form Validation', () => {
        beforeEach(() => {
            studyBookForm.render();
        });

        test('should validate required fields', () => {
            const formData = { language: '', question: '', explanation: '' };
            const result = studyBookForm.validateForm(formData);

            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(2); // language and question are required
        });

        test('should validate language field', () => {
            const formData = { language: '', question: 'Valid question text', explanation: '' };
            const result = studyBookForm.validateForm(formData);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.field === 'language')).toBe(true);
        });

        test('should validate question minimum length', () => {
            const formData = { language: 'JavaScript', question: 'Short', explanation: '' };
            const result = studyBookForm.validateForm(formData);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.field === 'question')).toBe(true);
        });

        test('should validate question maximum length', () => {
            const longQuestion = 'a'.repeat(1001);
            const formData = { language: 'JavaScript', question: longQuestion, explanation: '' };
            const result = studyBookForm.validateForm(formData);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.field === 'question')).toBe(true);
        });

        test('should validate explanation maximum length', () => {
            const longExplanation = 'a'.repeat(501);
            const formData = { 
                language: 'JavaScript', 
                question: 'Valid question text', 
                explanation: longExplanation 
            };
            const result = studyBookForm.validateForm(formData);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.field === 'explanation')).toBe(true);
        });

        test('should pass validation with valid data', () => {
            const formData = { 
                language: 'JavaScript', 
                question: 'This is a valid question text', 
                explanation: 'This is a valid explanation' 
            };
            const result = studyBookForm.validateForm(formData);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });

    describe('Field Validation', () => {
        beforeEach(() => {
            studyBookForm.render();
        });

        test('should validate individual field on blur', () => {
            const languageInput = container.querySelector('#language');
            languageInput.value = '';
            
            const isValid = studyBookForm.validateField('language');
            
            expect(isValid).toBe(false);
            expect(container.querySelector('#language-error').textContent).toBeTruthy();
            expect(languageInput.classList.contains('error')).toBe(true);
        });

        test('should clear field error on valid input', () => {
            const languageInput = container.querySelector('#language');
            
            // First make it invalid
            languageInput.value = '';
            studyBookForm.validateField('language');
            expect(container.querySelector('#language-error').textContent).toBeTruthy();
            
            // Then make it valid
            languageInput.value = 'JavaScript';
            studyBookForm.validateField('language');
            expect(container.querySelector('#language-error').textContent).toBe('');
            expect(languageInput.classList.contains('error')).toBe(false);
        });

        test('should clear field error on input event', () => {
            const languageInput = container.querySelector('#language');
            
            // Make field invalid first
            languageInput.value = '';
            studyBookForm.validateField('language');
            expect(languageInput.classList.contains('error')).toBe(true);
            
            // Simulate clearing error
            studyBookForm.clearFieldError('language');
            expect(languageInput.classList.contains('error')).toBe(false);
        });
    });

    describe('Character Count', () => {
        beforeEach(() => {
            studyBookForm = new StudyBookForm(container, { showCharacterCount: true });
            studyBookForm.render();
        });

        test('should update character count on input', () => {
            const questionTextarea = container.querySelector('#question');
            const countElement = container.querySelector('#question-count');
            
            questionTextarea.value = 'Test question';
            studyBookForm.updateCharacterCount('question');
            
            expect(countElement.textContent).toBe('13');
        });

        test('should add warning class when approaching limit', () => {
            const questionTextarea = container.querySelector('#question');
            const countElement = container.querySelector('#question-count');
            
            questionTextarea.value = 'a'.repeat(950); // 95% of 1000 limit
            studyBookForm.updateCharacterCount('question');
            
            expect(countElement.classList.contains('warning')).toBe(true);
        });

        test('should add error class when exceeding limit', () => {
            const questionTextarea = container.querySelector('#question');
            const countElement = container.querySelector('#question-count');
            
            questionTextarea.value = 'a'.repeat(1001); // Over 1000 limit
            studyBookForm.updateCharacterCount('question');
            
            expect(countElement.classList.contains('error')).toBe(true);
        });
    });

    describe('Form Submission', () => {
        beforeEach(() => {
            studyBookForm.render();
        });

        test('should emit create event with valid data in create mode', (done) => {
            const languageInput = container.querySelector('#language');
            const questionTextarea = container.querySelector('#question');
            const explanationTextarea = container.querySelector('#explanation');
            const form = container.querySelector('#studybook-form');
            
            languageInput.value = 'JavaScript';
            questionTextarea.value = 'This is a test question';
            explanationTextarea.value = 'This is a test explanation';
            
            studyBookForm.on('create', (event) => {
                expect(event.detail.language).toBe('JavaScript');
                expect(event.detail.question).toBe('This is a test question');
                expect(event.detail.explanation).toBe('This is a test explanation');
                done();
            });
            
            form.dispatchEvent(new Event('submit'));
        });

        test('should emit update event with valid data in edit mode', (done) => {
            const studyBookData = { id: '1', language: 'Java', question: 'Old question', explanation: 'Old explanation' };
            studyBookForm = new StudyBookForm(container, { mode: 'edit', studyBookData });
            studyBookForm.render();
            
            const languageInput = container.querySelector('#language');
            const questionTextarea = container.querySelector('#question');
            const form = container.querySelector('#studybook-form');
            
            languageInput.value = 'JavaScript';
            questionTextarea.value = 'Updated question text';
            
            studyBookForm.on('update', (event) => {
                expect(event.detail.id).toBe('1');
                expect(event.detail.language).toBe('JavaScript');
                expect(event.detail.question).toBe('Updated question text');
                done();
            });
            
            form.dispatchEvent(new Event('submit'));
        });

        test('should not emit event with invalid data', () => {
            const form = container.querySelector('#studybook-form');
            let eventEmitted = false;
            
            studyBookForm.on('create', () => {
                eventEmitted = true;
            });
            
            form.dispatchEvent(new Event('submit'));
            expect(eventEmitted).toBe(false);
        });

        test('should display validation errors on invalid submission', () => {
            const form = container.querySelector('#studybook-form');
            
            form.dispatchEvent(new Event('submit'));
            
            expect(container.querySelector('#language-error').textContent).toBeTruthy();
            expect(container.querySelector('#question-error').textContent).toBeTruthy();
        });

        test('should prevent multiple submissions', () => {
            const form = container.querySelector('#studybook-form');
            
            studyBookForm.setSubmittingState(true);
            
            let eventCount = 0;
            studyBookForm.on('create', () => {
                eventCount++;
            });
            
            form.dispatchEvent(new Event('submit'));
            form.dispatchEvent(new Event('submit'));
            
            expect(eventCount).toBe(0);
        });
    });

    describe('Cancel Functionality', () => {
        beforeEach(() => {
            studyBookForm.render();
        });

        test('should emit cancel event when cancel button clicked', (done) => {
            const cancelBtn = container.querySelector('#cancel-btn');
            
            studyBookForm.on('cancel', () => {
                done();
            });
            
            cancelBtn.click();
        });
    });

    describe('Loading States', () => {
        beforeEach(() => {
            studyBookForm.render();
        });

        test('should disable form during submission', () => {
            const submitButton = container.querySelector('#submit-btn');
            const cancelButton = container.querySelector('#cancel-btn');
            const inputs = container.querySelectorAll('.form-input, .form-textarea');
            
            studyBookForm.setSubmittingState(true);
            
            expect(submitButton.disabled).toBe(true);
            expect(cancelButton.disabled).toBe(true);
            inputs.forEach(input => {
                expect(input.disabled).toBe(true);
            });
        });

        test('should show loading text during submission', () => {
            const btnText = container.querySelector('.btn-text');
            const btnLoading = container.querySelector('.btn-loading');
            
            studyBookForm.setSubmittingState(true);
            
            expect(btnText.style.display).toBe('none');
            expect(btnLoading.style.display).toBe('inline');
        });

        test('should restore normal state after submission', () => {
            const submitButton = container.querySelector('#submit-btn');
            const btnText = container.querySelector('.btn-text');
            const btnLoading = container.querySelector('.btn-loading');
            
            studyBookForm.setSubmittingState(true);
            studyBookForm.setSubmittingState(false);
            
            expect(submitButton.disabled).toBe(false);
            expect(btnText.style.display).toBe('inline');
            expect(btnLoading.style.display).toBe('none');
        });
    });

    describe('Form Reset', () => {
        beforeEach(() => {
            studyBookForm.render();
        });

        test('should reset form to initial state', () => {
            const languageInput = container.querySelector('#language');
            const questionTextarea = container.querySelector('#question');
            
            // Fill form
            languageInput.value = 'JavaScript';
            questionTextarea.value = 'Test question';
            
            // Add some errors
            studyBookForm.displayError('Test error');
            
            // Reset form
            studyBookForm.reset();
            
            expect(languageInput.value).toBe('');
            expect(questionTextarea.value).toBe('');
            expect(container.querySelector('#error-container').style.display).toBe('none');
        });
    });

    describe('Error Display', () => {
        beforeEach(() => {
            studyBookForm.render();
        });

        test('should display general error message', () => {
            const errorMessage = 'Test error message';
            studyBookForm.displayError(errorMessage);
            
            const errorContainer = container.querySelector('#error-container');
            expect(errorContainer.textContent).toBe(errorMessage);
            expect(errorContainer.style.display).toBe('block');
        });

        test('should display success message', () => {
            const successMessage = 'Test success message';
            studyBookForm.displaySuccess(successMessage);
            
            const successContainer = container.querySelector('#success-container');
            expect(successContainer.textContent).toBe(successMessage);
            expect(successContainer.style.display).toBe('block');
        });

        test('should clear all errors', () => {
            // Set up some errors
            studyBookForm.displayError('Test error');
            studyBookForm.displayFieldError('language', 'Field error');
            
            studyBookForm.clearErrors();
            
            const errorContainer = container.querySelector('#error-container');
            const fieldError = container.querySelector('#language-error');
            
            expect(errorContainer.style.display).toBe('none');
            expect(fieldError.textContent).toBe('');
        });
    });

    describe('Data Management', () => {
        beforeEach(() => {
            studyBookForm.render();
        });

        test('should set form data externally', () => {
            const studyBookData = {
                language: 'Python',
                question: 'New question',
                explanation: 'New explanation'
            };
            
            studyBookForm.setFormData(studyBookData);
            
            expect(container.querySelector('#language').value).toBe('Python');
            expect(container.querySelector('#question').value).toBe('New question');
            expect(container.querySelector('#explanation').value).toBe('New explanation');
        });

        test('should get form data correctly', () => {
            const languageInput = container.querySelector('#language');
            const questionTextarea = container.querySelector('#question');
            const explanationTextarea = container.querySelector('#explanation');
            
            languageInput.value = 'JavaScript';
            questionTextarea.value = 'Test question';
            explanationTextarea.value = 'Test explanation';
            
            const formData = studyBookForm.getFormData();
            
            expect(formData.language).toBe('JavaScript');
            expect(formData.question).toBe('Test question');
            expect(formData.explanation).toBe('Test explanation');
        });
    });

    describe('Event Management', () => {
        beforeEach(() => {
            studyBookForm.render();
        });

        test('should add and remove event listeners', (done) => {
            let eventReceived = false;
            
            const handler = () => {
                eventReceived = true;
            };
            
            studyBookForm.on('create', handler);
            studyBookForm.off('create', handler);
            
            const languageInput = container.querySelector('#language');
            const questionTextarea = container.querySelector('#question');
            const form = container.querySelector('#studybook-form');
            
            languageInput.value = 'JavaScript';
            questionTextarea.value = 'This is a test question';
            
            form.dispatchEvent(new Event('submit'));
            
            setTimeout(() => {
                expect(eventReceived).toBe(false);
                done();
            }, 10);
        });
    });

    describe('Cleanup', () => {
        test('should clean up resources on destroy', () => {
            studyBookForm.render();
            
            const initialHTML = container.innerHTML;
            expect(initialHTML).toBeTruthy();
            
            studyBookForm.destroy();
            
            expect(container.innerHTML).toBe('');
        });
    });

    describe('Accessibility', () => {
        beforeEach(() => {
            studyBookForm.render();
        });

        test('should have proper form labels', () => {
            const languageLabel = container.querySelector('label[for="language"]');
            const questionLabel = container.querySelector('label[for="question"]');
            const explanationLabel = container.querySelector('label[for="explanation"]');
            
            expect(languageLabel).toBeTruthy();
            expect(questionLabel).toBeTruthy();
            expect(explanationLabel).toBeTruthy();
        });

        test('should have required field indicators', () => {
            const requiredMarks = container.querySelectorAll('.required-mark');
            expect(requiredMarks.length).toBeGreaterThan(0);
        });

        test('should have proper input attributes', () => {
            const languageInput = container.querySelector('#language');
            const questionTextarea = container.querySelector('#question');
            
            expect(languageInput.hasAttribute('required')).toBe(true);
            expect(questionTextarea.hasAttribute('required')).toBe(true);
        });
    });
});