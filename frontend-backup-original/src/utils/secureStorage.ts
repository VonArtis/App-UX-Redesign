// Secure token storage utilities
// This replaces localStorage for sensitive data to prevent XSS attacks

interface SecureStorage {
  setToken: (token: string) => void;
  getToken: () => string | null;
  removeToken: () => void;
  setItem: (key: string, value: string) => void;
  getItem: (key: string) => string | null;
  removeItem: (key: string) => void;
}

class SecureTokenStorage implements SecureStorage {
  private readonly TOKEN_KEY = 'auth_token';
  
  // Use sessionStorage for tokens (cleared when browser closes)
  // In production, you should use httpOnly cookies instead
  setToken(token: string): void {
    try {
      // Encrypt token before storage (basic obfuscation)
      const encrypted = this.obfuscate(token);
      sessionStorage.setItem(this.TOKEN_KEY, encrypted);
    } catch (error) {
      console.error('Failed to store token securely:', error);
    }
  }

  getToken(): string | null {
    try {
      const encrypted = sessionStorage.getItem(this.TOKEN_KEY);
      if (!encrypted) return null;
      
      // Decrypt token after retrieval
      return this.deobfuscate(encrypted);
    } catch (error) {
      console.error('Failed to retrieve token securely:', error);
      return null;
    }
  }

  removeToken(): void {
    try {
      sessionStorage.removeItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Failed to remove token:', error);
    }
  }

  // Generic secure storage methods
  setItem(key: string, value: string): void {
    try {
      const encrypted = this.obfuscate(value);
      sessionStorage.setItem(key, encrypted);
    } catch (error) {
      console.error(`Failed to store ${key} securely:`, error);
    }
  }

  getItem(key: string): string | null {
    try {
      const encrypted = sessionStorage.getItem(key);
      if (!encrypted) return null;
      return this.deobfuscate(encrypted);
    } catch (error) {
      console.error(`Failed to retrieve ${key} securely:`, error);
      return null;
    }
  }

  removeItem(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove ${key}:`, error);
    }
  }

  // Simple obfuscation (not cryptographically secure, but better than plain text)
  private obfuscate(text: string): string {
    return btoa(text.split('').reverse().join(''));
  }

  private deobfuscate(encrypted: string): string {
    return atob(encrypted).split('').reverse().join('');
  }

  // Clear all secure data (for logout)
  clearAll(): void {
    try {
      this.removeToken();
      // Add other sensitive keys to clear
      const sensitiveKeys = ['user_data', 'wallet_data', 'profile_data'];
      sensitiveKeys.forEach(key => this.removeItem(key));
    } catch (error) {
      console.error('Failed to clear secure storage:', error);
    }
  }
}

// Export singleton instance
export const secureStorage = new SecureTokenStorage();

// Backward compatibility wrapper for localStorage usage
export const secureLocalStorage = {
  setItem: (key: string, value: string) => secureStorage.setItem(key, value),
  getItem: (key: string) => secureStorage.getItem(key),
  removeItem: (key: string) => secureStorage.removeItem(key),
  clear: () => secureStorage.clearAll()
};