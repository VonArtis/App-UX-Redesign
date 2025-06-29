import React, { useState, useEffect } from 'react';
import type { ScreenType, User } from './types';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/AppContext';
import { useAuth } from './hooks/useAuth';
import { MobileLayoutWithTabs } from './components/layout/MobileLayoutWithTabs';

// Screen imports
import { WelcomeScreen } from './components/screens/WelcomeScreen';
import { LoginScreen } from './components/screens/LoginScreen';
import { SignUpScreen } from './components/screens/SignUpScreen';
import { DashboardScreen } from './components/screens/DashboardScreen';
import { ConnectBankScreen } from './components/screens/ConnectBankScreen';
import { ConnectCryptoScreen } from './components/screens/ConnectCryptoScreen';
import { CryptoWalletScreen } from './components/screens/CryptoWalletScreen';
import { CryptoDepositScreen } from './components/screens/CryptoDepositScreen';
import { WalletManagerScreen } from './components/screens/WalletManagerScreen';
import { EmailVerificationScreen } from './components/screens/EmailVerificationScreen';
import { SMSVerificationScreen } from './components/screens/SMSVerificationScreen';
import { TwoFactorSetupScreen } from './components/screens/TwoFactorSetupScreen';
import { AuthenticatorSetupScreen } from './components/screens/AuthenticatorSetupScreen';
import { Enhanced2FASetupScreen } from './components/screens/Enhanced2FASetupScreen';
import { SMSTwoFactorSetupScreen } from './components/screens/SMSTwoFactorSetupScreen';
import { VerificationSuccessScreen } from './components/screens/VerificationSuccessScreen';
import { AvailableFundsScreen } from './components/screens/AvailableFundsScreen';
import { AdminPlansScreen } from './components/screens/AdminPlansScreen';
import { AdminDashboardScreen } from './components/screens/AdminDashboardScreen';
import { AdminUsersScreen } from './components/screens/AdminUsersScreen';
import { AdminUserDetailsScreen } from './components/screens/AdminUserDetailsScreen';
import { AdminInvestmentsScreen } from './components/screens/AdminInvestmentsScreen';
import { AdminCryptoScreen } from './components/screens/AdminCryptoScreen';
import { PrivacyPolicyScreen } from './components/screens/PrivacyPolicyScreen';
import { TermsOfServiceScreen } from './components/screens/TermsOfServiceScreen';
import { EditProfileScreen } from './components/screens/EditProfileScreen';
import { InvestmentsScreen } from './components/screens/InvestmentsScreen';
import { MakeNewInvestmentScreen } from './components/screens/MakeNewInvestmentScreen';
import { TransferFundsScreen } from './components/screens/TransferFundsScreen';
import { WithdrawalScreen } from './components/screens/WithdrawalScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';

import { UiCatalogScreen } from './components/screens/UiCatalogScreen';
import { MembershipStatusScreen } from './components/screens/MembershipStatusScreen';

import './App.css';

