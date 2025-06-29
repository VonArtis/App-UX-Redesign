// Analytics utility for VonVault DeFi App
// Firebase Analytics integration (mock for development)

interface AnalyticsEvent {
  eventName: string;
  parameters?: Record<string, any>;
}

// Mock Firebase analytics for development
const mockAnalytics = {
  logEvent: (eventName: string, parameters?: Record<string, any>) => {
    console.log(`📊 Analytics Event: ${eventName}`, parameters);
  },
  setUserId: (userId: string) => {
    console.log(`👤 Analytics User ID: ${userId}`);
  },
  setUserProperties: (properties: Record<string, any>) => {
    console.log('📝 Analytics User Properties:', properties);
  }
};

// Export analytics functions
export function trackEvent(eventName: string, parameters: Record<string, any> = {}) {
  // Add timestamp and app context
  const enrichedParameters = {
    ...parameters,
    timestamp: new Date().toISOString(),
    app_name: 'VonVault',
    app_version: '1.0.0',
    platform: 'telegram_mini_app'
  };
  
  mockAnalytics.logEvent(eventName, enrichedParameters);
}

export function trackUserAction(action: string, screen: string, additionalData: Record<string, any> = {}) {
  trackEvent('user_action', {
    action,
    screen,
    ...additionalData
  });
}

export function trackScreenView(screenName: string) {
  trackEvent('screen_view', {
    screen_name: screenName,
    screen_class: screenName
  });
}

export function trackInvestment(investmentData: {
  name: string;
  amount: number;
  rate: number;
  term: number;
}) {
  trackEvent('investment_created', {
    investment_type: investmentData.name,
    amount: investmentData.amount,
    rate: investmentData.rate,
    term_months: investmentData.term,
    currency: 'USD'
  });
}

export function trackWalletConnection(walletType: string) {
  trackEvent('wallet_connected', {
    wallet_type: walletType,
    connection_method: 'web3'
  });
}

export function trackBankConnection() {
  trackEvent('bank_connected', {
    connection_method: 'teller_api',
    provider: 'teller'
  });
}

export function trackAuthentication(authType: 'login' | 'signup' | 'bank' | 'crypto') {
  trackEvent('user_authenticated', {
    auth_method: authType,
    platform: 'telegram'
  });
}

export function trackTransfer(amount: number, recipient: string) {
  trackEvent('funds_transferred', {
    amount,
    recipient_type: recipient.includes('@') ? 'email' : 'address',
    currency: 'USD'
  });
}

export function trackWithdrawal(amount: number, account: string) {
  trackEvent('funds_withdrawn', {
    amount,
    account_type: account,
    currency: 'USD'
  });
}

export function setUserId(userId: string) {
  mockAnalytics.setUserId(userId);
}

export function setUserProperties(properties: Record<string, any>) {
  const enrichedProperties = {
    ...properties,
    app_version: '1.0.0',
    platform: 'telegram_mini_app'
  };
  mockAnalytics.setUserProperties(enrichedProperties);
}

// Track app initialization
trackEvent('app_initialized', {
  platform: 'telegram_mini_app',
  framework: 'react_typescript'
});

export default {
  trackEvent,
  trackUserAction,
  trackScreenView,
  trackInvestment,
  trackWalletConnection,
  trackBankConnection,
  trackAuthentication,
  trackTransfer,
  trackWithdrawal,
  setUserId,
  setUserProperties
};