/**
 * Frontend Configuration
 * Author: Brian Letort
 * Created: 2025
 * 
 * This file centralizes all configuration settings for the frontend application.
 * It demonstrates proper configuration management using environment variables
 * with sensible defaults for development and production environments.
 * 
 * Configuration Features:
 * - Environment-based API URL configuration
 * - Centralized endpoint management
 * - Application-wide settings
 * - Debug logging for development
 * 
 * Best Practices Demonstrated:
 * - Environment variable usage with fallbacks
 * - Centralized configuration management
 * - Clear separation of concerns
 * - Development vs production configuration
 * 
 * Author: Brian Letort
 * License: MIT
 */

// ========================================
// API CONFIGURATION
// ========================================

/**
 * Base API URL configuration
 * Uses environment variable with localhost fallback for development
 * 
 * In production, set REACT_APP_API_URL to your backend URL
 * Example: REACT_APP_API_URL=https://api.yourdomain.com
 */
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// ========================================
// DEBUG LOGGING
// ========================================
// Log configuration details for development debugging
// This helps identify configuration issues during development

console.log('🔧 Frontend Configuration Loaded:');
console.log('  - Environment:', process.env.NODE_ENV);
console.log('  - REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('  - Resolved API_BASE_URL:', API_BASE_URL);
console.log('  - Built by: Brian Letort');

// ========================================
// API ENDPOINTS
// ========================================
/**
 * Centralized API endpoint definitions
 * 
 * This approach provides:
 * - Single source of truth for all API endpoints
 * - Easy maintenance when endpoints change
 * - Type safety and autocomplete in IDEs
 * - Consistent URL construction
 */
export const API_ENDPOINTS = {
  // Chat endpoint for AI interactions
  CHAT: `${API_BASE_URL}/api/v1/chat`,
  
  // Analytics endpoint for session data
  SESSIONS: `${API_BASE_URL}/sessions`,
  
  // Health check endpoint for monitoring
  HEALTH: `${API_BASE_URL}/health`,
  
  // Database test endpoint for diagnostics
  DB_TEST: `${API_BASE_URL}/db-test`
};

// ========================================
// APPLICATION CONFIGURATION
// ========================================
/**
 * Application-wide configuration settings
 * 
 * These settings control various aspects of the application behavior
 * and can be easily modified without changing component code
 */
export const APP_CONFIG = {
  // Maximum length for chat messages
  MAX_MESSAGE_LENGTH: 1000,
  
  // Delay before auto-scrolling to new messages (milliseconds)
  AUTO_SCROLL_DELAY: 100,
  
  // Interval for refreshing analytics data (milliseconds)
  REFRESH_INTERVAL: 30000, // 30 seconds
  
  // Application metadata
  APP_NAME: 'AI Chat with Telemetry',
  APP_VERSION: '1.0.0',
  AUTHOR: 'Brian Letort',
  
  // UI Configuration
  THEME: {
    PRIMARY_COLOR: '#4f46e5',
    SUCCESS_COLOR: '#10b981',
    WARNING_COLOR: '#f59e0b',
    ERROR_COLOR: '#ef4444',
    NEUTRAL_COLOR: '#6b7280'
  },
  
  // Feature flags for enabling/disabling functionality
  FEATURES: {
    ANALYTICS_ENABLED: true,
    AUTO_REFRESH: true,
    DEBUG_MODE: process.env.NODE_ENV === 'development',
    TELEMETRY_DISPLAY: true
  }
};

// ========================================
// VALIDATION
// ========================================
/**
 * Configuration validation
 * Ensures required configuration is present and valid
 */
const validateConfig = () => {
  const errors = [];
  
  // Validate API base URL
  if (!API_BASE_URL) {
    errors.push('API_BASE_URL is not configured');
  }
  
  // Validate URL format
  try {
    new URL(API_BASE_URL);
  } catch (e) {
    errors.push(`Invalid API_BASE_URL format: ${API_BASE_URL}`);
  }
  
  // Log validation results
  if (errors.length > 0) {
    console.error('❌ Configuration validation failed:');
    errors.forEach(error => console.error(`  - ${error}`));
  } else {
    console.log('✅ Configuration validation passed');
  }
  
  return errors.length === 0;
};

// Run validation on module load
validateConfig();

// ========================================
// EXPORTS
// ========================================
/**
 * Default export with all configuration
 * Provides a single object with all configuration for easy importing
 */
export default {
  API_BASE_URL,
  API_ENDPOINTS,
  APP_CONFIG
}; 