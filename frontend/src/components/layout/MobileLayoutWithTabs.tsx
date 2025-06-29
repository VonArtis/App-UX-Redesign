import React from 'react';
import { BottomTabs } from './BottomTabs';

interface MobileLayoutWithTabsProps {
  children: React.ReactNode;
  onNavigate?: (screen: string) => void;
  showTabs?: boolean;
  currentScreen?: string;
  className?: string;
}

export const MobileLayoutWithTabs: React.FC<MobileLayoutWithTabsProps> = ({ 
  children,
  onNavigate,
  showTabs = true,
  currentScreen,
  className = ''
}) => {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Main content area */}
      <div className={`px-6 pb-8 pt-4 space-y-6 ${showTabs ? 'pb-20' : 'pb-8'} ${className}`}>
        {children}
      </div>
      
      {/* Bottom tabs navigation */}
      {showTabs && (
        <BottomTabs onNavigate={onNavigate} currentScreen={currentScreen} />
      )}
    </div>
  );
};