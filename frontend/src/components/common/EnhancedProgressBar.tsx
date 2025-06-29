import React from 'react';

interface EnhancedProgressBarProps {
  progress: number; // 0-100
  level: string;
  label?: string;
  className?: string;
  animated?: boolean;
}

const tierColors = {
  club: "from-amber-500 to-amber-600",
  premium: "from-gray-400 to-gray-500",
  vip: "from-yellow-500 to-yellow-600", 
  elite: "from-purple-500 to-pink-500",
  none: "from-gray-500 to-gray-600"
};

export const EnhancedProgressBar: React.FC<EnhancedProgressBarProps> = ({
  progress,
  level,
  label,
  className = "",
  animated = true
}) => {
  const gradient = tierColors[level as keyof typeof tierColors] || tierColors.none;
  
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>{label}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      )}
      
      <div className="relative w-full bg-gray-800 rounded-full h-4 overflow-hidden">
        {/* Background glow */}
        <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-10 rounded-full`}></div>
        
        {/* Progress bar */}
        <div 
          className={`h-full bg-gradient-to-r ${gradient} transition-all duration-1000 ease-out relative overflow-hidden rounded-full`}
          style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
        >
          {/* Shimmer effect */}
          {animated && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
          )}
          
          {/* Pulse effect for active progress */}
          {animated && progress > 0 && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10 animate-pulse"></div>
          )}
        </div>
        
        {/* Progress indicator dot */}
        {progress > 5 && (
          <div 
            className="absolute top-1/2 transform -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-lg"
            style={{ left: `calc(${Math.min(progress, 95)}% - 4px)` }}
          ></div>
        )}
      </div>
    </div>
  );
};