/**
 * Unit tests for StudyBook domain model
 */

// Import the StudyBook class
const StudyBook = require('../../../Rct/js/domain/models/StudyBook.js');

describe('StudyBook Domain Model', () => {
    describe('Constructor', () => {
        test('should create a valid study book with required parameters', () => {
            const studyBook = new StudyBook('sb123', 'JavaScript', 'console.log("Hello");', 'Prints Hello to console');
            
            expect(studyBook.id).toBe('sb123');
            expect(studyBook.language).toBe('JavaScript');
            expect(studyBook.question).toBe('console.log("Hello");');
            expect(studyBook.explanation).toBe('Prints Hello to console');
            expect(studyBook.userId).toBeNull();
            expect(studyBook.isSystemProblem).toBe(false);
            expect(studyBook.createdAt).toBeInstanceOf(Date);
            expect(studyBook.updatedAt).toBeInstanceOf(Date);
        });

        test('should create a study book with all parameters', () => {
            const studyBook = new StudyBook('sb123', 'Python', 'print("Hello")', 'Python print statement', 'user123', true);
            
            expect(studyBook.userId).toBe('user123');
            expect(studyBook.isSystemProblem).toBe(true);
        });

        test('should create a study book with null id for new instances', () => {
            const studyBook = new StudyBook(null, 'Java', 'System.out.println("Hello");', 'Java print statement');
            
            expect(studyBook.id).toBeNull();
        });

        test('should trim whitespace from language, question, and explanation', () => {
            const studyBook = new StudyBook('sb123', '  JavaScript  ', '  console.log("Hello");  ', '  Explanation  ');
            
            expect(studyBook.language).toBe('JavaScript');
            expect(studyBook.question).toBe('console.log("Hello");');
            expect(studyBook.explanation).toBe('Explanation');
        });

        test('should handle empty explanation', () => {
            const studyBook = new StudyBook('sb123', 'JavaScript', 'console.log("Hello");', '');
            
            expect(studyBook.explanation).toBe('');
        });

        test('should handle null explanation', () => {
            const studyBook = new StudyBook('sb123', 'JavaScript', 'console.log("Hello");', null);
            
            expect(studyBook.explanation).toBe('');
        });

        test('should throw error for invalid language', () => {
            expect(() => new StudyBook('sb123', '', 'question', 'explanation'))
                .toThrow('Language must be a non-empty string');
            expect(() => new StudyBook('sb123', null, 'question', 'explanation'))
                .toThrow('Language must be a non-empty string');
            expect(() => new StudyBook('sb123', '   ', 'question', 'explanation'))
                .toThrow('Language must be a non-empty string');
        });

        test('should throw error for invalid question', () => {
            expect(() => new StudyBook('sb123', 'JavaScript', '', 'explanation'))
                .toThrow('Question must be a non-empty string');
            expect(() => new StudyBook('sb123', 'JavaScript', null, 'explanation'))
                .toThrow('Question must be a non-empty string');
            expect(() => new StudyBook('sb123', 'JavaScript', '   ', 'explanation'))
                .toThrow('Question must be a non-empty string');
        });
    });

    describe('Validation', () => {
        test('validate should pass for valid study book', () => {
            const studyBook = new StudyBook('sb123', 'JavaScript', 'console.log("Hello");', 'Explanation');
            
            expect(() => studyBook.validate()).not.toThrow();
        });

        test('validate should throw error for empty language', () => {
            const studyBook = new StudyBook('sb123', 'JavaScript', 'console.log("Hello");', 'Explanation');
            studyBook._language = '';
            
            expect(() => studyBook.validate()).toThrow('Language is required');
        });

        test('validate should throw error for empty question', () => {
            const studyBook = new StudyBook('sb123', 'JavaScript', 'console.log("Hello");', 'Explanation');
            studyBook._question = '';
            
            expect(() => studyBook.validate()).toThrow('Question is required');
        });

        test('validate should throw error for language too long', () => {
            const longLanguage = 'a'.repeat(51);
            const studyBook = new StudyBook('sb123', 'JavaScript', 'console.log("Hello");', 'Explanation');
            studyBook._language = longLanguage;
            
            expect(() => studyBook.validate()).toThrow('Language must be 50 characters or less');
        });

        test('validate should throw error for question too long', () => {
            const longQuestion = 'a'.repeat(10001);
            const studyBook = new StudyBook('sb123', 'JavaScript', 'console.log("Hello");', 'Explanation');
            studyBook._question = longQuestion;
            
            expect(() => studyBook.validate()).toThrow('Question must be 10000 characters or less');
        });

        test('validate should throw error for explanation too long', () => {
            const longExplanation = 'a'.repeat(10001);
            const studyBook = new StudyBook('sb123', 'JavaScript', 'console.log("Hello");', 'Explanation');
            studyBook._explanation = longExplanation;
            
            expect(() => studyBook.validate()).toThrow('Explanation must be 10000 characters or less');
        });

        test('validate should throw error for invalid language characters', () => {
            const studyBook = new StudyBook('sb123', 'JavaScript', 'console.log("Hello");', 'Explanation');
            studyBook._language = 'JavaScript@#$';
            
            expect(() => studyBook.validate()).toThrow('Language contains invalid characters');
        });

        test('validate should allow valid language characters', () => {
            const validLanguages = ['JavaScript', 'C++', 'C#', 'Python3', 'Node.js', 'Vue.js'];
            
            validLanguages.forEach(language => {
                const studyBook = new StudyBook('sb123', language, 'console.log("Hello");', 'Explanation');
                expect(() => studyBook.validate()).not.toThrow();
            });
        });
    });

    describe('Business Methods', () => {
        test('belongsToUser should return true for matching user', () => {
            const studyBook = new StudyBook('sb123', 'JavaScript', 'question', 'explanation', 'user123');
            
            expect(studyBook.belongsToUser('user123')).toBe(true);
        });

        test('belongsToUser should return false for different user', () => {
            const studyBook = new StudyBook('sb123', 'JavaScript', 'question', 'explanation', 'user123');
            
            expect(studyBook.belongsToUser('user456')).toBe(false);
        });

        test('belongsToUser should return false for null userId', () => {
            const studyBook = new StudyBook('sb123', 'JavaScript', 'question', 'explanation', null);
            
            expect(studyBook.belongsToUser('user123')).toBe(false);
        });

        test('isUserProblem should return true for user-created problems', () => {
            const studyBook = new StudyBook('sb123', 'JavaScript', 'question', 'explanation', 'user123', false);
            
            expect(studyBook.isUserProblem()).toBe(true);
        });

        test('isUserProblem should return false for system problems', () => {
            const studyBook = new StudyBook('sb123', 'JavaScript', 'question', 'explanation', null, true);
            
            expect(studyBook.isUserProblem()).toBe(false);
        });

        test('update should update content and updatedAt', () => {
            const studyBook = new StudyBook('sb123', 'JavaScript', 'old question', 'old explanation');
            const originalUpdatedAt = studyBook.updatedAt;
            
            // Wait a bit to ensure different timestamp
            setTimeout(() => {
                studyBook.update('Python', 'new question', 'new explanation');
                
                expect(studyBook.language).toBe('Python');
                expect(studyBook.question).toBe('new question');
                expect(studyBook.explanation).toBe('new explanation');
                expect(studyBook.updatedAt).not.toEqual(originalUpdatedAt);
            }, 1);
        });

        test('update should validate after updating', () => {
            const studyBook = new StudyBook('sb123', 'JavaScript', 'question', 'explanation');
            
            expect(() => studyBook.update('', 'new question', 'new explanation'))
                .toThrow('Language must be a non-empty string');
        });

        test('getDifficultyLevel should return correct difficulty', () => {
            // Simple short question
            const simple = new StudyBook('sb1', 'JavaScript', 'x = 1', '');
            expect(simple.getDifficultyLevel()).toBe(1);
            
            // Medium length question
            const medium = new StudyBook('sb2', 'JavaScript', 'a'.repeat(150), '');
            expect(medium.getDifficultyLevel()).toBe(2);
            
            // Long question with complex syntax
            const complex = new StudyBook('sb3', 'JavaScript', 'function test() { return [1, 2, 3]; }'.repeat(10), '');
            expect(complex.getDifficultyLevel()).toBe(5);
            
            // Multi-line question
            const multiLine = new StudyBook('sb4', 'JavaScript', 'line1\nline2\nline3', '');
            expect(multiLine.getDifficultyLevel()).toBe(2);
        });

        test('getEstimatedTypingTime should return reasonable estimate', () => {
            const studyBook = new StudyBook('sb123', 'JavaScript', 'a'.repeat(200), ''); // 200 characters
            const estimatedTime = studyBook.getEstimatedTypingTime(40); // 40 WPM
            
            // 200 chars / 5 chars per word = 40 words
            // 40 words / 40 WPM = 1 minute = 60 seconds
            expect(estimatedTime).toBe(60);
        });
    });

    describe('Serialization', () => {
        test('toPlainObject should return correct plain object', () => {
            const studyBook = new StudyBook('sb123', 'JavaScript', 'question', 'explanation', 'user123', true);
            const plainObject = studyBook.toPlainObject();
            
            expect(plainObject).toEqual({
                id: 'sb123',
                language: 'JavaScript',
                question: 'question',
                explanation: 'explanation',
                userId: 'user123',
                isSystemProblem: true,
                createdAt: studyBook.createdAt.toISOString(),
                updatedAt: studyBook.updatedAt.toISOString()
            });
        });

        test('fromPlainObject should create study book from plain object', () => {
            const data = {
                id: 'sb123',
                language: 'JavaScript',
                question: 'question',
                explanation: 'explanation',
                userId: 'user123',
                isSystemProblem: true,
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T01:00:00.000Z'
            };
            
            const studyBook = StudyBook.fromPlainObject(data);
            
            expect(studyBook.id).toBe('sb123');
            expect(studyBook.language).toBe('JavaScript');
            expect(studyBook.question).toBe('question');
            expect(studyBook.explanation).toBe('explanation');
            expect(studyBook.userId).toBe('user123');
            expect(studyBook.isSystemProblem).toBe(true);
            expect(studyBook.createdAt).toEqual(new Date('2024-01-01T00:00:00.000Z'));
            expect(studyBook.updatedAt).toEqual(new Date('2024-01-01T01:00:00.000Z'));
        });

        test('fromPlainObject should throw error for invalid data', () => {
            expect(() => StudyBook.fromPlainObject(null)).toThrow('Data must be an object');
            expect(() => StudyBook.fromPlainObject('invalid')).toThrow('Data must be an object');
        });
    });

    describe('Static Methods', () => {
        test('validate should return true for valid study book data', () => {
            const data = {
                language: 'JavaScript',
                question: 'console.log("Hello");',
                explanation: 'Prints Hello',
                isSystemProblem: false
            };
            
            expect(StudyBook.validate(data)).toBe(true);
        });

        test('validate should throw error for invalid study book data', () => {
            expect(() => StudyBook.validate(null)).toThrow('Study book data must be an object');
            expect(() => StudyBook.validate({ question: 'test' })).toThrow('Language must be a non-empty string');
            expect(() => StudyBook.validate({ language: 'JavaScript' })).toThrow('Question must be a non-empty string');
            expect(() => StudyBook.validate({ language: 'JavaScript', question: 'test', explanation: 123 }))
                .toThrow('Explanation must be a string or null');
            expect(() => StudyBook.validate({ language: 'JavaScript', question: 'test', isSystemProblem: 'invalid' }))
                .toThrow('isSystemProblem must be a boolean');
        });
    });

    describe('Comparison Methods', () => {
        test('clone should create a copy with null id', () => {
            const original = new StudyBook('sb123', 'JavaScript', 'question', 'explanation', 'user123', true);
            const cloned = original.clone();
            
            expect(cloned.id).toBeNull();
            expect(cloned.language).toBe(original.language);
            expect(cloned.question).toBe(original.question);
            expect(cloned.explanation).toBe(original.explanation);
            expect(cloned.userId).toBe(original.userId);
            expect(cloned.isSystemProblem).toBe(original.isSystemProblem);
        });

        test('hasSameContent should return true for same content', () => {
            const studyBook1 = new StudyBook('sb123', 'JavaScript', 'question', 'explanation');
            const studyBook2 = new StudyBook('sb456', 'JavaScript', 'question', 'explanation');
            
            expect(studyBook1.hasSameContent(studyBook2)).toBe(true);
        });

        test('hasSameContent should return false for different content', () => {
            const studyBook1 = new StudyBook('sb123', 'JavaScript', 'question1', 'explanation');
            const studyBook2 = new StudyBook('sb456', 'JavaScript', 'question2', 'explanation');
            
            expect(studyBook1.hasSameContent(studyBook2)).toBe(false);
        });

        test('equals should return true for same id and content', () => {
            const studyBook1 = new StudyBook('sb123', 'JavaScript', 'question', 'explanation');
            const studyBook2 = new StudyBook('sb123', 'JavaScript', 'question', 'explanation');
            
            expect(studyBook1.equals(studyBook2)).toBe(true);
        });

        test('equals should return false for different id or content', () => {
            const studyBook1 = new StudyBook('sb123', 'JavaScript', 'question', 'explanation');
            const studyBook2 = new StudyBook('sb456', 'JavaScript', 'question', 'explanation');
            const studyBook3 = new StudyBook('sb123', 'JavaScript', 'different', 'explanation');
            
            expect(studyBook1.equals(studyBook2)).toBe(false);
            expect(studyBook1.equals(studyBook3)).toBe(false);
        });

        test('equals should return false for non-StudyBook objects', () => {
            const studyBook = new StudyBook('sb123', 'JavaScript', 'question', 'explanation');
            
            expect(studyBook.equals(null)).toBe(false);
            expect(studyBook.equals({})).toBe(false);
            expect(studyBook.equals('studybook')).toBe(false);
        });
    });

    describe('String Representation', () => {
        test('toString should return correct string representation', () => {
            const studyBook = new StudyBook('sb123', 'JavaScript', 'console.log("Hello");', 'explanation');
            const expected = 'StudyBook(id=sb123, language=JavaScript, questionLength=20)';
            
            expect(studyBook.toString()).toBe(expected);
        });
    });
});