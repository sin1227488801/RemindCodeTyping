/**
 * Jest setup file for frontend tests
 * This file is executed before each test file
 */

// Mock fetch API for tests
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock window.location
delete window.location;
window.location = {
  href: 'http://localhost:3000',
  origin: 'http://localhost:3000',
  protocol: 'http:',
  host: 'localhost:3000',
  hostname: 'localhost',
  port: '3000',
  pathname: '/',
  search: '',
  hash: '',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
};

// Mock console methods to reduce noise in tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Custom matchers for better assertions
expect.extend({
  toBeValidUrl(received) {
    try {
      new URL(received);
      return {
        message: () => `expected ${received} not to be a valid URL`,
        pass: true,
      };
    } catch {
      return {
        message: () => `expected ${received} to be a valid URL`,
        pass: false,
      };
    }
  },
  
  toHaveBeenCalledWithUrl(received, expected) {
    const calls = received.mock.calls;
    const matchingCall = calls.find(call => {
      const url = call[0];
      return typeof url === 'string' && url.includes(expected);
    });
    
    return {
      message: () => 
        matchingCall 
          ? `expected ${received} not to have been called with URL containing ${expected}`
          : `expected ${received} to have been called with URL containing ${expected}`,
      pass: !!matchingCall,
    };
  }
});

// Global test utilities
global.testUtils = {
  /**
   * Creates a mock response for fetch
   * @param {*} data - The data to return
   * @param {number} status - HTTP status code
   * @param {boolean} ok - Whether the response is ok
   * @returns {Promise} Mock response
   */
  mockFetchResponse: (data, status = 200, ok = true) => {
    return Promise.resolve({
      ok,
      status,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
      headers: new Map(),
    });
  },

  /**
   * Creates a mock fetch rejection
   * @param {string} message - Error message
   * @returns {Promise} Rejected promise
   */
  mockFetchError: (message = 'Network error') => {
    return Promise.reject(new Error(message));
  },

  /**
   * Waits for the next tick in the event loop
   * @returns {Promise} Promise that resolves on next tick
   */
  nextTick: () => new Promise(resolve => setTimeout(resolve, 0)),

  /**
   * Creates a DOM element for testing
   * @param {string} tag - HTML tag name
   * @param {Object} attributes - Element attributes
   * @param {string} content - Element content
   * @returns {HTMLElement} Created element
   */
  createElement: (tag, attributes = {}, content = '') => {
    const element = document.createElement(tag);
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    if (content) {
      element.textContent = content;
    }
    return element;
  }
};

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset localStorage mock
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  
  // Reset sessionStorage mock
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();
  
  // Reset fetch mock
  fetch.mockClear();
  
  // Clear DOM
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});

// Cleanup after each test
afterEach(() => {
  // Additional cleanup if needed
});