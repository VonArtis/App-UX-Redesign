import React from 'react';
import { Card } from './Card';

interface InvestmentStatsCardProps {
  totalInvested: number;
  averageAPY: number;
  totalReturn: number;
  activeInvestments: number;
  membershipLevel: string;
  className?: string;
}

const tierColors = {
  club: "text-amber-400",
  premium: "text-gray-300",
  vip: "text-yellow-400",
  elite: "text-purple-300",
  none: "text-gray-400"
};

export const InvestmentStatsCard: React.FC<InvestmentStatsCardProps> = ({
  totalInvested,
  averageAPY,
  totalReturn,
  activeInvestments,
  membershipLevel,
  className = ""
}) => {
  const accentColor = tierColors[membershipLevel as keyof typeof tierColors] || tierColors.none;
  
  const formatAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  return (
    <Card className={`bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700 ${className}`}>
      <div className="grid grid-cols-2 gap-6">
        {/* Total Invested */}
        <div className="text-center group">
          <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent mb-1 transition-transform duration-300 group-hover:scale-110">
            {formatAmount(totalInvested)}
          </div>
          <div className="text-sm text-gray-400">Total Invested</div>
          <div className="w-full h-1 bg-gray-700 rounded-full mt-2 overflow-hidden">
            <div className="w-full h-full bg-gradient-to-r from-green-400 to-green-600 animate-shimmer"></div>
          </div>
        </div>
        
        {/* Average APY */}
        <div className="text-center group">
          <div className={`text-3xl font-bold ${accentColor} mb-1 transition-transform duration-300 group-hover:scale-110`}>
            {averageAPY.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-400">Average APY</div>
          <div className="w-full h-1 bg-gray-700 rounded-full mt-2 overflow-hidden">
            <div className={`w-full h-full bg-gradient-to-r ${
              membershipLevel === 'club' ? 'from-amber-500 to-amber-600' :
              membershipLevel === 'premium' ? 'from-gray-400 to-gray-500' :
              membershipLevel === 'vip' ? 'from-yellow-500 to-yellow-600' :
              'from-purple-500 to-pink-500'
            } animate-shimmer`}></div>
          </div>
        </div>
        
        {/* Projected Returns */}
        <div className="text-center group">
          <div className="text-2xl font-bold text-blue-400 mb-1 transition-transform duration-300 group-hover:scale-110">
            {formatAmount(totalReturn)}
          </div>
          <div className="text-sm text-gray-400">Projected Returns</div>
        </div>
        
        {/* Active Investments */}
        <div className="text-center group">
          <div className="text-2xl font-bold text-orange-400 mb-1 transition-transform duration-300 group-hover:scale-110">
            {activeInvestments}
          </div>
          <div className="text-sm text-gray-400">Active Plans</div>
        </div>
      </div>
      
      {/* Performance indicator */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-sm text-green-400 font-medium">Performing Well</span>
        </div>
      </div>
    </Card>
  );
};