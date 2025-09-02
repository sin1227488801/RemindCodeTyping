/**
 * @jest-environment jsdom
 */

import { StudyBookService } from '../../../Rct/js/application/services/StudyBookService.js';

describe('StudyBookService', () => {
    let studyBookService;
    let mockApiService;
    let mockRepository;
    let mockEventBus;

    beforeEach(() => {
        mockApiService = {
            createStudyBook: jest.fn(),
            updateStudyBook: jest.fn(),
            deleteStudyBook: jest.fn(),
            getStudyBooks: jest.fn(),
            searchStudyBooks: jest.fn(),
            getRandomStudyBooks: jest.fn()
        };

        mockRepository = {
            save: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            delete: jest.fn(),
            clear: jest.fn()
        };

        mockEventBus = {
            emit: jest.fn(),
            on: jest.fn(),
            off: jest.fn()
        };

        studyBookService = new StudyBookService(mockApiService, mockRepository, mockEventBus);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        test('should initialize with required dependencies', () => {
            expect(studyBookService.apiService).toBe(mockApiService);
            expect(studyBookService.repository).toBe(mockRepository);
            expect(studyBookService.eventBus).toBe(mockEventBus);
        });

        test('should throw error if API service is not provided', () => {
            expect(() => {
                new StudyBookService(null, mockRepository, mockEventBus);
            }).toThrow('StudyBookApiService is required');
        });

        test('should throw error if repository is not provided', () => {
            expect(() => {
                new StudyBookService(mockApiService, null, mockEventBus);
            }).toThrow('StudyBookRepository is required');
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
                createdAt: new Date().toISOString()
            };

            mockApiService.createStudyBook.mockResolvedValue(createdStudyBook);

            const result = await studyBookService.createStudyBook(studyBookData);

            expect(mockApiService.createStudyBook).toHaveBeenCalledWith(studyBookData);
            expect(mockRepository.save).toHaveBeenCalledWith(createdStudyBook);
            expect(result).toBe(createdStudyBook);
        });

        test('should validate study book data before creation', async () => {
            const invalidData = {
                language: '',
                question: '',
                explanation: ''
            };

            await expect(studyBookService.createStudyBook(invalidData))
                .rejects.toThrow('Language and question are required');

            expect(mockApiService.createStudyBook).not.toHaveBeenCalled();
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

            mockApiService.createStudyBook.mockResolvedValue({ id: '123', ...sanitizedData });

            await studyBookService.createStudyBook(dataWithHtml);

            expect(mockApiService.createStudyBook).toHaveBeenCalledWith(
                expect.objectContaining({
                    question: expect.not.stringContaining('<script>')
                })
            );
        });

        test('should handle API errors during creation', async () => {
            const studyBookData = {
                language: 'javascript',
                question: 'console.log("test");'
            };

            const apiError = new Error('API Error');
            mockApiService.createStudyBook.mockRejectedValue(apiError);

            await expect(studyBookService.createStudyBook(studyBookData))
                .rejects.toThrow('API Error');

            expect(mockRepository.save).not.toHaveBeenCalled();
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
                updatedAt: new Date().toISOString()
            };

            mockApiService.updateStudyBook.mockResolvedValue(updatedStudyBook);

            const result = await studyBookService.updateStudyBook(studyBookId, updateData);

            expect(mockApiService.updateStudyBook).toHaveBeenCalledWith(studyBookId, updateData);
            expect(mockRepository.save).toHaveBeenCalledWith(updatedStudyBook);
            expect(result).toBe(updatedStudyBook);
        });

        test('should validate update data', async () => {
            const studyBookId = '123';
            const invalidData = {
                language: '',
                question: ''
            };

            await expect(studyBookService.updateStudyBook(studyBookId, invalidData))
                .rejects.toThrow('Language and question are required');

            expect(mockApiService.updateStudyBook).not.toHaveBeenCalled();
        });

        test('should handle study book not found', async () => {
            const studyBookId = 'nonexistent';
            const updateData = { question: 'updated question' };

            const notFoundError = new Error('Study book not found');
            notFoundError.status = 404;
            mockApiService.updateStudyBook.mockRejectedValue(notFoundError);

            await expect(studyBookService.updateStudyBook(studyBookId, updateData))
                .rejects.toThrow('Study book not found');
        });
    });

    describe('Delete Study Book', () => {
        test('should delete study book successfully', async () => {
            const studyBookId = '123';

            mockApiService.deleteStudyBook.mockResolvedValue();

            await studyBookService.deleteStudyBook(studyBookId);

            expect(mockApiService.deleteStudyBook).toHaveBeenCalledWith(studyBookId);
            expect(mockRepository.delete).toHaveBeenCalledWith(studyBookId);
        });

        test('should handle delete errors', async () => {
            const studyBookId = '123';

            const deleteError = new Error('Failed to delete');
            mockApiService.deleteStudyBook.mockRejectedValue(deleteError);

            await expect(studyBookService.deleteStudyBook(studyBookId))
                .rejects.toThrow('Failed to delete');

            expect(mockRepository.delete).not.toHaveBeenCalled();
        });
    });

    describe('Get Study Books', () => {
        test('should get study books with pagination', async () => {
            const options = { page: 0, size: 10, language: 'javascript' };
            const apiResponse = {
                content: [
                    { id: '1', language: 'javascript', question: 'console.log("test1");' },
                    { id: '2', language: 'javascript', question: 'console.log("test2");' }
                ],
                totalElements: 2,
                totalPages: 1,
                number: 0
            };

            mockApiService.getStudyBooks.mockResolvedValue(apiResponse);

            const result = await studyBookService.getStudyBooks(options);

            expect(mockApiService.getStudyBooks).toHaveBeenCalledWith(options);
            expect(result).toBe(apiResponse);

            // Should cache the results
            apiResponse.content.forEach(studyBook => {
                expect(mockRepository.save).toHaveBeenCalledWith(studyBook);
            });
        });

        test('should return cached data when offline', async () => {
            const options = { page: 0, size: 10 };
            const cachedData = [
                { id: '1', language: 'javascript', question: 'cached question' }
            ];

            const networkError = new Error('Network unavailable');
            networkError.name = 'NetworkError';
            mockApiService.getStudyBooks.mockRejectedValue(networkError);
            mockRepository.findAll.mockReturnValue(cachedData);

            const result = await studyBookService.getStudyBooks(options);

            expect(result.content).toBe(cachedData);
            expect(result.fromCache).toBe(true);
        });

        test('should handle empty results', async () => {
            const options = { page: 0, size: 10 };
            const emptyResponse = {
                content: [],
                totalElements: 0,
                totalPages: 0,
                number: 0
            };

            mockApiService.getStudyBooks.mockResolvedValue(emptyResponse);

            const result = await studyBookService.getStudyBooks(options);

            expect(result).toBe(emptyResponse);
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

            mockApiService.searchStudyBooks.mockResolvedValue(searchResults);

            const result = await studyBookService.searchStudyBooks(searchOptions);

            expect(mockApiService.searchStudyBooks).toHaveBeenCalledWith(searchOptions);
            expect(result).toBe(searchResults);
        });

        test('should perform local search when API is unavailable', async () => {
            const searchOptions = { query: 'console', page: 0, size: 10 };
            const cachedData = [
                { id: '1', language: 'javascript', question: 'console.log("test");' },
                { id: '2', language: 'python', question: 'print("test")' }
            ];

            const networkError = new Error('Network unavailable');
            mockApiService.searchStudyBooks.mockRejectedValue(networkError);
            mockRepository.findAll.mockReturnValue(cachedData);

            const result = await studyBookService.searchStudyBooks(searchOptions);

            expect(result.content).toHaveLength(1);
            expect(result.content[0].question).toContain('console');
            expect(result.fromCache).toBe(true);
        });

        test('should handle empty search results', async () => {
            const searchOptions = { query: 'nonexistent', page: 0, size: 10 };
            const emptyResults = {
                content: [],
                totalElements: 0,
                totalPages: 0,
                number: 0
            };

            mockApiService.searchStudyBooks.mockResolvedValue(emptyResults);

            const result = await studyBookService.searchStudyBooks(searchOptions);

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

            mockApiService.getRandomStudyBooks.mockResolvedValue(randomStudyBooks);

            const result = await studyBookService.getRandomStudyBooks(options);

            expect(mockApiService.getRandomStudyBooks).toHaveBeenCalledWith(options);
            expect(result).toBe(randomStudyBooks);
        });

        test('should fallback to cached data for random selection', async () => {
            const options = { language: 'javascript', count: 3 };
            const cachedData = [
                { id: '1', language: 'javascript', question: 'console.log("test1");' },
                { id: '2', language: 'javascript', question: 'console.log("test2");' },
                { id: '3', language: 'javascript', question: 'console.log("test3");' },
                { id: '4', language: 'javascript', question: 'console.log("test4");' }
            ];

            const networkError = new Error('Network unavailable');
            mockApiService.getRandomStudyBooks.mockRejectedValue(networkError);
            mockRepository.findAll.mockReturnValue(cachedData);

            const result = await studyBookService.getRandomStudyBooks(options);

            expect(result).toHaveLength(3);
            expect(result.every(sb => sb.language === 'javascript')).toBe(true);
        });
    });

    describe('Caching Strategy', () => {
        test('should cache study books after API calls', async () => {
            const studyBook = {
                id: '123',
                language: 'javascript',
                question: 'console.log("test");'
            };

            mockApiService.createStudyBook.mockResolvedValue(studyBook);

            await studyBookService.createStudyBook({
                language: 'javascript',
                question: 'console.log("test");'
            });

            expect(mockRepository.save).toHaveBeenCalledWith(studyBook);
        });

        test('should invalidate cache when study book is deleted', async () => {
            const studyBookId = '123';

            mockApiService.deleteStudyBook.mockResolvedValue();

            await studyBookService.deleteStudyBook(studyBookId);

            expect(mockRepository.delete).toHaveBeenCalledWith(studyBookId);
        });

        test('should clear all cache when requested', () => {
            studyBookService.clearCache();

            expect(mockRepository.clear).toHaveBeenCalled();
        });
    });

    describe('Data Validation', () => {
        test('should validate required fields', () => {
            const invalidData = {
                language: '',
                question: '',
                explanation: 'test'
            };

            expect(() => {
                studyBookService.validateStudyBookData(invalidData);
            }).toThrow('Language and question are required');
        });

        test('should validate language format', () => {
            const invalidData = {
                language: 'invalid-language-123',
                question: 'test question'
            };

            expect(() => {
                studyBookService.validateStudyBookData(invalidData);
            }).toThrow('Invalid language format');
        });

        test('should validate question length', () => {
            const invalidData = {
                language: 'javascript',
                question: 'a'.repeat(1001) // Too long
            };

            expect(() => {
                studyBookService.validateStudyBookData(invalidData);
            }).toThrow('Question is too long');
        });

        test('should pass validation for valid data', () => {
            const validData = {
                language: 'javascript',
                question: 'console.log("Hello World");',
                explanation: 'Basic console logging'
            };

            expect(() => {
                studyBookService.validateStudyBookData(validData);
            }).not.toThrow();
        });
    });

    describe('Error Handling', () => {
        test('should handle network errors gracefully', async () => {
            const studyBookData = {
                language: 'javascript',
                question: 'console.log("test");'
            };

            const networkError = new Error('Network error');
            networkError.name = 'NetworkError';
            mockApiService.createStudyBook.mockRejectedValue(networkError);

            await expect(studyBookService.createStudyBook(studyBookData))
                .rejects.toThrow('Network error');
        });

        test('should handle validation errors', async () => {
            const invalidData = {
                language: '',
                question: ''
            };

            await expect(studyBookService.createStudyBook(invalidData))
                .rejects.toThrow('Language and question are required');
        });

        test('should handle API errors with proper error messages', async () => {
            const studyBookData = {
                language: 'javascript',
                question: 'console.log("test");'
            };

            const apiError = new Error('Server error');
            apiError.status = 500;
            mockApiService.createStudyBook.mockRejectedValue(apiError);

            await expect(studyBookService.createStudyBook(studyBookData))
                .rejects.toThrow('Server error');
        });
    });

    describe('Offline Support', () => {
        test('should work offline with cached data', async () => {
            const cachedData = [
                { id: '1', language: 'javascript', question: 'cached question 1' },
                { id: '2', language: 'python', question: 'cached question 2' }
            ];

            mockRepository.findAll.mockReturnValue(cachedData);

            // Simulate offline
            const networkError = new Error('Network unavailable');
            mockApiService.getStudyBooks.mockRejectedValue(networkError);

            const result = await studyBookService.getStudyBooks({ page: 0, size: 10 });

            expect(result.content).toBe(cachedData);
            expect(result.fromCache).toBe(true);
        });

        test('should sync data when coming back online', async () => {
            const pendingChanges = [
                { action: 'create', data: { language: 'javascript', question: 'new question' } },
                { action: 'update', id: '123', data: { question: 'updated question' } }
            ];

            studyBookService.pendingChanges = pendingChanges;

            mockApiService.createStudyBook.mockResolvedValue({ id: '456', language: 'javascript', question: 'new question' });
            mockApiService.updateStudyBook.mockResolvedValue({ id: '123', question: 'updated question' });

            await studyBookService.syncPendingChanges();

            expect(mockApiService.createStudyBook).toHaveBeenCalledWith(pendingChanges[0].data);
            expect(mockApiService.updateStudyBook).toHaveBeenCalledWith('123', pendingChanges[1].data);
            expect(studyBookService.pendingChanges).toHaveLength(0);
        });
    });
});