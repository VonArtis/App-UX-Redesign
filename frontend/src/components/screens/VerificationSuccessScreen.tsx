import React, { useEffect, useState } from 'react';
import type { ScreenProps } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { MobileLayout } from '../layout/MobileLayout';
import { useApp } from '../../context/AppContext';

export const VerificationSuccessScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  const [showCelebration, setShowCelebration] = useState(false);
  const { user } = useApp();

  // Trigger celebration animation
  useEffect(() => {
    setTimeout(() => setShowCelebration(true), 500);
  }, []);

  const handleContinue = () => {
    // Navigate to dashboard since verification is complete
    onNavigate?.('dashboard');
  };

  const formatTime = () => {
    return new Date().toLocaleString();
  };

  return (
    <MobileLayout>
      <div className="min-h-screen flex flex-col justify-center">
        {/* Celebration Animation */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {showCelebration && (
            <>
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-bounce"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${2 + Math.random() * 2}s`
                  }}
                >
                  {['🎉', '✨', '🎊', '⭐'][Math.floor(Math.random() * 4)]}
                </div>
              ))}
            </>
          )}
        </div>

        <Card className="text-center relative z-10 bg-gradient-to-br from-green-900/50 to-blue-900/50 border-green-500/30">
          <div className="space-y-6">
            {/* Success Icon */}
            <div className="relative">
              <div className="w-24 h-24 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 relative overflow-hidden">
                <div className={`absolute inset-0 bg-green-400 rounded-full transform ${showCelebration ? 'animate-ping' : ''}`}></div>
                <svg className="w-12 h-12 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              {/* Verified Badge */}
              <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-bold">
                VERIFIED
              </div>
            </div>

            {/* Success Message */}
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">
                🎉 Verification Complete!
              </h1>
              <p className="text-gray-300 text-lg">
                Your account has been successfully verified
              </p>
            </div>

            {/* Verification Details */}
            <Card className="bg-gray-800/50 border-gray-600">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <span className="text-green-400">✓</span>
                Verification Status
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Email:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white">{user?.email || 'user@example.com'}</span>
                    <span className="text-green-400">✓</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Phone:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white">{user?.phone || '+1xxxxxxxxxx'}</span>
                    <span className="text-green-400">✓</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Verified:</span>
                  <span className="text-white">{formatTime()}</span>
                </div>
              </div>
            </Card>

            {/* Next Steps */}
            <Card className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-500/30">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <span className="text-purple-400">🚀</span>
                You're Ready to Invest!
              </h3>
              
              <div className="text-sm text-gray-300 text-left space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Access to all investment plans and crypto deposits</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Multi-network crypto support (Ethereum, Polygon, BSC)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Membership tier progression (6% - 20% APY)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-400 mt-0.5">⏳</span>
                  <span>KYC verification required for investments over $20,000</span>
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleContinue}
                fullWidth
                size="lg"
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-lg"
              >
                <span className="flex items-center justify-center gap-2">
                  <span>🎯</span>
                  Go to Dashboard
                </span>
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => onNavigate?.('new-investment')}
                  variant="secondary"
                  className="bg-purple-800/50 hover:bg-purple-700/50 border-purple-500/50"
                >
                  Start Investing
                </Button>
                
                <Button
                  onClick={() => onNavigate?.('crypto-deposit')}
                  variant="secondary"
                  className="bg-orange-800/50 hover:bg-orange-700/50 border-orange-500/50"
                >
                  Deposit Crypto
                </Button>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <span className="text-blue-400 text-lg">🔒</span>
                <div className="text-left">
                  <p className="text-blue-300 font-medium text-sm">Account Secured</p>
                  <p className="text-blue-200 text-xs">
                    Your verified contact information helps protect your account and ensures you receive important updates about your investments.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-xs">
            Need help? Contact support at support@vonartis.app
          </p>
        </div>
      </div>
    </MobileLayout>
  );
};