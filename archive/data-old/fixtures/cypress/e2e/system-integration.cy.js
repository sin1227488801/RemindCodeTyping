describe('System Integration Tests', () => {
  beforeEach(() => {
    cy.clearAllData();
  });

  describe('Complete User Journey', () => {
    it('should complete full application workflow from registration to statistics', () => {
      const testUser = {
        loginId: 'systemtestuser',
        password: 'SystemTest123!'
      };

      // Step 1: Register new user
      cy.visit('/Rct/login.html');
      cy.get('[data-testid="register-link"]').click();
      
      cy.get('#registerLoginId').type(testUser.loginId);
      cy.get('#registerPassword').type(testUser.password);
      cy.get('#confirmPassword').type(testUser.password);
      cy.get('#registerButton').click();

      // Should redirect to login with success message
      cy.url().should('include', '/Rct/login.html');
      cy.shouldShowNotification('success', 'Registration successful');

      // Step 2: Login with registered user
      cy.get('#loginId').type(testUser.loginId);
      cy.get('#password').type(testUser.password);
      cy.get('#loginButton').click();

      // Should redirect to main page
      cy.url().should('include', '/Rct/main.html');
      cy.get('[data-testid="user-info"]').should('contain', testUser.loginId);

      // Step 3: Create multiple study books
      cy.navigateToTab('studybook');
      
      const studyBooks = [
        {
          language: 'javascript',
          question: 'console.log("Hello World");',
          explanation: 'Basic console logging in JavaScript'
        },
        {
          language: 'python',
          question: 'print("Hello World")',
          explanation: 'Basic printing in Python'
        },
        {
          language: 'java',
          question: 'System.out.println("Hello World");',
          explanation: 'Basic output in Java'
        }
      ];

      studyBooks.forEach((studyBook, index) => {
        cy.get('[data-testid="create-studybook-btn"]').click();
        cy.fillStudyBookForm(studyBook);
        cy.get('[data-testid="save-studybook-btn"]').click();
        cy.shouldShowNotification('success', 'Study book created successfully');
        
        // Verify it appears in the list
        cy.get('[data-testid="list-tab"]').click();
        cy.get('[data-testid="studybook-list"]').should('contain', studyBook.question);
      });

      // Step 4: Practice typing with created study books
      cy.navigateToTab('typing');
      
      studyBooks.forEach((studyBook, index) => {
        // Select language and start session
        cy.get('#language-select').select(studyBook.language);
        cy.get('[data-testid="start-button"]').click();
        
        // Wait for question to load
        cy.get('[data-testid="typing-question"]').should('be.visible');
        
        // Type the question (simulate different accuracy levels)
        const accuracy = [100, 95, 90][index]; // Different accuracy for each session
        const targetText = studyBook.question;
        const typedText = accuracy === 100 ? targetText : 
                         targetText.substring(0, Math.floor(targetText.length * accuracy / 100));
        
        cy.get('#typing-input').type(typedText);
        cy.get('[data-testid="finish-button"]').click();
        
        // Verify result modal
        cy.get('[data-testid="result-modal"]').should('be.visible');
        cy.get('[data-testid="accuracy"]').should('contain', '%');
        cy.get('[data-testid="close-result"]').click();
        
        // Small delay between sessions
        cy.wait(500);
      });

      // Step 5: View and verify statistics
      cy.navigateToTab('records');
      
      // Should show all completed sessions
      cy.get('[data-testid="total-sessions"]').should('contain', '3');
      cy.get('[data-testid="session-history"]').should('have.length', 3);
      
      // Should show average accuracy
      cy.get('[data-testid="average-accuracy"]').should('be.visible');
      cy.get('[data-testid="average-wpm"]').should('be.visible');
      
      // Should show charts
      cy.get('[data-testid="accuracy-chart"]').should('be.visible');
      cy.get('[data-testid="wpm-chart"]').should('be.visible');

      // Step 6: Edit a study book
      cy.navigateToTab('studybook');
      cy.get('[data-testid="edit-button"]').first().click();
      
      cy.get('#question-input').clear().type('console.log("Updated Hello World");');
      cy.get('#explanation-input').clear().type('Updated JavaScript console logging');
      cy.get('[data-testid="save-studybook-btn"]').click();
      
      cy.shouldShowNotification('success', 'Study book updated successfully');
      cy.get('[data-testid="studybook-list"]').should('contain', 'Updated Hello World');

      // Step 7: Delete a study book
      cy.get('[data-testid="delete-button"]').last().click();
      cy.get('[data-testid="confirm-delete"]').click();
      
      cy.shouldShowNotification('success', 'Study book deleted successfully');
      cy.get('[data-testid="studybook-item"]').should('have.length', 2);

      // Step 8: Logout
      cy.get('[data-testid="logout-button"]').click();
      cy.get('[data-testid="confirm-logout"]').click();
      
      cy.url().should('include', '/Rct/login.html');
      cy.getLocalStorageItem('authToken').should('not.exist');
    });

    it('should handle demo user workflow', () => {
      cy.visit('/Rct/login.html');
      
      // Start demo session
      cy.get('[data-testid="demo-button"]').click();
      
      // Should redirect to main page as demo user
      cy.url().should('include', '/Rct/main.html');
      cy.get('[data-testid="user-info"]').should('contain', 'Demo User');
      cy.get('[data-testid="demo-indicator"]').should('be.visible');

      // Demo user should not be able to create study books
      cy.navigateToTab('studybook');
      cy.get('[data-testid="create-studybook-btn"]').should('be.disabled');
      cy.get('[data-testid="demo-limitation"]').should('be.visible');

      // But should be able to practice with system study books
      cy.navigateToTab('typing');
      cy.get('#language-select').select('javascript');
      cy.get('[data-testid="start-button"]').click();
      
      cy.get('[data-testid="typing-question"]').should('be.visible');
      cy.get('#typing-input').should('be.enabled');
      
      // Complete a typing session
      cy.get('[data-testid="typing-question"]').invoke('text').then((questionText) => {
        cy.get('#typing-input').type(questionText.trim());
        cy.get('[data-testid="finish-button"]').click();
        
        cy.get('[data-testid="result-modal"]').should('be.visible');
        cy.get('[data-testid="close-result"]').click();
      });

      // Should be able to view statistics
      cy.navigateToTab('records');
      cy.get('[data-testid="total-sessions"]').should('contain', '1');
    });
  });

  describe('Multi-User Data Isolation', () => {
    it('should maintain data isolation between users', () => {
      const user1 = { loginId: 'isolationuser1', password: 'Test123!' };
      const user2 = { loginId: 'isolationuser2', password: 'Test123!' };

      // Register and login as user1
      cy.registerAndLogin(user1);
      
      // Create study book as user1
      cy.navigateToTab('studybook');
      cy.get('[data-testid="create-studybook-btn"]').click();
      cy.fillStudyBookForm({
        language: 'javascript',
        question: 'console.log("User 1 study book");',
        explanation: 'User 1 private study book'
      });
      cy.get('[data-testid="save-studybook-btn"]').click();
      
      // Logout user1
      cy.logout();
      
      // Register and login as user2
      cy.registerAndLogin(user2);
      
      // User2 should not see user1's study books
      cy.navigateToTab('studybook');
      cy.get('[data-testid="studybook-list"]').should('not.contain', 'User 1 study book');
      cy.get('[data-testid="empty-state"]').should('be.visible');
      
      // Create study book as user2
      cy.get('[data-testid="create-studybook-btn"]').click();
      cy.fillStudyBookForm({
        language: 'python',
        question: 'print("User 2 study book")',
        explanation: 'User 2 private study book'
      });
      cy.get('[data-testid="save-studybook-btn"]').click();
      
      // User2 should only see their own study book
      cy.get('[data-testid="studybook-list"]').should('contain', 'User 2 study book');
      cy.get('[data-testid="studybook-list"]').should('not.contain', 'User 1 study book');
      
      // Logout user2 and login as user1 again
      cy.logout();
      cy.login(user1);
      
      // User1 should still only see their own study book
      cy.navigateToTab('studybook');
      cy.get('[data-testid="studybook-list"]').should('contain', 'User 1 study book');
      cy.get('[data-testid="studybook-list"]').should('not.contain', 'User 2 study book');
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from network errors gracefully', () => {
      cy.login();
      cy.navigateToTab('studybook');
      
      // Simulate network failure during study book creation
      cy.intercept('POST', '**/api/studybooks', { forceNetworkError: true }).as('networkError');
      
      cy.get('[data-testid="create-studybook-btn"]').click();
      cy.fillStudyBookForm({
        language: 'javascript',
        question: 'console.log("network test");',
        explanation: 'Network error test'
      });
      cy.get('[data-testid="save-studybook-btn"]').click();
      
      cy.wait('@networkError');
      
      // Should show network error message
      cy.shouldShowNotification('error', 'Network error');
      
      // Should remain on form tab for retry
      cy.get('[data-testid="form-tab"]').should('have.class', 'active');
      cy.get('#question-input').should('have.value', 'console.log("network test");');
      
      // Restore network and retry
      cy.intercept('POST', '**/api/studybooks', { statusCode: 201, body: { id: '1', question: 'console.log("network test");' } }).as('networkRestored');
      
      cy.get('[data-testid="save-studybook-btn"]').click();
      cy.wait('@networkRestored');
      
      cy.shouldShowNotification('success', 'Study book created successfully');
    });

    it('should handle session expiration gracefully', () => {
      cy.login();
      
      // Simulate session expiration
      cy.intercept('GET', '**/api/studybooks', { statusCode: 401, body: { error: 'Token expired' } }).as('sessionExpired');
      
      cy.navigateToTab('studybook');
      cy.wait('@sessionExpired');
      
      // Should redirect to login with appropriate message
      cy.url().should('include', '/Rct/login.html');
      cy.shouldShowNotification('warning', 'Session expired');
      
      // Should clear stored authentication data
      cy.getLocalStorageItem('authToken').should('not.exist');
      cy.getLocalStorageItem('currentUser').should('not.exist');
    });

    it('should handle browser refresh during typing session', () => {
      cy.login();
      cy.navigateToTab('typing');
      
      // Start typing session
      cy.get('#language-select').select('javascript');
      cy.get('[data-testid="start-button"]').click();
      
      // Type some text
      cy.get('#typing-input').type('console.log("refresh test");');
      
      // Simulate browser refresh
      cy.reload();
      
      // Should offer to resume session
      cy.get('[data-testid="resume-session"]').should('be.visible');
      cy.get('[data-testid="resume-message"]').should('contain', 'typing session in progress');
      
      // Resume session
      cy.get('[data-testid="resume-button"]').click();
      
      // Should restore session state
      cy.get('#typing-input').should('have.value', 'console.log("refresh test");');
      cy.get('[data-testid="finish-button"]').should('be.enabled');
      
      // Complete the session
      cy.get('[data-testid="finish-button"]').click();
      cy.get('[data-testid="result-modal"]').should('be.visible');
    });
  });

  describe('Performance and Responsiveness', () => {
    it('should load pages within acceptable time limits', () => {
      // Test login page load time
      const loginStartTime = Date.now();
      cy.visit('/Rct/login.html');
      cy.get('[data-testid="login-form"]').should('be.visible').then(() => {
        const loginLoadTime = Date.now() - loginStartTime;
        expect(loginLoadTime).to.be.lessThan(2000); // 2 seconds
      });
      
      // Test main page load time after login
      cy.login();
      const mainStartTime = Date.now();
      cy.visit('/Rct/main.html');
      cy.get('[data-testid="main-content"]').should('be.visible').then(() => {
        const mainLoadTime = Date.now() - mainStartTime;
        expect(mainLoadTime).to.be.lessThan(3000); // 3 seconds
      });
    });

    it('should handle large datasets efficiently', () => {
      cy.login();
      
      // Mock large dataset
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        id: `${i + 1}`,
        language: 'javascript',
        question: `function test${i}() { return ${i}; }`,
        explanation: `Test function ${i}`,
        createdAt: new Date().toISOString()
      }));
      
      cy.intercept('GET', '**/api/studybooks**', {
        body: {
          content: largeDataset.slice(0, 10),
          totalElements: 100,
          totalPages: 10,
          number: 0
        }
      }).as('largeDataset');
      
      cy.navigateToTab('studybook');
      cy.wait('@largeDataset');
      
      // Should render efficiently without freezing
      cy.get('[data-testid="studybook-item"]').should('have.length', 10);
      cy.get('[data-testid="pagination"]').should('be.visible');
      
      // Test pagination performance
      cy.intercept('GET', '**/api/studybooks?page=1**', {
        body: {
          content: largeDataset.slice(10, 20),
          totalElements: 100,
          totalPages: 10,
          number: 1
        }
      }).as('nextPage');
      
      const paginationStartTime = Date.now();
      cy.get('[data-testid="next-page"]').click();
      cy.wait('@nextPage');
      cy.get('[data-testid="studybook-item"]').should('have.length', 10).then(() => {
        const paginationTime = Date.now() - paginationStartTime;
        expect(paginationTime).to.be.lessThan(1000); // 1 second
      });
    });

    it('should maintain responsiveness during rapid user interactions', () => {
      cy.login();
      cy.navigateToTab('typing');
      
      // Start typing session
      cy.get('#language-select').select('javascript');
      cy.get('[data-testid="start-button"]').click();
      
      // Rapid typing simulation
      const rapidText = 'console.log("rapid typing test");';
      cy.get('#typing-input').type(rapidText, { delay: 10 }); // Very fast typing
      
      // Should update progress smoothly without lag
      cy.get('[data-testid="typing-progress"]').should('be.visible');
      cy.get('[data-testid="character-count"]').should('contain', rapidText.length.toString());
      
      // Interface should remain responsive
      cy.get('[data-testid="finish-button"]').should('be.enabled');
      cy.get('[data-testid="cancel-button"]').should('be.enabled');
    });
  });

  describe('Accessibility Compliance', () => {
    it('should be accessible with keyboard navigation', () => {
      cy.visit('/Rct/login.html');
      
      // Test keyboard navigation through login form
      cy.get('body').tab();
      cy.focused().should('have.id', 'loginId');
      
      cy.get('body').tab();
      cy.focused().should('have.id', 'password');
      
      cy.get('body').tab();
      cy.focused().should('have.id', 'loginButton');
      
      // Test form submission with Enter key
      cy.get('#loginId').type('testuser');
      cy.get('#password').type('testpassword{enter}');
      
      cy.url().should('include', '/Rct/main.html');
      
      // Test main page keyboard navigation
      cy.checkKeyboardNavigation([
        '[data-testid="studybook-tab"]',
        '[data-testid="typing-tab"]',
        '[data-testid="records-tab"]',
        '[data-testid="logout-button"]'
      ]);
    });

    it('should provide proper ARIA labels and roles', () => {
      cy.login();
      
      // Check main navigation
      cy.get('[data-testid="main-nav"]').should('have.attr', 'role', 'navigation');
      cy.get('[data-testid="main-nav"]').should('have.attr', 'aria-label');
      
      // Check study book list
      cy.navigateToTab('studybook');
      cy.get('[data-testid="studybook-list"]').should('have.attr', 'role', 'list');
      cy.get('[data-testid="studybook-item"]').should('have.attr', 'role', 'listitem');
      
      // Check form labels
      cy.get('[data-testid="create-studybook-btn"]').click();
      cy.get('label[for="language-select"]').should('exist');
      cy.get('label[for="question-input"]').should('exist');
      cy.get('label[for="explanation-input"]').should('exist');
      
      // Check typing interface
      cy.navigateToTab('typing');
      cy.get('#typing-input').should('have.attr', 'aria-label');
      cy.get('[data-testid="typing-progress"]').should('have.attr', 'aria-live');
    });

    it('should support screen reader announcements', () => {
      cy.login();
      cy.navigateToTab('typing');
      
      // Start typing session
      cy.get('#language-select').select('javascript');
      cy.get('[data-testid="start-button"]').click();
      
      // Check for screen reader announcements
      cy.get('[data-testid="session-started-announcement"]')
        .should('have.attr', 'aria-live', 'polite')
        .and('contain', 'Typing session started');
      
      // Type some text
      cy.get('#typing-input').type('console');
      
      // Should announce progress
      cy.get('[data-testid="progress-announcement"]')
        .should('have.attr', 'aria-live', 'polite');
      
      // Finish session
      cy.get('[data-testid="typing-question"]').invoke('text').then((questionText) => {
        cy.get('#typing-input').clear().type(questionText.trim());
        cy.get('[data-testid="finish-button"]').click();
        
        // Should announce results
        cy.get('[data-testid="result-announcement"]')
          .should('have.attr', 'aria-live', 'polite')
          .and('contain', 'Typing session completed');
      });
    });
  });

  describe('Cross-Browser Compatibility', () => {
    it('should work consistently across different browsers', () => {
      // This test would typically be run across multiple browsers
      // using Cypress's browser configuration
      
      cy.login();
      
      // Test core functionality
      cy.navigateToTab('studybook');
      cy.get('[data-testid="create-studybook-btn"]').click();
      cy.fillStudyBookForm({
        language: 'javascript',
        question: 'console.log("cross-browser test");',
        explanation: 'Cross-browser compatibility test'
      });
      cy.get('[data-testid="save-studybook-btn"]').click();
      
      cy.shouldShowNotification('success', 'Study book created successfully');
      
      // Test typing functionality
      cy.navigateToTab('typing');
      cy.get('#language-select').select('javascript');
      cy.get('[data-testid="start-button"]').click();
      
      cy.get('[data-testid="typing-question"]').should('be.visible');
      cy.get('#typing-input').should('be.enabled');
      
      // Complete session
      cy.get('[data-testid="typing-question"]').invoke('text').then((questionText) => {
        cy.get('#typing-input').type(questionText.trim());
        cy.get('[data-testid="finish-button"]').click();
        cy.get('[data-testid="result-modal"]').should('be.visible');
      });
    });
  });
});