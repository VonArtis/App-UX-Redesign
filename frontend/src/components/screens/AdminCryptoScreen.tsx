import React, { useState, useEffect } from 'react';
import type { ScreenProps } from '../../types';
import { ScreenHeader } from '../layout/ScreenHeader';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { FullScreenLoader } from '../common/LoadingSpinner';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/api';

interface CryptoAnalytics {
  users_with_crypto: number;
  wallet_distribution: Array<{
    _id: string;
    count: number;
  }>;
  business_balances: any;
  recent_transactions: Array<{
    id: string;
    user_id: string;
    transaction_hash: string;
    from_address: string;
    to_address: string;
    amount: number;
    token: string;
    network: string;
    status: string;
    created_at: string;
  }>;
}

export const AdminCryptoScreen: React.FC<ScreenProps> = ({ onBack }) => {
  const [analytics, setAnalytics] = useState<CryptoAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useApp();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user?.token) {
        setError('Authentication required');
        return;
      }

      const response = await apiService.getAdminCrypto(user.token);
      
      setAnalytics(response);
    } catch (error: any) {
      console.error('Error fetching crypto analytics:', error);
      setError(error.message || 'Failed to load crypto analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return '✅';
      case 'pending': return '⏳';
      case 'failed': return '❌';
      default: return '❓';
    }
  };

  if (loading) {
    return <FullScreenLoader text="Loading crypto analytics..." />;
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-black text-white px-6 pt-12 pb-8">
        <ScreenHeader title="Crypto Analytics" onBack={onBack} />
        <Card className="text-center">
          <div className="text-red-400 mb-4">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">Error Loading Analytics</h3>
          <p className="text-gray-400 mb-4">{error || 'Failed to load data'}</p>
          <Button onClick={fetchAnalytics} variant="primary">
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  // Calculate total business balance
  const totalBusinessBalance = analytics.business_balances?.totals?.total_usd || 0;

  return (
    <div className="min-h-screen bg-black text-white px-6 pt-12 pb-8">
      <ScreenHeader 
        title="🔗 Crypto Analytics" 
        onBack={onBack}
        action={
          <Button 
            onClick={fetchAnalytics} 
            size="sm" 
            variant="outline"
          >
            ↻ Refresh
          </Button>
        }
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-orange-900/50 to-orange-800/50 border-orange-500/30">
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-400">
              {analytics.users_with_crypto.toLocaleString()}
            </div>
            <div className="text-sm text-orange-300">Users with Crypto</div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-900/50 to-green-800/50 border-green-500/30">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">
              {formatCurrency(totalBusinessBalance)}
            </div>
            <div className="text-sm text-green-300">Business Balance</div>
          </div>
        </Card>
      </div>

      {/* Wallet Distribution */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>💼</span>
          Wallet Type Distribution
        </h3>
        
        {analytics.wallet_distribution.length > 0 ? (
          <div className="space-y-3">
            {analytics.wallet_distribution
              .sort((a, b) => b.count - a.count)
              .map((wallet) => {
                const total = analytics.wallet_distribution.reduce((sum, w) => sum + w.count, 0);
                const percentage = total > 0 ? (wallet.count / total) * 100 : 0;
                
                return (
                  <div key={wallet._id} className="bg-gray-800/50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{getWalletTypeIcon(wallet._id)}</span>
                        <span className="font-medium capitalize">{wallet._id}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white">{wallet.count}</div>
                        <div className="text-sm text-gray-400">wallets</div>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-orange-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {percentage.toFixed(1)}% of total
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            No wallet data available
          </div>
        )}
      </Card>

      {/* Business Crypto Balances */}
      {analytics.business_balances && (
        <Card className="mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>🏦</span>
            VonVault Business Balances
          </h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-800/50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-400">
                {formatCurrency(analytics.business_balances.totals?.usdc || 0)}
              </div>
              <div className="text-sm text-gray-400">Total USDC</div>
            </div>
            
            <div className="bg-gray-800/50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-400">
                {formatCurrency(analytics.business_balances.totals?.usdt || 0)}
              </div>
              <div className="text-sm text-gray-400">Total USDT</div>
            </div>
          </div>

          {analytics.business_balances.balances && Object.keys(analytics.business_balances.balances).length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Network Breakdown</h4>
              <div className="space-y-2">
                {Object.entries(analytics.business_balances.balances).map(([walletType, networks]: [string, any]) => (
                  <div key={walletType} className="bg-gray-800/30 p-2 rounded">
                    <div className="font-medium text-sm mb-1 capitalize">{walletType}</div>
                    {Object.entries(networks).map(([tokenNetwork, balance]: [string, any]) => (
                      <div key={tokenNetwork} className="flex justify-between text-xs text-gray-400">
                        <span>{tokenNetwork.toUpperCase()}</span>
                        <span>{formatCurrency(balance.balance || 0)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Recent Transactions */}
      <Card>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>💰</span>
          Recent Transactions
        </h3>
        
        {analytics.recent_transactions.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {analytics.recent_transactions.map((tx) => (
              <div key={tx.id} className="bg-gray-800/50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getStatusIcon(tx.status)}</span>
                    <div>
                      <div className="font-medium text-sm">
                        {tx.amount} {tx.token}
                      </div>
                      <div className="text-xs text-gray-400">
                        {tx.network.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-sm font-medium ${getStatusColor(tx.status)}`}>
                      {tx.status.toUpperCase()}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDate(tx.created_at)}
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-gray-400 space-y-1">
                  <div>
                    <span className="text-gray-500">From:</span> {tx.from_address.slice(0, 8)}...{tx.from_address.slice(-6)}
                  </div>
                  <div>
                    <span className="text-gray-500">To:</span> {tx.to_address.slice(0, 8)}...{tx.to_address.slice(-6)}
                  </div>
                  {tx.transaction_hash && (
                    <div>
                      <span className="text-gray-500">Hash:</span> {tx.transaction_hash.slice(0, 8)}...{tx.transaction_hash.slice(-6)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            No recent transactions
          </div>
        )}
      </Card>
    </div>
  );
};