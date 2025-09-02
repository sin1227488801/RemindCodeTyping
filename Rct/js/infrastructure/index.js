/**
 * Infrastructure layer exports
 * Provides centralized access to all infrastructure components
 */

// Error handling
export {
    RctError,
    NetworkError,
    AuthenticationError,
    BusinessError,
    SystemError,
    ErrorHandlerService
} from './errors/index.js';

// Notifications
export { default as NotificationService } from './notifications/NotificationService.js';

// Logging
export { default as Logger } from './logging/Logger.js';

// HTTP and API
export { default as ApiClient } from './http/ApiClient.js';
export { default as ApiClientFactory } from './ApiClientFactory.js';

// Authentication
export { default as TokenManager } from './auth/TokenManager.js';

// API Services
export { default as AuthApiService } from './api/AuthApiService.js';
export { default as StudyBookApiService } from './api/StudyBookApiService.js';
export { default as TypingApiService } from './api/TypingApiService.js';

// Legacy support
export { default as LegacyApiAdapter } from './LegacyApiAdapter.js';