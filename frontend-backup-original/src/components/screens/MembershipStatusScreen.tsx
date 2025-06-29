import React, { useState, useEffect } from 'react';
import type { ScreenProps, MembershipStatus, MembershipTier } from '../../types';
import { ScreenHeader } from '../layout/ScreenHeader';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { FullScreenLoader } from '../common/LoadingSpinner';
import { MembershipBadge } from '../common/MembershipBadge';
import { TierProgression } from '../common/TierProgression';
import { EnhancedProgressBar } from '../common/EnhancedProgressBar';
import { InvestmentStatsCard } from '../common/InvestmentStatsCard';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/api';

export const MembershipStatusScreen: React.FC<ScreenProps> = ({ onBack, onNavigate }) => {
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus | null>(null);
  const [membershipTiers, setMembershipTiers] = useState<Record<string, MembershipTier>>({});
  const [loading, setLoading] = useState(true);
  const { user, portfolio } = useApp();

  useEffect(() => {
    fetchMembershipData();
  }, []);

  const fetchMembershipData = async () => {
    if (!user?.token) return;

    try {
      setLoading(true);
      const [statusResponse, tiersResponse] = await Promise.all([
        apiService.getMembershipStatus(user.token),
        apiService.getMembershipTiers()
      ]);
      
      setMembershipStatus(statusResponse);
      setMembershipTiers(tiersResponse.tiers);
    } catch (error) {
      console.error('Error fetching membership data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  const getProgressPercentage = () => {
    if (!membershipStatus || !membershipStatus.amount_to_next) return 100;
    
    const current = membershipStatus.total_invested;
    const target = current + membershipStatus.amount_to_next;
    const progress = (current / target) * 100;
    
    return Math.min(progress, 100);
  };

  const calculateAverageAPY = () => {
    if (!membershipStatus?.available_plans.length) return 0;
    const totalAPY = membershipStatus.available_plans.reduce((sum, plan) => sum + plan.rate, 0);
    return totalAPY / membershipStatus.available_plans.length;
  };

  const calculateProjectedReturns = () => {
    if (!membershipStatus) return 0;
    const averageAPY = calculateAverageAPY();
    return membershipStatus.total_invested * (averageAPY / 100);
  };

  if (loading) {
    return <FullScreenLoader text="Loading membership status..." />;
  }

  if (!membershipStatus) {
    return (
      <div className="min-h-screen bg-black text-white px-6 pt-12 pb-8">
        <ScreenHeader title="Membership Status" onBack={onBack} />
        <div className="text-center text-gray-400 mt-8">
          Unable to load membership status
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 pt-12 pb-8 custom-scrollbar">
      <ScreenHeader title="Membership Status" onBack={onBack} />

      {/* Hero Membership Card */}
      <Card className="mb-6 bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 border-purple-500/30 card-hover-effect animate-fade-in-up">
        <div className="text-center p-6">
          {/* Floating Badge */}
          <div className="flex justify-center mb-4 animate-float">
            <MembershipBadge 
              level={membershipStatus.level} 
              size="xl" 
              showRing={true}
              className="tier-badge-shadow"
            />
          </div>
          
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            {membershipStatus.level_name}
          </h2>
          
          <div className="text-xl mb-6 text-purple-100">
            Total Invested: {formatAmount(membershipStatus.total_invested)}
          </div>
          
          {/* Progress to Next Level */}
          {membershipStatus.next_level && (
            <div className="mt-6 space-y-4">
              <div className="text-lg text-purple-200 font-medium">
                Progress to {membershipStatus.next_level_name}
              </div>
              
              <EnhancedProgressBar
                progress={getProgressPercentage()}
                level={membershipStatus.next_level}
                label={`${formatAmount(membershipStatus.amount_to_next || 0)} more needed`}
                animated={true}
              />
              
              {/* Quick Action */}
              <Button
                onClick={() => onNavigate?.('new-investment')}
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold animate-glow"
              >
                🚀 Invest to Upgrade
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Investment Statistics */}
      {membershipStatus.total_invested > 0 && (
        <InvestmentStatsCard
          totalInvested={membershipStatus.total_invested}
          averageAPY={calculateAverageAPY()}
          totalReturn={calculateProjectedReturns()}
          activeInvestments={portfolio?.investments.count || 0}
          membershipLevel={membershipStatus.level}
          className="mb-6 animate-slide-in-left"
        />
      )}

      {/* Tier Progression Visual */}
      <Card className="mb-6 animate-slide-in-right">
        <TierProgression
          currentLevel={membershipStatus.level}
          totalInvested={membershipStatus.total_invested}
        />
      </Card>

      {/* Available Investment Plans */}
      {membershipStatus.available_plans.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">💼</span>
            Your Available Investment Plans
          </h3>
          <div className="space-y-3">
            {membershipStatus.available_plans.map((plan, index) => (
              <Card 
                key={plan.id} 
                className={`border-2 card-hover-effect animate-fade-in-up ${
                  membershipStatus.level === 'club' ? 'border-amber-500/50 bg-amber-500/5' :
                  membershipStatus.level === 'premium' ? 'border-gray-400/50 bg-gray-400/5' :
                  membershipStatus.level === 'vip' ? 'border-yellow-500/50 bg-yellow-500/5' :
                  'border-purple-500/50 bg-purple-500/5'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <MembershipBadge level={membershipStatus.level} size="md" />
                    <div>
                      <div className="font-semibold text-lg">{plan.name}</div>
                      <div className="text-sm text-gray-400">{plan.description}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        Range: {formatAmount(plan.min_amount)} - {formatAmount(plan.max_amount)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-3xl font-bold ${
                      membershipStatus.level === 'club' ? 'text-amber-400' :
                      membershipStatus.level === 'premium' ? 'text-gray-300' :
                      membershipStatus.level === 'vip' ? 'text-yellow-400' :
                      'text-purple-300'
                    }`}>
                      {plan.rate}%
                    </div>
                    <div className="text-sm text-gray-400">APY</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          <Button
            onClick={() => onNavigate?.('new-investment')}
            fullWidth
            size="lg"
            className="mt-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
          >
            <span className="flex items-center justify-center gap-2">
              <span className="text-xl">🚀</span>
              Start New Investment
            </span>
          </Button>
        </div>
      )}

      {/* All Membership Tiers Overview */}
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          All Membership Tiers
        </h3>
        <div className="space-y-3">
          {Object.entries(membershipTiers).map(([level, tier], index) => {
            const isCurrentLevel = level === membershipStatus.level;
            const tierColorClass = 
              level === 'club' ? 'border-amber-500/30 bg-amber-500/5' :
              level === 'premium' ? 'border-gray-400/30 bg-gray-400/5' :
              level === 'vip' ? 'border-yellow-500/30 bg-yellow-500/5' :
              'border-purple-500/30 bg-purple-500/5';
              
            return (
              <Card 
                key={level} 
                className={`${isCurrentLevel ? 'border-2 border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/20' : `border ${tierColorClass}`} card-hover-effect animate-fade-in-up`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <MembershipBadge level={level} size="lg" showRing={isCurrentLevel} />
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-lg">{tier.name}</div>
                        {isCurrentLevel && (
                          <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full animate-pulse">
                            CURRENT
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400 mb-2">{tier.benefits}</div>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-500">
                          Investment Range: {formatAmount(tier.min_amount)}
                          {tier.max_amount ? ` - ${formatAmount(tier.max_amount)}` : '+'}
                        </div>
                        <div className="text-sm text-gray-500">
                          Max per transaction: {formatAmount(tier.max_per_investment)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {isCurrentLevel && (
                    <div className="text-right">
                      <div className="text-purple-400 font-bold text-lg">YOU ARE HERE</div>
                      <div className="text-sm text-purple-300">Current Level</div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-indigo-900 to-purple-900 text-center p-6">
        <h3 className="text-xl font-bold mb-2">Ready to Grow Your Portfolio?</h3>
        <p className="text-gray-300 mb-4">
          Start investing today and unlock higher membership tiers with better returns.
        </p>
        <div className="flex gap-3">
          <Button
            onClick={() => onNavigate?.('new-investment')}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
          >
            💰 New Investment
          </Button>
          <Button
            onClick={() => onNavigate?.('investments')}
            variant="secondary"
            className="flex-1"
          >
            📊 View Portfolio
          </Button>
        </div>
      </Card>
    </div>
  );
};