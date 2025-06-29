import React, { useState, useEffect } from 'react';
import type { ScreenProps, Portfolio } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { FullScreenLoader } from '../common/LoadingSpinner';
import { MembershipBadge } from '../common/MembershipBadge';
import { EnhancedProgressBar } from '../common/EnhancedProgressBar';
import { LanguageSelector } from '../common/LanguageSelector';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../hooks/useLanguage';

export const DashboardScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  
  // === PHASE 2C: MULTI-WALLET DASHBOARD INTEGRATION ===
  const { 
    portfolio, 
    fetchPortfolio, 
    membershipStatus, 
    fetchMembershipStatus, 
    user,
    connected_wallets,
    primary_wallet
  } = useApp();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchPortfolio(),
        fetchMembershipStatus()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWalletTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'metamask': return '🦊';
      case 'trustwallet': return '🛡️';
      case 'walletconnect': return '🔗';
      case 'coinbase': return '🔵';
      default: return '💼';
    }
  };

  const formatAmount = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  const getProgressToNext = () => {
    if (!membershipStatus?.amount_to_next) return 100;
    const current = membershipStatus.total_invested;
    const target = current + membershipStatus.amount_to_next;
    return (current / target) * 100;
  };

  const showConnectionBanner = !user?.bank_connected && !user?.crypto_connected;

  if (loading) {
    return <FullScreenLoader text="Loading dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 pt-12 pb-8">
      {/* Enhanced Connection Status Banner */}
      {showConnectionBanner && (
        <Card className="mb-4 border-yellow-500/30 bg-yellow-900/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-yellow-400 font-semibold mb-1">Connect Your Accounts</h3>
              <p className="text-sm text-gray-300">
                Connect a bank account or crypto wallet to start investing and earning returns
              </p>
            </div>
            <div className="flex gap-2 ml-4">
              {user?.email_verified && user?.phone_verified ? (
                <Button 
                  onClick={() => onNavigate?.('connect-bank')} 
                  size="sm" 
                  variant="secondary"
                  className="bg-blue-600 hover:bg-blue-700 border-blue-500"
                >
                  Bank
                </Button>
              ) : (
                <Button 
                  onClick={() => onNavigate?.('email-verification')} 
                  size="sm" 
                  variant="outline"
                  className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/10"
                >
                  Verify to Connect Bank
                </Button>
              )}
              
              {user?.email_verified && user?.phone_verified ? (
                <Button 
                  onClick={() => onNavigate?.('connect-crypto')} 
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  Crypto
                </Button>
              ) : (
                <Button 
                  onClick={() => onNavigate?.('email-verification')} 
                  size="sm" 
                  variant="outline"
                  className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/10"
                >
                  Verify to Connect Crypto
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Phase 1: Prominent Wallet Connection Section */}
      <div className="mb-6">
        {!user?.crypto_connected ? (
          <Button
            onClick={() => onNavigate?.('connect-crypto')}
            className="w-full h-16 bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600 flex items-center justify-center gap-4 card-hover-effect animate-fade-in-up"
            size="lg"
          >
            <span className="text-3xl">🔗</span>
            <div className="text-left">
              <div className="font-bold text-lg">Connect Crypto Wallet</div>
              <div className="text-sm opacity-90">Access DeFi features & start investing</div>
            </div>
            <div className="ml-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Button>
        ) : (
          <Card className="bg-gradient-to-r from-green-900/50 to-blue-900/50 border-green-500/30 card-hover-effect animate-fade-in-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
                <div>
                  <div className="font-bold text-lg text-green-400 flex items-center gap-2">
                    Crypto Wallet Connected
                    <span className="text-xs bg-green-500 px-2 py-1 rounded text-white">Active</span>
                  </div>
                  <div className="text-sm text-gray-300">
                    {user.wallet_address ? 
                      `${user.wallet_address.slice(0, 8)}...${user.wallet_address.slice(-6)}` : 
                      'MetaMask Wallet'
                    }
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => onNavigate?.('crypto')}
                  size="sm"
                  variant="secondary"
                  className="bg-blue-600 hover:bg-blue-700 border-blue-500"
                >
                  Manage
                </Button>
                <Button 
                  onClick={() => onNavigate?.('connect-crypto')}
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  Change
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Enhanced Header with Wallet Status */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            {t('dashboard:title')}
          </h1>
          <p className="text-gray-400 text-sm mt-1">{t('dashboard:welcome')}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Language Selector - Globe Icon */}
          <LanguageSelector variant="icon-only" />
          
          {/* Wallet Status Indicator */}
          {user?.crypto_connected ? (
            <div className="flex items-center gap-2 bg-green-900/30 border border-green-500/30 rounded-lg px-3 py-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400 font-medium">{t('dashboard:walletStatus.connected')}</span>
              <Button 
                onClick={() => onNavigate?.('connect-crypto')}
                size="sm"
                variant="secondary"
                className="text-xs h-6 px-2"
              >
                Change
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => onNavigate?.('connect-crypto')}
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 flex items-center gap-2"
            >
              <span className="text-sm">🔗</span>
              <span className="text-xs">{t('dashboard:walletStatus.disconnected')}</span>
            </Button>
          )}
          <Button
            onClick={() => onNavigate?.('profile')}
            variant="secondary"
            size="sm"
            className="flex items-center gap-2"
          >
            <span>👤</span>
            Profile
          </Button>
        </div>
      </div>

      {/* Enhanced Membership Status Card */}
      {membershipStatus && (
        <Card 
          className="mb-6 bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 border-purple-500/30 cursor-pointer card-hover-effect animate-fade-in-up"
          onClick={() => onNavigate?.('membership-status')}
          hover
        >
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-4">
              <div className="animate-float">
                <MembershipBadge 
                  level={membershipStatus.level} 
                  size="lg" 
                  showRing={true}
                  className="tier-badge-shadow"
                />
              </div>
              
              <div>
                <div className="font-bold text-xl text-white mb-1">
                  {membershipStatus.level_name}
                </div>
                <div className="text-purple-200 text-sm">
                  {formatAmount(membershipStatus.total_invested)} invested
                </div>
                
                {/* Progress to next level */}
                {membershipStatus.next_level && (
                  <div className="mt-3 w-64">
                    <EnhancedProgressBar
                      progress={getProgressToNext()}
                      level={membershipStatus.next_level}
                      label={`${formatAmount(membershipStatus.amount_to_next || 0)} to ${membershipStatus.next_level_name}`}
                      animated={true}
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-purple-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Card>
      )}

      {/* Enhanced Portfolio Summary */}
      {portfolio && (
        <Card className="mb-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700 card-hover-effect animate-slide-in-left">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">💼</span>
            Portfolio Summary
          </h2>
          
          {/* Total Portfolio Value */}
          <div className="text-center mb-6 p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg">
            <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              {formatAmount(portfolio.total_portfolio)}
            </div>
            <div className="text-gray-400">Total Portfolio Value</div>
          </div>
          
          {/* Portfolio Breakdown */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center group">
              <p className="text-gray-400 text-sm">Investments</p>
              <p className="font-bold text-lg text-green-400 transition-transform duration-300 group-hover:scale-110">
                {formatAmount(portfolio.investments.total)}
              </p>
              <p className="text-xs text-gray-500">{portfolio.investments.count} active</p>
            </div>
            <div className="text-center group">
              <p className="text-gray-400 text-sm">Crypto</p>
              <p className="font-bold text-lg text-orange-400 transition-transform duration-300 group-hover:scale-110">
                {formatAmount(portfolio.crypto.total)}
              </p>
            </div>
            <div className="text-center group">
              <p className="text-gray-400 text-sm">Cash</p>
              <p className="font-bold text-lg text-blue-400 transition-transform duration-300 group-hover:scale-110">
                {formatAmount(portfolio.bank.total)}
              </p>
            </div>
          </div>

          {/* Enhanced Portfolio Breakdown Visualization */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                Investments
              </span>
              <span className="font-medium">{portfolio.breakdown.investments_percentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
              <div className="flex h-full">
                <div 
                  className="bg-gradient-to-r from-green-400 to-green-500 transition-all duration-1000 ease-out" 
                  style={{ width: `${portfolio.breakdown.investments_percentage}%` }}
                ></div>
                <div 
                  className="bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-1000 ease-out" 
                  style={{ width: `${portfolio.breakdown.crypto_percentage}%` }}
                ></div>
                <div 
                  className="bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-1000 ease-out" 
                  style={{ width: `${portfolio.breakdown.cash_percentage}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex justify-between text-xs text-gray-400">
              <span>💰 Crypto: {portfolio.breakdown.crypto_percentage.toFixed(1)}%</span>
              <span>💵 Cash: {portfolio.breakdown.cash_percentage.toFixed(1)}%</span>
            </div>
          </div>
        </Card>
      )}

      {/* Enhanced Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Button
          onClick={() => onNavigate?.('investments')}
          className="h-28 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 card-hover-effect animate-slide-in-left"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span className="font-medium">My Investments</span>
          <span className="text-xs opacity-75">View & Track</span>
        </Button>

        <Button
          onClick={() => onNavigate?.('new-investment')}
          className="h-28 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 card-hover-effect animate-slide-in-right"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="font-medium">New Investment</span>
          <span className="text-xs opacity-75">Start Earning</span>
        </Button>
      </div>

      {/* Enhanced Secondary Actions Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Button
          onClick={() => onNavigate?.('crypto')}
          variant="secondary"
          className="h-20 flex flex-col items-center justify-center space-y-1 card-hover-effect bg-gradient-to-br from-orange-800/50 to-purple-800/50 hover:from-orange-700/60 hover:to-purple-700/60 border-orange-500/30"
        >
          <div className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {/* === PHASE 2C: MULTI-WALLET INDICATORS === */}
            {connected_wallets.length > 0 ? (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                {connected_wallets.length > 1 && (
                  <span className="text-xs bg-green-400 text-green-900 px-1 rounded-full font-bold">
                    {connected_wallets.length}
                  </span>
                )}
              </div>
            ) : null}
          </div>
          
          <div className="text-center">
            <span className="text-sm font-medium text-orange-300">
              {connected_wallets.length > 0 ? (
                connected_wallets.length === 1 ? 'Crypto Wallet' : `${connected_wallets.length} Wallets`
              ) : 'Crypto Wallet'}
            </span>
            <div className="text-xs opacity-60">
              {connected_wallets.length > 0 ? (
                primary_wallet ? (
                  <span className="flex items-center justify-center gap-1">
                    {getWalletTypeIcon(primary_wallet.type)}
                    {primary_wallet.name || 'Primary'}
                  </span>
                ) : 'Manage • Deposit'
              ) : 'Connect • Setup'}
            </div>
          </div>
        </Button>

        <Button
          onClick={() => onNavigate?.('funds')}
          variant="secondary"
          className="h-20 flex flex-col items-center justify-center space-y-1 card-hover-effect bg-gradient-to-br from-blue-800/50 to-cyan-800/50 hover:from-blue-700/60 hover:to-cyan-700/60 border-blue-500/30"
        >
          <div className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            {user?.bank_connected && <div className="w-2 h-2 bg-green-400 rounded-full"></div>}
          </div>
          <span className="text-sm font-medium text-blue-300">Available Funds</span>
          <span className="text-xs opacity-60">Bank • Balance</span>
        </Button>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="text-center p-4 bg-gradient-to-br from-blue-900/50 to-blue-800/50 border-blue-500/30">
          <div className="text-2xl font-bold text-blue-400">
            {membershipStatus?.available_plans.length || 0}
          </div>
          <div className="text-sm text-blue-300">Available Plans</div>
        </Card>
        
        <Card className="text-center p-4 bg-gradient-to-br from-green-900/50 to-green-800/50 border-green-500/30">
          <div className="text-2xl font-bold text-green-400">
            {portfolio?.investments.count || 0}
          </div>
          <div className="text-sm text-green-300">Active Investments</div>
        </Card>
      </div>
    </div>
  );
};