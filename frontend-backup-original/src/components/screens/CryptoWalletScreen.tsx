import React, { useState, useEffect } from 'react';
import type { ScreenProps, CryptoAsset, ConnectedWallet } from '../../types';
import { ScreenHeader } from '../layout/ScreenHeader';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { FullScreenLoader } from '../common/LoadingSpinner';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/api';

export const CryptoWalletScreen: React.FC<ScreenProps> = ({ onBack, onNavigate }) => {
  const [assets, setAssets] = useState<CryptoAsset[]>([]);
  const [businessBalances, setBusinessBalances] = useState<any>(null);
  const [walletBalances, setWalletBalances] = useState<{ [walletId: string]: any }>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<ConnectedWallet | null>(null);
  
  // === PHASE 2C: MULTI-WALLET INTEGRATION ===
  const { user, connected_wallets, primary_wallet, refreshWalletBalances } = useApp();

  useEffect(() => {
    // Set primary wallet as default selected wallet
    if (primary_wallet) {
      setSelectedWallet(primary_wallet);
    } else if (connected_wallets.length > 0) {
      setSelectedWallet(connected_wallets[0]);
    }
    
    fetchBusinessBalances();
    if (connected_wallets.length > 0) {
      fetchAllWalletBalances();
    }
    
    // Failsafe: Ensure loading stops after 10 seconds
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 10000);
    
    return () => clearTimeout(timeout);
  }, [connected_wallets, primary_wallet]);

  const fetchAllWalletBalances = async () => {
    if (!user?.token) return;
    
    try {
      const balances: { [walletId: string]: any } = {};
      
      for (const wallet of connected_wallets) {
        try {
          const balance = await apiService.getWalletBalance(user.token, wallet.id);
          balances[wallet.id] = balance;
        } catch (error) {
          console.error(`Failed to fetch balance for wallet ${wallet.id}:`, error);
          balances[wallet.id] = { error: 'Failed to load balance' };
        }
      }
      
      setWalletBalances(balances);
    } catch (error) {
      console.error('Error fetching wallet balances:', error);
    }
  };

  const fetchBusinessBalances = async () => {
    if (!user?.token) return;

    try {
      const response = await apiService.getAllCryptoBalances(user.token);
      setBusinessBalances(response);
    } catch (error) {
      console.error('Error fetching business balances:', error);
      // Don't block the UI if business balances fail
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshWalletBalances();
      await fetchAllWalletBalances();
      await fetchBusinessBalances();
    } catch (error) {
      console.error('Error refreshing balances:', error);
      alert('Failed to refresh balances. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const getTotalBalance = () => {
    let total = 0;
    Object.values(walletBalances).forEach((balance: any) => {
      if (balance && !balance.error) {
        total += balance.total_usd || 0;
      }
    });
    return total;
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

  if (loading) {
    return <FullScreenLoader text="Loading crypto wallets..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ScreenHeader 
        title="Crypto Wallets" 
        onBack={onBack}
        action={
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-blue-600 font-medium"
          >
            {refreshing ? '↻' : '⟲'}
          </button>
        }
      />

      <div className="p-4 space-y-6">
        {/* Multi-Wallet Overview */}
        {connected_wallets.length > 0 ? (
          <>
            {/* Total Balance Card */}
            <Card className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="text-center">
                <h3 className="text-lg font-medium opacity-90">Total Balance</h3>
                <div className="text-3xl font-bold mt-2">
                  ${getTotalBalance().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-sm opacity-75 mt-1">
                  Across {connected_wallets.length} wallet{connected_wallets.length !== 1 ? 's' : ''}
                </p>
              </div>
            </Card>

            {/* Wallet Management Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => onNavigate?.('wallet-manager')}
                variant="outline"
                className="py-3"
              >
                💼 Manage Wallets
              </Button>
              <Button
                onClick={() => onNavigate?.('crypto-deposit')}
                variant="primary"
                className="py-3"
              >
                📥 Deposit
              </Button>
            </div>

            {/* Individual Wallet Cards */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Your Wallets</h3>
              
              {connected_wallets.map((wallet) => {
                const balance = walletBalances[wallet.id];
                
                return (
                  <Card key={wallet.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="text-2xl">
                          {getWalletTypeIcon(wallet.type)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold text-gray-900">
                              {wallet.name || `${wallet.type} Wallet`}
                            </h4>
                            {wallet.is_primary && (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                PRIMARY
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 font-mono">
                            {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                          </p>
                          
                          <div className="flex flex-wrap gap-1 mt-1">
                            {wallet.networks.map(network => (
                              <span 
                                key={network}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                              >
                                {network.toUpperCase()}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {balance?.error ? (
                          <span className="text-red-600 text-sm">Error loading</span>
                        ) : balance ? (
                          <div>
                            <div className="font-semibold text-gray-900">
                              ${(balance.total_usd || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            {Object.entries(balance.balances || {}).map(([network, networkBalance]: [string, any]) => (
                              <div key={network} className="text-xs text-gray-600">
                                {network}: ${(networkBalance.total || 0).toFixed(2)}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Loading...</span>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        ) : (
          /* No Wallets Connected - Verification Required */
          <Card className="p-8 text-center">
            {user?.email_verified && user?.phone_verified ? (
              // User is verified - show wallet connection
              <div className="text-gray-500">
                <div className="text-4xl mb-4">💼</div>
                <h4 className="text-lg font-medium mb-2">No Wallets Connected</h4>
                <p className="text-sm mb-6">Connect your first crypto wallet to start using VonVault DeFi</p>
                <div className="space-y-3">
                  <Button
                    onClick={() => onNavigate?.('connect-crypto')}
                    variant="primary"
                    className="w-full py-3"
                  >
                    Connect Crypto Wallet
                  </Button>
                  <Button
                    onClick={() => onNavigate?.('wallet-manager')}
                    variant="outline"
                    className="w-full py-3"
                  >
                    Manage Wallets
                  </Button>
                </div>
              </div>
            ) : (
              // User not verified - show verification requirement
              <div className="text-gray-500">
                <div className="text-4xl mb-4">🔒</div>
                <h4 className="text-lg font-medium mb-2 text-yellow-400">Verification Required</h4>
                <p className="text-sm mb-6">To connect crypto wallets and make real transactions, please verify your email and phone number first.</p>
                
                <div className="bg-yellow-900/20 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-yellow-400">⚠️</span>
                    <h5 className="font-medium text-yellow-300">Security & Compliance</h5>
                  </div>
                  <div className="text-sm text-yellow-200 space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className={user?.email_verified ? "text-green-400" : "text-yellow-400"}>
                        {user?.email_verified ? "✅" : "📧"}
                      </span>
                      <span>Email Verification {user?.email_verified ? "(Complete)" : "(Required)"}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={user?.phone_verified ? "text-green-400" : "text-yellow-400"}>
                        {user?.phone_verified ? "✅" : "📱"}
                      </span>
                      <span>Phone Verification {user?.phone_verified ? "(Complete)" : "(Required)"}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Button
                    onClick={() => onNavigate?.('email-verification')}
                    variant="primary"
                    className="w-full py-3"
                    disabled={user?.email_verified}
                  >
                    {user?.email_verified ? "Email Verified ✅" : "Verify Email Address"}
                  </Button>
                  <Button
                    onClick={() => onNavigate?.('sms-verification')}
                    variant="outline"
                    className="w-full py-3"
                    disabled={user?.phone_verified}
                  >
                    {user?.phone_verified ? "Phone Verified ✅" : "Verify Phone Number"}
                  </Button>
                </div>
                
                <div className="mt-4 text-xs text-gray-400">
                  Verification helps protect your funds and ensures regulatory compliance
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Business Deposit Addresses (VonVault's wallets for deposits) */}
        {businessBalances && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">VonVault Deposit Addresses</h3>
            <Card className="p-4">
              <div className="space-y-3">
                {Object.entries(businessBalances.addresses || {}).map(([token, networks]: [string, any]) => (
                  <div key={token} className="border-b border-gray-200 pb-3 last:border-0">
                    <h4 className="font-medium text-gray-900 mb-2">{token.toUpperCase()}</h4>
                    {Object.entries(networks).map(([network, address]: [string, any]) => (
                      <div key={network} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{network.charAt(0).toUpperCase() + network.slice(1)}:</span>
                        <span className="font-mono text-gray-800">{address}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};