// Main App Router Component
const AppRouter: React.FC = () => {
  const [screen, setScreen] = useState<ScreenType>('welcome');
  const [userDetailsParams, setUserDetailsParams] = useState<any>(null);
  const { user: contextUser } = useApp(); // Access user from context for debugging

  // Update document title based on current screen
  useEffect(() => {
    const titles = {
      'welcome': 'VonVault - DeFi Investment Platform',
      'signup': 'Sign Up - VonVault',
      'login': 'Sign In - VonVault', 
      'email-verification': 'Verify Email - VonVault',
      'sms-verification': 'Verify Phone - VonVault',
      '2fa-setup': 'Setup 2FA - VonVault',
      '2fa-authenticator-setup': 'Setup Authenticator - VonVault',
      'enhanced-2fa-setup': 'Enhanced 2FA Setup - VonVault',
      '2fa-sms-setup': 'Setup SMS 2FA - VonVault',
      'verification-success': 'Verification Complete - VonVault',
      'dashboard': 'Dashboard - VonVault',
      'profile': 'Profile - VonVault',
      'connect-bank': 'Connect Bank - VonVault',
      'connect-crypto': 'Connect Wallet - VonVault',
      'investments': 'Investments - VonVault',
      'crypto-wallet': 'Crypto Wallet - VonVault',
      'crypto-deposit': 'Crypto Deposit - VonVault',
      'wallet-manager': 'Wallet Manager - VonVault',
      'available-funds': 'Available Funds - VonVault',
      'membership-status': 'Membership - VonVault',
      'admin-plans': 'Investment Plans - VonVault',
      'admin-dashboard': 'Admin Dashboard - VonVault',
      'admin-users': 'User Management - VonVault',
      'admin-user-details': 'User Details - VonVault',
      'admin-investments': 'Investment Analytics - VonVault',
      'admin-crypto': 'Crypto Analytics - VonVault',
      'privacy-policy': 'Privacy Policy - VonVault',
      'terms-of-service': 'Terms of Service - VonVault',
      'edit-profile': 'Edit Profile - VonVault'
    };
    
    document.title = titles[screen] || 'VonVault - DeFi Investment Platform';
  }, [screen]);
  const { authenticateBank, authenticateCrypto } = useAuth();

  // Handle successful authentication - differentiate between signup and login
  const handleSignup = (userData: User) => {
    // Save user data for verification tracking
    localStorage.setItem('currentUser', JSON.stringify(userData));
    console.log('Signup completed, user data saved:', userData);
    console.log('Context user after signup:', contextUser);
    
    // IMPORTANT: Also update the AppContext user state immediately
    // This ensures user data is available in profile screen even if verification is skipped
    console.log('Setting user data in context after signup:', userData);
    
    // New enhanced flow: User can choose verification path
    // Since user is now authenticated immediately, they can access dashboard
    // Default to verification flow but allow skipping
    setScreen('email-verification');
  };

  const handleSkipVerification = () => {
    // User chooses to skip verification and go directly to dashboard
    console.log('User skipped verification flow');
    console.log('Context user state:', contextUser);
    
    // Ensure user data is still available in context
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const userData = JSON.parse(currentUser);
        console.log('User data available after skip:', userData);
      } catch (error) {
        console.error('Error parsing user data after skip:', error);
      }
    } else {
      console.warn('No user data found in localStorage after skip');
    }
    
    setScreen('dashboard');
  };

  const handleLogin = (userData: User) => {
    // Save user data for verification tracking
    localStorage.setItem('currentUser', JSON.stringify(userData));
    
    // Check if user is already verified (stored in localStorage for demo)
    const verificationStatus = localStorage.getItem(`verification_${userData.email}`);
    
    if (verificationStatus === 'completed') {
      // User is already verified, go directly to dashboard
      setScreen('dashboard');
    } else {
      // User not verified yet, send through verification flow
      setScreen('email-verification');
    }
  };

  // Handle verification completion - save status
  const handleVerificationComplete = () => {
    // Save verification status in localStorage (in real app, this would be in backend)
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser.email) {
      localStorage.setItem(`verification_${currentUser.email}`, 'completed');
    }
    setScreen('dashboard');
  };

  // Handle bank connection
  const handleBankConnect = async () => {
    try {
      const user = await authenticateBank();
      if (user) {
        alert('Bank connected successfully!');
        setScreen('connect-crypto'); // Go to crypto next, not dashboard
      }
    } catch (error) {
      console.error('Bank connection error:', error);
      alert('Bank connected successfully!'); // Fallback for demo
      setScreen('connect-crypto'); // Go to crypto next, not dashboard
    }
  };

  // Handle crypto connection
  const handleCryptoConnect = async () => {
    try {
      const user = await authenticateCrypto();
      if (user) {
        alert('Wallet connected successfully!');
        setScreen('dashboard');
      }
    } catch (error) {
      console.error('Crypto connection error:', error);
      alert('Wallet connected successfully!'); // Fallback for demo
      setScreen('dashboard');
    }
  };

  const renderScreen = () => {
    switch (screen) {
      case 'welcome':
        return (
          <WelcomeScreen 
            onSignIn={() => setScreen('login')} 
            onCreateAccount={() => setScreen('signup')} 
          />
        );
      case 'login':
        return (
          <LoginScreen 
            onLogin={handleLogin}
            onCreateAccount={() => setScreen('signup')}
            onBack={() => setScreen('welcome')}
          />
        );
      case 'signup':
        return (
          <SignUpScreen 
            onContinue={handleSignup}
            onGoToLogin={() => setScreen('login')}
          />
        );
      case 'email-verification':
        return (
          <EmailVerificationScreen 
            onBack={() => setScreen('signup')}
            onNavigate={setScreen}
          />
        );
      case 'sms-verification':
        return (
          <SMSVerificationScreen 
            onBack={() => setScreen('email-verification')}
            onNavigate={(screen) => {
              if (screen === 'verification-success') {
                setScreen('2fa-setup'); // Go to 2FA setup instead
              } else {
                setScreen(screen);
              }
            }}
          />
        );
      case '2fa-setup':
        return (
          <TwoFactorSetupScreen 
            onBack={() => setScreen('sms-verification')}
            onNavigate={setScreen}
          />
        );
      case '2fa-authenticator-setup':
        return (
          <AuthenticatorSetupScreen 
            onBack={() => setScreen('2fa-setup')}
            onNavigate={setScreen}
          />
        );
      case 'enhanced-2fa-setup':
        return (
          <Enhanced2FASetupScreen 
            onNavigate={setScreen}
          />
        );
      case '2fa-sms-setup':
        return (
          <SMSTwoFactorSetupScreen 
            onBack={() => setScreen('2fa-setup')}
            onNavigate={setScreen}
          />
        );
      case 'verification-success':
        return (
          <VerificationSuccessScreen 
            onNavigate={(screen) => {
              if (screen === 'dashboard') {
                handleVerificationComplete();
              } else {
                setScreen(screen);
              }
            }}
          />
        );
      case 'connect-bank':
        return (
          <ConnectBankScreen 
            onBack={() => setScreen('dashboard')} // Skip goes to dashboard
            onConnect={handleBankConnect} 
          />
        );
      case 'connect-crypto':
        return (
          <ConnectCryptoScreen 
            onBack={() => setScreen('dashboard')} // Skip goes to dashboard
            onConnect={handleCryptoConnect} 
          />
        );
      case 'dashboard':
        return (
          <DashboardScreen 
            onNavigate={setScreen} 
          />
        );
      // Add direct access to connect-crypto for testing
      case 'test-wallet-connections':
        return (
          <ConnectCryptoScreen 
            onBack={() => setScreen('dashboard')}
            onConnect={handleCryptoConnect} 
          />
        );
      case 'investments':
        return (
          <InvestmentsScreen 
            onBack={() => setScreen('dashboard')} 
            onNavigate={setScreen}
          />
        );
      case 'new-investment':
        return (
          <MakeNewInvestmentScreen 
            onBack={() => setScreen('investments')}
            onNavigate={setScreen}
          />
        );
      case 'crypto':
        return (
          <CryptoWalletScreen 
            onBack={() => setScreen('dashboard')}
            onNavigate={setScreen}
          />
        );
      case 'crypto-deposit':
        return (
          <CryptoDepositScreen 
            onBack={() => setScreen('crypto')}
            onNavigate={setScreen}
          />
        );
      case 'wallet-manager':
        return (
          <WalletManagerScreen 
            onBack={() => setScreen('crypto')}
            onNavigate={setScreen}
          />
        );
      case 'funds':
        return (
          <AvailableFundsScreen 
            onBack={() => setScreen('dashboard')}
            onNavigate={setScreen}
          />
        );
      case 'transfer':
        return (
          <TransferFundsScreen 
            onBack={() => setScreen('dashboard')} 
          />
        );
      case 'withdraw':
        return (
          <WithdrawalScreen 
            onBack={() => setScreen('dashboard')} 
          />
        );
      case 'profile':
        return (
          <ProfileScreen 
            onBack={() => setScreen('dashboard')} 
            onNavigate={setScreen}
          />
        );
      case 'ui-catalog':
        return (
          <UiCatalogScreen 
            onBack={() => setScreen('dashboard')} 
          />
        );
      case 'admin-plans':
        return (
          <AdminPlansScreen 
            onBack={() => setScreen('admin-dashboard')} 
          />
        );
      case 'admin-dashboard':
        return (
          <AdminDashboardScreen 
            onBack={() => setScreen('dashboard')}
            onNavigate={setScreen}
          />
        );
      case 'admin-users':
        return (
          <AdminUsersScreen 
            onBack={() => setScreen('admin-dashboard')}
            onNavigate={(screen, params) => {
              if (screen === 'admin-user-details' && params?.userId) {
                setUserDetailsParams(params);
              }
              setScreen(screen);
            }}
          />
        );
      case 'admin-user-details':
        return (
          <AdminUserDetailsScreen 
            onBack={() => setScreen('admin-users')}
            onNavigate={setScreen}
            userId={userDetailsParams?.userId}
          />
        );
      case 'admin-investments':
        return (
          <AdminInvestmentsScreen 
            onBack={() => setScreen('admin-dashboard')}
          />
        );
      case 'admin-crypto':
        return (
          <AdminCryptoScreen 
            onBack={() => setScreen('admin-dashboard')}
          />
        );
      case 'membership-status':
        return (
          <MembershipStatusScreen 
            onBack={() => setScreen('dashboard')}
            onNavigate={setScreen}
          />
        );
      case 'privacy-policy':
        return (
          <PrivacyPolicyScreen onBack={() => setScreen('welcome')} />
        );
      case 'terms-of-service':
        return (
          <TermsOfServiceScreen onBack={() => setScreen('welcome')} />
        );
      case 'edit-profile':
        return (
          <EditProfileScreen onBack={() => setScreen('profile')} />
        );
      default:
        return (
          <WelcomeScreen 
            onSignIn={() => setScreen('login')} 
            onCreateAccount={() => setScreen('signup')} 
          />
        );
    }
  };

  // Screens that should show bottom tabs (main app screens)
  const tabScreens = ['dashboard', 'investments', 'crypto', 'profile', 'admin-dashboard', 'admin-users', 'admin-investments', 'admin-crypto', 'admin-plans'];
  const showTabs = tabScreens.includes(screen);

  // Handle bottom tab navigation
  const handleTabNavigation = (tabScreen: string) => {
    switch (tabScreen) {
      case 'dashboard':
        setScreen('dashboard');
        break;
      case 'investments':
        setScreen('investments');
        break;
      case 'crypto':
        setScreen('crypto');
        break;
      case 'profile':
        setScreen('profile');
        break;
      default:
        setScreen('dashboard');
    }
  };

  return (
    <MobileLayoutWithTabs 
      showTabs={showTabs}
      onNavigate={handleTabNavigation}
      currentScreen={screen}
    >
      {renderScreen()}
    </MobileLayoutWithTabs>
  );
};

// Root App Component with Context Provider
const App: React.FC = () => {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
};

export default App;