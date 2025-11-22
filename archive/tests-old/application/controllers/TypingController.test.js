/**
 * @jest-environment jsdom
 */

import { TypingController } from '../../../Rct/js/application/controllers/TypingController.js';

describe('TypingController', () => {
    let typingController;
    let mockTypingService;
    let mockSessionRepository;
    let mockEventBus;

    beforeEach(() => {
        mockTypingService = {
            startSession: jest.fn(),
            finishSession: jest.fn(),
            calculateResult: jest.fn(),
            validateInput: jest.fn(),
            getStatistics: jest.fn()
        };

        mockSessionRepository = {
            getCurrentSession: jest.fn(),
            setCurrentSession: jest.fn(),
            clearCurrentSession: jest.fn(),
            saveSession: jest.fn()
        };

        mockEventBus = {
            emit: jest.fn(),
            on: jest.fn(),
            off: jest.fn()
        };

        typingController = new TypingController(mockTypingService, mockSessionRepository, mockEventBus);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        test('should initialize with required dependencies', () => {
            expect(typingController.typingService).toBe(mockTypingService);
            expect(typingController.sessionRepository).toBe(mockSessionRepository);
            expect(typingController.eventBus).toBe(mockEventBus);
        });

        test('should throw error if typing service is not provided', () => {
            expect(() => {
                new TypingController(null, mockSessionRepository, mockEventBus);
            }).toThrow('TypingService is required');
        });

        test('should throw error if session repository is not provided', () => {
            expect(() => {
                new TypingController(mockTypingService, null, mockEventBus);
            }).toThrow('SessionRepository is required');
        });
    });

    describe('Start Session', () => {
        test('should start typing session successfully', async () => {
            const studyBook = {
                id: '123',
                language: 'javascript',
                question: 'console.log("Hello World");',
                explanation: 'Basic console logging'
            };

            const settings = {
                strictMode: false,
                showHints: true,
                timeLimit: 300
            };

            const session = {
                id: 'session-123',
                studyBook,
                settings,
                startTime: new Date(),
                status: 'active'
            };

            mockTypingService.startSession.mockResolvedValue(session);

            const result = await typingController.startSession(studyBook, settings);

            expect(mockTypingService.startSession).toHaveBeenCalledWith(studyBook, settings);
            expect(mockSessionRepository.setCurrentSession).toHaveBeenCalledWith(session);
            expect(result.success).toBe(true);
            expect(result.session).toBe(session);
            expect(mockEventBus.emit).toHaveBeenCalledWith('session:started', session);
        });

        test('should handle session start errors', async () => {
            const studyBook = { id: '123', question: 'test' };
            const settings = {};

            const error = new Error('Failed to start session');
            mockTypingService.startSession.mockRejectedValue(error);

            const result = await typingController.startSession(studyBook, settings);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Failed to start typing session. Please try again.');
            expect(mockEventBus.emit).toHaveBeenCalledWith('session:error', error);
        });

        test('should not start session if one is already active', async () => {
            const activeSession = { id: 'active-session', status: 'active' };
            mockSessionRepository.getCurrentSession.mockReturnValue(activeSession);

            const studyBook = { id: '123', question: 'test' };
            const settings = {};

            const result = await typingController.startSession(studyBook, settings);

            expect(result.success).toBe(false);
            expect(result.error).toBe('A typing session is already active. Please finish it first.');
            expect(mockTypingService.startSession).not.toHaveBeenCalled();
        });
    });

    describe('Finish Session', () => {
        test('should finish typing session successfully', async () => {
            const activeSession = {
                id: 'session-123',
                studyBook: { id: '123', question: 'console.log("test");' },
                startTime: new Date(Date.now() - 60000), // 1 minute ago
                status: 'active'
            };

            const typedText = 'console.log("test");';
            
            const result = {
                accuracy: 100,
                wpm: 60,
                duration: 60000,
                errors: 0,
                completedAt: new Date()
            };

            mockSessionRepository.getCurrentSession.mockReturnValue(activeSession);
            mockTypingService.finishSession.mockResolvedValue(result);

            const finishResult = await typingController.finishSession(typedText);

            expect(mockTypingService.finishSession).toHaveBeenCalledWith(activeSession, typedText);
            expect(mockSessionRepository.clearCurrentSession).toHaveBeenCalled();
            expect(finishResult.success).toBe(true);
            expect(finishResult.result).toBe(result);
            expect(mockEventBus.emit).toHaveBeenCalledWith('session:finished', result);
        });

        test('should handle no active session', async () => {
            mockSessionRepository.getCurrentSession.mockReturnValue(null);

            const result = await typingController.finishSession('some text');

            expect(result.success).toBe(false);
            expect(result.error).toBe('No active typing session found.');
            expect(mockTypingService.finishSession).not.toHaveBeenCalled();
        });

        test('should handle session finish errors', async () => {
            const activeSession = { id: 'session-123', status: 'active' };
            mockSessionRepository.getCurrentSession.mockReturnValue(activeSession);

            const error = new Error('Failed to finish session');
            mockTypingService.finishSession.mockRejectedValue(error);

            const result = await typingController.finishSession('typed text');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Failed to finish typing session. Please try again.');
            expect(mockEventBus.emit).toHaveBeenCalledWith('session:error', error);
        });
    });

    describe('Input Validation', () => {
        test('should validate input against target text', () => {
            const activeSession = {
                id: 'session-123',
                studyBook: { question: 'console.log("Hello");' },
                status: 'active'
            };

            mockSessionRepository.getCurrentSession.mockReturnValue(activeSession);

            const validationResult = {
                isValid: true,
                errors: [],
                correctChars: 10,
                totalChars: 10
            };

            mockTypingService.validateInput.mockReturnValue(validationResult);

            const result = typingController.validateInput('console.log', 'console.log("Hello");');

            expect(mockTypingService.validateInput).toHaveBeenCalledWith('console.log', 'console.log("Hello");');
            expect(result).toBe(validationResult);
        });

        test('should handle validation errors', () => {
            const activeSession = {
                id: 'session-123',
                studyBook: { question: 'console.log("Hello");' },
                status: 'active'
            };

            mockSessionRepository.getCurrentSession.mockReturnValue(activeSession);

            const validationResult = {
                isValid: false,
                errors: ['Character mismatch at position 8'],
                correctChars: 7,
                totalChars: 8
            };

            mockTypingService.validateInput.mockReturnValue(validationResult);

            const result = typingController.validateInput('console.', 'console.log("Hello");');

            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(1);
        });

        test('should return null if no active session', () => {
            mockSessionRepository.getCurrentSession.mockReturnValue(null);

            const result = typingController.validateInput('test', 'target');

            expect(result).toBeNull();
            expect(mockTypingService.validateInput).not.toHaveBeenCalled();
        });
    });

    describe('Progress Calculation', () => {
        test('should calculate typing progress', () => {
            const activeSession = {
                id: 'session-123',
                studyBook: { question: 'console.log("Hello World");' },
                status: 'active'
            };

            mockSessionRepository.getCurrentSession.mockReturnValue(activeSession);

            const progress = typingController.calculateProgress('console.log("H');

            expect(progress.percentage).toBe(50); // Assuming 50% completion
            expect(progress.correctChars).toBe(14);
            expect(progress.totalChars).toBe(28);
        });

        test('should return zero progress if no active session', () => {
            mockSessionRepository.getCurrentSession.mockReturnValue(null);

            const progress = typingController.calculateProgress('test');

            expect(progress.percentage).toBe(0);
            expect(progress.correctChars).toBe(0);
            expect(progress.totalChars).toBe(0);
        });
    });

    describe('Statistics', () => {
        test('should get typing statistics', async () => {
            const userId = 'user-123';
            const statistics = {
                totalSessions: 50,
                averageAccuracy: 92.5,
                averageWpm: 65,
                totalTime: 180000,
                bestAccuracy: 100,
                bestWpm: 85
            };

            mockTypingService.getStatistics.mockResolvedValue(statistics);

            const result = await typingController.getStatistics(userId);

            expect(mockTypingService.getStatistics).toHaveBeenCalledWith(userId);
            expect(result).toBe(statistics);
        });

        test('should handle statistics retrieval errors', async () => {
            const userId = 'user-123';
            const error = new Error('Failed to get statistics');

            mockTypingService.getStatistics.mockRejectedValue(error);

            await expect(typingController.getStatistics(userId)).rejects.toThrow('Failed to get statistics');
            expect(mockEventBus.emit).toHaveBeenCalledWith('statistics:error', error);
        });
    });

    describe('Session Management', () => {
        test('should get current session', () => {
            const session = { id: 'session-123', status: 'active' };
            mockSessionRepository.getCurrentSession.mockReturnValue(session);

            const result = typingController.getCurrentSession();

            expect(result).toBe(session);
        });

        test('should pause session', () => {
            const activeSession = { id: 'session-123', status: 'active' };
            mockSessionRepository.getCurrentSession.mockReturnValue(activeSession);

            typingController.pauseSession();

            expect(mockEventBus.emit).toHaveBeenCalledWith('session:paused', activeSession);
        });

        test('should resume session', () => {
            const pausedSession = { id: 'session-123', status: 'paused' };
            mockSessionRepository.getCurrentSession.mockReturnValue(pausedSession);

            typingController.resumeSession();

            expect(mockEventBus.emit).toHaveBeenCalledWith('session:resumed', pausedSession);
        });

        test('should cancel session', () => {
            const activeSession = { id: 'session-123', status: 'active' };
            mockSessionRepository.getCurrentSession.mockReturnValue(activeSession);

            typingController.cancelSession();

            expect(mockSessionRepository.clearCurrentSession).toHaveBeenCalled();
            expect(mockEventBus.emit).toHaveBeenCalledWith('session:cancelled', activeSession);
        });
    });

    describe('Error Handling', () => {
        test('should handle different types of errors appropriately', async () => {
            const studyBook = { id: '123', question: 'test' };
            const settings = {};

            // Test validation error
            const validationError = new Error('Invalid study book');
            validationError.name = 'ValidationError';
            mockTypingService.startSession.mockRejectedValueOnce(validationError);

            let result = await typingController.startSession(studyBook, settings);
            expect(result.error).toBe('Invalid study book');

            // Test network error
            const networkError = new Error('Network failed');
            networkError.name = 'NetworkError';
            mockTypingService.startSession.mockRejectedValueOnce(networkError);

            result = await typingController.startSession(studyBook, settings);
            expect(result.error).toBe('Failed to start typing session. Please try again.');

            // Test generic error
            const genericError = new Error('Unknown error');
            mockTypingService.startSession.mockRejectedValueOnce(genericError);

            result = await typingController.startSession(studyBook, settings);
            expect(result.error).toBe('Failed to start typing session. Please try again.');
        });

        test('should emit error events for all operations', async () => {
            const error = new Error('Test error');

            // Test session start error
            mockTypingService.startSession.mockRejectedValue(error);
            await typingController.startSession({ id: '123' }, {});
            expect(mockEventBus.emit).toHaveBeenCalledWith('session:error', error);

            // Test session finish error
            mockSessionRepository.getCurrentSession.mockReturnValue({ id: 'session-123' });
            mockTypingService.finishSession.mockRejectedValue(error);
            await typingController.finishSession('text');
            expect(mockEventBus.emit).toHaveBeenCalledWith('session:error', error);

            // Test statistics error
            mockTypingService.getStatistics.mockRejectedValue(error);
            await expect(typingController.getStatistics('user-123')).rejects.toThrow();
            expect(mockEventBus.emit).toHaveBeenCalledWith('statistics:error', error);
        });
    });

    describe('Session State Management', () => {
        test('should track session state changes', () => {
            const session = { id: 'session-123', status: 'active' };
            
            typingController.updateSessionState(session, 'paused');
            
            expect(session.status).toBe('paused');
            expect(mockEventBus.emit).toHaveBeenCalledWith('session:state-changed', {
                session,
                previousState: 'active',
                newState: 'paused'
            });
        });

        test('should validate state transitions', () => {
            const session = { id: 'session-123', status: 'completed' };
            
            const result = typingController.updateSessionState(session, 'active');
            
            expect(result).toBe(false);
            expect(session.status).toBe('completed'); // Should not change
        });
    });
});