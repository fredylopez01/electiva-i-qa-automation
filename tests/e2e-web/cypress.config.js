const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_baseUrl || 'https://demo.prestashop.com',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    video: true,
    viewportWidth: 1440,
    viewportHeight: 900,
    // El demo tarda en crear una tienda temporal y cargar scripts dentro del iframe.
    defaultCommandTimeout: 15000,
    pageLoadTimeout: 120000,
    requestTimeout: 30000,
    retries: {
      runMode: 2,
      openMode: 0,
    },
  },
})
