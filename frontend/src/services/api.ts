import axios from 'axios';
import { secureStorage } from '../utils/secureStorage';
import type { 
  Investment, 
  InvestmentPlan,
  InvestmentPlansResponse,
  InvestmentsResponse,
  MembershipStatus,
  MembershipTiersResponse,
  User
} from '../types';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API_BASE = `${BACKEND_URL}/api`;
const API_V1_BASE = `${BACKEND_URL}/api/v1`;  // Use v1 APIs for new features
const API_LEGACY_BASE = `${BACKEND_URL}/api`; // Keep legacy for existing features

// Input validation utilities
class InputValidator {
  static sanitizeString(input: string): string {
    return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/[<>]/g, '');
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) errors.push('Password must be at least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('Password must contain uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('Password must contain lowercase letter'); 
    if (!/[0-9]/.test(password)) errors.push('Password must contain a number');
    if (!/[!@#$%^&*]/.test(password)) errors.push('Password must contain special character');
    
    return { valid: errors.length === 0, errors };
  }
}

class ApiService {
  private getAuthHeaders(token?: string) {
    const authToken = token || secureStorage.getToken();
    return {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` })
    };
  }

  // Enhanced error handling
  private handleApiError(error: any) {
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    if (error.message) {
      throw new Error(error.message);
    }
    throw new Error('An unexpected error occurred');
  }

  // Generic API request method for admin endpoints
  async makeRequest(method: 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: string, data?: any, token?: string) {
    try {
      const config = {
        method: method.toLowerCase(),
        url: `${API_BASE}${endpoint}`,
        headers: this.getAuthHeaders(token),
        ...(data && { data })
      };

      const response = await axios(config);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Authentication
  async telegramAuth(userData: any) {
    const response = await axios.post(`${API_BASE}/auth/telegram`, userData);
    return response.data;
  }

  async telegramWebAppAuth(data: { initData: string }) {
    const response = await axios.post(`${API_BASE}/auth/telegram/webapp`, data);
    return response.data;
  }

  // User Management - Signup/Login (Using API v1)
  async signup(userData: { name: string; email: string; password: string; phone: string; country_code: string }) {
    const response = await axios.post(`${API_V1_BASE}/auth/signup`, userData);
    return response.data;
  }

  async login(credentials: { email: string; password: string }) {
    const response = await axios.post(`${API_V1_BASE}/auth/login`, credentials);
    return response.data;
  }

  async getCurrentUser(token: string) {
    const response = await axios.get(`${API_V1_BASE}/auth/me`, {
      headers: this.getAuthHeaders(token)
    });
    return response.data;
  }

  // Membership
  async getMembershipStatus(token: string): Promise<MembershipStatus> {
    const response = await axios.get(`${API_BASE}/membership/status`, {
      headers: this.getAuthHeaders(token)
    });
    return response.data;
  }

  async getMembershipTiers(): Promise<MembershipTiersResponse> {
    const response = await axios.get(`${API_BASE}/membership/tiers`);
    return response.data;
  }

  // Investment Plans
  async getInvestmentPlans(token: string): Promise<InvestmentPlansResponse> {
    const response = await axios.get(`${API_BASE}/investment-plans`, {
      headers: this.getAuthHeaders(token)
    });
    return response.data;
  }

  async getAllInvestmentPlans(): Promise<{ plans: InvestmentPlan[] }> {
    const response = await axios.get(`${API_BASE}/investment-plans/all`);
    return response.data;
  }

  async createInvestmentPlan(planData: any, token: string) {
    const response = await axios.post(`${API_BASE}/investment-plans`, planData, {
      headers: this.getAuthHeaders(token)
    });
    return response.data;
  }

  async updateInvestmentPlan(planId: string, planData: any, token: string) {
    const response = await axios.put(`${API_BASE}/investment-plans/${planId}`, planData, {
      headers: this.getAuthHeaders(token)
    });
    return response.data;
  }

  async deleteInvestmentPlan(planId: string, token: string) {
    const response = await axios.delete(`${API_BASE}/investment-plans/${planId}`, {
      headers: this.getAuthHeaders(token)
    });
    return response.data;
  }

  // Investments
  async getInvestments(token: string): Promise<InvestmentsResponse> {
    const response = await axios.get(`${API_BASE}/investments`, {
      headers: this.getAuthHeaders(token)
    });
    return response.data;
  }

  async createInvestment(investment: Omit<Investment, 'id' | 'user_id' | 'created_at' | 'status'>, token: string) {
    const response = await axios.post(`${API_BASE}/investments`, investment, {
      headers: this.getAuthHeaders(token)
    });
    return response.data;
  }

  // Crypto & Wallet
  async verifyWalletSignature(payload: { message: string; signature: string; address: string }) {
    const response = await axios.post(`${API_BASE}/wallet/verify-signature`, payload);
    return response.data;
  }

  async getCryptoBalance(address: string) {
    const response = await axios.get(`${API_BASE}/wallet/balance/${address}`);
    return response.data;
  }

  // Enhanced Crypto Methods
  async getCryptoDepositAddresses(token: string) {
    const response = await axios.get(`${API_BASE}/crypto/deposit-addresses`, {
      headers: this.getAuthHeaders(token)
    });
    return response.data;
  }

  async getAllCryptoBalances(token: string) {
    const response = await axios.get(`${API_BASE}/crypto/balances`, {
      headers: this.getAuthHeaders(token)
    });
    return response.data;
  }

  async getCryptoTransactions(token: string) {
    const response = await axios.get(`${API_BASE}/crypto/transactions`, {
      headers: this.getAuthHeaders(token)
    });
    return response.data;
  }

  async monitorCryptoDeposits(token: string) {
    const response = await axios.post(`${API_BASE}/crypto/monitor-deposits`, {}, {
      headers: this.getAuthHeaders(token)
    });
    return response.data;
  }

  async getUserCryptoBalance(userAddress: string, token: string) {
    const response = await axios.get(`${API_BASE}/crypto/user-balance/${userAddress}`, {
      headers: this.getAuthHeaders(token)
    });
    return response.data;
  }

  // Bank
  async getBankAccounts(userId: string) {
    const response = await axios.get(`${API_BASE}/bank/accounts`, {
      headers: { 'X-User-ID': userId }
    });
    return response.data;
  }

  async getBankBalance(userId: string) {
    const response = await axios.get(`${API_BASE}/bank/balance`, {
      headers: { 'X-User-ID': userId }
    });
    return response.data;
  }

  // Portfolio
  async getPortfolio(token: string) {
    const response = await axios.get(`${API_BASE}/portfolio`, {
      headers: this.getAuthHeaders(token)
    });
    return response.data;
  }

  // Crypto Prices
  async getCryptoPrices() {
    const response = await axios.get(`${API_BASE}/prices`);
    return response.data;
  }

  // Profile
  async saveProfile(preferences: any, token: string) {
    const response = await axios.post(`${API_BASE}/profile`, preferences, {
      headers: this.getAuthHeaders(token)
    });
    return response.data;
  }

  async getProfile(userId: string, token: string) {
    const response = await axios.get(`${API_BASE}/profile/${userId}`, {
      headers: this.getAuthHeaders(token)
    });
    return response.data;
  }

  // === PHASE 2: MULTI-WALLET API METHODS (EXACT SPECIFICATION) ===

  // Get all user wallets
  async getUserWallets(token: string) {
    const response = await axios.get(`${API_BASE}/wallets`, {
      headers: this.getAuthHeaders(token)
    });
    return response.data;
  }

  // Connect new wallet
  async connectWallet(token: string, walletData: {
    type: string;
    address: string;
    name?: string;
    networks: string[];
  }) {
    const response = await axios.post(`${API_BASE}/wallets/connect`, null, {
      headers: this.getAuthHeaders(token),
      params: walletData
    });
    return response.data;
  }

  // Update wallet (rename)
  async updateWallet(token: string, walletId: string, updateData: { name?: string }) {
    const response = await axios.put(`${API_BASE}/wallets/${walletId}`, null, {
      headers: this.getAuthHeaders(token),
      params: updateData
    });
    return response.data;
  }

  // Remove wallet
  async removeWallet(token: string, walletId: string) {
    const response = await axios.delete(`${API_BASE}/wallets/${walletId}`, {
      headers: this.getAuthHeaders(token)
    });
    return response.data;
  }

  // Set primary wallet
  async setPrimaryWallet(token: string, walletId: string) {
    const response = await axios.post(`${API_BASE}/wallets/${walletId}/primary`, null, {
      headers: this.getAuthHeaders(token)
    });
    return response.data;
  }

  // Get deposit addresses for specific wallet
  async getWalletDepositAddresses(token: string, walletId: string) {
    const response = await axios.get(`${API_BASE}/crypto/deposit-addresses/${walletId}`, {
      headers: this.getAuthHeaders(token)
    });
    return response.data;
  }

  // Get balance for specific wallet
  async getWalletBalance(token: string, walletId: string) {
    const response = await axios.get(`${API_BASE}/crypto/balances/${walletId}`, {
      headers: this.getAuthHeaders(token)
    });
    return response.data;
  }

  // Create transaction from specific wallet
  async createWalletTransaction(token: string, walletId: string, transactionData: any) {
    const response = await axios.post(`${API_BASE}/crypto/transactions/${walletId}`, transactionData, {
      headers: this.getAuthHeaders(token)
    });
    return response.data;
  }

  // Profile Management
  async deleteProfile(password: string) {
    // Validate password input
    if (!password || password.trim().length === 0) {
      throw new Error('Password is required for profile deletion');
    }
    
    // Sanitize password input
    const sanitizedPassword = InputValidator.sanitizeString(password);
    
    try {
      // Use POST method with /api/account/delete path to avoid conflicts
      const response = await axios.post(`${API_BASE}/account/delete`, 
        { password: sanitizedPassword },
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Profile deletion failed:', error);
      this.handleApiError(error);
      throw error;
    }
  }

  // === 2FA API Methods ===
  
  // SMS 2FA Methods
  async sendSMS2FA(phoneNumber: string) {
    const response = await axios.post(`${API_BASE}/auth/sms/send`, 
      { phone_number: phoneNumber },
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  async verifySMS2FA(phoneNumber: string, code: string) {
    const response = await axios.post(`${API_BASE}/auth/sms/verify`,
      { phone_number: phoneNumber, code: code },
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  async setupSMS2FA(phoneNumber: string) {
    const response = await axios.post(`${API_BASE}/auth/sms/setup`,
      { phone_number: phoneNumber },
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  // TOTP/Authenticator 2FA Methods
  async setupTOTP2FA() {
    const response = await axios.post(`${API_BASE}/auth/totp/setup`, {}, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async verifyTOTP2FA(code: string) {
    const response = await axios.post(`${API_BASE}/auth/totp/verify`,
      { code: code },
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  // Email 2FA Methods
  async sendEmail2FA(email: string) {
    const response = await axios.post(`${API_BASE}/auth/email/send`, 
      { email: email },
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  async verifyEmail2FA(email: string, code: string) {
    const response = await axios.post(`${API_BASE}/auth/email/verify`,
      { email: email, code: code },
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  async setupEmail2FA(email: string) {
    const response = await axios.post(`${API_BASE}/auth/email/setup`,
      { email: email },
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  // === ADMIN API METHODS ===
  
  // Admin Dashboard Overview (Using API v1)
  async getAdminOverview(token: string) {
    const response = await axios.get(`${API_V1_BASE}/admin/overview`, {
      headers: this.getAuthHeaders(token)
    });
    return response.data;
  }

  // Admin Users Management
  async getAdminUsers(token: string, params?: any) {
    const queryParams = params ? `?${new URLSearchParams(params).toString()}` : '';
    const response = await axios.get(`${API_BASE}/admin/users${queryParams}`, {
      headers: this.getAuthHeaders(token)
    });
    return response.data;
  }

  async getAdminUserDetails(token: string, userId: string) {
    const response = await axios.get(`${API_BASE}/admin/users/${userId}`, {
      headers: this.getAuthHeaders(token)
    });
    return response.data;
  }

  // Admin Investments Analytics
  async getAdminInvestments(token: string) {
    const response = await axios.get(`${API_BASE}/admin/investments`, {
      headers: this.getAuthHeaders(token)
    });
    return response.data;
  }

  // Admin Crypto Analytics
  async getAdminCrypto(token: string) {
    const response = await axios.get(`${API_BASE}/admin/crypto`, {
      headers: this.getAuthHeaders(token)
    });
    return response.data;
  }

  // Admin System Status (Using API v1)
  async getAdminSystem(token: string) {
    const response = await axios.get(`${API_V1_BASE}/admin/system`, {
      headers: this.getAuthHeaders(token)
    });
    return response.data;
  }

  // Phase 2 Enhancement: Biometric WebAuthn 2FA APIs
  async beginBiometricRegistration(token: string, deviceName?: string) {
    const response = await axios.post(`${API_V1_BASE}/auth/webauthn/register/begin`, {
      device_name: deviceName || 'Device'
    }, {
      headers: this.getAuthHeaders(token)
    });
    return response.data;
  }

  async completeBiometricRegistration(token: string, credentialData: any) {
    const response = await axios.post(`${API_V1_BASE}/auth/webauthn/register/complete`, 
      credentialData, {
      headers: this.getAuthHeaders(token)
    });
    return response.data;
  }

  async beginBiometricAuthentication(token: string) {
    const response = await axios.post(`${API_V1_BASE}/auth/webauthn/authenticate/begin`, {}, {
      headers: this.getAuthHeaders(token)
    });
    return response.data;
  }

  async completeBiometricAuthentication(token: string, verificationData: any) {
    const response = await axios.post(`${API_V1_BASE}/auth/webauthn/authenticate/complete`, 
      verificationData, {
      headers: this.getAuthHeaders(token)
    });
    return response.data;
  }

  // Phase 2 Enhancement: Push Notification 2FA APIs
  async registerPushNotifications(token: string, pushToken: string, deviceType: string, deviceName?: string) {
    const response = await axios.post(`${API_V1_BASE}/auth/push/register`, {
      token: pushToken,
      device_type: deviceType,
      device_name: deviceName || 'Device'
    }, {
      headers: this.getAuthHeaders(token)
    });
    return response.data;
  }

  async sendPushNotification(token: string) {
    const response = await axios.post(`${API_V1_BASE}/auth/push/send`, {}, {
      headers: this.getAuthHeaders(token)
    });
    return response.data;
  }

  // Phase 2 Enhancement: Enhanced 2FA Conditional Logic
  checkEnhanced2FARequired(user: User, investmentAmount: number): boolean {
    // Enhanced 2FA mandatory for investments ≥ $20,000
    const ENHANCED_2FA_THRESHOLD = 20000;
    return investmentAmount >= ENHANCED_2FA_THRESHOLD;
  }

  // Check if user has Enhanced 2FA enabled
  hasEnhanced2FA(user: User): boolean {
    // Check if user has any enhanced 2FA methods enabled
    // This would be set when they complete biometric or push setup
    return user.biometric_2fa_enabled || user.push_2fa_enabled || false;
  }

  // Validate Enhanced 2FA for high-value operations
  validateEnhanced2FAForInvestment(user: User, amount: number) {
    const requiresEnhanced = this.checkEnhanced2FARequired(user, amount);
    const hasEnhanced = this.hasEnhanced2FA(user);
    
    return {
      required: requiresEnhanced,
      hasEnhanced: hasEnhanced,
      canProceed: !requiresEnhanced || hasEnhanced,
      threshold: 20000,
      message: requiresEnhanced && !hasEnhanced 
        ? `Enhanced 2FA is required for investments of $20,000 or more. Please set up biometric or push notification authentication to proceed.`
        : null
    };
  }
}

export const apiService = new ApiService();