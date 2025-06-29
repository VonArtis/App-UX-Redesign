// Core type definitions for VonVault DeFi App

export type ScreenType = 
  | 'welcome' 
  | 'login' 
  | 'signup'
  | 'email-verification'
  | 'sms-verification'
  | '2fa-setup'
  | 'two-factor-setup'
  | '2fa-authenticator-setup'
  | 'enhanced-2fa-setup'
  | '2fa-sms-setup'
  | 'verification-success'
  | 'connect-bank'
  | 'connect-crypto'
  | 'dashboard'
  | 'investments'
  | 'new-investment'
  | 'crypto'
  | 'crypto-deposit'
  | 'wallet-manager'
  | 'funds'
  | 'transfer'
  | 'withdraw'
  | 'profile'
  | 'ui-catalog'
  | 'admin-plans'
  | 'admin-dashboard'
  | 'admin-users'
  | 'admin-user-details'
  | 'admin-investments'
  | 'admin-crypto'
  | 'membership-status'
  | 'privacy-policy'
  | 'terms-of-service'
  | 'edit-profile'
  | 'test-wallet-connections';

// === PHASE 2: MULTI-WALLET TYPE DEFINITIONS (EXACT SPECIFICATION) ===

export interface ConnectedWallet {
  id: string;
  type: 'metamask' | 'trustwallet' | 'walletconnect' | 'coinbase' | 'other';
  address: string;
  name?: string;
  is_primary: boolean;
  networks: string[];
  connected_at: string;
  last_used?: string;
  balance_cache?: {
    [network: string]: {
      [token: string]: number;
    };
  };
}

export interface User {
  id?: string;
  user_id?: string; // For backward compatibility
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  token?: string;
  
  // === PHASE 2: MULTI-WALLET SUPPORT ===
  connected_wallets?: ConnectedWallet[];
  primary_wallet_id?: string;
  
  // === PHASE 2A: ENHANCED 2FA SUPPORT ===
  biometric_2fa_enabled?: boolean;
  push_2fa_enabled?: boolean;
  
  // === LEGACY FIELDS (MAINTAINED FOR BACKWARD COMPATIBILITY) ===
  wallet_address?: string; // DEPRECATED
  wallet_type?: string; // DEPRECATED
  
  // === EXISTING FIELDS ===
  bank_connected?: boolean;
  crypto_connected?: boolean;
  
  // === VERIFICATION STATUS ===
  email_verified?: boolean;
  phone_verified?: boolean;
  
  // === INVESTMENT & MEMBERSHIP ===
  investment_tier?: string;
  
  type?: 'bank' | 'crypto' | 'login' | 'signup' | 'email';
  auth_type?: string;
  created_at?: string;
}

export interface Investment {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  rate: number;
  term: number;
  membership_level?: string;
  status: 'active' | 'completed' | 'pending';
  created_at?: string;
}

export interface InvestmentPlan {
  id: string;
  name: string;
  description: string;
  membership_level?: string;
  rate: number;
  term_days: number;
  min_amount: number;
  max_amount: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  // Backward compatibility
  term?: number; // in months
}

export interface InvestmentPlanCreate {
  name: string;
  description: string;
  membership_level?: string;
  rate: number;
  term_days: number;
  min_amount: number;
  max_amount?: number;
  is_active?: boolean;
}

export interface MembershipTier {
  name: string;
  min_amount: number;
  max_amount?: number;
  max_per_investment: number;
  emoji: string;
  benefits: string;
}

export interface MembershipStatus {
  level: string;
  level_name: string;
  emoji: string;
  total_invested: number;
  current_min: number;
  current_max?: number;
  next_level?: string;
  next_level_name?: string;
  amount_to_next?: number;
  available_plans: InvestmentPlan[];
}

export interface CryptoAsset {
  name: string;
  symbol: string;
  amount: number;
  usdValue: number;
}

export interface BankAccount {
  id: string;
  name: string;
  balance: {
    available: string;
  };
}

export interface Portfolio {
  user_id: string;
  membership: MembershipStatus;
  total_portfolio: number;
  investments: {
    total: number;
    count: number;
  };
  crypto: {
    total: number;
  };
  bank: {
    total: number;
  };
  breakdown: {
    investments_percentage: number;
    crypto_percentage: number;
    cash_percentage: number;
  };
}

// Screen component props
export interface ScreenProps {
  onBack?: () => void;
  onNavigate?: (screen: ScreenType) => void;
}

export interface AuthScreenProps extends ScreenProps {
  onLogin?: (user: User) => void;
  onContinue?: (user: User) => void;
  onCreateAccount?: () => void;
  onGoToLogin?: () => void;
  onSignIn?: () => void;
}

export interface ConnectionScreenProps extends ScreenProps {
  onConnected?: () => void;
  onConnect?: () => Promise<void>;
}

// Context types
export interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  portfolio: Portfolio | null;
  loading: boolean;
  fetchPortfolio: () => Promise<void>;
  membershipStatus: MembershipStatus | null;
  fetchMembershipStatus: () => Promise<void>;
  
  // === PHASE 2: MULTI-WALLET CONTEXT (EXACT SPECIFICATION) ===
  connected_wallets: ConnectedWallet[];
  primary_wallet: ConnectedWallet | null;
  
  // Multi-wallet functions
  connectWallet: (type: string, address: string, networks: string[]) => Promise<void>;
  disconnectWallet: (walletId: string) => Promise<void>;
  setPrimaryWallet: (walletId: string) => Promise<void>;
  renameWallet: (walletId: string, name: string) => Promise<void>;
  refreshWalletBalances: () => Promise<void>;
  getWalletByNetwork: (network: string) => ConnectedWallet | null;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface InvestmentPlansResponse {
  plans: InvestmentPlan[];
  membership: MembershipStatus;
}

export interface InvestmentsResponse {
  investments: Investment[];
}

export interface MembershipTiersResponse {
  tiers: Record<string, MembershipTier>;
}