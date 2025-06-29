import React from 'react';
import type { AuthScreenProps } from '../../types';
import { Button } from '../common/Button';
import { MobileLayout } from '../layout/MobileLayout';
import { LanguageSelector } from '../common/LanguageSelector';
import { useLanguage } from '../../hooks/useLanguage';

export const WelcomeScreen: React.FC<AuthScreenProps> = ({ onSignIn, onCreateAccount, onNavigate }) => {
  const { t } = useLanguage();
  
  return (
    <MobileLayout centered maxWidth="xs">
      {/* Language Selector - Prominent position */}
      <div className="absolute top-4 right-4">
        <LanguageSelector variant="compact" />
      </div>
      
      <div className="mb-4">
        <svg className="h-12 w-12 text-purple-500" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <polygon points="10,80 40,20 50,35 60,20 90,80 70,80 50,45 30,80" fill="#9333ea" />
          <circle cx="50" cy="50" r="15" fill="none" stroke="#9333ea" strokeWidth="4" />
        </svg>
      </div>
      <h1 className="text-4xl font-bold mb-2">{t('auth:welcome.title')}</h1>
      <p className="text-center text-sm text-gray-400 mb-8">
        {t('auth:welcome.subtitle')}
      </p>
      <div className="w-full space-y-4">
        <Button onClick={onSignIn} fullWidth>
          {t('auth:welcome.signIn')}
        </Button>
        <Button onClick={onCreateAccount} variant="secondary" fullWidth>
          {t('auth:welcome.createAccount')}
        </Button>
      </div>
      <p className="mt-10 text-xs text-center text-gray-500">
        {t('auth:welcome.termsPrefix')} <br />
        <span 
          className="text-purple-400 cursor-pointer hover:text-purple-300 transition-colors underline"
          onClick={() => onNavigate?.('terms-of-service')}
        >
          {t('auth:welcome.termsOfService')}
        </span>{' '}
        {t('auth:welcome.and')}{' '}
        <span 
          className="text-purple-400 cursor-pointer hover:text-purple-300 transition-colors underline"
          onClick={() => onNavigate?.('privacy-policy')}
        >
          {t('auth:welcome.privacyPolicy')}
        </span>
      </p>
    </MobileLayout>
  );
};