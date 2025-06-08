/**
 * Basic sanitization utilities for SERINA
 * These functions provide MVP-level protection against common security issues
 */

/**
 * Sanitize text input by removing potentially dangerous characters and limiting length
 */
export const sanitizeTextInput = (input: string, maxLength = 1000): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Remove null bytes and control characters (except newlines and tabs)
  let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
};

/**
 * Sanitize email content for display
 * Removes script tags and other potentially dangerous HTML-like content
 */
export const sanitizeEmailContent = (content: string): string => {
  if (!content || typeof content !== 'string') return '';
  
  // Remove script tags and their content
  let sanitized = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove other potentially dangerous tags
  sanitized = sanitized.replace(/<(iframe|object|embed|form|input|link|style|meta)[^>]*>/gi, '');
  
  // Remove javascript: and data: URLs
  sanitized = sanitized.replace(/javascript:|data:/gi, '');
  
  // Remove on* event handlers
  sanitized = sanitized.replace(/\son\w+\s*=\s*[^>]*/gi, '');
  
  // Basic length limit for email content
  if (sanitized.length > 50000) {
    sanitized = sanitized.substring(0, 50000) + '\n\n[Content truncated for security...]';
  }
  
  return sanitized;
};

/**
 * Sanitize search query input
 */
export const sanitizeSearchQuery = (query: string): string => {
  if (!query || typeof query !== 'string') return '';
  
  // Remove special characters that could be problematic in search
  let sanitized = query.replace(/[<>\"']/g, '');
  
  // Trim and limit length
  sanitized = sanitized.trim();
  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 100);
  }
  
  return sanitized;
};

/**
 * Sanitize API key input
 */
export const sanitizeApiKey = (apiKey: string): string => {
  if (!apiKey || typeof apiKey !== 'string') return '';
  
  // Remove whitespace and limit to reasonable API key length
  let sanitized = apiKey.trim();
  
  // Most API keys are under 200 characters
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 200);
  }
  
  // Remove any obviously bad characters
  sanitized = sanitized.replace(/[<>\"']/g, '');
  
  return sanitized;
};

/**
 * Sanitize file paths (for potential future use)
 */
export const sanitizeFilePath = (path: string): string => {
  if (!path || typeof path !== 'string') return '';
  
  // Remove path traversal attempts and dangerous characters
  let sanitized = path.replace(/\.\./g, '');
  sanitized = sanitized.replace(/[<>:\"|?*]/g, '');
  
  return sanitized.trim();
};

/**
 * Basic validation for email addresses
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length < 254;
};

/**
 * Sanitize JSON input before parsing (basic check)
 */
export const sanitizeJsonInput = (jsonString: string): string => {
  if (!jsonString || typeof jsonString !== 'string') return '{}';
  
  // Basic length check
  if (jsonString.length > 100000) {
    throw new Error('JSON input too large');
  }
  
  // Remove potential script injections in JSON
  let sanitized = jsonString.replace(/<script[^>]*>.*?<\/script>/gi, '');
  
  return sanitized;
};

/**
 * Safe JSON parse with error handling
 */
export const safeJsonParse = (jsonString: string, fallback: any = null): any => {
  try {
    const sanitized = sanitizeJsonInput(jsonString);
    return JSON.parse(sanitized);
  } catch (error) {
    console.warn('Failed to parse JSON safely:', error);
    return fallback;
  }
};