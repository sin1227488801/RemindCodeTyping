import { StudyBookForm } from '../../Rct/js/presentation/components/studybook/StudyBookForm.js';

describe('StudyBookForm Component', () => {
  let mockEventBus;
  let mockContainer;

  beforeEach(() => {
    // Setup DOM container
    cy.get('[data-cy-root]').then(($root) => {
      $root.html(`
        <div id="studybook-form-container">
          <form id="studybook-form">
            <div class="form-group">
              <label for="language-select">Language</label>
              <select id="language-select" required>
                <option value="">Select Language</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
              </select>
              <div class="error-message" id="language-error"></div>
            </div>
            
            <div class="form-group">
              <label for="question-input">Question</label>
              <textarea id="question-input" required placeholder="Enter your code question..."></textarea>
              <div class="error-message" id="question-error"></div>
            </div>
            
            <div class="form-group">
              <label for="explanation-input">Explanation</label>
              <textarea id="explanation-input" placeholder="Optional explanation..."></textarea>
              <div class="error-message" id="explanation-error"></div>
            </div>
            
            <div class="form-actions">
              <button type="submit" id="save-button">Save Study Book</button>
              <button type="button" id="cancel-button">Cancel</button>
              <button type="button" id="clear-button">Clear Form</button>
            </div>
          </form>
        </div>
      `);
      
      mockContainer = $root.find('#studybook-form-container')[0];
    });

    mockEventBus = cy.mockEventBus();
  });

  describe('Component Initialization', () => {
    it('should initialize with empty form', () => {
      const form = new StudyBookForm(mockContainer, mockEventBus);
      form.initialize();

      cy.get('#language-select').should('have.value', '');
      cy.get('#question-input').should('have.value', '');
      cy.get('#explanation-input').should('have.value', '');
    });

    it('should throw error without container', () => {
      expect(() => {
        new StudyBookForm(null, mockEventBus);
      }).to.throw('Container element is required');
    });

    it('should setup event listeners on initialization', () => {
      const form = new StudyBookForm(mockContainer, mockEventBus);
      form.initialize();

      // Check that form has submit listener
      cy.get('#studybook-form').should('exist');
      cy.get('#save-button').should('be.visible');
      cy.get('#cancel-button').should('be.visible');
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      const form = new StudyBookForm(mockContainer, mockEventBus);
      form.initialize();
    });

    it('should validate required fields', () => {
      // Try to submit empty form
      cy.get('#save-button').click();

      // Should show validation errors
      cy.get('#language-error').should('contain', 'Language is required');
      cy.get('#question-error').should('contain', 'Question is required');
      
      // Should add error classes
      cy.get('#language-select').should('have.class', 'error');
      cy.get('#question-input').should('have.class', 'error');
    });

    it('should validate question length', () => {
      // Fill required fields
      cy.get('#language-select').select('javascript');
      
      // Enter very long question
      const longQuestion = 'a'.repeat(1001);
      cy.get('#question-input').type(longQuestion);
      
      cy.get('#save-button').click();

      cy.get('#question-error').should('contain', 'Question must be less than 1000 characters');
    });

    it('should clear validation errors when fixed', () => {
      // Trigger validation error
      cy.get('#save-button').click();
      cy.get('#language-error').should('be.visible');
      
      // Fix the error
      cy.get('#language-select').select('javascript');
      
      // Error should be cleared
      cy.get('#language-error').should('be.empty');
      cy.get('#language-select').should('not.have.class', 'error');
    });

    it('should validate on real-time input', () => {
      // Type in question field
      cy.get('#question-input').type('console.log("test");');
      
      // Should not show error for valid input
      cy.get('#question-error').should('be.empty');
      
      // Clear the field
      cy.get('#question-input').clear();
      
      // Should show error for empty required field
      cy.get('#question-error').should('contain', 'Question is required');
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      const form = new StudyBookForm(mockContainer, mockEventBus);
      form.initialize();
    });

    it('should submit valid form data', () => {
      // Fill form with valid data
      cy.get('#language-select').select('javascript');
      cy.get('#question-input').type('console.log("Hello World");');
      cy.get('#explanation-input').type('Basic console logging');
      
      // Submit form
      cy.get('#save-button').click();

      // Should emit form submission event
      expect(mockEventBus.emit).to.have.been.calledWith('studybook:submit', {
        language: 'javascript',
        question: 'console.log("Hello World");',
        explanation: 'Basic console logging'
      });
    });

    it('should prevent submission with invalid data', () => {
      // Try to submit with missing required fields
      cy.get('#explanation-input').type('Only explanation filled');
      cy.get('#save-button').click();

      // Should not emit submission event
      expect(mockEventBus.emit).not.to.have.been.calledWith('studybook:submit');
    });

    it('should sanitize input data', () => {
      // Fill form with HTML content
      cy.get('#language-select').select('javascript');
      cy.get('#question-input').type('<script>alert("xss")</script>console.log("test");');
      cy.get('#explanation-input').type('<b>Bold</b> explanation');
      
      cy.get('#save-button').click();

      // Should emit sanitized data
      expect(mockEventBus.emit).to.have.been.calledWith('studybook:submit', 
        Cypress.sinon.match({
          question: Cypress.sinon.match((value) => !value.includes('<script>'))
        })
      );
    });
  });

  describe('Form Actions', () => {
    beforeEach(() => {
      const form = new StudyBookForm(mockContainer, mockEventBus);
      form.initialize();
    });

    it('should clear form when clear button is clicked', () => {
      // Fill form
      cy.get('#language-select').select('python');
      cy.get('#question-input').type('print("test")');
      cy.get('#explanation-input').type('Test explanation');
      
      // Clear form
      cy.get('#clear-button').click();
      
      // Should reset all fields
      cy.get('#language-select').should('have.value', '');
      cy.get('#question-input').should('have.value', '');
      cy.get('#explanation-input').should('have.value', '');
    });

    it('should emit cancel event when cancel button is clicked', () => {
      cy.get('#cancel-button').click();

      expect(mockEventBus.emit).to.have.been.calledWith('studybook:cancel');
    });

    it('should show confirmation when cancelling with unsaved changes', () => {
      // Make changes
      cy.get('#question-input').type('Some changes');
      
      // Try to cancel
      cy.get('#cancel-button').click();

      // Should show confirmation (this would be handled by the component)
      expect(mockEventBus.emit).to.have.been.calledWith('studybook:confirm-cancel');
    });
  });

  describe('Data Population', () => {
    let form;

    beforeEach(() => {
      form = new StudyBookForm(mockContainer, mockEventBus);
      form.initialize();
    });

    it('should populate form with existing data', () => {
      const studyBookData = {
        id: '123',
        language: 'python',
        question: 'print("Hello World")',
        explanation: 'Basic printing in Python'
      };

      // Simulate populating form (this would be called by the component)
      form.populateForm(studyBookData);

      cy.get('#language-select').should('have.value', 'python');
      cy.get('#question-input').should('have.value', 'print("Hello World")');
      cy.get('#explanation-input').should('have.value', 'Basic printing in Python');
    });

    it('should handle partial data population', () => {
      const partialData = {
        language: 'java',
        question: 'System.out.println("test");'
        // No explanation
      };

      form.populateForm(partialData);

      cy.get('#language-select').should('have.value', 'java');
      cy.get('#question-input').should('have.value', 'System.out.println("test");');
      cy.get('#explanation-input').should('have.value', '');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      const form = new StudyBookForm(mockContainer, mockEventBus);
      form.initialize();
    });

    it('should have proper labels and ARIA attributes', () => {
      // Check labels
      cy.get('label[for="language-select"]').should('exist');
      cy.get('label[for="question-input"]').should('exist');
      cy.get('label[for="explanation-input"]').should('exist');
      
      // Check ARIA attributes
      cy.get('#language-select').should('have.attr', 'aria-required', 'true');
      cy.get('#question-input').should('have.attr', 'aria-required', 'true');
    });

    it('should support keyboard navigation', () => {
      // Tab through form elements
      cy.get('#language-select').focus().tab();
      cy.focused().should('have.id', 'question-input');
      
      cy.focused().tab();
      cy.focused().should('have.id', 'explanation-input');
      
      cy.focused().tab();
      cy.focused().should('have.id', 'save-button');
    });

    it('should announce validation errors to screen readers', () => {
      // Trigger validation error
      cy.get('#save-button').click();
      
      // Error messages should have proper ARIA attributes
      cy.get('#language-error').should('have.attr', 'role', 'alert');
      cy.get('#question-error').should('have.attr', 'role', 'alert');
    });

    it('should pass accessibility audit', () => {
      cy.checkComponentA11y();
    });
  });

  describe('Visual Regression', () => {
    beforeEach(() => {
      const form = new StudyBookForm(mockContainer, mockEventBus);
      form.initialize();
    });

    it('should match visual snapshot in default state', () => {
      cy.matchComponentSnapshot('studybook-form-default');
    });

    it('should match visual snapshot with validation errors', () => {
      cy.get('#save-button').click();
      cy.matchComponentSnapshot('studybook-form-validation-errors');
    });

    it('should match visual snapshot with populated data', () => {
      cy.get('#language-select').select('javascript');
      cy.get('#question-input').type('console.log("test");');
      cy.get('#explanation-input').type('Test explanation');
      
      cy.matchComponentSnapshot('studybook-form-populated');
    });

    it('should be responsive across different screen sizes', () => {
      cy.testComponentResponsive([320, 768, 1024]);
    });
  });

  describe('Performance', () => {
    it('should render quickly', () => {
      cy.measureComponentRender('StudyBookForm').then(() => {
        const form = new StudyBookForm(mockContainer, mockEventBus);
        form.initialize();
      });
    });

    it('should handle rapid input efficiently', () => {
      const form = new StudyBookForm(mockContainer, mockEventBus);
      form.initialize();

      const rapidText = 'a'.repeat(500);
      
      // Type rapidly
      cy.get('#question-input').type(rapidText, { delay: 0 });
      
      // Should handle input without lag
      cy.get('#question-input').should('have.value', rapidText);
    });
  });

  describe('Error Handling', () => {
    it('should handle component errors gracefully', () => {
      // Simulate component error
      cy.window().then(() => {
        expect(() => {
          cy.triggerComponentError('Test component error');
        }).to.throw();
      });
      
      // Error boundary should catch and display error
      cy.get('.error-boundary').should('be.visible');
    });

    it('should recover from validation errors', () => {
      const form = new StudyBookForm(mockContainer, mockEventBus);
      form.initialize();

      // Trigger validation error
      cy.get('#save-button').click();
      cy.get('#language-error').should('be.visible');
      
      // Fix error
      cy.get('#language-select').select('javascript');
      cy.get('#question-input').type('console.log("test");');
      
      // Should be able to submit successfully
      cy.get('#save-button').click();
      expect(mockEventBus.emit).to.have.been.calledWith('studybook:submit');
    });
  });
});