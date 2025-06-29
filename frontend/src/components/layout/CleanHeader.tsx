import React from 'react';

interface CleanHeaderProps {
  title: string;
  onBack?: () => void;
  showBackButton?: boolean;
  action?: React.ReactNode;
  className?: string;
}

export const CleanHeader: React.FC<CleanHeaderProps> = ({
  title,
  onBack,
  showBackButton = true,
  action,
  className = ''
}) => {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      // Prevent app exit - navigate within app instead
      window.history.back();
    }
  };

  return (
    <div className={`flex items-center justify-between mb-6 ${className}`}>
      <div className="flex items-center">
        {showBackButton && (
          <button 
            onClick={handleBack}
            className="p-2 -ml-2 text-white hover:bg-gray-800 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Go back"
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
        <h1 className={`text-xl font-semibold text-white ${showBackButton ? 'ml-2' : ''}`}>
          {title}
        </h1>
      </div>
      
      {action && (
        <div className="ml-4">
          {action}
        </div>
      )}
    </div>
  );
};