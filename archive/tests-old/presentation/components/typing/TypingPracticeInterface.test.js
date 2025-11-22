/**
 * @jest-environment jsdom
 */

import { TypingPracticeInterface } from '../../../../Rct/js/presentation/components/typing/TypingPracticeInterface.js';

describe('TypingPracticeInterface', () => {
    let typingInterface;
    let mockContainer;
    let mockTypingController;
    let mockEventBus;

    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = `
            <div id="typing-container">
                <div id="typing-question"></div>
                <textarea id="typing-input"></textarea>
                <div id="typing-progress"></div>
                <button id="start-button">Start</button>
                <button id="finish-button">Finish</button>
                <div id="typing-result"></div>
            </div>
        `;

        mockContainer = document.getElementById('typing-container');
        
        mockTypingController = {
            startSession: jest.fn(),
            finishSession: jest.fn(),
            calculateProgress: jest.fn(),
            validateInput: jest.fn()
        };

        mockEventBus = {
            emit: jest.fn(),
            on: jest.fn(),
            off: jest.fn()
        };

        typingInterface = new TypingPracticeInterface(mockContainer, mockTypingController, mockEventBus);
    });

    afterEach(() => {
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        test('should initialize with container and dependencies', () => {
            expect(typingInterface.container).toBe(mockContainer);
            expect(typingInterface.typingController).toBe(mockTypingController);
            expect(typingInterface.eventBus).toBe(mockEventBus);
        });

        test('should throw error if container is not provided', () => {
            expect(() => {
                new TypingPracticeInterface(null, mockTypingController, mockEventBus);
            }).toThrow('Container element is required');
        });

        test('should throw error if typing controller is not provided', () => {
            expect(() => {
                new TypingPracticeInterface(mockContainer, null, mockEventBus);
            }).toThrow('TypingController is required');
        });
    });

    describe('Session Management', () => {
        test('should start typing session when start button is clicked', async () => {
            const mockSession = { id: '123', question: 'test question' };
            mockTypingController.startSession.mockResolvedValue(mockSession);

            typingInterface.initialize();
            
            const startButton = document.getElementById('start-button');
            startButton.click();

            await new Promise(resolve => setTimeout(resolve, 0)); // Wait for async

            expect(mockTypingController.startSession).toHaveBeenCalled();
            expect(mockEventBus.emit).toHaveBeenCalledWith('session:started', mockSession);
        });

        test('should finish typing session when finish button is clicked', async () => {
            const mockResult = { accuracy: 95, wpm: 60 };
            mockTypingController.finishSession.mockResolvedValue(mockResult);

            typingInterface.initialize();
            typingInterface.currentSession = { id: '123' };
            
            const finishButton = document.getElementById('finish-button');
            finishButton.click();

            await new Promise(resolve => setTimeout(resolve, 0));

            expect(mockTypingController.finishSession).toHaveBeenCalled();
            expect(mockEventBus.emit).toHaveBeenCalledWith('session:finished', mockResult);
        });

        test('should not finish session if no active session', () => {
            typingInterface.initialize();
            
            const finishButton = document.getElementById('finish-button');
            finishButton.click();

            expect(mockTypingController.finishSession).not.toHaveBeenCalled();
        });
    });

    describe('Input Handling', () => {
        test('should validate input on keyup', () => {
            mockTypingController.validateInput.mockReturnValue({ isValid: true, errors: [] });

            typingInterface.initialize();
            typingInterface.currentSession = { id: '123', question: 'test' };

            const input = document.getElementById('typing-input');
            input.value = 'test';
            
            const event = new KeyboardEvent('keyup', { key: 't' });
            input.dispatchEvent(event);

            expect(mockTypingController.validateInput).toHaveBeenCalledWith('test', 'test');
        });

        test('should update progress on valid input', () => {
            mockTypingController.validateInput.mockReturnValue({ isValid: true, errors: [] });
            mockTypingController.calculateProgress.mockReturnValue({ percentage: 50, correctChars: 2 });

            typingInterface.initialize();
            typingInterface.currentSession = { id: '123', question: 'test' };

            const input = document.getElementById('typing-input');
            input.value = 'te';
            
            const event = new KeyboardEvent('keyup', { key: 'e' });
            input.dispatchEvent(event);

            const progressElement = document.getElementById('typing-progress');
            expect(progressElement.textContent).toContain('50%');
        });

        test('should handle input validation errors', () => {
            const errors = ['Character mismatch at position 1'];
            mockTypingController.validateInput.mockReturnValue({ isValid: false, errors });

            typingInterface.initialize();
            typingInterface.currentSession = { id: '123', question: 'test' };

            const input = document.getElementById('typing-input');
            input.value = 'x';
            
            const event = new KeyboardEvent('keyup', { key: 'x' });
            input.dispatchEvent(event);

            expect(input.classList.contains('error')).toBe(true);
        });
    });

    describe('UI Updates', () => {
        test('should display question when session starts', () => {
            const question = 'console.log("Hello World");';
            
            typingInterface.displayQuestion(question);

            const questionElement = document.getElementById('typing-question');
            expect(questionElement.textContent).toBe(question);
        });

        test('should display results when session finishes', () => {
            const result = {
                accuracy: 95.5,
                wpm: 65,
                duration: 120000,
                errors: 2
            };

            typingInterface.displayResult(result);

            const resultElement = document.getElementById('typing-result');
            expect(resultElement.innerHTML).toContain('95.5%');
            expect(resultElement.innerHTML).toContain('65');
            expect(resultElement.innerHTML).toContain('2:00');
        });

        test('should reset interface when new session starts', () => {
            typingInterface.initialize();
            
            // Set some state
            const input = document.getElementById('typing-input');
            input.value = 'some text';
            input.classList.add('error');

            typingInterface.reset();

            expect(input.value).toBe('');
            expect(input.classList.contains('error')).toBe(false);
            expect(document.getElementById('typing-result').innerHTML).toBe('');
        });
    });

    describe('Event Handling', () => {
        test('should listen to session events', () => {
            typingInterface.initialize();

            expect(mockEventBus.on).toHaveBeenCalledWith('session:started', expect.any(Function));
            expect(mockEventBus.on).toHaveBeenCalledWith('session:finished', expect.any(Function));
            expect(mockEventBus.on).toHaveBeenCalledWith('session:error', expect.any(Function));
        });

        test('should handle session error events', () => {
            typingInterface.initialize();

            // Get the error handler
            const errorHandler = mockEventBus.on.mock.calls.find(call => call[0] === 'session:error')[1];
            
            const error = new Error('Session failed');
            errorHandler(error);

            expect(mockEventBus.emit).toHaveBeenCalledWith('notification:error', 'Session failed');
        });

        test('should cleanup event listeners on destroy', () => {
            typingInterface.initialize();
            typingInterface.destroy();

            expect(mockEventBus.off).toHaveBeenCalledWith('session:started', expect.any(Function));
            expect(mockEventBus.off).toHaveBeenCalledWith('session:finished', expect.any(Function));
            expect(mockEventBus.off).toHaveBeenCalledWith('session:error', expect.any(Function));
        });
    });

    describe('Accessibility', () => {
        test('should have proper ARIA labels', () => {
            typingInterface.initialize();

            const input = document.getElementById('typing-input');
            expect(input.getAttribute('aria-label')).toBeTruthy();
            
            const startButton = document.getElementById('start-button');
            expect(startButton.getAttribute('aria-label')).toBeTruthy();
        });

        test('should support keyboard navigation', () => {
            typingInterface.initialize();

            const startButton = document.getElementById('start-button');
            const finishButton = document.getElementById('finish-button');

            expect(startButton.tabIndex).toBeGreaterThanOrEqual(0);
            expect(finishButton.tabIndex).toBeGreaterThanOrEqual(0);
        });
    });
});