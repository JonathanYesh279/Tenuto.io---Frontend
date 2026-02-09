/**
 * Security Utilities
 * 
 * Comprehensive security validation, encryption, and utility functions
 * for the cascade deletion system with Hebrew support.
 */

import { securityAuditService } from '../services/securityAuditService';

// Security validation interfaces
export interface DeletionPermissionValidation {
  isValid: boolean;
  userId: string;
  studentId: string;
  scope: 'own' | 'limited' | 'full';
  violations: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface RateLimitValidation {
  isAllowed: boolean;
  action: 'single' | 'bulk' | 'cleanup';
  currentCount: number;
  maxAllowed: number;
  resetTime: Date;
  timeUntilReset: number;
}

export interface SecurityTokenValidation {
  isValid: boolean;
  token: string;
  operation: string;
  expiresAt: Date;
  timeRemaining: number;
  scope: 'single' | 'bulk' | 'cascade' | 'cleanup';
}

export interface SuspiciousActivityPattern {
  detected: boolean;
  patternType: 'rapid_deletions' | 'failed_auth' | 'unusual_hours' | 'permission_escalation' | 'bulk_after_hours';
  riskScore: number;
  evidence: Array<{
    timestamp: Date;
    action: string;
    metadata: any;
  }>;
  recommendation: 'monitor' | 'warn' | 'restrict' | 'lock';
}

export interface EncryptedData {
  data: string;
  iv: string;
  salt: string;
  algorithm: string;
  keyId: string;
}

// Hebrew error messages
const HEBREW_ERRORS = {
  validation: {
    invalid_user: 'משתמש לא תקין',
    invalid_student: 'מזהה תלמיד לא תקין',
    insufficient_permissions: 'הרשאות לא מספיקות',
    rate_limit_exceeded: 'חרגת מהמגבלה',
    token_expired: 'אסימון פג תוקף',
    suspicious_activity: 'זוהתה פעילות חשודה',
    session_expired: 'תוקף ההפעלה פג',
    encryption_failed: 'הצפנה נכשלה',
    decryption_failed: 'פענוח נכשל',
    invalid_input: 'קלט לא תקין'
  },
  security: {
    unauthorized_access: 'גישה לא מורשית',
    permission_denied: 'הרשאה נדחתה',
    account_locked: 'חשבון נעול',
    session_hijacking: 'חטיפת הפעלה',
    brute_force_detected: 'זוהתה התקפת כוח גס',
    data_integrity_violation: 'הפרת שלמות נתונים'
  }
};

/**
 * Validate deletion permission for a specific user and student
 */
export async function validateDeletionPermission(
  userId: string,
  studentId: string,
  scope: 'single' | 'bulk' | 'cascade' = 'single'
): Promise<DeletionPermissionValidation> {
  const violations: string[] = [];
  let riskLevel: DeletionPermissionValidation['riskLevel'] = 'low';

  try {
    // Basic input validation
    if (!userId || typeof userId !== 'string') {
      violations.push(HEBREW_ERRORS.validation.invalid_user);
    }

    if (!studentId || typeof studentId !== 'string') {
      violations.push(HEBREW_ERRORS.validation.invalid_student);
    }

    // Check user session validity
    const sessionValid = await checkSessionValidity(userId);
    if (!sessionValid) {
      violations.push(HEBREW_ERRORS.validation.session_expired);
      riskLevel = 'high';
    }

    // Check for suspicious activity patterns
    const suspiciousActivity = await detectSuspiciousPattern(userId);
    if (suspiciousActivity.detected) {
      violations.push(HEBREW_ERRORS.validation.suspicious_activity);
      riskLevel = Math.max(riskLevel === 'low' ? 0 : riskLevel === 'medium' ? 1 : riskLevel === 'high' ? 2 : 3, 
                          suspiciousActivity.riskScore > 7 ? 3 : suspiciousActivity.riskScore > 5 ? 2 : 1) as any;
    }

    // Determine permission scope based on user role (mock implementation)
    const userPermissionScope = await getUserPermissionScope(userId);
    
    // Risk assessment based on operation type
    switch (scope) {
      case 'cascade':
        riskLevel = 'critical';
        if (userPermissionScope !== 'full') {
          violations.push(HEBREW_ERRORS.validation.insufficient_permissions);
        }
        break;
      case 'bulk':
        riskLevel = Math.max(riskLevel === 'low' ? 0 : riskLevel === 'medium' ? 1 : 2, 1) as any;
        if (!['full', 'limited'].includes(userPermissionScope)) {
          violations.push(HEBREW_ERRORS.validation.insufficient_permissions);
        }
        break;
      case 'single':
        if (userPermissionScope === 'none') {
          violations.push(HEBREW_ERRORS.validation.insufficient_permissions);
        }
        break;
    }

    // Log permission check
    await securityAuditService.logPermissionCheck(
      violations.length === 0 ? 'granted' : 'denied',
      {
        userId,
        resource: 'student_deletion',
        requiredPermission: scope,
        studentId,
        denyReason: violations.length > 0 ? violations[0] : undefined,
        permissionScope: userPermissionScope
      }
    );

    const result: DeletionPermissionValidation = {
      isValid: violations.length === 0,
      userId,
      studentId,
      scope: userPermissionScope as any,
      violations,
      riskLevel
    };

    return result;

  } catch (error) {
    console.error('Permission validation error:', error);
    
    await securityAuditService.logSecurityViolation(
      'permission_validation_error',
      {
        userId,
        studentId,
        attemptedAction: `validate_${scope}_deletion`,
        severity: 'medium',
        autoResponse: 'deny_permission'
      }
    );

    return {
      isValid: false,
      userId,
      studentId,
      scope: 'none',
      violations: [HEBREW_ERRORS.validation.invalid_input],
      riskLevel: 'high'
    };
  }
}

/**
 * Check rate limit for deletion operations
 */
export function checkRateLimit(
  action: 'single' | 'bulk' | 'cleanup',
  userId: string,
  currentCounts: Record<string, { count: number; resetTime: Date }>
): RateLimitValidation {
  const limits = {
    single: { max: 5, windowMinutes: 1 },
    bulk: { max: 1, windowMinutes: 5 },
    cleanup: { max: 1, windowMinutes: 60 }
  };

  const limit = limits[action];
  const userLimit = currentCounts[`${userId}_${action}`] || { 
    count: 0, 
    resetTime: new Date(Date.now() + limit.windowMinutes * 60 * 1000) 
  };

  const now = new Date();
  const isAllowed = now >= userLimit.resetTime || userLimit.count < limit.max;
  const timeUntilReset = Math.max(0, userLimit.resetTime.getTime() - now.getTime());

  const validation: RateLimitValidation = {
    isAllowed,
    action,
    currentCount: userLimit.count,
    maxAllowed: limit.max,
    resetTime: userLimit.resetTime,
    timeUntilReset
  };

  // Log rate limit check if exceeded
  if (!isAllowed) {
    securityAuditService.logRateLimitHit(action, {
      userId,
      currentCount: userLimit.count,
      maxAllowed: limit.max,
      resetTime: userLimit.resetTime
    });
  }

  return validation;
}

/**
 * Generate a secure time-limited token for operations
 */
export async function generateSecurityToken(
  operation: string,
  scope: 'single' | 'bulk' | 'cascade' | 'cleanup' = 'single',
  validityMinutes: number = 5
): Promise<{ token: string; expiresAt: Date; tokenId: string }> {
  try {
    // Generate cryptographically secure token
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    
    const expiresAt = new Date(Date.now() + validityMinutes * 60 * 1000);
    const tokenId = crypto.randomUUID();

    // In a real implementation, this would be stored securely server-side
    const tokenData = {
      tokenId,
      token,
      operation,
      scope,
      expiresAt,
      createdAt: new Date(),
      used: false
    };

    // Store in sessionStorage with expiration (client-side only)
    sessionStorage.setItem(tokenId, JSON.stringify(tokenData));

    // Auto-cleanup expired token
    setTimeout(() => {
      sessionStorage.removeItem(tokenId);
    }, validityMinutes * 60 * 1000);

    return { token, expiresAt, tokenId };

  } catch (error) {
    console.error('Token generation error:', error);
    throw new Error(HEBREW_ERRORS.validation.encryption_failed);
  }
}

/**
 * Validate a security token
 */
export function validateSecurityToken(
  tokenId: string,
  providedToken: string
): SecurityTokenValidation {
  try {
    const storedData = sessionStorage.getItem(tokenId);
    
    if (!storedData) {
      return {
        isValid: false,
        token: providedToken,
        operation: '',
        expiresAt: new Date(0),
        timeRemaining: 0,
        scope: 'single'
      };
    }

    const tokenData = JSON.parse(storedData);
    const now = new Date();
    const expiresAt = new Date(tokenData.expiresAt);
    const timeRemaining = Math.max(0, expiresAt.getTime() - now.getTime());

    const isValid = tokenData.token === providedToken && 
                   now <= expiresAt && 
                   !tokenData.used;

    if (isValid) {
      // Mark token as used
      tokenData.used = true;
      sessionStorage.setItem(tokenId, JSON.stringify(tokenData));
    }

    return {
      isValid,
      token: providedToken,
      operation: tokenData.operation,
      expiresAt,
      timeRemaining,
      scope: tokenData.scope
    };

  } catch (error) {
    console.error('Token validation error:', error);
    return {
      isValid: false,
      token: providedToken,
      operation: '',
      expiresAt: new Date(0),
      timeRemaining: 0,
      scope: 'single'
    };
  }
}

/**
 * Detect suspicious activity patterns
 */
export async function detectSuspiciousPattern(
  userId: string,
  recentActions: Array<{ action: string; timestamp: Date; metadata?: any }> = []
): Promise<SuspiciousActivityPattern> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  let riskScore = 0;
  const evidence = [...recentActions];
  const patterns: SuspiciousActivityPattern['patternType'][] = [];

