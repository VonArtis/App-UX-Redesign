// Reusable screen header with back button
import React from 'react';

export interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  showBackButton?: boolean;
  action?: React.ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  onBack,
  showBackButton = true,
  action
}) => {
  return (
    <div className="flex items-center mb-6">
      {showBackButton && onBack && (
        <button 
          onClick={onBack} 
          className="p-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M15 19l-7-7 7-7" 
            />
          </svg>
        </button>
      )}
      <h1 className={`text-xl font-semibold text-center flex-1 ${showBackButton ? 'pr-8' : ''}`}>
        {title}
      </h1>
      {action && (
        <div className="ml-2">
          {action}
        </div>
      )}
    </div>
  );
};