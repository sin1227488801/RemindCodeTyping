describe('Typing Practice Flow', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/Rct/main.html');
  });

  describe('Session Management', () => {
    it('should start typing session successfully', () => {
      cy.navigateToTab('typing');
      
      // Select language
      cy.get('#language-select').select('javascript');
      
      // Start session
      cy.get('[data-testid="start-button"]').click();
      
      // Should display question
      cy.get('[data-testid="typing-question"]').should('be.visible').and('not.be.empty');
      
      // Should enable input
      cy.get('#typing-input').should('be.visible').and('be.enabled');
      
      // Should show progress
      cy.get('[data-testid="typing-progress"]').should('be.visible');
      
      // Should disable start button
      cy.get('[data-testid="start-button"]').should('be.disabled');
      
      // Should enable finish button
      cy.get('[data-testid="finish-button"]').should('be.enabled');
    });

    it('should handle typing input validation', () => {
      cy.startTypingSession('javascript');
      
      // Get the question text
      cy.get('[data-testid="typing-question"]').invoke('text').then((questionText) => {
        const targetText = questionText.trim();
        const correctInput = targetText.substring(0, 10);
        const incorrectInput = 'wrong input';
        
        // Type correct input
        cy.get('#typing-input').clear().type(correctInput);
        cy.get('#typing-input').should('not.have.class', 'error');
        
        // Type incorrect input
        cy.get('#typing-input').clear().type(incorrectInput);
        cy.get('#typing-input').should('have.class', 'error');
      });
    });

    it('should update progress during typing', () => {
      cy.startTypingSession('javascript');
      
      cy.get('[data-testid="typing-question"]').invoke('text').then((questionText) => {
        const targetText = questionText.trim();
        const halfInput = targetText.substring(0, Math.floor(targetText.length / 2));
        
        // Type half of the question
        cy.get('#typing-input').type(halfInput);
        
        // Check progress is around 50%
        cy.get('[data-testid="progress-percentage"]').should('contain', '5');
        
        // Check character count
        cy.get('[data-testid="character-count"]').should('contain', halfInput.length.toString());
      });
    });

    it('should finish session and show results', () => {
      cy.startTypingSession('javascript');
      
      cy.get('[data-testid="typing-question"]').invoke('text').then((questionText) => {
        const targetText = questionText.trim();
        
        // Type the complete question
        cy.get('#typing-input').type(targetText);
        
        // Finish session
        cy.get('[data-testid="finish-button"]').click();
        
        // Should show results modal
        cy.get('[data-testid="result-modal"]').should('be.visible');
        
        // Should display accuracy
        cy.get('[data-testid="accuracy"]').should('contain', '%');
        
        // Should display WPM
        cy.get('[data-testid="wpm"]').should('contain', 'WPM');
        
        // Should display duration
        cy.get('[data-testid="duration"]').should('be.visible');
        
        // Should show close button
        cy.get('[data-testid="close-result"]').should('be.visible');
      });
    });

    it('should handle session cancellation', () => {
      cy.startTypingSession('javascript');
      
      // Type some input
      cy.get('#typing-input').type('console.log');
      
      // Cancel session
      cy.get('[data-testid="cancel-button"]').click();
      
      // Should show confirmation
      cy.get('[data-testid="cancel-confirmation"]').should('be.visible');
      
      // Confirm cancellation
      cy.get('[data-testid="confirm-cancel"]').click();
      
      // Should reset interface
      cy.get('#typing-input').should('have.value', '');
      cy.get('[data-testid="start-button"]').should('be.enabled');
      cy.get('[data-testid="finish-button"]').should('be.disabled');
    });
  });

  describe('Settings Configuration', () => {
    beforeEach(() => {
      cy.navigateToTab('typing');
      cy.get('[data-testid="settings-button"]').click();
    });

    it('should configure typing settings', () => {
      // Change language
      cy.get('#language-select').select('python');
      
      // Change difficulty
      cy.get('#difficulty-select').select('2');
      
      // Set session duration
      cy.get('#session-duration').clear().type('10');
      
      // Enable strict mode
      cy.get('#strict-mode').check();
      
      // Enable hints
      cy.get('#show-hints').check();
      
      // Apply settings
      cy.get('[data-testid="apply-settings"]').click();
      
      // Should save settings
      cy.shouldShowNotification('success', 'Settings saved successfully');
      
      // Should persist settings
      cy.reload();
      cy.navigateToTab('typing');
      cy.get('[data-testid="settings-button"]').click();
      
      cy.get('#language-select').should('have.value', 'python');
      cy.get('#difficulty-select').should('have.value', '2');
      cy.get('#session-duration').should('have.value', '10');
      cy.get('#strict-mode').should('be.checked');
      cy.get('#show-hints').should('be.checked');
    });

    it('should validate settings input', () => {
      // Invalid session duration
      cy.get('#session-duration').clear().type('0');
      cy.get('[data-testid="apply-settings"]').click();
      
      cy.get('[data-testid="duration-error"]')
        .should('contain', 'Duration must be between 1 and 60 minutes');
      
      // Valid duration
      cy.get('#session-duration').clear().type('15');
      cy.get('[data-testid="apply-settings"]').click();
      
      cy.shouldShowNotification('success', 'Settings saved successfully');
    });

    it('should reset settings to default', () => {
      // Change some settings
      cy.get('#language-select').select('python');
      cy.get('#difficulty-select').select('3');
      cy.get('#strict-mode').check();
      
      // Reset to default
      cy.get('[data-testid="reset-settings"]').click();
      
      // Should show confirmation
      cy.get('[data-testid="reset-confirmation"]').should('be.visible');
      cy.get('[data-testid="confirm-reset"]').click();
      
      // Should reset to defaults
      cy.get('#language-select').should('have.value', 'javascript');
      cy.get('#difficulty-select').should('have.value', '1');
      cy.get('#strict-mode').should('not.be.checked');
    });
  });

  describe('Performance Tracking', () => {
    it('should track typing statistics', () => {
      // Complete a typing session
      cy.startTypingSession('javascript');
      
      cy.get('[data-testid="typing-question"]').invoke('text').then((questionText) => {
        const targetText = questionText.trim();
        
        cy.get('#typing-input').type(targetText);
        cy.get('[data-testid="finish-button"]').click();
        
        // Close result modal
        cy.get('[data-testid="close-result"]').click();
        
        // Check statistics tab
        cy.navigateToTab('records');
        
        // Should show session in history
        cy.get('[data-testid="session-history"]').should('contain', 'javascript');
        
        // Should show statistics
        cy.get('[data-testid="total-sessions"]').should('not.contain', '0');
        cy.get('[data-testid="average-accuracy"]').should('be.visible');
        cy.get('[data-testid="average-wpm"]').should('be.visible');
      });
    });

    it('should display performance charts', () => {
      cy.navigateToTab('records');
      
      // Should show accuracy chart
      cy.get('[data-testid="accuracy-chart"]').should('be.visible');
      
      // Should show WPM chart
      cy.get('[data-testid="wpm-chart"]').should('be.visible');
      
      // Should show progress over time
      cy.get('[data-testid="progress-chart"]').should('be.visible');
    });

    it('should filter statistics by date range', () => {
      cy.navigateToTab('records');
      
      // Set date range
      cy.get('#date-from').type('2024-01-01');
      cy.get('#date-to').type('2024-12-31');
      cy.get('[data-testid="apply-filter"]').click();
      
      // Should update statistics
      cy.get('[data-testid="filtered-sessions"]').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors during session start', () => {
      // Mock API error
      cy.intercept('POST', '**/api/typing/sessions', {
        statusCode: 500,
        body: { error: 'Server error' }
      }).as('sessionError');
      
      cy.navigateToTab('typing');
      cy.get('#language-select').select('javascript');
      cy.get('[data-testid="start-button"]').click();
      
      cy.wait('@sessionError');
      
      // Should show error message
      cy.shouldShowNotification('error', 'Failed to start typing session');
      
      // Should not change UI state
      cy.get('[data-testid="start-button"]').should('be.enabled');
      cy.get('#typing-input').should('be.disabled');
    });

    it('should handle network disconnection during session', () => {
      cy.startTypingSession('javascript');
      
      // Simulate network disconnection
      cy.intercept('POST', '**/api/typing/results', { forceNetworkError: true }).as('networkError');
      
      cy.get('[data-testid="typing-question"]').invoke('text').then((questionText) => {
        cy.get('#typing-input').type(questionText.trim());
        cy.get('[data-testid="finish-button"]').click();
        
        cy.wait('@networkError');
        
        // Should show offline message
        cy.shouldShowNotification('warning', 'Connection lost. Results will be saved when online.');
        
        // Should store results locally
        cy.getLocalStorageItem('pendingResults').should('exist');
      });
    });

    it('should recover from browser crashes', () => {
      cy.startTypingSession('javascript');
      
      // Type some input
      cy.get('#typing-input').type('console.log("test");');
      
      // Simulate page refresh (browser crash recovery)
      cy.reload();
      
      // Should offer to resume session
      cy.get('[data-testid="resume-session"]').should('be.visible');
      
      // Resume session
      cy.get('[data-testid="resume-button"]').click();
      
      // Should restore session state
      cy.get('#typing-input').should('have.value', 'console.log("test");');
      cy.get('[data-testid="finish-button"]').should('be.enabled');
    });
  });

  describe('Accessibility', () => {
    it('should support keyboard navigation', () => {
      cy.navigateToTab('typing');
      
      // Tab through controls
      cy.checkKeyboardNavigation([
        '#language-select',
        '[data-testid="start-button"]',
        '[data-testid="settings-button"]'
      ]);
    });

    it('should provide screen reader support', () => {
      cy.startTypingSession('javascript');
      
      // Check ARIA labels
      cy.get('#typing-input').should('have.attr', 'aria-label');
      cy.get('[data-testid="typing-progress"]').should('have.attr', 'aria-live', 'polite');
      
      // Check progress announcements
      cy.get('#typing-input').type('console');
      cy.get('[data-testid="progress-announcement"]').should('exist');
    });

    it('should support high contrast mode', () => {
      cy.startTypingSession('javascript');
      
      // Check color contrast
      cy.get('#typing-input').should('have.css', 'background-color');
      cy.get('[data-testid="typing-question"]').should('have.css', 'color');
    });
  });

  describe('Performance', () => {
    it('should load typing interface quickly', () => {
      cy.navigateToTab('typing');
      cy.measureLoadTime('[data-testid="typing-interface"]');
    });

    it('should handle rapid typing input efficiently', () => {
      cy.startTypingSession('javascript');
      
      const rapidText = 'console.log("rapid typing test");';
      
      // Type rapidly
      cy.get('#typing-input').type(rapidText, { delay: 10 });
      
      // Should update progress smoothly
      cy.get('[data-testid="typing-progress"]').should('be.visible');
      
      // Should not lag or freeze
      cy.get('#typing-input').should('have.value', rapidText);
    });

    it('should handle long typing sessions', () => {
      // Start session with long text
      cy.intercept('GET', '**/api/studybooks/random', {
        body: [{
          id: '1',
          question: 'a'.repeat(1000), // Very long text
          language: 'javascript'
        }]
      }).as('longText');
      
      cy.startTypingSession('javascript');
      cy.wait('@longText');
      
      // Should handle long text efficiently
      cy.get('[data-testid="typing-question"]').should('be.visible');
      cy.get('#typing-input').should('be.enabled');
    });
  });
});