  // Pattern 1: Rapid deletions
  const recentDeletions = recentActions.filter(action => 
    action.action.includes('delete') && 
    action.timestamp >= fiveMinutesAgo
  );

  if (recentDeletions.length >= 10) {
    patterns.push('rapid_deletions');
    riskScore += 4;
  }

  // Pattern 2: Multiple failed authentication attempts
  const failedAuth = recentActions.filter(action => 
    action.action.includes('failed') && 
    action.timestamp >= fiveMinutesAgo
  );

  if (failedAuth.length >= 5) {
    patterns.push('failed_auth');
    riskScore += 3;
  }

  // Pattern 3: Activity during unusual hours (22:00 - 06:00)
  const currentHour = now.getHours();
  const isUnusualHours = currentHour >= 22 || currentHour <= 6;
  
  if (isUnusualHours) {
    const nightActivity = recentActions.filter(action => 
      action.timestamp >= oneHourAgo &&
      (action.action.includes('delete') || action.action.includes('bulk'))
    );

    if (nightActivity.length > 0) {
      patterns.push('unusual_hours');
      riskScore += 2;
    }
  }

  // Pattern 4: Permission escalation attempts
  const permissionAttempts = recentActions.filter(action => 
    action.action.includes('permission') && 
    action.action.includes('denied') &&
    action.timestamp >= fiveMinutesAgo
  );

