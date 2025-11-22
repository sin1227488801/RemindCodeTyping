describe('Study Book Management', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/Rct/main.html');
    cy.navigateToTab('studybook');
  });

  describe('Study Book Creation', () => {
    it('should create new study book successfully', () => {
      cy.get('[data-testid="create-studybook-btn"]').click();
      
      // Should switch to form tab
      cy.get('[data-testid="form-tab"]').should('have.class', 'active');
      
      // Fill form
      cy.fillStudyBookForm({
        language: 'javascript',
        question: 'console.log("Hello World");',
        explanation: 'Basic console logging in JavaScript'
      });
      
      // Submit form
      cy.get('[data-testid="save-studybook-btn"]').click();
      
      // Should show success notification
      cy.shouldShowNotification('success', 'Study book created successfully');
      
      // Should switch back to list tab
      cy.get('[data-testid="list-tab"]').should('have.class', 'active');
      
      // Should appear in list
      cy.get('[data-testid="studybook-list"]')
        .should('contain', 'console.log("Hello World");');
    });

    it('should validate required fields', () => {
      cy.get('[data-testid="create-studybook-btn"]').click();
      
      // Try to submit empty form
      cy.get('[data-testid="save-studybook-btn"]').click();
      
      // Should show validation errors
      cy.get('[data-testid="language-error"]').should('contain', 'Language is required');
      cy.get('[data-testid="question-error"]').should('contain', 'Question is required');
      
      // Should highlight invalid fields
      cy.get('#language-select').should('have.class', 'error');
      cy.get('#question-input').should('have.class', 'error');
    });

    it('should validate question length', () => {
      cy.get('[data-testid="create-studybook-btn"]').click();
      
      // Enter very long question
      const longQuestion = 'a'.repeat(1001);
      cy.fillStudyBookForm({
        language: 'javascript',
        question: longQuestion
      });
      
      cy.get('[data-testid="save-studybook-btn"]').click();
      
      // Should show length validation error
      cy.get('[data-testid="question-error"]')
        .should('contain', 'Question must be less than 1000 characters');
    });

    it('should sanitize HTML input', () => {
      cy.get('[data-testid="create-studybook-btn"]').click();
      
      // Enter HTML with script tags
      cy.fillStudyBookForm({
        language: 'javascript',
        question: '<script>alert("xss")</script>console.log("test");',
        explanation: '<b>Bold</b> explanation with <script>alert("xss")</script>'
      });
      
      cy.get('[data-testid="save-studybook-btn"]').click();
      
      // Should sanitize and save
      cy.shouldShowNotification('success', 'Study book created successfully');
      
      // Should not contain script tags in the list
      cy.get('[data-testid="studybook-list"]')
        .should('contain', 'console.log("test");')
        .and('not.contain', '<script>');
    });

    it('should handle API errors during creation', () => {
      // Mock API error
      cy.intercept('POST', '**/api/studybooks', {
        statusCode: 500,
        body: { error: 'Server error' }
      }).as('createError');
      
      cy.get('[data-testid="create-studybook-btn"]').click();
      
      cy.fillStudyBookForm({
        language: 'javascript',
        question: 'console.log("test");'
      });
      
      cy.get('[data-testid="save-studybook-btn"]').click();
      
      cy.wait('@createError');
      
      // Should show error notification
      cy.shouldShowNotification('error', 'Failed to create study book');
      
      // Should remain on form tab
      cy.get('[data-testid="form-tab"]').should('have.class', 'active');
    });
  });

  describe('Study Book Listing', () => {
    beforeEach(() => {
      // Mock study books data
      cy.intercept('GET', '**/api/studybooks**', {
        body: {
          content: [
            {
              id: '1',
              language: 'javascript',
              question: 'console.log("Hello World");',
              explanation: 'Basic console logging',
              createdAt: '2024-01-01T00:00:00Z'
            },
            {
              id: '2',
              language: 'python',
              question: 'print("Hello World")',
              explanation: 'Basic printing in Python',
              createdAt: '2024-01-02T00:00:00Z'
            }
          ],
          totalElements: 2,
          totalPages: 1,
          number: 0
        }
      }).as('getStudyBooks');
    });

    it('should display study books list', () => {
      cy.wait('@getStudyBooks');
      
      // Should show study books
      cy.get('[data-testid="studybook-item"]').should('have.length', 2);
      
      // Should display study book details
      cy.get('[data-testid="studybook-item"]').first()
        .should('contain', 'javascript')
        .and('contain', 'console.log("Hello World");')
        .and('contain', 'Basic console logging');
    });

    it('should handle empty study books list', () => {
      cy.intercept('GET', '**/api/studybooks**', {
        body: {
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0
        }
      }).as('emptyList');
      
      cy.reload();
      cy.wait('@emptyList');
      
      // Should show empty state
      cy.get('[data-testid="empty-state"]')
        .should('be.visible')
        .and('contain', 'No study books found');
      
      // Should show create button
      cy.get('[data-testid="create-first-studybook"]').should('be.visible');
    });

    it('should support pagination', () => {
      // Mock paginated data
      cy.intercept('GET', '**/api/studybooks?page=0**', {
        body: {
          content: Array.from({ length: 10 }, (_, i) => ({
            id: `${i + 1}`,
            language: 'javascript',
            question: `Question ${i + 1}`,
            explanation: `Explanation ${i + 1}`
          })),
          totalElements: 25,
          totalPages: 3,
          number: 0
        }
      }).as('page1');
      
      cy.intercept('GET', '**/api/studybooks?page=1**', {
        body: {
          content: Array.from({ length: 10 }, (_, i) => ({
            id: `${i + 11}`,
            language: 'python',
            question: `Question ${i + 11}`,
            explanation: `Explanation ${i + 11}`
          })),
          totalElements: 25,
          totalPages: 3,
          number: 1
        }
      }).as('page2');
      
      cy.reload();
      cy.wait('@page1');
      
      // Should show pagination controls
      cy.get('[data-testid="pagination"]').should('be.visible');
      cy.get('[data-testid="page-info"]').should('contain', 'Page 1 of 3');
      
      // Navigate to next page
      cy.get('[data-testid="next-page"]').click();
      cy.wait('@page2');
      
      // Should update page info
      cy.get('[data-testid="page-info"]').should('contain', 'Page 2 of 3');
      
      // Should show different content
      cy.get('[data-testid="studybook-item"]').first()
        .should('contain', 'Question 11');
    });
  });

  describe('Study Book Search and Filtering', () => {
    beforeEach(() => {
      // Mock search results
      cy.intercept('GET', '**/api/studybooks/search**', {
        body: {
          content: [
            {
              id: '1',
              language: 'javascript',
              question: 'console.log("search result");',
              explanation: 'Search result explanation'
            }
          ],
          totalElements: 1,
          totalPages: 1,
          number: 0
        }
      }).as('searchResults');
    });

    it('should search study books by query', () => {
      // Enter search query
      cy.get('[data-testid="search-input"]').type('console');
      
      // Should trigger search after debounce
      cy.wait('@searchResults');
      
      // Should show search results
      cy.get('[data-testid="studybook-item"]')
        .should('have.length', 1)
        .and('contain', 'console.log("search result");');
      
      // Should show search indicator
      cy.get('[data-testid="search-indicator"]')
        .should('contain', 'Showing results for "console"');
    });

    it('should filter by language', () => {
      // Mock filtered results
      cy.intercept('GET', '**/api/studybooks?language=python**', {
        body: {
          content: [
            {
              id: '2',
              language: 'python',
              question: 'print("filtered result")',
              explanation: 'Python example'
            }
          ],
          totalElements: 1,
          totalPages: 1,
          number: 0
        }
      }).as('filteredResults');
      
      // Select language filter
      cy.get('[data-testid="language-filter"]').select('python');
      
      cy.wait('@filteredResults');
      
      // Should show filtered results
      cy.get('[data-testid="studybook-item"]')
        .should('have.length', 1)
        .and('contain', 'python')
        .and('contain', 'print("filtered result")');
    });

    it('should clear search and filters', () => {
      // Set search and filter
      cy.get('[data-testid="search-input"]').type('console');
      cy.get('[data-testid="language-filter"]').select('javascript');
      
      // Clear filters
      cy.get('[data-testid="clear-filters"]').click();
      
      // Should reset form
      cy.get('[data-testid="search-input"]').should('have.value', '');
      cy.get('[data-testid="language-filter"]').should('have.value', '');
      
      // Should reload all study books
      cy.get('[data-testid="search-indicator"]').should('not.exist');
    });

    it('should handle no search results', () => {
      // Mock empty search results
      cy.intercept('GET', '**/api/studybooks/search**', {
        body: {
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0
        }
      }).as('noResults');
      
      cy.get('[data-testid="search-input"]').type('nonexistent');
      cy.wait('@noResults');
      
      // Should show no results message
      cy.get('[data-testid="no-results"]')
        .should('be.visible')
        .and('contain', 'No study books found for "nonexistent"');
    });
  });

  describe('Study Book Editing', () => {
    beforeEach(() => {
      // Mock existing study book
      cy.intercept('GET', '**/api/studybooks/1', {
        body: {
          id: '1',
          language: 'javascript',
          question: 'console.log("original");',
          explanation: 'Original explanation'
        }
      }).as('getStudyBook');
    });

    it('should edit existing study book', () => {
      // Click edit button
      cy.get('[data-testid="edit-button"]').first().click();
      
      cy.wait('@getStudyBook');
      
      // Should switch to form tab with populated data
      cy.get('[data-testid="form-tab"]').should('have.class', 'active');
      cy.get('#language-select').should('have.value', 'javascript');
      cy.get('#question-input').should('have.value', 'console.log("original");');
      cy.get('#explanation-input').should('have.value', 'Original explanation');
      
      // Modify the study book
      cy.get('#question-input').clear().type('console.log("updated");');
      cy.get('#explanation-input').clear().type('Updated explanation');
      
      // Save changes
      cy.get('[data-testid="save-studybook-btn"]').click();
      
      // Should show success notification
      cy.shouldShowNotification('success', 'Study book updated successfully');
      
      // Should return to list tab
      cy.get('[data-testid="list-tab"]').should('have.class', 'active');
    });

    it('should handle edit conflicts', () => {
      // Mock conflict error
      cy.intercept('PUT', '**/api/studybooks/1', {
        statusCode: 409,
        body: { error: 'Study book was modified by another user' }
      }).as('editConflict');
      
      cy.get('[data-testid="edit-button"]').first().click();
      cy.wait('@getStudyBook');
      
      // Modify and save
      cy.get('#question-input').clear().type('console.log("conflict");');
      cy.get('[data-testid="save-studybook-btn"]').click();
      
      cy.wait('@editConflict');
      
      // Should show conflict error
      cy.shouldShowNotification('error', 'Study book was modified by another user');
      
      // Should offer to reload
      cy.get('[data-testid="reload-studybook"]').should('be.visible');
    });

    it('should cancel editing', () => {
      cy.get('[data-testid="edit-button"]').first().click();
      cy.wait('@getStudyBook');
      
      // Make changes
      cy.get('#question-input').clear().type('console.log("cancelled");');
      
      // Cancel editing
      cy.get('[data-testid="cancel-edit-btn"]').click();
      
      // Should show confirmation
      cy.get('[data-testid="cancel-confirmation"]').should('be.visible');
      
      // Confirm cancellation
      cy.get('[data-testid="confirm-cancel"]').click();
      
      // Should return to list without saving
      cy.get('[data-testid="list-tab"]').should('have.class', 'active');
    });
  });

  describe('Study Book Deletion', () => {
    it('should delete study book with confirmation', () => {
      // Click delete button
      cy.get('[data-testid="delete-button"]').first().click();
      
      // Should show confirmation dialog
      cy.get('[data-testid="delete-confirmation"]').should('be.visible');
      cy.get('[data-testid="delete-message"]')
        .should('contain', 'Are you sure you want to delete this study book?');
      
      // Confirm deletion
      cy.get('[data-testid="confirm-delete"]').click();
      
      // Should show success notification
      cy.shouldShowNotification('success', 'Study book deleted successfully');
      
      // Should remove from list
      cy.get('[data-testid="studybook-item"]').should('have.length', 1);
    });

    it('should cancel deletion', () => {
      const initialCount = 2;
      
      cy.get('[data-testid="delete-button"]').first().click();
      
      // Cancel deletion
      cy.get('[data-testid="cancel-delete"]').click();
      
      // Should close dialog without deleting
      cy.get('[data-testid="delete-confirmation"]').should('not.exist');
      cy.get('[data-testid="studybook-item"]').should('have.length', initialCount);
    });

    it('should handle deletion errors', () => {
      // Mock deletion error
      cy.intercept('DELETE', '**/api/studybooks/1', {
        statusCode: 500,
        body: { error: 'Server error' }
      }).as('deleteError');
      
      cy.get('[data-testid="delete-button"]').first().click();
      cy.get('[data-testid="confirm-delete"]').click();
      
      cy.wait('@deleteError');
      
      // Should show error notification
      cy.shouldShowNotification('error', 'Failed to delete study book');
      
      // Should not remove from list
      cy.get('[data-testid="studybook-item"]').should('have.length', 2);
    });
  });

  describe('Bulk Operations', () => {
    it('should select multiple study books', () => {
      // Select multiple items
      cy.get('[data-testid="select-studybook"]').first().check();
      cy.get('[data-testid="select-studybook"]').last().check();
      
      // Should show bulk actions
      cy.get('[data-testid="bulk-actions"]').should('be.visible');
      cy.get('[data-testid="selected-count"]').should('contain', '2 selected');
    });

    it('should bulk delete study books', () => {
      // Select items
      cy.get('[data-testid="select-studybook"]').first().check();
      cy.get('[data-testid="select-studybook"]').last().check();
      
      // Bulk delete
      cy.get('[data-testid="bulk-delete"]').click();
      
      // Should show confirmation
      cy.get('[data-testid="bulk-delete-confirmation"]').should('be.visible');
      cy.get('[data-testid="confirm-bulk-delete"]').click();
      
      // Should delete all selected
      cy.shouldShowNotification('success', '2 study books deleted successfully');
    });

    it('should select all study books', () => {
      // Select all
      cy.get('[data-testid="select-all"]').check();
      
      // Should select all items
      cy.get('[data-testid="select-studybook"]:checked').should('have.length', 2);
      cy.get('[data-testid="selected-count"]').should('contain', '2 selected');
    });
  });

  describe('Accessibility', () => {
    it('should support keyboard navigation', () => {
      // Tab through list items
      cy.get('[data-testid="studybook-item"]').first().focus();
      cy.focused().should('contain', 'console.log');
      
      // Navigate with arrow keys
      cy.focused().type('{downarrow}');
      cy.focused().should('contain', 'print');
    });

    it('should provide screen reader support', () => {
      // Check ARIA labels
      cy.get('[data-testid="studybook-list"]').should('have.attr', 'role', 'list');
      cy.get('[data-testid="studybook-item"]').should('have.attr', 'role', 'listitem');
      
      // Check button labels
      cy.get('[data-testid="edit-button"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="delete-button"]').should('have.attr', 'aria-label');
    });
  });

  describe('Performance', () => {
    it('should load study books list efficiently', () => {
      cy.measureLoadTime('[data-testid="studybook-list"]');
    });

    it('should handle large lists efficiently', () => {
      // Mock large dataset
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        id: `${i + 1}`,
        language: 'javascript',
        question: `Question ${i + 1}`,
        explanation: `Explanation ${i + 1}`
      }));
      
      cy.intercept('GET', '**/api/studybooks**', {
        body: {
          content: largeDataset.slice(0, 10),
          totalElements: 100,
          totalPages: 10,
          number: 0
        }
      }).as('largeList');
      
      cy.reload();
      cy.wait('@largeList');
      
      // Should render efficiently
      cy.get('[data-testid="studybook-item"]').should('have.length', 10);
      cy.get('[data-testid="pagination"]').should('be.visible');
    });
  });
});