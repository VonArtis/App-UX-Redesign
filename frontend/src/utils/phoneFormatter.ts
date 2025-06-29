// Phone number formatting utilities for international numbers

export interface CountryPhoneFormat {
  code: string;
  flag: string;
  name: string;
  dialCode: string;
  format: string; // Pattern for formatting
  maxLength: number;
}

export const PHONE_FORMATS: Record<string, CountryPhoneFormat> = {
  '+1': {
    code: 'US',
    flag: '🇺🇸',
    name: 'United States',
    dialCode: '+1',
    format: '(###) ###-####',
    maxLength: 10
  },
  '+44': {
    code: 'GB',
    flag: '🇬🇧',
    name: 'United Kingdom',
    dialCode: '+44',
    format: '#### ### ####',
    maxLength: 10
  },
  '+33': {
    code: 'FR',
    flag: '🇫🇷',
    name: 'France',
    dialCode: '+33',
    format: '## ## ## ## ##',
    maxLength: 10
  },
  '+49': {
    code: 'DE',
    flag: '🇩🇪',
    name: 'Germany',
    dialCode: '+49',
    format: '### ### ####',
    maxLength: 11
  },
  '+34': {
    code: 'ES',
    flag: '🇪🇸',
    name: 'Spain',
    dialCode: '+34',
    format: '### ### ###',
    maxLength: 9
  },
  '+39': {
    code: 'IT',
    flag: '🇮🇹',
    name: 'Italy',
    dialCode: '+39',
    format: '### ### ####',
    maxLength: 10
  },
  '+91': {
    code: 'IN',
    flag: '🇮🇳',
    name: 'India',
    dialCode: '+91',
    format: '##### #####',
    maxLength: 10
  },
  '+86': {
    code: 'CN',
    flag: '🇨🇳',
    name: 'China',
    dialCode: '+86',
    format: '### #### ####',
    maxLength: 11
  },
  '+81': {
    code: 'JP',
    flag: '🇯🇵',
    name: 'Japan',
    dialCode: '+81',
    format: '## #### ####',
    maxLength: 10
  }
};

/**
 * Format phone number based on country code
 */
export const formatPhoneNumber = (number: string, countryCode: string): string => {
  // Remove all non-numeric characters
  const cleaned = number.replace(/\D/g, '');
  
  const format = PHONE_FORMATS[countryCode];
  if (!format) {
    // Default formatting: add spaces every 3-4 digits
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  }
  
  // Apply country-specific formatting
  let formatted = '';
  let cleanedIndex = 0;
  
  for (let i = 0; i < format.format.length && cleanedIndex < cleaned.length; i++) {
    if (format.format[i] === '#') {
      formatted += cleaned[cleanedIndex];
      cleanedIndex++;
    } else {
      formatted += format.format[i];
    }
  }
  
  return formatted;
};

/**
 * Validate phone number for specific country
 */
export const validatePhoneNumber = (number: string, countryCode: string): { isValid: boolean; message?: string } => {
  const cleaned = number.replace(/\D/g, '');
  const format = PHONE_FORMATS[countryCode];
  
  if (!format) {
    // Generic validation
    if (cleaned.length < 7) {
      return { isValid: false, message: 'Phone number too short' };
    }
    if (cleaned.length > 15) {
      return { isValid: false, message: 'Phone number too long' };
    }
    return { isValid: true };
  }
  
  // Country-specific validation
  if (cleaned.length < format.maxLength) {
    return { 
      isValid: false, 
      message: `${format.name} phone numbers should be ${format.maxLength} digits` 
    };
  }
  
  if (cleaned.length > format.maxLength) {
    return { 
      isValid: false, 
      message: `${format.name} phone numbers should be ${format.maxLength} digits` 
    };
  }
  
  return { isValid: true };
};

/**
 * Clean phone number for API submission
 */
export const cleanPhoneNumber = (number: string): string => {
  return number.replace(/\D/g, '');
};

/**
 * Detect country code from phone number
 */
export const detectCountryCode = (number: string): string | null => {
  const cleaned = number.replace(/\D/g, '');
  
  // Check common country codes by length and prefix
  for (const [code, format] of Object.entries(PHONE_FORMATS)) {
    const dialCodeDigits = format.dialCode.replace('+', '');
    if (cleaned.startsWith(dialCodeDigits)) {
      return code;
    }
  }
  
  return null;
};

/**
 * Get user's likely country code based on browser locale and language
 */
