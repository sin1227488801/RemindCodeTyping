/**
 * Unit tests for TypingSession and TypingResult domain models
 */

// Import the classes
const { TypingSession, TypingResult } = require('../../../Rct/js/domain/models/TypingSession.js');
const StudyBook = require('../../../Rct/js/domain/models/StudyBook.js');

describe('TypingSession Domain Model', () => {
    let studyBook;
    
    beforeEach(() => {
        studyBook = new StudyBook('sb123', 'JavaScript', 'console.log("Hello World");', 'Prints Hello World');
    });

    describe('Constructor', () => {
        test('should create a valid typing session with required parameters', () => {
            const session = new TypingSession('ts123', studyBook, 'user123');
            
            expect(session.id).toBe('ts123');
            expect(session.studyBook).toBe(studyBook);
            expect(session.userId).toBe('user123');
            expect(session.status).toBe('not_started');
            expect(session.startTime).toBeNull();
            expect(session.endTime).toBeNull();
            expect(session.result).toBeNull();
            expect(session.createdAt).toBeInstanceOf(Date);
        });

        test('should create a session with custom settings', () => {
            const settings = { timeLimit: 300, strictMode: true };
            const session = new TypingSession('ts123', studyBook, 'user123', settings);
            
            expect(session.settings.timeLimit).toBe(300);
            expect(session.settings.strictMode).toBe(true);
            expect(session.settings.allowBackspace).toBe(true); // default value
        });

        test('should create a session with null id for new sessions', () => {
            const session = new TypingSession(null, studyBook, 'user123');
            
            expect(session.id).toBeNull();
        });

        test('should throw error for invalid studyBook', () => {
            expect(() => new TypingSession('ts123', null, 'user123'))
                .toThrow('StudyBook must be provided');
            expect(() => new TypingSession('ts123', 'invalid', 'user123'))
                .toThrow('StudyBook must be provided');
        });

        test('should throw error for invalid userId', () => {
            expect(() => new TypingSession('ts123', studyBook, ''))
                .toThrow('User ID must be a non-empty string');
            expect(() => new TypingSession('ts123', studyBook, null))
                .toThrow('User ID must be a non-empty string');
        });
    });

    describe('Session Lifecycle', () => {
        test('start should start the session', () => {
            const session = new TypingSession('ts123', studyBook, 'user123');
            
            session.start();
            
            expect(session.status).toBe('in_progress');
            expect(session.startTime).toBeInstanceOf(Date);
        });

        test('start should throw error if already started', () => {
            const session = new TypingSession('ts123', studyBook, 'user123');
            session.start();
            
            expect(() => session.start()).toThrow('Session has already been started');
        });

        test('complete should complete the session and calculate result', () => {
            const session = new TypingSession('ts123', studyBook, 'user123');
            session.start();
            
            // Wait a bit to ensure duration > 0
            setTimeout(() => {
                const typedText = 'console.log("Hello World");';
                const result = session.complete(typedText);
                
                expect(session.status).toBe('completed');
                expect(session.endTime).toBeInstanceOf(Date);
                expect(session.result).toBeInstanceOf(TypingResult);
                expect(result).toBe(session.result);
            }, 10);
        });

        test('complete should throw error if not in progress', () => {
            const session = new TypingSession('ts123', studyBook, 'user123');
            
            expect(() => session.complete('text')).toThrow('Session is not in progress');
        });

        test('abandon should abandon the session', () => {
            const session = new TypingSession('ts123', studyBook, 'user123');
            session.start();
            
            session.abandon();
            
            expect(session.status).toBe('abandoned');
            expect(session.endTime).toBeInstanceOf(Date);
        });

        test('abandon should throw error if not in progress', () => {
            const session = new TypingSession('ts123', studyBook, 'user123');
            
            expect(() => session.abandon()).toThrow('Session is not in progress');
        });
    });

    describe('Time Management', () => {
        test('getElapsedTime should return null if not started', () => {
            const session = new TypingSession('ts123', studyBook, 'user123');
            
            expect(session.getElapsedTime()).toBeNull();
        });

        test('getElapsedTime should return elapsed time', () => {
            const session = new TypingSession('ts123', studyBook, 'user123');
            session.start();
            
            setTimeout(() => {
                const elapsed = session.getElapsedTime();
                expect(elapsed).toBeGreaterThan(0);
            }, 10);
        });

        test('getRemainingTime should return null if no time limit', () => {
            const session = new TypingSession('ts123', studyBook, 'user123', { timeLimit: null });
            session.start();
            
            expect(session.getRemainingTime()).toBeNull();
        });

        test('getRemainingTime should return remaining time', () => {
            const session = new TypingSession('ts123', studyBook, 'user123', { timeLimit: 60 });
            session.start();
            
            const remaining = session.getRemainingTime();
            expect(remaining).toBeLessThanOrEqual(60);
            expect(remaining).toBeGreaterThan(0);
        });

        test('isTimeExpired should return false if no time limit', () => {
            const session = new TypingSession('ts123', studyBook, 'user123', { timeLimit: null });
            session.start();
            
            expect(session.isTimeExpired()).toBe(false);
        });

        test('isTimeExpired should return true if time expired', () => {
            const session = new TypingSession('ts123', studyBook, 'user123', { timeLimit: 0.001 }); // 1ms
            session.start();
            
            setTimeout(() => {
                expect(session.isTimeExpired()).toBe(true);
            }, 10);
        });
    });

    describe('Status Checks', () => {
        test('isActive should return true for in_progress sessions', () => {
            const session = new TypingSession('ts123', studyBook, 'user123');
            session.start();
            
            expect(session.isActive()).toBe(true);
        });

        test('isActive should return false for other statuses', () => {
            const session = new TypingSession('ts123', studyBook, 'user123');
            
            expect(session.isActive()).toBe(false);
            
            session.start();
            session.complete('text');
            expect(session.isActive()).toBe(false);
        });

        test('isCompleted should return true for completed sessions', () => {
            const session = new TypingSession('ts123', studyBook, 'user123');
            session.start();
            session.complete('text');
            
            expect(session.isCompleted()).toBe(true);
        });

        test('isAbandoned should return true for abandoned sessions', () => {
            const session = new TypingSession('ts123', studyBook, 'user123');
            session.start();
            session.abandon();
            
            expect(session.isAbandoned()).toBe(true);
        });
    });

    describe('Result Calculation', () => {
        test('calculateResult should calculate correct accuracy for perfect match', () => {
            const session = new TypingSession('ts123', studyBook, 'user123');
            session.start();
            
            setTimeout(() => {
                const typedText = 'console.log("Hello World");';
                const result = session.calculateResult(typedText);
                
                expect(result.accuracy).toBe(100);
                expect(result.isComplete).toBe(true);
                expect(result.correctCharacters).toBe(typedText.length);
                expect(result.totalCharacters).toBe(studyBook.question.length);
            }, 10);
        });

        test('calculateResult should calculate correct accuracy for partial match', () => {
            const session = new TypingSession('ts123', studyBook, 'user123');
            session.start();
            
            setTimeout(() => {
                const typedText = 'console.log("Hello');
                const result = session.calculateResult(typedText);
                
                expect(result.accuracy).toBeLessThan(100);
                expect(result.isComplete).toBe(false);
                expect(result.correctCharacters).toBe(18); // Characters that match
            }, 10);
        });

        test('calculateResult should handle line ending normalization', () => {
            const multiLineStudyBook = new StudyBook('sb123', 'JavaScript', 'line1\nline2\nline3', '');
            const session = new TypingSession('ts123', multiLineStudyBook, 'user123');
            session.start();
            
            setTimeout(() => {
                const typedText = 'line1\r\nline2\r\nline3'; // Windows line endings
                const result = session.calculateResult(typedText);
                
                expect(result.accuracy).toBe(100);
                expect(result.isComplete).toBe(true);
            }, 10);
        });

        test('calculateResult should calculate WPM and CPM', () => {
            const session = new TypingSession('ts123', studyBook, 'user123');
            session.start();
            
            setTimeout(() => {
                const typedText = 'console.log("Hello World");';
                const result = session.calculateResult(typedText);
                
                expect(result.wpm).toBeGreaterThan(0);
                expect(result.cpm).toBeGreaterThan(0);
                expect(result.durationMs).toBeGreaterThan(0);
            }, 10);
        });
    });

    describe('Serialization', () => {
        test('toPlainObject should return correct plain object', () => {
            const session = new TypingSession('ts123', studyBook, 'user123', { timeLimit: 300 });
            session.start();
            session.complete('console.log("Hello World");');
            
            const plainObject = session.toPlainObject();
            
            expect(plainObject.id).toBe('ts123');
            expect(plainObject.studyBook).toEqual(studyBook.toPlainObject());
            expect(plainObject.userId).toBe('user123');
            expect(plainObject.settings.timeLimit).toBe(300);
            expect(plainObject.status).toBe('completed');
            expect(plainObject.startTime).toBeTruthy();
            expect(plainObject.endTime).toBeTruthy();
            expect(plainObject.result).toBeTruthy();
            expect(plainObject.createdAt).toBeTruthy();
        });

        test('fromPlainObject should create session from plain object', () => {
            const data = {
                id: 'ts123',
                studyBook: studyBook.toPlainObject(),
                userId: 'user123',
                settings: { timeLimit: 300 },
                startTime: '2024-01-01T00:00:00.000Z',
                endTime: '2024-01-01T00:01:00.000Z',
                result: {
                    correctCharacters: 25,
                    totalCharacters: 25,
                    typedCharacters: 25,
                    accuracy: 100,
                    durationMs: 60000,
                    wpm: 30,
                    cpm: 25,
                    isComplete: true
                },
                status: 'completed',
                createdAt: '2024-01-01T00:00:00.000Z'
            };
            
            const session = TypingSession.fromPlainObject(data);
            
            expect(session.id).toBe('ts123');
            expect(session.userId).toBe('user123');
            expect(session.status).toBe('completed');
            expect(session.startTime).toEqual(new Date('2024-01-01T00:00:00.000Z'));
            expect(session.endTime).toEqual(new Date('2024-01-01T00:01:00.000Z'));
            expect(session.result).toBeInstanceOf(TypingResult);
        });
    });

    describe('String Representation', () => {
        test('toString should return correct string representation', () => {
            const session = new TypingSession('ts123', studyBook, 'user123');
            const expected = 'TypingSession(id=ts123, status=not_started, studyBook=sb123)';
            
            expect(session.toString()).toBe(expected);
        });
    });
});

