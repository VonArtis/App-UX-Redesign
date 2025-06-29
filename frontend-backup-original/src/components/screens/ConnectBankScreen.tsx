import React, { useState } from 'react';
import type { ConnectionScreenProps } from '../../types';
import { ScreenHeader } from '../layout/ScreenHeader';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { useApp } from '../../context/AppContext';

export const ConnectBankScreen: React.FC<ConnectionScreenProps> = ({ onConnect, onBack, onNavigate }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'start' | 'connecting' | 'success'>('start');
  const { user } = useApp();

  // Check if user is verified
  const isVerified = user?.email_verified && user?.phone_verified;

  const handleConnect = async () => {
    if (!onConnect) {
      console.error('onConnect prop is missing');
      return;
    }
    
    setLoading(true);
    setStep('connecting');
    
    try {
      // Simulate API call with progress
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStep('success');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Call the parent's connect handler
      await onConnect();
    } catch (error) {
      console.error('Bank connection error:', error);
      alert('Connection failed. Please try again.');
      setStep('start');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Skip to dashboard or next screen
    onBack?.(); // This will be handled by parent to navigate appropriately
  };

  return (
    <div className="min-h-screen bg-black text-white px-6 pt-12 pb-8">
      <ScreenHeader title="Connect Bank" onBack={onBack} />

      <Card padding="lg" className="space-y-4">
        {!isVerified ? (
          // User not verified - show verification requirement
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-yellow-400">Verification Required</h2>
            <p className="text-gray-400 text-sm mb-6">
              To connect bank accounts and access financial features, please verify your email and phone number first.
            </p>
            
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
        ) : (
          // User is verified - show bank connection flow
          <>
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">Secure Bank Connection</h2>
              <p className="text-gray-400 text-sm">
                {step === 'connecting' ? 'Establishing secure connection...' :
                 step === 'success' ? 'Connection established successfully!' :
                 'Connect your bank account securely through our trusted partner Teller API'}
              </p>
            </div>
            
            {step === 'start' && (
              <div className="space-y-3 text-sm text-gray-400">
                <div className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  Bank-grade 256-bit encryption
                </div>
                <div className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  Read-only access to balances
                </div>
                <div className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  No storage of banking credentials
                </div>
                <div className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  Trusted by 1000+ financial institutions
                </div>
              </div>
            )}

            {step === 'connecting' && (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <div className="space-y-2 text-sm text-gray-400">
                  <p>🔐 Establishing secure connection...</p>
                  <p>🏦 Connecting to banking partner...</p>
                  <p>✅ Verifying account access...</p>
                </div>
              </div>
            )}

            {step === 'success' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-green-400 font-semibold">Bank account connected successfully!</p>
              </div>
            )}
            
            <Button
              onClick={handleConnect}
              loading={loading}
              disabled={loading}
              fullWidth
              size="lg"
            >
              {step === 'connecting' ? 'Connecting to Bank...' : 
               step === 'success' ? 'Connected! ✓' : 
               'Link Bank Account'}
            </Button>
            
            <Button
              onClick={handleSkip}
              variant="secondary"
              fullWidth
              size="lg"
              disabled={loading}
              className="mt-3"
            >
              Skip for Now
            </Button>
            
            <p className="text-xs text-gray-500 text-center mt-3">
              You can connect your bank account later from your profile to access all financial features
            </p>
          </>
        )}
      </Card>
    </div>
  );
};