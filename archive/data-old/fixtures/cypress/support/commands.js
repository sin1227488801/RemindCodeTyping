// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Authentication commands
Cypress.Commands.add('loginAsUser', (userType = 'regular') => {
  const users = {
    regular: { loginId: 'testuser', password: 'testpassword' },
    admin: { loginId: 'admin', password: 'adminpassword' },
    guest: { loginId: 'guest', password: 'guestpassword' }
  };
  
  const user = users[userType];
  cy.login(user.loginId, user.password);
});

// Form interaction commands
Cypress.Commands.add('fillStudyBookForm', (data) => {
  if (data.language) {
    cy.get('#language-select').select(data.language);
  }
  if (data.question) {
    cy.get('#question-input').clear().type(data.question);
  }
  if (data.explanation) {
    cy.get('#explanation-input').clear().type(data.explanation);
  }
});

Cypress.Commands.add('submitForm', (formSelector = 'form') => {
  cy.get(formSelector).submit();
});

// Navigation commands
Cypress.Commands.add('navigateToTab', (tabName) => {
  const tabSelectors = {
    studybook: '[data-testid="studybook-tab"]',
    typing: '[data-testid="typing-tab"]',
    records: '[data-testid="records-tab"]'
  };
  
  cy.get(tabSelectors[tabName]).click();
});

// Wait commands
Cypress.Commands.add('waitForPageLoad', () => {
  cy.window().its('document.readyState').should('equal', 'complete');
});

Cypress.Commands.add('waitForApiResponse', (alias, timeout = 10000) => {
  cy.wait(alias, { timeout });
});

// Assertion commands
Cypress.Commands.add('shouldShowNotification', (type, message) => {
  cy.get(`[data-testid="notification-${type}"]`)
    .should('be.visible')
    .and('contain', message);
});

Cypress.Commands.add('shouldBeOnPage', (pageName) => {
  const pageUrls = {
    login: '/Rct/login.html',
    main: '/Rct/main.html',
    typing: '/Rct/typing.html'
  };
  
  cy.url().should('include', pageUrls[pageName]);
});

// Local storage commands
Cypress.Commands.add('clearLocalStorage', () => {
  cy.window().then((win) => {
    win.localStorage.clear();
  });
});

Cypress.Commands.add('setLocalStorageItem', (key, value) => {
  cy.window().then((win) => {
    win.localStorage.setItem(key, JSON.stringify(value));
  });
});

Cypress.Commands.add('getLocalStorageItem', (key) => {
  return cy.window().then((win) => {
    const item = win.localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  });
});

// Error handling commands
Cypress.Commands.add('expectError', (errorMessage) => {
  cy.get('[data-testid="error-message"]')
    .should('be.visible')
    .and('contain', errorMessage);
});

Cypress.Commands.add('expectNoErrors', () => {
  cy.get('[data-testid="error-message"]').should('not.exist');
});

// Performance commands
Cypress.Commands.add('measureLoadTime', (elementSelector) => {
  const startTime = Date.now();
  
  cy.get(elementSelector).should('be.visible').then(() => {
    const loadTime = Date.now() - startTime;
    cy.log(`Load time: ${loadTime}ms`);
    
    // Assert reasonable load time
    expect(loadTime).to.be.lessThan(2000);
  });
});

// Accessibility commands
Cypress.Commands.add('checkKeyboardNavigation', (selectors) => {
  selectors.forEach((selector, index) => {
    cy.get('body').tab();
    cy.focused().should('match', selector);
  });
});

Cypress.Commands.add('checkAriaLabels', (selectors) => {
  selectors.forEach(selector => {
    cy.get(selector).should('have.attr', 'aria-label');
  });
});