/**
 * Example test file demonstrating the frontend testing infrastructure.
 * This shows how to use Jest with our custom setup and utilities.
 */

describe('Frontend Testing Infrastructure', () => {
  beforeEach(() => {
    // Setup is handled automatically by tests/setup.js
  });

  describe('Test Utilities', () => {
    test('should provide mock fetch response utility', async () => {
      // Given
      const mockData = { message: 'Hello World' };
      fetch.mockResolvedValueOnce(testUtils.mockFetchResponse(mockData));

      // When
      const response = await fetch('/api/test');
      const data = await response.json();

      // Then
      expect(data).toEqual(mockData);
      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
    });

    test('should provide mock fetch error utility', async () => {
      // Given
      const errorMessage = 'Network error';
      fetch.mockRejectedValueOnce(testUtils.mockFetchError(errorMessage));

      // When & Then
      await expect(fetch('/api/test')).rejects.toThrow(errorMessage);
    });

    test('should provide DOM element creation utility', () => {
      // When
      const element = testUtils.createElement('div', { 
        id: 'test-element', 
        class: 'test-class' 
      }, 'Test Content');

      // Then
      expect(element.tagName).toBe('DIV');
      expect(element.id).toBe('test-element');
      expect(element.className).toBe('test-class');
      expect(element.textContent).toBe('Test Content');
    });

    test('should provide next tick utility', async () => {
      // Given
      let executed = false;
      setTimeout(() => { executed = true; }, 0);

      // When
      await testUtils.nextTick();

      // Then
      expect(executed).toBe(true);
    });
  });

  describe('Custom Matchers', () => {
    test('should validate URLs with custom matcher', () => {
      // Valid URLs
      expect('https://example.com').toBeValidUrl();
      expect('http://localhost:3000/api/test').toBeValidUrl();

      // Invalid URLs
      expect('not-a-url').not.toBeValidUrl();
      expect('').not.toBeValidUrl();
    });

    test('should check function calls with URL matcher', () => {
      // Given
      const mockFn = jest.fn();
      mockFn('/api/users/123');
      mockFn('/api/posts');

      // Then
      expect(mockFn).toHaveBeenCalledWithUrl('/api/users');
      expect(mockFn).toHaveBeenCalledWithUrl('/api/posts');
      expect(mockFn).not.toHaveBeenCalledWithUrl('/api/admin');
    });
  });

  describe('Mock Objects', () => {
    test('should have localStorage mock', () => {
      // When
      localStorage.setItem('test-key', 'test-value');
      const value = localStorage.getItem('test-key');

      // Then
      expect(value).toBe('test-value');
      expect(localStorage.setItem).toHaveBeenCalledWith('test-key', 'test-value');
      expect(localStorage.getItem).toHaveBeenCalledWith('test-key');
    });

    test('should have sessionStorage mock', () => {
      // When
      sessionStorage.setItem('session-key', 'session-value');
      const value = sessionStorage.getItem('session-key');

      // Then
      expect(value).toBe('session-value');
      expect(sessionStorage.setItem).toHaveBeenCalledWith('session-key', 'session-value');
      expect(sessionStorage.getItem).toHaveBeenCalledWith('session-key');
    });

    test('should have window.location mock', () => {
      // Then
      expect(window.location.href).toBe('http://localhost:3000');
      expect(window.location.hostname).toBe('localhost');
      expect(window.location.port).toBe('3000');
      expect(typeof window.location.assign).toBe('function');
      expect(typeof window.location.replace).toBe('function');
      expect(typeof window.location.reload).toBe('function');
    });
  });

  describe('Error Handling', () => {
    test('should handle async errors gracefully', async () => {
      // Given
      const asyncFunction = async () => {
        throw new Error('Async error');
      };

      // When & Then
      await expect(asyncFunction()).rejects.toThrow('Async error');
    });

    test('should handle promise rejections', () => {
      // Given
      const rejectedPromise = Promise.reject(new Error('Promise rejected'));

      // When & Then
      return expect(rejectedPromise).rejects.toThrow('Promise rejected');
    });
  });
});

describe('Example Business Logic Tests', () => {
  describe('User Authentication', () => {
    test('should validate user credentials format', () => {
      // Given
      const validCredentials = {
        loginId: 'testuser',
        password: 'password123'
      };

      const invalidCredentials = {
        loginId: '',
        password: 'short'
      };

      // When & Then
      expect(validCredentials.loginId).toBeTruthy();
      expect(validCredentials.password.length).toBeGreaterThanOrEqual(8);
      
      expect(invalidCredentials.loginId).toBeFalsy();
      expect(invalidCredentials.password.length).toBeLessThan(8);
    });
  });

  describe('Study Book Management', () => {
    test('should create study book object', () => {
      // Given
      const studyBookData = {
        language: 'JavaScript',
        question: 'console.log("Hello");',
        explanation: 'Basic console output'
      };

      // When
      const studyBook = {
        id: null,
        ...studyBookData,
        createdAt: new Date().toISOString()
      };

      // Then
      expect(studyBook.language).toBe('JavaScript');
      expect(studyBook.question).toBe('console.log("Hello");');
      expect(studyBook.explanation).toBe('Basic console output');
      expect(studyBook.createdAt).toBeDefined();
    });
  });

  describe('Typing Session Logic', () => {
    test('should calculate typing accuracy', () => {
      // Given
      const targetText = 'hello world';
      const typedText = 'hello world';
      const typedTextWithErrors = 'helo wrold';

      // When
      const perfectAccuracy = (typedText === targetText) ? 100 : 0;
      const errorAccuracy = calculateSimpleAccuracy(typedTextWithErrors, targetText);

      // Then
      expect(perfectAccuracy).toBe(100);
      expect(errorAccuracy).toBeLessThan(100);
    });
  });
});

// Helper function for testing
function calculateSimpleAccuracy(typed, target) {
  if (typed.length === 0) return 0;
  
  let correct = 0;
  const minLength = Math.min(typed.length, target.length);
  
  for (let i = 0; i < minLength; i++) {
    if (typed[i] === target[i]) {
      correct++;
    }
  }
  
  return Math.round((correct / target.length) * 100);
}