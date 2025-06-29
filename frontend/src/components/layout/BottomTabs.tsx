import React from 'react';

interface BottomTabsProps {
  onNavigate?: (screen: string) => void;
  currentScreen?: string;
}

export const BottomTabs: React.FC<BottomTabsProps> = ({ onNavigate, currentScreen }) => {
  const tabs = [
    {
      id: 'home',
      icon: '🏠',
      label: 'Home',
      screen: 'dashboard'
    },
    {
      id: 'portfolio',
      icon: '💼',
      label: 'Portfolio',
      screen: 'investments'
    },
    {
      id: 'wallets',
      icon: '🔗',
      label: 'Wallets',
      screen: 'crypto'
    },
    {
      id: 'profile',
      icon: '👤',
      label: 'Profile',
      screen: 'profile'
    }
  ];

  const handleTabPress = (tab: typeof tabs[0]) => {
    if (onNavigate) {
      onNavigate(tab.screen);
    }
  };

  const isActiveTab = (tab: typeof tabs[0]) => {
    return currentScreen === tab.screen || 
           (tab.screen === 'dashboard' && currentScreen === 'dashboard');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const isActive = isActiveTab(tab);
          return (
            <button
              key={tab.id}
              onClick={() => handleTabPress(tab)}
              className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-all duration-200 ${
                isActive
                  ? 'text-purple-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <div className={`text-2xl mb-1 transition-transform duration-200 ${
                isActive ? 'scale-110' : 'scale-100'
              }`}>
                {tab.icon}
              </div>
              <div className={`text-xs font-medium transition-all duration-200 ${
                isActive ? 'text-purple-400' : 'text-gray-500'
              }`}>
                {tab.label}
              </div>
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-purple-400 rounded-b-full"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};