  if (permissionAttempts.length >= 3) {
    patterns.push('permission_escalation');
    riskScore += 3;
  }

  // Pattern 5: Bulk operations after hours
  if (isUnusualHours) {
    const bulkOperations = recentActions.filter(action => 
      action.action.includes('bulk') && 
      action.timestamp >= oneHourAgo
    );

    if (bulkOperations.length > 0) {
      patterns.push('bulk_after_hours');
      riskScore += 5;
    }
  }

  // Determine recommendation based on risk score
  let recommendation: SuspiciousActivityPattern['recommendation'] = 'monitor';
  if (riskScore >= 8) recommendation = 'lock';
  else if (riskScore >= 5) recommendation = 'restrict';
  else if (riskScore >= 3) recommendation = 'warn';

  const detected = patterns.length > 0;

  if (detected) {
    await securityAuditService.logSuspiciousActivity(
      patterns.join(', '),
      {
        userId,
        activities: evidence,
        riskScore,
        autoAction: recommendation === 'lock' ? 'logout' : 
                   recommendation === 'restrict' ? 'lock' : 'warn'
      }
    );
  }

  return {
    detected,
    patternType: patterns[0] || 'rapid_deletions',
    riskScore,
    evidence,
    recommendation
  };
}

/**
 * Encrypt sensitive student data
 */
