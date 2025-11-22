// ***********************************************************
// This example support/component.js is processed and
// loaded automatically before your component test files.
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

// Import global styles for component testing
import '../../Rct/css/_common.css';

// Mount function for component testing
import { mount } from 'cypress/support/mount';

// Add custom mount command
Cypress.Commands.add('mount', mount);

// Component testing utilities
Cypress.Commands.add('mountComponent', (component, options = {}) => {
  const defaultOptions = {
    props: {},
    slots: {},
    global: {
      stubs: {},
      mocks: {}
    }
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  return cy.mount(component, mergedOptions);
});

// Mock dependencies for component testing
Cypress.Commands.add('mockEventBus', () => {
  return {
    emit: cy.stub(),
    on: cy.stub(),
    off: cy.stub()
  };
});

Cypress.Commands.add('mockApiService', () => {
  return {
    get: cy.stub(),
    post: cy.stub(),
    put: cy.stub(),
    delete: cy.stub()
  };
});

// Component interaction helpers
Cypress.Commands.add('triggerEvent', (selector, eventName, eventData = {}) => {
  cy.get(selector).trigger(eventName, eventData);
});

Cypress.Commands.add('typeInComponent', (selector, text, options = {}) => {
  cy.get(selector).clear().type(text, options);
});

// Visual testing helpers for components
Cypress.Commands.add('matchComponentSnapshot', (name, options = {}) => {
  const defaultOptions = {
    threshold: 0.1,
    thresholdType: 'percent'
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  cy.screenshot(`component-${name}`, mergedOptions);
});

// Accessibility testing for components
Cypress.Commands.add('checkComponentA11y', (options = {}) => {
  cy.injectAxe();
  cy.checkA11y(null, options);
});

// Performance testing for components
Cypress.Commands.add('measureComponentRender', (componentName) => {
  cy.window().then((win) => {
    const startTime = win.performance.now();
    
    return cy.then(() => {
      const endTime = win.performance.now();
      const renderTime = endTime - startTime;
      
      cy.log(`${componentName} render time: ${renderTime.toFixed(2)}ms`);
      
      // Assert reasonable render time
      expect(renderTime).to.be.lessThan(100); // 100ms max for component render
    });
  });
});

// Component state testing
Cypress.Commands.add('getComponentState', (component) => {
  return cy.wrap(component).its('state');
});

Cypress.Commands.add('setComponentState', (component, state) => {
  return cy.wrap(component).invoke('setState', state);
});

// Error boundary testing
Cypress.Commands.add('triggerComponentError', (errorMessage = 'Test error') => {
  cy.window().then((win) => {
    throw new Error(errorMessage);
  });
});

// Responsive testing for components
Cypress.Commands.add('testComponentResponsive', (breakpoints = [320, 768, 1024, 1440]) => {
  breakpoints.forEach(width => {
    cy.viewport(width, 720);
    cy.matchComponentSnapshot(`responsive-${width}px`);
  });
});

// Component cleanup
Cypress.Commands.add('unmountComponent', () => {
  cy.get('[data-cy-root]').should('not.exist');
});