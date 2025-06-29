import React, { useEffect, useState } from 'react';
import type { ScreenProps } from '../../types';
import { ScreenHeader } from '../layout/ScreenHeader';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { MembershipBadge } from '../common/MembershipBadge';
import { useApp } from '../../context/AppContext';
import { useMembership } from '../../hooks/useMembership';
import { useLanguage } from '../../hooks/useLanguage';
import { apiService } from '../../services/api';
import { secureStorage } from '../../utils/secureStorage';

export const ProfileScreen: React.FC<ScreenProps> = ({ onBack, onNavigate }) => {
  const { user, setUser, connected_wallets } = useApp();
  const { membershipStatus, fetchMembershipStatus } = useMembership(user);
  const { currentLanguage, availableLanguages, changeLanguage, t } = useLanguage();
  
  // Debug logging
  useEffect(() => {
    console.log('ProfileScreen mounted');
    console.log('User from context:', user);
    console.log('User token:', user?.token);
    console.log('Membership status:', membershipStatus);
    
    const localStorageUser = localStorage.getItem('currentUser');
    if (localStorageUser) {
      try {
        const parsedUser = JSON.parse(localStorageUser);
        console.log('User from localStorage:', parsedUser);
        
        // If context user is null but localStorage has user data, restore it
        if (!user && parsedUser) {
          console.log('Context user is null, but localStorage has user data. Restoring...');
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Error parsing localStorage user:', error);
      }
    } else {
      console.log('No user found in localStorage');
    }
  }, [user, membershipStatus, setUser]);
  
  // Profile deletion state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteErrors, setDeleteErrors] = useState<string>('');
  
  useEffect(() => {
    fetchMembershipStatus();
  }, [fetchMembershipStatus]);

  const handleLogout = () => {
    // Clear token from secure storage
    secureStorage.removeToken();
    setUser(null);
    alert('Logged out successfully');
    onBack?.();
  };

  const handleEditProfile = () => {
    onNavigate?.('edit-profile');
  };

  const handleDeleteProfile = async () => {
    if (!deletePassword.trim()) {
      setDeleteErrors('Password is required to confirm deletion');
      return;
    }

    setDeleteLoading(true);
    setDeleteErrors('');

    try {
      const response = await apiService.deleteProfile(deletePassword);
      
      if (response.success) {
        alert('Profile deleted successfully. You will now be logged out.');
        // Clear token from secure storage
        secureStorage.removeToken();
        setUser(null);
        onBack?.();
      } else {
        setDeleteErrors(response.message || 'Failed to delete profile');
      }
    } catch (error: any) {
      console.error('Profile deletion error:', error);
      setDeleteErrors(error.response?.data?.detail || 'Failed to delete profile. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const canDeleteProfile = () => {
    // For demo purposes, let's simulate some users having connections
    const hasWallets = connected_wallets && connected_wallets.length > 0;
    const hasBankConnection = user?.bank_connected;
    const hasCryptoConnection = user?.crypto_connected;
    
    // If user has legacy wallet_address, consider it as connected wallet for safety
    const hasLegacyWallet = user?.wallet_address && user?.wallet_address.trim().length > 0;
    
    return !hasWallets && !hasBankConnection && !hasCryptoConnection && !hasLegacyWallet;
  };

  const getDeleteBlockedReason = () => {
    const reasons = [];
    if (connected_wallets && connected_wallets.length > 0) {
      reasons.push(`${connected_wallets.length} connected wallet(s)`);
    }
    if (user?.crypto_connected || (user?.wallet_address && user?.wallet_address.trim().length > 0)) {
      reasons.push('connected crypto wallet');
    }
    if (user?.bank_connected) {
      reasons.push('connected bank account');
    }
    // Note: Would also check active investments in real implementation
    
    return reasons.length > 0 ? `Please disconnect: ${reasons.join(', ')}` : '';
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-black text-white px-6 pt-12 pb-8">
      <ScreenHeader title={t('profile:title')} onBack={onBack} />

      <div className="space-y-4">
        {/* User Information */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">{t('profile:sections.personalInfo.title')}</h3>
            <Button onClick={handleEditProfile} size="sm" variant="secondary">
              {t('buttons.edit')}
            </Button>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-400">{t('profile:sections.personalInfo.name')}</p>
              <p className="text-white font-medium">{user?.name || t('profile:sections.personalInfo.notProvided')}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-400">{t('profile:sections.personalInfo.email')}</p>
              <p className="text-white font-medium">{user?.email || t('profile:sections.personalInfo.notProvided')}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-400">{t('profile:sections.personalInfo.userId')}</p>
              <p className="text-white font-medium text-sm">{user?.id || user?.user_id || 'Not available'}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-400">{t('profile:sections.personalInfo.phone')}</p>
              <p className="text-white font-medium">{user?.phone || t('profile:sections.personalInfo.notProvided')}</p>
            </div>
          </div>
        </Card>

        {/* Membership Status */}
        <Card className="border-purple-500/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">{t('profile:sections.membership.title')}</h3>
            <Button 
              onClick={() => onNavigate?.('membership-status')} 
              size="sm" 
              variant="secondary"
            >
              {t('profile:sections.membership.viewDetails')}
            </Button>
          </div>
          <MembershipBadge level={user?.investment_tier || 'basic'} />
        </Card>

        {/* Enhanced 2FA Security - Phase 2 Feature */}
        <Card className="border-green-500/30 bg-gradient-to-r from-green-900/20 to-blue-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold flex items-center gap-2">
                <span>🛡️</span>
                Enhanced 2FA Security
              </p>
              <p className="text-sm text-gray-400">Biometric & Push Notification 2FA</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="px-2 py-1 bg-green-900/50 rounded text-xs text-green-400">
                  NEW: Phase 2
                </div>
                <div className="px-2 py-1 bg-blue-900/50 rounded text-xs text-blue-400">
                  Device-Based Security
                </div>
              </div>
            </div>
            <Button
              onClick={() => onNavigate?.('enhanced-2fa-setup')}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              Setup Enhanced 2FA
            </Button>
          </div>
        </Card>

        {/* Account Status */}
        <Card>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-400">Account Type</p>
              <p className="text-white font-semibold">
                {user?.type === 'bank' ? 'Bank Connected' : 
                 user?.type === 'crypto' ? 'Crypto Connected' : 
                 'Standard Account'}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-400">Authentication Method</p>
              <p className="text-white font-medium">{user?.auth_type || 'Email'}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-400">Member Since</p>
              <p className="text-white font-medium">June 2025</p>
            </div>
          </div>
        </Card>

        {/* Language Preferences */}
        <Card className="border-blue-500/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">{t('profile:sections.language.title')}</h3>
              <p className="text-sm text-gray-400">{t('profile:sections.language.subtitle')}</p>
            </div>
            <span className="text-2xl">🌍</span>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                {t('profile:sections.language.displayLanguage')}
              </label>
              <select 
                className="w-full p-3 bg-gray-900 border border-blue-500/50 rounded-lg text-white focus:border-blue-400 focus:outline-none"
                value={currentLanguage.code}
                onChange={async (e) => {
                  const success = await changeLanguage(e.target.value);
                  if (success) {
                    alert(t('profile:sections.language.changeSuccess'));
                  } else {
                    alert(t('profile:sections.language.changeError'));
                  }
                }}
              >
                {availableLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Language Support Info */}
            <div className="bg-green-900/20 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <span className="text-green-400">✅</span>
                <div>
                  <p className="text-sm text-green-300 font-medium">{t('profile:sections.language.comingSoon')}</p>
                  <p className="text-xs text-green-400">{t('profile:sections.language.developmentNote')}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Connection Status */}
        <Card>
          <h3 className="text-lg font-semibold text-white mb-3">Connection Status</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Bank Account</span>
              <span className={`text-sm px-2 py-1 rounded ${user?.bank_connected ? 'bg-green-900 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
                {user?.bank_connected ? 'Connected' : 'Not Connected'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Crypto Wallet</span>
              <span className={`text-sm px-2 py-1 rounded ${user?.crypto_connected ? 'bg-green-900 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
                {user?.crypto_connected ? 'Connected' : 'Not Connected'}
              </span>
            </div>
          </div>
        </Card>

        {/* Admin Section - Only show for vonartis.com admin users */}
        {(user?.email === 'admin@vonartis.com' || 
          user?.email === 'security@vonartis.com') && (
          <Card className="border-purple-500/50 bg-gradient-to-r from-purple-900/30 to-purple-800/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold flex items-center gap-2">
                  <span>🛠️</span>
                  Admin Dashboard
                </p>
                <p className="text-sm text-gray-400">VonArtis system administration</p>
              </div>
              <Button
                onClick={() => onNavigate?.('admin-dashboard')}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
              >
                Open Dashboard
              </Button>
            </div>
          </Card>
        )}

        {/* Profile Deletion Section */}
        <Card className="border-red-500/50">
          <div className="space-y-4">
            <div>
              <p className="text-white font-semibold text-red-400">⚠️ Danger Zone</p>
              <p className="text-sm text-gray-400">Permanently delete your VonVault account</p>
            </div>
            
            {!canDeleteProfile() && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-400 text-sm">
                  <strong>Cannot delete profile:</strong> {getDeleteBlockedReason()}
                </p>
              </div>
            )}
            
            {!showDeleteConfirm ? (
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="danger"
                size="sm"
                disabled={!canDeleteProfile()}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600"
              >
                Delete Profile
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                  <h4 className="text-red-400 font-semibold mb-2">⚠️ Confirm Profile Deletion</h4>
                  <p className="text-sm text-gray-300 mb-3">
                    This action cannot be undone. All your personal data will be permanently removed.
                  </p>
                  <p className="text-sm text-gray-400 mb-4">
                    Investment records will be preserved for legal/tax purposes but anonymized.
                  </p>
                  
                  <Input
                    label="Enter your password to confirm"
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Password"
                    error={deleteErrors}
                    className="mb-3"
                  />
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={handleDeleteProfile}
                      variant="danger"
                      size="sm"
                      loading={deleteLoading}
                      disabled={deleteLoading || !deletePassword.trim()}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Confirm Delete
                    </Button>
                    <Button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeletePassword('');
                        setDeleteErrors('');
                      }}
                      variant="secondary"
                      size="sm"
                      disabled={deleteLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Button
          onClick={handleLogout}
          variant="danger"
          fullWidth
          size="lg"
        >
          Log Out
        </Button>
      </div>
    </div>
  );
};