export async function encryptSensitiveData(
  data: any,
  keyId: string = 'default'
): Promise<EncryptedData> {
  try {
    const plaintext = JSON.stringify(data);
    
    // Generate random IV and salt
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    // For demo purposes, we'll use a simple encoding
    // In production, this should use proper AES-GCM encryption
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(plaintext);
    
    // Simple XOR "encryption" for demo (NOT for production use)
    const encryptedBytes = new Uint8Array(dataBytes.length);
    for (let i = 0; i < dataBytes.length; i++) {
      encryptedBytes[i] = dataBytes[i] ^ (salt[i % salt.length] + iv[i % iv.length]);
    }

    const encrypted = Array.from(encryptedBytes, byte => 
      byte.toString(16).padStart(2, '0')
    ).join('');

    return {
      data: encrypted,
      iv: Array.from(iv, byte => byte.toString(16).padStart(2, '0')).join(''),
      salt: Array.from(salt, byte => byte.toString(16).padStart(2, '0')).join(''),
      algorithm: 'XOR-Demo', // In production: 'AES-256-GCM'
      keyId
    };

  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error(HEBREW_ERRORS.validation.encryption_failed);
  }
}

/**
 * Decrypt sensitive data
 */
export async function decryptSensitiveData(
  encryptedData: EncryptedData
): Promise<any> {
  try {
    // Convert hex strings back to bytes
    const encrypted = new Uint8Array(
      encryptedData.data.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []
    );
    const iv = new Uint8Array(
      encryptedData.iv.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []
    );
    const salt = new Uint8Array(
      encryptedData.salt.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []
    );

    // Simple XOR "decryption" for demo
    const decryptedBytes = new Uint8Array(encrypted.length);
    for (let i = 0; i < encrypted.length; i++) {
      decryptedBytes[i] = encrypted[i] ^ (salt[i % salt.length] + iv[i % iv.length]);
    }

    const decoder = new TextDecoder();
    const plaintext = decoder.decode(decryptedBytes);
    
    return JSON.parse(plaintext);

  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error(HEBREW_ERRORS.validation.decryption_failed);
  }
}

/**
 * Validate Hebrew text input for type confirmation
 */
