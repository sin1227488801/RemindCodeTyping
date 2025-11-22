const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8080',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',
    fixturesFolder: 'cypress/fixtures',
    
    // Viewport settings
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Test settings
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    
    // Browser settings
    chromeWebSecurity: false,
    
    setupNodeEvents(on, config) {
      // implement node event listeners here
      
      // Code coverage setup
      require('@cypress/code-coverage/task')(on, config);
      
      return config;
    },
    
    env: {
      // Test environment variables
      apiUrl: 'http://localhost:8081/api',
      testUser: {
        loginId: 'testuser',
        password: 'testpassword'
      },
      coverage: true
    }
  },
  
  component: {
    devServer: {
      framework: 'webpack',
      bundler: 'webpack',
      webpackConfig: require('./webpack.config.js')
    },
    supportFile: 'cypress/support/component.js',
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
    indexHtmlFile: 'cypress/support/component-index.html'
  }
});