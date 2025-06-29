import React, { useState } from 'react';
import type { ScreenProps } from '../../types';
import { ScreenHeader } from '../layout/ScreenHeader';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { MobileLayout } from '../layout/MobileLayout';

export const TwoFactorSetupScreen: React.FC<ScreenProps> = ({ onBack, onNavigate }) => {
  const [selectedMethod, setSelectedMethod] = useState<'sms' | 'authenticator' | null>(null);
  const [backupMethod, setBackupMethod] = useState<'sms' | 'authenticator' | null>(null);
  const [showBackupOptions, setShowBackupOptions] = useState(false);

  const handleMethodSelect = (method: 'sms' | 'authenticator') => {
    setSelectedMethod(method);
    // Reset backup if same as primary
    if (backupMethod === method) {
      setBackupMethod(null);
    }
  };

  const handleContinue = () => {
    if (!selectedMethod) return;
    
    // Navigate to specific setup screen based on selected method
    if (selectedMethod === 'sms') {
      onNavigate?.('2fa-sms-setup');
    } else {
      onNavigate?.('2fa-authenticator-setup');
    }
  };

  const toggleBackupOptions = () => {
    setShowBackupOptions(!showBackupOptions);
  };

  const getBackupOptions = () => {
    if (!selectedMethod) return [];
    return selectedMethod === 'sms' ? ['authenticator'] : ['sms'];
  };

  return (
    <MobileLayout>
      <ScreenHeader title="Setup 2-Factor Authentication" onBack={onBack} />

      {/* Security Notice */}
      <Card className="mb-6 border-blue-500/30 bg-blue-900/20">
        <div className="flex items-start gap-3">
          <div className="text-blue-400 text-xl">🛡️</div>
          <div>
            <h3 className="text-blue-400 font-semibold mb-2">Enhanced Security Required</h3>
            <p className="text-sm text-gray-300">
              Two-factor authentication (2FA) is required for all VonVault accounts to protect your investments and personal information.
            </p>
          </div>
        </div>
      </Card>

      {/* Method Selection */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold mb-4 text-white">Choose Your Primary 2FA Method</h3>
        <p className="text-sm text-gray-400 mb-6">
          Select your preferred method for verifying your identity when logging in and making transactions.
        </p>

        <div className="space-y-4">
          {/* SMS Option */}
          <div
            onClick={() => handleMethodSelect('sms')}
            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
              selectedMethod === 'sms'
                ? 'border-green-500 bg-green-900/20'
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">📱</div>
              <div className="flex-1">
                <h4 className="text-white font-semibold">SMS Text Messages</h4>
                <p className="text-sm text-gray-400 mt-1">
                  Receive 6-digit codes via text message to your verified phone number
                </p>
                <div className="mt-2 text-xs">
                  <span className="text-green-400">✓ Easy to use</span>
                  <span className="text-gray-400 ml-4">• Works on any phone</span>
                  <span className="text-yellow-400 ml-4">⚠ Requires cellular signal</span>
                </div>
              </div>
              {selectedMethod === 'sms' && (
                <div className="text-green-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Authenticator Option */}
          <div
            onClick={() => handleMethodSelect('authenticator')}
            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
              selectedMethod === 'authenticator'
                ? 'border-purple-500 bg-purple-900/20'
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">🔐</div>
              <div className="flex-1">
                <h4 className="text-white font-semibold">Authenticator App</h4>
                <p className="text-sm text-gray-400 mt-1">
                  Use Google Authenticator, Authy, or Microsoft Authenticator for secure codes
                </p>
                <div className="mt-2 text-xs">
                  <span className="text-green-400">✓ Most secure</span>
                  <span className="text-green-400 ml-4">✓ Works offline</span>
                  <span className="text-gray-400 ml-4">• No SIM swapping risk</span>
                </div>
              </div>
              {selectedMethod === 'authenticator' && (
                <div className="text-purple-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Backup Method Section */}
      <Card className="mb-6 border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Backup Method</h3>
          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Recommended</span>
        </div>
        
        <p className="text-sm text-gray-400 mb-4">
          Add a backup method in case you lose access to your primary 2FA method.
        </p>

        <Button
          onClick={toggleBackupOptions}
          variant="secondary"
          size="sm"
          className="mb-4"
        >
          {showBackupOptions ? 'Hide Backup Options' : 'Add Backup Method (Optional)'}
        </Button>

        {showBackupOptions && selectedMethod && (
          <div className="space-y-3">
            {getBackupOptions().map((method) => (
              <div
                key={method}
                onClick={() => setBackupMethod(method === backupMethod ? null : method as 'sms' | 'authenticator')}
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  backupMethod === method
                    ? 'border-orange-500 bg-orange-900/20'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{method === 'sms' ? '📱' : '🔐'}</span>
                    <span className="text-white font-medium">
                      {method === 'sms' ? 'SMS Backup' : 'Authenticator Backup'}
                    </span>
                  </div>
                  {backupMethod === method && (
                    <div className="text-orange-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Security Benefits */}
      <Card className="mb-6 bg-gray-900/50 border-gray-700">
        <h4 className="font-semibold mb-3 text-white flex items-center gap-2">
          <span>🔒</span>
          Why 2FA is Important
        </h4>
        <div className="text-sm text-gray-300 space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            <span>Protects your investments even if your password is compromised</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            <span>Required for all transactions and account changes</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            <span>Industry standard security for financial platforms</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            <span>Backup methods ensure you never lose access to your account</span>
          </div>
        </div>
      </Card>

      {/* Continue Button */}
      <div className="space-y-3">
        <Button
          onClick={handleContinue}
          disabled={!selectedMethod}
          fullWidth
          size="lg"
          className={`${
            selectedMethod
              ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
              : 'bg-gray-600 cursor-not-allowed'
          }`}
        >
          {selectedMethod
            ? `Setup ${selectedMethod === 'sms' ? 'SMS' : 'Authenticator'} 2FA`
            : 'Select a 2FA Method to Continue'
          }
        </Button>

        {/* Skip Button for Admin/Testing */}
        <Button
          onClick={() => {
            console.log('2FA setup skipped - proceeding to dashboard');
            
            // Mark verification as completed so user doesn't see this flow again
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            if (currentUser.email) {
              localStorage.setItem(`verification_${currentUser.email}`, 'completed');
              console.log(`Verification marked as completed for ${currentUser.email}`);
            }
            
            onNavigate?.('dashboard');
          }}
          variant="secondary"
          fullWidth
          size="lg"
          className="mt-3 border-yellow-500 text-yellow-400 hover:bg-yellow-500/10"
        >
          Skip 2FA Setup - Access Dashboard
        </Button>

        {selectedMethod && (
          <p className="text-center text-xs text-gray-500">
            {backupMethod
              ? `Primary: ${selectedMethod === 'sms' ? 'SMS' : 'Authenticator'} • Backup: ${backupMethod === 'sms' ? 'SMS' : 'Authenticator'}`
              : 'You can add a backup method later in security settings'
            }
          </p>
        )}
      </div>
    </MobileLayout>
  );
};