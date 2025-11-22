/**
 * @jest-environment jsdom
 */

import { TypingSettingsForm } from '../../../../Rct/js/presentation/components/typing/TypingSettingsForm.js';

describe('TypingSettingsForm', () => {
    let settingsForm;
    let mockContainer;
    let mockEventBus;

    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = `
            <div id="settings-container">
                <form id="typing-settings-form">
                    <select id="language-select">
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                    </select>
                    <select id="difficulty-select">
                        <option value="1">Beginner</option>
                        <option value="2">Intermediate</option>
                        <option value="3">Advanced</option>
                    </select>
                    <input type="number" id="session-duration" min="1" max="60" value="5">
                    <input type="checkbox" id="show-hints">
                    <input type="checkbox" id="strict-mode">
                    <button type="submit" id="apply-settings">Apply Settings</button>
                    <button type="button" id="reset-settings">Reset to Default</button>
                </form>
            </div>
        `;

        mockContainer = document.getElementById('settings-container');
        
        mockEventBus = {
            emit: jest.fn(),
            on: jest.fn(),
            off: jest.fn()
        };

        settingsForm = new TypingSettingsForm(mockContainer, mockEventBus);
    });

    afterEach(() => {
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        test('should initialize with container and event bus', () => {
            expect(settingsForm.container).toBe(mockContainer);
            expect(settingsForm.eventBus).toBe(mockEventBus);
        });

        test('should throw error if container is not provided', () => {
            expect(() => {
                new TypingSettingsForm(null, mockEventBus);
            }).toThrow('Container element is required');
        });

        test('should load default settings on initialization', () => {
            settingsForm.initialize();

            expect(settingsForm.settings.language).toBe('javascript');
            expect(settingsForm.settings.difficulty).toBe(1);
            expect(settingsForm.settings.sessionDuration).toBe(5);
            expect(settingsForm.settings.showHints).toBe(false);
            expect(settingsForm.settings.strictMode).toBe(false);
        });
    });

    describe('Settings Management', () => {
        test('should get current settings from form', () => {
            settingsForm.initialize();

            // Set form values
            document.getElementById('language-select').value = 'python';
            document.getElementById('difficulty-select').value = '2';
            document.getElementById('session-duration').value = '10';
            document.getElementById('show-hints').checked = true;
            document.getElementById('strict-mode').checked = true;

            const settings = settingsForm.getSettings();

            expect(settings.language).toBe('python');
            expect(settings.difficulty).toBe(2);
            expect(settings.sessionDuration).toBe(10);
            expect(settings.showHints).toBe(true);
            expect(settings.strictMode).toBe(true);
        });

        test('should apply settings to form', () => {
            const settings = {
                language: 'java',
                difficulty: 3,
                sessionDuration: 15,
                showHints: true,
                strictMode: false
            };

            settingsForm.initialize();
            settingsForm.applySettings(settings);

            expect(document.getElementById('language-select').value).toBe('java');
            expect(document.getElementById('difficulty-select').value).toBe('3');
            expect(document.getElementById('session-duration').value).toBe('15');
            expect(document.getElementById('show-hints').checked).toBe(true);
            expect(document.getElementById('strict-mode').checked).toBe(false);
        });

        test('should reset to default settings', () => {
            settingsForm.initialize();

            // Change some settings
            document.getElementById('language-select').value = 'python';
            document.getElementById('difficulty-select').value = '3';
            document.getElementById('show-hints').checked = true;

            const resetButton = document.getElementById('reset-settings');
            resetButton.click();

            expect(document.getElementById('language-select').value).toBe('javascript');
            expect(document.getElementById('difficulty-select').value).toBe('1');
            expect(document.getElementById('show-hints').checked).toBe(false);
        });
    });

    describe('Form Validation', () => {
        test('should validate session duration range', () => {
            settingsForm.initialize();

            const durationInput = document.getElementById('session-duration');
            
            // Test invalid values
            durationInput.value = '0';
            expect(settingsForm.validateSettings()).toBe(false);

            durationInput.value = '61';
            expect(settingsForm.validateSettings()).toBe(false);

            // Test valid values
            durationInput.value = '5';
            expect(settingsForm.validateSettings()).toBe(true);

            durationInput.value = '30';
            expect(settingsForm.validateSettings()).toBe(true);
        });

        test('should validate required fields', () => {
            settingsForm.initialize();

            const languageSelect = document.getElementById('language-select');
            languageSelect.value = '';

            expect(settingsForm.validateSettings()).toBe(false);

            languageSelect.value = 'javascript';
            expect(settingsForm.validateSettings()).toBe(true);
        });

        test('should show validation errors', () => {
            settingsForm.initialize();

            const durationInput = document.getElementById('session-duration');
            durationInput.value = '0';

            settingsForm.validateSettings();

            expect(durationInput.classList.contains('error')).toBe(true);
            expect(mockEventBus.emit).toHaveBeenCalledWith('notification:error', expect.stringContaining('duration'));
        });
    });

    describe('Form Submission', () => {
        test('should emit settings change event on form submission', () => {
            settingsForm.initialize();

            const form = document.getElementById('typing-settings-form');
            const submitEvent = new Event('submit');
            
            form.dispatchEvent(submitEvent);

            expect(mockEventBus.emit).toHaveBeenCalledWith('settings:changed', expect.any(Object));
        });

        test('should prevent form submission if validation fails', () => {
            settingsForm.initialize();

            const durationInput = document.getElementById('session-duration');
            durationInput.value = '0'; // Invalid value

            const form = document.getElementById('typing-settings-form');
            const submitEvent = new Event('submit');
            
            form.dispatchEvent(submitEvent);

            expect(mockEventBus.emit).not.toHaveBeenCalledWith('settings:changed', expect.any(Object));
        });

        test('should save settings to localStorage on successful submission', () => {
            const mockLocalStorage = {
                setItem: jest.fn(),
                getItem: jest.fn(),
                removeItem: jest.fn()
            };
            Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

            settingsForm.initialize();

            const form = document.getElementById('typing-settings-form');
            const submitEvent = new Event('submit');
            
            form.dispatchEvent(submitEvent);

            expect(mockLocalStorage.setItem).toHaveBeenCalledWith('typingSettings', expect.any(String));
        });
    });

    describe('Settings Persistence', () => {
        test('should load settings from localStorage on initialization', () => {
            const savedSettings = {
                language: 'python',
                difficulty: 2,
                sessionDuration: 10,
                showHints: true,
                strictMode: true
            };

            const mockLocalStorage = {
                getItem: jest.fn().mockReturnValue(JSON.stringify(savedSettings)),
                setItem: jest.fn()
            };
            Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

            settingsForm.initialize();

            expect(document.getElementById('language-select').value).toBe('python');
            expect(document.getElementById('difficulty-select').value).toBe('2');
            expect(document.getElementById('session-duration').value).toBe('10');
            expect(document.getElementById('show-hints').checked).toBe(true);
            expect(document.getElementById('strict-mode').checked).toBe(true);
        });

        test('should handle corrupted localStorage data gracefully', () => {
            const mockLocalStorage = {
                getItem: jest.fn().mockReturnValue('invalid json'),
                setItem: jest.fn()
            };
            Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

            expect(() => {
                settingsForm.initialize();
            }).not.toThrow();

            // Should fall back to defaults
            expect(document.getElementById('language-select').value).toBe('javascript');
        });
    });

    describe('Event Handling', () => {
        test('should listen to settings reset events', () => {
            settingsForm.initialize();

            expect(mockEventBus.on).toHaveBeenCalledWith('settings:reset', expect.any(Function));
        });

        test('should handle external settings updates', () => {
            settingsForm.initialize();

            // Get the settings update handler
            const updateHandler = mockEventBus.on.mock.calls.find(call => call[0] === 'settings:update')[1];
            
            const newSettings = {
                language: 'java',
                difficulty: 3
            };

            if (updateHandler) {
                updateHandler(newSettings);
                expect(document.getElementById('language-select').value).toBe('java');
                expect(document.getElementById('difficulty-select').value).toBe('3');
            }
        });

        test('should cleanup event listeners on destroy', () => {
            settingsForm.initialize();
            settingsForm.destroy();

            expect(mockEventBus.off).toHaveBeenCalledWith('settings:reset', expect.any(Function));
        });
    });

    describe('Accessibility', () => {
        test('should have proper labels and ARIA attributes', () => {
            settingsForm.initialize();

            const languageSelect = document.getElementById('language-select');
            const difficultySelect = document.getElementById('difficulty-select');
            const durationInput = document.getElementById('session-duration');

            expect(languageSelect.getAttribute('aria-label')).toBeTruthy();
            expect(difficultySelect.getAttribute('aria-label')).toBeTruthy();
            expect(durationInput.getAttribute('aria-label')).toBeTruthy();
        });

        test('should support keyboard navigation', () => {
            settingsForm.initialize();

            const form = document.getElementById('typing-settings-form');
            const inputs = form.querySelectorAll('select, input, button');

            inputs.forEach(input => {
                expect(input.tabIndex).toBeGreaterThanOrEqual(0);
            });
        });
    });
});