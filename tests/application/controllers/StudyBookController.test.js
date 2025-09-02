/**
 * @jest-environment jsdom
 */

import { StudyBookController } from '../../../Rct/js/application/controllers/StudyBookController.js';

describe('StudyBookController', () => {
    let studyBookController;
    let mockStudyBookService;
    let mockStudyBookRepository;
    let mockEventBus;

    beforeEach(() => {
        mockStudyBookService = {
            createStudyBook: jest.fn(),
            updateStudyBook: jest.fn(),
            deleteStudyBook: jest.fn(),
            getStudyBooks: jest.fn(),
            searchStudyBooks: jest.fn(),
            getRandomStudyBooks: jest.fn()
        };

        mockStudyBookRepository = {
            save: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            delete: jest.fn()
        };

        mockEventBus = {
            emit: jest.fn(),
            on: jest.fn(),
            off: jest.fn()
        };

        studyBookController = new StudyBookController(mockStudyBookService, mockStudyBookRepository, mockEventBus);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        test('should initialize with required dependencies', () => {
            expect(studyBookController.studyBookService).toBe(mockStudyBookService);
            expect(studyBookController.studyBookRepository).toBe(mockStudyBookRepository);
            expect(studyBookController.eventBus).toBe(mockEventBus);
        });

        test('should throw error if study book service is not provided', () => {
            expect(() => {
                new StudyBookController(null, mockStudyBookRepository, mockEventBus);
            }).toThrow('StudyBookService is required');
        });

        test('should throw error if event bus is not provided', () => {
            expect(() => {
                new StudyBookController(mockStudyBookService, mockStudyBookRepository, null);
            }).toThrow('EventBus is required');
        });
    });

    describe('Create Study Book', () => {
        test('should create study book successfully', async () => {
            const studyBookData = {
                language: 'javascript',
                question: 'console.log("Hello World");',
                explanation: 'Basic console logging'
            };

            const createdStudyBook = {
                id: '123',
                ...studyBookData,
                createdAt: new Date()
            };

            mockStudyBookService.createStudyBook.mockResolvedValue(createdStudyBook);

            const result = await studyBookController.createStudyBook(studyBookData);

            expect(mockStudyBookService.createStudyBook).toHaveBeenCalledWith(studyBookData);
            expect(result.success).toBe(true);
            expect(result.studyBook).toBe(createdStudyBook);
            expect(mockEventBus.emit).toHaveBeenCalledWith('studybook:created', createdStudyBook);
        });

        test('should handle validation errors during creation', async () => {
            const studyBookData = {
                language: '',
                question: '',
                explanation: ''
            };

            const validationError = new Error('Language and question are required');
            validationError.name = 'ValidationError';
            mockStudyBookService.createStudyBook.mockRejectedValue(validationError);

            const result = await studyBookController.createStudyBook(studyBookData);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Language and question are required');
            expect(mockEventBus.emit).toHaveBeenCalledWith('studybook:error', validationError);
        });

        test('should handle network errors during creation', async () => {
            const studyBookData = {
                language: 'javascript',
                question: 'console.log("test");'
            };

            const networkError = new Error('Network error');
            networkError.name = 'NetworkError';
            mockStudyBookService.createStudyBook.mockRejectedValue(networkError);

            const result = await studyBookController.createStudyBook(studyBookData);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Failed to create study book. Please try again.');
            expect(mockEventBus.emit).toHaveBeenCalledWith('studybook:error', networkError);
        });
    });

    describe('Update Study Book', () => {
        test('should update study book successfully', async () => {
            const studyBookId = '123';
            const updateData = {
                language: 'python',
                question: 'print("Hello World")',
                explanation: 'Basic printing in Python'
            };

            const updatedStudyBook = {
                id: studyBookId,
                ...updateData,
                updatedAt: new Date()
            };

            mockStudyBookService.updateStudyBook.mockResolvedValue(updatedStudyBook);

            const result = await studyBookController.updateStudyBook(studyBookId, updateData);

            expect(mockStudyBookService.updateStudyBook).toHaveBeenCalledWith(studyBookId, updateData);
            expect(result.success).toBe(true);
            expect(result.studyBook).toBe(updatedStudyBook);
            expect(mockEventBus.emit).toHaveBeenCalledWith('studybook:updated', updatedStudyBook);
        });

        test('should handle study book not found error', async () => {
            const studyBookId = 'nonexistent';
            const updateData = { question: 'updated question' };

            const notFoundError = new Error('Study book not found');
            notFoundError.name = 'NotFoundError';
            mockStudyBookService.updateStudyBook.mockRejectedValue(notFoundError);

            const result = await studyBookController.updateStudyBook(studyBookId, updateData);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Study book not found');
        });
    });

    describe('Delete Study Book', () => {
        test('should delete study book successfully', async () => {
            const studyBookId = '123';

            mockStudyBookService.deleteStudyBook.mockResolvedValue();

            const result = await studyBookController.deleteStudyBook(studyBookId);

            expect(mockStudyBookService.deleteStudyBook).toHaveBeenCalledWith(studyBookId);
            expect(result.success).toBe(true);
            expect(mockEventBus.emit).toHaveBeenCalledWith('studybook:deleted', studyBookId);
        });

        test('should handle delete errors', async () => {
            const studyBookId = '123';

            const deleteError = new Error('Failed to delete study book');
            mockStudyBookService.deleteStudyBook.mockRejectedValue(deleteError);

            const result = await studyBookController.deleteStudyBook(studyBookId);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Failed to delete study book. Please try again.');
        });
    });

    describe('Get Study Books', () => {
        test('should get study books with pagination', async () => {
            const options = { page: 0, size: 10, language: 'javascript' };
            const mockResponse = {
                content: [
                    { id: '1', language: 'javascript', question: 'console.log("test1");' },
                    { id: '2', language: 'javascript', question: 'console.log("test2");' }
                ],
                totalElements: 2,
                totalPages: 1,
                number: 0
            };

            mockStudyBookService.getStudyBooks.mockResolvedValue(mockResponse);

            const result = await studyBookController.getStudyBooks(options);

            expect(mockStudyBookService.getStudyBooks).toHaveBeenCalledWith(options);
            expect(result).toBe(mockResponse);
        });

        test('should handle empty results', async () => {
            const options = { page: 0, size: 10 };
            const emptyResponse = {
                content: [],
                totalElements: 0,
                totalPages: 0,
                number: 0
            };

            mockStudyBookService.getStudyBooks.mockResolvedValue(emptyResponse);

            const result = await studyBookController.getStudyBooks(options);

            expect(result).toBe(emptyResponse);
            expect(result.content).toHaveLength(0);
        });

        test('should handle API errors when getting study books', async () => {
            const options = { page: 0, size: 10 };
            const apiError = new Error('API Error');

            mockStudyBookService.getStudyBooks.mockRejectedValue(apiError);

            await expect(studyBookController.getStudyBooks(options)).rejects.toThrow('API Error');
            expect(mockEventBus.emit).toHaveBeenCalledWith('studybook:error', apiError);
        });
    });

    describe('Search Study Books', () => {
        test('should search study books by query', async () => {
            const searchOptions = { query: 'console', page: 0, size: 10 };
            const searchResults = {
                content: [
                    { id: '1', language: 'javascript', question: 'console.log("test");' }
                ],
                totalElements: 1,
                totalPages: 1,
                number: 0
            };

            mockStudyBookService.searchStudyBooks.mockResolvedValue(searchResults);

            const result = await studyBookController.searchStudyBooks(searchOptions);

            expect(mockStudyBookService.searchStudyBooks).toHaveBeenCalledWith(searchOptions);
            expect(result).toBe(searchResults);
        });

        test('should handle empty search results', async () => {
            const searchOptions = { query: 'nonexistent', page: 0, size: 10 };
            const emptyResults = {
                content: [],
                totalElements: 0,
                totalPages: 0,
                number: 0
            };

            mockStudyBookService.searchStudyBooks.mockResolvedValue(emptyResults);

            const result = await studyBookController.searchStudyBooks(searchOptions);

            expect(result).toBe(emptyResults);
        });
    });

    describe('Get Random Study Books', () => {
        test('should get random study books for practice', async () => {
            const options = { language: 'javascript', count: 5 };
            const randomStudyBooks = [
                { id: '1', language: 'javascript', question: 'console.log("test1");' },
                { id: '2', language: 'javascript', question: 'console.log("test2");' },
                { id: '3', language: 'javascript', question: 'console.log("test3");' }
            ];

            mockStudyBookService.getRandomStudyBooks.mockResolvedValue(randomStudyBooks);

            const result = await studyBookController.getRandomStudyBooks(options);

            expect(mockStudyBookService.getRandomStudyBooks).toHaveBeenCalledWith(options);
            expect(result).toBe(randomStudyBooks);
        });

        test('should handle insufficient study books for random selection', async () => {
            const options = { language: 'python', count: 10 };
            const limitedStudyBooks = [
                { id: '1', language: 'python', question: 'print("test1")' }
            ];

            mockStudyBookService.getRandomStudyBooks.mockResolvedValue(limitedStudyBooks);

            const result = await studyBookController.getRandomStudyBooks(options);

            expect(result).toBe(limitedStudyBooks);
            expect(result).toHaveLength(1);
        });
    });

    describe('Input Validation', () => {
        test('should validate study book data before creation', async () => {
            const invalidData = {
                language: '',
                question: '',
                explanation: ''
            };

            const result = await studyBookController.createStudyBook(invalidData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('required');
        });

        test('should sanitize input data', async () => {
            const dataWithHtml = {
                language: 'javascript',
                question: '<script>alert("xss")</script>console.log("test");',
                explanation: '<b>Bold</b> explanation'
            };

            const sanitizedData = {
                language: 'javascript',
                question: 'console.log("test");',
                explanation: 'Bold explanation'
            };

            mockStudyBookService.createStudyBook.mockResolvedValue({ id: '123', ...sanitizedData });

            await studyBookController.createStudyBook(dataWithHtml);

            expect(mockStudyBookService.createStudyBook).toHaveBeenCalledWith(
                expect.objectContaining({
                    question: expect.not.stringContaining('<script>')
                })
            );
        });
    });

    describe('Error Handling', () => {
        test('should categorize different types of errors', async () => {
            const studyBookData = { language: 'javascript', question: 'test' };

            // Test validation error
            const validationError = new Error('Validation failed');
            validationError.name = 'ValidationError';
            mockStudyBookService.createStudyBook.mockRejectedValueOnce(validationError);

            let result = await studyBookController.createStudyBook(studyBookData);
            expect(result.error).toBe('Validation failed');

            // Test network error
            const networkError = new Error('Network failed');
            networkError.name = 'NetworkError';
            mockStudyBookService.createStudyBook.mockRejectedValueOnce(networkError);

            result = await studyBookController.createStudyBook(studyBookData);
            expect(result.error).toBe('Failed to create study book. Please try again.');

            // Test generic error
            const genericError = new Error('Unknown error');
            mockStudyBookService.createStudyBook.mockRejectedValueOnce(genericError);

            result = await studyBookController.createStudyBook(studyBookData);
            expect(result.error).toBe('An unexpected error occurred. Please try again.');
        });

        test('should emit error events for all error types', async () => {
            const studyBookData = { language: 'javascript', question: 'test' };
            const error = new Error('Test error');

            mockStudyBookService.createStudyBook.mockRejectedValue(error);

            await studyBookController.createStudyBook(studyBookData);

            expect(mockEventBus.emit).toHaveBeenCalledWith('studybook:error', error);
        });
    });
});