/**
 * Unit tests for StateManager
 */

const StateManager = require('../../Rct/js/application/state/StateManager');

describe('StateManager', () => {
    let stateManager;

    beforeEach(() => {
        stateManager = new StateManager();
    });

    describe('constructor', () => {
        it('should initialize with default state', () => {
            const state = stateManager.getState();

            expect(state.currentUser).toBeNull();
            expect(state.currentSession).toBeNull();
            expect(state.currentStudyBook).toBeNull();
            expect(state.studyBooks).toEqual([]);
            expect(state.userStatistics).toBeNull();
            expect(state.appSettings).toEqual({});
            expect(state.uiState.isLoading).toBe(false);
            expect(state.uiState.activeTab).toBeNull();
            expect(state.uiState.modals).toEqual({});
        });

        it('should initialize empty listeners and middleware', () => {
            expect(stateManager.listeners.size).toBe(0);
            expect(stateManager.middleware).toEqual([]);
        });
    });

    describe('getState', () => {
        it('should return a copy of the state', () => {
            const state1 = stateManager.getState();
            const state2 = stateManager.getState();

            expect(state1).toEqual(state2);
            expect(state1).not.toBe(state2); // Different objects
        });
    });

    describe('getStateValue', () => {
        it('should get nested state values', () => {
            stateManager.setState({
                uiState: {
                    isLoading: true,
                    activeTab: 'typing'
                }
            });

            expect(stateManager.getStateValue('uiState.isLoading')).toBe(true);
            expect(stateManager.getStateValue('uiState.activeTab')).toBe('typing');
            expect(stateManager.getStateValue('currentUser')).toBeNull();
        });

        it('should return undefined for non-existent paths', () => {
            expect(stateManager.getStateValue('nonexistent.path')).toBeUndefined();
        });

        it('should return entire state for null path', () => {
            const state = stateManager.getStateValue(null);
            expect(state).toEqual(stateManager.getState());
        });
    });

    describe('setState', () => {
        it('should update state and notify listeners', () => {
            const listener = jest.fn();
            stateManager.subscribe(listener);

            const updates = { currentUser: { id: '123', name: 'Test User' } };
            stateManager.setState(updates, 'TEST_ACTION');

            expect(stateManager.getStateValue('currentUser')).toEqual(updates.currentUser);
            expect(listener).toHaveBeenCalledWith(
                expect.objectContaining({ currentUser: updates.currentUser }),
                expect.objectContaining({ currentUser: null }),
                'TEST_ACTION'
            );
        });

        it('should merge nested objects', () => {
            stateManager.setState({
                uiState: { isLoading: true }
            });

            stateManager.setState({
                uiState: { activeTab: 'typing' }
            });

            const uiState = stateManager.getStateValue('uiState');
            expect(uiState.isLoading).toBe(true);
            expect(uiState.activeTab).toBe('typing');
        });

        it('should call middleware before and after state change', () => {
            const beforeMiddleware = jest.fn();
            const afterMiddleware = jest.fn();

            stateManager.addMiddleware({
                before: beforeMiddleware,
                after: afterMiddleware
            });

            const updates = { currentUser: { id: '123' } };
            stateManager.setState(updates, 'TEST_ACTION');

            expect(beforeMiddleware).toHaveBeenCalledWith(
                'TEST_ACTION',
                updates,
                expect.objectContaining({ currentUser: null })
            );

            expect(afterMiddleware).toHaveBeenCalledWith(
                'TEST_ACTION',
                expect.objectContaining({ currentUser: { id: '123' } }),
                expect.objectContaining({ currentUser: null })
            );
        });
    });

    describe('subscribe', () => {
        it('should subscribe to all state changes', () => {
            const listener = jest.fn();
            const unsubscribe = stateManager.subscribe(listener);

            stateManager.setState({ currentUser: { id: '123' } });

            expect(listener).toHaveBeenCalledTimes(1);

            unsubscribe();
            stateManager.setState({ currentUser: { id: '456' } });

            expect(listener).toHaveBeenCalledTimes(1); // Should not be called again
        });

        it('should subscribe to specific path changes', () => {
            const userListener = jest.fn();
            const uiListener = jest.fn();

            stateManager.subscribe('currentUser', userListener);
            stateManager.subscribe('uiState.isLoading', uiListener);

            // Change user - should trigger userListener
            stateManager.setState({ currentUser: { id: '123' } });
            expect(userListener).toHaveBeenCalledTimes(1);
            expect(uiListener).toHaveBeenCalledTimes(0);

            // Change UI state - should trigger uiListener
            stateManager.setState({ uiState: { isLoading: true } });
            expect(userListener).toHaveBeenCalledTimes(1);
            expect(uiListener).toHaveBeenCalledTimes(1);
        });

        it('should handle listener errors gracefully', () => {
            const errorListener = jest.fn(() => {
                throw new Error('Listener error');
            });
            const normalListener = jest.fn();

            stateManager.subscribe(errorListener);
            stateManager.subscribe(normalListener);

            // Should not throw and should still call normal listener
            expect(() => {
                stateManager.setState({ currentUser: { id: '123' } });
            }).not.toThrow();

            expect(errorListener).toHaveBeenCalledTimes(1);
            expect(normalListener).toHaveBeenCalledTimes(1);
        });
    });

    describe('dispatch', () => {
        it('should handle SET_CURRENT_USER action', () => {
            const user = { id: '123', name: 'Test User' };
            stateManager.dispatch('SET_CURRENT_USER', user);

            expect(stateManager.getStateValue('currentUser')).toEqual(user);
        });

        it('should handle CLEAR_CURRENT_USER action', () => {
            stateManager.setState({ currentUser: { id: '123' } });
            stateManager.dispatch('CLEAR_CURRENT_USER');

            expect(stateManager.getStateValue('currentUser')).toBeNull();
        });

        it('should handle SET_STUDY_BOOKS action', () => {
            const studyBooks = [{ id: '1', title: 'Test Book' }];
            stateManager.dispatch('SET_STUDY_BOOKS', studyBooks);

            expect(stateManager.getStateValue('studyBooks')).toEqual(studyBooks);
        });

        it('should handle ADD_STUDY_BOOK action', () => {
            const existingBooks = [{ id: '1', title: 'Book 1' }];
            const newBook = { id: '2', title: 'Book 2' };

            stateManager.setState({ studyBooks: existingBooks });
            stateManager.dispatch('ADD_STUDY_BOOK', newBook);

            const studyBooks = stateManager.getStateValue('studyBooks');
            expect(studyBooks).toHaveLength(2);
            expect(studyBooks).toContain(newBook);
        });

        it('should handle UPDATE_STUDY_BOOK action', () => {
            const existingBooks = [
                { id: '1', title: 'Book 1' },
                { id: '2', title: 'Book 2' }
            ];
            const updatedBook = { id: '1', title: 'Updated Book 1' };

            stateManager.setState({ studyBooks: existingBooks });
            stateManager.dispatch('UPDATE_STUDY_BOOK', updatedBook);

            const studyBooks = stateManager.getStateValue('studyBooks');
            expect(studyBooks[0]).toEqual(updatedBook);
            expect(studyBooks[1]).toEqual(existingBooks[1]);
        });

        it('should handle REMOVE_STUDY_BOOK action', () => {
            const existingBooks = [
                { id: '1', title: 'Book 1' },
                { id: '2', title: 'Book 2' }
            ];

            stateManager.setState({ studyBooks: existingBooks });
            stateManager.dispatch('REMOVE_STUDY_BOOK', '1');

            const studyBooks = stateManager.getStateValue('studyBooks');
            expect(studyBooks).toHaveLength(1);
            expect(studyBooks[0].id).toBe('2');
        });

        it('should handle SET_LOADING action', () => {
            stateManager.dispatch('SET_LOADING', true);
            expect(stateManager.getStateValue('uiState.isLoading')).toBe(true);

            stateManager.dispatch('SET_LOADING', false);
            expect(stateManager.getStateValue('uiState.isLoading')).toBe(false);
        });

        it('should handle SHOW_MODAL action', () => {
            const modalData = { title: 'Test Modal', content: 'Test content' };
            stateManager.dispatch('SHOW_MODAL', { name: 'testModal', data: modalData });

            expect(stateManager.getStateValue('uiState.modals.testModal')).toEqual(modalData);
        });

        it('should handle HIDE_MODAL action', () => {
            stateManager.setState({
                uiState: {
                    modals: {
                        testModal: { title: 'Test Modal' },
                        otherModal: { title: 'Other Modal' }
                    }
                }
            });

            stateManager.dispatch('HIDE_MODAL', 'testModal');

            const modals = stateManager.getStateValue('uiState.modals');
            expect(modals.testModal).toBeUndefined();
            expect(modals.otherModal).toBeDefined();
        });

        it('should warn about unknown action types', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            stateManager.dispatch('UNKNOWN_ACTION', 'test');

            expect(consoleSpy).toHaveBeenCalledWith('Unknown action type: UNKNOWN_ACTION');

            consoleSpy.mockRestore();
        });
    });

    describe('reset', () => {
        it('should reset state to initial values', () => {
            // Modify state
            stateManager.setState({
                currentUser: { id: '123' },
                studyBooks: [{ id: '1' }],
                uiState: { isLoading: true }
            });

            // Reset
            stateManager.reset();

            // Check that state is back to initial values
            const state = stateManager.getState();
            expect(state.currentUser).toBeNull();
            expect(state.studyBooks).toEqual([]);
            expect(state.uiState.isLoading).toBe(false);
        });

        it('should notify listeners about reset', () => {
            const listener = jest.fn();
            stateManager.subscribe(listener);

            stateManager.reset();

            expect(listener).toHaveBeenCalledWith(
                expect.any(Object),
                expect.any(Object),
                'RESET_STATE'
            );
        });
    });

    describe('middleware', () => {
        it('should add and remove middleware', () => {
            const middleware1 = { before: jest.fn() };
            const middleware2 = { after: jest.fn() };

            stateManager.addMiddleware(middleware1);
            stateManager.addMiddleware(middleware2);

            expect(stateManager.middleware).toHaveLength(2);

            stateManager.removeMiddleware(middleware1);

            expect(stateManager.middleware).toHaveLength(1);
            expect(stateManager.middleware[0]).toBe(middleware2);
        });

        it('should execute middleware in order', () => {
            const executionOrder = [];

            const middleware1 = {
                before: () => executionOrder.push('middleware1-before'),
                after: () => executionOrder.push('middleware1-after')
            };

            const middleware2 = {
                before: () => executionOrder.push('middleware2-before'),
                after: () => executionOrder.push('middleware2-after')
            };

            stateManager.addMiddleware(middleware1);
            stateManager.addMiddleware(middleware2);

            stateManager.setState({ currentUser: { id: '123' } });

            expect(executionOrder).toEqual([
                'middleware1-before',
                'middleware2-before',
                'middleware1-after',
                'middleware2-after'
            ]);
        });
    });

    describe('persistence', () => {
        beforeEach(() => {
            // Mock localStorage
            global.localStorage = {
                getItem: jest.fn(),
                setItem: jest.fn(),
                removeItem: jest.fn()
            };
        });

        afterEach(() => {
            delete global.localStorage;
        });

        it('should persist state to localStorage', () => {
            stateManager.setState({
                currentUser: { id: '123' },
                appSettings: { theme: 'dark' }
            });

            stateManager.persistState();

            expect(localStorage.setItem).toHaveBeenCalledWith(
                'appState',
                JSON.stringify({
                    currentUser: { id: '123' },
                    appSettings: { theme: 'dark' }
                })
            );
        });

        it('should load persisted state from localStorage', () => {
            const persistedState = {
                currentUser: { id: '123' },
                appSettings: { theme: 'dark' }
            };

            localStorage.getItem.mockReturnValue(JSON.stringify(persistedState));

            stateManager.loadPersistedState();

            expect(stateManager.getStateValue('currentUser')).toEqual(persistedState.currentUser);
            expect(stateManager.getStateValue('appSettings')).toEqual(persistedState.appSettings);
        });

        it('should handle localStorage errors gracefully', () => {
            localStorage.setItem.mockImplementation(() => {
                throw new Error('Storage quota exceeded');
            });

            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            expect(() => stateManager.persistState()).not.toThrow();
            expect(consoleSpy).toHaveBeenCalledWith('Failed to persist state:', expect.any(Error));

            consoleSpy.mockRestore();
        });
    });

    describe('helper methods', () => {
        describe('mergeDeep', () => {
            it('should deep merge objects', () => {
                const target = {
                    a: 1,
                    b: { c: 2, d: 3 },
                    e: [1, 2]
                };

                const source = {
                    b: { d: 4, f: 5 },
                    e: [3, 4],
                    g: 6
                };

                const result = stateManager.mergeDeep(target, source);

                expect(result).toEqual({
                    a: 1,
                    b: { c: 2, d: 4, f: 5 },
                    e: [3, 4],
                    g: 6
                });
            });
        });

        describe('getNestedValue', () => {
            it('should get nested values correctly', () => {
                const obj = {
                    a: {
                        b: {
                            c: 'value'
                        }
                    }
                };

                expect(stateManager.getNestedValue(obj, 'a.b.c')).toBe('value');
                expect(stateManager.getNestedValue(obj, 'a.b')).toEqual({ c: 'value' });
                expect(stateManager.getNestedValue(obj, 'nonexistent')).toBeUndefined();
            });
        });

        describe('hasStateChanged', () => {
            it('should detect state changes correctly', () => {
                const oldState = { a: { b: 1 } };
                const newState = { a: { b: 2 } };

                expect(stateManager.hasStateChanged(newState, oldState, 'a.b')).toBe(true);
                expect(stateManager.hasStateChanged(oldState, oldState, 'a.b')).toBe(false);
            });
        });
    });
});