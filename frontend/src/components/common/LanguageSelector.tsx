import React, { useState } from 'react';
import { useLanguage } from '../../hooks/useLanguage';

interface LanguageSelectorProps {
  variant?: 'default' | 'compact' | 'icon-only';
  className?: string;
  showLabel?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  variant = 'default', 
  className = '',
  showLabel = true 
}) => {
  const { currentLanguage, availableLanguages, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = async (languageCode: string) => {
    const success = await changeLanguage(languageCode);
    setIsOpen(false);
    
    if (success) {
      // Optional: Show success message
      console.log('Language changed successfully to:', languageCode);
    } else {
      console.error('Failed to change language');
    }
  };

  // Icon-only variant - just globe with current flag
  if (variant === 'icon-only') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
          title={`Current language: ${currentLanguage.name}`}
        >
          <span className="text-lg">🌍</span>
          <span className="text-sm">{currentLanguage.flag}</span>
        </button>

        {isOpen && (
          <div className="absolute top-full mt-1 right-0 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50 min-w-[200px]">
            {availableLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full text-left px-3 py-2 hover:bg-gray-800 transition-colors first:rounded-t-lg last:rounded-b-lg flex items-center space-x-2 ${
                  currentLanguage.code === lang.code ? 'bg-purple-600/20 text-purple-300' : 'text-white'
                }`}
              >
                <span>{lang.flag}</span>
                <span className="text-sm">{lang.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Compact variant - smaller dropdown
  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`}>
        <select
          value={currentLanguage.code}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="bg-gray-800/50 border border-gray-600 rounded-lg text-white text-sm px-2 py-1 focus:border-purple-400 focus:outline-none appearance-none pr-6 cursor-pointer"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundPosition: 'right 0.5rem center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1rem'
          }}
        >
          {availableLanguages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Default variant - full dropdown with label
  return (
    <div className={`space-y-1 ${className}`}>
      {showLabel && (
        <label className="block text-sm font-medium text-gray-400">
          🌍 Language
        </label>
      )}
      <select
        value={currentLanguage.code}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="w-full p-3 bg-gray-900 border border-purple-500/50 rounded-lg text-white focus:border-purple-400 focus:outline-none"
      >
        {availableLanguages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};