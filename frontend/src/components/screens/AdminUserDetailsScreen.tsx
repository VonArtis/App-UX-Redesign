import React, { useState, useEffect } from 'react';
import type { ScreenProps } from '../../types';
import { CleanHeader } from '../layout/CleanHeader';
import { MobileLayoutWithTabs } from '../layout/MobileLayoutWithTabs';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { FullScreenLoader } from '../common/LoadingSpinner';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/api';

interface UserDetails {
  user: {
    id: string;
    user_id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
    email_verified: boolean;
    phone_verified: boolean;
    crypto_connected: boolean;
    bank_connected: boolean;
    created_at: string;
    last_login: string;
    connected_wallets: any[];
    primary_wallet_id: string;
    totp_2fa_enabled: boolean;
    sms_2fa_enabled: boolean;
    email_2fa_enabled: boolean;
  };
  investments: any[];
  crypto_transactions: any[];
  membership: any;
}

export const AdminUserDetailsScreen: React.FC<ScreenProps & { userId?: string }> = ({ 
  onBack, 
  onNavigate,
  userId 
}) => {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useApp();

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user?.token || !userId) {
        setError('Authentication required');
        return;
      }

      const response = await apiService.getAdminUserDetails(user.token, userId);
      
      setUserDetails(response);
    } catch (error: any) {
      console.error('Error fetching user details:', error);
      setError(error.message || 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  const getMembershipIcon = (level: string) => {
    switch (level) {
      case 'basic': return '🌱';
      case 'club': return '🥉';
      case 'premium': return '🥈';
      case 'vip': return '🥇';
      case 'elite': return '💎';
      default: return '👤';
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

  if (loading) {
    return <FullScreenLoader text="Loading user details..." />;
  }

  if (error || !userDetails) {
    return (
      <MobileLayoutWithTabs showTabs={false}>
        <CleanHeader title="User Details" onBack={onBack} />
        <Card className="text-center">
          <div className="text-red-400 mb-4">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">Error Loading User</h3>
          <p className="text-gray-400 mb-4">{error || 'User not found'}</p>
          <Button onClick={() => window.location.reload()} className="bg-purple-400 hover:bg-purple-500">
            Retry
          </Button>
        </Card>
      </MobileLayoutWithTabs>
    );
  }

  const { user: userInfo, investments, crypto_transactions, membership } = userDetails;

  return (
    <MobileLayoutWithTabs showTabs={false}>
      <CleanHeader 
        title="👤 User Details" 
        onBack={onBack}
        action={
          <Button 
            onClick={fetchUserDetails} 
            size="sm" 
            variant="outline"
            className="min-h-[44px]"
          >
            ↻ Refresh
          </Button>
        }
      />

      {/* User Information */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>{getMembershipIcon(membership?.level || 'none')}</span>
          User Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Name</label>
            <div className="text-white font-medium">
              {`${userInfo.first_name} ${userInfo.last_name}`.trim() || 'Not provided'}
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <div className="text-white font-medium flex items-center gap-2">
              {userInfo.email}
              {userInfo.email_verified ? (
                <span className="text-green-400 text-sm">✅ Verified</span>
              ) : (
                <span className="text-red-400 text-sm">❌ Unverified</span>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Phone</label>
            <div className="text-white font-medium flex items-center gap-2">
              {userInfo.phone || 'Not provided'}
              {userInfo.phone && (
                userInfo.phone_verified ? (
                  <span className="text-green-400 text-sm">✅ Verified</span>
                ) : (
                  <span className="text-red-400 text-sm">❌ Unverified</span>
                )
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">User ID</label>
            <div className="text-white font-mono text-sm">{userInfo.user_id}</div>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Member Since</label>
            <div className="text-white">{formatDate(userInfo.created_at)}</div>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Last Login</label>
            <div className="text-white">{formatDate(userInfo.last_login)}</div>
          </div>
        </div>
      </Card>

      {/* Security & 2FA */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>🔐</span>
          Security & 2FA
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className={userInfo.totp_2fa_enabled ? "text-green-400" : "text-gray-400"}>
              {userInfo.totp_2fa_enabled ? "✅" : "❌"}
            </span>
            <span>TOTP/Authenticator</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={userInfo.sms_2fa_enabled ? "text-green-400" : "text-gray-400"}>
              {userInfo.sms_2fa_enabled ? "✅" : "❌"}
            </span>
            <span>SMS 2FA</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={userInfo.email_2fa_enabled ? "text-green-400" : "text-gray-400"}>
              {userInfo.email_2fa_enabled ? "✅" : "❌"}
            </span>
            <span>Email 2FA</span>
          </div>
        </div>
      </Card>

      {/* Membership & Investments */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>💼</span>
          Membership & Investments
        </h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Membership Level</label>
            <div className="text-white font-medium flex items-center gap-2">
              <span>{getMembershipIcon(membership?.level || 'none')}</span>
              <span className="capitalize">{membership?.level_name || 'No Membership'}</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Total Invested</label>
            <div className="text-green-400 font-bold text-lg">
              {formatCurrency(membership?.total_invested || 0)}
            </div>
          </div>
        </div>
        
        {investments.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Recent Investments</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {investments.slice(0, 5).map((investment, index) => (
                <div key={index} className="flex justify-between items-center text-sm bg-gray-800/50 p-2 rounded">
                  <span>{investment.name}</span>
                  <span className="text-green-400 font-medium">
                    {formatCurrency(investment.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Connected Wallets */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>🔗</span>
          Connected Wallets ({userInfo.connected_wallets.length})
        </h3>
        
        {userInfo.connected_wallets.length > 0 ? (
          <div className="space-y-3">
            {userInfo.connected_wallets.map((wallet, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-800/50 p-3 rounded">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getWalletTypeIcon(wallet.type)}</span>
                  <div>
                    <div className="font-medium">{wallet.name || wallet.type}</div>
                    <div className="text-sm text-gray-400 font-mono">
                      {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  {wallet.is_primary && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                      PRIMARY
                    </span>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    {wallet.networks?.join(', ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-4">
            No wallets connected
          </div>
        )}
      </Card>

      {/* Crypto Transactions */}
      {crypto_transactions.length > 0 && (
        <Card className="mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>💰</span>
            Recent Crypto Transactions
          </h3>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {crypto_transactions.slice(0, 10).map((tx, index) => (
              <div key={index} className="flex justify-between items-center text-sm bg-gray-800/50 p-2 rounded">
                <div>
                  <div className="font-medium">{tx.token} {tx.network}</div>
                  <div className="text-gray-400 text-xs">{formatDate(tx.created_at)}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{tx.amount} {tx.token}</div>
                  <div className={`text-xs ${tx.status === 'confirmed' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {tx.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Connection Status */}
      <Card>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>🔌</span>
          Connection Status
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className={`text-2xl ${userInfo.crypto_connected ? 'text-green-400' : 'text-gray-400'}`}>
              {userInfo.crypto_connected ? '🔗' : '⛓️‍💥'}
            </div>
            <div className="text-sm mt-1">
              {userInfo.crypto_connected ? 'Crypto Connected' : 'No Crypto'}
            </div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl ${userInfo.bank_connected ? 'text-green-400' : 'text-gray-400'}`}>
              {userInfo.bank_connected ? '🏦' : '🏧'}
            </div>
            <div className="text-sm mt-1">
              {userInfo.bank_connected ? 'Bank Connected' : 'No Bank'}
            </div>
          </div>
        </div>
      </Card>
    </MobileLayoutWithTabs>
  );
};