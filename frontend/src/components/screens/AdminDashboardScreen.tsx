import React, { useState, useEffect } from 'react';
import type { ScreenProps } from '../../types';
import { CleanHeader } from '../layout/CleanHeader';
import { MobileLayoutWithTabs } from '../layout/MobileLayoutWithTabs';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { FullScreenLoader } from '../common/LoadingSpinner';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/api';

interface AdminOverview {
  users: {
    total: number;
    verified: number;
    with_investments: number;
    recent_signups: number;
  };
  investments: {
    total_amount: number;
    total_count: number;
    recent_count: number;
  };
  membership_distribution: { [key: string]: number };
  verification_rate: number;
}

export const AdminDashboardScreen: React.FC<ScreenProps> = ({ onBack, onNavigate }) => {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useApp();

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user?.token) {
        setError('Authentication required');
        return;
      }

      const response = await apiService.getAdminOverview(user.token);
      
      setOverview(response);
    } catch (error: any) {
      console.error('Error fetching admin overview:', error);
      setError(error.message || 'Failed to load admin overview');
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return <FullScreenLoader text="Loading admin dashboard..." />;
  }

  if (error) {
    return (
      <MobileLayoutWithTabs showTabs={false}>
        <CleanHeader title="Admin Dashboard" onBack={onBack} />
        <Card className="text-center">
          <div className="text-red-400 mb-4">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">Access Error</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-purple-400 hover:bg-purple-500">
            Retry
          </Button>
        </Card>
      </MobileLayoutWithTabs>
    );
  }

  if (!overview) {
    return (
      <MobileLayoutWithTabs showTabs={false}>
        <CleanHeader title="Admin Dashboard" onBack={onBack} />
        <div className="text-center text-gray-400 mt-8">
          No data available
        </div>
      </MobileLayoutWithTabs>
    );
  }

  return (
    <MobileLayoutWithTabs showTabs={false}>
      <CleanHeader 
        title="🛠️ Admin Dashboard" 
        onBack={onBack}
        action={
          <Button 
            onClick={fetchOverview} 
            size="sm" 
            variant="outline"
            className="min-h-[44px]"
          >
            ↻ Refresh
          </Button>
        }
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 border-blue-500/30">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">
              {overview.users.total.toLocaleString()}
            </div>
            <div className="text-sm text-blue-300">Total Users</div>
            <div className="text-xs text-gray-400 mt-1">
              {overview.users.recent_signups} new this week
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-900/50 to-green-800/50 border-green-500/30">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">
              {formatCurrency(overview.investments.total_amount)}
            </div>
            <div className="text-sm text-green-300">Total Invested</div>
            <div className="text-xs text-gray-400 mt-1">
              {overview.investments.total_count} investments
            </div>
          </div>
        </Card>
      </div>

      {/* Verification Rate */}
      <Card className="mb-6 bg-gradient-to-br from-purple-900/50 to-purple-800/50 border-purple-500/30">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <span>🔐</span>
          User Verification
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold text-purple-400">
              {overview.verification_rate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-400">Verification Rate</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400">
              {overview.users.verified.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">Verified Users</div>
          </div>
        </div>
        <div className="mt-3 bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-purple-400 to-purple-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${overview.verification_rate}%` }}
          ></div>
        </div>
      </Card>

      {/* Membership Distribution */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>🏆</span>
          Membership Distribution
        </h3>
        <div className="space-y-3">
          {Object.entries(overview.membership_distribution).map(([level, count]) => (
            <div key={level} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getMembershipIcon(level)}</span>
                <span className="capitalize">{level === 'none' ? 'No Membership' : level}</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">{count}</div>
                <div className="text-xs text-gray-400">
                  {((count / overview.users.total) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Admin Actions */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        <Button
          onClick={() => onNavigate?.('admin-users')}
          className="min-h-[44px] h-16 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 flex items-center justify-between px-6"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">👥</span>
            <div className="text-left">
              <div className="font-semibold">User Management</div>
              <div className="text-sm opacity-75">View, search & manage users</div>
            </div>
          </div>
          <span>→</span>
        </Button>

        <Button
          onClick={() => onNavigate?.('admin-investments')}
          className="min-h-[44px] h-16 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 flex items-center justify-between px-6"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div className="text-left">
              <div className="font-semibold">Investment Analytics</div>
              <div className="text-sm opacity-75">Track investments & performance</div>
            </div>
          </div>
          <span>→</span>
        </Button>

        <Button
          onClick={() => onNavigate?.('admin-crypto')}
          className="min-h-[44px] h-16 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 flex items-center justify-between px-6"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔗</span>
            <div className="text-left">
              <div className="font-semibold">Crypto Analytics</div>
              <div className="text-sm opacity-75">Monitor wallets & transactions</div>
            </div>
          </div>
          <span>→</span>
        </Button>

        <Button
          onClick={() => onNavigate?.('admin-plans')}
          className="min-h-[44px] h-16 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 flex items-center justify-between px-6"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚙️</span>
            <div className="text-left">
              <div className="font-semibold">Investment Plans</div>
              <div className="text-sm opacity-75">Manage investment offerings</div>
            </div>
          </div>
          <span>→</span>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="text-center bg-gradient-to-br from-yellow-900/50 to-yellow-800/50 border-yellow-500/30">
          <div className="text-2xl font-bold text-yellow-400">
            {overview.users.with_investments}
          </div>
          <div className="text-sm text-yellow-300">Active Investors</div>
        </Card>
        
        <Card className="text-center bg-gradient-to-br from-cyan-900/50 to-cyan-800/50 border-cyan-500/30">
          <div className="text-2xl font-bold text-cyan-400">
            {overview.investments.recent_count}
          </div>
          <div className="text-sm text-cyan-300">Recent Investments</div>
        </Card>
      </div>
    </MobileLayoutWithTabs>
  );
};