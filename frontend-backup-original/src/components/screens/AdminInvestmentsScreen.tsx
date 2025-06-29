import React, { useState, useEffect } from 'react';
import type { ScreenProps } from '../../types';
import { ScreenHeader } from '../layout/ScreenHeader';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { FullScreenLoader } from '../common/LoadingSpinner';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/api';

interface InvestmentAnalytics {
  investments_by_level: Array<{
    _id: string;
    total_amount: number;
    count: number;
  }>;
  daily_investments: Array<{
    _id: string;
    total_amount: number;
    count: number;
  }>;
  top_investors: Array<{
    user_id: string;
    total_invested: number;
    investment_count: number;
    email: string;
    name: string;
    membership_level: string;
  }>;
}

export const AdminInvestmentsScreen: React.FC<ScreenProps> = ({ onBack }) => {
  const [analytics, setAnalytics] = useState<InvestmentAnalytics | null>(null);
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

      const response = await apiService.getAdminInvestments(user.token);
      
      setAnalytics(response);
    } catch (error: any) {
      console.error('Error fetching investment analytics:', error);
      setError(error.message || 'Failed to load investment analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
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

  const getMembershipColor = (level: string) => {
    switch (level) {
      case 'basic': return 'text-green-400';
      case 'club': return 'text-amber-400';
      case 'premium': return 'text-gray-300';
      case 'vip': return 'text-yellow-400';
      case 'elite': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return <FullScreenLoader text="Loading investment analytics..." />;
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-black text-white px-6 pt-12 pb-8">
        <ScreenHeader title="Investment Analytics" onBack={onBack} />
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

  // Calculate totals
  const totalByLevel = analytics.investments_by_level.reduce(
    (acc, level) => ({
      amount: acc.amount + level.total_amount,
      count: acc.count + level.count
    }),
    { amount: 0, count: 0 }
  );

  return (
    <div className="min-h-screen bg-black text-white px-6 pt-12 pb-8">
      <ScreenHeader 
        title="📊 Investment Analytics" 
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
        <Card className="bg-gradient-to-br from-green-900/50 to-green-800/50 border-green-500/30">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">
              {formatCurrency(totalByLevel.amount)}
            </div>
            <div className="text-sm text-green-300">Total Invested</div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 border-blue-500/30">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">
              {totalByLevel.count.toLocaleString()}
            </div>
            <div className="text-sm text-blue-300">Total Investments</div>
          </div>
        </Card>
      </div>

      {/* Investments by Membership Level */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>🏆</span>
          Investments by Membership Level
        </h3>
        
        <div className="space-y-4">
          {analytics.investments_by_level
            .sort((a, b) => b.total_amount - a.total_amount)
            .map((level) => {
              const percentage = totalByLevel.amount > 0 
                ? (level.total_amount / totalByLevel.amount) * 100 
                : 0;
              
              return (
                <div key={level._id} className="bg-gray-800/50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getMembershipIcon(level._id)}</span>
                      <span className={`font-medium capitalize ${getMembershipColor(level._id)}`}>
                        {level._id === 'none' ? 'No Membership' : level._id}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-400">
                        {formatCurrency(level.total_amount)}
                      </div>
                      <div className="text-sm text-gray-400">
                        {level.count} investments
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-500"
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
      </Card>

      {/* Daily Investment Trend */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>📈</span>
          Daily Investment Trend (Last 30 Days)
        </h3>
        
        {analytics.daily_investments.length > 0 ? (
          <div className="space-y-2">
            {analytics.daily_investments.slice(-7).map((day) => (
              <div key={day._id} className="flex items-center justify-between py-2 border-b border-gray-700">
                <div className="text-sm text-gray-400">
                  {formatDate(day._id)}
                </div>
                <div className="text-right">
                  <div className="font-medium text-green-400">
                    {formatCurrency(day.total_amount)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {day.count} investments
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            No investment data for the last 30 days
          </div>
        )}
      </Card>

      {/* Top Investors */}
      <Card>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>🥇</span>
          Top Investors
        </h3>
        
        {analytics.top_investors.length > 0 ? (
          <div className="space-y-3">
            {analytics.top_investors.map((investor, index) => (
              <div key={investor.user_id} className="bg-gray-800/50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-white">
                        {investor.name || 'Unnamed User'}
                      </div>
                      <div className="text-sm text-gray-400">
                        {investor.email}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm">{getMembershipIcon(investor.membership_level)}</span>
                      <span className={`text-xs capitalize ${getMembershipColor(investor.membership_level)}`}>
                        {investor.membership_level}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-bold text-green-400">
                      {formatCurrency(investor.total_invested)}
                    </div>
                    <div className="text-sm text-gray-400">
                      {investor.investment_count} investments
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            No investors found
          </div>
        )}
      </Card>
    </div>
  );
};