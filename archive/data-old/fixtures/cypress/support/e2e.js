// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Import code coverage support
import '@cypress/code-coverage/support';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing on uncaught exceptions
  // that we expect in our error handling tests
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  
  // Let other errors fail the test
  return true;
});

// Custom commands for common test operations
Cypress.Commands.add('login', (loginId = 'testuser', password = 'testpassword') => {
  cy.visit('/Rct/login.html');
  cy.get('#loginId').type(loginId);
  cy.get('#password').type(password);
  cy.get('#loginButton').click();
  
  // Wait for successful login
  cy.url().should('include', '/Rct/main.html');
  cy.window().its('localStorage').invoke('getItem', 'authToken').should('exist');
});

Cypress.Commands.add('logout', () => {
  cy.window().then((win) => {
    win.localStorage.removeItem('authToken');
    win.localStorage.removeItem('currentUser');
  });
  cy.visit('/Rct/login.html');
});

Cypress.Commands.add('createTestStudyBook', (studyBookData = {}) => {
  const defaultData = {
    language: 'javascript',
    question: 'console.log("Hello World");',
    explanation: 'Basic console logging'
  };
  
  const data = { ...defaultData, ...studyBookData };
  
  cy.visit('/Rct/main.html');
  cy.get('[data-testid="studybook-tab"]').click();
  cy.get('[data-testid="create-studybook-btn"]').click();
  
  cy.get('#language-select').select(data.language);
  cy.get('#question-input').type(data.question);
  cy.get('#explanation-input').type(data.explanation);
  cy.get('[data-testid="save-studybook-btn"]').click();
  
  // Wait for success notification
  cy.get('[data-testid="notification"]').should('contain', 'Study book created successfully');
});

Cypress.Commands.add('startTypingSession', (language = 'javascript') => {
  cy.visit('/Rct/main.html');
  cy.get('[data-testid="typing-tab"]').click();
  cy.get('#language-select').select(language);
  cy.get('[data-testid="start-button"]').click();
  
  // Wait for session to start
  cy.get('[data-testid="typing-question"]').should('be.visible');
  cy.get('#typing-input').should('be.visible').and('be.enabled');
});

Cypress.Commands.add('mockApiResponse', (method, url, response, statusCode = 200) => {
  cy.intercept(method, url, {
    statusCode,
    body: response
  }).as(`mock${method}${url.replace(/[^a-zA-Z0-9]/g, '')}`);
});

Cypress.Commands.add('waitForApiCall', (alias) => {
  cy.wait(`@${alias}`);
});

// Accessibility testing commands
Cypress.Commands.add('checkA11y', (context = null, options = {}) => {
  cy.injectAxe();
  cy.checkA11y(context, options);
});

// Visual regression testing commands
Cypress.Commands.add('matchImageSnapshot', (name) => {
  cy.screenshot(name);
  // Note: Actual visual regression testing would require additional plugins
});

// Performance testing commands
Cypress.Commands.add('measurePerformance', (name) => {
  cy.window().then((win) => {
    const navigation = win.performance.getEntriesByType('navigation')[0];
    const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
    
    cy.log(`${name} load time: ${loadTime}ms`);
    
    // Assert performance thresholds
    expect(loadTime).to.be.lessThan(3000); // 3 seconds max
  });
});

// Database cleanup commands for testing
Cypress.Commands.add('cleanupTestData', () => {
  // This would typically make API calls to clean up test data
  cy.request({
    method: 'DELETE',
    url: `${Cypress.env('apiUrl')}/test/cleanup`,
    failOnStatusCode: false
  });
});

// Setup test data
Cypress.Commands.add('seedTestData', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/test/seed`,
    failOnStatusCode: false
  });
});