export const getUserCountryCode = (): string => {
  try {
    // Try to detect from browser language
    const language = navigator.language || 'en-US';
    const locale = language.toLowerCase();
    
    // Language to country code mapping
    const localeMap: Record<string, string> = {
      'en-us': '+1',    // English (US)
      'en-ca': '+1',    // English (Canada) 
      'en-gb': '+44',   // English (UK)
      'fr-fr': '+33',   // French (France)
      'fr-ca': '+1',    // French (Canada)
      'de-de': '+49',   // German (Germany)
      'es-es': '+34',   // Spanish (Spain)
      'es-mx': '+52',   // Spanish (Mexico)
      'it-it': '+39',   // Italian (Italy)
      'pt-br': '+55',   // Portuguese (Brazil)
      'pt-pt': '+351',  // Portuguese (Portugal)
      'ru-ru': '+7',    // Russian (Russia)
      'zh-cn': '+86',   // Chinese (China)
      'ja-jp': '+81',   // Japanese (Japan)
      'ko-kr': '+82',   // Korean (South Korea)
      'hi-in': '+91',   // Hindi (India)
      'ar-sa': '+966',  // Arabic (Saudi Arabia)
      'tr-tr': '+90',   // Turkish (Turkey)
      'pl-pl': '+48',   // Polish (Poland)
      'nl-nl': '+31'    // Dutch (Netherlands)
    };
    
    // Check exact locale match first
    if (localeMap[locale]) {
      return localeMap[locale];
    }
    
    // Check language prefix (e.g., 'fr' from 'fr-fr')
    const languagePrefix = locale.split('-')[0];
    const languageMap: Record<string, string> = {
      'en': '+1',   // English -> US default
      'fr': '+33',  // French -> France
      'de': '+49',  // German -> Germany
      'es': '+34',  // Spanish -> Spain
      'it': '+39',  // Italian -> Italy
      'pt': '+351', // Portuguese -> Portugal
      'ru': '+7',   // Russian -> Russia
      'zh': '+86',  // Chinese -> China
      'ja': '+81',  // Japanese -> Japan
      'ko': '+82',  // Korean -> South Korea
      'hi': '+91',  // Hindi -> India
      'ar': '+966', // Arabic -> Saudi Arabia
      'tr': '+90',  // Turkish -> Turkey
      'pl': '+48',  // Polish -> Poland
      'nl': '+31'   // Dutch -> Netherlands
    };
    
    return languageMap[languagePrefix] || '+1'; // Default to US
  } catch {
    return '+1'; // Fallback to US
  }
};

// Smart country detection using IP geolocation
export const detectCountryFromIP = async (): Promise<{
  countryCode: string;
  countryName: string;
  detected: boolean;
  method: 'ip' | 'language' | 'fallback';
}> => {
  try {
    // Try IP-based geolocation first
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    try {
      const response = await fetch('https://ipapi.co/json/', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    
      if (response.ok) {
        const data = await response.json();
        
        // Map country codes to phone codes
        const countryToPhoneMap: Record<string, string> = {
          'US': '+1', 'CA': '+1', 'GB': '+44', 'FR': '+33', 'DE': '+49',
          'ES': '+34', 'IT': '+39', 'BR': '+55', 'PT': '+351', 'RU': '+7',
          'CN': '+86', 'JP': '+81', 'KR': '+82', 'IN': '+91', 'SA': '+966',
          'TR': '+90', 'PL': '+48', 'NL': '+31', 'AR': '+54', 'MX': '+52',
          'AU': '+61', 'BE': '+32', 'CH': '+41', 'AT': '+43', 'SE': '+46',
          'NO': '+47', 'DK': '+45', 'FI': '+358', 'IE': '+353', 'EG': '+20',
          'ZA': '+27', 'NG': '+234', 'TH': '+66', 'VN': '+84', 'MY': '+60',
          'SG': '+65', 'PH': '+63', 'ID': '+62', 'HK': '+852', 'TW': '+886',
          'CL': '+56', 'CO': '+57', 'PE': '+51', 'CZ': '+420', 'HU': '+36',
          'GR': '+30', 'RO': '+40', 'UA': '+380', 'AE': '+971', 'NZ': '+64'
        };
        
        const phoneCode = countryToPhoneMap[data.country_code];
        
        if (phoneCode) {
          return {
            countryCode: phoneCode,
            countryName: data.country_name || 'Unknown',
            detected: true,
            method: 'ip'
          };
        }
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.log('IP detection failed, falling back to language detection:', error);
  }
  
  // Fallback to language-based detection
  const languageBasedCode = getUserCountryCode();
  
  return {
    countryCode: languageBasedCode,
    countryName: 'Detected from browser language',
    detected: languageBasedCode !== '+1', // Assume detection if not default
    method: languageBasedCode !== '+1' ? 'language' : 'fallback'
  };
};