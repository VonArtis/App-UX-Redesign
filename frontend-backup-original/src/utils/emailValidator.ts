// Smart email validation with typo suggestions

export interface EmailValidationResult {
  isValid: boolean;
  suggestion?: string;
  message?: string;
  type: 'valid' | 'invalid' | 'suggestion' | 'warning';
}

const COMMON_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com',
  'protonmail.com', 'aol.com', 'live.com', 'msn.com', 'mail.com'
];

const BUSINESS_DOMAINS = [
  'company.com', 'corp.com', 'business.com', 'enterprise.com'
];

/**
 * Calculate Levenshtein distance between two strings
 */
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + cost // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
};

/**
 * Find the closest domain suggestion
 */
const suggestDomain = (domain: string): string | null => {
  const allDomains = [...COMMON_DOMAINS, ...BUSINESS_DOMAINS];
  
  let bestMatch = null;
  let minDistance = Infinity;
  
  for (const commonDomain of allDomains) {
    const distance = levenshteinDistance(domain.toLowerCase(), commonDomain);
    
    // Only suggest if the distance is small and reasonable
    if (distance < minDistance && distance <= 2 && distance > 0) {
      minDistance = distance;
      bestMatch = commonDomain;
    }
  }
  
  return bestMatch;
};

/**
 * Validate email with smart suggestions
 */
export const validateEmailSmart = (email: string): EmailValidationResult => {
  // Basic format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email.trim()) {
    return {
      isValid: false,
      message: 'Email is required',
      type: 'invalid'
    };
  }
  
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      message: 'Please enter a valid email address',
      type: 'invalid'
    };
  }
  
  // Extract domain
  const [localPart, domain] = email.split('@');
  
  if (!domain) {
    return {
      isValid: false,
      message: 'Please enter a valid email address',
      type: 'invalid'
    };
  }
  
  // Check for common typos in domain
  const suggestion = suggestDomain(domain);
  if (suggestion) {
    return {
      isValid: true, // Still valid, but suggest correction
      suggestion: `${localPart}@${suggestion}`,
      message: `Did you mean ${localPart}@${suggestion}?`,
      type: 'suggestion'
    };
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /^[0-9]+@/, // All numbers in local part
    /@[0-9]+\./,  // Numbers in domain
    /\.{2,}/, // Multiple dots
    /@.*@/, // Multiple @ symbols
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(email)) {
      return {
        isValid: false,
        message: 'Please check your email format',
        type: 'invalid'
      };
    }
  }
  
  // Check domain length and format
  if (domain.length < 4) {
    return {
      isValid: false,
      message: 'Domain name seems too short',
      type: 'invalid'
    };
  }
  
  if (!domain.includes('.')) {
    return {
      isValid: false,
      message: 'Please include a valid domain (e.g., .com, .org)',
      type: 'invalid'
    };
  }
  
  // Warn about temporary/disposable email domains
  const disposableDomains = [
    '10minutemail.com', 'tempmail.org', 'guerrillamail.com', 
    'mailinator.com', 'throwaway.email'
  ];
  
  if (disposableDomains.includes(domain.toLowerCase())) {
    return {
      isValid: true,
      message: 'Temporary email detected. You may miss important notifications.',
      type: 'warning'
    };
  }
  
  return {
    isValid: true,
    type: 'valid'
  };
};

/**
 * Real-time email validation as user types
 */
export const validateEmailRealtime = (email: string): EmailValidationResult => {
  if (email.length === 0) {
    return { isValid: true, type: 'valid' };
  }
  
  if (email.length < 3) {
    return { isValid: false, type: 'invalid' };
  }
  
  // Don't validate incomplete emails
  if (!email.includes('@')) {
    return { isValid: true, type: 'valid' }; // Don't show error yet
  }
  
  return validateEmailSmart(email);
};