describe('TypingResult Value Object', () => {
    describe('Constructor', () => {
        test('should create a valid typing result', () => {
            const result = new TypingResult(20, 25, 22, 80, 60000, 30, 22, false);
            
            expect(result.correctCharacters).toBe(20);
            expect(result.totalCharacters).toBe(25);
            expect(result.typedCharacters).toBe(22);
            expect(result.accuracy).toBe(80);
            expect(result.durationMs).toBe(60000);
            expect(result.durationSeconds).toBe(60);
            expect(result.wpm).toBe(30);
            expect(result.cpm).toBe(22);
            expect(result.isComplete).toBe(false);
        });

        test('should round accuracy, wpm, and cpm to 2 decimal places', () => {
            const result = new TypingResult(20, 25, 22, 80.12345, 60000, 30.6789, 22.3456, false);
            
            expect(result.accuracy).toBe(80.12);
            expect(result.wpm).toBe(30.68);
            expect(result.cpm).toBe(22.35);
        });

        test('should throw error for invalid parameters', () => {
            expect(() => new TypingResult(-1, 25, 22, 80, 60000, 30, 22, false))
                .toThrow('Correct characters must be a non-negative number');
            expect(() => new TypingResult(20, -1, 22, 80, 60000, 30, 22, false))
                .toThrow('Total characters must be a non-negative number');
            expect(() => new TypingResult(20, 25, -1, 80, 60000, 30, 22, false))
                .toThrow('Typed characters must be a non-negative number');
            expect(() => new TypingResult(20, 25, 22, 150, 60000, 30, 22, false))
                .toThrow('Accuracy must be a number between 0 and 100');
            expect(() => new TypingResult(20, 25, 22, 80, -1, 30, 22, false))
                .toThrow('Duration must be a non-negative number');
        });
    });

    describe('Calculated Properties', () => {
        test('getErrorCount should return correct error count', () => {
            const result = new TypingResult(20, 25, 22, 80, 60000, 30, 22, false);
            
            expect(result.getErrorCount()).toBe(2); // 22 typed - 20 correct = 2 errors
        });

        test('getErrorCount should return 0 for perfect typing', () => {
            const result = new TypingResult(25, 25, 25, 100, 60000, 30, 25, true);
            
            expect(result.getErrorCount()).toBe(0);
        });

        test('getErrorRate should return correct error rate', () => {
            const result = new TypingResult(20, 25, 22, 80, 60000, 30, 22, false);
            
            expect(result.getErrorRate()).toBe(9.09); // 2 errors / 22 typed * 100 = 9.09%
        });

        test('getErrorRate should return 0 for no typed characters', () => {
            const result = new TypingResult(0, 25, 0, 0, 60000, 0, 0, false);
            
            expect(result.getErrorRate()).toBe(0);
        });

        test('getGrade should return correct grades', () => {
            // A+ grade
            const aPlusResult = new TypingResult(25, 25, 25, 98, 60000, 60, 25, true);
            expect(aPlusResult.getGrade()).toBe('A+');
            
            // A grade
            const aResult = new TypingResult(25, 25, 25, 95, 60000, 50, 25, true);
            expect(aResult.getGrade()).toBe('A');
            
            // B+ grade
            const bPlusResult = new TypingResult(25, 25, 25, 90, 60000, 40, 25, true);
            expect(bPlusResult.getGrade()).toBe('B+');
            
            // F grade
            const fResult = new TypingResult(10, 25, 15, 40, 60000, 10, 15, false);
            expect(fResult.getGrade()).toBe('F');
        });
    });

    describe('Serialization', () => {
        test('toPlainObject should return correct plain object', () => {
            const result = new TypingResult(20, 25, 22, 80, 60000, 30, 22, false);
            const plainObject = result.toPlainObject();
            
            expect(plainObject).toEqual({
                correctCharacters: 20,
                totalCharacters: 25,
                typedCharacters: 22,
                accuracy: 80,
                durationMs: 60000,
                wpm: 30,
                cpm: 22,
                isComplete: false
            });
        });

        test('fromPlainObject should create result from plain object', () => {
            const data = {
                correctCharacters: 20,
                totalCharacters: 25,
                typedCharacters: 22,
                accuracy: 80,
                durationMs: 60000,
                wpm: 30,
                cpm: 22,
                isComplete: false
            };
            
            const result = TypingResult.fromPlainObject(data);
            
            expect(result.correctCharacters).toBe(20);
            expect(result.totalCharacters).toBe(25);
            expect(result.typedCharacters).toBe(22);
            expect(result.accuracy).toBe(80);
            expect(result.durationMs).toBe(60000);
            expect(result.wpm).toBe(30);
            expect(result.cpm).toBe(22);
            expect(result.isComplete).toBe(false);
        });

        test('fromPlainObject should throw error for invalid data', () => {
            expect(() => TypingResult.fromPlainObject(null)).toThrow('Data must be an object');
            expect(() => TypingResult.fromPlainObject('invalid')).toThrow('Data must be an object');
        });
    });

    describe('String Representation', () => {
        test('toString should return correct string representation', () => {
            const result = new TypingResult(20, 25, 22, 80, 60000, 30, 22, false);
            const expected = 'TypingResult(accuracy=80%, wpm=30, duration=60s)';
            
            expect(result.toString()).toBe(expected);
        });
    });
});