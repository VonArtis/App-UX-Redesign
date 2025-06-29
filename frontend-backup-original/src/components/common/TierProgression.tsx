import React from 'react';
import { MembershipBadge } from './MembershipBadge';

interface TierProgressionProps {
  currentLevel: string;
  totalInvested: number;
  className?: string;
}

const tierThresholds = {
  club: 20000,
  premium: 50000,
  vip: 100000,
  elite: 250000
};

const tierNames = {
  club: "Club",
  premium: "Premium", 
  vip: "VIP",
  elite: "Elite"
};

export const TierProgression: React.FC<TierProgressionProps> = ({ 
  currentLevel, 
  totalInvested, 
  className = "" 
}) => {
  const tiers = ['club', 'premium', 'vip', 'elite'];
  
  const getConnectionProgress = (tierIndex: number): string => {
    const currentTierIndex = tiers.indexOf(currentLevel);
    const tierThreshold = Object.values(tierThresholds)[tierIndex];
    const nextTierThreshold = Object.values(tierThresholds)[tierIndex + 1];
    
    if (currentTierIndex > tierIndex) {
      return "100%"; // Completed tier
    } else if (currentTierIndex === tierIndex && nextTierThreshold) {
      // Current tier - show progress to next
      const progress = Math.min(
        ((totalInvested - tierThreshold) / (nextTierThreshold - tierThreshold)) * 100,
        100
      );
      return `${Math.max(progress, 0)}%`;
    } else {
      return "0%"; // Future tier
    }
  };

  const isCurrentTier = (tier: string) => tier === currentLevel;
  const isCompletedTier = (tier: string) => {
    const currentIndex = tiers.indexOf(currentLevel);
    const tierIndex = tiers.indexOf(tier);
    return currentIndex > tierIndex;
  };

  return (
    <div className={`p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-6 text-center">Membership Progression</h3>
      
      <div className="flex items-center justify-between relative">
        {tiers.map((tier, index) => (
          <div key={tier} className="flex flex-col items-center relative z-10">
            {/* Membership Badge */}
            <MembershipBadge 
              level={tier} 
              size={isCurrentTier(tier) ? "xl" : "lg"}
              showRing={isCurrentTier(tier)}
              className={`transition-all duration-500 ${
                isCurrentTier(tier) 
                  ? "ring-4 ring-purple-500 ring-opacity-50 scale-110" 
                  : isCompletedTier(tier)
                  ? "opacity-100"
                  : "opacity-60"
              }`}
            />
            
            {/* Tier Name */}
            <span className={`text-sm mt-2 font-medium transition-colors duration-300 ${
              isCurrentTier(tier) 
                ? "text-white" 
                : isCompletedTier(tier)
                ? "text-gray-300"
                : "text-gray-500"
            }`}>
              {tierNames[tier as keyof typeof tierNames]}
            </span>
            
            {/* Threshold Amount */}
            <span className="text-xs text-gray-400 mt-1">
              ${tierThresholds[tier as keyof typeof tierThresholds].toLocaleString()}+
            </span>
          </div>
        ))}
        
        {/* Progress Connections */}
        <div className="absolute top-8 left-0 right-0 flex items-center justify-between px-10">
          {tiers.slice(0, -1).map((tier, index) => (
            <div key={`connection-${index}`} className="flex-1 mx-4">
              <div className="w-full h-2 bg-gray-700 rounded-full relative overflow-hidden">
                {/* Base progress bar */}
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-1000 ease-out relative"
                  style={{ width: getConnectionProgress(index) }}
                >
                  {/* Animated shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};