export function validateHebrewInput(
  input: string,
  expected: string,
  options: {
    ignoreSpaces?: boolean;
    ignoreCase?: boolean;
    allowNiqqud?: boolean;
  } = {}
): { isValid: boolean; similarity: number; issues: string[] } {
  const issues: string[] = [];
  
  try {
    // Normalize inputs
    let normalizedInput = input.trim();
    let normalizedExpected = expected.trim();

    if (options.ignoreSpaces) {
      normalizedInput = normalizedInput.replace(/\s+/g, '');
      normalizedExpected = normalizedExpected.replace(/\s+/g, '');
    }

    if (!options.allowNiqqud) {
      // Remove Hebrew diacritics (niqqud)
      normalizedInput = normalizedInput.replace(/[\u0591-\u05C7]/g, '');
      normalizedExpected = normalizedExpected.replace(/[\u0591-\u05C7]/g, '');
    }

    // Check for Hebrew characters
    const hebrewRegex = /[\u0590-\u05FF]/;
    if (!hebrewRegex.test(normalizedInput) && hebrewRegex.test(normalizedExpected)) {
      issues.push('הטקסט חייב להכיל אותיות עבריות');
    }

    // Calculate similarity (simple character-by-character comparison)
    const maxLength = Math.max(normalizedInput.length, normalizedExpected.length);
    if (maxLength === 0) {
      return { isValid: false, similarity: 0, issues: ['טקסט ריק'] };
    }

    let matchingChars = 0;
    const minLength = Math.min(normalizedInput.length, normalizedExpected.length);
    
    for (let i = 0; i < minLength; i++) {
      if (normalizedInput[i] === normalizedExpected[i]) {
        matchingChars++;
      }
    }

    const similarity = (matchingChars / maxLength) * 100;
    const isValid = normalizedInput === normalizedExpected;

    if (!isValid && similarity < 80) {
      issues.push('הטקסט אינו תואם למצופה');
    }

    return { isValid, similarity, issues };

  } catch (error) {
    console.error('Hebrew validation error:', error);
    return { 
      isValid: false, 
      similarity: 0, 
      issues: [HEBREW_ERRORS.validation.invalid_input] 
    };
  }
}

/**
 * Sanitize user input to prevent injection attacks
 */
export function sanitizeInput(
  input: string,
  type: 'name' | 'id' | 'search' | 'general' = 'general'
): string {
  if (typeof input !== 'string') {
    return '';
  }

  let sanitized = input.trim();

  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/[<>\"'`]/g, '');
  
  switch (type) {
    case 'name':
      // Allow Hebrew letters, English letters, spaces, hyphens, apostrophes
      sanitized = sanitized.replace(/[^\u0590-\u05FF\u0041-\u005A\u0061-\u007A\s\-']/g, '');
      break;
    case 'id':
      // Allow alphanumeric and hyphens only
      sanitized = sanitized.replace(/[^a-zA-Z0-9\-_]/g, '');
      break;
    case 'search':
      // More permissive for search queries
      sanitized = sanitized.replace(/[^\u0590-\u05FF\u0041-\u005A\u0061-\u007A\u0030-\u0039\s\-_.]/g, '');
      break;
  }

  // Limit length
  const maxLengths = { name: 100, id: 50, search: 200, general: 500 };
  sanitized = sanitized.substring(0, maxLengths[type]);

  return sanitized;
}

// Private helper functions
async function checkSessionValidity(userId: string): Promise<boolean> {
  // Mock implementation - in real app, this would check with the server
  const token = localStorage.getItem('authToken');
  return !!token && token.length > 0;
}

async function getUserPermissionScope(userId: string): Promise<'none' | 'own' | 'limited' | 'full'> {
  // Mock implementation - in real app, this would fetch user permissions
  const user = JSON.parse(localStorage.getItem('userData') || '{}');
  const role = user.role || user.userData?.role;
  
  switch (role) {
    case 'super_admin':
    case 'מנהל עליון':
      return 'full';
    case 'admin':
    case 'מנהל':
      return 'limited';
    case 'teacher':
    case 'מורה':
      return 'own';
    default:
      return 'none';
  }
}

// Export utility functions
export const securityUtils = {
  validateDeletionPermission,
  checkRateLimit,
  generateSecurityToken,
  validateSecurityToken,
  detectSuspiciousPattern,
  encryptSensitiveData,
  decryptSensitiveData,
  validateHebrewInput,
  sanitizeInput,
  HEBREW_ERRORS
};

export default securityUtils;