/**
 * New API Client Implementation
 * This file demonstrates how to migrate from the old API to the new infrastructure
 */

import { initializeLegacyApi } from './infrastructure/index.js';

// Initialize the new API infrastructure with legacy compatibility
const rctApiNew = initializeLegacyApi({
    baseUrl: 'http://localhost:8080/api',
    enableRequestLogging: true,
    enableResponseLogging: true,
    enableErrorLogging: true,
    showErrorMessages: true,
    maxRetries: 2,
    timeout: 10000
});

// Export for global access (maintaining compatibility)
window.rctApiNew = rctApiNew;

// Also provide access to the new infrastructure for advanced usage
window.rctApiInfrastructure = rctApiNew.getNewInfrastructure();

console.log('New RCT API initialized with enhanced infrastructure');

export default rctApiNew;