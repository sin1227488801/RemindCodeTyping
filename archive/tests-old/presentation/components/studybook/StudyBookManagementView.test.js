/**
 * @jest-environment jsdom
 */

import { StudyBookManagementView } from '../../../../Rct/js/presentation/components/studybook/StudyBookManagementView.js';

describe('StudyBookManagementView', () => {
    let managementView;
    let mockContainer;
    let mockStudyBookController;
    let mockEventBus;

    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = `
            <div id="management-container">
                <div class="management-header">
                    <h2>Study Book Management</h2>
                    <button id="create-studybook-btn">Create New Study Book</button>
                </div>
                <div class="management-tabs">
                    <button class="tab-button active" data-tab="list">List View</button>
                    <button class="tab-button" data-tab="form">Form View</button>
                </div>
                <div class="tab-content">
                    <div id="list-tab" class="tab-panel active">
                        <div id="studybook-list-container"></div>
                    </div>
                    <div id="form-tab" class="tab-panel">
                        <div id="studybook-form-container"></div>
                    </div>
                </div>
                <div id="modal-overlay" class="modal-overlay hidden">
                    <div class="modal-content">
                        <div id="modal-body"></div>
                        <div class="modal-actions">
                            <button id="modal-close">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        mockContainer = document.getElementById('management-container');
        
        mockStudyBookController = {
            getStudyBooks: jest.fn(),
            createStudyBook: jest.fn(),
            updateStudyBook: jest.fn(),
            deleteStudyBook: jest.fn()
        };

        mockEventBus = {
            emit: jest.fn(),
            on: jest.fn(),
            off: jest.fn()
        };

        managementView = new StudyBookManagementView(mockContainer, mockStudyBookController, mockEventBus);
    });

    afterEach(() => {
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        test('should initialize with container and dependencies', () => {
            expect(managementView.container).toBe(mockContainer);
            expect(managementView.studyBookController).toBe(mockStudyBookController);
            expect(managementView.eventBus).toBe(mockEventBus);
        });

        test('should throw error if container is not provided', () => {
            expect(() => {
                new StudyBookManagementView(null, mockStudyBookController, mockEventBus);
            }).toThrow('Container element is required');
        });

        test('should initialize with list tab active by default', () => {
            managementView.initialize();

            const listTab = document.getElementById('list-tab');
            const formTab = document.getElementById('form-tab');

            expect(listTab.classList.contains('active')).toBe(true);
            expect(formTab.classList.contains('active')).toBe(false);
        });
    });

    describe('Tab Management', () => {
        test('should switch between tabs when tab buttons are clicked', () => {
            managementView.initialize();

            const formTabButton = document.querySelector('[data-tab="form"]');
            formTabButton.click();

            const listTab = document.getElementById('list-tab');
            const formTab = document.getElementById('form-tab');
            const listTabButton = document.querySelector('[data-tab="list"]');

            expect(listTab.classList.contains('active')).toBe(false);
            expect(formTab.classList.contains('active')).toBe(true);
            expect(listTabButton.classList.contains('active')).toBe(false);
            expect(formTabButton.classList.contains('active')).toBe(true);
        });

        test('should emit tab change events', () => {
            managementView.initialize();

            const formTabButton = document.querySelector('[data-tab="form"]');
            formTabButton.click();

            expect(mockEventBus.emit).toHaveBeenCalledWith('tab:changed', 'form');
        });

        test('should handle invalid tab gracefully', () => {
            managementView.initialize();

            expect(() => {
                managementView.switchTab('invalid-tab');
            }).not.toThrow();

            // Should remain on current tab
            const listTab = document.getElementById('list-tab');
            expect(listTab.classList.contains('active')).toBe(true);
        });
    });

    describe('Study Book Creation', () => {
        test('should show form when create button is clicked', () => {
            managementView.initialize();

            const createButton = document.getElementById('create-studybook-btn');
            createButton.click();

            const formTab = document.getElementById('form-tab');
            expect(formTab.classList.contains('active')).toBe(true);
            expect(mockEventBus.emit).toHaveBeenCalledWith('studybook:create-mode');
        });

        test('should clear form when switching to create mode', () => {
            managementView.initialize();

            // Simulate form with data
            managementView.currentStudyBook = { id: '1', question: 'test' };

            const createButton = document.getElementById('create-studybook-btn');
            createButton.click();

            expect(managementView.currentStudyBook).toBeNull();
            expect(mockEventBus.emit).toHaveBeenCalledWith('form:clear');
        });
    });

    describe('Study Book Editing', () => {
        test('should switch to form tab when edit event is received', () => {
            managementView.initialize();

            // Get the edit handler
            const editHandler = mockEventBus.on.mock.calls.find(call => call[0] === 'studybook:edit')[1];
            
            const studyBook = { id: '1', language: 'javascript', question: 'test' };
            editHandler(studyBook);

            const formTab = document.getElementById('form-tab');
            expect(formTab.classList.contains('active')).toBe(true);
            expect(managementView.currentStudyBook).toBe(studyBook);
        });

        test('should populate form with study book data for editing', () => {
            managementView.initialize();

            const studyBook = { id: '1', language: 'javascript', question: 'console.log("test");' };
            
            const editHandler = mockEventBus.on.mock.calls.find(call => call[0] === 'studybook:edit')[1];
            editHandler(studyBook);

            expect(mockEventBus.emit).toHaveBeenCalledWith('form:populate', studyBook);
        });
    });

    describe('Modal Management', () => {
        test('should show modal when requested', () => {
            managementView.initialize();

            const content = '<p>Modal content</p>';
            managementView.showModal(content);

            const modalOverlay = document.getElementById('modal-overlay');
            const modalBody = document.getElementById('modal-body');

            expect(modalOverlay.classList.contains('hidden')).toBe(false);
            expect(modalBody.innerHTML).toBe(content);
        });

        test('should hide modal when close button is clicked', () => {
            managementView.initialize();

            managementView.showModal('<p>Test</p>');
            
            const closeButton = document.getElementById('modal-close');
            closeButton.click();

            const modalOverlay = document.getElementById('modal-overlay');
            expect(modalOverlay.classList.contains('hidden')).toBe(true);
        });

        test('should hide modal when overlay is clicked', () => {
            managementView.initialize();

            managementView.showModal('<p>Test</p>');
            
            const modalOverlay = document.getElementById('modal-overlay');
            modalOverlay.click();

            expect(modalOverlay.classList.contains('hidden')).toBe(true);
        });

        test('should not hide modal when modal content is clicked', () => {
            managementView.initialize();

            managementView.showModal('<p>Test</p>');
            
            const modalContent = document.querySelector('.modal-content');
            modalContent.click();

            const modalOverlay = document.getElementById('modal-overlay');
            expect(modalOverlay.classList.contains('hidden')).toBe(false);
        });
    });

    describe('Event Handling', () => {
        test('should listen to study book management events', () => {
            managementView.initialize();

            expect(mockEventBus.on).toHaveBeenCalledWith('studybook:edit', expect.any(Function));
            expect(mockEventBus.on).toHaveBeenCalledWith('studybook:created', expect.any(Function));
            expect(mockEventBus.on).toHaveBeenCalledWith('studybook:updated', expect.any(Function));
            expect(mockEventBus.on).toHaveBeenCalledWith('studybook:deleted', expect.any(Function));
        });

        test('should switch to list tab after study book is created', () => {
            managementView.initialize();

            // Switch to form tab first
            managementView.switchTab('form');

            // Get the created handler
            const createdHandler = mockEventBus.on.mock.calls.find(call => call[0] === 'studybook:created')[1];
            
            const newStudyBook = { id: '2', language: 'python', question: 'print("test")' };
            createdHandler(newStudyBook);

            const listTab = document.getElementById('list-tab');
            expect(listTab.classList.contains('active')).toBe(true);
        });

        test('should switch to list tab after study book is updated', () => {
            managementView.initialize();

            // Switch to form tab first
            managementView.switchTab('form');

            // Get the updated handler
            const updatedHandler = mockEventBus.on.mock.calls.find(call => call[0] === 'studybook:updated')[1];
            
            const updatedStudyBook = { id: '1', language: 'javascript', question: 'updated question' };
            updatedHandler(updatedStudyBook);

            const listTab = document.getElementById('list-tab');
            expect(listTab.classList.contains('active')).toBe(true);
        });

        test('should show success notification after operations', () => {
            managementView.initialize();

            const createdHandler = mockEventBus.on.mock.calls.find(call => call[0] === 'studybook:created')[1];
            const updatedHandler = mockEventBus.on.mock.calls.find(call => call[0] === 'studybook:updated')[1];
            const deletedHandler = mockEventBus.on.mock.calls.find(call => call[0] === 'studybook:deleted')[1];

            createdHandler({ id: '1' });
            expect(mockEventBus.emit).toHaveBeenCalledWith('notification:success', 'Study book created successfully');

            updatedHandler({ id: '1' });
            expect(mockEventBus.emit).toHaveBeenCalledWith('notification:success', 'Study book updated successfully');

            deletedHandler('1');
            expect(mockEventBus.emit).toHaveBeenCalledWith('notification:success', 'Study book deleted successfully');
        });

        test('should cleanup event listeners on destroy', () => {
            managementView.initialize();
            managementView.destroy();

            expect(mockEventBus.off).toHaveBeenCalledWith('studybook:edit', expect.any(Function));
            expect(mockEventBus.off).toHaveBeenCalledWith('studybook:created', expect.any(Function));
            expect(mockEventBus.off).toHaveBeenCalledWith('studybook:updated', expect.any(Function));
            expect(mockEventBus.off).toHaveBeenCalledWith('studybook:deleted', expect.any(Function));
        });
    });

    describe('Keyboard Navigation', () => {
        test('should handle escape key to close modal', () => {
            managementView.initialize();

            managementView.showModal('<p>Test</p>');

            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
            document.dispatchEvent(escapeEvent);

            const modalOverlay = document.getElementById('modal-overlay');
            expect(modalOverlay.classList.contains('hidden')).toBe(true);
        });

        test('should handle tab navigation between tabs', () => {
            managementView.initialize();

            const listTabButton = document.querySelector('[data-tab="list"]');
            const formTabButton = document.querySelector('[data-tab="form"]');

            // Simulate tab key navigation
            const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
            listTabButton.dispatchEvent(tabEvent);

            expect(listTabButton.tabIndex).toBeGreaterThanOrEqual(0);
            expect(formTabButton.tabIndex).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Accessibility', () => {
        test('should have proper ARIA attributes', () => {
            managementView.initialize();

            const tabButtons = document.querySelectorAll('.tab-button');
            const tabPanels = document.querySelectorAll('.tab-panel');

            tabButtons.forEach(button => {
                expect(button.getAttribute('role')).toBe('tab');
                expect(button.getAttribute('aria-selected')).toBeTruthy();
            });

            tabPanels.forEach(panel => {
                expect(panel.getAttribute('role')).toBe('tabpanel');
            });
        });

        test('should announce tab changes to screen readers', () => {
            managementView.initialize();

            const formTabButton = document.querySelector('[data-tab="form"]');
            formTabButton.click();

            expect(formTabButton.getAttribute('aria-selected')).toBe('true');
            
            const listTabButton = document.querySelector('[data-tab="list"]');
            expect(listTabButton.getAttribute('aria-selected')).toBe('false');
        });
    });
});