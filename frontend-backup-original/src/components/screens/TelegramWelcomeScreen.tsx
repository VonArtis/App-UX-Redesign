import React, { useEffect, useState } from 'react';
import type { AuthScreenProps } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { useTelegram } from '../../context/TelegramContext';
import { apiService } from '../../services/api';

export const TelegramWelcomeScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const { isTelegram, user: telegramUser, webApp, hapticFeedback } = useTelegram();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Auto-authenticate if we have Telegram user data
    if (isTelegram && telegramUser && webApp?.initData) {
      handleTelegramAuth();
    }
  }, [isTelegram, telegramUser]);

  const handleTelegramAuth = async () => {
    try {
      setLoading(true);
      setError('');
      hapticFeedback?.('impact', 'light');

      // Get the init data from Telegram WebApp
      const initData = webApp?.initData;
      
      if (!initData) {
        throw new Error('No Telegram data available');
      }

      // Authenticate with our backend
      const response = await apiService.telegramWebAppAuth({ initData });
      
      if (response.authenticated) {
        // Success haptic feedback
        hapticFeedback?.('notification', 'success');
        
        // Call onLogin with user data
        onLogin?.({
          id: response.user.id,
          name: `${response.user.first_name} ${response.user.last_name}`.trim(),
          email: `telegram_${response.user.telegram_id}@vonvault.app`,
          token: response.token,
          auth_type: 'telegram'
        });
      }
    } catch (error: any) {
      console.error('Telegram authentication failed:', error);
      setError(error.message || 'Authentication failed');
      hapticFeedback?.('notification', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isTelegram) {
    // Regular web browser - show normal welcome
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      {/* VonVault Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="mb-6 animate-float">
          <svg className="h-16 w-16 text-purple-500" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <polygon points="10,80 40,20 50,35 60,20 90,80 70,80 50,45 30,80" fill="#9333ea" />
            <circle cx="50" cy="50" r="15" fill="none" stroke="#9333ea" strokeWidth="4" />
          </svg>
        </div>
        
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
          VonVault
        </h1>
        <p className="text-center text-sm text-gray-400 mb-2">
          Premium DeFi Investment Platform
        </p>
        <p className="text-center text-xs text-purple-300">
          🏆 4-Tier Membership System • 6% - 20% APY
        </p>
      </div>

      {/* Telegram User Greeting */}
      {telegramUser && (
        <Card className="mb-6 bg-gradient-to-r from-purple-600 to-purple-800 text-center">
          <div className="text-2xl mb-2">👋</div>
          <h2 className="text-xl font-bold mb-2">
            Welcome, {telegramUser.first_name}!
          </h2>
          <p className="text-purple-200 text-sm">
            Ready to start your investment journey?
          </p>
        </Card>
      )}

      {/* Authentication Section */}
      <div className="w-full max-w-xs space-y-4">
        {loading ? (
          <Card className="text-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-3"></div>
            <p className="text-gray-400">Authenticating with Telegram...</p>
          </Card>
        ) : error ? (
          <Card className="text-center p-6 border-red-500/50 bg-red-500/10">
            <div className="text-2xl mb-2">⚠️</div>
            <p className="text-red-400 text-sm mb-3">{error}</p>
            <Button
              onClick={handleTelegramAuth}
              className="bg-purple-600 hover:bg-purple-700"
              size="sm"
            >
              Try Again
            </Button>
          </Card>
        ) : (
          <Button
            onClick={handleTelegramAuth}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 py-4"
            size="lg"
          >
            <span className="flex items-center justify-center gap-2">
              <span className="text-xl">🚀</span>
              Enter VonVault
            </span>
          </Button>
        )}
      </div>

      {/* Features Preview */}
      <div className="mt-8 space-y-3 w-full max-w-xs">
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span className="text-amber-400">🥉</span>
          <span>Club Member: 6% APY</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span className="text-gray-300">🥈</span>
          <span>Premium Member: 8-10% APY</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span className="text-yellow-400">🥇</span>
          <span>VIP Member: 12-14% APY</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span className="text-purple-400">💎</span>
          <span>Elite Member: 16-20% APY</span>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-center text-gray-500">
        Secure DeFi investments with bank-grade security<br />
        <span className="text-purple-400">Powered by Telegram Mini Apps</span>
      </p>
    </div>
  );
};