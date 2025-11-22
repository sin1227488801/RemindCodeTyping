/**
 * @jest-environment jsdom
 */

import { StudyBookList } from '../../../../Rct/js/presentation/components/studybook/StudyBookList.js';

describe('StudyBookList', () => {
    let studyBookList;
    let mockContainer;
    let mockStudyBookController;
    let mockEventBus;

    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = `
            <div id="studybook-list-container">
                <div class="list-controls">
                    <input type="text" id="search-input" placeholder="Search study books...">
                    <select id="language-filter">
                        <option value="">All Languages</option>
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                    </select>
                    <button id="refresh-button">Refresh</button>
                </div>
                <div id="studybook-list"></div>
                <div class="pagination">
                    <button id="prev-page">Previous</button>
                    <span id="page-info"></span>
                    <button id="next-page">Next</button>
                </div>
            </div>
        `;

        mockContainer = document.getElementById('studybook-list-container');
        
        mockStudyBookController = {
            getStudyBooks: jest.fn(),
            deleteStudyBook: jest.fn(),
            searchStudyBooks: jest.fn()
        };

        mockEventBus = {
            emit: jest.fn(),
            on: jest.fn(),
            off: jest.fn()
        };

        studyBookList = new StudyBookList(mockContainer, mockStudyBookController, mockEventBus);
    });

    afterEach(() => {
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        test('should initialize with container and dependencies', () => {
            expect(studyBookList.container).toBe(mockContainer);
            expect(studyBookList.studyBookController).toBe(mockStudyBookController);
            expect(studyBookList.eventBus).toBe(mockEventBus);
        });

        test('should throw error if container is not provided', () => {
            expect(() => {
                new StudyBookList(null, mockStudyBookController, mockEventBus);
            }).toThrow('Container element is required');
        });

        test('should load study books on initialization', async () => {
            const mockStudyBooks = [
                { id: '1', language: 'javascript', question: 'console.log("test");', explanation: 'Basic logging' },
                { id: '2', language: 'python', question: 'print("test")', explanation: 'Basic printing' }
            ];

            mockStudyBookController.getStudyBooks.mockResolvedValue({
                content: mockStudyBooks,
                totalElements: 2,
                totalPages: 1,
                number: 0
            });

            await studyBookList.initialize();

            expect(mockStudyBookController.getStudyBooks).toHaveBeenCalledWith({ page: 0, size: 10 });
        });
    });

    describe('Study Book Display', () => {
        test('should render study books in the list', async () => {
            const mockStudyBooks = [
                { id: '1', language: 'javascript', question: 'console.log("test");', explanation: 'Basic logging' },
                { id: '2', language: 'python', question: 'print("test")', explanation: 'Basic printing' }
            ];

            mockStudyBookController.getStudyBooks.mockResolvedValue({
                content: mockStudyBooks,
                totalElements: 2,
                totalPages: 1,
                number: 0
            });

            await studyBookList.initialize();
            await studyBookList.loadStudyBooks();

            const listContainer = document.getElementById('studybook-list');
            const studyBookItems = listContainer.querySelectorAll('.studybook-item');

            expect(studyBookItems).toHaveLength(2);
            expect(studyBookItems[0].textContent).toContain('console.log("test");');
            expect(studyBookItems[1].textContent).toContain('print("test")');
        });

        test('should show empty state when no study books exist', async () => {
            mockStudyBookController.getStudyBooks.mockResolvedValue({
                content: [],
                totalElements: 0,
                totalPages: 0,
                number: 0
            });

            await studyBookList.initialize();
            await studyBookList.loadStudyBooks();

            const listContainer = document.getElementById('studybook-list');
            expect(listContainer.textContent).toContain('No study books found');
        });

        test('should display study book actions (edit, delete)', async () => {
            const mockStudyBooks = [
                { id: '1', language: 'javascript', question: 'console.log("test");', explanation: 'Basic logging' }
            ];

            mockStudyBookController.getStudyBooks.mockResolvedValue({
                content: mockStudyBooks,
                totalElements: 1,
                totalPages: 1,
                number: 0
            });

            await studyBookList.initialize();
            await studyBookList.loadStudyBooks();

            const studyBookItem = document.querySelector('.studybook-item');
            const editButton = studyBookItem.querySelector('.edit-button');
            const deleteButton = studyBookItem.querySelector('.delete-button');

            expect(editButton).toBeTruthy();
            expect(deleteButton).toBeTruthy();
        });
    });

    describe('Search and Filtering', () => {
        test('should filter study books by search term', async () => {
            mockStudyBookController.searchStudyBooks.mockResolvedValue({
                content: [
                    { id: '1', language: 'javascript', question: 'console.log("test");', explanation: 'Basic logging' }
                ],
                totalElements: 1,
                totalPages: 1,
                number: 0
            });

            await studyBookList.initialize();

            const searchInput = document.getElementById('search-input');
            searchInput.value = 'console';
            
            const searchEvent = new Event('input');
            searchInput.dispatchEvent(searchEvent);

            // Wait for debounced search
            await new Promise(resolve => setTimeout(resolve, 300));

            expect(mockStudyBookController.searchStudyBooks).toHaveBeenCalledWith({
                query: 'console',
                page: 0,
                size: 10
            });
        });

        test('should filter study books by language', async () => {
            await studyBookList.initialize();

            const languageFilter = document.getElementById('language-filter');
            languageFilter.value = 'javascript';
            
            const changeEvent = new Event('change');
            languageFilter.dispatchEvent(changeEvent);

            expect(mockStudyBookController.getStudyBooks).toHaveBeenCalledWith({
                language: 'javascript',
                page: 0,
                size: 10
            });
        });

        test('should clear filters when refresh button is clicked', async () => {
            await studyBookList.initialize();

            // Set some filters
            document.getElementById('search-input').value = 'test';
            document.getElementById('language-filter').value = 'javascript';

            const refreshButton = document.getElementById('refresh-button');
            refreshButton.click();

            expect(document.getElementById('search-input').value).toBe('');
            expect(document.getElementById('language-filter').value).toBe('');
            expect(mockStudyBookController.getStudyBooks).toHaveBeenCalledWith({ page: 0, size: 10 });
        });
    });

    describe('Pagination', () => {
        test('should handle pagination navigation', async () => {
            mockStudyBookController.getStudyBooks.mockResolvedValue({
                content: [],
                totalElements: 25,
                totalPages: 3,
                number: 0
            });

            await studyBookList.initialize();

            const nextButton = document.getElementById('next-page');
            nextButton.click();

            expect(mockStudyBookController.getStudyBooks).toHaveBeenCalledWith({ page: 1, size: 10 });
        });

        test('should disable previous button on first page', async () => {
            mockStudyBookController.getStudyBooks.mockResolvedValue({
                content: [],
                totalElements: 25,
                totalPages: 3,
                number: 0
            });

            await studyBookList.initialize();

            const prevButton = document.getElementById('prev-page');
            expect(prevButton.disabled).toBe(true);
        });

        test('should disable next button on last page', async () => {
            mockStudyBookController.getStudyBooks.mockResolvedValue({
                content: [],
                totalElements: 25,
                totalPages: 3,
                number: 2
            });

            await studyBookList.initialize();

            const nextButton = document.getElementById('next-page');
            expect(nextButton.disabled).toBe(true);
        });

        test('should display correct page information', async () => {
            mockStudyBookController.getStudyBooks.mockResolvedValue({
                content: [],
                totalElements: 25,
                totalPages: 3,
                number: 1
            });

            await studyBookList.initialize();

            const pageInfo = document.getElementById('page-info');
            expect(pageInfo.textContent).toContain('Page 2 of 3');
        });
    });

    describe('Study Book Actions', () => {
        test('should emit edit event when edit button is clicked', async () => {
            const mockStudyBooks = [
                { id: '1', language: 'javascript', question: 'console.log("test");', explanation: 'Basic logging' }
            ];

            mockStudyBookController.getStudyBooks.mockResolvedValue({
                content: mockStudyBooks,
                totalElements: 1,
                totalPages: 1,
                number: 0
            });

            await studyBookList.initialize();
            await studyBookList.loadStudyBooks();

            const editButton = document.querySelector('.edit-button');
            editButton.click();

            expect(mockEventBus.emit).toHaveBeenCalledWith('studybook:edit', mockStudyBooks[0]);
        });

        test('should show confirmation dialog before deleting', async () => {
            const mockStudyBooks = [
                { id: '1', language: 'javascript', question: 'console.log("test");', explanation: 'Basic logging' }
            ];

            mockStudyBookController.getStudyBooks.mockResolvedValue({
                content: mockStudyBooks,
                totalElements: 1,
                totalPages: 1,
                number: 0
            });

            // Mock confirm dialog
            window.confirm = jest.fn().mockReturnValue(true);

            await studyBookList.initialize();
            await studyBookList.loadStudyBooks();

            const deleteButton = document.querySelector('.delete-button');
            deleteButton.click();

            expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this study book?');
        });

        test('should delete study book when confirmed', async () => {
            const mockStudyBooks = [
                { id: '1', language: 'javascript', question: 'console.log("test");', explanation: 'Basic logging' }
            ];

            mockStudyBookController.getStudyBooks.mockResolvedValue({
                content: mockStudyBooks,
                totalElements: 1,
                totalPages: 1,
                number: 0
            });

            mockStudyBookController.deleteStudyBook.mockResolvedValue();
            window.confirm = jest.fn().mockReturnValue(true);

            await studyBookList.initialize();
            await studyBookList.loadStudyBooks();

            const deleteButton = document.querySelector('.delete-button');
            deleteButton.click();

            expect(mockStudyBookController.deleteStudyBook).toHaveBeenCalledWith('1');
            expect(mockEventBus.emit).toHaveBeenCalledWith('studybook:deleted', '1');
        });

        test('should not delete study book when cancelled', async () => {
            const mockStudyBooks = [
                { id: '1', language: 'javascript', question: 'console.log("test");', explanation: 'Basic logging' }
            ];

            mockStudyBookController.getStudyBooks.mockResolvedValue({
                content: mockStudyBooks,
                totalElements: 1,
                totalPages: 1,
                number: 0
            });

            window.confirm = jest.fn().mockReturnValue(false);

            await studyBookList.initialize();
            await studyBookList.loadStudyBooks();

            const deleteButton = document.querySelector('.delete-button');
            deleteButton.click();

            expect(mockStudyBookController.deleteStudyBook).not.toHaveBeenCalled();
        });
    });

    describe('Event Handling', () => {
        test('should listen to study book events', () => {
            studyBookList.initialize();

            expect(mockEventBus.on).toHaveBeenCalledWith('studybook:created', expect.any(Function));
            expect(mockEventBus.on).toHaveBeenCalledWith('studybook:updated', expect.any(Function));
            expect(mockEventBus.on).toHaveBeenCalledWith('studybook:deleted', expect.any(Function));
        });

        test('should refresh list when study book is created', async () => {
            await studyBookList.initialize();

            // Get the created handler
            const createdHandler = mockEventBus.on.mock.calls.find(call => call[0] === 'studybook:created')[1];
            
            const newStudyBook = { id: '2', language: 'python', question: 'print("test")' };
            createdHandler(newStudyBook);

            expect(mockStudyBookController.getStudyBooks).toHaveBeenCalledTimes(2); // Initial load + refresh
        });

        test('should cleanup event listeners on destroy', () => {
            studyBookList.initialize();
            studyBookList.destroy();

            expect(mockEventBus.off).toHaveBeenCalledWith('studybook:created', expect.any(Function));
            expect(mockEventBus.off).toHaveBeenCalledWith('studybook:updated', expect.any(Function));
            expect(mockEventBus.off).toHaveBeenCalledWith('studybook:deleted', expect.any(Function));
        });
    });

    describe('Error Handling', () => {
        test('should handle API errors gracefully', async () => {
            const error = new Error('Failed to load study books');
            mockStudyBookController.getStudyBooks.mockRejectedValue(error);

            await studyBookList.initialize();

            expect(mockEventBus.emit).toHaveBeenCalledWith('notification:error', 'Failed to load study books');
        });

        test('should handle delete errors gracefully', async () => {
            const mockStudyBooks = [
                { id: '1', language: 'javascript', question: 'console.log("test");' }
            ];

            mockStudyBookController.getStudyBooks.mockResolvedValue({
                content: mockStudyBooks,
                totalElements: 1,
                totalPages: 1,
                number: 0
            });

            const error = new Error('Failed to delete study book');
            mockStudyBookController.deleteStudyBook.mockRejectedValue(error);
            window.confirm = jest.fn().mockReturnValue(true);

            await studyBookList.initialize();
            await studyBookList.loadStudyBooks();

            const deleteButton = document.querySelector('.delete-button');
            deleteButton.click();

            expect(mockEventBus.emit).toHaveBeenCalledWith('notification:error', 'Failed to delete study book');
        });
    });
});