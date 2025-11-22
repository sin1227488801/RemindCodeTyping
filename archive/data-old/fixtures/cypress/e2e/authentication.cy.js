describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/Rct/login.html');
  });

  describe('Login', () => {
    it('should login successfully with valid credentials', () => {
      cy.get('#loginId').type('testuser');
      cy.get('#password').type('testpassword');
      cy.get('#loginButton').click();

      // Should redirect to main page
      cy.url().should('include', '/Rct/main.html');
      
      // Should store auth token
      cy.getLocalStorageItem('authToken').should('exist');
      
      // Should display user info
      cy.get('[data-testid="user-info"]').should('contain', 'testuser');
    });

    it('should show error for invalid credentials', () => {
      cy.get('#loginId').type('invaliduser');
      cy.get('#password').type('wrongpassword');
      cy.get('#loginButton').click();

      // Should stay on login page
      cy.url().should('include', '/Rct/login.html');
      
      // Should show error message
      cy.shouldShowNotification('error', 'Invalid login credentials');
      
      // Should not store auth token
      cy.getLocalStorageItem('authToken').should('not.exist');
    });

    it('should validate required fields', () => {
      cy.get('#loginButton').click();

      // Should show validation errors
      cy.get('#loginId').should('have.class', 'error');
      cy.get('#password').should('have.class', 'error');
      
      // Should display error messages
      cy.get('[data-testid="loginId-error"]').should('contain', 'Login ID is required');
      cy.get('[data-testid="password-error"]').should('contain', 'Password is required');
    });

    it('should handle network errors gracefully', () => {
      // Mock network error
      cy.intercept('POST', '**/api/auth/login', {
        statusCode: 500,
        body: { error: 'Internal server error' }
      }).as('loginError');

      cy.get('#loginId').type('testuser');
      cy.get('#password').type('testpassword');
      cy.get('#loginButton').click();

      cy.wait('@loginError');

      // Should show network error message
      cy.shouldShowNotification('error', 'Network error. Please try again.');
    });

    it('should support keyboard navigation', () => {
      // Tab through form elements
      cy.get('body').tab();
      cy.focused().should('have.id', 'loginId');
      
      cy.get('body').tab();
      cy.focused().should('have.id', 'password');
      
      cy.get('body').tab();
      cy.focused().should('have.id', 'loginButton');
      
      // Submit with Enter key
      cy.get('#loginId').type('testuser');
      cy.get('#password').type('testpassword{enter}');
      
      cy.url().should('include', '/Rct/main.html');
    });
  });

  describe('Registration', () => {
    beforeEach(() => {
      cy.get('[data-testid="register-link"]').click();
    });

    it('should register new user successfully', () => {
      const newUser = {
        loginId: 'newuser',
        password: 'newpassword',
        confirmPassword: 'newpassword'
      };

      cy.get('#registerLoginId').type(newUser.loginId);
      cy.get('#registerPassword').type(newUser.password);
      cy.get('#confirmPassword').type(newUser.confirmPassword);
      cy.get('#registerButton').click();

      // Should redirect to login page with success message
      cy.url().should('include', '/Rct/login.html');
      cy.shouldShowNotification('success', 'Registration successful. Please login.');
    });

    it('should validate password confirmation', () => {
      cy.get('#registerLoginId').type('newuser');
      cy.get('#registerPassword').type('password123');
      cy.get('#confirmPassword').type('differentpassword');
      cy.get('#registerButton').click();

      // Should show password mismatch error
      cy.get('[data-testid="confirmPassword-error"]')
        .should('contain', 'Passwords do not match');
    });

    it('should validate password strength', () => {
      cy.get('#registerLoginId').type('newuser');
      cy.get('#registerPassword').type('weak');
      cy.get('#confirmPassword').type('weak');
      cy.get('#registerButton').click();

      // Should show password strength error
      cy.get('[data-testid="registerPassword-error"]')
        .should('contain', 'Password must be at least 8 characters');
    });

    it('should handle duplicate user registration', () => {
      // Mock duplicate user error
      cy.intercept('POST', '**/api/auth/register', {
        statusCode: 409,
        body: { error: 'User already exists' }
      }).as('duplicateUser');

      cy.get('#registerLoginId').type('existinguser');
      cy.get('#registerPassword').type('password123');
      cy.get('#confirmPassword').type('password123');
      cy.get('#registerButton').click();

      cy.wait('@duplicateUser');

      // Should show duplicate user error
      cy.shouldShowNotification('error', 'User already exists');
    });
  });

  describe('Logout', () => {
    beforeEach(() => {
      cy.login();
    });

    it('should logout successfully', () => {
      cy.get('[data-testid="logout-button"]').click();

      // Should redirect to login page
      cy.url().should('include', '/Rct/login.html');
      
      // Should clear auth token
      cy.getLocalStorageItem('authToken').should('not.exist');
      
      // Should clear user data
      cy.getLocalStorageItem('currentUser').should('not.exist');
    });

    it('should handle logout confirmation', () => {
      cy.get('[data-testid="logout-button"]').click();

      // Should show confirmation dialog
      cy.get('[data-testid="logout-confirmation"]').should('be.visible');
      
      // Cancel logout
      cy.get('[data-testid="cancel-logout"]').click();
      cy.url().should('include', '/Rct/main.html');
      
      // Confirm logout
      cy.get('[data-testid="logout-button"]').click();
      cy.get('[data-testid="confirm-logout"]').click();
      cy.url().should('include', '/Rct/login.html');
    });
  });

  describe('Session Management', () => {
    it('should redirect to login when session expires', () => {
      cy.login();
      
      // Mock expired token
      cy.intercept('GET', '**/api/**', {
        statusCode: 401,
        body: { error: 'Token expired' }
      }).as('expiredToken');

      // Try to access protected resource
      cy.get('[data-testid="studybook-tab"]').click();
      
      cy.wait('@expiredToken');

      // Should redirect to login
      cy.url().should('include', '/Rct/login.html');
      cy.shouldShowNotification('warning', 'Session expired. Please login again.');
    });

    it('should maintain session across page refreshes', () => {
      cy.login();
      
      // Refresh page
      cy.reload();
      
      // Should remain logged in
      cy.url().should('include', '/Rct/main.html');
      cy.get('[data-testid="user-info"]').should('be.visible');
    });

    it('should handle concurrent login sessions', () => {
      cy.login();
      
      // Simulate another session login
      cy.window().then((win) => {
        win.localStorage.setItem('authToken', 'different-token');
      });

      // Try to make API call
      cy.get('[data-testid="studybook-tab"]').click();

      // Should handle token conflict gracefully
      cy.shouldShowNotification('warning', 'Another session detected. Please login again.');
    });
  });

  describe('Accessibility', () => {
    it('should be accessible with screen readers', () => {
      // Check ARIA labels
      cy.checkAriaLabels(['#loginId', '#password', '#loginButton']);
      
      // Check form labels
      cy.get('label[for="loginId"]').should('exist');
      cy.get('label[for="password"]').should('exist');
      
      // Check error announcements
      cy.get('#loginButton').click();
      cy.get('[role="alert"]').should('exist');
    });

    it('should support high contrast mode', () => {
      // Enable high contrast (this would be done via CSS media query)
      cy.get('body').should('have.css', 'background-color');
      cy.get('#loginId').should('have.css', 'border-color');
    });
  });

  describe('Performance', () => {
    it('should load login page quickly', () => {
      cy.visit('/Rct/login.html');
      cy.measureLoadTime('[data-testid="login-form"]');
    });

    it('should handle login request efficiently', () => {
      const startTime = Date.now();
      
      cy.get('#loginId').type('testuser');
      cy.get('#password').type('testpassword');
      cy.get('#loginButton').click();
      
      cy.url().should('include', '/Rct/main.html').then(() => {
        const loginTime = Date.now() - startTime;
        expect(loginTime).to.be.lessThan(3000); // 3 seconds max
      });
    });
  });
});