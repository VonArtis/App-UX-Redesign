import React from 'react';

interface MembershipBadgeProps {
  level: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showRing?: boolean;
}

const tierColors = {
  club: {
    gradient: "from-amber-600 to-amber-800",
    accent: "text-amber-400",
    border: "border-amber-500",
    ring: "ring-amber-500"
  },
  premium: {
    gradient: "from-gray-400 to-gray-600",
    accent: "text-gray-300",
    border: "border-gray-400",
    ring: "ring-gray-400"
  },
  vip: {
    gradient: "from-yellow-500 to-yellow-700",
    accent: "text-yellow-400",
    border: "border-yellow-500",
    ring: "ring-yellow-500"
  },
  elite: {
    gradient: "from-purple-600 to-pink-600",
    accent: "text-purple-300",
    border: "border-purple-400",
    ring: "ring-purple-400"
  },
  none: {
    gradient: "from-gray-600 to-gray-800",
    accent: "text-gray-400",
    border: "border-gray-500",
    ring: "ring-gray-500"
  }
};

const tierEmojis = {
  club: "🥉",
  premium: "🥈", 
  vip: "🥇",
  elite: "💎",
  none: "📊"
};

const tierLevels = {
  club: "1",
  premium: "2",
  vip: "3", 
  elite: "4",
  none: "0"
};

const sizeClasses = {
  sm: { container: "w-8 h-8", emoji: "text-lg", level: "w-4 h-4 text-xs" },
  md: { container: "w-12 h-12", emoji: "text-xl", level: "w-5 h-5 text-xs" },
  lg: { container: "w-16 h-16", emoji: "text-2xl", level: "w-6 h-6 text-xs" },
  xl: { container: "w-20 h-20", emoji: "text-3xl", level: "w-7 h-7 text-sm" }
};

export const MembershipBadge: React.FC<MembershipBadgeProps> = ({ 
  level, 
  size = "lg", 
  className = "", 
  showRing = false 
}) => {
  const colors = tierColors[level as keyof typeof tierColors] || tierColors.none;
  const emoji = tierEmojis[level as keyof typeof tierEmojis] || tierEmojis.none;
  const tierLevel = tierLevels[level as keyof typeof tierLevels] || tierLevels.none;
  const sizes = sizeClasses[size];

  return (
    <div className={`relative ${sizes.container} ${className}`}>
      {/* Background ring with pulse animation */}
      <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${colors.gradient} opacity-20 animate-pulse`}></div>
      
      {/* Optional ring indicator */}
      {showRing && (
        <div className={`absolute inset-0 rounded-full ring-4 ${colors.ring} ring-opacity-50 animate-pulse`}></div>
      )}
      
      {/* Main badge */}
      <div className={`relative flex items-center justify-center w-full h-full rounded-full bg-gradient-to-r ${colors.gradient} shadow-lg transform transition-transform duration-300 hover:scale-110`}>
        <span className={`${sizes.emoji} filter drop-shadow-sm`}>
          {emoji}
        </span>
      </div>
      
      {/* Tier level indicator */}
      {level !== "none" && (
        <div className={`absolute -bottom-1 -right-1 ${sizes.level} rounded-full bg-black border-2 ${colors.border} flex items-center justify-center`}>
          <span className={`${sizes.level.includes('text-xs') ? 'text-xs' : 'text-sm'} font-bold text-white`}>
            {tierLevel}
          </span>
        </div>
      )}
    </div>
  );
};