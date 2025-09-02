/**
 * Unit tests for EventBus
 */

const EventBus = require('../../Rct/js/application/events/EventBus');

describe('EventBus', () => {
    let eventBus;

    beforeEach(() => {
        eventBus = new EventBus();
    });

    describe('constructor', () => {
        it('should initialize with empty listeners and middleware', () => {
            expect(eventBus.listeners.size).toBe(0);
            expect(eventBus.onceListeners.size).toBe(0);
            expect(eventBus.middleware).toEqual([]);
            expect(eventBus.isDebugMode).toBe(false);
        });
    });

    describe('on', () => {
        it('should subscribe to events', () => {
            const callback = jest.fn();
            const unsubscribe = eventBus.on('test-event', callback);

            expect(typeof unsubscribe).toBe('function');
            expect(eventBus.hasListeners('test-event')).toBe(true);
        });

        it('should handle priority ordering', () => {
            const callback1 = jest.fn();
            const callback2 = jest.fn();
            const callback3 = jest.fn();

            eventBus.on('test-event', callback1, { priority: 1 });
            eventBus.on('test-event', callback2, { priority: 3 });
            eventBus.on('test-event', callback3, { priority: 2 });

            const listeners = eventBus.getListeners('test-event');
            expect(listeners[0].callback).toBe(callback2); // Highest priority first
            expect(listeners[1].callback).toBe(callback3);
            expect(listeners[2].callback).toBe(callback1);
        });

        it('should return unsubscribe function that works', () => {
            const callback = jest.fn();
            const unsubscribe = eventBus.on('test-event', callback);

            expect(eventBus.hasListeners('test-event')).toBe(true);

            unsubscribe();

            expect(eventBus.hasListeners('test-event')).toBe(false);
        });
    });

    describe('once', () => {
        it('should subscribe to events for one-time execution', () => {
            const callback = jest.fn();
            eventBus.once('test-event', callback);

            expect(eventBus.hasListeners('test-event')).toBe(true);
        });

        it('should execute callback only once', async () => {
            const callback = jest.fn();
            eventBus.once('test-event', callback);

            await eventBus.emit('test-event', 'data1');
            await eventBus.emit('test-event', 'data2');

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith(expect.objectContaining({
                name: 'test-event',
                data: 'data1'
            }));
        });
    });

    describe('emit', () => {
        it('should emit events to subscribers', async () => {
            const callback = jest.fn();
            eventBus.on('test-event', callback);

            const result = await eventBus.emit('test-event', 'test-data');

            expect(result).toBe(true);
            expect(callback).toHaveBeenCalledWith(expect.objectContaining({
                name: 'test-event',
                data: 'test-data',
                timestamp: expect.any(Number)
            }));
        });

        it('should handle multiple subscribers', async () => {
            const callback1 = jest.fn();
            const callback2 = jest.fn();

            eventBus.on('test-event', callback1);
            eventBus.on('test-event', callback2);

            await eventBus.emit('test-event', 'test-data');

            expect(callback1).toHaveBeenCalledTimes(1);
            expect(callback2).toHaveBeenCalledTimes(1);
        });

        it('should execute once listeners before regular listeners', async () => {
            const executionOrder = [];

            const onceCallback = jest.fn(() => executionOrder.push('once'));
            const regularCallback = jest.fn(() => executionOrder.push('regular'));

            eventBus.once('test-event', onceCallback, { priority: 1 });
            eventBus.on('test-event', regularCallback, { priority: 2 });

            await eventBus.emit('test-event');

            expect(executionOrder).toEqual(['once', 'regular']);
        });

        it('should handle event cancellation', async () => {
            const callback1 = jest.fn(() => false); // Cancel event
            const callback2 = jest.fn();

            eventBus.on('test-event', callback1);
            eventBus.on('test-event', callback2);

            const result = await eventBus.emit('test-event', null, { cancellable: true });

            expect(result).toBe(false);
            expect(callback1).toHaveBeenCalledTimes(1);
            expect(callback2).toHaveBeenCalledTimes(1); // Still called, but event is marked as cancelled
        });

        it('should handle stop propagation', async () => {
            const callback1 = jest.fn((event) => {
                event.stopPropagation = true;
            });
            const callback2 = jest.fn();

            eventBus.on('test-event', callback1, { priority: 2 });
            eventBus.on('test-event', callback2, { priority: 1 });

            await eventBus.emit('test-event');

            expect(callback1).toHaveBeenCalledTimes(1);
            expect(callback2).not.toHaveBeenCalled();
        });

        it('should handle listener errors gracefully', async () => {
            const errorCallback = jest.fn(() => {
                throw new Error('Listener error');
            });
            const normalCallback = jest.fn();

            eventBus.on('test-event', errorCallback);
            eventBus.on('test-event', normalCallback);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await eventBus.emit('test-event');

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Error in listener'),
                expect.any(Error)
            );
            expect(normalCallback).toHaveBeenCalledTimes(1);

            consoleSpy.mockRestore();
        });

        it('should execute listeners asynchronously when async option is true', async () => {
            const asyncCallback = jest.fn(async () => {
                await new Promise(resolve => setTimeout(resolve, 10));
                return 'async-result';
            });

            eventBus.on('test-event', asyncCallback);

            await eventBus.emit('test-event', null, { async: true });

            expect(asyncCallback).toHaveBeenCalledTimes(1);
        });
    });

    describe('middleware', () => {
        it('should add and remove middleware', () => {
            const middleware = {
                before: jest.fn(),
                after: jest.fn()
            };

            eventBus.addMiddleware(middleware);
            expect(eventBus.middleware).toContain(middleware);

            eventBus.removeMiddleware(middleware);
            expect(eventBus.middleware).not.toContain(middleware);
        });

        it('should execute middleware before and after emission', async () => {
            const beforeMiddleware = jest.fn();
            const afterMiddleware = jest.fn();

            eventBus.addMiddleware({
                before: beforeMiddleware,
                after: afterMiddleware
            });

            const callback = jest.fn();
            eventBus.on('test-event', callback);

            await eventBus.emit('test-event', 'test-data');

            expect(beforeMiddleware).toHaveBeenCalledWith('test-event', 'test-data');
            expect(afterMiddleware).toHaveBeenCalledWith(
                'test-event',
                'test-data',
                expect.objectContaining({ name: 'test-event' })
            );
        });

        it('should allow middleware to cancel events', async () => {
            const cancellingMiddleware = {
                before: jest.fn(() => false)
            };

            eventBus.addMiddleware(cancellingMiddleware);

            const callback = jest.fn();
            eventBus.on('test-event', callback);

            const result = await eventBus.emit('test-event', null, { cancellable: true });

            expect(result).toBe(false);
            expect(callback).not.toHaveBeenCalled();
        });
    });

    describe('utility methods', () => {
        it('should get all listeners for an event', () => {
            const callback1 = jest.fn();
            const callback2 = jest.fn();
            const callback3 = jest.fn();

            eventBus.on('test-event', callback1);
            eventBus.once('test-event', callback2);
            eventBus.on('other-event', callback3);

            const listeners = eventBus.getListeners('test-event');
            expect(listeners).toHaveLength(2);
        });

        it('should get all event names', () => {
            eventBus.on('event1', jest.fn());
            eventBus.once('event2', jest.fn());
            eventBus.on('event3', jest.fn());

            const eventNames = eventBus.getEventNames();
            expect(eventNames).toContain('event1');
            expect(eventNames).toContain('event2');
            expect(eventNames).toContain('event3');
        });

        it('should check if event has listeners', () => {
            expect(eventBus.hasListeners('test-event')).toBe(false);

            eventBus.on('test-event', jest.fn());
            expect(eventBus.hasListeners('test-event')).toBe(true);
        });

        it('should remove all listeners for an event', () => {
            eventBus.on('test-event', jest.fn());
            eventBus.once('test-event', jest.fn());
            eventBus.on('other-event', jest.fn());

            eventBus.removeAllListeners('test-event');

            expect(eventBus.hasListeners('test-event')).toBe(false);
            expect(eventBus.hasListeners('other-event')).toBe(true);
        });

        it('should remove all listeners when no event specified', () => {
            eventBus.on('event1', jest.fn());
            eventBus.on('event2', jest.fn());

            eventBus.removeAllListeners();

            expect(eventBus.hasListeners('event1')).toBe(false);
            expect(eventBus.hasListeners('event2')).toBe(false);
        });
    });

    describe('debug mode', () => {
        it('should enable and disable debug mode', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            eventBus.setDebugMode(true);
            expect(eventBus.isDebugMode).toBe(true);
            expect(consoleSpy).toHaveBeenCalledWith('EventBus: Debug mode enabled');

            eventBus.setDebugMode(false);
            expect(eventBus.isDebugMode).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith('EventBus: Debug mode disabled');

            consoleSpy.mockRestore();
        });

        it('should log debug messages when debug mode is enabled', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            eventBus.setDebugMode(true);
            eventBus.on('test-event', jest.fn());

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Subscribed to \'test-event\'')
            );

            consoleSpy.mockRestore();
        });
    });

    describe('namespace', () => {
        it('should create namespaced event emitter', () => {
            const namespacedBus = eventBus.namespace('auth');
            const callback = jest.fn();

            namespacedBus.on('login', callback);

            expect(eventBus.hasListeners('auth:login')).toBe(true);
        });

        it('should emit namespaced events', async () => {
            const namespacedBus = eventBus.namespace('auth');
            const callback = jest.fn();

            namespacedBus.on('login', callback);
            await namespacedBus.emit('login', 'user-data');

            expect(callback).toHaveBeenCalledWith(expect.objectContaining({
                name: 'auth:login',
                data: 'user-data'
            }));
        });
    });

    describe('proxy', () => {
        it('should proxy events to another event bus', async () => {
            const targetBus = new EventBus();
            const callback = jest.fn();

            targetBus.on('test-event', callback);

            const stopProxy = eventBus.proxy(targetBus, ['test-event']);

            await eventBus.emit('test-event', 'proxy-data');

            expect(callback).toHaveBeenCalledWith(expect.objectContaining({
                name: 'test-event',
                data: 'proxy-data'
            }));

            stopProxy();
        });
    });

    describe('waitFor', () => {
        it('should wait for event to be emitted', async () => {
            const promise = eventBus.waitFor('test-event');

            setTimeout(() => {
                eventBus.emit('test-event', 'waited-data');
            }, 10);

            const event = await promise;

            expect(event.name).toBe('test-event');
            expect(event.data).toBe('waited-data');
        });

        it('should timeout if event is not emitted', async () => {
            const promise = eventBus.waitFor('test-event', 50);

            await expect(promise).rejects.toThrow('Timeout waiting for event \'test-event\'');
        });
    });

    describe('getStatistics', () => {
        it('should return event bus statistics', () => {
            eventBus.on('event1', jest.fn());
            eventBus.on('event1', jest.fn());
            eventBus.once('event2', jest.fn());
            eventBus.addMiddleware({ before: jest.fn() });

            const stats = eventBus.getStatistics();

            expect(stats.totalEvents).toBe(2);
            expect(stats.totalListeners).toBe(3);
            expect(stats.regularListeners).toBe(2);
            expect(stats.onceListeners).toBe(1);
            expect(stats.middlewareCount).toBe(1);
            expect(stats.debugMode).toBe(false);
        });
    });
});